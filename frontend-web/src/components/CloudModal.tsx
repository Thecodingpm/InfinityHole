'use client';

interface CloudModalProps {
  onClose: () => void;
}

export function CloudModal({ onClose }: CloudModalProps) {
  const cloudFiles = [
    { name: 'video1.mp4', size: '45.2 MB', date: '2024-01-15', type: 'video' },
    { name: 'audio1.mp3', size: '12.8 MB', date: '2024-01-14', type: 'audio' },
    { name: 'video2.mp4', size: '78.5 MB', date: '2024-01-13', type: 'video' },
    { name: 'audio2.mp3', size: '8.3 MB', date: '2024-01-12', type: 'audio' },
  ];

  const getFileIcon = (type: string) => {
    if (type === 'video') {
      return (
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-xl"></div>
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl font-light transition-colors z-10"
        >
          ×
        </button>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent mb-2">
            Cloud Storage
          </h2>
          <p className="text-gray-400 text-sm">
            Your downloaded files and cloud storage
          </p>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">2.1 GB</div>
            <div className="text-xs text-gray-400">Used</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">7.9 GB</div>
            <div className="text-xs text-gray-400">Available</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">10 GB</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 relative z-10">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Storage Usage</span>
            <span>21%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '21%' }}></div>
          </div>
        </div>

        {/* Files List */}
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Files</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cloudFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}
                  <div>
                    <div className="text-white font-medium text-sm">{file.name}</div>
                    <div className="text-gray-400 text-xs">{file.size} • {file.date}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 relative z-10">
          <button className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1">
            Upload Files
          </button>
          <button className="flex-1 py-3 px-6 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300">
            Manage Storage
          </button>
        </div>
      </div>
    </div>
  );
}
