import os
import json
import asyncio
import tempfile
import shutil
import hashlib
import secrets
import time
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

# Firebase Admin SDK not available in simplified version
print("⚠️ Using simplified authentication system")

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
USERS_DB_PATH = Path(os.getenv("USERS_DB_PATH", "./users.json"))
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# Multi-Storage Configuration
# Storage limits are now managed by the storage_manager
FREE_STORAGE_MB = 150
AD_STORAGE_BONUS_MB = 50
MAX_FREE_STORAGE_MB = 500

# Create storage directory
STORAGE_DIR.mkdir(exist_ok=True)

# Initialize users database
if not USERS_DB_PATH.exists():
    with open(USERS_DB_PATH, 'w') as f:
        json.dump({}, f)

# Security
security = HTTPBearer()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class ExtractRequest(BaseModel):
    url: HttpUrl

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: str
    output_format: str  # "mp4" or "mp3"
    device_type: Optional[str] = "unknown"  # "ios", "android", "mac", "windows", "linux"
    start_time: Optional[float] = None  # Start time in seconds for segment extraction
    end_time: Optional[float] = None    # End time in seconds for segment extraction

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CloudFile(BaseModel):
    id: str
    filename: str
    file_type: str  # "video" or "audio"
    file_size: int
    upload_date: str
    download_url: str
    thumbnail_url: Optional[str] = None

class StorageInfo(BaseModel):
    used_mb: float
    total_mb: float
    ads_watched: int
    remaining_ads: int

class CloudUploadRequest(BaseModel):
    filename: str
    file_type: str
    file_size: int

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
    duration: Optional[float] = None
    formats: List[FormatInfo]

class DownloadResponse(BaseModel):
    download_url: str
    filename: str
    filesize: int

class DownloadSegmentStartResponse(BaseModel):
    progress_id: str

# Authentication utility functions
def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        salt, password_hash = hashed_password.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except:
        return False

