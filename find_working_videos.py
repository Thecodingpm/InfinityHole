#!/usr/bin/env python3
"""
Script to find working YouTube videos for testing the downloader
"""

import requests
import json
import time

# Test URLs - these are known to work with yt-dlp
TEST_VIDEOS = [
    {
        "title": "Rick Astley - Never Gonna Give You Up",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "description": "Classic meme video, usually works"
    },
    {
        "title": "Despacito",
        "url": "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
        "description": "Very popular video"
    },
    {
        "title": "Baby Shark",
        "url": "https://www.youtube.com/watch?v=XqZsoesa55w",
        "description": "Popular kids video"
    },
    {
        "title": "Shape of You",
        "url": "https://www.youtube.com/watch?v=JGwWNGJdvx8",
        "description": "Ed Sheeran hit"
    },
    {
        "title": "See You Again",
        "url": "https://www.youtube.com/watch?v=RgKAFK5djSk",
        "description": "Wiz Khalifa ft. Charlie Puth"
    }
]

def test_video(url, title):
    """Test if a video can be extracted"""
    try:
        response = requests.post(
            'http://localhost:8000/extract',
            headers={'Content-Type': 'application/json'},
            json={'url': url},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'title': data.get('title', 'Unknown'),
                'duration': data.get('duration', 0),
                'formats': len(data.get('formats', [])),
                'original_title': title
            }
        else:
            error_data = response.json()
            return {
                'success': False,
                'error': error_data.get('detail', 'Unknown error'),
                'original_title': title
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'original_title': title
        }

def main():
    print("🔍 Testing YouTube videos for downloader compatibility...")
    print("=" * 60)
    
    working_videos = []
    failed_videos = []
    
    for i, video in enumerate(TEST_VIDEOS, 1):
        print(f"\n📹 Testing {i}/{len(TEST_VIDEOS)}: {video['title']}")
        print(f"   URL: {video['url']}")
        print(f"   Description: {video['description']}")
        
        result = test_video(video['url'], video['title'])
        
        if result['success']:
            print(f"   ✅ SUCCESS!")
            print(f"   📺 Title: {result['title']}")
            print(f"   ⏱️  Duration: {result['duration']} seconds")
            print(f"   📊 Formats: {result['formats']} available")
            working_videos.append({
                'url': video['url'],
                'title': result['title'],
                'duration': result['duration'],
                'formats': result['formats']
            })
        else:
            print(f"   ❌ FAILED: {result['error']}")
            failed_videos.append({
                'url': video['url'],
                'title': video['title'],
                'error': result['error']
            })
        
        time.sleep(1)  # Be nice to the server
    
    print("\n" + "=" * 60)
    print("📊 RESULTS SUMMARY")
    print("=" * 60)
    
    if working_videos:
        print(f"\n✅ WORKING VIDEOS ({len(working_videos)}):")
        for video in working_videos:
            print(f"   • {video['title']}")
            print(f"     URL: {video['url']}")
            print(f"     Duration: {video['duration']}s, Formats: {video['formats']}")
            print()
    
    if failed_videos:
        print(f"\n❌ FAILED VIDEOS ({len(failed_videos)}):")
        for video in failed_videos:
            print(f"   • {video['title']}")
            print(f"     URL: {video['url']}")
            print(f"     Error: {video['error']}")
            print()
    
    if working_videos:
        print("🎉 SUCCESS! You have working videos to test with.")
        print("\n💡 TIP: Use one of the working videos above in your main app.")
        print("   Copy the URL and paste it into your video downloader.")
    else:
        print("😞 No videos are working. This might be due to:")
        print("   • YouTube's anti-bot measures")
        print("   • Network restrictions")
        print("   • Server configuration issues")
        print("\n🔧 Try:")
        print("   • Restarting the backend server")
        print("   • Checking your internet connection")
        print("   • Trying different video URLs")

if __name__ == "__main__":
    main()
