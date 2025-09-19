'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/config';

interface VideoInfo {
  title: string;
  thumbnail?: string;
  duration?: number;
  formats: FormatInfo[];
  url?: string;
}

interface FormatInfo {
  format_id: string;
  ext: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  quality?: string | number;
}

interface SegmentSelectorProps {
  videoInfo: VideoInfo;
  onSegmentSelected: (startTime: number, endTime: number, formatId: string, outputFormat: 'mp4' | 'mp3') => void;
  onClose: () => void;
}

interface ProgressData {
  status: 'downloading' | 'extracting' | 'completed' | 'error';
  progress: number;
  message: string;
  filename?: string;
  error?: string;
}

export function SegmentSelector({ videoInfo, onSegmentSelected, onClose }: SegmentSelectorProps) {
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [selectedFormat, setSelectedFormat] = useState<string>('bestvideo+bestaudio/best');
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const hasTriggeredDownload = useRef(false);

  // Initialize end time to video duration
  useEffect(() => {
    if (videoInfo.duration) {
      setEndTime(videoInfo.duration);
    }
  }, [videoInfo.duration]);

  // Validate segment selection
  useEffect(() => {
    const valid = startTime >= 0 && endTime > startTime && endTime <= (videoInfo.duration || 0);
    setIsValid(valid);
  }, [startTime, endTime, videoInfo.duration]);

  // Progress tracking effect
  useEffect(() => {
    if (!progressId || !isDownloading) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(getApiUrl(`/segment-progress/${progressId}`));
        if (response.ok) {
          const progressData = await response.json();
          setProgress(progressData);
          
          if (progressData.status === 'completed' || progressData.status === 'error') {
            setIsDownloading(false);
            clearInterval(interval);
            
            if (progressData.status === 'completed' && !hasTriggeredDownload.current) {
              // Trigger download with robust fallbacks
              const downloadUrl = getApiUrl(progressData.download_url || `/files/${progressData.filename}`);
              try {
                hasTriggeredDownload.current = true;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = progressData.filename || 'segment.mp4';
                link.rel = 'noopener';
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch {
                // As a fallback, navigate the window to the URL
                hasTriggeredDownload.current = true;
                window.location.href = downloadUrl;
              }
              // Close modal after successful download
              setTimeout(() => onClose(), 1500);
            }
          }
        }
      } catch (error) {
        console.error('Progress tracking error:', error);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [progressId, isDownloading, onClose]);

  // Format time for display (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse time input (MM:SS or HH:MM:SS)
  const parseTime = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Handle time input change
  const handleTimeChange = (timeString: string, isStart: boolean) => {
    const seconds = parseTime(timeString);
    if (isStart) {
      setStartTime(seconds);
    } else {
      setEndTime(seconds);
    }
  };

  // Calculate segment duration
  const segmentDuration = endTime - startTime;

  // Quality options
  const qualityOptions = [
    { id: 'bestvideo+bestaudio/best', label: 'Best Quality (Auto)', description: 'Highest available quality' },
    { id: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', label: '1080p', description: 'Full HD quality' },
    { id: 'bestvideo[height<=720]+bestaudio/best[height<=720]', label: '720p', description: 'HD quality' },
    { id: 'bestvideo[height<=480]+bestaudio/best[height<=480]', label: '480p', description: 'Standard quality' },
    { id: 'bestvideo[height<=360]+bestaudio/best[height<=360]', label: '360p', description: 'Low quality' },
  ];

  const handleDownload = async () => {
    if (!isValid || isDownloading) return;

    setIsDownloading(true);
    setProgress({
      status: 'downloading',
      progress: 0,
      message: 'Starting download...'
    });

    try {
      const device = detectDevice();
      
      const response = await fetch(getApiUrl('/download-segment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoInfo.url || '',
          format_id: selectedFormat,
          output_format: outputFormat,
          device_type: device.type,
          start_time: startTime,
          end_time: endTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start segment download');
      }

      const result = await response.json();
      
      // Use backend-provided progress_id
      if (result && result.progress_id) {
        setProgressId(result.progress_id as string);
      } else {
        throw new Error('No progress_id returned from server');
      }
      
      // Start progress tracking
      setProgress((prev) => ({
        status: 'downloading',
        progress: Math.max(prev?.progress || 0, 5),
        message: 'Download started...'
      }));

    } catch (error) {
      console.error('Download error:', error);
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Download failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsDownloading(false);
    }
  };

  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return { type: 'ios', format: 'mp4', quality: 'bestvideo+bestaudio/best' };
    } else if (/android/.test(userAgent)) {
      return { type: 'android', format: 'mp4', quality: 'bestvideo+bestaudio/best' };
    } else if (/macintosh|mac os x/.test(userAgent) || platform.includes('mac')) {
      return { type: 'mac', format: 'mov', quality: 'bestvideo+bestaudio/best' };
    } else if (/windows/.test(userAgent)) {
      return { type: 'windows', format: 'mp4', quality: 'bestvideo+bestaudio/best' };
    } else if (/linux/.test(userAgent)) {
      return { type: 'linux', format: 'mp4', quality: 'bestvideo+bestaudio/best' };
    } else {
      return { type: 'unknown', format: 'mp4', quality: 'bestvideo+bestaudio/best' };
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light transition-colors"
        >
          ×
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">
            🎬 Select Video Segment
          </h3>
          <p className="text-gray-300 text-sm">
            This video is {formatTime(videoInfo.duration || 0)} long. Select the specific part you want to download.
          </p>
        </div>

        {videoInfo.thumbnail && (
          <img 
            src={videoInfo.thumbnail} 
            alt="Video thumbnail" 
            className="w-full h-48 object-cover rounded-lg mb-6"
          />
        )}

        {/* Time Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">⏰ Select Time Range</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Start Time */}
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-white font-medium mb-2">Start Time</label>
              <input
                type="text"
                value={formatTime(startTime)}
                onChange={(e) => handleTimeChange(e.target.value, true)}
                placeholder="00:00"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <p className="text-gray-400 text-xs mt-1">Format: MM:SS or HH:MM:SS</p>
            </div>

            {/* End Time */}
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-white font-medium mb-2">End Time</label>
              <input
                type="text"
                value={formatTime(endTime)}
                onChange={(e) => handleTimeChange(e.target.value, false)}
                placeholder="00:00"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <p className="text-gray-400 text-xs mt-1">Format: MM:SS or HH:MM:SS</p>
            </div>
          </div>

          {/* Quick Time Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setStartTime(0)}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
            >
              Start from beginning
            </button>
            <button
              onClick={() => setEndTime(videoInfo.duration || 0)}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
            >
              End at video end
            </button>
            <button
              onClick={() => {
                const mid = (videoInfo.duration || 0) / 2;
                setStartTime(mid - 300); // 5 minutes before middle
                setEndTime(mid + 300);   // 5 minutes after middle
              }}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
            >
              Middle 10 minutes
            </button>
          </div>

          {/* Segment Info */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Selected Segment</p>
                <p className="text-gray-300 text-sm">
                  {formatTime(startTime)} → {formatTime(endTime)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold text-lg">
                  {formatTime(segmentDuration)}
                </p>
                <p className="text-gray-400 text-xs">Duration</p>
              </div>
            </div>
            
            {!isValid && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
                ⚠️ Please select a valid time range (start &lt; end)
              </div>
            )}
          </div>
        </div>

        {/* Output Format Selection */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">📁 Output Format:</label>
          <div className="flex gap-4">
            <label className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <input
                type="radio"
                value="mp4"
                checked={outputFormat === 'mp4'}
                onChange={(e) => setOutputFormat(e.target.value as 'mp4')}
                className="mr-3"
              />
              <div>
                <div className="text-white font-medium">MP4 (Video)</div>
                <div className="text-gray-400 text-sm">Video with audio</div>
              </div>
            </label>
            <label className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <input
                type="radio"
                value="mp3"
                checked={outputFormat === 'mp3'}
                onChange={(e) => setOutputFormat(e.target.value as 'mp3')}
                className="mr-3"
              />
              <div>
                <div className="text-white font-medium">MP3 (Audio)</div>
                <div className="text-gray-400 text-sm">Audio only</div>
              </div>
            </label>
          </div>
        </div>

        {/* Quality Selection */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">🎯 Quality:</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {qualityOptions.map((option) => (
              <label key={option.id} className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={option.id}
                  checked={selectedFormat === option.id}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {option.label}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Progress Display */}
        {isDownloading && progress && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 font-medium">{progress.message}</span>
              <span className="text-blue-400 text-sm">{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            {progress.status === 'error' && (
              <p className="text-red-400 text-sm mt-2">{progress.error}</p>
            )}
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!isValid || isDownloading}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform ${
            isValid && !isDownloading
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:shadow-lg hover:shadow-yellow-500/25 hover:-translate-y-1' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isDownloading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Downloading...</span>
            </div>
          ) : isValid ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>Download Segment ({formatTime(segmentDuration)})</span>
            </div>
          ) : (
            'Select Valid Time Range'
          )}
        </button>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            💡 <strong>Tips:</strong> Use MM:SS format (e.g., 05:30) or HH:MM:SS for longer videos. 
            The shorter the segment, the faster the download!
          </p>
        </div>
      </div>
    </div>
  );
}
