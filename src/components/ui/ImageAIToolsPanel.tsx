import { useState } from 'react';
import {
  MessageCircle,
  Type,
  Languages,
  Bookmark,
  Wand2,
  ChevronRight,
  Eraser,
  ImageIcon,
  Film,
  Trash2,
  Image,
  ZoomIn,
  Sparkles,
} from 'lucide-react';

interface ImageAIToolsPanelProps {
  onImageChat?: () => void;
  onExtractText?: () => void;
  onTranslate?: (targetLanguage: string) => void;
  onSaveToMemo?: () => void;
  // AI 圖像編輯子選單
  onRemoveBackground?: () => void;
  onRemoveBrushArea?: () => void;
  onRemoveObject?: () => void;
  onImageGenerator?: () => void;
  onImageToAnimation?: () => void;
  onRemoveText?: () => void;
  onChangeBackground?: () => void;
  onUpscale?: () => void;
}

export function ImageAIToolsPanel({
  onImageChat,
  onExtractText,
  onTranslate,
  onSaveToMemo,
  onRemoveBackground,
  onRemoveBrushArea,
  onRemoveObject,
  onImageGenerator,
  onImageToAnimation,
  onRemoveText,
  onChangeBackground,
  onUpscale,
}: ImageAIToolsPanelProps) {
  const [showAIEditMenu, setShowAIEditMenu] = useState(false);
  const [selectedLanguage] = useState('中文（繁體）');

  const aiEditOptions = [
    { id: 'remove-bg', label: 'AI 背景移除器', icon: <Sparkles size={16} />, onClick: onRemoveBackground },
    { id: 'remove-brush', label: '移除刷選區域', icon: <Eraser size={16} />, onClick: onRemoveBrushArea },
    { id: 'remove-object', label: '移除物件', icon: <Trash2 size={16} />, onClick: onRemoveObject },
    { id: 'image-gen', label: 'AI 圖像生成器', icon: <ImageIcon size={16} />, onClick: onImageGenerator },
    { id: 'image-animation', label: 'AI 圖生動畫', icon: <Film size={16} />, onClick: onImageToAnimation },
    { id: 'remove-text', label: '移除文字', icon: <Type size={16} />, onClick: onRemoveText },
    { id: 'change-bg', label: '更換背景', icon: <Image size={16} />, onClick: onChangeBackground },
    { id: 'upscale', label: 'AI 圖像放大', icon: <ZoomIn size={16} />, onClick: onUpscale },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[200px]">
      {/* 圖片交流 */}
      <button
        onClick={onImageChat}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
      >
        <MessageCircle size={16} className="text-gray-500" />
        <span>圖片交流</span>
      </button>

      {/* 提取文字 */}
      <button
        onClick={onExtractText}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
      >
        <Sparkles size={16} className="text-gray-500" />
        <span>提取文字</span>
      </button>

      {/* 翻譯成 */}
      <button
        onClick={() => onTranslate?.(selectedLanguage)}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
      >
        <Languages size={16} className="text-gray-500" />
        <span>翻譯成:</span>
        <span className="text-gray-500">{selectedLanguage}</span>
        <ChevronRight size={14} className="ml-auto text-gray-400" />
      </button>

      {/* 儲存到備忘錄 */}
      <button
        onClick={onSaveToMemo}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
      >
        <Bookmark size={16} className="text-gray-500" />
        <span>儲存到備忘錄</span>
      </button>

      {/* AI 圖像編輯 */}
      <div className="relative">
        <button
          onClick={() => setShowAIEditMenu(!showAIEditMenu)}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
        >
          <Wand2 size={16} className="text-gray-500" />
          <span>AI 圖像編輯</span>
          <ChevronRight size={14} className="ml-auto text-gray-400" />
        </button>

        {/* AI 圖像編輯子選單 */}
        {showAIEditMenu && (
          <div className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
            {aiEditOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  option.onClick?.();
                  setShowAIEditMenu(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <span className="text-gray-500">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 右下角的 AI 工具觸發按鈕
export function AIToolsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg text-xs text-gray-600 flex items-center gap-1 shadow-md border border-gray-200"
    >
      <Wand2 size={12} />
      <span>AI 工具</span>
    </button>
  );
}