def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def load_users() -> Dict:
    """Load users from JSON file"""
    try:
        with open(USERS_DB_PATH, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_users(users: Dict) -> None:
    """Save users to JSON file"""
    with open(USERS_DB_PATH, 'w') as f:
        json.dump(users, f, indent=2)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Get current user from Firebase ID token or custom token"""
    token = credentials.credentials
    
    # Try Firebase ID token first
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        
        if firebase_admin._apps:
            # Verify Firebase ID token
            decoded_token = firebase_auth.verify_id_token(token)
            user_id = decoded_token['uid']
            email = decoded_token.get('email', '')
            name = decoded_token.get('name', email.split('@')[0])
            
            # Create or get user data
            users = load_users()
            if user_id not in users:
                users[user_id] = {
                    'id': user_id,
                    'username': name,
                    'email': email,
                    'created_at': datetime.now().isoformat(),
                    'token': token
                }
                save_users(users)
            
            return users[user_id]
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
    
    # Temporary fallback: Create a demo user for testing
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
    
    # Fallback to custom token system
    users = load_users()
    for user_id, user_data in users.items():
        if user_data.get('token') == token:
            return user_data
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Cloud Storage Functions
# Multi-storage functions using the new storage_manager
def get_user_storage_info(user_id: str) -> Dict:
    """Get user's storage information using multi-storage system"""
    return storage_manager.get_storage_info(user_id)

def upload_to_cloud(file_content: bytes, filename: str, user_id: str) -> Tuple[str, str, str]:
    """Upload file to cloud storage using multi-storage system"""
    return storage_manager.upload_file(file_content, filename, user_id)

def delete_from_cloud(file_id: str, user_id: str) -> bool:
    """Delete file from cloud storage using multi-storage system"""
    return storage_manager.delete_file(file_id, user_id)

def list_cloud_files(user_id: str) -> List[Dict]:
    """List user's cloud files using multi-storage system"""
    return storage_manager.list_files(user_id)

# Utility functions
def is_valid_domain(url: str) -> bool:
    """Check if the URL domain is allowed"""
    # Expanded list of supported domains
    allowed_domains = [
        # YouTube
        "youtube.com", "youtu.be", "www.youtube.com", "m.youtube.com", "music.youtube.com",
        # Instagram
        "instagram.com", "www.instagram.com", "m.instagram.com",
        # TikTok
        "tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com",
        # Vimeo
        "vimeo.com", "www.vimeo.com", "player.vimeo.com",
        # Twitter/X
        "twitter.com", "www.twitter.com", "mobile.twitter.com", "x.com", "www.x.com", "mobile.x.com",
        # Facebook
        "facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch",
        # Twitch
        "twitch.tv", "www.twitch.tv", "clips.twitch.tv",
        # Dailymotion
        "dailymotion.com", "www.dailymotion.com",
        # Reddit
        "reddit.com", "www.reddit.com", "v.redd.it",
        # Adult content platforms
        "pornhub.com", "www.pornhub.com", "xvideos.com", "www.xvideos.com",
        "xhamster.com", "www.xhamster.com", "redtube.com", "www.redtube.com",
        "youporn.com", "www.youporn.com", "tube8.com", "www.tube8.com",
        "xtube.com", "www.xtube.com", "beeg.com", "www.beeg.com",
        "tnaflix.com", "www.tnaflix.com", "empflix.com", "www.empflix.com",
        "slutload.com", "www.slutload.com", "keezmovies.com", "www.keezmovies.com",
        "drtuber.com", "www.drtuber.com", "nuvid.com", "www.nuvid.com",
        "sunporno.com", "www.sunporno.com", "porn.com", "www.porn.com",
        "pornhd.com", "www.pornhd.com", "pornoxo.com", "www.pornoxo.com",
        # Live streaming & cam sites
        "onlyfans.com", "www.onlyfans.com", "chaturbate.com", "www.chaturbate.com",
        "cam4.com", "www.cam4.com", "myfreecams.com", "www.myfreecams.com",
        "livejasmin.com", "www.livejasmin.com", "stripchat.com", "www.stripchat.com",
        "bongacams.com", "www.bongacams.com", "camsoda.com", "www.camsoda.com",
        "streamate.com", "www.streamate.com", "imlive.com", "www.imlive.com",
        # Other platforms
        "rumble.com", "www.rumble.com", "bitchute.com", "www.bitchute.com",
        "odysee.com", "www.odysee.com", "lbry.tv", "www.lbry.tv",
        "metacafe.com", "www.metacafe.com", "veoh.com", "www.veoh.com",
        "break.com", "www.break.com", "liveleak.com", "www.liveleak.com",
        "archive.org", "www.archive.org", "vuclip.com", "www.vuclip.com",
        "vid.me", "www.vid.me", "streamable.com", "www.streamable.com",
        "gfycat.com", "www.gfycat.com", "imgur.com", "www.imgur.com",
        "9gag.com", "www.9gag.com", "vine.co", "www.vine.co",
        "periscope.tv", "www.periscope.tv", "meerkat.tv", "www.meerkat.tv",
        "blab.im", "www.blab.im", "younow.com", "www.younow.com"
    ]
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
        'extractor_retries': 10,
        'fragment_retries': 10,
        'retries': 10,
        # Enhanced anti-bot detection measures
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.pornhub.com/',
        'sleep_interval': 5,
        'max_sleep_interval': 15,
        'extractor_retries': 15,
        'fragment_retries': 15,
        'retries': 15,
        'sleep_interval_requests': 2,
        # Additional options for better compatibility
        'cookiesfrombrowser': None,  # Don't use browser cookies
        'geo_bypass': True,  # Bypass geo-restrictions
        'geo_bypass_country': 'US',  # Use US as default country
        'geo_bypass_ip_block': None,  # Don't block any IPs
        'force_ipv4': True,  # Force IPv4
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'hls'],  # Skip problematic formats
                'player_skip': ['configs'],
                'player_client': ['android', 'web'],  # Try different player clients
            },
            'pornhub': {
                'age_limit': 18,  # Explicitly set age limit
                'skip': ['dash'],
                'player_skip': ['configs'],
                'player_client': ['android', 'web'],
            },
            'xvideos': {
                'age_limit': 18,
            },
            'xhamster': {
                'age_limit': 18,
            },
            'redtube': {
                'age_limit': 18,
            },
            'youporn': {
                'age_limit': 18,
            },
            'tube8': {
                'age_limit': 18,
            },
            'xtube': {
                'age_limit': 18,
            },
            'beeg': {
                'age_limit': 18,
            },
            'onlyfans': {
                'age_limit': 18,
            },
            'chaturbate': {
                'age_limit': 18,
            }
        },
        # Timeout settings
        'socket_timeout': 120,
        'http_timeout': 120,
        # Additional headers to look more like a real browser
        'http_headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
    }

