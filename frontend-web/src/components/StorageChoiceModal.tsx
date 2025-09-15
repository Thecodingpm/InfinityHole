'use client';

import { useState } from 'react';

interface VideoInfo {
  title: string;
  thumbnail?: string;
  duration?: number;
  formats: FormatInfo[];
  url: string;
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

interface StorageChoiceModalProps {
  videoInfo: VideoInfo;
  onLocalDownload: () => void;
  onCloudDownload: () => void;
  onClose: () => void;
}

export function StorageChoiceModal({ videoInfo, onLocalDownload, onCloudDownload, onClose }: StorageChoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLocalDownload = async () => {
    setIsProcessing(true);
    try {
      await onLocalDownload();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloudDownload = async () => {
    setIsProcessing(true);
    try {
      await onCloudDownload();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/25">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">
            Choose Storage Location
          </h3>
          <p className="text-gray-400 text-sm">
            Where would you like to save this video?
          </p>
        </div>

        {/* Video Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <h4 className="text-white font-semibold mb-2 line-clamp-2">
            {videoInfo.title}
          </h4>
          {videoInfo.thumbnail && (
            <img 
              src={videoInfo.thumbnail} 
              alt="Video thumbnail" 
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Storage Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Local Storage Option */}
          <button
            onClick={handleLocalDownload}
            disabled={isProcessing}
            className="group p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Local Storage</h4>
              <p className="text-gray-400 text-sm mb-3">
                Download directly to your device
              </p>
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Instant Download</span>
              </div>
            </div>
          </button>

          {/* Cloud Storage Option */}
          <button
            onClick={handleCloudDownload}
            disabled={isProcessing}
            className="group p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Cloud Storage</h4>
              <p className="text-gray-400 text-sm mb-3">
                Save to your cloud library
              </p>
              <div className="flex items-center space-x-2 text-purple-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                <span>Access Anywhere</span>
              </div>
            </div>
          </button>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Processing your request...</p>
          </div>
        )}

        {/* Cancel Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
