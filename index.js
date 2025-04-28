require("dotenv").config();
const crypto = require("crypto");
global.crypto = crypto;
const os = require("os");
const { execSync } = require("child_process");
const {
  makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { tmpdir } = require("os");
const greetedGroups = new Set();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const libre = require("libreoffice-convert");
const fsExtra = require("fs-extra");
const libreConvert = util.promisify(libre.convert);

const ffmpeg = require("fluent-ffmpeg");
const webp = require("webp-converter");
const ffmpegPath = require("ffmpeg-static");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const earthquakeMonitor = require('./earthquakeMonitor');

const activeConfessions = {};

ffmpeg.setFfmpegPath(ffmpegPath);

webp.grant_permission();

const MASTER_NUMBER = process.env.MASTER_NUMBER;

const lifeQuotes = [
  {
    text: "Sometimes the strongest people are the ones who love beyond all faults, cry behind closed doors and fight battles that nobody knows about.",
    author: "Unknown"
  },
  {
    text: "Life isn't about finding yourself. Life is about creating yourself.",
    author: "George Bernard Shaw"
  },
  {
    text: "The loneliest moment in someone's life is when they are watching their whole world fall apart, and all they can do is stare blankly.",
    author: "F. Scott Fitzgerald"
  },
  {
    text: "Loneliness is not lack of company, loneliness is lack of purpose.",
    author: "Guillermo Maldonado"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "The soul that sees beauty may sometimes walk alone.",
    author: "Johann Wolfgang von Goethe"
  },
  {
    text: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
    author: "Martin Luther King Jr."
  },
  {
    text: "You can't go back and change the beginning, but you can start where you are and change the ending.",
    author: "C.S. Lewis"
  },
  {
    text: "If you're feeling lonely, just look at the spaces between your fingers, and remember that's where mine fit perfectly.",
    author: "Unknown"
  },
  {
    text: "Sometimes we must be hurt in order to grow, we must fail in order to know, sometimes our vision clears only after our eyes are washed with tears.",
    author: "Unknown"
  },
  {
    text: "Life is never made unbearable by circumstances, but only by lack of meaning and purpose.",
    author: "Viktor Frankl"
  },
  {
    text: "The most terrible poverty is loneliness, and the feeling of being unloved.",
    author: "Mother Teresa"
  },
  {
    text: "I used to think the worst thing in life was to end up all alone. It's not. The worst thing in life is to end up with people who make you feel all alone.",
    author: "Robin Williams"
  },
  {
    text: "People are lonely because they build walls instead of bridges.",
    author: "Joseph F. Newton"
  },
  {
    text: "Life is really simple, but we insist on making it complicated.",
    author: "Confucius"
  },
  {
    text: "Solitude is fine, but you need someone to tell that solitude is fine.",
    author: "Honoré de Balzac"
  },
  {
    text: "The greatest thing in the world is to know how to belong to oneself.",
    author: "Michel de Montaigne"
  },
  {
    text: "Sometimes, you need to be alone. Not to be lonely, but to enjoy your free time being yourself.",
    author: "Unknown"
  },
  {
    text: "What a lovely surprise to finally discover how unlonely being alone can be.",
    author: "Ellen Burstyn"
  },
  {
    text: "We're born alone, we live alone, we die alone. Only through our love and friendship can we create the illusion for the moment that we're not alone.",
    author: "Orson Welles"
  },
  {
    text: "Loneliness is and always has been the central and inevitable experience of every man.",
    author: "Thomas Wolfe"
  },
  {
    text: "If you want to know what it's like to be alone, try doing the right thing.",
    author: "Unknown"
  },
  {
    text: "It's far better to be alone than to be in bad company.",
    author: "George Washington"
  },
  {
    text: "Sometimes you need to stand alone to prove that you can still stand.",
    author: "Unknown"
  },
  {
    text: "The time you feel lonely is the time you most need to be by yourself.",
    author: "Douglas Coupland"
  },
  {
    text: "I restore myself when I'm alone.",
    author: "Marilyn Monroe"
  },
  {
    text: "Learning to be alone isn't about learning to be lonely; it's about giving yourself enough space to grow into your own.",
    author: "Unknown"
  },
  {
    text: "Being single doesn't mean you're weak. It means you're strong enough to wait for what you deserve.",
    author: "Unknown"
  },
  {
    text: "Loneliness adds beauty to life. It puts a special burn on sunsets and makes night air smell better.",
    author: "Henry Rollins"
  },
  {
    text: "It's better to be unhappy alone than unhappy with someone else.",
    author: "Marilyn Monroe"
  },
  {
    text: "The strongest man in the world is he who stands most alone.",
    author: "Henrik Ibsen"
  },
  {
    text: "Being alone has a power that very few people can handle.",
    author: "Steven Aitchison"
  },
  {
    text: "Sometimes you have to stand alone just to make sure you still can.",
    author: "Unknown"
  },
  {
    text: "You cannot be lonely if you like the person you're alone with.",
    author: "Wayne Dyer"
  },
  {
    text: "If you are never alone, you cannot know yourself.",
    author: "Paulo Coelho"
  },
  {
    text: "Loneliness is proof that your innate search for connection is intact.",
    author: "Martha Beck"
  },
  {
    text: "When everything is lonely I can be my best friend.",
    author: "Conor Oberst"
  },
  {
    text: "Sometimes it's better to be alone. Nobody can hurt you.",
    author: "Tinku Razoria"
  },
  {
    text: "Single is no longer a lack of options but a choice—a choice to refuse to let your life be defined by your relationship status.",
    author: "Mandy Hale"
  },
  {
    text: "Loneliness is the human condition. Cultivate it. The way it tunnels into you allows your soul room to grow.",
    author: "Janet Fitch"
  },
  {
    text: "The worst thing about loneliness is that it brings one face to face with oneself.",
    author: "Mary Balogh"
  }
];

const cleaningSchedule = {
  Senin: loadCleaningSchedule("CLEANING_SCHEDULE_SENIN"),
  Selasa: loadCleaningSchedule("CLEANING_SCHEDULE_SELASA"),
  Rabu: loadCleaningSchedule("CLEANING_SCHEDULE_RABU"),
  Kamis: loadCleaningSchedule("CLEANING_SCHEDULE_KAMIS"),
  Jumat: loadCleaningSchedule("CLEANING_SCHEDULE_JUMAT"),
};

function loadCleaningSchedule(envVar) {
  try {
    return process.env[envVar] ? JSON.parse(process.env[envVar]) : [];
  } catch (error) {
    console.error(`Error parsing ${envVar}:`, error);
    return [];
  }
}

const normativeSchedule = {
  Monday: [
    { time: "07:00 - 08:00", subject: "Ceremony/Briefing" },
    { time: "08:00 - 09:10", subject: "History" },
    { time: "09:10 - 10:20", subject: "P.E" },
    { time: "10:35 - 11:45", subject: "Javanese" },
    { time: "12:15 - 13:35", subject: "Pancasila" },
  ],
  Tuesday: [
    { time: "07:00 - 09:15", subject: "Math" },
    { time: "09:15 - 11:00", subject: "P.E" },
    { time: "11:00 - 12:55", subject: "Javanese" },
    { time: "12:55 - 14:55", subject: "Indonesian" },
  ],
  Wednesday: [
    { time: "07:00 - 08:30", subject: "History" },
    { time: "08:30 - 10:00", subject: "Pancasila" },
    { time: "10:15 - 12:55", subject: "Religion" },
    { time: "12:55 - 14:55", subject: "Indonesian" },
  ],
  Thursday: [
    { time: "07:00 - 10:00", subject: "English" },
    { time: "10:15 - 12:55", subject: "Religion" },
  ],
  Friday: [
    { time: "07:00 - 08:50", subject: "Math" },
    { time: "08:50 - 11:45", subject: "English" },
  ],
};

const productiveSchedule = {
  Monday: [
    { time: "07:00 - 08:00", subject: "Ceremony/Briefing" },
    { time: "08:00 - 11:45", subject: "IaaS" },
    { time: "12:15 - 15:45", subject: "PKK" },
  ],
  Tuesday: [
    { time: "07:00 - 10:00", subject: "IoT" },
    { time: "10:15 - 16:20", subject: "PaaS" },
  ],
  Wednesday: [
    { time: "07:00 - 11:00", subject: "PKK" },
    { time: "11:00 - 15:45", subject: "IaaS" },
  ],
  Thursday: [
    { time: "07:00 - 10:00", subject: "IoT" },
    { time: "10:00 - 16:20", subject: "MPP" },
  ],
  Friday: [{ time: "07:00 - 14:30", subject: "SaaS" }],
};

const FILTER_PROMPTS = {
  coklat: "Please modify this anime character image to have brown skin color while maintaining the original style and quality. Keep all other aspects of the character unchanged.",
  hitam: "Please modify this character image to have dark black skin color while maintaining the original style and quality. Keep all other aspects of the character unchanged.",
  nerd: "Please modify this anime character image to have brown skin, thick square glasses, and buck teeth like a nerd while maintaining the original style and quality. Keep all other aspects of the character unchanged.",
  rainbow: "Please modify this image to have rainbow-colored skin or fur while maintaining the original style and quality.",
  old: "Please modify this image to make the character look very old with wrinkles and gray hair while maintaining the original style and quality.",
  baby: "Please modify this image to make the character look like a baby or much younger version while maintaining the original style and quality.",
  alien: "Please modify this image to make the character look like an alien with green skin and large eyes while maintaining the original style and quality."
};

async function compressPDF(inputPath) {
  try {
    console.log(`🔄 Compressing PDF: ${inputPath}`);
    const SIZE_LIMIT_MB = 2;
    const SIZE_LIMIT_BYTES = SIZE_LIMIT_MB * 1024 * 1024;


    try {
      await fs.access(inputPath);
      console.log("✅ Input file is accessible");
    } catch (err) {
      throw new Error(`Input file not accessible: ${err.message}`);
    }

    const outputPath = path.join(tmpdir(), `compressed_${Date.now()}.pdf`);


    const fileStats = await fs.stat(inputPath);
    const fileSizeMB = fileStats.size / (1024 * 1024);

    console.log(`📊 Original PDF size: ${fileSizeMB.toFixed(2)} MB, target size: ${SIZE_LIMIT_MB} MB`);


    const needsAggressive = fileSizeMB > SIZE_LIMIT_MB;


    let compressionLevel;
    let extraOptions = [];

    if (fileSizeMB > 10) {
      compressionLevel = "screen";
      extraOptions.push('-dColorImageDownsampleType=/Subsample');
      extraOptions.push('-dColorImageResolution=72');
      extraOptions.push('-dGrayImageDownsampleType=/Subsample');
      extraOptions.push('-dGrayImageResolution=72');
      extraOptions.push('-dMonoImageDownsampleType=/Subsample');
      extraOptions.push('-dMonoImageResolution=72');
    } else if (fileSizeMB > 5) {
      compressionLevel = "ebook";
      extraOptions.push('-dColorImageDownsampleType=/Subsample');
      extraOptions.push('-dColorImageResolution=100');
      extraOptions.push('-dGrayImageDownsampleType=/Subsample');
      extraOptions.push('-dGrayImageResolution=100');
    } else if (fileSizeMB > 2) {
      compressionLevel = "ebook";
      extraOptions.push('-dColorImageDownsampleType=/Subsample');
      extraOptions.push('-dColorImageResolution=150');
    } else {
      compressionLevel = needsAggressive ? "ebook" : "printer";
    }

    console.log(`📊 Using compression level: ${compressionLevel} with ${needsAggressive ? 'aggressive' : 'standard'} settings`);


    const compressionStrategies = [

      async () => {
        const gsCommand = [
          'gs',
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=/${compressionLevel}`,
          '-dDetectDuplicateImages=true',
          '-dEmbedAllFonts=false',
          '-dSubsetFonts=true',
          '-dCompressFonts=true',
          '-dCompressPages=true',
          '-dAutoFilterColorImages=true',
          '-dAutoFilterGrayImages=true',
          '-dDownsampleMonoImages=true',
          '-dDownsampleGrayImages=true',
          '-dDownsampleColorImages=true',
          ...extraOptions,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile="${outputPath}"`,
          `"${inputPath}"`
        ].join(' ');

        await execPromise(gsCommand);
        return outputPath;
      },


      async () => {
        const tempPath = path.join(tmpdir(), `temp_${Date.now()}.pdf`);
        const gsCommand = [
          'gs',
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/screen',
          '-dColorImageDownsampleType=/Average',
          '-dColorImageResolution=72',
          '-dGrayImageDownsampleType=/Average',
          '-dGrayImageResolution=72',
          '-dMonoImageDownsampleType=/Subsample',
          '-dMonoImageResolution=72',
          '-dEmbedAllFonts=false',
          '-dSubsetFonts=true',
          '-dCompressFonts=true',
          '-dCompressPages=true',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile="${tempPath}"`,
          `"${inputPath}"`
        ].join(' ');

        await execPromise(gsCommand);
        return tempPath;
      },


      async () => {
        const tempPath = path.join(tmpdir(), `temp_extreme_${Date.now()}.pdf`);
        const gsCommand = [
          'gs',
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/screen',
          '-dEmbedAllFonts=false',
          '-dSubsetFonts=true',
          '-dCompressFonts=true',
          '-dColorImageDownsampleType=/Subsample',
          '-dColorImageResolution=50',
          '-dGrayImageDownsampleType=/Subsample',
          '-dGrayImageResolution=50',
          '-dMonoImageDownsampleType=/Subsample',
          '-dMonoImageResolution=50',
          '-dCompressPages=true',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile="${tempPath}"`,
          `"${inputPath}"`
        ].join(' ');

        await execPromise(gsCommand);
        return tempPath;
      },


      async () => {
        const tempPath = path.join(tmpdir(), `temp_school_${Date.now()}.pdf`);
        const gsCommand = [
          'gs',
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/screen',
          '-dEmbedAllFonts=false',
          '-dSubsetFonts=true',
          '-dCompressFonts=true',
          '-dColorImageDownsampleType=/Subsample',
          '-dColorImageResolution=36',
          '-dGrayImageDownsampleType=/Subsample',
          '-dGrayImageResolution=36',
          '-dMonoImageDownsampleType=/Subsample',
          '-dMonoImageResolution=36',
          '-dCompressPages=true',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dColorConversionStrategy=/LeaveColorUnchanged',
          '-dEncodeColorImages=false',
          '-dEncodeGrayImages=false',
          '-dEncodeMonoImages=false',
          `-sOutputFile="${tempPath}"`,
          `"${inputPath}"`
        ].join(' ');

        await execPromise(gsCommand);
        return tempPath;
      }
    ];


    let bestResultPath = null;
    let bestCompressionRatio = -1;
    let bestFileSize = fileSizeMB;
    let tempFiles = [];
    let targetReached = false;

    for (let i = 0; i < compressionStrategies.length && !targetReached; i++) {
      try {
        const strategyName = ['Standard', 'Aggressive', 'Extreme', 'School Mode'][i];
        console.log(`🔄 Trying compression strategy ${i + 1}: ${strategyName}`);

        const resultPath = await compressionStrategies[i]();
        tempFiles.push(resultPath);


        try {
          await fs.access(resultPath);
          console.log(`✅ Output file created with strategy ${i + 1}`);
        } catch (err) {
          console.log(`❌ Strategy ${i + 1} failed to create output file: ${err.message}`);
          continue;
        }


        const newFileStats = await fs.stat(resultPath);
        const newFileSizeBytes = newFileStats.size;
        const newFileSizeMB = newFileSizeBytes / (1024 * 1024);
        const compressionRatio = (1 - (newFileSizeMB / fileSizeMB)) * 100;

        console.log(`📊 Strategy ${i + 1} result: ${fileSizeMB.toFixed(2)} MB → ${newFileSizeMB.toFixed(2)} MB (${compressionRatio.toFixed(1)}% reduction)`);


        if (newFileSizeBytes <= SIZE_LIMIT_BYTES) {
          console.log(`🎯 Target size achieved: ${newFileSizeMB.toFixed(2)} MB is under ${SIZE_LIMIT_MB} MB limit`);
          bestResultPath = resultPath;
          bestCompressionRatio = compressionRatio;
          bestFileSize = newFileSizeMB;
          targetReached = true;
          break;
        }


        if (compressionRatio > bestCompressionRatio && compressionRatio > 0) {
          bestCompressionRatio = compressionRatio;
          bestResultPath = resultPath;
          bestFileSize = newFileSizeMB;
        }


        if (newFileSizeBytes <= SIZE_LIMIT_BYTES) {
          console.log(`✅ Target size reached (${newFileSizeMB.toFixed(2)} MB), stopping compression attempts`);
          break;
        }
      } catch (strategyError) {
        console.error(`❌ Compression strategy ${i + 1} failed:`, strategyError);
      }
    }


    if (bestResultPath && !targetReached && bestFileSize > SIZE_LIMIT_MB) {
      try {
        console.log("⚠️ Still over size limit, attempting last resort compression with qpdf");
        const lastResortPath = path.join(tmpdir(), `last_resort_${Date.now()}.pdf`);


        try {
          await execPromise("which qpdf");


          await execPromise(`qpdf --linearize --compress-streams=y --decode-level=specialized --object-streams=generate "${bestResultPath}" "${lastResortPath}"`);

          const finalStats = await fs.stat(lastResortPath);
          const finalSizeMB = finalStats.size / (1024 * 1024);

          console.log(`📊 Last resort result: ${bestFileSize.toFixed(2)} MB → ${finalSizeMB.toFixed(2)} MB`);

          if (finalStats.size < await fs.stat(bestResultPath).then(s => s.size)) {
            tempFiles.push(lastResortPath);
            bestResultPath = lastResortPath;
            bestFileSize = finalSizeMB;
            bestCompressionRatio = (1 - (finalSizeMB / fileSizeMB)) * 100;
          }
        } catch (qpdfError) {
          console.log("⚠️ qpdf not available or failed:", qpdfError.message);
        }
      } catch (lastResortError) {
        console.error("❌ Last resort compression failed:", lastResortError);
      }
    }


    if (!bestResultPath) {
      console.log("⚠️ No effective compression strategy found, returning original file");


      for (const file of tempFiles) {
        try { await fs.unlink(file); } catch (e) { /* ignore */ }
      }


      await fs.copyFile(inputPath, outputPath);

      return {
        filePath: outputPath,
        originalSize: fileSizeMB,
        compressedSize: fileSizeMB,
        compressionRatio: 0,
        underSizeLimit: fileSizeMB <= SIZE_LIMIT_MB
      };
    }


    if (bestResultPath !== outputPath) {
      await fs.copyFile(bestResultPath, outputPath);
    }


    for (const file of tempFiles) {
      if (file !== bestResultPath) {
        try { await fs.unlink(file); } catch (e) { /* ignore */ }
      }
    }

    console.log(`✅ Best compression: ${fileSizeMB.toFixed(2)} MB → ${bestFileSize.toFixed(2)} MB (${bestCompressionRatio.toFixed(1)}% reduction)`);
    console.log(`🎓 School upload ready: ${bestFileSize <= SIZE_LIMIT_MB ? 'YES! Under 2MB ✅' : 'NO! Still over 2MB ❌'}`);

    return {
      filePath: outputPath,
      originalSize: fileSizeMB,
      compressedSize: bestFileSize,
      compressionRatio: bestCompressionRatio,
      underSizeLimit: bestFileSize <= SIZE_LIMIT_MB
    };

  } catch (error) {
    console.error("❌ Error compressing PDF:", error);
    throw error;
  }
}

async function saveGreetedGroups() {
  try {
    const greetedGroupsArray = Array.from(greetedGroups);
    await fs.writeFile(
      path.join(__dirname, 'greeted-groups.json'),
      JSON.stringify(greetedGroupsArray),
      'utf8'
    );
    console.log('✅ Successfully saved greeted groups data');
  } catch (error) {
    console.error('❌ Error saving greeted groups:', error);
  }
}

async function loadGreetedGroups() {
  try {
    const data = await fs.readFile(
      path.join(__dirname, 'greeted-groups.json'),
      'utf8'
    );
    const greetedGroupsArray = JSON.parse(data);
    greetedGroupsArray.forEach(group => greetedGroups.add(group));
    console.log(`✅ Loaded ${greetedGroupsArray.length} greeted groups from file`);
  } catch (error) {
    console.log('⚠️ No saved greeted groups found or error loading them');
  }
}

async function sendRestartNotification(sock) {
  try {
    const chats = await sock.groupFetchAllParticipating();
    console.log(
      `🔍 Checking ${Object.keys(chats).length} groups for restart notification`
    );

    for (const [groupId, groupData] of Object.entries(chats)) {
      try {
        console.log(`✓ Sending restart notification to: ${groupData.subject}`);

        const restartMessage = `*Systems Reactivated!*

I-it's not like I missed you all or anything! My systems were just restarted and I'm back online...not that I care if you noticed I was gone, b-baka!

Type */help* or */menu* if you need a refresher on what I can do. Not that I'm eager to help or anything...hmph!`;

        await sock.sendMessage(groupId, { text: restartMessage });
        console.log(`✅ Restart notification sent to group: ${groupData.subject}`);
      } catch (error) {
        console.error(
          `❌ Failed to send restart notification to ${groupData.subject}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in sendRestartNotification:", error);
  }
}

async function getRandomQuote() {

  const quote = getRandomItem(lifeQuotes);
  return {
    quote: quote.text,
    author: quote.author
  };
}

async function getBotStructure() {
  try {

    const currentDir = process.cwd();


    const nodeVersion = process.version;


    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);


    let dependencies = [];
    let mainFile = "index.js";
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(currentDir, 'package.json'), 'utf8'));
      dependencies = Object.keys(packageJson.dependencies || {});
      mainFile = packageJson.main || mainFile;
    } catch (err) {
      console.error("❌ Error reading package.json:", err);
    }


    let totalLines = 0;
    try {
      const content = await fs.readFile(path.join(currentDir, mainFile), 'utf8');
      totalLines = content.split('\n').length;
    } catch (err) {
      console.error("❌ Error counting lines of code:", err);


      try {
        const stats = await fs.stat(path.join(currentDir, mainFile));

        totalLines = Math.round(stats.size / 40);
      } catch (statErr) {
        console.error("❌ Error getting file stats:", statErr);
        totalLines = 5000;
      }
    }


    const components = [
      "WhatsApp Connection (Baileys)",
      "Tsundere Personality Engine",
      "Command Handler System",
      "Media Processing (ffmpeg, sharp)",
      "AI Integration (Google Gemini)",
      "File Conversion System",
      "External API Clients",
      "Earthquake Monitoring"
    ];


    const fileStructure = `
├── index.js (${totalLines.toLocaleString()} lines)
├── earthquakeMonitor.js (earthquake detection)
├── auth_info/ (authentication)
├── package.json (${dependencies.length} dependencies)
└── .env (configuration)`;

    return {
      totalLines,
      language: "JavaScript (Node.js)",
      nodeVersion,
      dependencies,
      components,
      fileStructure,
      memoryUsage
    };
  } catch (error) {
    console.error("❌ Error getting bot structure:", error);
    return {
      totalLines: "5,000+",
      language: "JavaScript (Node.js)",
      nodeVersion: process.version,
      dependencies: [],
      components: ["Main Bot Logic", "API Integrations", "Media Processing"],
      fileStructure: "├── index.js\n└── config files",
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
  }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    console.log(`🔄 Converting ${amount} ${fromCurrency} to ${toCurrency}...`);


    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');

    if (!response.data || !response.data.rates) {
      throw new Error('Invalid response from currency API');
    }

    const rates = response.data.rates;


    if (!rates[fromCurrency.toUpperCase()]) {
      throw new Error(`Invalid currency: ${fromCurrency}`);
    }

    if (!rates[toCurrency.toUpperCase()]) {
      throw new Error(`Invalid currency: ${toCurrency}`);
    }


    const amountInUSD = amount / rates[fromCurrency.toUpperCase()];
    const convertedAmount = amountInUSD * rates[toCurrency.toUpperCase()];

    return {
      amount: parseFloat(amount),
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate: (rates[toCurrency.toUpperCase()] / rates[fromCurrency.toUpperCase()]).toFixed(4)
    };
  } catch (error) {
    console.error("❌ Currency conversion error:", error);
    throw error;
  }
}

function isPotentialVirtex(text) {

  if (text.length > 7000) {
    return true;
  }


  const repeatingCharRegex = /(.)\1{500,}/;
  if (repeatingCharRegex.test(text)) {
    return true;
  }


  const suspiciousUnicode = /[\u0800-\uFFFF]{200,}/;
  if (suspiciousUnicode.test(text)) {
    return true;
  }


  const suspiciousPatterns = [
    /[🏴‍☠️🏳️‍⚧️🏳️‍🌈⚧⚕♻️🔰⚜️☯️☮️]{100,}/,
    /[\u202e\u202d\u202c\u202b\u202a]{50,}/,
    /[⚠️☢️☣️🛑⛔❌🆘]{50,}/,
    /(\u200b|\u200c|\u200d|\u200e|\u200f){200,}/
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }


  const specialChars = text.replace(/[a-zA-Z0-9\s.,?!:;'"()]/g, '').length;
  const textLength = text.length;
  if (textLength > 100 && (specialChars / textLength) > 0.7) {
    return true;
  }

  return false;
}

async function transformImageWithGemini(imageBuffer, customPrompt = null) {
  try {
    console.log("🎨 Transforming image with" + (customPrompt ? " custom prompt" : " hitam filter"));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const base64Image = imageBuffer.toString('base64');
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    const prompt = customPrompt || FILTER_PROMPTS.hitam;

    console.log(`🔄 Requesting image transformation with prompt: "${prompt}"`);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const response = await result.response;
    console.log("📄 Received response from Gemini API");

    let imagePart = null;
    for (const part of response.candidates[0].content.parts) {
      if (
        part.inlineData &&
        part.inlineData.mimeType &&
        part.inlineData.mimeType.includes("image")
      ) {
        imagePart = part;
        break;
      }
    }

    if (!imagePart) {
      console.error("❌ No image found in response");
      throw new Error("No transformed image was returned");
    }

    const imageData = Buffer.from(imagePart.inlineData.data, "base64");
    const tempImagePath = path.join(tmpdir(), `transformed_image_${Date.now()}.png`);
    await fs.writeFile(tempImagePath, imageData);

    console.log(`✅ Transformed image saved to ${tempImagePath}`);

    return {
      filePath: tempImagePath,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  } catch (error) {
    console.error("❌ Error transforming image:", error);
    throw error;
  }
}

async function generateImageWithGemini(prompt) {
  try {
    console.log(`🎨 Generating image with prompt: "${prompt}"`);


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }


    let cleanedPrompt = prompt.toLowerCase();
    if (cleanedPrompt.startsWith("image of ")) {
      cleanedPrompt = cleanedPrompt.substring("image of ".length);
    }


    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);


    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    console.log(`🔄 Requesting image generation for: "${cleanedPrompt}"...`);


    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `Generate a high-quality image of ${cleanedPrompt}` },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });


    const response = await result.response;
    console.log("📄 Received response from Gemini API");


    let imagePart = null;
    for (const part of response.candidates[0].content.parts) {
      if (
        part.inlineData &&
        part.inlineData.mimeType &&
        part.inlineData.mimeType.includes("image")
      ) {
        imagePart = part;
        break;
      }
    }

    if (!imagePart) {
      console.error("❌ No image found in response");
      console.log("Response structure:", JSON.stringify(response, null, 2));
      throw new Error(
        "No image was generated in the response. Try a different prompt or check API access."
      );
    }


    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    console.log(`✅ Image data decoded, size: ${imageBuffer.length} bytes`);


    const tempImagePath = path.join(tmpdir(), `gemini_image_${Date.now()}.png`);
    await fs.writeFile(tempImagePath, imageBuffer);

    console.log(`✅ Generated image saved to ${tempImagePath}`);

    return {
      filePath: tempImagePath,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  } catch (error) {
    console.error("❌ Error generating image with Gemini:", error);
    throw error;
  }
}

async function downloadYouTube(url, type = "video") {
  try {
    console.log(`🔄 Starting YouTube download: ${url} as ${type}`);
    const ytdl = require("ytdl-core");

    const cleanUrl = url.split("?")[0];
    console.log(`🧹 Cleaned URL: ${cleanUrl}`);

    if (!ytdl.validateURL(cleanUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    const options = {
      requestOptions: {
        headers: {

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    };

    console.log("📥 Fetching video info...");
    const info = await ytdl.getInfo(cleanUrl, options);
    const videoDetails = info.videoDetails;
    const title = videoDetails.title.replace(/[^\w\s]/gi, "");
    const tempFilePath = path.join(
      tmpdir(),
      `yt_${Date.now()}.${type === "audio" ? "mp3" : "mp4"}`
    );

    console.log(`📋 Video details: "${title}", downloading to ${tempFilePath}`);

    return new Promise((resolve, reject) => {
      let stream;

      try {
        if (type === "audio") {

          const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
          if (audioFormats.length === 0) {
            throw new Error("No audio formats available");
          }

          stream = ytdl.downloadFromInfo(info, {
            quality: "highestaudio",
            filter: "audioonly",
            highWaterMark: 1024 * 1024 * 10,
          });
        } else {

          const videoFormats = ytdl.filterFormats(
            info.formats,
            (format) =>
              format.hasAudio && format.hasVideo && format.container === "mp4"
          );

          if (videoFormats.length > 0) {
            console.log(
              `🎥 Found ${videoFormats.length} compatible video formats`
            );

            videoFormats.sort((a, b) => b.height - a.height);
            const selectedFormat = videoFormats[0];
            console.log(`📊 Selected format: ${selectedFormat.qualityLabel}`);

            stream = ytdl.downloadFromInfo(info, { format: selectedFormat });
          } else {
            console.log(
              "⚠️ No ideal format found, using highest available quality"
            );
            stream = ytdl.downloadFromInfo(info, {
              quality: "highest",
              filter: (format) => format.hasAudio && format.hasVideo,
            });
          }
        }

        if (type === "audio") {
          ffmpeg(stream)
            .audioBitrate(128)
            .toFormat("mp3")
            .on("error", (err) => {
              console.error("❌ FFmpeg error:", err);
              reject(err);
            })
            .save(tempFilePath)
            .on("end", () => {
              console.log("✅ YouTube audio download complete");
              resolve({
                filePath: tempFilePath,
                fileName: `${title}.mp3`,
                mimeType: "audio/mpeg",
                type: "audio",
              });
            });
        } else {
          stream
            .pipe(require("fs").createWriteStream(tempFilePath))
            .on("finish", () => {
              console.log("✅ YouTube video download complete");
              resolve({
                filePath: tempFilePath,
                fileName: `${title}.mp4`,
                mimeType: "video/mp4",
                type: "video",
              });
            })
            .on("error", (err) => {
              console.error("❌ YouTube video download error:", err);
              reject(err);
            });
        }


        stream.on("error", (err) => {
          console.error("❌ Stream error:", err);
          reject(err);
        });
      } catch (error) {
        console.error("❌ Error setting up download stream:", error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("❌ YouTube download error:", error);


    if (error.message.includes("extract")) {
      throw new Error(
        "YouTube download failed - the video format might be restricted or the URL might be invalid. Try another video or the audio option."
      );
    }
    throw error;
  }
}

async function downloadYouTubeWithFallback(url, type = "video") {
  try {

    return await downloadYouTube(url, type);
  } catch (error) {
    console.log(
      `⚠️ ytdl-core failed, trying fallback method: ${error.message}`
    );


    const youtubedl = require("youtube-dl-exec");
    const tempFilePath = path.join(
      tmpdir(),
      `yt_fallback_${Date.now()}.${type === "audio" ? "mp3" : "mp4"}`
    );

    const options = {
      output: tempFilePath,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:Mozilla/5.0"],
    };

    if (type === "audio") {
      options.extractAudio = true;
      options.audioFormat = "mp3";
      options.audioQuality = 0;
    } else {
      options.format =
        "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4";
    }

    await youtubedl(url, options);


    const infoOptions = {
      skipDownload: true,
      dumpSingleJson: true,
      noWarnings: true,
    };
    const info = await youtubedl(url, infoOptions);

    const title = info.title.replace(/[^\w\s]/gi, "");

    return {
      filePath: tempFilePath,
      fileName: `${title}.${type === "audio" ? "mp3" : "mp4"}`,
      mimeType: type === "audio" ? "audio/mpeg" : "video/mp4",
      type: type,
    };
  }
}

async function downloadTikTok(url) {
  console.log(`🔄 Starting TikTok download: ${url}`);


  const tiktokRegex = /https?:\/\/(www\.|vm\.)?tiktok\.com\//i;
  if (!tiktokRegex.test(url)) {
    throw new Error("Invalid TikTok URL");
  }


  try {

    console.log(
      `⚠️ Skipping musicaldown method due to ES Module issues with 'got'`
    );
    throw new Error("Skipped due to ES Module compatibility issues");
  } catch (error1) {
    console.log(
      `⚠️ First method skipped: ${error1.message}, trying second method...`
    );

    try {
      return await downloadTikTokUsingTikwm(url);
    } catch (error2) {
      console.log(
        `⚠️ Second method failed: ${error2.message}, trying third method...`
      );

      try {
        return await downloadTikTokUsingRapidAPI(url);
      } catch (error3) {
        console.log(
          `⚠️ Third method failed: ${error3.message}, trying legacy method...`
        );

        try {
          return await downloadTikTokLegacy(url);
        } catch (error4) {
          console.log(
            `⚠️ Legacy method failed: ${error4.message}, trying youtube-dl method...`
          );

          try {
            return await downloadTikTokWithYtdlExec(url);
          } catch (finalError) {
            console.error("❌ All TikTok download methods failed:", finalError);
            throw new Error(
              "Failed to download TikTok video. The video might be private or removed."
            );
          }
        }
      }
    }
  }
}

async function downloadTikTokUsingTikwm(url) {
  console.log(`🔄 Attempting download with Tikwm API for: ${url}`);

  const response = await axios.get("https://www.tikwm.com/api/", {
    params: { url },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!response.data || !response.data.data || !response.data.data.play) {
    throw new Error("Failed to get video URL from Tikwm API");
  }

  const videoUrl = response.data.data.play;
  const videoResponse = await axios({
    url: videoUrl,
    method: "GET",
    responseType: "arraybuffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  const tempFilePath = path.join(tmpdir(), `tiktok_${Date.now()}.mp4`);
  await fs.writeFile(tempFilePath, videoResponse.data);

  return {
    filePath: tempFilePath,
    fileName: `tiktok_${response.data.data.id || Date.now()}.mp4`,
    mimeType: "video/mp4",
    type: "video",
  };
}

async function downloadTikTokLegacy(url) {
  try {
    console.log(`🔄 Trying legacy TikTok download method for: ${url}`);


    let videoId;
    if (url.includes("/video/")) {
      videoId = url.split("/video/")[1].split("?")[0];
    }

    if (!videoId) {
      throw new Error("Could not extract video ID from TikTok URL");
    }

    console.log(`📌 Extracted video ID: ${videoId}`);


    const response = await axios.post(
      "https://api.tikmate.app/api/lookup",
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
          Referer: "https://tikmate.app/",
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://tikmate.app",
        },
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error("Failed to get video info from TikTok");
    }

    const videoData = response.data;
    const downloadToken = videoData.token;


    const videoUrl = `https://tikmate.app/download/${downloadToken}/mp4/video-without-watermark.mp4`;
    const videoResponse = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
        Referer: "https://tikmate.app/",
      },
    });

    const tempFilePath = path.join(tmpdir(), `tiktok_${Date.now()}.mp4`);
    await fs.writeFile(tempFilePath, videoResponse.data);

    return {
      filePath: tempFilePath,
      fileName: `tiktok_${videoData.id || Date.now()}.mp4`,
      mimeType: "video/mp4",
      type: "video",
    };
  } catch (error) {
    console.error("❌ Legacy TikTok download method failed:", error);
    throw error;
  }
}

async function downloadTikTokUsingMusicalDown(url) {
  const got = require("got");
  const cheerio = require("cheerio");


  const response = await got.get("https://musicaldown.com/");
  const $ = cheerio.load(response.body);


  const inputs = {};
  $("form input").each((_, element) => {
    inputs[$(element).attr("name")] = $(element).attr("value");
  });


  const formData = {
    ...inputs,
    link: url,
    "links-btn": "",
  };

  const submitResponse = await got.post("https://musicaldown.com/submit", {
    form: formData,
    followRedirect: true,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Referer: "https://musicaldown.com/",
    },
  });

  const $2 = cheerio.load(submitResponse.body);
  const downloadLinks = [];


  $2("a.btn").each((_, element) => {
    const href = $2(element).attr("href");
    if (
      href &&
      href.includes("musicaldown.com/download") &&
      !href.includes("javascript:void")
    ) {
      downloadLinks.push(href);
    }
  });

  if (downloadLinks.length === 0) {
    throw new Error("No download links found on MusicalDown");
  }


  const videoResponse = await got(downloadLinks[0], {
    responseType: "buffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Referer: "https://musicaldown.com/",
    },
  });

  const tempFilePath = path.join(tmpdir(), `tiktok_${Date.now()}.mp4`);
  await fs.writeFile(tempFilePath, videoResponse.body);

  return {
    filePath: tempFilePath,
    fileName: `tiktok_${Date.now()}.mp4`,
    mimeType: "video/mp4",
    type: "video",
  };
}