def get_download_opts(output_path: str, format_id: str, device_type: str = "unknown") -> Dict:
    """Get yt-dlp options for downloading with device-specific optimization"""
    base_opts = {
        'format': format_id,
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
        'no_check_certificate': True,
        'prefer_insecure': True,
        'merge_output_format': 'mp4',  # Ensure MP4 output
        'format_sort': ['res:1080', 'ext:mp4:m4a'],  # Prefer 1080p+ and MP4
        'format_sort_force': True,  # Force format sorting
        # Enhanced anti-bot detection measures
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://www.pornhub.com/',
        'sleep_interval': 5,
        'max_sleep_interval': 15,
        'extractor_retries': 15,
        'fragment_retries': 15,
        'retries': 15,
        'sleep_interval_requests': 2,
        # Additional options for better compatibility
        'cookiesfrombrowser': None,  # Don't use browser cookies
        'geo_bypass': True,  # Bypass geo-restrictions
        'geo_bypass_country': 'US',  # Use US as default country
        'geo_bypass_ip_block': None,  # Don't block any IPs
        'force_ipv4': True,  # Force IPv4
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'hls'],  # Skip problematic formats
                'player_skip': ['configs'],
                'player_client': ['android', 'web'],  # Try different player clients
            },
            'pornhub': {
                'age_limit': 18,  # Explicitly set age limit
                'skip': ['dash'],
                'player_skip': ['configs'],
                'player_client': ['android', 'web'],
            },
            'xvideos': {
                'age_limit': 18,
            },
            'xhamster': {
                'age_limit': 18,
            },
            'redtube': {
                'age_limit': 18,
            },
            'youporn': {
                'age_limit': 18,
            },
            'tube8': {
                'age_limit': 18,
            },
            'xtube': {
                'age_limit': 18,
            },
            'beeg': {
                'age_limit': 18,
            },
            'onlyfans': {
                'age_limit': 18,
            },
            'chaturbate': {
                'age_limit': 18,
            }
        },
        # Timeout settings
        'socket_timeout': 120,
        'http_timeout': 120,
        # Additional headers to look more like a real browser
        'http_headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
    }
    
    # Device-specific optimizations
    if device_type == "ios":
        # iOS optimization: MP4 format for compatibility
        base_opts['postprocessors'] = [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }]
    elif device_type == "android":
        # Android optimization: MP4 format
        base_opts['postprocessors'] = [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }]
    elif device_type == "mac":
        # Mac optimization: MOV format for native QuickTime compatibility
        base_opts['postprocessors'] = [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mov',
        }]
        # Additional Mac-specific options for better compatibility
        base_opts['writethumbnail'] = False  # Disable thumbnail generation
        base_opts['writesubtitles'] = False  # Disable subtitle files
        base_opts['writeautomaticsub'] = False  # Disable auto-generated subtitles
        base_opts['embedsubtitles'] = False  # Don't embed subtitles
        base_opts['writeinfojson'] = False  # Don't create info JSON files
    else:
        # Default optimization for Windows/Linux
        base_opts['postprocessors'] = [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }]
    
    return base_opts

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

