'use client';

import { useState, useEffect, useRef } from 'react';

interface UrlInputProps {
  onClose: () => void;
  onDownload: (url: string) => void;
}

export function UrlInput({ onClose, onDownload }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when modal opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onDownload(url.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm md:max-w-lg w-full shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white text-2xl font-light transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800/50"
        >
          ×
        </button>

        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            Enter Video URL
          </h3>
          <p className="text-slate-400 text-xs md:text-sm">
            Paste any video link to download in highest quality
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-6">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full p-4 pl-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 backdrop-blur-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 md:py-4 px-4 md:px-6 bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-xl md:rounded-2xl font-semibold hover:bg-slate-700/50 hover:text-white transition-all duration-300 backdrop-blur-sm text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="flex-1 py-3 md:py-4 px-4 md:px-6 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl md:rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/10 text-sm md:text-base"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>Download</span>
              </div>
            </button>
          </div>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full"></div>
              <span>YouTube</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full"></div>
              <span>Instagram</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full"></div>
              <span>TikTok</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-400 rounded-full"></div>
              <span>Vimeo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
