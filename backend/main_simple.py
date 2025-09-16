import os
import json
import asyncio
import tempfile
import shutil
import hashlib
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple
import yt_dlp
import subprocess
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, HttpUrl, EmailStr
from dotenv import load_dotenv
import aiofiles
import logging
import io
from storage_manager_simple import storage_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("✅ Starting simplified video downloader API")

app = FastAPI(title="Video Downloader API", version="1.0.0")

# CORS middleware for Flutter app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Storage directory
STORAGE_DIR = Path("downloads")
STORAGE_DIR.mkdir(exist_ok=True)

# User management (simplified)
def load_users() -> Dict:
    """Load users from JSON file"""
    try:
        if os.path.exists("users.json"):
            with open("users.json", "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_users(users: Dict):
    """Save users to JSON file"""
    try:
        with open("users.json", "w") as f:
            json.dump(users, f, indent=2)
    except Exception:
        pass

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Get current user from token (simplified version)"""
    token = credentials.credentials
    
    # Simplified authentication: Create a demo user for testing
    if token and len(token) > 10:  # Basic token validation
        users = load_users()
        demo_user_id = "demo_user_123"
        
        if demo_user_id not in users:
            users[demo_user_id] = {
                'id': demo_user_id,
                'username': 'Demo User',
                'email': 'demo@example.com',
                'created_at': datetime.now().isoformat(),
                'token': token
            }
            save_users(users)
        
        return users[demo_user_id]
    
    raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic models
class VideoExtractRequest(BaseModel):
    url: str

class VideoExtractResponse(BaseModel):
    success: bool
    title: str
    duration: int
    thumbnail: str
    formats: List[Dict]
    error: Optional[str] = None

class DownloadRequest(BaseModel):
    url: str
    format_id: str
    output_format: str
    device_type: str

class DownloadResponse(BaseModel):
    success: bool
    download_url: Optional[str] = None
    filename: Optional[str] = None
    error: Optional[str] = None

# Utility functions
def is_valid_domain(url: str) -> bool:
    """Check if URL is from an allowed domain"""
    allowed_domains = [
        "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
        "instagram.com", "www.instagram.com", "tiktok.com", "www.tiktok.com",
        "twitter.com", "www.twitter.com", "x.com", "www.x.com",
        "facebook.com", "www.facebook.com", "fb.watch", "www.fb.watch",
        "twitch.tv", "www.twitch.tv", "vimeo.com", "www.vimeo.com",
        "dailymotion.com", "www.dailymotion.com", "reddit.com", "www.reddit.com",
        "redd.it", "rumble.com", "www.rumble.com", "odysee.com", "www.odysee.com",
        "bitchute.com", "www.bitchute.com", "archive.org", "www.archive.org",
        "streamable.com", "www.streamable.com", "gfycat.com", "www.gfycat.com",
        "imgur.com", "www.imgur.com", "9gag.com", "www.9gag.com",
        "vine.co", "www.vine.co", "periscope.tv", "www.periscope.tv",
        "younow.com", "www.younow.com", "meerkat.tv", "www.meerkat.tv",
        "blab.im", "www.blab.im", "liveleak.com", "www.liveleak.com",
        "break.com", "www.break.com", "metacafe.com", "www.metacafe.com",
        "veoh.com", "www.veoh.com", "vuclip.com", "www.vuclip.com",
        "vid.me", "www.vid.me", "d.tube", "www.d.tube", "lbry.tv", "www.lbry.tv",
        "peertube.com", "www.peertube.com", "pornhub.com", "www.pornhub.com",
        "xvideos.com", "www.xvideos.com", "xhamster.com", "www.xhamster.com",
        "redtube.com", "www.redtube.com", "youporn.com", "www.youporn.com",
        "tube8.com", "www.tube8.com", "xtube.com", "www.xtube.com",
        "beeg.com", "www.beeg.com", "tnaflix.com", "www.tnaflix.com",
        "empflix.com", "www.empflix.com", "slutload.com", "www.slutload.com",
        "keezmovies.com", "www.keezmovies.com", "drtuber.com", "www.drtuber.com",
        "nuvid.com", "www.nuvid.com", "sunporno.com", "www.sunporno.com",
        "porn.com", "www.porn.com", "pornhd.com", "www.pornhd.com",
        "pornoxo.com", "www.pornoxo.com", "onlyfans.com", "www.onlyfans.com",
        "chaturbate.com", "www.chaturbate.com", "cam4.com", "www.cam4.com",
        "myfreecams.com", "www.myfreecams.com", "livejasmin.com", "www.livejasmin.com",
        "stripchat.com", "www.stripchat.com", "bongacams.com", "www.bongacams.com",
        "camsoda.com", "www.camsoda.com", "streamate.com", "www.streamate.com",
        "imlive.com", "www.imlive.com"
    ]
    return any(domain in url for domain in allowed_domains)

def get_ytdl_opts() -> Dict:
    """Get yt-dlp options"""
    return {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'writethumbnail': True,
        'writeinfojson': False,
        'extractor_retries': 3,
        'fragment_retries': 3,
        'retries': 3,
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.google.com/',
        'sleep_interval': 1,
        'max_sleep_interval': 5,
        'sleep_interval_requests': 1,
        'geo_bypass_ip_block': None,
        'force_ipv4': True,
        'socket_timeout': 30,
        'http_timeout': 30,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    }

def get_download_opts(output_path: str, format_id: str, device_type: str) -> Dict:
    """Get download options"""
    opts = get_ytdl_opts()
    opts.update({
        'outtmpl': output_path,
        'format': format_id,
        'noplaylist': True,
        'writesubtitles': False,
        'writeautomaticsub': False,
        'writedescription': False,
        'writeinfojson': False,
        'writethumbnail': False,
    })
    return opts

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Infinity Hole Video Downloader API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/extract", response_model=VideoExtractResponse)
async def extract_video_info(request: VideoExtractRequest):
    """Extract video information"""
    try:
        url = request.url.strip()
        
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        if not is_valid_domain(url):
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        logger.info(f"Extracting video info for URL: {url}")
        
        # Extract video info
        ytdl_opts = get_ytdl_opts()
        ytdl_opts['quiet'] = True
        
        with yt_dlp.YoutubeDL(ytdl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise HTTPException(status_code=400, detail="Could not extract video information")
            
            # Get available formats
            formats = []
            if 'formats' in info:
                for fmt in info['formats']:
                    if fmt.get('vcodec') != 'none' or fmt.get('acodec') != 'none':
                        formats.append({
                            'format_id': fmt.get('format_id', ''),
                            'ext': fmt.get('ext', ''),
                            'resolution': fmt.get('resolution', ''),
                            'fps': fmt.get('fps', ''),
                            'vcodec': fmt.get('vcodec', ''),
                            'acodec': fmt.get('acodec', ''),
                            'filesize': fmt.get('filesize', 0),
                            'quality': fmt.get('quality', 0),
                            'format_note': fmt.get('format_note', ''),
                        })
            
            return VideoExtractResponse(
                success=True,
                title=info.get('title', 'Unknown'),
                duration=info.get('duration', 0),
                thumbnail=info.get('thumbnail', ''),
                formats=formats
            )
            
    except Exception as e:
        logger.error(f"Error extracting video info: {e}")
        return VideoExtractResponse(
            success=False,
            title="",
            duration=0,
            thumbnail="",
            formats=[],
            error=str(e)
        )

@app.post("/download", response_model=DownloadResponse)
async def download_video(request: DownloadRequest):
    """Download video"""
    try:
        url = request.url.strip()
        format_id = request.format_id
        output_format = request.output_format
        device_type = request.device_type
        
        if not url or not format_id:
            raise HTTPException(status_code=400, detail="URL and format_id are required")
        
        if not is_valid_domain(url):
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        logger.info(f"Downloading video: {url} with format {format_id}")
        
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"video_{timestamp}_{secrets.token_hex(4)}"
        
        if output_format == "mp3":
            # Audio download
            final_path = STORAGE_DIR / f"{base_filename}.mp3"
            temp_audio_path = STORAGE_DIR / f"{base_filename}_temp.%(ext)s"
            
            audio_opts = get_download_opts(str(temp_audio_path), "bestaudio", device_type)
            audio_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': str(final_path),
            })
            
            with yt_dlp.YoutubeDL(audio_opts) as ydl:
                ydl.download([url])
            
            if not final_path.exists():
                raise HTTPException(status_code=500, detail="Failed to extract audio to MP3")
            
            logger.info(f"Audio successfully extracted to: {final_path}")
            
        else:
            # Video download
            final_path = STORAGE_DIR / f"{base_filename}.{output_format}"
            temp_path = STORAGE_DIR / f"{base_filename}_temp.%(ext)s"
            
            download_opts = get_download_opts(str(temp_path), format_id, device_type)
            download_opts['outtmpl'] = str(final_path)
            
            with yt_dlp.YoutubeDL(download_opts) as ydl:
                ydl.download([url])
            
            if not final_path.exists():
                raise HTTPException(status_code=500, detail="Download failed")
            
            logger.info(f"Video successfully downloaded to: {final_path}")
        
        # Return download URL
        download_url = f"/downloads/{final_path.name}"
        
        return DownloadResponse(
            success=True,
            download_url=download_url,
            filename=final_path.name
        )
        
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        return DownloadResponse(
            success=False,
            error=str(e)
        )

@app.get("/downloads/{filename}")
async def serve_download(filename: str):
    """Serve downloaded files"""
    file_path = STORAGE_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/octet-stream'
    )

# Mount static files
app.mount("/downloads", StaticFiles(directory=str(STORAGE_DIR)), name="downloads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_simple:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=False
    )
