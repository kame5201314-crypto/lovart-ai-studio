import { useState, useEffect } from 'react';
import { X, ChevronRight, Image, Frame, Video } from 'lucide-react';

// 四向移動箭頭圖示
const MoveIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-400">
    <circle cx="20" cy="20" r="3" fill="currentColor" />
    <path d="M20 6v8M16 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 26v8M16 30l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 20h8M10 16l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 20h8M30 16l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 雙指捏合縮放圖示
const PinchIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-400">
    <path d="M10 28c0-8 4-12 8-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="18" cy="14" r="2.5" fill="currentColor"/>
    <path d="M30 28c0-8-4-12-8-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="22" cy="14" r="2.5" fill="currentColor"/>
    <path d="M14 18l-3 3M26 18l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// 滑鼠左半邊高亮圖示
const MouseLeftIcon = () => (
  <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
    <rect x="2" y="2" width="24" height="32" rx="12" stroke="#d1d5db" strokeWidth="1.5" fill="white"/>
    <path d="M14 2C8.477 2 2 7.477 2 13V18H14V2Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5"/>
    <line x1="14" y1="2" x2="14" y2="18" stroke="#d1d5db" strokeWidth="1.5"/>
  </svg>
);

// 滑鼠滾輪高亮圖示
const MouseScrollIcon = () => (
  <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
    <rect x="2" y="2" width="24" height="32" rx="12" stroke="#d1d5db" strokeWidth="1.5" fill="white"/>
    <line x1="14" y1="2" x2="14" y2="18" stroke="#d1d5db" strokeWidth="1.5"/>
    <rect x="11" y="6" width="6" height="10" rx="3" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1"/>
  </svg>
);

// 添加按鈕圖示
const AddButtonIcon = () => (
  <div className="relative">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
      <span className="text-2xl text-gray-400">+</span>
    </div>
    {/* 游標 */}
    <svg className="absolute -bottom-1 -right-1" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 4L10 20L12 14L18 12L4 4Z" fill="black" stroke="white" strokeWidth="1"/>
    </svg>
  </div>
);

// 歷史面板預覽
const HistoryPanelPreview = () => (
  <div className="bg-white rounded-lg shadow-lg p-3 w-48">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-700">History</span>
      <ChevronRight size={12} className="text-gray-400" />
    </div>
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-10 h-10 bg-gray-200 rounded" />
      ))}
    </div>
    <div className="border-t pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Layer</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-4 h-4 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Opacity</span>
        <div className="flex-1 h-1 bg-gray-200 rounded-full">
          <div className="w-full h-full bg-gray-400 rounded-full" />
        </div>
        <span>100%</span>
      </div>
    </div>
  </div>
);

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const totalSteps = 4;

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('lovart-tutorial-completed');
    if (hasSeenTutorial === 'true') {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('lovart-tutorial-completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  // 第一頁：畫布操作（移動、縮放）
  const renderStep1 = () => (
    <div className="p-8">
      <div className="grid grid-cols-2 gap-6">
        {/* 移動 */}
        <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MoveIcon />
            <span className="text-gray-400 text-xs flex flex-col leading-tight">
              <span>或</span>
              <span>者</span>
            </span>
            <kbd className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm">
              Space
            </kbd>
            <span className="text-gray-300 mx-1">+</span>
            <MouseLeftIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">移動</h3>
          <p className="text-sm text-orange-500">中鍵拖曳或按住空格鍵+左鍵來平移畫布。</p>
        </div>

        {/* 縮放 */}
        <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PinchIcon />
            <span className="text-gray-400 text-xs flex flex-col leading-tight">
              <span>或</span>
              <span>者</span>
            </span>
            <kbd className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm">
              Ctrl
            </kbd>
            <span className="text-gray-300 mx-1">+</span>
            <MouseScrollIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">縮放</h3>
          <p className="text-sm text-orange-500">雙指捏合或按住Ctrl鍵滾動中鍵來縮放。</p>
        </div>
      </div>
    </div>
  );

  // 第二頁：快速添加到畫布
  const renderStep2 = () => (
    <div className="p-8">
      <div className="flex flex-col items-center">
        {/* 圖示區 */}
        <div className="mb-6">
          <AddButtonIcon />
        </div>

        {/* 選單預覽 */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6 min-w-[180px]">
          <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Image size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Image</span>
            </div>
            <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">A</kbd>
          </div>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Frame size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Frame</span>
            </div>
            <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">F</kbd>
          </div>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Video size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Video</span>
            </div>
          </div>
        </div>

        {/* 標題和說明 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">快速添加到畫布：生成器和框架</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>添加生成器來使用畫布提示詞創建圖像或視頻。</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>添加框架來在定義的設計區域內排列文本和圖像。</span>
          </li>
        </ul>
      </div>
    </div>
  );

  // 第三頁：圖層和編輯歷史
  const renderStep3 = () => (
    <div className="p-8">
      <div className="flex flex-col items-center">
        {/* 面板預覽 */}
        <div className="mb-6">
          <HistoryPanelPreview />
        </div>

        {/* 標題和說明 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">圖層和編輯歷史</h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          管理圖層和查看編輯歷史。
        </p>
      </div>
    </div>
  );

  // 第四頁：新功能介紹
  const renderStep4 = () => (
    <div className="p-8">
      <div className="flex flex-col items-center">
        {/* 黃色背景區域 */}
        <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl p-6 mb-6 relative overflow-hidden w-full max-w-md">
          {/* 裝飾香蕉 */}
          <div className="absolute top-2 left-2 text-2xl">🍌</div>
          <div className="absolute top-4 right-4 text-xl">🍌</div>
          <div className="absolute bottom-2 left-8 text-xl">🍌</div>
          <div className="absolute bottom-4 right-2 text-2xl">🍌</div>

          {/* 關閉按鈕 */}
          <button className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800">
            <X size={14} />
          </button>

          {/* 工具列預覽 */}
          <div className="bg-white rounded-full px-4 py-2 flex items-center gap-3 w-fit mx-auto mt-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
            <div className="w-6 h-6 bg-blue-500 rounded-full" />
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
          </div>

          {/* 游標 */}
          <svg className="mx-auto mt-2" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M4 4L10 20L12 14L18 12L4 4Z" fill="black" stroke="white" strokeWidth="1"/>
          </svg>
        </div>

        {/* 標題和說明 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">Lovart AI Studio 已準備就緒</h3>
        <p className="text-sm text-gray-600 text-center max-w-md">
          快速模式已啟用，讓您可以立即開始創作！
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden relative">
        {/* 關閉按鈕 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* 內容區 */}
        {renderCurrentStep()}

        {/* 底部導航 */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* 頁面指示器 */}
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              跳過
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-1"
            >
              {currentStep < totalSteps - 1 ? (
                <>
                  下一步
                  <ChevronRight size={16} />
                </>
              ) : (
                '知道了'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
