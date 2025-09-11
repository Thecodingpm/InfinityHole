# Video Downloader Backend

FastAPI backend service for the Video Downloader application that handles video extraction, downloading, and format conversion.

## Features

- **Video Extraction**: Extract metadata and available formats from video URLs
- **Format Conversion**: Convert videos to MP4 or MP3 using FFmpeg
- **Automatic Cleanup**: Remove temporary files after 2 hours
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Health Monitoring**: Health check endpoint for monitoring
- **CORS Support**: Cross-origin requests for Flutter app

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Or build manually:**
   ```bash
   docker build -t video-downloader-api .
   docker run -p 8000:8000 video-downloader-api
   ```

## API Documentation

Once running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_DIR` | `./downloads` | Directory for temporary files |
| `CLEANUP_INTERVAL_HOURS` | `2` | Hours before file cleanup |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `MAX_FILE_SIZE_MB` | `500` | Maximum file size in MB |
| `ALLOWED_DOMAINS` | `youtube.com,instagram.com,...` | Allowed video domains |

### Example .env File

```env
STORAGE_DIR=./downloads
CLEANUP_INTERVAL_HOURS=2
HOST=0.0.0.0
PORT=8000
MAX_FILE_SIZE_MB=500
ALLOWED_DOMAINS=youtube.com,instagram.com,tiktok.com,vimeo.com,twitter.com
```

## API Endpoints

### Extract Video Information

```http
POST /extract
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 120,
  "formats": [
    {
      "format_id": "137",
      "ext": "mp4",
      "resolution": "1080p",
      "fps": 30,
      "vcodec": "avc1",
      "acodec": "none",
      "filesize": 50000000,
      "quality": "1080p"
    }
  ]
}
```

### Download Video

```http
POST /download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format_id": "137",
  "output_format": "mp4"
}
```

**Response:**
```json
{
  "download_url": "/files/download_20231201_120000.mp4",
  "filename": "download_20231201_120000.mp4",
  "filesize": 50000000
}
```

### Serve Files

```http
GET /files/{filename}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00"
}
```

## Dependencies

### Core Dependencies
- **FastAPI**: Web framework
- **uvicorn**: ASGI server
- **yt-dlp**: Video extraction and downloading
- **python-dotenv**: Environment variable management
- **aiofiles**: Async file operations

### System Requirements
- **FFmpeg**: Video/audio processing
- **Python 3.11+**: Runtime environment

## Architecture

### File Structure
```
backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
├── env.example         # Environment template
└── README.md          # This file
```

### Key Components

1. **API Routes**: FastAPI endpoints for video operations
2. **Video Processing**: yt-dlp integration for extraction and downloading
3. **Format Conversion**: FFmpeg integration for MP3 conversion
4. **File Management**: Automatic cleanup and temporary storage
5. **Error Handling**: Comprehensive error handling and logging

## Security Considerations

- **Domain Validation**: Only allowed domains can be processed
- **File Size Limits**: Maximum file size restrictions
- **Temporary Storage**: Files are automatically cleaned up
- **CORS Configuration**: Properly configured for Flutter app

## Monitoring and Logging

- **Health Endpoint**: Monitor service status
- **Structured Logging**: Comprehensive logging for debugging
- **Error Tracking**: Detailed error messages and stack traces

## Performance Optimization

- **Async Operations**: Non-blocking I/O operations
- **Connection Pooling**: Efficient HTTP connections
- **Memory Management**: Proper cleanup of resources
- **File Streaming**: Efficient file serving

## Troubleshooting

### Common Issues

1. **FFmpeg not found**:
   ```bash
   # Install FFmpeg
   # Ubuntu/Debian
   sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. **Permission errors**:
   ```bash
   # Ensure write permissions for storage directory
   chmod 755 ./downloads
   ```

3. **Port already in use**:
   ```bash
   # Change port in .env file
   PORT=8001
   ```

4. **Docker build fails**:
   ```bash
   # Ensure Docker is running
   docker --version
   
   # Clean Docker cache
   docker system prune -a
   ```

### Logs

Check application logs for detailed error information:
```bash
# Local development
python main.py

# Docker
docker-compose logs -f
```

## Development

### Adding New Features

1. **New Endpoints**: Add routes in `main.py`
2. **New Dependencies**: Update `requirements.txt`
3. **Configuration**: Add new environment variables
4. **Testing**: Test with various video sources

### Code Style

- Follow PEP 8 guidelines
- Use type hints
- Add docstrings for functions
- Handle exceptions properly

## Deployment

### Production Considerations

1. **Environment Variables**: Set production values
2. **Reverse Proxy**: Use nginx or similar
3. **SSL/TLS**: Enable HTTPS
4. **Monitoring**: Set up health checks
5. **Logging**: Configure log aggregation
6. **Backup**: Regular backup of configuration

### Docker Production

```bash
# Build production image
docker build -t video-downloader-api:latest .

# Run with production settings
docker run -d \
  --name video-downloader-api \
  -p 8000:8000 \
  -e STORAGE_DIR=/app/downloads \
  -e CLEANUP_INTERVAL_HOURS=1 \
  -v downloads:/app/downloads \
  video-downloader-api:latest
```

## Support

For issues and questions:
1. Check the logs for error details
2. Verify all dependencies are installed
3. Test with different video sources
4. Check system resources (disk space, memory)

