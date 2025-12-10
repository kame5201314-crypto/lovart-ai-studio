import { useState } from 'react';
import { X, Expand, Check, ChevronDown } from 'lucide-react';

interface ExpandImagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (width: number, height: number, prompt?: string) => void;
  originalWidth: number;
  originalHeight: number;
}

// 預設尺寸選項
const SIZE_PRESETS = [
  { id: 'custom', label: '自定義' },
  { id: '16:9', label: '16:9', ratio: 16/9 },
  { id: '4:3', label: '4:3', ratio: 4/3 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '3:4', label: '3:4', ratio: 3/4 },
  { id: '9:16', label: '9:16', ratio: 9/16 },
];

export function ExpandImagePanel({
  isOpen,
  onClose,
  onApply,
  originalWidth,
  originalHeight,
}: ExpandImagePanelProps) {
  const [width, setWidth] = useState(Math.round(originalWidth * 1.5));
  const [height, setHeight] = useState(Math.round(originalHeight * 1.5));
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: typeof SIZE_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setShowPresetDropdown(false);

    if (preset.id !== 'custom' && preset.ratio) {
      // 根據比例計算新尺寸，保持較大的邊
      if (preset.ratio >= 1) {
        const newWidth = Math.round(originalWidth * 1.5);
        setWidth(newWidth);
        setHeight(Math.round(newWidth / preset.ratio));
      } else {
        const newHeight = Math.round(originalHeight * 1.5);
        setHeight(newHeight);
        setWidth(Math.round(newHeight * preset.ratio));
      }
    }
  };

  const handleApply = () => {
    onApply(width, height, prompt || undefined);
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[320px]">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
            <Expand size={14} className="text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">擴圖</span>
        </div>

        {/* 預設尺寸下拉選單 */}
        <div className="relative">
          <button
            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="w-4 h-4 border border-gray-300 rounded" />
            {SIZE_PRESETS.find(p => p.id === selectedPreset)?.label}
            <ChevronDown size={14} />
          </button>

          {showPresetDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[100px] z-50">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                    selectedPreset === preset.id ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 尺寸輸入 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">W</span>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400">
          ⛓
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">H</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* 描述輸入 */}
      <div className="mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述想要重新繪製的內容，不填將基於原圖生成"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* 確認按鈕 */}
      <button
        onClick={handleApply}
        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <Check size={16} />
        確認擴圖
      </button>
    </div>
  );
}
