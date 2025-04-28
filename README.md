<img src="astolfo.png" alt="Void X Bot" width="300" height="auto">

## Features

- **Media Processing**: Convert images to stickers, stickers to images
- **AI Integration**: Chat with Gemini AI, generate and edit images with AI
- **Entertainment**: Truth or Dare games, compatibility tests, roasts
- **Utility**: Weather updates, currency conversion, earthquake alerts
- **Information**: Class schedules, cleaning duty reminders
- **Downloads**: YouTube videos/audio, TikTok videos
- **File Conversion**: Convert documents to PDF

## Prerequisites

### Linux Packages

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm git ffmpeg libwebp-dev imagemagick libreoffice

# Fedora
sudo dnf install -y nodejs npm git ffmpeg libwebp-devel ImageMagick libreoffice

# Arch Linux
sudo pacman -S nodejs npm git ffmpeg libwebp imagemagick libreoffice
```

### Node.js Requirements

- Node.js v14+ (v16+ recommended)
- NPM v7+

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/whatsapp-bot.git
cd whatsapp-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

```bash
cp .env.example .env
```

4. **Configure your environment variables**

Open .env file and add your API keys and other configurations:

```
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Bot Configuration
MASTER_NUMBER=your_whatsapp_number_here

# Cleaning Schedule (JSON format)
CLEANING_SCHEDULE_SENIN='[{"name":"Name1","number":"628xxxxxxxxx"},{"name":"Name2","number":"628xxxxxxxxx"}]'
CLEANING_SCHEDULE_SELASA='[{"name":"Name3","number":"628xxxxxxxxx"},{"name":"Name4","number":"628xxxxxxxxx"}]'
CLEANING_SCHEDULE_RABU='[{"name":"Name5","number":"628xxxxxxxxx"},{"name":"Name6","number":"628xxxxxxxxx"}]'
CLEANING_SCHEDULE_KAMIS='[{"name":"Name7","number":"628xxxxxxxxx"},{"name":"Name8","number":"628xxxxxxxxx"}]'
CLEANING_SCHEDULE_JUMAT='[{"name":"Name9","number":"628xxxxxxxxx"},{"name":"Name10","number":"628xxxxxxxxx"}]'

# Earthquake Notification
EARTHQUAKE_NOTIFY_GROUPS='["groupid@g.us"]'
```

## Running with PM2 (Recommended for Production)

1. **Install PM2 globally**

```bash
npm install -g pm2
```

2. **Start the bot with PM2**

```bash
pm2 start index.js --name "whatsapp-bot"
```

3. **Set PM2 to start on system boot**

```bash
pm2 startup
pm2 save
```

4. **Basic PM2 commands**

```bash
# Check bot status
pm2 status

# View logs
pm2 logs whatsapp-bot

# Restart bot
pm2 restart whatsapp-bot

# Stop bot
pm2 stop whatsapp-bot

# Delete from PM2
pm2 delete whatsapp-bot
```

## First-Time Setup

1. Start the bot: `node index.js` (or use PM2 as described above)
2. Scan the QR code with WhatsApp (WhatsApp Web > Link Device)
3. The bot is now connected and will respond to commands

## Available Commands

The bot offers over 30 commands, including:

- `/sticker` or `/s` - Convert image or GIF to sticker
- `/toimage` or `/img` - Convert sticker to image
- `/tagall` - Tag everyone in the group
- `/weather [location]` - Get weather information
- `/freegame` - Show currently available free games
- `/truth` - Get a random truth question
- `/dare` - Get a random dare challenge
- `/chat [message]` - Chat with Void X AI
- `/ytdl [URL]` - Download YouTube videos
- `/tiktokdl [URL]` - Download TikTok videos
- `/generate [prompt]` - Generate AI images
- `/edit [instructions]` - Edit images with AI
- `/earthquake` - Check latest earthquake data

For a complete list, use the `/menu` or `/help` command.

## Earthquake Monitoring

To enable earthquake monitoring:
1. Set up the `EARTHQUAKE_NOTIFY_GROUPS` in the .env file
2. The bot will periodically check for earthquake data from BMKG (Indonesian meteorology agency)
3. When an earthquake is detected, notifications will be sent to the specified groups

## Troubleshooting

### Authentication Issues
If you encounter authentication issues:
```bash
# Delete the auth_info directory and try again
rm -rf auth_info
node index.js
```

### Media Processing Errors
If you experience issues with sticker creation or media conversion:
```bash
# Verify ffmpeg is properly installed
ffmpeg -version

# Install additional codecs
sudo apt install -y ffmpeg-extras
```

### Connection Problems
If the bot disconnects frequently:
```bash
# Check your internet connection
# Ensure the proper ports are open
# Verify WhatsApp isn't connected to too many devices
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Baileys](https://github.com/whiskeysockets/baileys) for the WhatsApp Web API
- Google Gemini for AI integration
- All the open source packages that made this project possible

---

*Void X is not affiliated with WhatsApp Inc. Use at your own risk.*