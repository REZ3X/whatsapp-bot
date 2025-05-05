const mysql = require('mysql2/promise');
const { tmpdir } = require("os");
const path = require("path");

let db = null; // Database connection
let isConnecting = false;
let connectionConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'whatsapp_bot'
};
async function ensureConnection() {
  if (isConnecting) {
    const waitTime = 100;
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;

    while (isConnecting && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    }
  }

  if (!db) {
    isConnecting = true;
    try {
      console.log('🔄 Establishing MySQL connection...');
      db = await mysql.createConnection(connectionConfig);
      if (!global.dbPingInterval) {
        global.dbPingInterval = setInterval(async () => {
          try {
            if (db) await db.query('SELECT 1');
          } catch (error) {
            console.error('❌ Database ping failed, reconnecting...', error.message);
            db = null; // Reset connection so ensureConnection will reconnect
          }
        }, 60000); // Ping every minute
      }

      console.log('✅ MySQL connection established');
    } catch (error) {
      console.error('❌ Failed to connect to MySQL:', error.message);
      db = null;
    } finally {
      isConnecting = false;
    }
  }
  try {
    if (db) await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    db = null;
    return false;
  }
}
async function initializeDatabase() {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Failed to establish database connection');
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id VARCHAR(255) NOT NULL,
        creator_id VARCHAR(255) NOT NULL,
        reminder_text TEXT NOT NULL,
        reminder_time DATETIME NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Reminders table initialized');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}
async function addReminder(chatId, creatorId, reminderText, reminderTime) {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Database connection not available');
    }

    const [result] = await db.execute(
      'INSERT INTO reminders (chat_id, creator_id, reminder_text, reminder_time) VALUES (?, ?, ?, ?)',
      [chatId, creatorId, reminderText, reminderTime]
    );

    return {
      success: true,
      id: result.insertId
    };
  } catch (error) {
    console.error('❌ Error adding reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
async function getPendingReminders() {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Database connection not available');
    }

    const [rows] = await db.execute(
      'SELECT * FROM reminders WHERE is_completed = FALSE AND reminder_time <= NOW()'
    );

    return rows;
  } catch (error) {
    console.error('❌ Error getting pending reminders:', error);
    return [];
  }
}
async function markReminderAsCompleted(id) {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Database connection not available');
    }

    await db.execute(
      'UPDATE reminders SET is_completed = TRUE WHERE id = ?',
      [id]
    );

    return true;
  } catch (error) {
    console.error(`❌ Error marking reminder ${id} as completed:`, error);
    return false;
  }
}
async function listReminders(chatId) {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Database connection not available');
    }

    const [rows] = await db.execute(
      'SELECT * FROM reminders WHERE chat_id = ? AND is_completed = FALSE ORDER BY reminder_time',
      [chatId]
    );

    return rows;
  } catch (error) {
    console.error('❌ Error listing reminders:', error);
    return [];
  }
}
async function deleteReminder(id, chatId, isAdmin = false) {
  try {
    if (!(await ensureConnection())) {
      throw new Error('Database connection not available');
    }

    let query;
    let params;

    if (isAdmin) {
      query = 'DELETE FROM reminders WHERE id = ? AND chat_id = ?';
      params = [id, chatId];
    } else {
      query = 'DELETE FROM reminders WHERE id = ? AND chat_id = ? AND creator_id = ?';
      params = [id, chatId, creatorId];
    }

    const [result] = await db.execute(query, params);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ Error deleting reminder:', error);
    return false;
  }
}
function parseTimeString(timeStr) {
  const now = new Date();
  let reminderTime = new Date(now);
  const minutesPattern = /(\d+)\s*(?:m|min|mins|minutes)/i;
  const hoursPattern = /(\d+)\s*(?:h|hr|hrs|hours)/i;
  const daysPattern = /(\d+)\s*(?:d|day|days)/i;
  const specificTimePattern = /(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?/i;
  const datePattern = /(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/; // DD/MM or DD/MM/YY(YY)
  let minutesMatch = timeStr.match(minutesPattern);
  let hoursMatch = timeStr.match(hoursPattern);
  let daysMatch = timeStr.match(daysPattern);

  if (minutesMatch) {
    reminderTime.setMinutes(reminderTime.getMinutes() + parseInt(minutesMatch[1]));
    return reminderTime;
  }

  if (hoursMatch) {
    reminderTime.setHours(reminderTime.getHours() + parseInt(hoursMatch[1]));
    return reminderTime;
  }

  if (daysMatch) {
    reminderTime.setDate(reminderTime.getDate() + parseInt(daysMatch[1]));
    return reminderTime;
  }
  const timeMatch = timeStr.match(specificTimePattern);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    const ampm = timeMatch[4] ? timeMatch[4].toLowerCase() : null;


    if (ampm === 'pm' && hours < 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }

    reminderTime.setHours(hours, minutes, seconds, 0);
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    return reminderTime;
  }
  const dateMatch = timeStr.match(datePattern);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1; // Months are 0-indexed in JS

    reminderTime.setDate(day);
    reminderTime.setMonth(month);
    if (dateMatch[3]) {
      let year = parseInt(dateMatch[3]);
      if (year < 100) year += 2000; // Convert 2-digit year to 4-digit
      reminderTime.setFullYear(year);
    }
    if (reminderTime < now && !dateMatch[3]) {
      reminderTime.setFullYear(reminderTime.getFullYear() + 1);
    }

    return reminderTime;
  }
  const directDate = new Date(timeStr);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }
  return null;
}
function parseReminderCommand(text) {
  const args = text.substring("/reminder".length).trim();

  if (!args) {
    return {
      success: false,
      error: "Missing arguments"
    };
  }
  const remainingArgs = args;
  const timePatterns = [
    /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?\b/i, // HH:MM or HH:MM:SS format
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/, // DD/MM or DD/MM/YY format
    /\b\d+\s*(?:minute|min|mins|m)\b/i, // X minutes
    /\b\d+\s*(?:hour|hr|hrs|h)\b/i, // X hours
    /\b\d+\s*(?:day|days|d)\b/i // X days
  ];

  let timeStr = null;
  let reminderText = remainingArgs;

  for (const pattern of timePatterns) {
    const match = remainingArgs.match(pattern);
    if (match) {
      timeStr = match[0];
      reminderText = remainingArgs.replace(timeStr, '').trim();
      break;
    }
  }

  if (!timeStr) {
    return {
      success: false,
      error: "No valid time format found"
    };
  }
  const reminderTime = parseTimeString(timeStr);

  if (!reminderTime) {
    return {
      success: false,
      error: "Could not parse time format"
    };
  }
  if (!reminderText) {
    return {
      success: false,
      error: "No reminder text provided"
    };
  }

  return {
    success: true,
    time: reminderTime,
    text: reminderText,
    timeString: timeStr
  };
}
async function checkAndSendReminders(sock) {
  try {
    const pendingReminders = await getPendingReminders();

    for (const reminder of pendingReminders) {
      try {
        if (reminder.chat_id.endsWith('@g.us')) {
          try {
            const groupMetadata = await sock.groupMetadata(reminder.chat_id);
            const mentions = groupMetadata.participants.map(p => p.id);
            const mentionText = mentions.map(jid => `@${jid.split('@')[0]}`).join(' ');
            await sock.sendMessage(
              reminder.chat_id,
              {
                text: `⏰ *GROUP REMINDER* ⏰\n\n${reminder.reminder_text}\n\n${mentionText}\n\n_I-it's not like I wanted to interrupt everyone or anything! The admin asked me to remind you all, so don't blame me, b-baka!_`,
                mentions: mentions
              }
            );

            console.log(`✅ Sent group reminder ${reminder.id} to ${reminder.chat_id} tagging ${mentions.length} members`);
          } catch (groupError) {
            console.error(`❌ Error getting group members for reminder ${reminder.id}:`, groupError);
            await sock.sendMessage(
              reminder.chat_id,
              {
                text: `⏰ *GROUP REMINDER* ⏰\n\n${reminder.reminder_text}\n\n_I-it's not like I set this reminder because I care about your schedule or anything! An admin asked me to remind everyone, so don't blame me!_`
              }
            );
          }
        } else {
          await sock.sendMessage(
            reminder.chat_id,
            {
              text: `⏰ *REMINDER* ⏰\n\n${reminder.reminder_text}\n\n_I-it's not like I set this reminder because I care about your schedule or anything! You asked me to remind you, so don't blame me for interrupting you, b-baka!_`
            }
          );

          console.log(`✅ Sent personal reminder ${reminder.id} to ${reminder.chat_id}`);
        }
        await markReminderAsCompleted(reminder.id);
      } catch (error) {
        console.error(`❌ Error sending reminder ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in reminder checker:', error);
  }
}
function startReminderChecker(sock) {
  if (!global.reminderCheckInterval) {
    global.reminderCheckInterval = setInterval(() => {
      checkAndSendReminders(sock);
    }, 30000); // Check every 30 seconds

    console.log('✅ Reminder checker started');
  }
}

let lastEarthquakeId = null;
let monitorInterval = null;
function initEarthquakeMonitor(sock, notifyGroups, intervalMinutes = 5) {
  console.log(`🌋 Initializing earthquake monitor for ${notifyGroups.length} groups, checking every ${intervalMinutes} minutes`);
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }
  checkForNewEarthquakes(sock, notifyGroups);
  monitorInterval = setInterval(() => {
    checkForNewEarthquakes(sock, notifyGroups);
  }, intervalMinutes * 60 * 1000);

  return true;
}
async function checkForNewEarthquakes(sock, notifyGroups) {
  try {
    console.log('🔍 Checking for new earthquake data...');
    const earthquakeData = await fetchEarthquakeData();

    if (!earthquakeData || !earthquakeData.gempa) {
      console.log('⚠️ No earthquake data available');
      return;
    }
    const currentId = earthquakeData.gempa.DateTime ||
      earthquakeData.gempa.Tanggal + earthquakeData.gempa.Jam ||
      JSON.stringify(earthquakeData.gempa);
    if (lastEarthquakeId !== currentId) {
      console.log(`🌋 New earthquake detected! Previous ID: ${lastEarthquakeId}, Current ID: ${currentId}`);
      lastEarthquakeId = currentId;
      const magnitude = parseFloat(earthquakeData.gempa.Magnitude || '0');
      if (magnitude >= 5.0) {
        const notification = formatEarthquakeMessage(earthquakeData);
        for (const groupId of notifyGroups) {
          try {
            console.log(`📨 Sending earthquake alert to group ${groupId}`);

            if (notification.imageUrl) {
              await sock.sendMessage(groupId, {
                image: { url: notification.imageUrl },
                caption: notification.text
              });
            } else {
              await sock.sendMessage(groupId, {
                text: notification.text
              });
            }
          } catch (error) {
            console.error(`❌ Failed to send earthquake alert to ${groupId}:`, error);
          }
        }
      } else {
        console.log(`ℹ️ Earthquake detected but magnitude ${magnitude} is below threshold for notification`);
      }
    } else {
      console.log('ℹ️ No new earthquakes detected');
    }
  } catch (error) {
    console.error('❌ Error checking for earthquakes:', error);
  }
}
async function fetchEarthquakeData() {
  try {
    console.log('🔄 Fetching earthquake data from BMKG...');
    const fetch = require('node-fetch');
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');

    if (!response.ok) {
      throw new Error(`Failed to fetch earthquake data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched earthquake data');
    return data;
  } catch (error) {
    console.error('❌ Error fetching earthquake data:', error);
    return null;
  }
}
function formatEarthquakeMessage(data) {
  const gempa = data.gempa;

  let lat, lon;

  if (gempa.Lintang) {
    let latValue = parseFloat(gempa.Lintang.replace(/[^0-9.]/g, ''));
    if (gempa.Lintang.includes('LS') || gempa.Lintang.includes('S')) {
      latValue = -latValue;
    }
    lat = latValue;
  }

  if (gempa.Bujur) {
    let lonValue = parseFloat(gempa.Bujur.replace(/[^0-9.]/g, ''));
    if (gempa.Bujur.includes('BB') || gempa.Bujur.includes('W')) {
      lonValue = -lonValue;
    }
    lon = lonValue;
  }

  const mapsLink = `https://www.google.com/maps?q=${lat || 0},${lon || 0}`;
  const dateTime = `${gempa.Tanggal || 'Unknown Date'} ${gempa.Jam || 'Unknown Time'}`;
  const shakemapUrl = gempa.Shakemap
    ? `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`
    : null;

  let message = `*⚠️ EARTHQUAKE ALERT ⚠️*\n\n`;
  message += `📆 *Date & Time:* ${dateTime}\n`;
  message += `📏 *Magnitude:* ${gempa.Magnitude || 'Unknown'}\n`;
  message += `🌊 *Depth:* ${gempa.Kedalaman || 'Unknown'}\n`;
  message += `📍 *Location:* ${gempa.Wilayah || 'Unknown'}\n`;
  message += `🧭 *Coordinates:* ${gempa.Lintang || 'Unknown'}, ${gempa.Bujur || 'Unknown'}\n`;

  if (gempa.Potensi) {
    message += `⚠️ *Potential:* ${gempa.Potensi}\n`;
  }

  if (gempa.Dirasakan && gempa.Dirasakan.trim() !== '') {
    message += `👤 *Felt at:* ${gempa.Dirasakan}\n`;
  }

  message += `\n🗺️ *View on Maps:* ${mapsLink}\n`;
  message += `\n_Data source: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)_`;

  if (shakemapUrl) {
    message += `\n_Shakemap: ${shakemapUrl}_`;
  }

  return {
    text: message,
    imageUrl: shakemapUrl,
  };
}

module.exports = {
  initializeDatabase,
  addReminder,
  listReminders,
  deleteReminder,
  parseReminderCommand,
  startReminderChecker,
  initEarthquakeMonitor,
  fetchEarthquakeData,
  formatEarthquakeMessage
};