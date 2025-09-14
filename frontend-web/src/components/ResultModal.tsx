'use client';

interface ResultModalProps {
  success: boolean;
  content: string;
  onClose: () => void;
}

export function ResultModal({ success, content, onClose }: ResultModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`
          bg-gray-900/95 backdrop-blur-md border rounded-2xl p-8 max-w-md w-full shadow-2xl relative
          ${success ? 'border-green-500/50' : 'border-red-500/50'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light transition-colors"
        >
          ×
        </button>

        <div 
          className="text-center"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
