import { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Scissors,
  Box,
  Eraser,
  Layers,
  Type,
  Expand,
  MoreHorizontal,
  Download,
  ChevronDown,
} from 'lucide-react';

// 高清放大解析度選項
type UpscaleResolution = '2k' | '4k' | '8k';

interface UpscaleOption {
  id: UpscaleResolution;
  label: string;
  scale: number;
  maxWidth: number;
}

const UPSCALE_OPTIONS: UpscaleOption[] = [
  { id: '2k', label: '2K', scale: 2, maxWidth: 2048 },
  { id: '4k', label: '4K', scale: 4, maxWidth: 4096 },
  { id: '8k', label: '8K', scale: 8, maxWidth: 8192 },
];

interface ImageToolbarProps {
  onUpscale?: (scale: number) => void;
  onRemoveBackground?: () => void;
  onMockup?: () => void;
  onErase?: () => void;
  onEditElements?: () => void;
  onEditText?: () => void;
  onExpand?: () => void;
  onMore?: () => void;
  onDownload?: () => void;
  imageWidth?: number;
  imageHeight?: number;
}

export function ImageToolbar({
  onUpscale,
  onRemoveBackground,
  onMockup,
  onErase,
  onEditElements,
  onEditText,
  onExpand,
  onMore,
  onDownload,
  imageWidth = 1024,
  imageHeight = 1024,
}: ImageToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUpscaleMenu, setShowUpscaleMenu] = useState(false);
  const [selectedUpscale, setSelectedUpscale] = useState<UpscaleResolution>('2k');
  const upscaleRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (upscaleRef.current && !upscaleRef.current.contains(e.target as Node)) {
        setShowUpscaleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 計算放大後的尺寸
  const getUpscaledSize = (option: UpscaleOption) => {
    const newWidth = Math.min(imageWidth * option.scale, option.maxWidth);
    const aspectRatio = imageHeight / imageWidth;
    const newHeight = Math.round(newWidth * aspectRatio);
    return { width: newWidth, height: newHeight };
  };

  const selectedOption = UPSCALE_OPTIONS.find(o => o.id === selectedUpscale) || UPSCALE_OPTIONS[0];
  const upscaledSize = getUpscaledSize(selectedOption);

  const tools = [
    { id: 'remove-bg', label: '移除背景', icon: <Scissors size={16} />, onClick: onRemoveBackground },
    { id: 'mockup', label: 'Mockup', icon: <Box size={16} />, onClick: onMockup },
    { id: 'erase', label: '擦除', icon: <Eraser size={16} />, onClick: onErase },
    { id: 'edit-elements', label: '編輯元素', icon: <Layers size={16} />, onClick: onEditElements },
    { id: 'edit-text', label: '編輯文字', icon: <Type size={16} />, onClick: onEditText, isNew: true },
    { id: 'expand', label: '擴展', icon: <Expand size={16} />, onClick: onExpand },
  ];

  return (
    <div className="flex items-center gap-1 bg-white rounded-full shadow-lg px-2 py-1.5 border border-gray-100">
      {/* 高清放大按鈕 - 特殊處理有下拉選單 */}
      <div ref={upscaleRef} className="relative">
        <button
          onClick={() => setShowUpscaleMenu(!showUpscaleMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition-colors relative"
        >
          <span className="absolute -top-1.5 -left-0.5 px-1 py-0.5 bg-blue-500 text-white text-[10px] rounded font-medium">
            HD
          </span>
          <Maximize2 size={16} />
          <span>放大</span>
          <ChevronDown size={14} className={`transition-transform ${showUpscaleMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* 高清放大下拉選單 */}
        {showUpscaleMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-3 px-4 min-w-[200px] z-50">
            <div className="text-xs font-medium text-gray-500 mb-2">高清放大</div>

            {/* 解析度選擇 */}
            <div className="flex gap-1 mb-3">
              {UPSCALE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedUpscale(option.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedUpscale === option.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 放大後尺寸預覽 */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">W</span>
                <span className="text-sm font-medium text-gray-700">{upscaledSize.width}</span>
              </div>
              <span className="text-gray-400">×</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">H</span>
                <span className="text-sm font-medium text-gray-700">{upscaledSize.height}</span>
              </div>
            </div>

            {/* 確認放大按鈕 */}
            <button
              onClick={() => {
                onUpscale?.(selectedOption.scale);
                setShowUpscaleMenu(false);
              }}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              確認放大
            </button>
          </div>
        )}
      </div>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition-colors relative"
        >
          {tool.icon}
          <span>{tool.label}</span>
          {tool.isNew && (
            <span className="px-1 py-0.5 bg-red-500 text-white text-[10px] rounded font-medium">
              New
            </span>
          )}
        </button>
      ))}

      {/* 更多按鈕 */}
      <div className="relative">
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>

        {showMoreMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[120px] z-50">
            <button
              onClick={() => {
                onMore?.();
                setShowMoreMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              更多功能
            </button>
          </div>
        )}
      </div>

      {/* 下載按鈕 */}
      <button
        onClick={onDownload}
        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors ml-1"
      >
        <Download size={16} />
      </button>
    </div>
  );
}
