const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');


let lastEarthquakeData = null;
const dataStoragePath = path.join(__dirname, 'lastEarthquake.json');


async function loadSavedEarthquakeData() {
  try {
    const data = await fs.readFile(dataStoragePath, 'utf8');
    lastEarthquakeData = JSON.parse(data);
    console.log('📂 Loaded previous earthquake data');
  } catch (error) {
    console.log('📂 No previous earthquake data found, will create on first fetch');
  }
}


async function saveEarthquakeData(data) {
  try {
    await fs.writeFile(dataStoragePath, JSON.stringify(data, null, 2));
    console.log('💾 Saved latest earthquake data');
  } catch (error) {
    console.error('❌ Error saving earthquake data:', error);
  }
}



function formatEarthquakeMessage(data) {
  const gempa = data.gempa;


  console.log('Earthquake data structure:', JSON.stringify(gempa, null, 2));


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


async function fetchEarthquakeData() {
  try {
    console.log('🔄 Fetching earthquake data from BMKG...');
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml');


    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });

    const result = await parser.parseStringPromise(response.data);


    if (!result.Infogempa || !result.Infogempa.gempa) {
      console.error('❌ Invalid earthquake data structure');
      return null;
    }

    return result.Infogempa;
  } catch (error) {
    console.error('❌ Error fetching earthquake data:', error);
    return null;
  }
}


function isNewEarthquake(data) {
  if (!lastEarthquakeData) return true;


  return (
    data.gempa.DateTime !== lastEarthquakeData.gempa.DateTime ||
    data.gempa.Magnitude !== lastEarthquakeData.gempa.Magnitude ||
    data.gempa.Wilayah !== lastEarthquakeData.gempa.Wilayah
  );
}


async function checkEarthquakes(sock, notifyGroups = []) {
  try {
    const earthquakeData = await fetchEarthquakeData();

    if (!earthquakeData) {
      console.log('⚠️ No earthquake data available');
      return;
    }

    console.log('✅ Earthquake data fetched successfully');


    if (isNewEarthquake(earthquakeData)) {
      console.log('🔔 New earthquake detected!');


      const notification = formatEarthquakeMessage(earthquakeData);


      for (const groupId of notifyGroups) {
        try {
          console.log(`📤 Sending earthquake notification to ${groupId}`);


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

          console.log(`✅ Notification sent to ${groupId}`);
        } catch (error) {
          console.error(`❌ Failed to send notification to ${groupId}:`, error);
        }
      }


      lastEarthquakeData = earthquakeData;
      await saveEarthquakeData(earthquakeData);
    } else {
      console.log('ℹ️ No new earthquakes detected');
    }
  } catch (error) {
    console.error('❌ Error in earthquake monitoring system:', error);
  }
}


async function initEarthquakeMonitor(sock, notifyGroups = [], interval = 5) {
  console.log(`🔄 Initializing earthquake monitor to check every ${interval} minutes`);


  await loadSavedEarthquakeData();


  await checkEarthquakes(sock, notifyGroups);


  const intervalMs = interval * 60 * 1000; setInterval(() => checkEarthquakes(sock, notifyGroups), intervalMs);
}

module.exports = {
  initEarthquakeMonitor,
  checkEarthquakes,
  fetchEarthquakeData
};