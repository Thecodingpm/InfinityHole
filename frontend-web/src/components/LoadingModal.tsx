'use client';

export function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl md:rounded-3xl p-6 md:p-10 flex flex-col items-center shadow-2xl w-full max-w-sm md:max-w-none">
        {/* Enhanced Spinner */}
        <div className="relative mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-700/50 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 md:w-16 md:h-16 border-4 border-transparent border-r-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Loading text */}
        <div className="text-white text-lg md:text-xl font-semibold text-center mb-2">
          Processing video...
        </div>
        <div className="text-slate-400 text-xs md:text-sm text-center mb-4 md:mb-6">
          Downloading in highest available quality
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-2 md:space-x-3">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Quality indicator */}
        <div className="mt-4 md:mt-6 flex items-center space-x-2 text-slate-500 text-xs">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>Optimizing for your device</span>
        </div>
      </div>
    </div>
  );
}