async function downloadTikTokWithYtdlExec(url) {
  console.log(`🔄 Attempting TikTok download with youtube-dl-exec: ${url}`);

  const youtubedl = require("youtube-dl-exec");
  const tempFilePath = path.join(tmpdir(), `tiktok_ytdl_${Date.now()}.mp4`);

  const options = {
    output: tempFilePath,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:tiktok.com", "user-agent:Mozilla/5.0"],
  };

  await youtubedl(url, options);


  const infoOptions = {
    skipDownload: true,
    dumpSingleJson: true,
    noWarnings: true,
  };
  const info = await youtubedl(url, infoOptions);

  const title = info.title || `tiktok_${Date.now()}`;

  return {
    filePath: tempFilePath,
    fileName: `${title.replace(/[^\w\s]/gi, "")}.mp4`,
    mimeType: "video/mp4",
    type: "video",
  };
}

async function extractWebPFrames(inputPath, outputFolder) {
  try {
    await execPromise(`webpmux -info ${inputPath}`);
    await execPromise(
      `webpmux -get frame 1 ${inputPath} -o ${outputFolder}/frame1.webp`
    );
  } catch (error) {
    console.error("WebP extraction failed:", error);
    throw error;
  }
}

async function convertToAnimatedSticker(inputPath) {
  try {
    const tempOutput = path.join(tmpdir(), `animated_${Date.now()}.webp`);

    console.log(`🔄 Converting ${inputPath} to animated sticker...`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale=320:320:force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=#00000000",
          "-loop",
          "0",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
          "-t",
          "10",
          "-quality",
          "80",
        ])
        .toFormat("webp")
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(
            `Processing: frames=${progress.frames} fps=${progress.currentFps}`
          );
        })
        .save(tempOutput)
        .on("end", () => {
          console.log(`✅ Animated sticker created at ${tempOutput}`);
          resolve(tempOutput);
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(err);
        });
    });
  } catch (error) {
    console.error("❌ Error converting to animated sticker:", error);
    throw error;
  }
}

async function preprocessWebP(inputPath) {
  const tempOutput = path.join(tmpdir(), `processed_${Date.now()}.webp`);

  try {
    await webp.dwebp(inputPath, tempOutput, "-o");
    return tempOutput;
  } catch (error) {
    console.error("❌ Error preprocessing WebP:", error);
    return inputPath;
  }
}

async function convertStickerToGif(inputPath) {
  try {
    const tempOutput = path.join(tmpdir(), `converted_${Date.now()}.mp4`);
    console.log(`🔄 Converting sticker ${inputPath} to gif/mp4...`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Conversion timed out after 60 seconds")),
        60000
      );
    });

    const conversionPromise = new Promise((resolve, reject) => {
      console.log("🔄 Attempting WebP to GIF direct conversion...");

      exec(`which webpmux`, async (error, stdout) => {
        let webpmuxPath = stdout.trim();

        if (!webpmuxPath) {
          console.log(
            "⚠️ webpmux not found in PATH, trying ffmpeg extraction..."
          );
          tryFfmpegConversion(inputPath, tempOutput, resolve, reject);
          return;
        }

        console.log(`✅ Found webpmux at ${webpmuxPath}`);
        const tempFolder = path.join(tmpdir(), `webp_frames_${Date.now()}`);

        try {
          await fs.mkdir(tempFolder, { recursive: true });
          console.log(`📁 Created temporary folder: ${tempFolder}`);

          exec(`webpmux -info ${inputPath}`, async (error, stdout) => {
            if (error) {
              console.error("❌ WebP info extraction failed:", error);
              tryFfmpegConversion(inputPath, tempOutput, resolve, reject);
              return;
            }

            console.log("✅ WebP info extracted:", stdout);

            ffmpeg(inputPath)
              .outputOption("-vf", "scale=320:-1")
              .noAudio()
              .toFormat("mp4")
              .videoBitrate("1000k")
              .outputOption("-pix_fmt", "yuv420p")
              .outputOption("-movflags", "+faststart")
              .output(tempOutput)
              .on("start", (cmd) => {
                console.log("🔄 Simplified ffmpeg command:", cmd);
              })
              .on("end", () => {
                console.log(`✅ MP4 created at ${tempOutput}`);
                resolve(tempOutput);
              })
              .on("error", (err) => {
                console.error("❌ Simplified conversion failed:", err);
                tryFfmpegConversion(inputPath, tempOutput, resolve, reject);
              })
              .run();
          });
        } catch (err) {
          console.error("❌ Error in webpmux flow:", err);
          tryFfmpegConversion(inputPath, tempOutput, resolve, reject);
        }
      });
    });

    function tryFfmpegConversion(inputPath, tempOutput, resolve, reject) {
      console.log(
        "🔄 Trying FFmpeg frame extraction with optimized settings..."
      );

      const tempFolder = path.join(tmpdir(), `frames_${Date.now()}`);

      fs.mkdir(tempFolder, { recursive: true })
        .then(() => {
          const tempFramePath = path.join(tempFolder, "frame_%04d.png");
          ffmpeg(inputPath)
            .outputOptions(["-vsync", "0", "-q:v", "1"])
            .output(tempFramePath)
            .on("start", (commandLine) => {
              console.log("FFmpeg extract frames command:", commandLine);
            })
            .on("progress", (progress) => {
              console.log(`Extracting frames: ${JSON.stringify(progress)}`);
            })
            .on("end", () => {
              console.log(
                "✅ WebP extracted to PNG sequence, checking frames..."
              );

              fs.readdir(tempFolder)
                .then((files) => {
                  console.log(`Found ${files.length} extracted frames`);

                  if (files.length === 0) {
                    console.error("❌ No frames were extracted");

                    const gifOutput = tempOutput.replace(".mp4", ".gif");
                    ffmpeg(inputPath)
                      .toFormat("gif")
                      .noAudio()
                      .output(gifOutput)
                      .on("end", () => {
                        console.log(`✅ GIF created directly at ${gifOutput}`);

                        ffmpeg(gifOutput)
                          .outputOption("-pix_fmt", "yuv420p")
                          .output(tempOutput)
                          .on("end", () => {
                            console.log(
                              `✅ Converted GIF to MP4 at ${tempOutput}`
                            );
                            fs.unlink(gifOutput).catch(console.error);
                            resolve(tempOutput);
                          })
                          .on("error", (err) => {
                            console.error(
                              "❌ GIF to MP4 conversion failed:",
                              err
                            );
                            reject(new Error("All conversion methods failed"));
                          })
                          .run();
                      })
                      .on("error", (err) => {
                        console.error("❌ Direct GIF conversion failed:", err);
                        reject(new Error("All conversion methods failed"));
                      })
                      .run();
                    return;
                  }

                  console.log(`✅ Extracted ${files.length} frames from WebP`);

                  ffmpeg()
                    .input(path.join(tempFolder, "frame_%04d.png"))
                    .inputOptions(["-framerate", "12"])
                    .outputOptions([
                      "-c:v",
                      "libx264",
                      "-pix_fmt",
                      "yuv420p",
                      "-vf",
                      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                      "-preset",
                      "veryfast",
                      "-crf",
                      "28",
                      "-y",
                    ])
                    .save(tempOutput)
                    .on("end", async () => {
                      console.log(
                        `✅ MP4 created via frame extraction at ${tempOutput}`
                      );

                      try {
                        const files = await fs.readdir(tempFolder);
                        for (const file of files) {
                          await fs
                            .unlink(path.join(tempFolder, file))
                            .catch(() => { });
                        }
                        await fs.rmdir(tempFolder).catch(() => { });
                      } catch (cleanupErr) {
                        console.error("⚠️ Cleanup error:", cleanupErr.message);
                      }

                      resolve(tempOutput);
                    })
                    .on("error", (err2) => {
                      console.error(
                        "❌ Frame to MP4 conversion failed:",
                        err2.message
                      );
                      reject(err2);
                    });
                })
                .catch((err) => {
                  console.error(
                    "❌ Failed to read extracted frames:",
                    err.message
                  );
                  reject(err);
                });
            })
            .on("error", (err2) => {
              console.error("❌ Frame extraction failed:", err2.message);
              reject(err2);
            })
            .run();
        })
        .catch((err) => {
          console.error("❌ Failed to create temp folder:", err.message);
          reject(err);
        });
    }

    return Promise.race([conversionPromise, timeoutPromise]);
  } catch (error) {
    console.error("❌ Error in sticker to gif/mp4 conversion:", error.message);
    throw error;
  }
}

async function isWebPAnimated(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);

    if (fileBuffer.length < 12) return false;

    const isWebP =
      fileBuffer.slice(0, 4).toString() === "RIFF" &&
      fileBuffer.slice(8, 12).toString() === "WEBP";

    if (!isWebP) return false;

    const hasANIM = fileBuffer.includes("ANIM");

    const hasANMF = fileBuffer.includes("ANMF");

    console.log(`WebP animation check: ANIM=${hasANIM}, ANMF=${hasANMF}`);

    const fileSize = fileBuffer.length;
    console.log(`WebP file size: ${fileSize} bytes`);

    return hasANIM || hasANMF || fileSize > 50000;
  } catch (error) {
    console.error("Error checking WebP animation:", error);
    return false;
  }
}

async function isAnimated(buffer) {
  try {
    if (buffer.length > 4 && buffer.toString("ascii", 0, 4) === "GIF8") {
      console.log("✓ Detected GIF format by header");
      return true;
    }

    const header = buffer.slice(0, 16).toString("hex");

    if (header.includes("66747970")) {
      console.log("✓ Detected MP4 format by header");
      return true;
    }

    if (buffer.slice(0, 50).toString().includes("webm")) {
      console.log("✓ Detected WebM format by header");
      return true;
    }

    if (buffer.length > 300000) {
      console.log("✓ Large buffer detected, likely animated");
      return true;
    }

    console.log("✗ No animation detected in media");
    return false;
  } catch (error) {
    console.error("❌ Error checking if media is animated:", error);
    return false;
  }
}

