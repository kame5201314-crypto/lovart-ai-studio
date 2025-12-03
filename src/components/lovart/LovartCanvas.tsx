import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface LovartCanvasProps {
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  children?: React.ReactNode;
}

export const LovartCanvas: React.FC<LovartCanvasProps> = ({
  zoom = 25,
  onZoomChange: _onZoomChange,
  children,
}) => {
  // _onZoomChange 預留給未來使用
  void _onZoomChange;
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorials = [
    {
      title: '移動',
      description: '中鍵拖曳或按住空白鍵+左鍵來平移畫布。',
      keys: [
        { icon: '🖱️', label: '' },
        { text: '或者' },
        { label: 'Space' },
        { text: '+' },
        { icon: '🖱️', label: '' },
      ],
    },
    {
      title: '縮放',
      description: '雙指捏合或按住 Ctrl 鍵滾動滑鼠來縮放。',
      keys: [
        { icon: '👆', label: '' },
        { text: '或者' },
        { label: 'Ctrl' },
        { text: '+' },
        { icon: '🖱️', label: '' },
      ],
    },
  ];

  return (
    <div className="flex-1 bg-gray-100 relative overflow-hidden">
      {/* 畫布內容 */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* 新手教學卡片 */}
      {showTutorial && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg p-6 max-w-xl w-full mx-4">
          <div className="flex gap-8">
            {tutorials.map((tutorial, idx) => (
              <div key={idx} className="flex-1">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {tutorial.keys.map((key, keyIdx) => (
                    <React.Fragment key={keyIdx}>
                      {key.icon && (
                        <span className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xl">
                          {key.icon}
                        </span>
                      )}
                      {key.label && (
                        <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium">
                          {key.label}
                        </span>
                      )}
                      {key.text && (
                        <span className="text-gray-400 text-sm">{key.text}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <h3 className="text-center font-medium text-gray-900 mb-1">{tutorial.title}</h3>
                <p className="text-center text-xs text-gray-500">{tutorial.description}</p>
              </div>
            ))}
          </div>

          {/* 分頁指示器 */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className="flex gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full ${dot === tutorialStep ? 'bg-gray-800' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => setShowTutorial(false)}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              跳過
            </button>
            <button
              onClick={() => {
                if (tutorialStep < 2) {
                  setTutorialStep(tutorialStep + 1);
                } else {
                  setShowTutorial(false);
                }
              }}
              className="px-6 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* 底部工具列 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-2">
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
          <span className="text-lg">🔧</span>
        </button>
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded text-sm">
          <span>🔥</span>
          <span>100</span>
        </div>
        <span className="text-gray-300">|</span>
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
          <Minus size={16} />
        </button>
        <span className="text-sm text-gray-600 min-w-[40px] text-center">{zoom}%</span>
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default LovartCanvas;
