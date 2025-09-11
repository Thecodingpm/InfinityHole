#!/bin/bash

# Snaptube-like Video Downloader
echo "🎬 Snaptube-like Video Downloader"
echo "=================================="

# Navigate to backend directory and activate virtual environment
cd "$(dirname "$0")/backend"
source venv/bin/activate

# Go back to root and run the downloader
cd ..
python3 snaptube.py "$@"

