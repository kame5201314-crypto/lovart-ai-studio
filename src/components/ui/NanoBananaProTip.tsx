import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NanoBananaProTipProps {
  onClose?: () => void;
}

export function NanoBananaProTip({ onClose }: NanoBananaProTipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 檢查是否已經看過提示
    const hasSeenTip = localStorage.getItem('lovart-nano-banana-tip-seen');
    if (hasSeenTip !== 'true') {
      // 延遲顯示，等教學完成後再出現
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('lovart-nano-banana-tip-seen', 'true');
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[320px]">
        {/* 黃色背景區域 */}
        <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 p-4 relative overflow-hidden">
          {/* 關閉按鈕 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-700 hover:text-gray-900 bg-white/30 rounded-full transition-colors"
          >
            <X size={14} />
          </button>

          {/* 裝飾香蕉 */}
          <div className="absolute top-1 left-2 text-lg transform -rotate-12">🍌</div>
          <div className="absolute top-6 right-12 text-sm transform rotate-45">🍌</div>
          <div className="absolute bottom-1 left-16 text-sm transform rotate-12">🍌</div>
          <div className="absolute bottom-2 right-4 text-lg transform -rotate-45">🍌</div>

          {/* 工具列預覽 */}
          <div className="flex justify-center mt-6 mb-2">
            <div className="bg-white rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="3" fill="#9ca3af" />
                </svg>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 6h6M6 3v6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="3" fill="white" />
                </svg>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" fill="#9ca3af" />
                </svg>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 3v6M3 8l3 2 3-2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* 游標 */}
          <div className="flex justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 5L11 21L13 15L19 13L5 5Z" fill="black" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 文字內容 */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Nano Banana Pro is here</h3>
          <p className="text-sm text-gray-600 mb-4">
            Fast Mode is enabled with Nano Banana Pro for you to give it a try!
          </p>

          <button
            onClick={handleClose}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
