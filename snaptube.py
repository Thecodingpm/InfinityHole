#!/usr/bin/env python3
"""
Snaptube-like Video Downloader
Super simple - just paste URL and download!
"""

import os
import sys
import yt_dlp
from pathlib import Path

def download_video(url):
    """Download video like Snaptube - just paste URL and go!"""
    
    # Create Downloads folder in user's home directory
    downloads_path = Path.home() / "Downloads"
    downloads_path.mkdir(exist_ok=True)
    
    print("🎬 Snaptube-like Video Downloader")
    print("=" * 40)
    print(f"📺 URL: {url}")
    print(f"📁 Saving to: {downloads_path}")
    print()
    
    # Simple yt-dlp configuration
    ydl_opts = {
        'outtmpl': str(downloads_path / '%(title)s.%(ext)s'),
        'format': 'best[height<=720]',  # Good quality but not too big
        'noplaylist': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info
            print("🔍 Getting video info...")
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown Video')
            duration = info.get('duration', 0)
            
            print(f"📺 Title: {title}")
            if duration:
                minutes = duration // 60
                seconds = duration % 60
                print(f"⏱️  Duration: {minutes}:{seconds:02d}")
            
            print()
            print("⬇️  Downloading...")
            
            # Download the video
            ydl.download([url])
            
            print()
            print("✅ Download completed!")
            print(f"📁 Video saved in: {downloads_path}")
            print(f"📱 You can find it in your Downloads folder!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Try a different video URL or check your internet connection")

def download_audio(url):
    """Download audio as MP3"""
    
    downloads_path = Path.home() / "Downloads"
    downloads_path.mkdir(exist_ok=True)
    
    print("🎵 Audio Downloader")
    print("=" * 40)
    print(f"🎵 URL: {url}")
    print(f"📁 Saving to: {downloads_path}")
    print()
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': str(downloads_path / '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'noplaylist': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("🔍 Getting audio info...")
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown Audio')
            
            print(f"🎵 Title: {title}")
            print()
            print("⬇️  Downloading audio...")
            
            ydl.download([url])
            
            print()
            print("✅ Audio download completed!")
            print(f"📁 MP3 saved in: {downloads_path}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    if len(sys.argv) < 2:
        print("🎬 Snaptube-like Video Downloader")
        print("=" * 40)
        print()
        print("Usage:")
        print("  python3 snaptube.py <video_url>")
        print("  python3 snaptube.py <video_url> --audio")
        print()
        print("Examples:")
        print("  python3 snaptube.py https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        print("  python3 snaptube.py https://www.youtube.com/watch?v=dQw4w9WgXcQ --audio")
        print()
        return
    
    url = sys.argv[1]
    
    if len(sys.argv) > 2 and sys.argv[2] == '--audio':
        download_audio(url)
    else:
        download_video(url)

if __name__ == "__main__":
    main()