def extract_segment(input_path: str, output_path: str, start_time: float, end_time: float, output_format: str = "mp4") -> bool:
    """Extract a segment from video using FFmpeg with progress tracking"""
    try:
        duration = end_time - start_time
        
        if output_format == "mp3":
            # Extract audio segment
            cmd = [
                'ffmpeg', '-i', input_path,
                '-ss', str(start_time),  # Start time
                '-t', str(duration),     # Duration
                '-vn',  # No video
                '-acodec', 'mp3',
                '-ab', '192k',  # Audio bitrate
                '-ar', '44100',  # Sample rate
                '-progress', 'pipe:1',  # Output progress to stdout
                '-y',  # Overwrite output file
                output_path
            ]
        else:
            # Extract video segment
            cmd = [
                'ffmpeg', '-i', input_path,
                '-ss', str(start_time),  # Start time
                '-t', str(duration),     # Duration
                '-c', 'copy',  # Copy streams without re-encoding for speed
                '-avoid_negative_ts', 'make_zero',  # Handle timestamp issues
                '-progress', 'pipe:1',  # Output progress to stdout
                '-y',  # Overwrite output file
                output_path
            ]
        
        logger.info(f"Extracting segment: {start_time}s to {end_time}s ({duration}s duration)")
        
        # Run FFmpeg with progress tracking
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Monitor progress
        progress_lines = []
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                progress_lines.append(output.strip())
                # Log progress every 10 lines to avoid spam
                if len(progress_lines) % 10 == 0:
                    logger.info(f"Segment extraction progress: {len(progress_lines)} lines processed")
        
        # Get the final result
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            logger.info(f"Segment extraction successful: {output_path}")
            return True
        else:
            logger.error(f"Segment extraction failed: {stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("Segment extraction timed out")
        return False
    except Exception as e:
        logger.error(f"Segment extraction error: {e}")
        return False

def extract_segment_with_progress(input_path: str, output_path: str, start_time: float, end_time: float, output_format: str = "mp4"):
    """Extract a segment from video using FFmpeg with real-time progress updates"""
    import time
    import threading
    
    duration = end_time - start_time
    progress_data = {
        'status': 'starting',
        'progress': 0,
        'time_remaining': 0,
        'speed': 0,
        'error': None
    }
    
    def run_extraction():
        try:
            progress_data['status'] = 'extracting'
            
            if output_format == "mp3":
                cmd = [
                    'ffmpeg', '-i', input_path,
                    '-ss', str(start_time),
                    '-t', str(duration),
                    '-vn',
                    '-acodec', 'mp3',
                    '-ab', '192k',
                    '-ar', '44100',
                    '-progress', 'pipe:1',
                    '-y',
                    output_path
                ]
            else:
                cmd = [
                    'ffmpeg', '-i', input_path,
                    '-ss', str(start_time),
                    '-t', str(duration),
                    '-c', 'copy',
                    '-avoid_negative_ts', 'make_zero',
                    '-progress', 'pipe:1',
                    '-y',
                    output_path
                ]
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            start_time_actual = time.time()
            
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    line = output.strip()
                    # Parse FFmpeg progress
                    if 'out_time_ms=' in line:
                        try:
                            time_ms = int(line.split('out_time_ms=')[1])
                            time_seconds = time_ms / 1000000
                            progress = min(100, (time_seconds / duration) * 100)
                            progress_data['progress'] = progress
                            
                            # Calculate time remaining
                            elapsed = time.time() - start_time_actual
                            if progress > 0:
                                total_estimated = elapsed / (progress / 100)
                                remaining = total_estimated - elapsed
                                progress_data['time_remaining'] = max(0, remaining)
                        except:
                            pass
                    elif 'speed=' in line:
                        try:
                            speed = line.split('speed=')[1].split('x')[0]
                            progress_data['speed'] = float(speed)
                        except:
                            pass
            
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                progress_data['status'] = 'completed'
                progress_data['progress'] = 100
            else:
                progress_data['status'] = 'error'
                progress_data['error'] = stderr
                
        except Exception as e:
            progress_data['status'] = 'error'
            progress_data['error'] = str(e)
    
    # Start extraction in a separate thread
    thread = threading.Thread(target=run_extraction)
    thread.start()
    
    return progress_data

def clean_video_for_mac(file_path: str) -> bool:
    """Clean video metadata to ensure it opens in QuickTime/Photos instead of Subler"""
    try:
        # Get file extension and create temp file with same extension
        file_ext = os.path.splitext(file_path)[1]
        temp_path = file_path.replace(file_ext, f"_temp{file_ext}")
        
        cmd = [
            'ffmpeg', '-i', file_path, 
            '-c', 'copy',  # Copy streams without re-encoding
            '-map_metadata', '-1',  # Remove all metadata
            '-movflags', '+faststart',  # Optimize for streaming
            '-y',  # Overwrite output file
            temp_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Replace original file with cleaned version
            os.replace(temp_path, file_path)
            logger.info(f"Successfully cleaned video metadata for Mac: {file_path}")
            return True
        else:
            logger.error(f"FFmpeg metadata cleaning failed: {result.stderr}")
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg metadata cleaning timed out")
        return False
    except Exception as e:
        logger.error(f"Error cleaning video metadata: {e}")
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

# Authentication Endpoints
@app.post("/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    users = load_users()
    
    # Check if email already exists
    for user_id, user in users.items():
        if user['email'] == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    for user_id, user in users.items():
        if user['username'] == user_data.username:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    user_id = secrets.token_urlsafe(16)
    token = generate_token()
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        'id': user_id,
        'username': user_data.username,
        'email': user_data.email,
        'password': hashed_password,
        'token': token,
        'created_at': datetime.now().isoformat()
    }
    
    users[user_id] = new_user
    save_users(users)
    
    logger.info(f"New user registered: {user_data.username} ({user_data.email})")
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            created_at=new_user['created_at']
        )
    )

@app.post("/auth/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin):
    """Login user"""
    users = load_users()
    
    # Find user by email
    user = None
    for user_id, user_data in users.items():
        if user_data['email'] == login_data.email:
            user = user_data
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate new token
    token = generate_token()
    user['token'] = token
    users[user['id']] = user
    save_users(users)
    
    logger.info(f"User logged in: {user['username']} ({user['email']})")
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            created_at=user['created_at']
        )
    )

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user['id'],
        username=current_user['username'],
        email=current_user['email'],
        created_at=current_user['created_at']
    )

@app.post("/auth/logout")
async def logout_user(current_user: Dict = Depends(get_current_user)):
    """Logout user by invalidating token"""
    users = load_users()
    if current_user['id'] in users:
        users[current_user['id']]['token'] = None
        save_users(users)
    
    logger.info(f"User logged out: {current_user['username']}")
    return {"message": "Successfully logged out"}

