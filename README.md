# InfinityHole 🕳️

A powerful YouTube and video downloader with a beautiful, modern web interface. Download videos and audio from YouTube, Instagram, TikTok, Vimeo, and more!

## ✨ Features

### 🎬 Video Downloads
- **Multiple Formats**: WebM, MP4, and other video formats
- **Quality Selection**: Choose from available video qualities
- **Format Detection**: Automatic format detection and selection

### 🎵 Audio Downloads
- **MP3 Support**: High-quality MP3 audio extraction
- **AAC Support**: AAC audio format support
- **Audio Playback**: Built-in audio player with volume control

### 🎨 Modern UI
- **Beautiful Interface**: Glass-morphism design with dark theme
- **Format Selection**: Interactive format selection modal
- **Progress Tracking**: Dynamic progress bar with real-time updates
- **Download History**: View and manage your recent downloads

### 📱 User Experience
- **Clipboard Integration**: Auto-detect URLs from clipboard
- **Recent Downloads**: Access your download history
- **Audio Controls**: Volume slider and playback controls
- **Responsive Design**: Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Thecodingpm/InfinityHole.git
   cd InfinityHole
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env file with your settings
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **yt-dlp**: Powerful video downloader
- **Uvicorn**: ASGI server

### Frontend
- **HTML5**: Modern web standards
- **CSS3**: Advanced styling with animations
- **JavaScript**: Interactive functionality
- **LocalStorage**: Download history persistence

## 📋 Supported Platforms

- ✅ YouTube (youtube.com, youtu.be)
- ✅ Instagram
- ✅ TikTok
- ✅ Vimeo
- ✅ Twitter/X
- ✅ And many more via yt-dlp

## 🎯 Usage

1. **Paste URL**: Enter any supported video URL
2. **Select Format**: Choose video or audio format
3. **Download**: Watch the beautiful progress bar
4. **Enjoy**: Access your downloads from history

## 🔧 Configuration

### Environment Variables
```env
ALLOWED_DOMAINS=youtube.com,youtu.be,instagram.com,tiktok.com,vimeo.com,twitter.com,x.com
```

### Customization
- Modify `backend/static/index.html` for UI changes
- Update `backend/main.py` for backend functionality
- Configure `backend/.env` for environment settings

## 📁 Project Structure

```
InfinityHole/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── static/
│   │   └── index.html      # Web interface
│   ├── downloads/          # Downloaded files
│   └── .env               # Environment configuration
├── frontend/              # Flutter mobile app (optional)
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The amazing video downloader
- [FastAPI](https://fastapi.tiangolo.com/) - The modern Python web framework
- All the open-source contributors who made this possible

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Thecodingpm/InfinityHole/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Made with ❤️ by [Thecodingpm](https://github.com/Thecodingpm)**

*Download videos like never before with InfinityHole!* 🚀