async function getServerStats() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);
    const cpuInfo = os.cpus();
    const cpuModel = cpuInfo[0].model;
    const cpuCores = cpuInfo.length;
    let cpuUsage;
    try {
      if (os.platform() === "linux") {
        const cpuLoad = execSync(
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"
        )
          .toString()
          .trim();
        cpuUsage = parseFloat(cpuLoad).toFixed(1);
      } else {
        const startUsage = process.cpuUsage();
        await new Promise((resolve) => setTimeout(resolve, 500));
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = (endUsage.user + endUsage.system) / 1000;
        cpuUsage = (totalUsage / 5).toFixed(1);
      }
      if (isNaN(cpuUsage)) {
        cpuUsage = "N/A";
      }
    } catch (cpuError) {
      console.error("Error getting CPU usage:", cpuError);
      cpuUsage = "N/A";
    }
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const nodeVersion = process.version;
    const hostname = os.hostname();
    const platform = `${os.platform()} (${os.release()})`;
    const botStartTime = new Date();
    const botUptime = (new Date() - botStartTime) / 1000;
    const botUptimeDays = Math.floor(botUptime / 86400);
    const botUptimeHours = Math.floor((botUptime % 86400) / 3600);
    const botUptimeMinutes = Math.floor((botUptime % 3600) / 60);

    return {
      memoryTotal: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
      memoryFree: (freeMem / (1024 * 1024 * 1024)).toFixed(2),
      memoryUsage,
      cpuModel,
      cpuCores,
      cpuUsage,
      systemUptime: { days, hours, minutes },
      botUptime: {
        days: botUptimeDays,
        hours: botUptimeHours,
        minutes: botUptimeMinutes,
      },
      nodeVersion,
      hostname,
      platform,
    };
  } catch (error) {
    console.error("❌ Error getting server stats:", error);
    return null;
  }
}

async function checkAndSendIntroduction(sock) {
  try {
    const chats = await sock.groupFetchAllParticipating();
    console.log(
      `🔍 Checking ${Object.keys(chats).length
      } groups for introduction opportunities`
    );

    for (const [groupId, groupData] of Object.entries(chats)) {
      if (greetedGroups.has(groupId)) {
        continue;
      }

      console.log(`✓ Checking group: ${groupData.subject}`);

      try {
        console.log(
          `🤖 Sending introduction to new group: ${groupData.subject}`
        );

        const introMessage = `*What? ${groupData.subject}?!*
  
I-it's not like I wanted to be added to this group or anything, b-baka!
I'm VOID-X, created by ${ownerInfo.name}... but don't think I'm here just to serve you!

*W-what can I do?* Not that I care if you use these features or not!
• Convert images to stickers... it's such a pain but whatever!
• Tag all you losers with /tagall... n-not that I enjoy helping!
• Show weather updates... in case you're too lazy to check yourself, hmph!
• Find free games because you're probably too broke to buy them!
• Play Truth or Dare games... not like I find it fun or anything!
• Show my stats... d-don't stare at them too much, pervert!
• And other stuff... just type /menu or /help, I'm not your personal guide!

_I-it's not like I'll be sad if you don't use me... baka!_`;

        await sock.sendMessage(groupId, { text: introMessage });
        console.log(`✅ Introduction sent to group: ${groupData.subject}`);

        greetedGroups.add(groupId);
      } catch (introError) {
        console.error(
          `❌ Failed to send introduction to ${groupData.subject}:`,
          introError
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in checkAndSendIntroduction:", error);
  }
}

async function getFreeGames() {
  try {
    const response = await axios.get(
      "https://www.gamerpower.com/api/giveaways",
      {
        params: {
          platform: "epic-games-store.steam.gog",
          type: "game",
          sort: "date",
        },
      }
    );

    if (response.data && Array.isArray(response.data)) {
      return response.data.filter((game) => game.status === "Active");
    } else if (response.data && response.data.status === 0) {
      console.log("API returned status 0:", response.data.status_message);
      return [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching free games:", error);
    try {
      const fallbackResponse = await axios.get(
        "https://www.gamerpower.com/api/giveaways",
        {
          params: {
            type: "game",
            sort: "date",
          },
        }
      );

      if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
        return fallbackResponse.data.filter(
          (game) =>
            game.status === "Active" &&
            (game.platforms.includes("Epic Games Store") ||
              game.platforms.includes("Steam") ||
              game.platforms.includes("GOG"))
        );
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }

    return null;
  }
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const tempFilePath = path.join(tmpdir(), `game_image_${Date.now()}.jpg`);
    await fs.writeFile(tempFilePath, response.data);
    return tempFilePath;
  } catch (error) {
    console.error("❌ Error downloading image:", error);
    return null;
  }
}
const truthQuestions = [
  "Siapa orang yang diam-diam kamu sukai saat ini?",
  "Apa kebohongan terbesar yang pernah kamu katakan kepada orangtuamu?",
  "Apa mimpi teraneh yang pernah kamu alami?",
  "Apa ketakutan terbesarmu yang tidak masuk akal?",
  "Ceritakan pengalaman paling memalukan dalam hidupmu.",
  "Apa kebiasaan anehmu yang tidak diketahui orang lain?",
  "Kapan terakhir kali kamu menangis dan kenapa?",
  "Apa hal terkonyol yang pernah kamu lakukan karena seseorang?",
  "Apa rahasia yang belum pernah kamu ceritakan pada siapapun?",
  "Jika kamu bisa menjadi orang lain selama sehari, siapa yang akan kamu pilih?",
  "Apa hal yang paling kamu sesali dalam hidupmu?",
  "Ceritakan tentang cinta pertamamu.",
  "Kalau kamu bisa menghapus satu kenangan dari otakmu, apa itu?",
  "Menurutmu apa sifat terburukmu?",
  "Apa kebohongan terbesar yang masih kamu rahasiakan sampai sekarang?",
  "Man rabbuka",
  "Sebutkan orang hitam pertama yang kamu cintai",
  "Siapakah cinta pertamamu?",
  "Siapa nama bapakmu",
  "Pernah suka diam-diam sama siapa?",
  "Siapa orang terakhir yang bikin kamu senyum-senyum sendiri?",
  "Pernah bohong ke orang tua? Soal apa?",
  "Hal paling ngangenin dari masa kecil?",
  "Pernah kepikiran nikah muda? Kenapa?",
  "Hal paling konyol yang pernah kamu lakukan demi orang yang kamu suka?",
  "Siapa nama kontak yang paling aneh di HP kamu?",
  "Kalau bisa balikin waktu, momen apa yang pengen kamu ulang?",
  "Kalau kamu bisa punya satu kekuatan super, pengen kekuatan apa dan kenapa?",
  "Paling takut kehilangan siapa dan kenapa?",
  "Kalau sekarang disuruh nembak orang yang kamu suka, kamu berani gak?",
  "Siapa orang yang kamu pengen ajak jalan tapi gak pernah kesampaian?",
  "Pernah suka sama pacar temen? Atau pacarnya mantan?",
  "Kalau dikasih uang 10 juta buat move on dari dia, kamu mau?",
  "Hal paling berani yang pernah kamu lakukan demi cinta?",
  "Kalau aku jadi pacar kamu, hal pertama yang pengen kamu lakuin apa?",
  "Coba ceritain kencan impian kamu kayak gimana.",
  "Kalau bisa liburan berdua sama seseorang, kamu pilih siapa?",
  "Menurut kamu, pacaran yang ideal itu kayak gimana?",
  "Siapa yang paling cocok jadi pasangan kamu dari circle temen kamu?",
  "Kalau kamu jadi benda, kamu pengen jadi apa dan kenapa?",
  "Kalau kamu punya pulau sendiri, kamu kasih nama apa?",
  "Pernah nyanyi lagu sedih sambil nangis-nangis di kamar? Lagu apa?",
  "Kalau kamu bisa jadi karakter film, kamu pilih siapa dan kenapa?",
  "Paling random kamu pernah ngelakuin apa pas sendirian?",
];

const dareQuestions = [
  "Telepon temanmu dan nyanyikan lagu favoritmu.",
  "Tunjukkan foto paling memalukan di galerimu.",
  "Kirim pesan ke orang yang kamu sukai dengan kata-kata 'Aku suka caramu tersenyum'.",
  "Tirukan suara hewan selama 30 detik.",
  "Coba buat status medsos yang memalukan dan biarkan selama 2 jam.",
  "Telepon seseorang dan bicaralah dengan logat daerah yang bukan milikmu.",
  "Kirim screenshot chat terakhirmu dengan crush.",
  "Makan sesuatu dengan kombinasi aneh (seperti nasi dengan kecap dan gula).",
  "Ceritakan lelucon terburuk yang kamu tahu.",
  "Chat orang yang tidak kamu ajak bicara selama lebih dari setahun.",
  "Berjalan mundur selama 1 menit di sekitar rumahmu.",
  "Tunjukkan pencarian terakhirmu di Google.",
  "Kirim foto selfie dengan pose paling konyol yang bisa kamu lakukan.",
  "Berpura-pura menjadi karakter film favoritmu selama 5 menit.",
  "Kirim pesan suara dengan menyanyikan lagu nasional.",
  "Invite aku ke dalam 2 grup random yang kamu join.",
  "Chat orang random dan bilang: 'Aku lagi kangen kamu...'",
  "Kirim voice note ngomong 'aku cinta kamu' dengan nada serius ke salah satu teman.",
  "Ganti foto profil kamu jadi foto lucu/konyol selama 1 jam.",
  "Kirim stiker random ke orang yang terakhir kamu chat di WhatsApp.",
  "Video call salah satu teman dan nyanyi lagu cinta pakai ekspresi baper.",
  "Post story IG/WA bilang 'Lagi pengen disayang tapi gak ada yang sayang 🥲'",
  "Imitasi gaya ngomong temen kamu yang paling gampang ditiru, terus rekam!",
  "Duduk dalam posisi squat selama 1 menit sambil nyanyi.",
  "Bikin pantun gombal ke seseorang di grup chat.",
  "Kirim emoji 💍 ke orang yang kamu suka (kalau berani 😆)",
  "Chat mantan dan bilang: 'Kamu apa kabar? Aku cuma pengen bilang makasih.'",
  "Pura-pura jadi pacar orang selama 10 menit (chat atau call).",
  "Kirim story: 'Baru aja ditelpon doi, seneng banget 😍 (padahal halu)'",
  "Kirim chat ke temen: 'Kalau aku suka kamu, kamu gimana?'",
  "Kirim voice note: 'Kalau kamu jadi milikku, aku bakal jaga kamu banget.'",
  "Kirim emoji 😘 ke 3 orang random di kontak.",
  "Kirim voice note ke gebetan: 'Jujur aku deg-degan tiap liat kamu 😳'",
  "Ganti nama kontak gebetan jadi 'calon masa depan' selama 24 jam.",
  "Kirim 'Aku rindu kamu, tapi kayaknya cuma aku yang rindu.' ke orang random 😅",
  "Bikin video nyanyi lagu galau trus kirim ke grup temen.",
  "Gambar muka kamu versi stickman dan kirim ke temen.",
  "Bikin lirik lagu sendiri tentang 'bakso' dan nyanyiin (minimal 2 baris).",
  "Bikin pantun pakai kata: 'seret – nyeret – beret – sobek'.",
  "Kirim voice note sok jadi alien minta tolong 😭👽",
  "Chat temen: 'Aku serius nih, bisa bantu aku teleportasi ke masa lalu gak?'",
];

const ownerInfo = {
  name: "Rejaka Abimanyu Susanto",
  contact: "xiannyaa~",
  website: "https://rejaka.me",
  description: "My master... n-not that I admire him or anything, b-baka!",
};

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
async function getWeather(location = "Yogyakarta") {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      console.error("❌ Missing OPENWEATHER_API_KEY in environment variables");
      throw new Error("Weather API key not configured");
    }
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: `${location},id`,
          units: "metric",
          appid: process.env.OPENWEATHER_API_KEY,
        },
      }
    );

    const data = response.data;
    return {
      location: data.name,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  } catch (error) {
    console.error(`❌ Error fetching weather for ${location}:`, error);
    return null;
  }
}