# Cloud Storage Endpoints
@app.get("/cloud/storage", response_model=StorageInfo)
async def get_storage_info(current_user: Dict = Depends(get_current_user)):
    """Get user's storage information"""
    storage_info = get_user_storage_info(current_user['id'])
    
    return StorageInfo(
        used_mb=storage_info['usage_mb'],
        total_mb=storage_info['limit_mb'],
        ads_watched=storage_info['ads_watched'],
        remaining_ads=max(0, 10 - storage_info['ads_watched'])  # Allow up to 10 ads
    )

@app.get("/cloud/files", response_model=List[CloudFile])
async def get_cloud_files(current_user: Dict = Depends(get_current_user)):
    """Get user's cloud files"""
    files = list_cloud_files(current_user['id'])
    
    return [CloudFile(
        id=file['id'],
        filename=file['name'],
        file_type="video" if file.get('content_type', '').startswith('video/') else "audio",
        file_size=file['size'],
        upload_date=file['created'],
        download_url=file['download_url']
    ) for file in files]

@app.post("/cloud/upload")
async def upload_to_cloud_storage(
    file: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user)
):
    """Upload file to cloud storage"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to cloud using multi-storage system
        download_url, file_id, provider_name = upload_to_cloud(file_content, file.filename, current_user['id'])
        
        logger.info(f"File uploaded to {provider_name}: {file.filename} by {current_user['username']}")
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "download_url": download_url,
            "file_size": len(file_content),
            "provider": provider_name
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/cloud/save-download")
async def save_download_to_cloud(
    request: CloudUploadRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Save a downloaded file to cloud storage"""
    try:
        # Find the downloaded file
        downloaded_files = list(STORAGE_DIR.glob(f"*{request.filename}"))
        if not downloaded_files:
            raise HTTPException(status_code=404, detail="Downloaded file not found")
        
        file_path = downloaded_files[0]
        
        # Read file content
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Upload to cloud using multi-storage system
        download_url, file_id, provider_name = upload_to_cloud(file_content, request.filename, current_user['id'])
        
        logger.info(f"Download saved to {provider_name}: {request.filename} by {current_user['username']}")
        
        return {
            "file_id": file_id,
            "filename": request.filename,
            "download_url": download_url,
            "file_size": request.file_size,
            "provider": provider_name
        }
    except Exception as e:
        logger.error(f"Save to cloud failed: {e}")
        raise HTTPException(status_code=500, detail=f"Save to cloud failed: {str(e)}")

@app.post("/cloud/watch-ad")
async def watch_ad_for_storage(current_user: Dict = Depends(get_current_user)):
    """User watched an ad, increase storage"""
    try:
        result = storage_manager.watch_ad(current_user['id'])
        
        logger.info(f"Ad watched by {current_user['username']}, total ads: {result['ads_watched']}")
        
        return {
            "ads_watched": result['ads_watched'],
            "bonus_storage_mb": result['bonus_storage_mb'],
            "message": result['message']
        }
    except Exception as e:
        logger.error(f"Watch ad failed: {e}")
        raise HTTPException(status_code=500, detail=f"Watch ad failed: {str(e)}")

