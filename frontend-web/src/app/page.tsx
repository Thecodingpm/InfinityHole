'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BlackHole } from '@/components/BlackHole';
import { UrlInput } from '@/components/UrlInput';
import { LoadingModal } from '@/components/LoadingModal';
import { ResultModal } from '@/components/ResultModal';
import { VideoDownloader } from '@/components/VideoDownloader';

export default function Home() {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; content: string } | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const isVideoUrl = (url: string) => {
    const videoDomains = ['youtube.com', 'instagram.com', 'tiktok.com', 'vimeo.com', 'twitter.com'];
    return videoDomains.some(domain => url.includes(domain));
  };

  const handleBlackHoleClick = async () => {
    if (clipboardUrl) {
      await handleDownload(clipboardUrl);
    } else {
      setShowUrlInput(true);
    }
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

  const handleDownload = async (url: string) => {
    setIsLoading(true);
    setShowUrlInput(false);
    setResult(null);
    setError(null);

    try {
      const device = detectDevice();
      console.log('Starting download for URL:', url);
      console.log('Detected device:', device);

      // Extract video info
      const extractResponse = await fetch('http://192.168.18.89:8000/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        throw new Error('Failed to extract video info: ' + errorText);
      }

      const videoInfo = await extractResponse.json();
      console.log('Video info:', videoInfo);

      // Find the highest available quality
      const availableQualities = videoInfo.formats
        .filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.resolution)
        .map((f: any) => f.resolution)
        .filter((res: string) => res && res.includes('x'))
        .sort((a: string, b: string) => {
          const aHeight = parseInt(a.split('x')[1]);
          const bHeight = parseInt(b.split('x')[1]);
          return bHeight - aHeight;
        });

      const maxQuality = availableQualities[0];
      console.log('Available qualities:', availableQualities);
      console.log('Downloading in:', maxQuality);

      // Use device-specific format selection
      let formatId = device.quality;

      // Download video with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      const downloadResponse = await fetch('http://192.168.18.89:8000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          format_id: formatId,
          output_format: device.format,
          device_type: device.type
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        throw new Error('Failed to download video: ' + errorText);
      }

      const downloadInfo = await downloadResponse.json();
      console.log('Download info:', downloadInfo);

      // Auto-download the file
      const downloadLink = `http://192.168.18.89:8000${downloadInfo.download_url}`;
      
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
      const content = `
        <div class="text-center">
          <div class="mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-emerald-400 mb-2">Download Started!</h3>
            <p class="text-slate-300 text-sm">Optimized for ${device.type.toUpperCase()} • ${device.format.toUpperCase()} format</p>
          </div>
          
          <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50">
            <p class="text-white font-semibold mb-3 text-lg">${videoInfo.title}</p>
            <div class="flex justify-center space-x-6 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span class="text-slate-300">Quality: <span class="text-blue-400 font-semibold">${maxQuality || 'Best Available'}</span></span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span class="text-slate-300">Size: <span class="text-emerald-400 font-semibold">${(downloadInfo.filesize / (1024 * 1024)).toFixed(1)} MB</span></span>
              </div>
            </div>
          </div>
          
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
      `;
      setResult({ success: true, content });

    } catch (error: any) {
      console.error('Download error:', error);
      let errorMessage = 'Failed to download video. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Download timed out. Please try again with a shorter video.';
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
              SPLITTER
            </h1>
            <div className="w-32 md:w-40 h-1 bg-white/20 mx-auto rounded-full"></div>
          </div>
          <h2 className="text-xl md:text-3xl font-light tracking-[0.2em] md:tracking-[0.3em] text-slate-300 mb-3 md:mb-4">
            Video Downloader
          </h2>
          <p className="text-slate-400 text-sm md:text-lg max-w-sm md:max-w-lg mx-auto leading-relaxed font-light px-2">
            Download videos from YouTube, Instagram, TikTok, and more
          </p>
        </div>

        {/* Black Hole Section */}
        <div className="mb-12 md:mb-20">
          <BlackHole onClick={handleBlackHoleClick} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-6 md:space-y-8 w-full max-w-sm md:max-w-none">
          {/* Primary Action Button */}
          <button 
            className="group flex items-center space-x-4 md:space-x-6 px-6 md:px-10 py-4 md:py-5 bg-white/10 hover:bg-white/20 rounded-2xl md:rounded-3xl transition-all duration-300 border border-white/20 hover:border-white/30 w-full md:w-auto"
            onClick={() => setShowUrlInput(true)}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="text-white font-bold text-lg md:text-xl">Browse Videos</div>
              <div className="text-white/80 text-xs md:text-sm">Add video URL manually</div>
            </div>
          </button>

          {/* Secondary Info */}
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 lg:space-x-8 text-slate-400 text-xs md:text-sm w-full">
            <div className="flex items-center space-x-2 md:space-x-3 bg-white/5 px-3 md:px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span className="font-medium">50+ platforms</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 bg-white/5 px-3 md:px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span className="font-medium">MP4 & MP3</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 bg-white/5 px-3 md:px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span className="font-medium">4K Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUrlInput && (
        <UrlInput 
          onClose={() => setShowUrlInput(false)}
          onDownload={handleDownload}
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