#!/usr/bin/env python3
"""
Simple Video Downloader - Like Snaptube
Just paste URL and download directly to your device
"""

import os
import sys
import yt_dlp
import subprocess
from pathlib import Path
import argparse

def download_video(url, output_dir="Downloads", format_choice="best"):
    """
    Download video from URL to device
    """
    # Create downloads directory
    downloads_path = Path.home() / output_dir
    downloads_path.mkdir(exist_ok=True)
    
    print(f"🎬 Downloading video from: {url}")
    print(f"📁 Saving to: {downloads_path}")
    
    # yt-dlp options
    ydl_opts = {
        'outtmpl': str(downloads_path / '%(title)s.%(ext)s'),
        'format': format_choice,
        'noplaylist': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info first
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            duration = info.get('duration', 0)
            
            print(f"📺 Title: {title}")
            if duration:
                print(f"⏱️  Duration: {duration//60}:{duration%60:02d}")
            
            # Download the video
            print("⬇️  Starting download...")
            ydl.download([url])
            
            print("✅ Download completed!")
            print(f"📁 File saved in: {downloads_path}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

def download_audio(url, output_dir="Downloads"):
    """
    Download audio only (MP3)
    """
    downloads_path = Path.home() / output_dir
    downloads_path.mkdir(exist_ok=True)
    
    print(f"🎵 Downloading audio from: {url}")
    print(f"📁 Saving to: {downloads_path}")
    
    # yt-dlp options for audio
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
            # Get video info first
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            print(f"🎵 Title: {title}")
            print("⬇️  Starting audio download...")
            
            ydl.download([url])
            
            print("✅ Audio download completed!")
            print(f"📁 MP3 saved in: {downloads_path}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

def main():
    print("🎬 Simple Video Downloader - Like Snaptube")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        # Command line mode
        parser = argparse.ArgumentParser(description='Download videos like Snaptube')
        parser.add_argument('url', help='Video URL to download')
        parser.add_argument('--audio', '-a', action='store_true', help='Download audio only (MP3)')
        parser.add_argument('--output', '-o', default='Downloads', help='Output directory (default: Downloads)')
        parser.add_argument('--format', '-f', default='best', help='Video format (default: best)')
        
        args = parser.parse_args()
        
        if args.audio:
            download_audio(args.url, args.output)
        else:
            download_video(args.url, args.output, args.format)
    else:
        # Interactive mode
        while True:
            print("\n🎯 What do you want to do?")
            print("1. Download Video")
            print("2. Download Audio (MP3)")
            print("3. Exit")
            
            choice = input("\nEnter your choice (1-3): ").strip()
            
            if choice == '3':
                print("👋 Goodbye!")
                break
            elif choice in ['1', '2']:
                url = input("\n📋 Paste video URL: ").strip()
                
                if not url:
                    print("❌ Please enter a valid URL")
                    continue
                
                if choice == '1':
                    print("\n🎬 Video Download Options:")
                    print("1. Best Quality")
                    print("2. 1080p")
                    print("3. 720p")
                    print("4. 480p")
                    print("5. 360p")
                    
                    quality = input("Choose quality (1-5, default=1): ").strip()
                    
                    quality_map = {
                        '1': 'best',
                        '2': 'best[height<=1080]',
                        '3': 'best[height<=720]',
                        '4': 'best[height<=480]',
                        '5': 'best[height<=360]'
                    }
                    
                    format_choice = quality_map.get(quality, 'best')
                    download_video(url, "Downloads", format_choice)
                else:
                    download_audio(url, "Downloads")
            else:
                print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()

