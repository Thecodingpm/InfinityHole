import os
import json
import asyncio
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Union
import yt_dlp
import subprocess
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
import aiofiles
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Downloader API", version="1.0.0")

# CORS middleware for Flutter app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Flutter app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./downloads"))
CLEANUP_INTERVAL_HOURS = int(os.getenv("CLEANUP_INTERVAL_HOURS", "2"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))

# Create storage directory
STORAGE_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class ExtractRequest(BaseModel):
    url: HttpUrl

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: str
    output_format: str  # "mp4" or "mp3"

class FormatInfo(BaseModel):
    format_id: str
    ext: str
    resolution: Optional[str] = None
    fps: Optional[int] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    filesize: Optional[int] = None
    quality: Optional[Union[str, float, int]] = None

class ExtractResponse(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    formats: List[FormatInfo]

class DownloadResponse(BaseModel):
    download_url: str
    filename: str
    filesize: int

# Utility functions
def is_valid_domain(url: str) -> bool:
    """Check if the URL domain is allowed"""
    # Hardcode the domains for now to ensure it works
    allowed_domains = ["youtube.com", "youtu.be", "instagram.com", "tiktok.com", "vimeo.com", "twitter.com", "x.com"]
    return any(domain in url for domain in allowed_domains)

def get_ytdl_opts() -> Dict:
    """Get yt-dlp options for extracting video info"""
    return {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'dump_single_json': True,
        'ignoreerrors': True,
        'no_check_certificate': True,
        'prefer_insecure': True,
        'extractor_retries': 3,
        'fragment_retries': 3,
        'retries': 3,
    }

def get_download_opts(output_path: str, format_id: str) -> Dict:
    """Get yt-dlp options for downloading"""
    return {
        'format': format_id,
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
        'no_check_certificate': True,
        'prefer_insecure': True,
    }

def convert_to_mp3(input_path: str, output_path: str) -> bool:
    """Convert video to MP3 using FFmpeg"""
    try:
        cmd = [
            'ffmpeg', '-i', input_path, 
            '-vn',  # No video
            '-acodec', 'mp3', 
            '-ab', '192k',  # Audio bitrate
            '-ar', '44100',  # Sample rate
            '-y',  # Overwrite output file
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        logger.error(f"FFmpeg conversion error: {e}")
        return False

def cleanup_old_files():
    """Remove files older than CLEANUP_INTERVAL_HOURS"""
    try:
        cutoff_time = datetime.now() - timedelta(hours=CLEANUP_INTERVAL_HOURS)
        for file_path in STORAGE_DIR.iterdir():
            if file_path.is_file() and datetime.fromtimestamp(file_path.stat().st_mtime) < cutoff_time:
                file_path.unlink()
                logger.info(f"Cleaned up old file: {file_path}")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

# Background task for cleanup
async def periodic_cleanup():
    """Periodic cleanup task"""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        cleanup_old_files()

# Startup event
@app.on_event("startup")
async def startup_event():
    """Start background cleanup task"""
    asyncio.create_task(periodic_cleanup())

# API Endpoints
@app.post("/extract", response_model=ExtractResponse)
async def extract_video_info(request: ExtractRequest):
    """Extract video information and available formats"""
    try:
        url = str(request.url)
        logger.info(f"Processing URL: {url}")
        
        if not is_valid_domain(url):
            logger.error(f"Domain not allowed for URL: {url}")
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        with yt_dlp.YoutubeDL(get_ytdl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Filter and format available formats
            formats = []
            for fmt in info.get('formats', []):
                if fmt.get('vcodec') != 'none' or fmt.get('acodec') != 'none':  # Has video or audio
                    format_info = FormatInfo(
                        format_id=fmt['format_id'],
                        ext=fmt.get('ext', 'unknown'),
                        resolution=fmt.get('resolution'),
                        fps=fmt.get('fps'),
                        vcodec=fmt.get('vcodec'),
                        acodec=fmt.get('acodec'),
                        filesize=fmt.get('filesize'),
                        quality=fmt.get('quality')
                    )
                    formats.append(format_info)
            
            return ExtractResponse(
                title=info.get('title', 'Unknown'),
                thumbnail=info.get('thumbnail'),
                duration=info.get('duration'),
                formats=formats
            )
            
    except HTTPException:
        # Re-raise HTTPExceptions (like domain not allowed) without modification
        raise
    except Exception as e:
        logger.error(f"Extract error: {e}")
        logger.error(f"Extract error type: {type(e)}")
        logger.error(f"Extract error args: {e.args}")
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        
        # Provide more specific error messages
        if "Video unavailable" in error_msg:
            error_msg = "This video is unavailable or private"
        elif "Sign in to confirm your age" in error_msg:
            error_msg = "This video is age-restricted and cannot be downloaded"
        elif "Video unavailable" in error_msg:
            error_msg = "This video is not available for download"
        elif "HTTP Error 403" in error_msg:
            error_msg = "Access denied - this video may be restricted"
        elif "HTTP Error 404" in error_msg:
            error_msg = "Video not found - please check the URL"
        
        raise HTTPException(status_code=400, detail=f"Failed to extract video info: {error_msg}")

@app.post("/download", response_model=DownloadResponse)
async def download_video(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Download video in specified format"""
    try:
        url = str(request.url)
        
        if not is_valid_domain(url):
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"download_{timestamp}"
        
        if request.output_format == "mp3":
            # For MP3, we need to download video first, then convert
            temp_video_path = STORAGE_DIR / f"{base_filename}_temp.mp4"
            final_path = STORAGE_DIR / f"{base_filename}.mp3"
            
            # Download video
            with yt_dlp.YoutubeDL(get_download_opts(str(temp_video_path), request.format_id)) as ydl:
                ydl.download([url])
            
            # Convert to MP3
            if not convert_to_mp3(str(temp_video_path), str(final_path)):
                temp_video_path.unlink(missing_ok=True)
                raise HTTPException(status_code=500, detail="Failed to convert to MP3")
            
            # Clean up temp video file
            temp_video_path.unlink(missing_ok=True)
            
        else:  # Video format - use the format's native extension
            # Handle yt-dlp format selection strings
            if '/' in request.format_id or '[' in request.format_id:
                # This is a yt-dlp format selection string, let yt-dlp handle it
                final_path = STORAGE_DIR / f"{base_filename}.%(ext)s"
                
                with yt_dlp.YoutubeDL(get_download_opts(str(final_path), request.format_id)) as ydl:
                    ydl.download([url])
                
                # Find the downloaded file
                downloaded_files = list(STORAGE_DIR.glob(f"{base_filename}.*"))
                if downloaded_files:
                    final_path = downloaded_files[0]
                else:
                    raise HTTPException(status_code=500, detail="No file was downloaded")
            else:
                # Specific format ID - get the format info to determine the correct extension
                with yt_dlp.YoutubeDL(get_ytdl_opts()) as ydl:
                    info = ydl.extract_info(url, download=False)
                    formats = info.get('formats', [])
                    format_info = next((f for f in formats if f['format_id'] == request.format_id), None)
                    
                    if format_info:
                        ext = format_info.get('ext', 'mp4')
                    else:
                        ext = 'mp4'  # fallback
                
                final_path = STORAGE_DIR / f"{base_filename}.{ext}"
                
                with yt_dlp.YoutubeDL(get_download_opts(str(final_path), request.format_id)) as ydl:
                    ydl.download([url])
        
        # Check file size
        file_size = final_path.stat().st_size
        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            final_path.unlink(missing_ok=True)
            raise HTTPException(status_code=413, detail="File too large")
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_old_files)
        
        return DownloadResponse(
            download_url=f"/files/{final_path.name}",
            filename=final_path.name,
            filesize=file_size
        )
        
    except Exception as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.get("/files/{filename}")
async def serve_file(filename: str):
    """Serve downloaded files"""
    file_path = STORAGE_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/octet-stream'
    )

@app.get("/")
async def root():
    """Serve the main web interface"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True
    )