@app.delete("/cloud/files/{file_id}")
async def delete_cloud_file(file_id: str, current_user: Dict = Depends(get_current_user)):
    """Delete a file from cloud storage"""
    try:
        success = delete_from_cloud(file_id, current_user['id'])
        
        if not success:
            raise HTTPException(status_code=404, detail="File not found or deletion failed")
        
        logger.info(f"File deleted from cloud: {file_id} by {current_user['username']}")
        
        return {"message": "File deleted successfully"}
    except Exception as e:
        logger.error(f"Delete file failed: {e}")
        raise HTTPException(status_code=500, detail=f"Delete file failed: {str(e)}")

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
            
            # Check if extraction was successful
            if info is None:
                raise Exception("Failed to extract video information. The video may be private, restricted, or temporarily unavailable.")
            
            # Log available qualities
            available_qualities = []
            for fmt in info.get('formats', []):
                if fmt.get('vcodec') != 'none' and fmt.get('resolution'):
                    available_qualities.append(fmt.get('resolution'))
            
            if available_qualities:
                max_quality = max(available_qualities, key=lambda x: int(x.split('x')[1]) if 'x' in x else 0)
                logger.info(f"Available qualities: {sorted(set(available_qualities), key=lambda x: int(x.split('x')[1]) if 'x' in x else 0, reverse=True)}")
                logger.info(f"Will download in: {max_quality}")
            
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
            
            # Sort formats by quality (resolution first, then filesize)
            formats.sort(key=lambda x: (
                -int(x.resolution.split('x')[1]) if x.resolution and 'x' in x.resolution else 0,
                -(x.filesize or 0)
            ))
            
            # Log the top 5 formats for debugging
            logger.info(f"Top 5 available formats:")
            for i, fmt in enumerate(formats[:5]):
                logger.info(f"  {i+1}. {fmt.format_id} - {fmt.resolution} - {fmt.ext} - {fmt.vcodec}")
            
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
        if "Sign in to confirm you're not a bot" in error_msg or "Sign in to confirm your age" in error_msg:
            error_msg = "Access issue - please try again or use a different URL"
        elif "Video unavailable" in error_msg or "unavailable" in error_msg.lower():
            error_msg = "This video is unavailable or private"
        elif "HTTP Error 403" in error_msg or "403" in error_msg:
            error_msg = "Access denied - this video may be restricted or YouTube is blocking requests"
        elif "HTTP Error 404" in error_msg or "404" in error_msg:
            error_msg = "Video not found - please check the URL"
        elif "NoneType" in error_msg and "get" in error_msg:
            error_msg = "Unable to extract video information. The video may be private, restricted, or temporarily unavailable."
        elif "Private video" in error_msg or "private" in error_msg.lower():
            error_msg = "This video is private and cannot be downloaded"
        elif "This video is not available" in error_msg or "not available" in error_msg.lower():
            error_msg = "This video is not available in your region or has been removed"
        elif "age-restricted" in error_msg.lower() or "age restricted" in error_msg.lower():
            error_msg = "Video access issue - please try again or use a different URL"
        elif "copyright" in error_msg.lower():
            error_msg = "This video is protected by copyright and cannot be downloaded"
        elif "blocked" in error_msg.lower():
            error_msg = "This video is blocked in your region"
        elif "live" in error_msg.lower() and "stream" in error_msg.lower():
            error_msg = "Live streams cannot be downloaded"
        elif "playlist" in error_msg.lower():
            error_msg = "Please use a direct video URL, not a playlist URL"
        
        raise HTTPException(status_code=400, detail=f"Failed to extract video info: {error_msg}")

