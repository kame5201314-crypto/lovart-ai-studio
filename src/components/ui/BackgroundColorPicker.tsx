import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

interface BackgroundColorPickerProps {
  currentColor: string;
  onChange: (color: string) => void;
}

// 預設顏色調色板
const COLOR_PALETTE = [
  // 白色和灰色系
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b',
  // 紅色系
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  // 橙色系
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  // 黃色系
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  // 綠色系
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  // 青色系
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
  // 藍色系
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  // 紫色系
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
  // 粉色系
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
];

export function BackgroundColorPicker({ currentColor, onChange }: BackgroundColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);
  const panelRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* 觸發按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
        title="更換背景顏色"
      >
        <div
          className="w-5 h-5 rounded border border-gray-200"
          style={{ backgroundColor: currentColor }}
        />
        <Palette size={16} className="text-gray-500" />
        <span className="text-sm text-gray-600">背景</span>
      </button>

      {/* 顏色選擇面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-[320px]">
          <div className="text-sm font-medium text-gray-700 mb-3">選擇背景顏色</div>

          {/* 顏色網格 */}
          <div className="grid grid-cols-10 gap-1 mb-4">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${
                  currentColor === color
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              >
                {currentColor === color && (
                  <Check
                    size={12}
                    className={`mx-auto ${
                      ['#ffffff', '#f8fafc', '#f1f5f9', '#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4', '#ecfeff', '#eff6ff', '#faf5ff', '#fdf2f8'].includes(color)
                        ? 'text-gray-600'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* 自定義顏色 */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">自定義:</span>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const color = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    setCustomColor(color);
                    onChange(color);
                  } else {
                    setCustomColor(color);
                  }
                }}
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* 透明背景選項 */}
          <button
            onClick={() => handleColorSelect('transparent')}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
              currentColor === 'transparent'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* 棋盤格圖案代表透明 */}
            <div
              className="w-5 h-5 rounded border border-gray-200"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            />
            <span className="text-sm text-gray-600">透明背景</span>
          </button>
        </div>
      )}
    </div>
  );
}
