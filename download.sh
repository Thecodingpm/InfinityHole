#!/bin/bash

# Simple Video Downloader Launcher
echo "🎬 Simple Video Downloader - Like Snaptube"
echo "=========================================="

# Navigate to backend directory and activate virtual environment
cd "$(dirname "$0")/backend"
source venv/bin/activate

# Go back to root and run the downloader
cd ..
python3 simple_downloader.py "$@"

