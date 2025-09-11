# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.11+
- Flutter SDK 3.0+
- FFmpeg
- Docker (optional)

### Option 1: Automated Setup

```bash
# Run the setup script
./setup.sh
```

### Option 2: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
python main.py
```

#### 2. Frontend Setup
```bash
cd frontend/video_downloader
flutter pub get
flutter run
```

### Option 3: Docker Setup
```bash
cd backend
docker-compose up --build
```

## 🎯 How to Use

1. **Start the backend** (API server)
2. **Launch the Flutter app**
3. **Accept the legal disclaimer**
4. **Paste a video URL** (YouTube, Instagram, TikTok, etc.)
5. **Tap "Extract Info"** to get available formats
6. **Choose MP4 or MP3** output format
7. **Select quality** from the list
8. **Tap "Download"** to start downloading
9. **View downloads** in the downloads screen

## 🔧 Configuration

### Backend API URL
Edit `frontend/video_downloader/lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://localhost:8000';
```

### Environment Variables
Edit `backend/.env`:
```env
STORAGE_DIR=./downloads
CLEANUP_INTERVAL_HOURS=2
HOST=0.0.0.0
PORT=8000
MAX_FILE_SIZE_MB=500
```

## 📱 Supported Platforms

- ✅ **Android** (API 21+)
- ✅ **Windows** (Windows 10+)
- ✅ **macOS** (macOS 10.14+)

## 🎬 Supported Video Sources

- YouTube
- Instagram
- TikTok
- Vimeo
- Twitter/X
- And many more via yt-dlp

## ⚖️ Legal Notice

**IMPORTANT**: This app is for educational purposes. Users must:
- Own rights to downloaded content
- Comply with copyright laws
- Respect platform terms of service
- Use content responsibly

## 🆘 Troubleshooting

### Backend Issues
- **FFmpeg not found**: Install FFmpeg
- **Port in use**: Change PORT in .env
- **Permission denied**: Check file permissions

### Frontend Issues
- **Network error**: Check backend is running
- **Permission denied**: Grant storage permissions
- **Download failed**: Check storage space

### Common Commands
```bash
# Check backend health
curl http://localhost:8000/health

# View backend logs
cd backend && python main.py

# Flutter doctor
flutter doctor

# Clean Flutter build
flutter clean && flutter pub get
```

## 📚 Documentation

- [Main README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## 🎉 You're Ready!

The app should now be running. Start with a simple YouTube video URL to test the functionality.

