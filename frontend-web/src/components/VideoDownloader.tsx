'use client';

import { useState } from 'react';

interface VideoInfo {
  title: string;
  thumbnail?: string;
  duration?: number;
  formats: FormatInfo[];
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

interface VideoDownloaderProps {
  videoInfo: VideoInfo;
  onDownload: (formatId: string, outputFormat: 'mp4' | 'mp3') => void;
  onClose: () => void;
}

export function VideoDownloader({ videoInfo, onDownload, onClose }: VideoDownloaderProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('bestvideo+bestaudio/best');
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'mp3'>('mp4');

  // Create quality options for video formats
  const qualityOptions = [
    { id: 'bestvideo+bestaudio/best', label: 'Best Quality (Auto)', description: 'Highest available quality' },
    { id: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', label: '1080p', description: 'Full HD quality' },
    { id: 'bestvideo[height<=720]+bestaudio/best[height<=720]', label: '720p', description: 'HD quality' },
    { id: 'bestvideo[height<=480]+bestaudio/best[height<=480]', label: '480p', description: 'Standard quality' },
    { id: 'bestvideo[height<=360]+bestaudio/best[height<=360]', label: '360p', description: 'Low quality' },
  ];

  const audioFormats = videoInfo.formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));

  const handleDownload = () => {
    if (selectedFormat) {
      onDownload(selectedFormat, outputFormat);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light transition-colors"
        >
          ×
        </button>

        <h3 className="text-2xl font-bold text-yellow-400 mb-4">
          {videoInfo.title}
        </h3>

        {videoInfo.thumbnail && (
          <img 
            src={videoInfo.thumbnail} 
            alt="Video thumbnail" 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        {/* Output Format Selection */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Output Format:</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="mp4"
                checked={outputFormat === 'mp4'}
                onChange={(e) => setOutputFormat(e.target.value as 'mp4')}
                className="mr-2"
              />
              <span className="text-white">MP4 (Video)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="mp3"
                checked={outputFormat === 'mp3'}
                onChange={(e) => setOutputFormat(e.target.value as 'mp3')}
                className="mr-2"
              />
              <span className="text-white">MP3 (Audio)</span>
            </label>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Select Quality:</label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {outputFormat === 'mp4' ? (
              qualityOptions.map((option) => (
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
              ))
            ) : (
              audioFormats.map((format) => (
                <label key={format.format_id} className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={format.format_id}
                    checked={selectedFormat === format.format_id}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {format.quality || format.ext.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {format.acodec}
                      {format.filesize && ` • ${(format.filesize / (1024 * 1024)).toFixed(1)}MB`}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:-translate-y-1"
        >
          Download {outputFormat.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