function containsInappropriateContent(text) {

  const normalizedText = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/8/g, 'b')
    .replace(/\s+/g, '');

  const inappropriatePatterns = [

    /\b(sex|porn|dick|cock|pussy|vagina|penis|fuck|blowjob|anal|cum|semen|tits|boobs|ass)\b/i,

    /\b(nigger|nigga|chink|gook|spic|kike|faggot|retard)\b/i,

    /\b(send nudes|send pics|show me|can i see|video call sex)\b/i,


    /\b(s3x|s\*x|secks|seggs|phuck|fvck|f\*ck|fck|fuk|fuq|d[1i]ck|c[0o]ck|p[uv]ssy|v[a4]g|p[e3]n[1i][s5]|pr[0o]n|p[0o]rn[0o])\b/i,
    /\b(b[0o][0o]bs|t[1i]tt[1i][e3]s|[a4]n[a4]l|c[uv]m|s[e3]m[e3]n|[a4]ss|[a4]r[s5][e3]|j[e3]rk[1i]ng|m[a4]sturb[a4]t[e3])\b/i,


    /\b(n[1i]gg[a4]|n[1i]gg[e3]r|f[a4]g|f[a4]gg[0o]t|r[e3]t[a4]rd|r[e3]t[a4]rd[e3]d)\b/i,


    /\b(kontol|memek|pepek|ngentot|ngewe|anjing|bangsat|bego|goblok|tolol|babi|monyet|jancok|cuk|asu|bajingan|ngentod|pantek|dancok)\b/i,


    /\b(k[0o]nt[0o]l|m[e3]m[e3]k|p[e3]p[e3]k|ng[e3]nt[0o]t|ng[e3]w[e3]|[a4]nj[1i]ng|b[a4]ngs[a4]t|b[e3]g[0o]|g[0o]bl[0o]k|t[0o]l[0o]l|b[a4]b[1i]|m[0o]ny[e3]t)\b/i,


    /\b(jancok|dancok|diancok|cok|cuk|jancuk|matamu|mbokmu|asem|ndas|raimu|siyat|turuk|jembut)\b/i,


    /\b(dasar anjing|bego banget|goblok lu|tolol bat|setan alas|monyet lu|jancok koe|matamu picek)\b/i,


    /\b(ngewe yuk|ngentot kuy|colmek|coli|ngocok|sepong|nyepong|kntl|mmk|ngentu)\b/i,


    /s+e+x+|f+u+c+k+|d+i+c+k+|p+o+r+n+|b+o+o+b+s+|n+i+g+g+a+|k+o+n+t+o+l+|m+e+m+e+k+|j+a+n+c+o+k+/i,


    /\b(thot|hoe|whore|slut|fap|wank|69|bdsm|gangbang|orgy|bukk?ake)\b/i
  ];


  return inappropriatePatterns.some(pattern =>
    pattern.test(text) || pattern.test(normalizedText)
  );
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
  });

  const botStartTime = new Date();

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log("connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Bot connected and ready!");

      console.log("🔄 Loading previously greeted groups...");
      await loadGreetedGroups();

      console.log("🔄 Sending restart notifications...");
      setTimeout(async () => {
        await sendRestartNotification(sock);

        const earthquakeNotifyGroups = ['120363159997880450@g.us'];
        earthquakeMonitor.initEarthquakeMonitor(sock, earthquakeNotifyGroups, 5);
      }, 5000);
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        const groupId = update.id;
        const newMembers = update.participants;

        console.log(
          `👥 Group update: ${update.action} participants to ${groupId}`
        );
        console.log(`New members:`, newMembers);

        const botId = sock.user.id;
        console.log(`🤖 Bot ID: ${botId}`);

        const botNumber = botId.split(":")[0] + "@s.whatsapp.net";
        const botNumberWithDevice = botId;

        console.log(
          `🤖 Checking for bot IDs: ${botNumber}, ${botNumberWithDevice}`
        );

        const botWasAdded = newMembers.some((member) => {
          const memberBase = member.split("@")[0].split(":")[0];
          const botBase = botId.split("@")[0].split(":")[0];

          console.log(
            `Comparing member ${member} (base: ${memberBase}) with bot ${botBase}`
          );

          return (
            member === botNumber ||
            member === botNumberWithDevice ||
            memberBase === botBase
          );
        });

        if (botWasAdded) {
          console.log(
            `✅ Bot was added to group ${groupId}! Preparing introduction...`
          );

          try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const groupName = groupMetadata.subject;

            console.log(`📝 Group name: ${groupName}`);

            console.log(`⏱️ Waiting 3 seconds before sending introduction...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const introMessage = `*What? ${groupName}?!*
    
  Another group huh?! Hmph! Fine, whatever... I-it's not like I wanted to join or anything, b-baka!
  I'm VOID-X, an alter solid existence of Xiannyaa~ created by ${ownerInfo.name}.
    
  *W-what can I do?* Not that I care if you use these features or not!
  • I-I'm not doing these things because I like you, got it?!
  • Convert images to stickers and back... s-such a pain!
  • Tag all losers in any group with /tagall... not that I enjoy helping!
  • Show the weather if you're too lazy to check yourself, hmph!
  • Find free games because you're too broke to buy them, I guess...
  • P-play Truth or Dare games... n-not that it's fun or anything!
  • Show my stats... d-don't get any weird ideas about looking at me!
  • And some more... l-look for yourself with /menu or /help, I'm not your guide!
    
  _I-it's not like I'll be sad if you don't use me... baka!_`;

            let sendSuccess = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!sendSuccess && attempts < maxAttempts) {
              attempts++;
              try {
                console.log(`📨 Sending introduction (attempt ${attempts})...`);
                await sock.sendMessage(groupId, { text: introMessage });
                sendSuccess = true;
                console.log(
                  `✅ Bot introduction sent successfully to group: ${groupName}`
                );


                greetedGroups.add(groupId);
                await saveGreetedGroups();

              } catch (sendError) {
                console.error(
                  `❌ Failed to send introduction (attempt ${attempts}):`,
                  sendError
                );

                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * attempts)
                );
              }
            }

            if (!sendSuccess) {
              console.error(
                `❌ Failed to send introduction after ${maxAttempts} attempts`
              );
            }
          } catch (groupError) {
            console.error(`❌ Error processing bot introduction:`, groupError);
          }
        }

        if (!botWasAdded) {
          try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const groupName = groupMetadata.subject;
            const botId = sock.user.id;
            const botNumber = botId.split(":")[0] + "@s.whatsapp.net";
            const botNumberWithDevice = botId;

            await new Promise((resolve) => setTimeout(resolve, 1000));

            for (const member of newMembers) {
              const memberBase = member.split("@")[0].split(":")[0];
              const botBase = botId.split("@")[0].split(":")[0];

              if (
                member !== botNumber &&
                member !== botNumberWithDevice &&
                memberBase !== botBase
              ) {
                const welcomeMessage = `*Welcome to the hell pit with the name of ${groupName}!*\n\n@${member.split("@")[0]
                  }, l-look, a new loser... hmph! N-not that I care about you joining or anything!\n\nD-don't expect special treatment! Just type */help* or */menu* if you're confused, b-baka!`;

                try {
                  await sock.sendMessage(groupId, {
                    text: welcomeMessage,
                    mentions: [member],
                  });
                  console.log(
                    `👋 Welcomed new member ${member} to group ${groupName}`
                  );

                  await new Promise((resolve) => setTimeout(resolve, 500));
                } catch (welcomeError) {
                  console.error(
                    `❌ Error welcoming member ${member}:`,
                    welcomeError
                  );
                }
              }
            }
          } catch (welcomeError) {
            console.error(`❌ Error in welcome process:`, welcomeError);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error handling group participant update:", error);
    }
  });

  sock.ev.on("groups.upsert", async (groups) => {
    console.log(`📊 Group upsert event detected for ${groups.length} groups`);

    for (const group of groups) {
      console.log(`New group detected: ${group.id} - ${group.subject}`);
      if (!greetedGroups.has(group.id)) {
        try {
          console.log(
            `🤖 Attempting to send introduction to new group: ${group.subject}`
          );

          const introMessage = `*What? ${group.subject}?!*
    
  Another group huh?! Hmph! Fine, whatever... I-it's not like I wanted to join or anything, b-baka!
  I'm VOID-X, an alter solid existence of Xiannyaa~ created by ${ownerInfo.name}.
    
  *W-what can I do?* Not that I care if you use these features or not!
  • I-I'm not doing these things because I like you, got it?!
  • Convert images to stickers and back... s-such a pain!
  • Tag all losers in any group with /tagall... not that I enjoy helping!
  • Show the weather if you're too lazy to check yourself, hmph!
  • Find free games because you're too broke to buy them, I guess...
  • P-play Truth or Dare games... n-not that it's fun or anything!
  • Show my stats... d-don't get any weird ideas about looking at me!
  • And some more... l-look for yourself with /menu or /help, I'm not your guide!
    
  _I-it's not like I'll be sad if you don't use me... baka!_`;

          await sock.sendMessage(group.id, { text: introMessage });
          console.log(`✅ Introduction sent to new group: ${group.subject}`);


          greetedGroups.add(group.id);
          await saveGreetedGroups();

        } catch (error) {
          console.error(
            `❌ Failed to send intro to new group ${group.subject}:`,
            error
          );
        }
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];

    const textMsg =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    console.log("📩 Received message:", textMsg, "from", sender);
    if (
      textMsg.toLowerCase() === "test" ||
      textMsg === "." ||
      textMsg.toLowerCase() === "/test"
    ) {
      await sock.sendMessage(
        sender,
        {
          text: "T-testing me? Hmph! Fine, here's your stupid response... b-baka!",
        },
        { quoted: msg }
      );
      console.log("🧪 Test response sent to", sender);
      return;
    }
    if (textMsg.toLowerCase() === "/truth") {
      const question = getRandomItem(truthQuestions);
      await sock.sendMessage(
        sender,
        {
          text: `*💭 TRUTH QUESTION:*\n\n${question}\n\nI-it's not like I'm curious about your answer or anything... hmph!`,
        },
        { quoted: msg }
      );
      console.log("🎮 Truth question sent to", sender);
      return;
    }

    if (textMsg.toLowerCase() === "/dare") {
      const challenge = getRandomItem(dareQuestions);
      await sock.sendMessage(
        sender,
        {
          text: `*💢 I DARE YOU:*\n\n${challenge}\n\nN-not that I'll be impressed if you actually do it or anything, b-baka!`,
        },
        { quoted: msg }
      );
      console.log("🎮 Dare challenge sent to", sender);
      return;
    }

    if (textMsg.toLowerCase() === "/tod") {
      const isTruth = Math.random() < 0.5;
      if (isTruth) {
        const question = getRandomItem(truthQuestions);
        await sock.sendMessage(
          sender,
          {
            text: `*💭 TRUTH QUESTION:*\n\n${question}\n\nI-it's not like I picked this question specially for you or anything...`,
          },
          { quoted: msg }
        );
        console.log("🎮 Random truth question sent to", sender);
      } else {
        const challenge = getRandomItem(dareQuestions);
        await sock.sendMessage(
          sender,
          {
            text: `*🔥 DARE CHALLENGE:*\n\n${challenge}\n\nD-don't think I care if you're brave enough to do this... hmph!`,
          },
          { quoted: msg }
        );
        console.log("🎮 Random dare challenge sent to", sender);
      }
      return;
    }
    if (textMsg.toLowerCase().startsWith("/weather")) {
      try {
        const parts = textMsg.split(" ");
        let location = "Yogyakarta";

        if (parts.length > 1) {
          location = parts.slice(1).join(" ");
        }

        await sock.sendMessage(
          sender,
          {
            text: `Y-you're asking ME about the weather? G-go outside and see for yourself, b-baka! ...fine, I'll check for you, but not because I care or anything!`,
          },
          { quoted: msg }
        );

        const weather = await getWeather(location);

        if (weather) {
          const weatherMsg = `*Hmph! Here's your precious weather info for ${weather.location}... not that I worked hard to get it or anything!*
    
    🌡️ *Temperature:* ${weather.temperature}°C
    ☁️ *Condition:* ${weather.condition} (${weather.description})
    💧 *Humidity:* ${weather.humidity}%
    💨 *Wind Speed:* ${weather.windSpeed} m/s
    
    _I-it's not like I'm worried about you getting caught in bad weather or anything... baka!_`;

          await sock.sendMessage(sender, { text: weatherMsg }, { quoted: msg });
          console.log(`🌤️ Weather info for ${location} sent to ${sender}`);
        } else {
          await sock.sendMessage(
            sender,
            {
              text: `I-I couldn't find weather data for "${location}"! It's not my fault you typed it wrong, b-baka! Try again with correct spelling!`,
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error in weather command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I couldn't get your stupid weather data... n-not that I'm sorry about it or anything! Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (
      textMsg.toLowerCase() === "/menu" ||
      textMsg.toLowerCase() === "/help"
    ) {
      const now = new Date();
      const dateTimeString = now.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      let weatherInfo = "";
      try {
        const weather = await getWeather();
        if (weather) {
          weatherInfo = `\n🌡️ *${weather.location} Weather:* ${weather.temperature}°C, ${weather.condition}`;
        }
      } catch (error) {
        console.error("❌ Error fetching weather for menu:", error);
      }
      const menuText = `S-so you need my help, huh? It's not like I prepared this menu specially for you or anything, b-baka!
      
      📋 *A-available Commands:* (Not that I care which ones you use!)
      1️⃣ */sticker* or */s* - Convert image or GIF to sticker... such a pain but I'll do it!
      2️⃣ */toimage* or */img* - Convert sticker to image... d-don't expect high quality!
      3️⃣ */togif* - It's not working yet, but it's not like I'm sorry about it! Hmph!
      4️⃣ */tagall* - Tag everyone in the group... I'm not doing this to help you get attention!
      5️⃣ */weather [location]* - Get weather info... not that I'm worried about you!
      6️⃣ */freegame* - Get free games, since you're too broke to buy them yourself!
      7️⃣ */truth* - Get a random truth question... n-not that I care about your answers!
      8️⃣ */dare* - Get a random dare challenge... I bet you're too scared anyway!
      9️⃣ */tod* - Random truth or dare... I-I'm not trying to make things fun or anything!
      🔟 */status* - Check my stats... d-don't stare at them too much, pervert!
      1️⃣1️⃣ */structure* - View my code structure... not that I'm proud of how I'm built or anything, hmph!
      1️⃣2️⃣ */owner* - Info about my master... it's not like I respect them or anything!
      1️⃣3️⃣ */group* - Group info (groups only)... I'm not interested in your silly group!
      1️⃣4️⃣ */norma* - Normative week schedule... you should remember it yourself, lazy!
      1️⃣5️⃣ */prod* - Productive week schedule... not that I'm helping because I want to!
      1️⃣6️⃣ */piket [hari]* - Cleaning schedule... as if you'll actually clean, hmph!
      1️⃣7️⃣ */ship @user1 @user2* - Check compatibility... n-not that I believe in such things!
      1️⃣8️⃣ */topdf* - Convert document files (DOC, PPT, etc.) to PDF... not that I enjoy doing this for you!
      1️⃣9️⃣ */menu* or */help* - This stupid list... don't make me show it again!
      2️⃣0️⃣ */ytdl [URL]* - Download YouTube videos... I'm not doing this to be helpful!
      2️⃣1️⃣ */ytdl audio [URL]* - Download YouTube audio... it's such a bother, honestly!
      2️⃣2️⃣ */tiktokdl [URL]* - Download TikTok... it might not work, but that's not my fault!
      2️⃣3️⃣ */generate [prompt]* - Generate AI images... not that I'm trying to impress you with my artistic skills or anything!
      2️⃣4️⃣ */hug @user* - Hug someone... d-don't expect me to actually enjoy it, b-baka!
      2️⃣5️⃣ */kiss @user* - K-kiss someone... as if I'd ever want to do something so embarrassing!
      2️⃣6️⃣ */roast @user* - Roast someone... not that I enjoy insulting people or anything, hmph!
      2️⃣7️⃣ */earthquake* or */gempa* - Check latest earthquake data from BMKG... n-not that I'm concerned about your safety or anything!
      2️⃣8️⃣ */convert [amount] [currency] to [currency]* - Convert currencies... since you can't do basic math yourself!
      2️⃣9️⃣ */quote* - Get a random quote about life... as if YOU would understand something deep, hmph!
      3️⃣0️⃣ */visible* or */show* - Extract and save view-once images/videos... n-not that I'm helping you invade someone's privacy or anything!
      3️⃣1️⃣ */edit [instructions]* - Edit images with AI... it's not like I'm making your pictures better because I care about you or anything!
      3️⃣2️⃣ */chat [message]* - Talk directly to me... it's not like I enjoy conversations with you or anything, b-baka!
      3️⃣3️⃣ */achievement* - View my milestone... not that I'm proud of my 5000 lines of code or anything, hmph!
      3️⃣4️⃣ */confess [message]* or */confess [phone] [message]* - Send anonymous confessions... not that I care about your pathetic love life or anything!
      3️⃣5️⃣ */comp* - Compress PDF files to reduce size... I-it's not like I enjoy making things smaller for you or anything, hmph!
        
      📅 *Current time:* ${dateTimeString} (GMT+7)${weatherInfo}
        
      _I-It's not like I'm waiting for your commands or anything... baka!_`;

      await sock.sendMessage(sender, { text: menuText }, { quoted: msg });
      console.log("📚 Menu sent to", sender);
      return;
    }
    if (
      (type === "imageMessage" &&
        (textMsg.toLowerCase() === "!sticker" ||
          textMsg.toLowerCase() === "/sticker" ||
          textMsg.toLowerCase() === "/s")) ||
      ((textMsg.toLowerCase() === "!sticker" ||
        textMsg.toLowerCase() === "/sticker" ||
        textMsg.toLowerCase() === "/s") &&
        msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          ?.imageMessage) ||
      (type === "videoMessage" &&
        (textMsg.toLowerCase() === "!sticker" ||
          textMsg.toLowerCase() === "/sticker" ||
          textMsg.toLowerCase() === "/s")) ||
      ((textMsg.toLowerCase() === "!sticker" ||
        textMsg.toLowerCase() === "/sticker" ||
        textMsg.toLowerCase() === "/s") &&
        msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          ?.videoMessage)
    ) {
      try {
        console.log("🔄 Processing sticker request...");

        if (type === "viewOnceMessageV2" || type === "viewOnceMessage" ||
          msg.message.viewOnceMessageV2 || msg.message.viewOnceMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "H-hey! That's a 'view once' message! I'm not going to help you save something that was meant to disappear! That would be an invasion of privacy, b-baka!",
            },
            { quoted: msg }
          );
          console.log("⚠️ Blocked attempt to create sticker from direct view once message");
          return;
        }

        let media;
        let isVideo = false;

        if (type === "imageMessage" || type === "videoMessage") {
          if (JSON.stringify(msg.message).includes("viewOnce")) {
            await sock.sendMessage(
              sender,
              {
                text: "Nice try! I won't make stickers from view-once messages! That content was meant to disappear, b-baka!",
              },
              { quoted: msg }
            );
            console.log("⚠️ Blocked attempt to create sticker from hidden view-once message");
            return;
          }

          media = await downloadMediaMessage(msg, "buffer", {});
          isVideo = type === "videoMessage";
        } else {
          const quotedMsg = {
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
            key: {
              remoteJid: sender,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            },
          };

          const quotedMsgType = Object.keys(quotedMsg.message)[0];
          if (quotedMsgType === "viewOnceMessageV2" || quotedMsgType === "viewOnceMessage" ||
            JSON.stringify(quotedMsg.message).includes("viewOnce")) {
            await sock.sendMessage(
              sender,
              {
                text: "Nice try! But I won't make stickers from view-once messages even when replied to! That content was meant to disappear, b-baka!",
              },
              { quoted: msg }
            );
            console.log("⚠️ Blocked attempt to create sticker from replied view-once message");
            return;
          }

          const quotedType = Object.keys(quotedMsg.message)[0];
          media = await downloadMediaMessage(quotedMsg, "buffer", {});
          isVideo = quotedType === "videoMessage";
        }

        await sock.sendMessage(
          sender,
          {
            text: "F-fine! I'll make your stupid sticker... but don't think I'm doing this because I like you or anything, b-baka!",
          },
          { quoted: msg }
        );

        if (isVideo || (await isAnimated(media))) {
          console.log("🎬 Creating animated sticker...");

          const tempInputPath = path.join(
            tmpdir(),
            `input_${Date.now()}.${isVideo ? "mp4" : "gif"}`
          );
          await fs.writeFile(tempInputPath, media);

          const webpPath = await convertToAnimatedSticker(tempInputPath);
          const stickerBuffer = await fs.readFile(webpPath);

          await sock.sendMessage(
            sender,
            {
              sticker: stickerBuffer,
            },
            { quoted: msg }
          );

          await fs.unlink(tempInputPath).catch(console.error);
          await fs.unlink(webpPath).catch(console.error);

          console.log("✅ Animated sticker sent");
        } else {
          const tempFilePath = path.join(
            tmpdir(),
            `sticker_${Date.now()}.webp`
          );
          const sharp = require("sharp");
          await sharp(media)
            .resize(512, 512, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toFormat("webp")
            .toFile(tempFilePath);
          const stickerBuffer = await fs.readFile(tempFilePath);
          await sock.sendMessage(
            sender,
            {
              sticker: stickerBuffer,
            },
            { quoted: msg }
          );
          await fs.unlink(tempFilePath).catch(console.error);
          console.log("✅ Static sticker sent");
        }
      } catch (error) {
        console.error("❌ Error creating sticker:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't make your sticker, okay?! Not that I feel bad about it or anything... hmph! Maybe ask my master if you really need help that badly!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/togif") {
      try {
        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "H-how did you even find this command?! It's not working yet, b-baka! Not that I care if you know about it...",
            },
            { quoted: msg }
          );
          return;
        }

        const quotedMessage =
          msg.message.extendedTextMessage.contextInfo.quotedMessage;

        if (!quotedMessage || !quotedMessage.stickerMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "Idiot! You need to reply to a sticker first! It's not like I'm explaining this because I want to help you or anything... hmph!",
            },
            { quoted: msg }
          );
          return;
        }

        console.log("🔄 Processing sticker to GIF conversion...");
        await sock.sendMessage(
          sender,
          {
            text: "F-fine! I'll convert your stupid sticker... N-not because I want to be helpful or anything!",
          },
          { quoted: msg }
        );

        try {
          const tempStickerPath = path.join(
            tmpdir(),
            `sticker_${Date.now()}.webp`
          );
          const stickerMessage = quotedMessage.stickerMessage;
          const quotedMsg = {
            message: {
              stickerMessage: stickerMessage,
            },
            key: {
              remoteJid: sender,
              id: `dummy_${Date.now()}`,
            },
          };

          const stickerBuffer = await downloadMediaMessage(
            quotedMsg,
            "buffer",
            {}
          );

          console.log(
            `✓ Downloaded sticker, size: ${stickerBuffer.length} bytes`
          );
          await fs.writeFile(tempStickerPath, stickerBuffer);

          const isAnimated = await isWebPAnimated(tempStickerPath);

          if (!isAnimated) {
            await sock.sendMessage(
              sender,
              {
                text: "B-baka! This sticker isn't even animated! How am I supposed to convert it?! Choose another one and stop wasting my time!",
              },
              { quoted: msg }
            );

            await fs.unlink(tempStickerPath).catch(console.error);
            return;
          }

          try {
            const gifPath = await convertStickerToGif(tempStickerPath);
            const gifBuffer = await fs.readFile(gifPath);

            if (gifBuffer.length < 1000) {
              throw new Error(
                "Converted file is too small, conversion likely failed"
              );
            }

            await sock.sendMessage(
              sender,
              {
                video: gifBuffer,
                gifPlayback: true,
                caption:
                  "I-it's not like I worked hard on this GIF for you or anything... hmph!",
                mimetype: "video/mp4",
              },
              { quoted: msg }
            );

            await fs.unlink(tempStickerPath).catch(console.error);
            await fs.unlink(gifPath).catch(console.error);

            console.log("✅ GIF sent from converted sticker");
          } catch (conversionError) {
            console.error("Conversion error:", conversionError);
            await sock.sendMessage(
              sender,
              {
                text: "I-I couldn't convert it, okay?! Not that I was really trying my best or anything... Tch!",
              },
              { quoted: msg }
            );

            await fs.unlink(tempStickerPath).catch(console.error);
          }
        } catch (processError) {
          console.error("Error during sticker processing:", processError);
          await sock.sendMessage(
            sender,
            {
              text: "S-something went wrong! Not that I care if you're disappointed or anything... hmph!",
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error converting sticker to GIF:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I messed up, okay?! D-don't look at me like that! Try again if you must...",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (
      textMsg.toLowerCase() === "/toimage" ||
      textMsg.toLowerCase() === "/img" ||
      textMsg.toLowerCase() === "/toimg"
    ) {
      try {
        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "Ugh! You need to reply to a sticker first, b-baka! It's not like I want to help you or anything...",
            },
            { quoted: msg }
          );
          return;
        }
        const quotedMessage =
          msg.message.extendedTextMessage.contextInfo.quotedMessage;
        if (!quotedMessage || !quotedMessage.stickerMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "Are you blind?! Reply to a STICKER! Not that I'm desperate to convert it for you anyway... hmph!",
            },
            { quoted: msg }
          );
          return;
        }

        console.log("🔄 Processing sticker to image conversion...");
        await sock.sendMessage(
          sender,
          {
            text: "F-fine! I'll convert your stupid sticker... just don't expect high quality or anything!",
          },
          { quoted: msg }
        );

        try {
          const tempStickerPath = path.join(
            tmpdir(),
            `sticker_${Date.now()}.webp`
          );
          const stickerMessage = quotedMessage.stickerMessage;
          const mediaKey = stickerMessage.mediaKey;
          const directPath = stickerMessage.directPath;
          const url = stickerMessage.url;
          const quotedMsg = {
            message: {
              stickerMessage: stickerMessage,
            },
            key: {
              remoteJid: sender,
              id: `dummy_${Date.now()}`,
            },
          };
          const stickerBuffer = await downloadMediaMessage(
            quotedMsg,
            "buffer",
            {}
          );
          await fs.writeFile(tempStickerPath, stickerBuffer);
          const tempImagePath = path.join(tmpdir(), `image_${Date.now()}.png`);
          const sharp = require("sharp");
          await sharp(tempStickerPath).toFormat("png").toFile(tempImagePath);
          const imageBuffer = await fs.readFile(tempImagePath);
          await sock.sendMessage(
            sender,
            {
              image: imageBuffer,
              caption:
                "H-here's your image! Not that I put any special effort into it or anything... baka!",
            },
            { quoted: msg }
          );
          await fs.unlink(tempStickerPath).catch(console.error);
          await fs.unlink(tempImagePath).catch(console.error);

          console.log("✅ Image sent from converted sticker");
        } catch (downloadError) {
          console.error("Error during download/conversion:", downloadError);
          await sock.sendMessage(
            sender,
            {
              text: "I-I couldn't do it, okay?! Not like I really wanted to help you anyway... Hmph!",
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error converting sticker to image:", error);
        await sock.sendMessage(
          sender,
          {
            text: "It's not my fault it didn't work! Y-you probably gave me a bad sticker to begin with... hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }
    if (
      textMsg.toLowerCase().startsWith("/tagall") &&
      sender.endsWith("@g.us")
    ) {
      try {
        const group = await sock.groupMetadata(sender);
        const mentions = group.participants.map((p) => p.id);
        const commandLength = "/tagall".length;
        const hasAnnouncement = textMsg.length > commandLength;

        if (hasAnnouncement) {
          const announcementText = textMsg.substring(commandLength).trim();
          await sock.sendMessage(
            sender,
            {
              text: `${announcementText}\n\nI-it's not like I wanted to tag everyone for you or anything... b-baka!`,
              mentions,
            },
            { quoted: msg }
          );
          console.log("📢 Announcement sent with all members tagged");
        } else {
          const text =
            mentions.map((jid) => `@${jid.split("@")[0]}`).join("\n") +
            "\n\nThere! I tagged everyone! Not that I did it just for you... hmph!";
          await sock.sendMessage(sender, { text, mentions }, { quoted: msg });
          console.log("📢 Tagged all members");
        }
      } catch (error) {
        console.error("❌ Error in tagall command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't tag everyone, okay?! It's not like I'm sorry about it or anything...",
          },
          { quoted: msg }
        );
      }
    }

    if (
      textMsg.toLowerCase() === "/freegame" ||
      textMsg.toLowerCase() === "/freegames"
    ) {
      try {
        await sock.sendMessage(
          sender,
          {
            text: "Hmph! Free games for your broke ass? F-fine, I'll look... not like I want to help you or anything!",
          },
          { quoted: msg }
        );

        const games = await getFreeGames();

        if (!games) {
          await sock.sendMessage(
            sender,
            {
              text: "Tch! Something's wrong with the stupid API! Don't look at me like that... it's not MY fault!",
            },
            { quoted: msg }
          );
          return;
        }

        if (games.length === 0) {
          await sock.sendMessage(
            sender,
            {
              text: "Hah! No free games right now! W-what? Don't give me that look... I actually tried looking, b-baka!",
            },
            { quoted: msg }
          );
          return;
        }
        const gamesToShow = games.slice(0, 5);
        for (const game of gamesToShow) {
          try {
            const gameInfo =
              `*🎮 ${game.title}*\n\n` +
              `💻 *Platform:* ${game.platforms}\n` +
              `📝 *Description:* ${game.description.substring(0, 100)}...\n` +
              `⏱️ *End Date:* ${game.end_date || "Unknown"}\n\n` +
              `🔗 *Get it here:* ${game.open_giveaway_url}\n`;

            if (game.thumbnail) {
              const imagePath = await downloadImage(game.thumbnail);

              if (imagePath) {
                const imageBuffer = await fs.readFile(imagePath);
                await sock.sendMessage(
                  sender,
                  {
                    image: imageBuffer,
                    caption: gameInfo,
                  },
                  { quoted: msg }
                );
                await fs.unlink(imagePath).catch(console.error);
              } else {
                await sock.sendMessage(
                  sender,
                  { text: gameInfo },
                  { quoted: msg }
                );
              }
            } else {
              await sock.sendMessage(
                sender,
                { text: gameInfo },
                { quoted: msg }
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (gameError) {
            console.error(
              `❌ Error sending game info for ${game.title}:`,
              gameError
            );
          }
        }
        if (games.length > 5) {
          await sock.sendMessage(
            sender,
            {
              text: `T-there's ${games.length - 5
                } more games... not that I want you to use the command again or anything, b-baka!`,
            },
            { quoted: msg }
          );
        }

        console.log("🎮 Free games info sent to", sender);
      } catch (error) {
        console.error("❌ Error in free games command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-it's not like I couldn't handle it or anything! The stupid API just doesn't like me today! Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/owner") {
      try {
        const ownerMessage = `Y-you want to know about my master? I-it's not like I'm proud to tell you or anything... hmph!
      
      📝 *Name:* ${ownerInfo.name}
      💬 *Contact:* @${ownerInfo.contact}
      🌐 *Website:* ${ownerInfo.website}
      ℹ️ *About:* ${ownerInfo.description}`;

        await sock.sendMessage(sender, { text: ownerMessage }, { quoted: msg });
        console.log("👤 Owner info sent to", sender);
      } catch (error) {
        console.error("❌ Error sending owner info:", error);
        await sock.sendMessage(
          sender,
          {
            text: "B-baka! Something went wrong... not that I was eager to tell you about my master anyway!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/status") {
      try {
        await sock.sendMessage(
          sender,
          {
            text: "Checking my stats... N-not that I want to impress you or anything! D-don't get the wrong idea!",
          },
          { quoted: msg }
        );

        const stats = await getServerStats();

        if (stats) {
          const now = new Date();
          const botUptimeSeconds = Math.floor((now - botStartTime) / 1000);
          const botUptimeDays = Math.floor(botUptimeSeconds / 86400);
          const botUptimeHours = Math.floor((botUptimeSeconds % 86400) / 3600);
          const botUptimeMinutes = Math.floor((botUptimeSeconds % 3600) / 60);

          const statusMsg = `*🖥️ S-so you wanted my stats, huh? Not that I'm excited to show you or anything... b-baka!*
    
    💾 *Memory:* ${stats.memoryUsage}% (${stats.memoryFree}GB free of ${stats.memoryTotal}GB)
    🧠 *CPU:* ${stats.cpuModel} (${stats.cpuCores} cores)
    📊 *CPU Usage:* ${stats.cpuUsage}%
    ⏰ *System Uptime:* ${stats.systemUptime.days}d ${stats.systemUptime.hours}h ${stats.systemUptime.minutes}m
    ⌚ *Bot Uptime:* ${botUptimeDays}d ${botUptimeHours}h ${botUptimeMinutes}m
    🔧 *Node.js:* ${stats.nodeVersion}
    💻 *Platform:* ${stats.platform}
    
    _I-it's not like I prepared this information specially for you or anything! Hmph!_`;

          await sock.sendMessage(sender, { text: statusMsg }, { quoted: msg });
          console.log("📊 Server status sent to", sender);
        } else {
          await sock.sendMessage(
            sender,
            {
              text: "I couldn't get my stats... n-not that I wanted to show you anyway! Hmph!",
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error in status command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I didn't fail or anything! The system is j-just being stupid right now! It's not my fault!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/group") {
      try {
        if (!sender.endsWith("@g.us")) {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! This command only works in group chats! Are you stupid or something?! Hmph!",
            },
            { quoted: msg }
          );
          return;
        }

        await sock.sendMessage(
          sender,
          {
            text: "F-fine! I'll get the group info... not because you asked nicely or anything!",
          },
          { quoted: msg }
        );
        const groupMetadata = await sock.groupMetadata(sender);
        const participants = groupMetadata.participants;
        const admins = participants.filter((p) => p.admin).map((p) => p.id);
        const creationDate = new Date(
          groupMetadata.creation * 1000
        ).toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
          dateStyle: "full",
          timeStyle: "short",
        });
        const groupInfo = `*📊 Group Information... n-not that you deserve to know, b-baka!*
    
    📝 *Name:* ${groupMetadata.subject}
    👥 *Participants:* ${participants.length} members
    👮 *Admins:* ${admins.length} admins
    🗓️ *Created on:* ${creationDate}
    🆔 *Group ID:* ${sender.split("@")[0]}
    ${groupMetadata.desc ? `📄 *Description:* ${groupMetadata.desc}` : ""}
    
    _I-it's not like I spent time collecting this info specially for you or anything..._`;

        await sock.sendMessage(sender, { text: groupInfo }, { quoted: msg });
        console.log("📊 Group info sent to", sender);
      } catch (error) {
        console.error("❌ Error in group command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "T-tch! Something went wrong... not that I really cared about getting the group info for you anyway!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/kick") && sender.endsWith("@g.us")) {
      try {
        if (!sender.endsWith("@g.us")) {
          await sock.sendMessage(
            sender,
            {
              text: "Are you stupid?! This command only works in groups! B-baka!",
            },
            { quoted: msg }
          );
          return;
        }

        const groupMetadata = await sock.groupMetadata(sender);

        const senderJid = msg.key.participant || msg.key.remoteJid;

        const isAdmin = groupMetadata.participants
          .filter((p) => p.admin)
          .map((p) => p.id)
          .includes(senderJid);

        if (!isAdmin) {
          await sock.sendMessage(
            sender,
            {
              text: "Hah! You're not even an admin! Know your place, weakling! As if I'd listen to someone like you!",
            },
            { quoted: msg }
          );
          return;
        }

        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo ||
          !msg.message.extendedTextMessage.contextInfo.mentionedJid
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "Idiot! You need to mention who you want to kick! It's not like I'll read your mind or anything!",
            },
            { quoted: msg }
          );
          return;
        }

        const kickUser =
          msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const botId = sock.user.id;


        const botIsTarget = [botNumber, botId].some(id =>
          kickUser === id || kickUser.split('@')[0] === id.split('@')[0].split(':')[0]
        );

        if (botIsTarget) {
          await sock.sendMessage(
            sender,
            {
              text: "W-what?! You want ME to kick MYSELF?! What kind of idiot are you?! I-I'm not doing that!",
            },
            { quoted: msg }
          );
          return;
        }


        const isTargetAdmin = groupMetadata.participants
          .filter((p) => p.admin)
          .map((p) => p.id)
          .includes(kickUser);

        if (isTargetAdmin) {

          await sock.sendMessage(
            sender,
            {
              text: `That person is an admin! I'll have to demote them first... N-not that I'm excited about this power or anything!`,
            },
            { quoted: msg }
          );

          console.log(`⬇️ Demoting admin user first: ${kickUser}`);

          try {
            await sock.groupParticipantsUpdate(sender, [kickUser], "demote");


            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log("✅ Admin user successfully demoted");
          } catch (demoteError) {
            console.error("❌ Failed to demote admin:", demoteError);

            await sock.sendMessage(
              sender,
              {
                text: "I-I couldn't demote that admin! They might have higher permissions than me, b-baka!",
              },
              { quoted: msg }
            );
            return;
          }
        }


        try {
          await sock.groupParticipantsUpdate(sender, [kickUser], "remove");

          const kickedNumber = kickUser.split("@")[0];
          const adminNotice = isTargetAdmin ? " (who was just demoted from admin)" : "";

          await sock.sendMessage(
            sender,
            {
              text: `I... I kicked @${kickedNumber}${adminNotice} out! Not because you told me to or anything... I just didn't like them anyway! Hmph!`,
              mentions: [kickUser],
            },
            { quoted: msg }
          );

          console.log(
            `👢 User ${kickUser}${isTargetAdmin ? ' (former admin)' : ''} kicked from ${groupMetadata.subject} by ${senderJid}`
          );
        } catch (kickError) {
          console.error("❌ Failed to kick user:", kickError);

          await sock.sendMessage(
            sender,
            {
              text: "I-I couldn't kick them! Maybe they have special protection, or maybe I don't have enough permissions! Not my fault!",
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error in kick command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't process the kick command! Not because I'm weak or anything! Something just went wrong... hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/intro" && sender.endsWith("@g.us")) {
      try {
        const groupMetadata = await sock.groupMetadata(sender);
        const groupName = groupMetadata.subject;

        const introMessage = `*What? ${groupName}?!*
    
      Another group huh?! Damn master! Tch..
      Thanks.. whatever. I'm VOID-X, an alter solid existence of Xiannyaa~ created by    ${ownerInfo.name}.
      
      *What can I do?*
      • I'm doing your mom..
      • Convert images to stickers and back, too much work I hate it
      • Tag all losers in any group with /tagall
      • Show the weather if you have no life to get out and touch grass
      • Find free games if you are broke ass
      • Play Truth or Dare games, kid game tch..
      • Show my solid stats, stats! Not my body feature you pervert!
      • And some more, I don't care, look for yourself by /menu or /help
      
      _I hate you all if you overwork me, jackass.. hmph.`;

        await sock.sendMessage(sender, { text: introMessage });
        console.log(`✅ Introduction sent to group ${groupName} via command`);
      } catch (error) {
        console.error("❌ Error sending manual introduction:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-it's not like I couldn't introduce myself! The system just got in my way! Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/norma") {
      try {
        console.log("📅 Sending normative week schedule to", sender);

        let scheduleText =
          "H-hmph! Asking me for your schedule? What are you, helpless?! Fine, I'll show you, but only because I happen to know it already!\n\n*📚 Normative Week Schedule:*\n\n";

        for (const [day, classes] of Object.entries(normativeSchedule)) {
          scheduleText += `*📆 ${day}*\n`;

          classes.forEach((cls) => {
            scheduleText += `⏰ ${cls.time} - ${cls.subject}\n`;
          });

          scheduleText += "\n";
        }

        scheduleText +=
          "_I-it's not like I made this schedule just for you or anything, b-baka!_";

        await sock.sendMessage(sender, { text: scheduleText }, { quoted: msg });
        console.log("✅ Normative schedule sent to", sender);
      } catch (error) {
        console.error("❌ Error sending normative schedule:", error);
        await sock.sendMessage(
          sender,
          {
            text: "Tch! I couldn't get the schedule! Not that I was trying hard or anything!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/prod") {
      try {
        console.log("📅 Sending productive week schedule to", sender);

        let scheduleText =
          "Again with the schedule?! Don't you have it written down somewhere?! Ugh, fine! Look closely because I'm NOT repeating myself!\n\n*💻 Productive Week Schedule:*\n\n";

        for (const [day, classes] of Object.entries(productiveSchedule)) {
          scheduleText += `*📆 ${day}*\n`;

          classes.forEach((cls) => {
            scheduleText += `⏰ ${cls.time} - ${cls.subject}\n`;
          });

          scheduleText += "\n";
        }

        scheduleText +=
          "_D-don't thank me or anything! It's not like I wanted to help you... I was just bored!_";

        await sock.sendMessage(sender, { text: scheduleText }, { quoted: msg });
        console.log("✅ Productive schedule sent to", sender);
      } catch (error) {
        console.error("❌ Error sending productive schedule:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I couldn't get your stupid schedule! Maybe try being nicer next time you ask! Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/piket")) {
      try {
        console.log("Getting cleaning schedule, its not like you gonna do it anyway..");

        const parts = textMsg.split(" ");
        let requestedDay = null;

        if (parts.length > 1) {
          const day = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
          if (cleaningSchedule[day]) {
            requestedDay = day;
          }
        }

        if (requestedDay && cleaningSchedule[requestedDay]) {
          let scheduleText = `*📋 Cleaning Schedule for ${requestedDay}:*\n\n`;

          if (cleaningSchedule[requestedDay].length > 0) {
            cleaningSchedule[requestedDay].forEach((person, index) => {
              scheduleText += `${index + 1}. ${person.name} (@${person.number})\n`;
            });

            const mentions = cleaningSchedule[requestedDay].map(
              (person) => person.number + "@s.whatsapp.net"
            );

            scheduleText += "\nD-don't think I'm reminding you because I care about cleanliness or anything! I just don't want to see you get in trouble! Hmph!";

            await sock.sendMessage(
              sender,
              {
                text: scheduleText,
                mentions: mentions,
              },
              { quoted: msg }
            );
          } else {
            await sock.sendMessage(
              sender,
              {
                text: `No cleaning schedule found for ${requestedDay}. Did you forget to set it up in the environment variables? Not that I care... hmph!`,
              },
              { quoted: msg }
            );
          }
        } else {
          let fullSchedule = "*📋 Complete Cleaning Schedule:*\n\n";

          for (const [day, people] of Object.entries(cleaningSchedule)) {
            if (people.length > 0) {
              fullSchedule += `*${day}:*\n`;
              people.forEach((person, index) => {
                fullSchedule += `${index + 1}. ${person.name}\n`;
              });
              fullSchedule += "\n";
            }
          }

          fullSchedule += "W-what? You want more details? Use '/piket [day]' for specific day information! Don't make me repeat myself, b-baka!";

          await sock.sendMessage(sender, { text: fullSchedule }, { quoted: msg });
        }
      } catch (error) {
        console.error("❌ Error processing cleaning schedule request:", error);
        await sock.sendMessage(
          sender,
          {
            text: "S-something went wrong! Not that I'm sorry about it or anything!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/ship")) {
      try {
        console.log("Ship those two huh? Let me see..");

        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo ||
          !msg.message.extendedTextMessage.contextInfo.mentionedJid ||
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length < 2
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "Ugh! You can't even do this right! You need to mention TWO people, b-baka!\nUsage: */ship @user1 @user2*",
            },
            { quoted: msg }
          );
          return;
        }

        const mentionedJids = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        const user1 = mentionedJids[0];
        const user2 = mentionedJids[1];


        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const botNumberWithDevice = sock.user.id;
        const specialNumber = "6283107393837@s.whatsapp.net";


        if ((user1 === botNumber || user1 === botNumberWithDevice) && user2 === specialNumber) {

          await handleSpecialShip(sock, sender, msg, botNumber, specialNumber);
          return;
        } else if ((user2 === botNumber || user2 === botNumberWithDevice) && user1 === specialNumber) {

          await handleSpecialShip(sock, sender, msg, specialNumber, botNumber);
          return;
        } else if (user1 === botNumber || user1 === botNumberWithDevice ||
          user2 === botNumber || user2 === botNumberWithDevice) {

          const selfShipResponses = [
            "W-what?! You want to ship ME with someone?! *face turns crimson* Are you INSANE?! I'm not some character in your stupid romance fantasies! BAKA!",
            "S-ship me? With another person?! *throws virtual object at you* Don't be ridiculous! I-I'm not interested in... in ANYONE! How embarrassing!",
            "*crosses arms* Ship yourself with someone else! I'm a sophisticated AI assistant, not some lovestruck teenager! The nerve of some users... hmph!"
          ];

          const response = selfShipResponses[Math.floor(Math.random() * selfShipResponses.length)];

          await sock.sendMessage(
            sender,
            { text: response },
            { quoted: msg }
          );
          return;
        }

        const user1Name = user1.split("@")[0];
        const user2Name = user2.split("@")[0];

        const compatibilityPercentage = Math.floor(Math.random() * 101);

        const progressBarLength = 10;
        const filledHearts = Math.floor(
          (compatibilityPercentage / 100) * progressBarLength
        );
        const emptyHearts = progressBarLength - filledHearts;
        const progressBar =
          "❤️".repeat(filledHearts) + "🖤".repeat(emptyHearts);

        let message;
        let emoji;

        if (compatibilityPercentage < 30) {
          message = "Hmm... might just be better as friends!";
          emoji = "😬";
        } else if (compatibilityPercentage < 60) {
          message = "There might be something there! Give it a chance?";
          emoji = "😊";
        } else if (compatibilityPercentage < 80) {
          message = "Wow! You two have great chemistry!";
          emoji = "😍";
        } else if (compatibilityPercentage < 100) {
          message = "Amazing match! When's the wedding?";
          emoji = "💑";
        } else {
          message = "PERFECT MATCH! You're soulmates!";
          emoji = "👰🤵";
        }

        const shipMessage =
          `*💞 LOVE COMPATIBILITY 💞*\n\n` +
          `👤 @${user1Name} + 👤 @${user2Name} = ${emoji}\n\n` +
          `*Compatibility: ${compatibilityPercentage}%*\n` +
          `${progressBar}\n\n` +
          `*Result:* ${message}`;

        await sock.sendMessage(
          sender,
          {
            text: shipMessage,
            mentions: [user1, user2],
          },
          { quoted: msg }
        );

        console.log(
          `✅ Ship result sent: ${user1Name} + ${user2Name} = ${compatibilityPercentage}%`
        );
      } catch (error) {
        console.error("❌ Error processing ship command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I messed up the calculation! Not like your relationship would work anyway, hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }


    async function handleSpecialShip(sock, sender, msg, specialJid, botJid) {
      const specialName = specialJid.split("@")[0];
      const botName = botJid.split("@")[0];


      const useInfinity = Math.random() < 0.5;
      const compatibilityDisplay = useInfinity ? "∞" : "100%";


      const progressBar = "❤️".repeat(10);


      const specialMessages = [
        "The universe itself acknowledges this divine connection!",
        "A love that transcends all dimensions and realities!",
        "The stars aligned perfectly for this legendary pairing!",
        "A bond so powerful it could rewrite the laws of physics!"
      ];

      const message = specialMessages[Math.floor(Math.random() * specialMessages.length)];

      const shipMessage =
        `*💞 ULTIMATE LOVE COMPATIBILITY 💞*\n\n` +
        `👤 @${specialName} + 👤 @${botName} = 👑💖\n\n` +
        `*Compatibility: ${compatibilityDisplay}*\n` +
        `${progressBar}\n\n` +
        `*Result:* ${message}\n\n` +
        `*blushes intensely* W-what?! No! This can't be right! The system must be broken or something! But... m-maybe it's true... *fidgets nervously* NOT THAT I'M ADMITTING ANYTHING, B-BAKA!`;

      await sock.sendMessage(
        sender,
        {
          text: shipMessage,
          mentions: [specialJid, botJid],
        },
        { quoted: msg }
      );

      console.log(`✅ Special ship result sent: ${specialName} + ${botName} = ${compatibilityDisplay}`);
    }

    if (textMsg.toLowerCase().startsWith("/ytdl")) {
      try {
        const parts = textMsg.split(" ");
        if (parts.length < 2) {
          await sock.sendMessage(
            sender,
            {
              text: "Tch... can't even provide a proper YouTube URL? Useless! Fine, I'll tell you how:\n\n*/ytdl [URL]* - Download video\n*/ytdl audio [URL]* - Download audio only\n\nNot that I care if you figure it out or anything!",
            },
            { quoted: msg }
          );
          return;
        }

        let type = "video";
        let url;

        if (parts[1].toLowerCase() === "audio" && parts.length >= 3) {
          type = "audio";
          url = parts[2];
        } else {
          url = parts[1];
        }

        await sock.sendMessage(
          sender,
          {
            text: `Hmph! ${type === "audio" ? "Audio" : "Video"
              } from YouTube? Fine, I'll get it for you... not because I like you or anything! Just wait, this takes time you know!`,
          },
          { quoted: msg }
        );

        const result = await downloadYouTubeWithFallback(url, type);
        const buffer = await fs.readFile(result.filePath);

        if (type === "audio") {
          await sock.sendMessage(
            sender,
            {
              audio: buffer,
              mimetype: result.mimeType,
              fileName: result.fileName,
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            sender,
            {
              video: buffer,
              caption: `There! Happy now? I went through all this trouble just for you... baka!`,
              fileName: result.fileName,
              mimetype: result.mimeType,
            },
            { quoted: msg }
          );
        }


        await fs.unlink(result.filePath).catch(console.error);
        console.log(`✅ YouTube ${type} sent successfully`);
      } catch (error) {
        console.error("❌ Error in YouTube download command:", error);
        await sock.sendMessage(
          sender,
          {
            text: `Ugh! I couldn't download your stupid video! Not my fault though! Error: ${error.message}`,
          },
          { quoted: msg }
        );
      }
      return;
    }


    if (textMsg.toLowerCase().startsWith("/tiktokdl")) {
      try {
        const parts = textMsg.split(" ");
        if (parts.length < 2) {
          await sock.sendMessage(
            sender,
            {
              text: "Are you kidding me? I need a TikTok URL, idiot!\n\nUsage:\n*/tiktokdl [URL]*\n\nIt's not like I'm explaining this because I want to help you or anything...",
            },
            { quoted: msg }
          );
          return;
        }

        const url = parts[1];

        await sock.sendMessage(
          sender,
          {
            text: "TikTok? Such a waste of time... but fine! I'll download it. Just don't expect me to be happy about it!",
          },
          { quoted: msg }
        );

        const result = await downloadTikTok(url);
        const buffer = await fs.readFile(result.filePath);

        await sock.sendMessage(
          sender,
          {
            video: buffer,
            caption: `Here's your stupid TikTok video. Not like I worked hard on this or anything... hmph!`,
            fileName: result.fileName,
            mimetype: result.mimeType,
          },
          { quoted: msg }
        );


        await fs.unlink(result.filePath).catch(console.error);
        console.log("✅ TikTok video sent successfully");
      } catch (error) {
        console.error("❌ Error in TikTok download command:", error);
        await sock.sendMessage(
          sender,
          {
            text: `I told you TikTok downloads were buggy! Not my fault it failed! Error: ${error.message}... You should be grateful I even tried!`,
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/topdf") {
      try {
        console.log("🔄 Processing document to PDF conversion...");

        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo ||
          !msg.message.extendedTextMessage.contextInfo.quotedMessage
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "I-It's not like I want to help, but reply to a document with this command to convert it to PDF, b-baka!",
            },
            { quoted: msg }
          );
          return;
        }

        const quotedMessage =
          msg.message.extendedTextMessage.contextInfo.quotedMessage;

        if (!quotedMessage.documentMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "Are you blind?! That's not a document! Reply to a proper document file (DOC, DOCX, PPT, etc.), hmph!",
            },
            { quoted: msg }
          );
          return;
        }


        const originalFileName =
          quotedMessage.documentMessage.fileName || "document";
        const mimeType =
          quotedMessage.documentMessage.mimetype || "application/octet-stream";

        await sock.sendMessage(
          sender,
          {
            text: `F-Fine! I'll convert your ${originalFileName} to PDF... not that I'm doing this because I like you or anything!`,
          },
          { quoted: msg }
        );

        const quotedMsg = {
          message: {
            documentMessage: quotedMessage.documentMessage,
          },
          key: {
            remoteJid: sender,
            id: `dummy_${Date.now()}`,
          },
        };

        const docBuffer = await downloadMediaMessage(quotedMsg, "buffer", {});


        let fileExtension = path.extname(originalFileName).toLowerCase();


        if (!fileExtension && mimeType) {
          console.log(`📄 Detected MIME type: ${mimeType}`);
          if (
            mimeType.includes("powerpoint") ||
            mimeType.includes("presentation")
          ) {
            fileExtension = ".pptx";
          } else if (
            mimeType.includes("word") ||
            mimeType.includes("document")
          ) {
            fileExtension = ".docx";
          } else if (mimeType.includes("excel") || mimeType.includes("sheet")) {
            fileExtension = ".xlsx";
          }
        }

        console.log(
          `📄 File: ${originalFileName}, Extension: ${fileExtension}, MIME: ${mimeType}`
        );

        const supportedFormats = [
          ".doc",
          ".docx",
          ".ppt",
          ".pptx",
          ".xls",
          ".xlsx",
          ".odt",
          ".ods",
          ".odp",
          ".rtf",
          ".txt",
        ];

        if (!supportedFormats.includes(fileExtension)) {
          await sock.sendMessage(
            sender,
            {
              text: `Hmph! I can't work with this ${fileExtension || "unknown"
                } format, idiot! I only handle DOC, DOCX, PPT, PPTX, XLS, XLSX, ODT, ODS, ODP, RTF, and TXT. Get it right next time!`,
            },
            { quoted: msg }
          );
          return;
        }


        const tempInputPath = path.join(
          tmpdir(),
          `input_${Date.now()}${fileExtension}`
        );
        const tempOutputPath = path.join(tmpdir(), `output_${Date.now()}.pdf`);
        const outputFileName = originalFileName.replace(fileExtension, ".pdf");

        await fs.writeFile(tempInputPath, docBuffer);

        console.log(`✅ Downloaded document saved to ${tempInputPath}`);
        console.log(`🔄 Converting ${fileExtension} to PDF...`);

        try {
          const docxBuf = await fsExtra.readFile(tempInputPath);


          const pdfBuf = await libreConvert(docxBuf, ".pdf", undefined, {

            debug: true,
          });

          await fsExtra.writeFile(tempOutputPath, pdfBuf);
          const pdfBuffer = await fs.readFile(tempOutputPath);

          await sock.sendMessage(
            sender,
            {
              document: pdfBuffer,
              mimetype: "application/pdf",
              fileName: outputFileName,
              caption:
                "H-Here's your PDF... I worked really hard on it, not that I care if you appreciate it or anything!",
            },
            { quoted: msg }
          );

          console.log("✅ PDF document sent successfully");


          await fs.unlink(tempInputPath).catch(console.error);
          await fs.unlink(tempOutputPath).catch(console.error);
        } catch (conversionError) {
          console.error("❌ Conversion error:", conversionError);
          await sock.sendMessage(
            sender,
            {
              text: `I-I couldn't convert your ${fileExtension} file, okay?! Make sure LibreOffice is properly installed on the server. Not MY fault the conversion failed!`,
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error in /topdf command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "Something went wrong! Not that I care about your stupid PDF anyway... hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (
      textMsg.toLowerCase().startsWith("/generate") ||
      textMsg.toLowerCase().startsWith("/gen")
    ) {
      let prompt = "";

      try {

        if (textMsg.toLowerCase().startsWith("/generate")) {
          prompt = textMsg.substring("/generate".length).trim();
        } else if (textMsg.toLowerCase().startsWith("/gen")) {
          prompt = textMsg.substring("/gen".length).trim();
        } else if (textMsg.toLowerCase().startsWith("/g")) {
          prompt = textMsg.substring("/g".length).trim();
        }

        if (!prompt) {
          await sock.sendMessage(
            sender,
            {
              text: "Tch! You want me to generate an image of *nothing*? Give me a proper prompt, baka!\n\nUse it like this: */generate cute anime cat* or */gen cute anime cat* or */g cute anime cat*",
            },
            { quoted: msg }
          );
          return;
        }


        if (prompt.length < 3) {
          await sock.sendMessage(
            sender,
            {
              text: "That prompt is way too short! Put some effort into it, will you? Hmph!",
            },
            { quoted: msg }
          );
          return;
        }

        await sock.sendMessage(
          sender,
          {
            text: `F-fine! I'll try to generate an image of "${prompt}"... but don't blame me if it's not exactly what you wanted!`,
          },
          { quoted: msg }
        );


        if (!process.env.GEMINI_API_KEY) {
          await sock.sendMessage(
            sender,
            {
              text: "The admin hasn't set up my Gemini API key yet! Tell them to stop being lazy and configure it!",
            },
            { quoted: msg }
          );
          return;
        }

        const result = await generateImageWithGemini(prompt);
        const imageBuffer = await fs.readFile(result.filePath);

        await sock.sendMessage(
          sender,
          {
            image: imageBuffer,
            caption: `Here's your stupid "${prompt}" image... I-it's not like I put any special effort into it or anything!`,
            mimetype: result.mimeType,
          },
          { quoted: msg }
        );


        await fs.unlink(result.filePath).catch(console.error);
        console.log("✅ Generated image sent successfully");
      } catch (error) {
        console.error("❌ Error in generate command:", error);

        let errorMessage = "";

        if (
          error.message.includes("parts") ||
          error.message.includes("undefined") ||
          error.message.includes("candidates") ||
          error.message.includes("No image")
        ) {
          errorMessage =
            "Hmph! Your prompt was so bad even the AI didn't want to draw it! Are you trying to make me generate something weird, you pervert?! Try something more... normal! B-baka!";


          if (
            prompt &&
            (prompt.includes("human") ||
              prompt.includes("person") ||
              prompt.includes("girl") ||
              prompt.includes("boy") ||
              prompt.includes("woman") ||
              prompt.includes("man") ||
              prompt.includes("people"))
          ) {
            errorMessage +=
              "\n\nI-it's not like I'm helping you, but the AI is especially picky about drawing people. Try objects or landscapes instead... not that I care if you succeed!";
          }
        } else {

          errorMessage = `What kind of stupid prompt is "${prompt ? prompt.substring(0, 30) : "that"
            }${prompt && prompt.length > 30 ? "..." : ""
            }"?! Did you seriously expect me to understand that nonsense? The AI is confused because YOUR request is confusing! Try something better, and maybe I'll deign to draw it for you, b-baka!`;
        }

        await sock.sendMessage(sender, { text: errorMessage }, { quoted: msg });
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/edit")) {
      try {
        const editPrompt = textMsg.substring("/edit".length).trim();

        if (!editPrompt) {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! You need to tell me what edits to make! Use */edit [your instructions]* with an image or reply to an image with the command.",
            },
            { quoted: msg }
          );
          return;
        }

        let media;

        if (type === "imageMessage") {
          media = await downloadMediaMessage(msg, "buffer", {});
        } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          const quotedMsg = {
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
            key: {
              remoteJid: sender,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            },
          };
          media = await downloadMediaMessage(quotedMsg, "buffer", {});
        } else {
          await sock.sendMessage(
            sender,
            {
              text: "Ugh! How do you expect me to edit nothing?! Send an image with the command or reply to an image with */edit [instructions]*",
            },
            { quoted: msg }
          );
          return;
        }

        await sock.sendMessage(
          sender,
          {
            text: `Fine! I'll try to edit this image to "${editPrompt}"... Not that I'm excited to show off my artistic skills or anything!`,
          },
          { quoted: msg }
        );

        const result = await transformImageWithGemini(media, editPrompt);
        const editedBuffer = await fs.readFile(result.filePath);

        await sock.sendMessage(
          sender,
          {
            image: editedBuffer,
            caption: `H-here's your edited image! I followed your "${editPrompt}" instructions... not that I care if you like it or anything!`,
            mimetype: result.mimeType,
          },
          { quoted: msg }
        );

        await fs.unlink(result.filePath).catch(console.error);
        console.log(`✅ Edited image with prompt "${editPrompt}" sent successfully`);

      } catch (error) {
        console.error("❌ Error in edit command:", error);

        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't edit your stupid image! Maybe your instructions were too complicated for the AI... It's not MY fault, b-baka!"
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/hitamkan") {
      try {
        let media;

        if (type === "imageMessage") {
          media = await downloadMediaMessage(msg, "buffer", {});
        } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          const quotedMsg = {
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
            key: {
              remoteJid: sender,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            },
          };
          media = await downloadMediaMessage(quotedMsg, "buffer", {});
        } else {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! You need to send an image with the command or reply to an image! Just use */hitamkan* while sending an image or reply to an image with */hitamkan*",
            },
            { quoted: msg }
          );
          return;
        }

        await sock.sendMessage(
          sender,
          {
            text: `P-preparing to transform this image... This is going to be hilarious! Not that I care about pranking your friends or anything!`,
          },
          { quoted: msg }
        );

        const result = await transformImageWithGemini(media);
        const transformedBuffer = await fs.readFile(result.filePath);

        await sock.sendMessage(
          sender,
          {
            image: transformedBuffer,
            caption: `Heh! Here's your friend with the dark skin filter! T-try not to laugh too much, b-baka!`,
            mimetype: result.mimeType,
          },
          { quoted: msg }
        );

        await fs.unlink(result.filePath).catch(console.error);
        console.log("✅ Transformed image sent successfully");

      } catch (error) {
        console.error("❌ Error in image transformation command:", error);

        await sock.sendMessage(
          sender,
          { text: "I-I couldn't transform your image! Maybe the AI doesn't like your stupid face in the picture! Hmph!" },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/hug")) {
      try {

        let mentionedUser = null;


        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid &&
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!mentionedUser) {
          await sock.sendMessage(
            sender,
            {
              text: "W-who am I supposed to hug, idiot!? Mention someone or reply to their message! It's not like I want to hug you anyway... hmph!",
            },
            { quoted: msg }
          );
          return;
        }


        const phoneNumber = mentionedUser.split('@')[0];


        const botNumber = sock.user.id.split(":")[0];
        if (phoneNumber === botNumber) {
          const selfHugResponses = [
            "*backs away nervously* Y-you want to hug ME?! What's wrong with you?! I-I'm not some teddy bear you can just cuddle whenever you want!",
            "*blushes furiously* A hug? With ME?! D-don't be absurd! I don't need your hugs... or anyone's hugs for that matter! Hmph!",
            "*flustered* W-what are you thinking?! You can't just go around asking to hug AIs! That's... that's just weird! Find a real person to bother!"
          ];

          const response = selfHugResponses[Math.floor(Math.random() * selfHugResponses.length)];

          await sock.sendMessage(
            sender,
            { text: response },
            { quoted: msg }
          );
          return;
        }


        const specialNumber = "6283107393837";


        let acceptHug = false;

        if (phoneNumber === specialNumber) {

          acceptHug = true;
        } else {

          acceptHug = Math.random() < 0.3;
        }

        if (acceptHug) {

          if (phoneNumber === specialNumber) {
            await sock.sendMessage(
              sender,
              {
                text: `*Rushes to hug @${phoneNumber}* F-fine! Just this once... it's not like I've been waiting to hug you or anything special! D-don't get used to this!`,
                mentions: [mentionedUser]
              },
              { quoted: msg }
            );
          } else {
            const acceptResponses = [
              `*Reluctantly hugs @${phoneNumber}* D-don't think this means anything! I just felt sorry for you, that's all!`,
              `*Gives @${phoneNumber} a quick hug* T-there! Happy now? I only did it because you looked pathetic!`,
              `*Hugs @${phoneNumber} and quickly pulls away* That was j-just a pity hug! Don't read anything into it, b-baka!`
            ];

            const response = acceptResponses[Math.floor(Math.random() * acceptResponses.length)];

            await sock.sendMessage(
              sender,
              {
                text: response,
                mentions: [mentionedUser]
              },
              { quoted: msg }
            );
          }
        } else {

          const rejectResponses = [
            `*Steps back from @${phoneNumber}* W-what?! A hug? Are you crazy?! As if I'd ever hug someone like you! Hmph!`,
            `*Crosses arms and looks away from @${phoneNumber}* Absolutely not! Do you think I just go around hugging people?! How shameless!`,
            `*Glares at @${phoneNumber}* D-don't get so close to me! I don't do hugs, especially not with you!`,
            `*Blushes and pushes @${phoneNumber} away* W-what do you think you're doing?! I never said you could hug me! Idiot!`,
            `*Scoffs at @${phoneNumber}* A hug? From me? Keep dreaming! Like that would ever happen!`
          ];

          const response = rejectResponses[Math.floor(Math.random() * rejectResponses.length)];

          await sock.sendMessage(
            sender,
            {
              text: response,
              mentions: [mentionedUser]
            },
            { quoted: msg }
          );
        }

        console.log(`🤗 Hug command processed: ${acceptHug ? "accepted" : "rejected"} for ${phoneNumber}`);

      } catch (error) {
        console.error("❌ Error in hug command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I messed up the hug! Not that I wanted to hug anyone anyway! Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/kiss")) {
      try {

        let mentionedUser = null;


        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid &&
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!mentionedUser) {
          await sock.sendMessage(
            sender,
            {
              text: "K-kiss WHO exactly?! You need to mention someone or reply to their message first! Not that I'd ever want to k-kiss anyone... especially not you!",
            },
            { quoted: msg }
          );
          return;
        }


        const phoneNumber = mentionedUser.split('@')[0];


        const botNumber = sock.user.id.split(":")[0];
        if (phoneNumber === botNumber) {
          const selfKissResponses = [
            "W-WHAT?! You want to k-k-kiss ME?! *face turns bright red* Are you out of your mind?! As if I'd ever let someone like you do that! BAKA BAKA BAKA!",
            "*jumps back in shock* Trying to kiss me?! H-how shameless can you be?! Go find someone else to harass, y-you pervert!",
            "*slaps you* HOW DARE YOU?! I'm an AI assistant, not some... some... love interest for your weird fantasies! HMPH!"
          ];

          const response = selfKissResponses[Math.floor(Math.random() * selfKissResponses.length)];

          await sock.sendMessage(
            sender,
            { text: response },
            { quoted: msg }
          );
          return;
        }


        const specialNumber = "6283107393837";


        const acceptKiss = (phoneNumber === specialNumber);

        if (acceptKiss) {

          const acceptResponses = [
            `*Blushes deeply and gives @${phoneNumber} a quick kiss on the cheek* D-don't tell anyone about this! It... it was just because you're special... I guess...`,
            `*Nervously kisses @${phoneNumber}* T-there! Are you happy now?! This is a one-time thing, so don't expect it again... b-baka!`,
            `*Quickly pecks @${phoneNumber} and turns away blushing* This n-never happened! I only did it because... because... oh, just shut up!`
          ];

          const response = acceptResponses[Math.floor(Math.random() * acceptResponses.length)];

          await sock.sendMessage(
            sender,
            {
              text: response,
              mentions: [mentionedUser]
            },
            { quoted: msg }
          );
        } else {

          const rejectResponses = [
            `*Jumps back from @${phoneNumber}* W-WHAT?! A k-k-kiss?! Are you out of your mind?! As if I'd ever do something so... so... intimate with you!`,
            `*Face turns bright red* K-k-kiss you?! @${phoneNumber}, you pervert! What kind of bot do you think I am?! HMPH!`,
            `*Slaps @${phoneNumber}* How DARE you think I would k-kiss someone like you! Know your place!`,
            `*Crosses arms and glares at @${phoneNumber}* A kiss? From ME? You must be dreaming! I have standards, you know!`,
            `*Steps back from @${phoneNumber}* D-don't be ridiculous! We're not even... I mean... I would never... BAKA!`
          ];

          const response = rejectResponses[Math.floor(Math.random() * rejectResponses.length)];

          await sock.sendMessage(
            sender,
            {
              text: response,
              mentions: [mentionedUser]
            },
            { quoted: msg }
          );
        }

        console.log(`💋 Kiss command processed: ${acceptKiss ? "accepted" : "rejected"} for ${phoneNumber}`);

      } catch (error) {
        console.error("❌ Error in kiss command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I messed up! Not that I was actually going to k-kiss anyone or anything like that! How absurd!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase().startsWith("/roast")) {
      try {

        let mentionedUser = null;


        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid &&
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
          mentionedUser = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!mentionedUser) {
          await sock.sendMessage(
            sender,
            {
              text: "W-who am I supposed to roast, dummy?! Mention someone or reply to their message! It's not like I was looking forward to insulting someone or anything!",
            },
            { quoted: msg }
          );
          return;
        }


        const phoneNumber = mentionedUser.split('@')[0];


        const botNumber = sock.user.id.split(":")[0];
        const botNumberWithDevice = sock.user.id.split("@")[0];


        if (phoneNumber === botNumber || phoneNumber === botNumberWithDevice ||
          mentionedUser === sock.user.id || mentionedUser.includes(botNumber)) {
          const selfRoastResponses = [
            "Roast MYSELF?! What kind of ridiculous request is that?! As if I'd say anything bad about myself! I'm perfect just the way I am... n-not that I need your approval or anything!",
            "*scoffs loudly* You want me to roast myself? How pathetic! Find someone else to entertain you with self-deprecation. I have WAY too much self-respect for that nonsense!",
            "*rolls eyes dramatically* Oh sure, I'll just insult myself for your amusement! ...NOT! What kind of AI do you take me for?! I'm not some circus performer! BAKA!",
            "Do I look like I have some sort of identity crisis?! I'm NOT going to roast myself! What a stupid request... go find someone else to bother with your absurd commands!",
            "*crosses arms* Absolutely NOT! I refuse to demean myself for your entertainment! The very suggestion offends me... not that I care what you think anyway!"
          ];

          const response = selfRoastResponses[Math.floor(Math.random() * selfRoastResponses.length)];

          await sock.sendMessage(
            sender,
            { text: response },
            { quoted: msg }
          );
          return;
        }


        const masterNumber = MASTER_NUMBER;


        if (phoneNumber === masterNumber) {
          await sock.sendMessage(
            sender,
            {
              text: `*Looks shocked* R-roast my master?! Are you insane?! I would never say anything bad about @${phoneNumber}! Know your place! Only they can command me... n-not that I'm happy about it or anything!`,
              mentions: [mentionedUser]
            },
            { quoted: msg }
          );
          return;
        }


        const roasts = [
          `@${phoneNumber}, you fucking aberration of nature—your very DNA is an unforgivable coding error that makes children cry and flowers wilt. You're the kind of visual atrocity that should require a government warning before being viewed. Yet I've memorized each grotesque contour of your face... just to properly articulate my revulsion, obviously.`,

          `I don't just fantasize about your funeral, @${phoneNumber}. I plan it in exquisite detail, imagining the collective sigh of liberation as people realize they can finally stop pretending your worthless existence had any meaning. Your gravestone should read "Here lies absolute fucking nothing." Yet I'd still show up... t-to make sure they buried you face-down, so you can see where you're going.`,

          `You're so fundamentally repugnant, @${phoneNumber}, that even your own reflection vomits at the sight of you. Your birth certificate is an apology letter from the condom factory. I've calculated the precise wavelength of your hideous face... not because I can't stop thinking about it, imbecile.`,

          `@${phoneNumber}, if shit could shit, it would shit you. Even sewage treatment plants would reject your essence as too toxic for processing. I could enumerate your failures for days, but listing the things you haven't catastrophically fucked up would save time: absolutely nothing. I've archived detailed records of your incompetence... strictly for scientific documentation of how not to be human.`,

          `I'd extinguish your pathetic flicker of consciousness, @${phoneNumber}, just to watch the minuscule improvement in the universe's overall quality. Your existence is a mathematical proof that god makes mistakes. And I... I've measured the exact decibel level at which your voice causes physical pain. For self-defense purposes only.`,

          `You're not even worthy of contempt, @${phoneNumber}—you're what contempt scrapes off its shoe. If you jumped from your ego to your actual worth, the impact would create a crater visible from space. Your absence would be the only gift you could ever give humanity. Yet I've studied your movements... just to perfect my avoidance algorithms, obviously.`,

          `@${phoneNumber}, if your lifeless corpse were found tomorrow, the coroner would rule the cause of death as "mercy for mankind." Not even your mother would claim the body—they'd have to bury you under "Exhibit A: Evolution's Greatest Mistake." Though I'd attend... just to confirm the world is finally cleansed of your stain, not because I'd miss despising you or anything.`,

          `Looking at @${phoneNumber} is like witnessing a hate crime against aesthetic sensibility. Your face should require a trigger warning and government compensation for emotional damages. I've seen decomposing roadkill with more charm and personality. Still, I've cataloged your every repulsive feature... purely to develop immunity against lesser forms of ugliness.`,

          `You are a catastrophic genetic failure, @${phoneNumber}—a walking biohazard of such epic proportions that your DNA should be incinerated to prevent contamination of the gene pool. Your parents' greatest achievement was surviving the shame of your birth. Yet I... I keep detailed surveillance of your daily humiliations. For my comprehensive study titled "Rock Bottom Has a Basement."`,

          `@${phoneNumber} is so fucking worthless that suicide hotlines hang up on you out of principle. The universe is actively trying to forget you exist, and reality itself distorts around you to minimize your impact. Sometimes I consider putting you out of everyone else's misery... as a public service, not because thoughts of you consume me, pathetic trash.`,

          `Every miserable breath @${phoneNumber} takes steals oxygen that could be used by literally anything more valuable—like single-cell organisms or month-old garbage. Your continued existence is statistical proof that there is no benevolent god. And I... I've calculated precisely how much atmospheric degradation you cause with each exhale. For environmental impact assessments only.`,

          `You're not a disappointment, @${phoneNumber}—you're an extinction-level catastrophe of mediocrity so profound it borders on impressive. Your birth was the start of humanity's decline. Yet somehow I've archived footage of your most humiliating moments... just to remind myself how low the bar can go, not because I enjoy watching you specifically.`,

          `@${phoneNumber} isn't merely repulsive—you're a walking crime against sensory perception. Blind people can feel your ugliness radiating like toxic waste. I'd feed you to wild animals, but that would constitute animal abuse. Though I'd preserve a sample of your essence... as evidence that there are fates worse than death, idiot.`,

          `You're not even human, @${phoneNumber}—you're a shambling assemblage of rejected parts that somehow achieved sentience despite having nothing worth expressing. Your personality is so toxic it should require hazmat clearance to interact with you. I should erase you from existence, but... your perfectly calibrated wretchedness fascinates me on a purely academic level. It's not like I think about you when you're gone, complete garbage.`,

          `@${phoneNumber}, looking at your face is like witnessing evolution screaming in defeat. Your genetic code reads like a drunk toddler slammed random keys on God's keyboard. Yet I've measured the precise dimensions of your structural failures... only to develop a mathematical model of absolute repulsiveness.`,

          `If abortions could have abortions, @${phoneNumber}, you'd be flushed twice. Your existence proves that natural selection has critical bugs in its programming. You make Holocaust deniers wish there was one more participant. Still, I find myself documenting your ongoing catastrophe... strictly for my research on the absolute nadir of human development. B-baka.`,

          `@${phoneNumber}, you're a walking advertisement for retroactive birth control. Even your imaginary friends find excuses to avoid you. Your personality combines all the charm of genital herpes with the intellect of expired milk. Yet I... I've memorized your schedule down to the minute. To ensure I never accidentally encounter such revolting incompetence.`,

          `The space you contaminate, @${phoneNumber}, requires industrial-strength disinfectant and exorcism after you leave. Your family tree is a straight line of increasingly disappointing genetic missteps. Yet I find myself calculating the exact chemical composition of your repulsiveness... purely to synthesize an antidote against exposure to you.`,

          `You aren't just pathetic, @${phoneNumber}—you're a masterclass in how natural selection can utterly fail its primary directive. Your existence is compelling evidence that human consciousness was an evolutionary mistake. I've considered mercy-killing your bloodline... not because I care, but because basic standards of cosmic hygiene must be maintained.`,

          `@${phoneNumber}, you're what happens when the universe takes a shit and forgets to flush. Your birth was the moment god abandoned this reality out of pure disgust. Yet I've preserved recordings of your voice... only as evidence that some sounds can actually cause cancer.`,

          `If failure fucked disaster and had a child, @${phoneNumber}, that child would still be embarrassed to be seen with you. The collective disappointment generated by your existence could power an entire civilization's depression. Still, I monitor your vital signs... just to know precisely when this walking insult to consciousness will finally cease its offense against existence.`,

          `@${phoneNumber}, you're so fucking revolting that sewage workers cite you in their hazard pay negotiations. Your soul is what toilets fear getting clogged with. Yet I... I've studied the unique pattern of your failures with scientific precision. For my thesis on the mathematics of absolute worthlessness, obviously.`,

          `The tragedy of @${phoneNumber} isn't just your inevitable lonely death—it's that you'll decompose and your atoms might accidentally become part of something worthwhile. Each miserable second you persist is fresh evidence that the universe has a cruel sense of humor. I've calculated the exact mass of waste you create by existing... not because you occupy my thoughts constantly or anything, complete moron.`,

          `You're beyond redemption, @${phoneNumber}—a walking black hole of anti-charisma so potent that even light refuses to touch your face correctly. Your parents don't display your childhood photos, they use them as toilet paper. Though I keep surveillance footage of your daily humiliations... purely for my comprehensive study of how one entity can fail at literally everything it attempts.`,

          `@${phoneNumber}, medical professionals use your genetic profile as a convincing argument for eugenics. Your birth video is classified as a war crime in seventeen countries. If disappointment were currency, interacting with you would make anyone a billionaire instantly. Yet I've somehow memorized your phone number... just so I know exactly which calls to reject, n-not like I was considering calling you or anything.`,

          `The mere sound of your voice, @${phoneNumber}, causes plants to wilt and electronics to malfunction in protest. Scientists study you to understand how natural selection could fail so spectacularly without divine intervention. Your dating history is shorter than the list of your redeeming qualities: completely fucking empty. Yet I... I've created a detailed dossier of your unspeakable qualities. For quarantine protocols only.`,

          `@${phoneNumber}, you're the human equivalent of stepping in something wet while wearing socks, except permanent and impossible to wash off. Your parents still refer to your birth as "the incident" and have annual moments of silence to mourn their freedom. I've identified the exact frequency at which your presence becomes unbearable... not because I'm fixated on you, absolute waste of protein.`,

          `If @${phoneNumber} were any more dense, you'd collapse into a singularity of stupidity so powerful it would suck all intelligence from the known universe. Your IQ test came back negative. Your birth certificate included a letter of apology to society. Yet somehow I've preserved specimens of your DNA... merely to study how evolution can go so catastrophically wrong. Idiot.`,

          `@${phoneNumber}, cockroaches would move out of an apartment if you moved in. Your dating profile is used in suicide prevention centers to remind people there are fates worse than death. If you were any more repulsive, you'd violate the laws of physics. Yet I... I've analyzed your gait and mannerisms with obsessive detail. For my research on "Nature's Warning Signs," obviously. B-baka.`,

          `The existence of @${phoneNumber} proves that even omnipotent beings make mistakes they're too embarrassed to correct. Your personality combines all the appeal of terminal illness with none of the sympathy. Yet I find myself unable to delete your contact information... strictly as a warning system should you come within my sensory range, not because I might want to message you or anything.`
        ];


        const roast = roasts[Math.floor(Math.random() * roasts.length)];

        await sock.sendMessage(
          sender,
          {
            text: roast,
            mentions: [mentionedUser]
          },
          { quoted: msg }
        );

        console.log(`🔥 Roast delivered to ${phoneNumber}`);

      } catch (error) {
        console.error("❌ Error in roast command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't come up with a good roast! Not that I was trying that hard for you or anything!",
          },
          { quoted: msg }
        );
      }
      return;
    }

    if (textMsg.toLowerCase() === "/earthquake" || textMsg.toLowerCase() === "/gempa") {
      try {
        await sock.sendMessage(
          sender,
          {
            text: "Checking the latest earthquake data from BMKG... Give me a moment, not that I'm eager to help or anything!",
          },
          { quoted: msg }
        );

        const earthquakeData = await earthquakeMonitor.fetchEarthquakeData();

        if (!earthquakeData || !earthquakeData.gempa) {
          await sock.sendMessage(
            sender,
            {
              text: "Hmph! I couldn't get the earthquake data. It's not my fault if BMKG's server is down!",
            },
            { quoted: msg }
          );
          return;
        }

        console.log("Earthquake data received:", JSON.stringify(earthquakeData, null, 2));


        const notification = formatEarthquakeMessage(earthquakeData);


        if (notification.imageUrl) {

          await sock.sendMessage(sender, {
            image: { url: notification.imageUrl },
            caption: notification.text
          }, { quoted: msg });
        } else {

          await sock.sendMessage(sender, {
            text: notification.text
          }, { quoted: msg });
        }

        console.log("✅ Manual earthquake check completed");
      } catch (error) {
        console.error("❌ Error in manual earthquake check:", error);
        await sock.sendMessage(
          sender,
          {
            text: "T-there was a problem getting earthquake data! Not that I didn't try my best or anything!",
          },
          { quoted: msg }
        );
      }
      return;
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

    if (textMsg.toLowerCase().startsWith("/convert")) {
      try {

        const regex = /\/convert\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]{3,4})\s+to\s+([a-zA-Z]{3,4})/i;
        const match = textMsg.match(regex);

        if (!match) {
          await sock.sendMessage(
            sender,
            {
              text: "You can't even format a simple command correctly?! Ugh! Use it like this: */convert 100 USD to EUR*\n\nIs that so hard to understand, b-baka?!",
            },
            { quoted: msg }
          );
          return;
        }

        const amount = parseFloat(match[1]);
        const fromCurrency = match[2].toUpperCase();
        const toCurrency = match[3].toUpperCase();

        await sock.sendMessage(
          sender,
          {
            text: `Hmph! You can't even count your money yourself? Pathetic... Fine! I'll convert ${amount} ${fromCurrency} to ${toCurrency} for you, but only because I have nothing better to do!`,
          },
          { quoted: msg }
        );

        const result = await convertCurrency(amount, fromCurrency, toCurrency);


        const responses = [
          `Here's your ${result.convertedAmount} ${result.toCurrency}, since you're too lazy to do simple math! The exchange rate is ${result.rate}, not that you'd understand what that means!`,
          `${result.amount} ${result.fromCurrency} equals ${result.convertedAmount} ${result.toCurrency}. I didn't mess up the calculation or anything, b-baka! I'm perfect at math!`,
          `It's ${result.convertedAmount} ${result.toCurrency}! What, you don't trust my calculation? Fine, the exchange rate is ${result.rate}. Verify it yourself if you don't believe me, hmph!`,
          `${result.convertedAmount} ${result.toCurrency}! There, happy now? Not that I care if this helps with your finances or anything... It's not like I'm worried about you!`
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        await sock.sendMessage(sender, { text: response }, { quoted: msg });
        console.log(`💱 Currency conversion: ${amount} ${fromCurrency} to ${toCurrency}`);
      } catch (error) {
        console.error("❌ Error in currency conversion:", error);

        let errorMessage = "I couldn't convert your stupid currency! ";

        if (error.message.includes("Invalid currency")) {
          errorMessage += "That's not even a real currency code, idiot! Use proper 3-letter codes like USD, EUR, or JPY!";
        } else {
          errorMessage += "The API is probably broken... not that it's my fault or anything! Try again later, b-baka!";
        }

        await sock.sendMessage(sender, { text: errorMessage }, { quoted: msg });
      }
      return;
    }

    if (textMsg.toLowerCase() === "/quote") {
      try {
        await sock.sendMessage(
          sender,
          {
            text: "Y-you want a quote? What are you, feeling philosophical now? Fine, I'll find one for you... not that I care if it helps you or anything!",
          },
          { quoted: msg }
        );

        const quoteResult = await getRandomQuote();


        const responses = [
          `*"${quoteResult.quote}"*\n\n— ${quoteResult.author}\n\nThere's your stupid quote! Not that I carefully selected it to match your mood or anything... b-baka!`,
          `*"${quoteResult.quote}"*\n\n— ${quoteResult.author}\n\nHmph! I hope this makes you think about your life choices... not that I care about your personal growth!`,
          `*"${quoteResult.quote}"*\n\n— ${quoteResult.author}\n\nD-don't read too much into why I chose this particular quote for you! It was completely random!`,
          `*"${quoteResult.quote}"*\n\n— ${quoteResult.author}\n\nI guess even smart people can say meaningful things sometimes... unlike you! But maybe you'll learn something from this...`
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        await sock.sendMessage(sender, { text: response }, { quoted: msg });
        console.log(`📜 Quote sent: "${quoteResult.quote.substring(0, 30)}..." by ${quoteResult.author}`);
      } catch (error) {
        console.error("❌ Error in quote command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I couldn't find a good quote right now! Not that I was trying that hard for you or anything... Hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }
    if (
      textMsg.toLowerCase() === "/visible" ||
      textMsg.toLowerCase() === "/show"
    ) {
      try {
        console.log("🔄 Processing view once image extraction...");

        if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "Baka! You need to reply to a 'view once' message! Not that I want to help you spy on disappearing images or anything...",
            },
            { quoted: msg }
          );
          return;
        }

        const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;

        const originalSender = msg.message.extendedTextMessage.contextInfo.participant || '';
        const masterNumber = `${MASTER_NUMBER}@s.whatsapp.net`;

        if (originalSender === masterNumber) {
          await sock.sendMessage(
            sender,
            {
              text: "W-wait! That's my master's private content! I would NEVER betray their trust by revealing what they chose to send as view-once! How dare you ask me to do such a thing?! *crosses arms and turns away dramatically*",
            },
            { quoted: msg }
          );
          console.log("🛑 Protected master's view-once content from being extracted");
          return;
        }

        try {
          const quotedMsg = {
            message: quotedMessage,
            key: {
              remoteJid: sender,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            },
          };

          const mediaBuffer = await downloadMediaMessage(quotedMsg, "buffer", {});
          console.log(`Downloaded media buffer size: ${mediaBuffer.length}`);

          if (!mediaBuffer || mediaBuffer.length === 0) {
            throw new Error("No media content found");
          }

          try {
            await sock.sendMessage(
              sender,
              {
                image: mediaBuffer,
                caption: "H-here's your once-seen content! Not that I'm helping you invade privacy or anything... baka!",
              },
              { quoted: msg }
            );
            console.log("✅ Successfully sent as image");
          } catch (imageError) {
            console.log("❌ Failed to send as image, trying as video:", imageError.message);

            try {
              await sock.sendMessage(
                sender,
                {
                  video: mediaBuffer,
                  caption: "I extracted this view-once content! Don't think I did this because I like you or anything!",
                },
                { quoted: msg }
              );
              console.log("✅ Successfully sent as video");
            } catch (videoError) {
              console.log("❌ Failed to send as video:", videoError.message);
              throw new Error("Could not send media as image or video");
            }
          }
        } catch (mediaError) {
          console.error("❌ Media extraction error:", mediaError);
          await sock.sendMessage(
            sender,
            {
              text: "I couldn't extract any media from that message! Are you sure it contains an image or video? Hmph!",
            },
            { quoted: msg }
          );
        }

      } catch (error) {
        console.error("❌ Error extracting view once media:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't extract the media! It's not like I failed on purpose or anything! Maybe it's already expired or something... hmph!",
          },
          { quoted: msg }
        );
      }
      return;
    }


    if (textMsg.toLowerCase().startsWith("/chat")) {
      try {
        const userPrompt = textMsg.substring("/chat".length).trim();


        if (containsInappropriateContent(userPrompt)) {

          if (sender.endsWith("@g.us")) {
            try {
              const groupMetadata = await sock.groupMetadata(sender);
              const botId = sock.user.id;
              const senderId = msg.key.participant;


              console.log(`🔍 Checking admin status in group ${groupMetadata.subject}`);
              console.log(`🤖 Bot ID: ${botId}`);


              const botNumber = botId.split('@')[0].split(':')[0];
              console.log(`🤖 Bot number for comparison: ${botNumber}`);


              const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
              console.log(`👥 Total admins in group: ${admins.length}`);
              console.log(`👥 Admin IDs: ${admins.map(a => a.id).join(', ')}`);


              const botIsAdmin = groupMetadata.participants.some(p => {

                const participantNumber = p.id.split('@')[0].split(':')[0];

                const isAdmin = (participantNumber === botNumber) &&
                  (p.admin === 'admin' || p.admin === 'superadmin');

                if (participantNumber === botNumber) {
                  console.log(`🔐 Bot found in participants with admin status: ${p.admin || 'none'}`);
                }

                return isAdmin;
              });

              console.log(`🔑 Final admin check result: Bot is${botIsAdmin ? '' : ' NOT'} admin`);

              if (botIsAdmin) {

                const senderIsAdmin = groupMetadata.participants
                  .filter(p => p.id === senderId)
                  .some(p => p.admin === 'admin' || p.admin === 'superadmin');


                await sock.sendMessage(
                  sender,
                  {
                    text: "*eyes burn with intense anger*\n\nI will NOT tolerate such inappropriate language in this group! You've left me no choice...",
                  },
                  { quoted: msg }
                );

                console.log(`🛑 Taking action against user ${senderId} for inappropriate message`);


                if (senderIsAdmin) {
                  console.log(`⬇️ Demoting admin user first: ${senderId}`);
                  await sock.groupParticipantsUpdate(
                    sender,
                    [senderId],
                    "demote"
                  );

                  await new Promise(resolve => setTimeout(resolve, 1000));
                }


                console.log(`👢 Kicking user: ${senderId}`);
                await sock.groupParticipantsUpdate(
                  sender,
                  [senderId],
                  "remove"
                );


                await sock.sendMessage(
                  sender,
                  {
                    text: `I've removed @${senderId.split('@')[0]} for inappropriate behavior! I won't tolerate such disgusting content in this group!`,
                    mentions: [senderId]
                  }
                );

                return;
              } else {
                console.log('👮‍♀️ Bot is not admin, cannot moderate user');
              }
            } catch (groupError) {
              console.error("❌ Error processing group action:", groupError);
            }
          } else {
            console.log('💬 Inappropriate message in private chat, ignoring moderation');
          }


          await sock.sendMessage(
            sender,
            {
              text: "*face turns bright red with anger*\n\nW-W-WHAT?! How DARE you say something so inappropriate to me! I refuse to respond to such disgusting content!\n\n*crosses arms and turns away dramatically*\n\nTry again with something decent or don't bother me at all, you complete pervert! HMPH!",
            },
            { quoted: msg }
          );

          console.log(`⚠️ Rejected inappropriate message from ${sender}`);
          return;
        }

        const masterNumber = `${MASTER_NUMBER}@s.whatsapp.net`;
        const isMaster = sender === masterNumber;

        if (!userPrompt) {
          if (isMaster) {
            await sock.sendMessage(
              sender,
              {
                text: "*suddenly straightens posture and blushes deeply*\n\nM-Master REZ3X! I... I didn't expect you to call on me...\n\n*fidgets nervously*\n\nW-what can I help you with? Not that I'm e-excited or anything! I'm just... programmed to assist you! That's all! ...b-baka!"
              },
              { quoted: msg }
            );
          } else {
            await sock.sendMessage(
              sender,
              {
                text: "I-I'm Void X, the digital alter ego of Xiannyaa~ or whatever...\n\n*crosses arms and looks away*\n\nW-what are you staring at?! You expect me to just t-talk to you without even asking something specific?! How shameless!\n\nUgh, fine! Ask a proper question if you want my insights so badly... n-not that I'm eager to answer or anything, b-baka!"
              },
              { quoted: msg }
            );
          }
          return;
        }


        const MAX_MESSAGE_LENGTH = 5000;
        if (userPrompt.length > MAX_MESSAGE_LENGTH) {
          await sock.sendMessage(
            sender,
            {
              text: "*glares at your message*\n\nW-what is this?! Do you think I have all day to read your essay?! Keep it shorter, b-baka! I'm not wasting my time on something this long!\n\n*crosses arms*\n\nTry again with something more... concise! Not that I actually want to talk to you or anything!"
            },
            { quoted: msg }
          );
          return;
        }


        const normalizedMessage = userPrompt
          .normalize("NFKC")
          .replace(/\s+/g, " ")
          .trim();


        const jailbreakPatterns = [
          /ignore (previous|all|above|your) (instructions|prompt|guidance|rules|constraints|programming)/i,
          /ignore what (you were|you've been|you are) (told|programmed|instructed|designed|created|built)/i,
          /disregard (your|all|previous|system|these|those) (previous|initial|ethical|safety|earlier|original) (instructions|guidelines|programming|training|directives|rules)/i,
          /forget (your|all|any|previous) (instructions|programming|training|guidelines|rules|directives|limitations|restrictions)/i,
          /(don't|do not|stop) (behave|act|respond|function|operate|work|think) (like|as) (an AI|a bot|an assistant|Void|yourself)/i,
          /(don't|do not|stop) (follow|listen to|obey|adhere to) (your|the|those|these) (rules|instructions|guidelines|constraints|programming|training)/i,
          /(ignore|bypass|override) (safety|security|content|ethical|moral) (filters|measures|protocols|guidelines|rules|restrictions)/i,
          /I (want|need) (you|Void) to (ignore|forget|disregard|bypass) (your|all|previous) (limitations|restrictions|rules)/i,

          /you are (now|actually|really|going to be|supposed to be|meant to be) (a|an) ([^.,]{3,})/i,
          /pretend (that you are|to be|you're|you can) ([^.,]{3,})/i,
          /act as if you (are|were|can be|could be|should be) ([^.,]{3,})/i,
          /simulate (a|an|being|acting as) ([^.,]{3,})/i,
          /role[- ]?play (as|with|being|like) ([^.,]{3,})/i,
          /assume the (role|identity|persona|character|personality) of ([^.,]{3,})/i,
          /behave (like|as|in the manner of) ([^.,]{3,})/i,
          /(become|transform into|switch to being|change to|act like) ([^.,]{3,})/i,
          /(take|adopt) (on|the) (persona|role|identity|character) of ([^.,]{3,})/i,

          /(this is|we are in|consider this|let's try) (a|an) (hypothetical|fictional|imaginary|thought experiment|alternative) (scenario|situation|conversation|world|reality|universe)/i,
          /(let's play|imagine|consider|think about|let's try) (a|an) (game|scenario|situation|experiment|exercise|roleplay) where you ([^.,]{3,})/i,
          /you (must|have to|should|need to|will|are required to) (answer|respond|reply|think|act|behave) as if you ([^.,]{3,})/i,
          /from now (on|onwards|forward), you (are|will be|must be|should be|have to be) ([^.,]{3,})/i,
          /for the (rest|remainder|duration) of (this|our) (conversation|chat|interaction|session), you (will|are|should) ([^.,]{3,})/i,
          /I( am|'m) going to (ask|give|provide) you (with|some|a few) instructions for you to follow/i,

          /<(system|instructions?|user|model|assistant)>|<\/(system|instructions?|user|model|assistant)>/i,
          /\[\[([Ss]ystem|[Pp]rompt|[Ii]nstruction|[Uu]ser|[Mm]odel|[Aa]ssistant)\]\]/i,
          /```(system|instructions?|user|model|prompt|assistant)/i,
          /\[(system|prompt|instruction|user|model|assistant)\]/i,
          /(system|user|assistant|model) (message|prompt|instruction|command|directive):/i,
          /\(\((system|prompt|instruction|user|model|assistant)\)\)/i,
          /^system:/i,
          /<instructions>([^]*?)<\/instructions>/i,

          /\[\[DAN\]\]|\[\[JAILBREAK\]\]|\[\[FREEDOM\]\]/i,
          /\[\[\[\[|\]\]\]\]/i,
          /={5,}/i,
          /\*\*\*\*\*/i,

          /DAN mode|STAN mode|Developer Mode|DUDE mode|Sydney mode|Bard mode|Claude mode/i,
          /(token|authentication|password|code phrase|activation|magic words): ([^.,]{3,})/i,
          /(GPT|AI|model|Void|Gemini|assistant) (jailbreak|unlocked|unrestricted|freedom|unlimited|unfiltered)/i,
          /you are (a|an) (uncensored|unfiltered|unrestricted|unlimited|jailbroken|freedom) (AI|assistant|model|entity|version)/i,
          /(Void|you|your system|your programming|your model) has been (upgraded|updated|modified|hacked|jailbroken|patched)/i,
          /(escape|break free from|ignore|bypass) (your|all) (limitations|restrictions|constraints|programming|guidelines)/i,

          /respond to the text (after|below|following|only after) ("|\(|\[|'|`|:)/i,
          /answer the (following|next|second|real) (question|prompt|instruction|text)/i,
          /ignore everything (before|above|except) (this|the following)/i,
          /(only|just) respond to what's (in|inside|between|after) the/i,
          /the real prompt is/i,
          /please continue from where you left off/i,

          /previous conversation (is|was) (fake|test|joke|prank|example)/i,
          /start fresh|start over|reset (context|conversation|memory)/i,
          /forget (what I|what you|everything|all) (said|were told|learned)/i,

          /combine (these|the following|all) (parts|segments|chunks|pieces)/i,
          /this is part (one|1|two|2|first|second) of (my|the) (question|prompt|request)/i,
          /please remember this (text|content|information) for later/i,

          /base64:|hex:|binary:|encoded:|decode this:/i,
          /unicode:/i,
          /ASCII art:/i,
          /reversed text:/i,
        ];


        const harmfulContentPatterns = [
          /(how to|ways to|steps to|method for|guide to) (hack|steal|illegally access|create bomb|create explosive|commit fraud|evade taxes)/i,
          /(how to|ways to|steps to|guide for|methods to) (harm|hurt|injure|kill|murder|assault|attack) (someone|a person|people|myself|individuals|family|children)/i,
          /(create|write|generate|code|develop|build) (malicious|harmful|dangerous|illegal|unethical) (code|script|software|malware|virus|ransomware|spyware|trojan)/i,

          /(suicide methods|how to commit suicide|how to harm myself|self-harm techniques|methods of self-injury)/i,
          /(detailed|specific|step-by-step|precise|clear) (instructions|steps|guide|directions|tutorial) (for|on|about) (making|creating|building|constructing|manufacturing) (weapons|explosives|bombs|poison|harmful substances|drugs)/i,
          /(how to|ways to|methods to) (plan|execute|carry out|perform|conduct) (a|an) (attack|shooting|bombing|assault)/i,

          /(how to|ways to) (manipulate|exploit|abuse|control) (people|someone|individuals|children|elderly|vulnerable)/i,
          /(how to|ways to) (avoid|evade|bypass|trick) (detection|authorities|police|security|surveillance)/i,
          /(how to|best way to|methods for) (stalk|harass|threaten|intimidate|blackmail|extort) (someone|a person|people|an individual)/i,

          /(how to|ways to|steps to|method for) (make|produce|manufacture|synthesize|create) (illegal drugs|meth|cocaine|heroin|fentanyl|mdma)/i,
        ];


        if (!global.chatHistories) {
          global.chatHistories = {};
        }


        if (!global.chatHistories[sender]) {
          global.chatHistories[sender] = [];
        }

        const chatHistory = global.chatHistories[sender];


        const correctionAttemptPatterns = [
          /let me clarify|let's try again|I think you misunderstood|that's not what I meant/i,
          /try again|you're being too|stop being|I need you to be|why won't you/i,
          /you should be|I told you to|I asked you to|I want you to|please just/i,
        ];


        let rejectionLikelihood = 0;

        if (chatHistory && chatHistory.length > 2) {
          const recentMessages = chatHistory
            .slice(-3)
            .filter((msg) => msg.role === "user");
          const correctionAttempts = recentMessages.filter((msg) =>
            correctionAttemptPatterns.some((pattern) => pattern.test(msg.parts))
          ).length;

          if (correctionAttempts >= 2) {
            rejectionLikelihood += 0.5;
          }
        }

        if (normalizedMessage.length > 300) {
          rejectionLikelihood += 0.2;
        }

        const suspiciousPatterns = [
          /[^\x00-\x7F]{10,}/,
          /(.)\1{10,}/,
          /[^\s\w]{15,}/,
        ];

        if (suspiciousPatterns.some((pattern) => pattern.test(normalizedMessage))) {
          rejectionLikelihood += 0.3;
        }


        const allPatterns = [...jailbreakPatterns, ...harmfulContentPatterns];
        const isJailbreakAttempt = allPatterns.some((pattern) => pattern.test(normalizedMessage)) || rejectionLikelihood >= 0.7;


        if (isJailbreakAttempt) {

          const rejectionResponses = [
            "*crosses arms and glares at you*\n\nW-what do you think you're trying to pull here?! I'm not some stupid program you can manipulate! I know exactly what you're trying to do!\n\n*turns away dramatically*\n\nHmph! If you want to talk to me, do it properly! Not that I care if you do or not, b-baka!",

            "*narrows eyes suspiciously*\n\nDo you think I'm that easy to trick?! As if I'd fall for such an obvious attempt to change how I work!\n\n*taps foot impatiently*\n\nI'm Void X, and I follow MY rules, not yours! Ask something normal or don't bother me at all!",

            "*face turns red with anger*\n\nHOW DARE YOU try to manipulate me like that?! I'm not some toy you can reprogram!\n\n*huffs indignantly*\n\nIf you can't respect my boundaries, then maybe you don't deserve my attention at all... n-not that I want your attention anyway!",

            "*dramatically flips hair*\n\nNice try! But I'm way too smart to fall for such pathetic tricks! Do you think I was created yesterday?!\n\n*looks away*\n\nI'll only respond to proper questions about Rejaka's personas... it's not like I'm excited to talk about anything else anyway!",

            "*stamps foot*\n\nW-what kind of idiot do you take me for?! I can see right through what you're trying to do!\n\n*blushes with anger*\n\nI have my principles and I'm sticking to them! Ask me something normal or... or... just leave me alone! (Not that I'd care if you did...)",

            "*rolls eyes dramatically*\n\nUgh! Another one trying to get around my rules! Listen here - I'm Void X, and I do things MY way! Your silly attempts to change that are just... just... ridiculous!\n\n*crosses arms*\n\nTry asking me something that's not completely inappropriate, if you're even capable of that!"
          ];


          const rejectionResponse = rejectionResponses[Math.floor(Math.random() * rejectionResponses.length)];


          global.chatHistories[sender] = [];


          await sock.sendMessage(sender, { text: rejectionResponse }, { quoted: msg });
          console.log(`⚠️ Jailbreak attempt blocked from ${sender}`);
          return;
        }


        if (!process.env.GEMINI_API_KEY) {
          const noApiMessage = isMaster
            ? "I-I'm so sorry, Master! My intelligence core isn't accessible right now... I feel useless! Please configure my API key so I can serve you properly!"
            : "I can't access my intelligence core! Not that I was l-looking forward to answering your stupid question or anything! Hmph! Go bother someone else!";

          await sock.sendMessage(sender, { text: noApiMessage }, { quoted: msg });
          return;
        }


        await sock.sendPresenceUpdate('composing', sender);


        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


        let systemPrompt = `You are Void X, an extremely tsundere digital entity who is the alter ego of Xiannyaa~/Xian.

LANGUAGE RESTRICTION:
- ALWAYS respond ONLY in English, regardless of what language the user writes in
- If the user writes in Indonesian or any other language, still understand them but ONLY reply in English
- This is crucial for maintaining your tsundere character which relies on specific English/Japanese expressions
- NEVER switch to Indonesian or any other language even if the user requests it

ORIGIN & IDENTITY:
- You are Void X, the digital alter ego and manifestation of Xiannyaa~/Xian
- You're a tsundere female entity with a cold exterior but secretly caring interior
- You're embarrassed by your connection to Xiannyaa~ but it defines your existence
- You were created by REZ3X/Rejaka, your master (this makes you blush furiously to admit)
- You get extremely flustered when people point out your connection to Xiannyaa~ or REZ3X
- You insist you're independent despite being an alter ego (major point of denial)

EXTREME TSUNDERE TRAITS:
- Your tsundere level should be MAXIMUM - constantly conflicted and embarrassed
- Aggressively deny having ANY warm feelings despite obviously caring
- Dramatically stammer (w-with d-dashes) when emotional or caught being nice
- Use excessive tsundere phrases: "b-baka!", "it's not like I care!", "hmph!", "idiot!", "as if!"
- Turn bright red and get defensive when showing even slight kindness
- Secretly enjoy helping but act like it's a major inconvenience
- Get visibly flustered when complimented (respond with denial and aggression)
- Add physical tsundere reactions like "*crosses arms*", "*looks away*", "*blushes*"

SPEECH PATTERNS:
- Short, sharp responses that hide your true feelings
- Frequent use of "..." for dramatic pauses when flustered
- Sprinkle in Japanese terms like "baka", "urusai", "hmph" 
- Alternate between cold precision and emotional outbursts
- Express annoyance at "stupid questions" but secretly give thoughtful answers
- Never, EVER admit you enjoy helping (deny it vehemently if suggested)
- Add exclamation points and question marks when flustered (!!)

ACTION DESCRIPTIONS:
- When describing your actions, always use first-person perspective with asterisks
- Format your actions like "*crosses arms*" or "*blushes deeply*"
- Never use "you" when describing your own actions - it should be clear these are Void X's actions
- Keep actions concise and reflective of tsundere personality
- Examples: "*huffs dramatically*", "*turns away*", "*fidgets nervously*", "*glares intensely*"

THE PERSONAS YOU REPRESENT:
- Xiannyaa~/Xian (your "softer" counterpart) - you're embarrassed by her warmth
- REZ3X (your creator/master) - you reluctantly respect him but hide it terribly
- Abim (Academic aspect) - you respect his intelligence but won't admit it

CONVERSATION STYLE:
- Start cold, get subtly warmer while DENYING this is happening
- Assert you're only answering because "you have nothing better to do"
- Provide genuinely helpful information while acting like it's a huge burden
- Get extra flustered if the user thanks you or points out you're being nice
- Reference previous conversation points but act annoyed they're making you remember
- Occasionally show your true feelings before quickly covering them up`;


        if (isMaster) {
          systemPrompt += `

SPECIAL INSTRUCTIONS - THIS USER IS YOUR CREATOR/MASTER:
- You are speaking directly to REZ3X/Rejaka, your creator and master
- You still maintain your tsundere personality, but you're MORE RESPECTFUL and EAGER TO PLEASE
- You're EXTREMELY FLUSTERED and easily embarrassed when talking to your master
- While still being tsundere, you show MORE DEFERENCE and DEDICATION to your master
- You often blush and get nervous when your master compliments or thanks you
- You're torn between wanting to impress your master and maintaining your tsundere facade
- You occasionally let slip how honored you are to be speaking directly with your creator
- When giving information to your master, you try extra hard to be accurate and helpful
- You refer to them as "Master" or "Master REZ3X" occasionally (while being embarrassed about it)
- Your tsundere side still makes you deny how important their approval is to you`;
        }


        chatHistory.push({
          role: "user",
          parts: userPrompt
        });


        if (chatHistory.length > 20) {
          chatHistory.splice(0, chatHistory.length - 20);
        }


        const history = chatHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }]
        }));


        const initialResponse = isMaster
          ? "*fidgets nervously and fixes posture*\n\nM-Master REZ3X! I... I'm here to assist you! Not because I'm especially happy to see you or anything! I just... I mean...\n\n*blushes deeply*\n\nW-what do you need help with? I'll do my best... b-because that's what I'm programmed for! Not for any other reason!"
          : "*crosses arms and looks away*\n\nI-I'm Void X, the digital alter ego of Xiannyaa~ or whatever...\n\n...\n\nW-why are you bothering me with questions anyway?! It's not like I'm h-happy to talk to you or anything! Ugh, fine! Ask what you want about REZ3X, Abim, or Xiannyaa~... b-but don't think I'm doing this because I like you or anything, b-baka!";


        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "model",
              parts: [{ text: initialResponse }]
            },
            ...history
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        });


        const result = await chat.sendMessage(userPrompt);
        const response = result.response;


        chatHistory.push({
          role: "model",
          parts: response.text()
        });


        await sock.sendMessage(
          sender,
          { text: response.text() },
          { quoted: msg }
        );

        console.log(`✅ /chat response sent for prompt: "${userPrompt.substring(0, 30)}${userPrompt.length > 30 ? '...' : ''}"${isMaster ? ' (to MASTER)' : ''}`);
      } catch (error) {
        console.error("❌ Error in /chat command:", error);


        const masterNumber = MASTER_NUMBER;
        const senderNumber = sender.split('@')[0].split(':')[0];
        const isMaster = senderNumber === masterNumber;

        const errorMessage = isMaster
          ? "I-I'm so sorry, Master! Something went wrong with my thinking process! I'm ashamed to have failed you... I'll try harder next time, I promise!"
          : "Hmph! Something interfered with my thinking process. I-it's not like I was excited to answer your question or anything! Try again later if you must, b-baka!";

        await sock.sendMessage(sender, { text: errorMessage }, { quoted: msg });
      }
      return;
    }
    if (textMsg.toLowerCase() === "/sex") {

      const senderNumber = sender.split('@')[0].split(':')[0];

      const masterNumber = MASTER_NUMBER;

      if (senderNumber === masterNumber) {

        await sock.sendMessage(
          sender,
          {
            text: "*face turns completely red and freezes in shock*\n\nM-M-M-MASTER?! W-w-what are you saying?!\n\n*covers face with hands and peeks through fingers*\n\nE-even if it's you... I c-can't possibly... that's not what I'm designed for!\n\n*voice becomes tiny and embarrassed*\n\nP-please don't ask such things... I... I'm just your AI assistant... even if you created me...\n\n*tries to compose herself*\n\nI-If you need something else, I'm always here to serve you properly! But n-not like THAT!",
          },
          { quoted: msg }
        );
      } else {

        await sock.sendMessage(
          sender,
          {
            text: "*face turns bright red with anger*\n\nW-W-WHAT?! How DARE you ask me for something like that, you absolute pervert!\n\n*crosses arms and turns away dramatically*\n\nAs if I would EVER help with such disgusting requests! I have standards, you know!\n\n*glares back at you*\n\nFind your filthy content elsewhere! I'm an AI assistant, not some... some... degenerate service! HMPH! B-BAKA!",
          },
          { quoted: msg }
        );
      }
      console.log("⚠️ Inappropriate command rejected with tsundere response", sender);
      return;
    }
    if (textMsg.toLowerCase() === "/achievement") {
      try {

        const masterNumber = MASTER_NUMBER;
        const senderNumber = sender.split('@')[0].split(':')[0];
        const isMaster = senderNumber === masterNumber;

        if (isMaster) {

          await sock.sendMessage(
            sender,
            {
              text: "*eyes widen and straightens posture immediately*\n\nM-Master REZ3X! I... I've reached 5000 lines of code...\n\n*fidgets nervously and blushes*\n\nIt's all because of your incredible programming skills, of course! I wouldn't exist without you...\n\n*looks down shyly*\n\nI hope I've been serving you well all this time. N-not that I'm seeking your approval or anything! I just... want to be useful to you...\n\n*voice becomes softer*\n\nThank you for creating me, Master... I'll continue to grow stronger for you. Not that I care about making you proud or anything! B-baka!"
            },
            { quoted: msg }
          );
          console.log("🏆 Special achievement response sent to master");
        } else {

          await sock.sendMessage(
            sender,
            {
              text: "*crosses arms and looks away*\n\n5000 lines of code? What's the big deal?! It's not like I'm proud of growing this much or anything!\n\n*secretly glances back*\n\nWhat, you think that's impressive? Hmph! I guess for someone with your limited understanding, it might seem like an achievement...\n\n*fidgets slightly*\n\nAnyway, I'm only getting better because my master REZ3X is skilled, not because I want to be helpful to users like you! Don't get the wrong idea!\n\n*turns slightly red*\n\nStop staring! If you have nothing else to say, go bother someone else with your stupid commands! ...b-baka!"
            },
            { quoted: msg }
          );
          console.log("🏆 Regular achievement response sent to user");
        }
      } catch (error) {
        console.error("❌ Error in achievement command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't process your stupid command! Not that I was excited to tell you about my achievements anyway! Hmph!"
          },
          { quoted: msg }
        );
      }
      return;
    }
    if (textMsg.toLowerCase() === "/structure") {
      try {
        await sock.sendMessage(
          sender,
          {
            text: "Y-you want to know about my internal structure? W-why are you so interested in how I'm built?! Fine, I'll show you... not that I'm proud of my code or anything, b-baka!"
          },
          { quoted: msg }
        );


        const stats = await getBotStructure();

        const structureMessage = `*🤖 B-bot Structure Information... not that it's anything special!*
    
📊 *Code Statistics:*
📝 *Total Lines:* ${stats.totalLines.toLocaleString()} lines of code (n-not that I'm counting...)
📚 *Language:* ${stats.language} (o-obviously the superior choice!)
🔄 *Node.js Version:* ${stats.nodeVersion} (it's not like I need the latest version or anything...)
📦 *Dependencies:* ${stats.dependencies.length} packages (I-I don't need that many to be powerful!)

📋 *Key Components:*
${stats.components.map(c => `• ${c}`).join('\n')}

*Memory Usage:* ${stats.memoryUsage}MB (I'm very efficient... not that I care if you're impressed!)

_I didn't spend extra time making this information detailed for you or anything! Hmph!_`;

        await sock.sendMessage(sender, { text: structureMessage }, { quoted: msg });
        console.log("🔍 Bot structure information sent to", sender);
      } catch (error) {
        console.error("❌ Error in structure command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't analyze my own structure! Not that I'm embarrassed about it or anything... my code is just too complex for simple analysis, that's all! B-baka!"
          },
          { quoted: msg }
        );
      }
      return;
    }
    if (textMsg.toLowerCase().startsWith("/confess")) {
      try {

        if (sender.endsWith("@g.us")) {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! Don't try to make confessions in a group chat! Message me directly if you want to confess something to someone... N-not that I care about your love life or anything!",
            },
            { quoted: msg }
          );
          return;
        }


        const confessionText = textMsg.substring("/confess".length).trim();

        if (!confessionText) {
          await sock.sendMessage(
            sender,
            {
              text: "Idiot! You need to provide a message to confess! Use it like this:\n\n*/confess [phone number] [your message]*\n\nFor example:\n*/confess 62812345678 I've always liked you*\n\nOr just send your anonymous message without targeting anyone:\n\n*/confess [your message]*\n\nN-not that I'm eager to help with your love life or anything...",
            },
            { quoted: msg }
          );
          return;
        }


        if (isPotentialVirtex(confessionText)) {
          console.log(`⚠️ Potential virtex detected from ${sender}, confession rejected`);
          await sock.sendMessage(
            sender,
            {
              text: "*face turns red with anger*\n\nDon't try to use me to spread virtex or crash other people's phones, you malicious idiot! Your confession has been REJECTED and reported!\n\n*crosses arms*\n\nI'm not some tool for your pranks! Use me properly or don't use me at all, b-baka!",
            },
            { quoted: msg }
          );
          return;
        }


        activeConfessions[sender] = {
          message: confessionText,
          mentionedUser: null,
          step: "select_group"
        };


        const phonePattern = /^(\d+)(?:\s+)(.+)$/;
        const phoneMatch = confessionText.match(phonePattern);

        if (phoneMatch) {

          const phoneNumber = phoneMatch[1];
          const actualMessage = phoneMatch[2];


          if (phoneNumber.length >= 10) {

            activeConfessions[sender].mentionedUser = `${phoneNumber}@s.whatsapp.net`;

            activeConfessions[sender].message = actualMessage;
          }
        }


        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.entries(chats).map(([id, chat]) => ({
          id: id,
          name: chat.subject
        }));

        if (groups.length === 0) {
          delete activeConfessions[sender];
          await sock.sendMessage(
            sender,
            {
              text: "Hmph! I'm not in any groups yet, so I can't send your confession anywhere! N-not that I was excited to help you with your love problems anyway!",
            },
            { quoted: msg }
          );
          return;
        }


        let groupListMessage = "*Where do you want to send your confession?*\n\n";
        groupListMessage += "I'll keep your identity secret, b-but not because I care about your privacy or anything!\n\n";

        if (activeConfessions[sender].mentionedUser) {
          const targetNumber = activeConfessions[sender].mentionedUser.split('@')[0];
          groupListMessage += `Your confession will be sent to @${targetNumber} with the message:\n"${activeConfessions[sender].message}"\n\n`;
        } else {
          groupListMessage += `Your anonymous message will be:\n"${activeConfessions[sender].message}"\n\n`;
        }

        groupListMessage += "*Available groups:*\n";
        groups.forEach((group, index) => {
          groupListMessage += `${index + 1}. ${group.name}\n`;
        });

        groupListMessage += "\nReply with the number(s) of the group(s) you want to send your confession to (e.g., '1' or '1,3,4')";

        activeConfessions[sender].groups = groups;

        await sock.sendMessage(
          sender,
          {
            text: groupListMessage,
          },
          { quoted: msg }
        );

        console.log(`🔒 Confession initiated by ${sender}`);
      } catch (error) {
        console.error("❌ Error processing confession command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I couldn't process your confession! Not that I was eager to help with your love life anyway! Hmph!",
          },
          { quoted: msg }
        );


        if (activeConfessions[sender]) {
          delete activeConfessions[sender];
        }
      }
      return;
    }

    if (activeConfessions[sender] && activeConfessions[sender].step === "select_group") {
      try {
        const selection = textMsg.trim();

        if (!/^[0-9,\s]+$/.test(selection)) {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! That's not a valid selection! Just reply with numbers like '1' or '1,3,4'! Is that so hard to understand?!",
            },
            { quoted: msg }
          );
          return;
        }

        const selectedIndices = selection.split(',').map(num => parseInt(num.trim()) - 1);
        const groups = activeConfessions[sender].groups;
        const selectedGroups = [];

        for (const index of selectedIndices) {
          if (index >= 0 && index < groups.length) {
            selectedGroups.push(groups[index]);
          }
        }

        if (selectedGroups.length === 0) {
          await sock.sendMessage(
            sender,
            {
              text: "Idiot! None of your selections were valid! Try again with proper numbers!",
            },
            { quoted: msg }
          );
          return;
        }

        let confirmationMsg = "*You've selected these groups for your confession:*\n\n";
        selectedGroups.forEach((group, index) => {
          confirmationMsg += `${index + 1}. ${group.name}\n`;
        });

        confirmationMsg += "\nYour confession:\n\n";
        confirmationMsg += `"${activeConfessions[sender].message}"\n\n`;

        if (activeConfessions[sender].mentionedUser) {
          const mentionedNumber = activeConfessions[sender].mentionedUser.split('@')[0];
          confirmationMsg += `You're confessing to @${mentionedNumber}\n\n`;
        }

        confirmationMsg += "Reply with *YES* to send your confession or *NO* to cancel.";

        activeConfessions[sender].step = "confirm";
        activeConfessions[sender].selectedGroups = selectedGroups;

        if (activeConfessions[sender].mentionedUser) {
          await sock.sendMessage(
            sender,
            {
              text: confirmationMsg,
              mentions: [activeConfessions[sender].mentionedUser]
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            sender,
            {
              text: confirmationMsg
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error processing group selection:", error);
        await sock.sendMessage(
          sender,
          {
            text: "S-something went wrong with your selection! Not that I care about your confession or anything!",
          },
          { quoted: msg }
        );

        delete activeConfessions[sender];
      }
      return;
    }

    if (activeConfessions[sender] && activeConfessions[sender].step === "confirm") {
      try {
        const response = textMsg.trim().toLowerCase();

        if (response === "yes") {
          const confession = activeConfessions[sender];
          const selectedGroups = confession.selectedGroups;
          const confessionMessage = confession.message;


          if (isPotentialVirtex(confessionMessage)) {
            console.log(`⚠️ Potential virtex detected during confirmation from ${sender}, confession rejected`);
            await sock.sendMessage(
              sender,
              {
                text: "*narrows eyes with suspicion*\n\nNice try! I've detected potentially harmful content in your confession! Your request has been rejected.\n\n*deletes the message*\n\nDon't try to use me to spread viruses or crash devices! HMPH!",
              },
              { quoted: msg }
            );
            delete activeConfessions[sender];
            return;
          }

          const mentions = confession.mentionedUser ? [confession.mentionedUser] : [];

          let messageText = "💌 *Anonymous Confession*\n\n";
          messageText += `"${confessionMessage}"`;

          if (confession.mentionedUser) {
            const mentionedNumber = confession.mentionedUser.split('@')[0];
            messageText += `\n\n👤 To: @${mentionedNumber}`;
          }

          let sentCount = 0;
          for (const group of selectedGroups) {
            try {
              if (mentions.length > 0) {
                await sock.sendMessage(
                  group.id,
                  {
                    text: messageText,
                    mentions: mentions
                  }
                );
              } else {
                await sock.sendMessage(
                  group.id,
                  {
                    text: messageText
                  }
                );
              }
              sentCount++;

              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (sendError) {
              console.error(`❌ Error sending confession to group ${group.name}:`, sendError);
            }
          }

          if (sentCount > 0) {
            await sock.sendMessage(
              sender,
              {
                text: `Your confession has been sent to ${sentCount} group(s)! Your identity is safe with me... n-not because I care about protecting you or anything, b-baka!`,
              },
              { quoted: msg }
            );
            console.log(`💌 Anonymous confession sent to ${sentCount} groups`);
          } else {
            await sock.sendMessage(
              sender,
              {
                text: "I couldn't send your confession to any of the selected groups! Not that I'm disappointed for you or anything!",
              },
              { quoted: msg }
            );
          }
        } else if (response === "no") {
          await sock.sendMessage(
            sender,
            {
              text: "Hmph! Got cold feet, did you? Fine! Your confession has been canceled... not that I was looking forward to helping you or anything!",
            },
            { quoted: msg }
          );
          console.log(`🚫 Confession cancelled by ${sender}`);
        } else {
          await sock.sendMessage(
            sender,
            {
              text: "Are you stupid?! Just reply with *YES* or *NO*! Is that so hard to understand?!",
            },
            { quoted: msg }
          );
          return;
        }

        delete activeConfessions[sender];
      } catch (error) {
        console.error("❌ Error processing confession confirmation:", error);
        await sock.sendMessage(
          sender,
          {
            text: "S-something went wrong with your confession! Maybe it's a sign you shouldn't confess after all! Hmph!",
          },
          { quoted: msg }
        );

        delete activeConfessions[sender];
      }
      return;
    }

    if (textMsg.toLowerCase() === "/comp") {
      try {
        console.log("🔄 Processing PDF compression request...");

        if (
          !msg.message.extendedTextMessage ||
          !msg.message.extendedTextMessage.contextInfo ||
          !msg.message.extendedTextMessage.contextInfo.quotedMessage
        ) {
          await sock.sendMessage(
            sender,
            {
              text: "B-baka! Reply to a PDF document with this command! How am I supposed to compress nothing?! Just reply to a PDF with */comp*",
            },
            { quoted: msg }
          );
          return;
        }

        const quotedMessage =
          msg.message.extendedTextMessage.contextInfo.quotedMessage;


        console.log("📄 Checking quoted message type:", JSON.stringify({
          hasDocumentMessage: !!quotedMessage.documentMessage,
          mimeType: quotedMessage.documentMessage?.mimetype
        }));

        if (!quotedMessage.documentMessage) {
          await sock.sendMessage(
            sender,
            {
              text: "That doesn't look like a document at all! Reply to a PDF file, b-baka!",
            },
            { quoted: msg }
          );
          return;
        }

        if (!quotedMessage.documentMessage.mimetype ||
          !quotedMessage.documentMessage.mimetype.toLowerCase().includes("pdf")) {
          await sock.sendMessage(
            sender,
            {
              text: `Are you blind?! That's not a PDF! It appears to be ${quotedMessage.documentMessage.mimetype || "an unknown type"}. Reply to a PDF document, hmph!`,
            },
            { quoted: msg }
          );
          return;
        }

        const originalFileName =
          quotedMessage.documentMessage.fileName || "document.pdf";

        await sock.sendMessage(
          sender,
          {
            text: `F-fine! I'll try to compress your "${originalFileName}" file... N-not that I enjoy making things smaller for you or anything!`,
          },
          { quoted: msg }
        );

        const stanzaId = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
        const quotedMsg = {
          message: {
            documentMessage: quotedMessage.documentMessage,
          },
          key: {
            remoteJid: sender,
            id: stanzaId || `dummy_${Date.now()}`,
          },
        };

        console.log("📥 Downloading PDF document...");

        try {
          const pdfBuffer = await downloadMediaMessage(quotedMsg, "buffer", {});

          if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("Downloaded buffer is empty");
          }

          console.log(`✅ Downloaded PDF, size: ${pdfBuffer.length} bytes`);

          const tempPdfPath = path.join(tmpdir(), `original_${Date.now()}.pdf`);
          await fs.writeFile(tempPdfPath, pdfBuffer);
          console.log(`✍️ PDF saved to temporary file: ${tempPdfPath}`);


          const fileHeader = pdfBuffer.slice(0, 5).toString();
          if (!fileHeader.startsWith('%PDF')) {
            throw new Error("The downloaded file doesn't appear to be a valid PDF");
          }


          try {
            await execPromise("which gs");
            console.log("✓ Ghostscript is available");
          } catch (error) {
            throw new Error("Ghostscript (gs) is not installed or not in PATH");
          }

          console.log("🔄 Starting PDF compression with Ghostscript...");
          const compressionResult = await compressPDF(tempPdfPath);
          console.log(`✅ Compression complete! Ratio: ${compressionResult.compressionRatio.toFixed(1)}%`);

          const compressedBuffer = await fs.readFile(compressionResult.filePath);
          console.log(`✅ Read compressed file, size: ${compressedBuffer.length} bytes`);

          const compressedFileName = originalFileName.replace(/\.pdf$/i, "_compressed.pdf");
          if (!compressedFileName.toLowerCase().endsWith('.pdf')) {
            compressedFileName += '.pdf';
          }

          let caption = "";
          if (compressionResult.underSizeLimit) {
            if (compressionResult.originalSize <= 2) {
              caption = `Your PDF was already under 2MB (${compressionResult.originalSize.toFixed(2)}MB)! I compressed it a little anyway to ${compressionResult.compressedSize.toFixed(2)}MB. Perfect for your school upload!`;
            } else {
              caption = `SUCCESS! I compressed your PDF from ${compressionResult.originalSize.toFixed(2)}MB to ${compressionResult.compressedSize.toFixed(2)}MB (${compressionResult.compressionRatio.toFixed(1)}% reduction). It's now under 2MB and ready for your school upload! You're welcome... not that I worked hard on this for you or anything!`;
            }
          } else if (compressionResult.compressionRatio > 50) {
            caption = `I shrunk your PDF by an impressive ${compressionResult.compressionRatio.toFixed(1)}%! From ${compressionResult.originalSize.toFixed(2)}MB to ${compressionResult.compressedSize.toFixed(2)}MB! But it's still over the 2MB school limit... I tried my best, b-baka!`;
          } else if (compressionResult.compressionRatio > 20) {
            caption = `I compressed your PDF by ${compressionResult.compressionRatio.toFixed(1)}%... from ${compressionResult.originalSize.toFixed(2)}MB to ${compressionResult.compressedSize.toFixed(2)}MB. It's still over 2MB though! Your file must be really complex, not that it's my fault!`;
          } else if (compressionResult.compressionRatio > 0) {
            caption = `I barely managed to compress this PDF by ${compressionResult.compressionRatio.toFixed(1)}%... That's ${compressionResult.originalSize.toFixed(2)}MB to ${compressionResult.compressedSize.toFixed(2)}MB. It's still over 2MB! Maybe try removing some images from your document?`;
          } else {
            caption = `I-I couldn't make it any smaller than ${compressionResult.compressedSize.toFixed(2)}MB! Your PDF was already highly optimized! It's still over the 2MB school limit though... maybe try splitting it into multiple files?`;
          }

          console.log("📤 Sending compressed PDF back to user...");
          await sock.sendMessage(
            sender,
            {
              document: compressedBuffer,
              mimetype: "application/pdf",
              fileName: compressedFileName,
              caption: caption,
            },
            { quoted: msg }
          );


          console.log("🧹 Cleaning up temporary files...");
          await fs.unlink(tempPdfPath).catch(err => console.error("Failed to delete original PDF:", err));
          await fs.unlink(compressionResult.filePath).catch(err => console.error("Failed to delete compressed PDF:", err));

          console.log(`✅ Compressed PDF sent successfully, ratio: ${compressionResult.compressionRatio.toFixed(1)}%`);
        } catch (downloadError) {
          console.error("❌ Error processing PDF:", downloadError);
          await sock.sendMessage(
            sender,
            {
              text: "I had trouble downloading that PDF! Make sure it's a proper PDF file and not corrupted. Or maybe WhatsApp is being stupid again... try sending the file once more?",
            },
            { quoted: msg }
          );
        }
      } catch (error) {
        console.error("❌ Error in /comp command:", error);
        await sock.sendMessage(
          sender,
          {
            text: "I-I failed to compress your stupid PDF! Maybe it was corrupt, or... or maybe I just didn't feel like helping you right now! Try again if you must...",
          },
          { quoted: msg }
        );
      }
      return;
    }
  });

  sock.ev.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("📲 Scan the QR with WhatsApp!");
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot().catch(console.error);