@app.post("/download", response_model=DownloadResponse)
async def download_video(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Download video in specified format"""
    try:
        url = str(request.url)
        device_type = request.device_type or "unknown"
        start_time = request.start_time
        end_time = request.end_time
        
        if not is_valid_domain(url):
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        # Validate segment parameters
        if start_time is not None and end_time is not None:
            if start_time < 0 or end_time <= start_time:
                raise HTTPException(status_code=400, detail="Invalid segment time range")
            if end_time - start_time > 3600:  # Max 1 hour segment
                raise HTTPException(status_code=400, detail="Segment too long (max 1 hour)")
        
        logger.info(f"Downloading for device type: {device_type}")
        if start_time is not None and end_time is not None:
            logger.info(f"Segment extraction: {start_time}s to {end_time}s")
        
        # Generate unique filename with device info
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        segment_suffix = f"_segment_{int(start_time)}_{int(end_time)}" if start_time is not None and end_time is not None else ""
        base_filename = f"download_{device_type}_{timestamp}{segment_suffix}"
        
        if request.output_format == "mp3":
            # For MP3, we need to download audio first, then convert
            temp_audio_path = STORAGE_DIR / f"{base_filename}_temp.%(ext)s"
            final_path = STORAGE_DIR / f"{base_filename}.mp3"
            
            # Use best audio format for MP3 conversion
            audio_format = "bestaudio"
            
            # Create audio-specific download options
            audio_opts = get_download_opts(str(temp_audio_path), audio_format, device_type)
            audio_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': str(final_path),
            })
            
            # Download audio
            try:
                with yt_dlp.YoutubeDL(audio_opts) as ydl:
                    ydl.download([url])
                
                # Check if MP3 file was created
                if not final_path.exists():
                    raise HTTPException(status_code=500, detail="Failed to extract audio to MP3")
                    
                logger.info(f"Audio successfully extracted to: {final_path}")
                
                # If segment extraction is requested, extract segment from the MP3
                if start_time is not None and end_time is not None:
                    temp_segment_path = STORAGE_DIR / f"{base_filename}_segment_temp.mp3"
                    if extract_segment(str(final_path), str(temp_segment_path), start_time, end_time, "mp3"):
                        # Replace original with segment
                        os.replace(str(temp_segment_path), str(final_path))
                        logger.info(f"Segment extracted successfully: {final_path}")
                    else:
                        # Clean up temp file
                        if temp_segment_path.exists():
                            temp_segment_path.unlink()
                        raise HTTPException(status_code=500, detail="Failed to extract audio segment")
                
            except Exception as e:
                logger.error(f"Audio download error: {e}")
                raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")
            
        else:  # Video format - use the format's native extension
            # Handle yt-dlp format selection strings
            if '/' in request.format_id or '[' in request.format_id or request.format_id == 'best' or 'bestvideo' in request.format_id:
                # This is a yt-dlp format selection string, let yt-dlp handle it
                final_path = STORAGE_DIR / f"{base_filename}.%(ext)s"
                
                # Use the provided format selector
                format_selector = request.format_id
                logger.info(f"Using format selector: {format_selector}")
                
                # Get download options with the format selector
                download_opts = get_download_opts(str(final_path), format_selector, device_type)
                
                with yt_dlp.YoutubeDL(download_opts) as ydl:
                    ydl.download([url])
                
                # Find the downloaded file
                downloaded_files = list(STORAGE_DIR.glob(f"{base_filename}.*"))
                logger.info(f"Looking for files matching: {base_filename}.*")
                logger.info(f"Found files: {[f.name for f in downloaded_files]}")
                
                if downloaded_files:
                    final_path = downloaded_files[0]
                    logger.info(f"Selected file: {final_path.name}")
                else:
                    # Try to find any recently created files in the downloads directory
                    all_files = list(STORAGE_DIR.glob("*"))
                    recent_files = [f for f in all_files if f.stat().st_mtime > (datetime.now().timestamp() - 60)]
                    logger.info(f"Recent files in downloads: {[f.name for f in recent_files]}")
                    
                    if recent_files:
                        final_path = recent_files[0]
                        logger.info(f"Using recent file: {final_path.name}")
                    else:
                        raise HTTPException(status_code=500, detail="No file was downloaded")
                
                # If segment extraction is requested, extract segment from the video
                if start_time is not None and end_time is not None:
                    temp_segment_path = STORAGE_DIR / f"{base_filename}_segment_temp{final_path.suffix}"
                    if extract_segment(str(final_path), str(temp_segment_path), start_time, end_time, "mp4"):
                        # Replace original with segment
                        os.replace(str(temp_segment_path), str(final_path))
                        logger.info(f"Video segment extracted successfully: {final_path}")
                    else:
                        # Clean up temp file
                        if temp_segment_path.exists():
                            temp_segment_path.unlink()
                        raise HTTPException(status_code=500, detail="Failed to extract video segment")
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
                
                with yt_dlp.YoutubeDL(get_download_opts(str(final_path), request.format_id, device_type)) as ydl:
                    ydl.download([url])
        
        # Clean video metadata for Mac to ensure it opens in QuickTime/Photos
        if device_type == "mac" and (str(final_path).endswith('.mp4') or str(final_path).endswith('.mov')):
            logger.info(f"Cleaning metadata for Mac file: {final_path.name}")
            clean_video_for_mac(str(final_path))
        
        # Check file size
        file_size = final_path.stat().st_size
        logger.info(f"Final file size: {file_size} bytes")
        
        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            final_path.unlink(missing_ok=True)
            raise HTTPException(status_code=413, detail="File too large")
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_old_files)
        
        logger.info(f"Returning download response for: {final_path.name}")
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
    """Redirect to Next.js frontend"""
    return RedirectResponse(url="http://localhost:3000")

# Global progress tracking for segment downloads
segment_progress = {}

def _perform_segment_download(progress_id: str, url: str, request: DownloadRequest, device_type: str, base_filename: str):
    """Worker that downloads full video then extracts segment, updating progress dict."""
    try:
        segment_progress[progress_id]['status'] = 'downloading'
        segment_progress[progress_id]['message'] = 'Downloading full video...'
        segment_progress[progress_id]['progress'] = 0

        temp_video_path = STORAGE_DIR / f"{base_filename}_temp.%(ext)s"
        final_path = STORAGE_DIR / f"{base_filename}.{request.output_format}"

        # Use yt-dlp progress hook to update percentage up to 50%
        def progress_hook(d):
            try:
                if d.get('status') == 'downloading':
                    total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                    downloaded = d.get('downloaded_bytes') or 0
                    if total and downloaded:
                        pct = max(0.0, min(100.0, (downloaded / total) * 50.0))
                        segment_progress[progress_id]['progress'] = pct
                        segment_progress[progress_id]['message'] = 'Downloading full video...'
                elif d.get('status') == 'finished':
                    segment_progress[progress_id]['progress'] = 50.0
                    segment_progress[progress_id]['message'] = 'Download complete. Extracting segment...'
            except Exception:
                pass

        download_opts = get_download_opts(str(temp_video_path), request.format_id, device_type)
        download_opts['progress_hooks'] = [progress_hook]

        with yt_dlp.YoutubeDL(download_opts) as ydl:
            ydl.download([url])

        # Locate downloaded temp file
        downloaded_files = list(STORAGE_DIR.glob(f"{base_filename}_temp.*"))
        if not downloaded_files:
            raise Exception("Failed to download video")

        temp_file = downloaded_files[0]

        # Extract segment with progress (second half 50->100)
        segment_progress[progress_id]['status'] = 'extracting'
        segment_progress[progress_id]['message'] = 'Extracting segment...'
        segment_progress[progress_id]['progress'] = max(50.0, segment_progress[progress_id].get('progress', 50.0))

        # Build ffmpeg command with progress output
        seg_start = request.start_time or 0
        seg_end = request.end_time or 0
        seg_duration = max(0.1, seg_end - seg_start)

        if request.output_format == "mp3":
            cmd = [
                'ffmpeg', '-i', str(temp_file),
                '-ss', str(seg_start),
                '-t', str(seg_duration),
                '-vn',
                '-acodec', 'mp3',
                '-ab', '192k',
                '-ar', '44100',
                '-progress', 'pipe:1',
                '-y', str(final_path)
            ]
        else:
            cmd = [
                'ffmpeg', '-i', str(temp_file),
                '-ss', str(seg_start),
                '-t', str(seg_duration),
                '-c', 'copy',
                '-avoid_negative_ts', 'make_zero',
                '-progress', 'pipe:1',
                '-y', str(final_path)
            ]

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        while True:
            line = proc.stdout.readline()
            if line == '' and proc.poll() is not None:
                break
            if not line:
                continue
            line = line.strip()
            if 'out_time_ms=' in line:
                try:
                    out_ms = int(line.split('out_time_ms=')[1])
                    out_s = out_ms / 1000000.0
                    frac = min(1.0, max(0.0, out_s / seg_duration))
                    segment_progress[progress_id]['progress'] = 50.0 + (frac * 50.0)
                except Exception:
                    pass

        stdout, stderr = proc.communicate()
        success = proc.returncode == 0

        # Cleanup temp
        try:
            temp_file.unlink()
        except Exception:
            pass

        if not success:
            raise Exception("Failed to extract segment")

        filesize = final_path.stat().st_size
        segment_progress[progress_id]['status'] = 'completed'
        segment_progress[progress_id]['progress'] = 100.0
        segment_progress[progress_id]['message'] = 'Segment ready'
        segment_progress[progress_id]['filename'] = final_path.name
        segment_progress[progress_id]['download_url'] = f"/files/{final_path.name}"
        segment_progress[progress_id]['filesize'] = filesize

    except Exception as e:
        segment_progress[progress_id]['status'] = 'error'
        segment_progress[progress_id]['error'] = str(e)


@app.post("/download-segment", response_model=DownloadSegmentStartResponse)
async def download_segment(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start a segment download and return a progress_id to poll."""
    try:
        url = str(request.url)
        device_type = request.device_type or "unknown"
        start_time = request.start_time
        end_time = request.end_time
        
        if not is_valid_domain(url):
            raise HTTPException(status_code=400, detail="Domain not allowed")
        
        # Validate segment parameters
        if start_time is None or end_time is None:
            raise HTTPException(status_code=400, detail="Start time and end time are required for segment download")
        
        if start_time < 0 or end_time <= start_time:
            raise HTTPException(status_code=400, detail="Invalid segment time range")
        
        if end_time - start_time > 3600:  # Max 1 hour segment
            raise HTTPException(status_code=400, detail="Segment too long (max 1 hour)")
        
        logger.info(f"Downloading segment for device type: {device_type}")
        logger.info(f"Segment: {start_time}s to {end_time}s")
        
        # Generate unique filename and progress id
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        segment_suffix = f"_segment_{int(start_time)}_{int(end_time)}"
        base_filename = f"download_{device_type}_{timestamp}{segment_suffix}"

        progress_id = f"{base_filename}_{int(time.time())}"
        segment_progress[progress_id] = {
            'status': 'queued',
            'progress': 0.0,
            'message': 'Queued',
            'filename': None,
            'download_url': None,
            'filesize': None,
            'error': None,
        }

        # Kick off background worker
        background_tasks.add_task(_perform_segment_download, progress_id, url, request, device_type, base_filename)

        return DownloadSegmentStartResponse(progress_id=progress_id)
        
    except Exception as e:
        logger.error(f"Segment download error: {e}")
        raise HTTPException(status_code=500, detail=f"Segment download failed: {str(e)}")

@app.get("/segment-progress/{progress_id}")
async def get_segment_progress(progress_id: str):
    """Get progress of a segment download"""
    if progress_id not in segment_progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    return segment_progress[progress_id]

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
        reload=False
    )
