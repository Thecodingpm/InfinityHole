'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BlackHole } from '@/components/BlackHole';
import { UrlInput } from '@/components/UrlInput';
import { LoadingModal } from '@/components/LoadingModal';
import { ResultModal } from '@/components/ResultModal';
import { VideoDownloader } from '@/components/VideoDownloader';
import { StorageChoiceModal } from '@/components/StorageChoiceModal';
import { LandingPage } from '@/components/LandingPage';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getApiUrl } from '@/lib/config';

export default function Home() {
  const { user } = useFirebaseAuth();
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content: string } | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [showVideoDownloader, setShowVideoDownloader] = useState(false);
  const [showStorageChoice, setShowStorageChoice] = useState(false);

  // Utility function to clean up error messages
  const cleanErrorMessage = (errorMessage: string): string => {
    let cleaned = errorMessage;
    
    // Remove any remaining JSON structure first
    if (cleaned.includes('{"detail":')) {
      try {
        const parsed = JSON.parse(cleaned);
        cleaned = parsed.detail || cleaned;
      } catch {
        // If parsing fails, keep the original message
      }
    }
    
    // Remove common prefixes (do this multiple times to handle nested cases)
    while (cleaned.includes('Failed to extract video info: ')) {
      cleaned = cleaned.replace('Failed to extract video info: ', '');
    }
    while (cleaned.includes('Failed to download video: ')) {
      cleaned = cleaned.replace('Failed to download video: ', '');
    }
    
    return cleaned;
  };

  // Check clipboard for video URLs
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && isVideoUrl(text)) {
          setClipboardUrl(text);
        }
      } catch (err) {
        console.log('Clipboard access denied');
      }
    };

    checkClipboard();
  }, []);

  // Make saveToCloud available globally
  useEffect(() => {
    (window as any).saveToCloud = saveToCloud;
  }, [user]);

  const isVideoUrl = (url: string) => {
    const videoDomains = [
      'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'vimeo.com', 'twitter.com', 'x.com',
      'facebook.com', 'fb.watch', 'twitch.tv', 'dailymotion.com', 'reddit.com', 'redd.it',
      'pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com', 'youporn.com', 'tube8.com',
      'xtube.com', 'beeg.com', 'tnaflix.com', 'empflix.com', 'slutload.com', 'keezmovies.com',
      'drtuber.com', 'nuvid.com', 'sunporno.com', 'porn.com', 'pornhd.com', 'pornoxo.com',
      'onlyfans.com', 'chaturbate.com', 'cam4.com', 'myfreecams.com', 'livejasmin.com',
      'stripchat.com', 'bongacams.com', 'camsoda.com', 'streamate.com', 'imlive.com',
      'vimeo.com', 'dailymotion.com', 'metacafe.com', 'veoh.com', 'break.com', 'liveleak.com',
      'rumble.com', 'odysee.com', 'bitchute.com', 'd.tube', 'lbry.tv', 'peertube.com',
      'archive.org', 'vuclip.com', 'vid.me', 'streamable.com', 'gfycat.com', 'imgur.com',
      '9gag.com', 'vine.co', 'periscope.tv', 'meerkat.tv', 'blab.im', 'younow.com'
    ];
    return videoDomains.some(domain => url.includes(domain));
  };

  const handleBlackHoleClick = async () => {
    // Always show URL input popup when black hole is clicked
    setShowUrlInput(true);
  };

  // Device detection function
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

  const handleExtractVideoInfo = async (url: string) => {
    setIsLoading(true);
    setShowUrlInput(false);
    setResult(null);
    setError(null);

    try {
      console.log('Extracting video info for URL:', url);

      // Extract video info
      const extractResponse = await fetch(getApiUrl('/extract'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
      });

      if (!extractResponse.ok) {
        let errorMessage = 'Failed to extract video info';
        try {
          const errorData = await extractResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          const errorText = await extractResponse.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(cleanErrorMessage(errorMessage));
      }

      const extractedVideoInfo = await extractResponse.json();
      console.log('Video info:', extractedVideoInfo);

      // Set video info with original URL and show storage choice
      setVideoInfo({ ...extractedVideoInfo, url: url });
      setShowStorageChoice(true);

    } catch (error: any) {
      console.error('Extract error:', error);
      let errorMessage = 'Failed to extract video info. Please try again.';
      if (error.message) {
        errorMessage = cleanErrorMessage(error.message);
      }
      setError(errorMessage);
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-red-400 mb-2">Extraction Failed</h3>
            <p class="text-slate-300 text-sm">Could not get video information</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-medium mb-3">${errorMessage}</p>
            <p class="text-slate-400 text-sm">Please try a different video URL or check your internet connection.</p>
          </div>
        </div>
      `;
      setResult({ success: false, content });
    } finally {
      setIsLoading(false);
    }
  };

  const saveToCloud = async (filename: string, fileType: string, fileSize: number) => {
    if (!user) {
      alert('Please login to save files to cloud storage');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(getApiUrl('/cloud/save-download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: filename,
          file_type: fileType,
          file_size: fileSize
        }),
      });

      if (response.ok) {
        alert('File saved to cloud storage successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to save to cloud: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert('Failed to save to cloud storage');
    }
  };

  const handleLocalDownload = async (format: 'video' | 'audio') => {
    if (!videoInfo) return;

    setIsLoading(true);
    setShowStorageChoice(false);
    setResult(null);
    setError(null);

    try {
      const device = detectDevice();
      console.log('Starting local download');
      console.log('Detected device:', device);
      console.log('Video info:', videoInfo);

      // Download video with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      console.log('Sending download request to backend...');
      const downloadResponse = await fetch(getApiUrl('/download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoInfo.url || '',
          format_id: device.quality, // Use device-optimized quality
          output_format: format === 'audio' ? 'mp3' : (device.format === 'mov' ? 'mp4' : device.format), // Use selected format
          device_type: device.type
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Download response received:', downloadResponse.status, downloadResponse.ok);

      if (!downloadResponse.ok) {
        let errorMessage = 'Failed to download video';
        try {
          const errorData = await downloadResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          const errorText = await downloadResponse.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const downloadInfo = await downloadResponse.json();
      console.log('Download info:', downloadInfo);

      // Auto-download the file
      const downloadLink = `http://localhost:8000${downloadInfo.download_url}`;
      
      // Try to auto-download (works better on desktop)
      try {
        const link = document.createElement('a');
        link.href = downloadLink;
        link.download = downloadInfo.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.log('Auto-download failed, user will need to click manually');
      }

      // Show success with download info
      console.log('Creating success message...');
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-emerald-400 mb-2">Download Complete!</h3>
            <p class="text-slate-300 text-sm">Saved to your device • ${device.type.toUpperCase()} optimized</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-semibold mb-3 text-lg">${videoInfo.title}</p>
            <div class="flex justify-center space-x-6 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span class="text-slate-300">Format: <span class="text-blue-400 font-semibold">${device.format.toUpperCase()}</span></span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span class="text-slate-300">Size: <span class="text-emerald-400 font-semibold">${(downloadInfo.filesize / (1024 * 1024)).toFixed(1)} MB</span></span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col md:flex-row gap-4 justify-center">
            <a href="${downloadLink}" 
               class="inline-block bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-white/10"
               download="${downloadInfo.filename}">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Download Again</span>
              </div>
            </a>
          </div>
        </div>
      `;
      setResult({ success: true, content });

    } catch (error: any) {
      console.error('Download error:', error);
      let errorMessage = 'Failed to download video. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Download timed out. Please try again with a shorter video.';
      } else if (error.message) {
        errorMessage = cleanErrorMessage(error.message);
      }
      setError(errorMessage);
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-red-400 mb-2">Download Failed</h3>
            <p class="text-slate-300 text-sm">Something went wrong with the download</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-medium mb-3">${errorMessage}</p>
            <p class="text-slate-400 text-sm">Please try a different video URL or check your internet connection.</p>
          </div>
        </div>
      `;
      setResult({ success: false, content });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloudDownload = async (format: 'video' | 'audio') => {
    if (!videoInfo) return;

    if (!user) {
      alert('Please login to save files to cloud storage');
      return;
    }

    setIsLoading(true);
    setShowStorageChoice(false);
    setResult(null);
    setError(null);

    // Declare progressInterval outside try block so it can be cleared in catch
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const device = detectDevice();
      console.log('Starting cloud download');
      console.log('Detected device:', device);

      // Show initial progress message
      setResult({
        success: false,
        content: `
          <div class="text-center">
            <div class="mb-6">
              <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 animate-pulse">
                <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-green-400 mb-2">Downloading Video...</h3>
              <p class="text-gray-400 mb-4">Preparing your video for cloud storage</p>
              <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full animate-pulse" style="width: 30%"></div>
              </div>
              <p class="text-sm text-gray-500">Step 1 of 2: Downloading video...</p>
            </div>
          </div>
        `
      });

      // Download video with extended timeout for large files
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 minute timeout for large videos
      
      const downloadResponse = await fetch(getApiUrl('/download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoInfo.url || '',
          format_id: device.quality, // Use device-optimized quality
          output_format: format === 'audio' ? 'mp3' : (device.format === 'mov' ? 'mp4' : device.format), // Use selected format
          device_type: device.type
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!downloadResponse.ok) {
        let errorMessage = 'Failed to download video';
        try {
          const errorData = await downloadResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          const errorText = await downloadResponse.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('Download failed:', errorMessage);
        
        // Handle specific download errors
        if (downloadResponse.status === 408 || downloadResponse.status === 504) {
          throw new Error('Download timeout. The video is too large or taking too long. Try a shorter video or check your internet connection.');
        } else if (downloadResponse.status === 413) {
          throw new Error('Video file is too large to download. Try a shorter video or lower quality.');
        } else {
          throw new Error(errorMessage);
        }
      }

      const downloadInfo = await downloadResponse.json();
      console.log('Download info:', downloadInfo);

      // Save to cloud storage with timeout and better error handling
      const token = await user.getIdToken();
      console.log('Firebase token obtained, uploading to cloud...');
      
      // Calculate estimated upload time based on file size
      const fileSizeMB = downloadInfo.filesize / (1024 * 1024);
      const estimatedMinutes = Math.max(1, Math.ceil(fileSizeMB / 10)); // Rough estimate: 10MB per minute
      
      // Show cloud upload progress message with time estimation
      setResult({
        success: false,
        content: `
          <div class="text-center">
            <div class="mb-6">
              <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 animate-pulse">
                <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-blue-400 mb-2">Uploading to Cloud...</h3>
              <p class="text-gray-400 mb-4">Step 2 of 2: Saving to your cloud storage</p>
              <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style="width: 70%"></div>
              </div>
              <p class="text-sm text-gray-500">Uploading ${fileSizeMB.toFixed(1)} MB to cloud storage...</p>
              <p class="text-xs text-gray-600 mt-2">⏱️ Estimated time: ${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}</p>
            </div>
          </div>
        `
      });
      
      const cloudController = new AbortController();
      const cloudTimeoutId = setTimeout(() => cloudController.abort(), 1200000); // 20 minute timeout for large files
      
      // Start progress simulation for better UX
      let progressPercent = 70;
      progressInterval = setInterval(() => {
        progressPercent = Math.min(95, progressPercent + Math.random() * 5);
        setResult({
          success: false,
          content: `
            <div class="text-center">
              <div class="mb-6">
                <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 animate-pulse">
                  <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-blue-400 mb-2">Uploading to Cloud...</h3>
                <p class="text-gray-400 mb-4">Step 2 of 2: Saving to your cloud storage</p>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                </div>
                <p class="text-sm text-gray-500">Uploading ${fileSizeMB.toFixed(1)} MB to cloud storage...</p>
                <p class="text-xs text-gray-600 mt-2">⏱️ Estimated time: ${Math.max(1, Math.ceil(estimatedMinutes * (1 - progressPercent/100)))} minute${Math.max(1, Math.ceil(estimatedMinutes * (1 - progressPercent/100))) > 1 ? 's' : ''} remaining</p>
              </div>
            </div>
          `
        });
      }, 2000);
      
      const cloudResponse = await fetch(getApiUrl('/cloud/save-download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: downloadInfo.filename,
          file_type: device.format === 'mov' ? 'mp4' : device.format,
          file_size: downloadInfo.filesize
        }),
        signal: cloudController.signal
      });
      
      clearTimeout(cloudTimeoutId);
      clearInterval(progressInterval);

      if (!cloudResponse.ok) {
        const errorData = await cloudResponse.json();
        console.error('Cloud upload failed:', errorData);
        
        // Handle specific error cases
        if (cloudResponse.status === 401) {
          throw new Error('Authentication failed. Please login again and try cloud upload.');
        } else if (cloudResponse.status === 404) {
          throw new Error('Downloaded file not found. The video may have been cleaned up. Please try downloading again.');
        } else if (cloudResponse.status === 413) {
          throw new Error('File too large for cloud storage. Try downloading a shorter video or lower quality.');
        } else if (cloudResponse.status === 408 || cloudResponse.status === 504) {
          throw new Error('Upload timeout. The file is too large or your connection is slow. Try a smaller video.');
        } else {
          throw new Error(`Cloud upload failed: ${errorData.detail || 'Unknown error. Please try again.'}`);
        }
      }

      // Show success with cloud save info
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-purple-400 mb-2">Saved to Cloud!</h3>
            <p class="text-slate-300 text-sm">Video saved to your cloud library</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-semibold mb-3 text-lg">${videoInfo.title}</p>
            <div class="flex justify-center space-x-6 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span class="text-slate-300">Format: <span class="text-purple-400 font-semibold">${device.format.toUpperCase()}</span></span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span class="text-slate-300">Size: <span class="text-pink-400 font-semibold">${(downloadInfo.filesize / (1024 * 1024)).toFixed(1)} MB</span></span>
              </div>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-gray-400 text-sm mb-4">Access your video anytime from the cloud storage</p>
            <button onclick="window.location.reload()" class="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-white/10">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                <span>View Cloud Storage</span>
              </div>
            </button>
          </div>
        </div>
      `;
      setResult({ success: true, content });

    } catch (error: any) {
      console.error('Cloud download error:', error);
      if (progressInterval) {
        clearInterval(progressInterval); // Clear progress interval on error
      }
      let errorMessage = 'Failed to save video to cloud. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out. The file is too large or your connection is slow. Try a smaller video.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-red-400 mb-2">Cloud Save Failed</h3>
            <p class="text-slate-300 text-sm">Something went wrong with the cloud save</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-medium mb-3">${errorMessage}</p>
            <p class="text-slate-400 text-sm">Please try again or check your internet connection.</p>
          </div>
        </div>
      `;
      setResult({ success: false, content });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (formatId: string, outputFormat: 'mp4' | 'mp3') => {
    if (!videoInfo) return;

    setIsLoading(true);
    setShowVideoDownloader(false);
    setResult(null);
    setError(null);

    try {
      const device = detectDevice();
      console.log('Starting download with format:', formatId, 'output:', outputFormat);
      console.log('Detected device:', device);

      // Download video with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      const downloadResponse = await fetch(getApiUrl('/download'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoInfo.url || '', // We need to store the original URL
          format_id: formatId,
          output_format: outputFormat,
          device_type: device.type
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!downloadResponse.ok) {
        let errorMessage = 'Failed to download video';
        try {
          const errorData = await downloadResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          const errorText = await downloadResponse.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const downloadInfo = await downloadResponse.json();
      console.log('Download info:', downloadInfo);

      // Auto-download the file
      const downloadLink = `http://localhost:8000${downloadInfo.download_url}`;
      
      // Try to auto-download (works better on desktop)
      try {
        const link = document.createElement('a');
        link.href = downloadLink;
        link.download = downloadInfo.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.log('Auto-download failed, user will need to click manually');
      }

      // Show success with download info and cloud save option
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-emerald-400 mb-2">Download Started!</h3>
            <p class="text-slate-300 text-sm">Optimized for ${device.type.toUpperCase()} • ${outputFormat.toUpperCase()} format</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-semibold mb-3 text-lg">${videoInfo.title}</p>
            <div class="flex justify-center space-x-6 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span class="text-slate-300">Format: <span class="text-blue-400 font-semibold">${outputFormat.toUpperCase()}</span></span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span class="text-slate-300">Size: <span class="text-emerald-400 font-semibold">${(downloadInfo.filesize / (1024 * 1024)).toFixed(1)} MB</span></span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col md:flex-row gap-4 justify-center">
            <a href="${downloadLink}" 
               class="inline-block bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-white/10"
               download="${downloadInfo.filename}">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Download Again</span>
              </div>
            </a>
            
            <button onclick="saveToCloud('${downloadInfo.filename}', '${outputFormat}', ${downloadInfo.filesize})"
                    class="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 border border-white/10">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                <span>Save to Cloud</span>
              </div>
            </button>
          </div>
        </div>
      `;
      setResult({ success: true, content });

    } catch (error: any) {
      console.error('Download error:', error);
      let errorMessage = 'Failed to download video. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Download timed out. Please try again with a shorter video.';
      } else if (error.message) {
        errorMessage = cleanErrorMessage(error.message);
      }
      setError(errorMessage);
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-red-400 mb-2">Download Failed</h3>
            <p class="text-slate-300 text-sm">Something went wrong with the download</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-medium mb-3">${errorMessage}</p>
            <p class="text-slate-400 text-sm">Please try a different video URL or check your internet connection.</p>
          </div>
        </div>
      `;
      setResult({ success: false, content });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterApp = () => {
    setShowLandingPage(false);
  };

  // Show landing page first
  if (showLandingPage) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden relative">
      {/* Navbar */}
      <Navbar />
      
      {/* Clean Background */}
      <div className="absolute inset-0 bg-slate-900"></div>
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-8">
        {/* Title Section */}
        <div className="text-center mb-16 md:mb-20">
          <div className="mb-6 md:mb-8">
            <h1 className="text-5xl md:text-8xl font-black tracking-wider mb-4 md:mb-6 text-white">
              INFINITY HOLE
            </h1>
            <div className="w-32 md:w-40 h-1 bg-white/20 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Black Hole Section */}
        <div className="mb-12 md:mb-20">
          <BlackHole onClick={handleBlackHoleClick} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-6 md:space-y-8 w-full max-w-sm md:max-w-none">

        </div>
      </div>

      {/* Modals */}
      {showUrlInput && (
        <UrlInput 
          onClose={() => setShowUrlInput(false)}
          onDownload={handleExtractVideoInfo}
        />
      )}

      {showStorageChoice && videoInfo && (
        <StorageChoiceModal 
          videoInfo={videoInfo}
          onLocalDownload={handleLocalDownload}
          onCloudDownload={handleCloudDownload}
          onClose={() => setShowStorageChoice(false)}
        />
      )}

      {showVideoDownloader && videoInfo && (
        <VideoDownloader 
          videoInfo={videoInfo}
          onDownload={handleDownload}
          onClose={() => setShowVideoDownloader(false)}
        />
      )}

      {isLoading && <LoadingModal />}

      {result && (
        <ResultModal 
          success={result.success}
          content={result.content}
          onClose={() => setResult(null)}
        />
      )}
    </main>
  );
}