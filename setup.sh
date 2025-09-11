#!/bin/bash

# Video Downloader Setup Script
echo "🎬 Setting up Video Downloader Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "⚠️  Flutter is not installed. Please install Flutter SDK 3.0+ first."
    echo "   Visit: https://flutter.dev/docs/get-started/install"
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg is not installed. Please install FFmpeg first."
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt install ffmpeg"
    echo "   Windows: Download from https://ffmpeg.org/download.html"
fi

echo "📦 Setting up backend..."

# Navigate to backend directory
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file. You can edit it to customize settings."
fi

# Create downloads directory
mkdir -p downloads

echo "✅ Backend setup complete!"

# Navigate back to root
cd ..

echo "📱 Setting up Flutter frontend..."

# Navigate to Flutter app directory
cd frontend/video_downloader

# Install Flutter dependencies
if command -v flutter &> /dev/null; then
    echo "Installing Flutter dependencies..."
    flutter pub get
    echo "✅ Flutter setup complete!"
else
    echo "⚠️  Flutter not found. Please install Flutter and run 'flutter pub get' manually."
fi

# Navigate back to root
cd ../..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "2. Start the Flutter app (in a new terminal):"
echo "   cd frontend/video_downloader"
echo "   flutter run"
echo ""
echo "3. Or use Docker for the backend:"
echo "   cd backend"
echo "   docker-compose up --build"
echo ""
echo "📚 Check the README.md files for detailed documentation."
echo "⚖️  Remember to comply with copyright laws and platform terms of service!"

