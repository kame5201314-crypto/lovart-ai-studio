import { useState } from 'react';
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
} from 'lucide-react';

interface ImageToolbarProps {
  onUpscale?: () => void;
  onRemoveBackground?: () => void;
  onMockup?: () => void;
  onErase?: () => void;
  onEditElements?: () => void;
  onEditText?: () => void;
  onExpand?: () => void;
  onMore?: () => void;
  onDownload?: () => void;
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
}: ImageToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const tools = [
    { id: 'upscale', label: '放大', icon: <Maximize2 size={16} />, onClick: onUpscale, badge: 'HD' },
    { id: 'remove-bg', label: '移除背景', icon: <Scissors size={16} />, onClick: onRemoveBackground },
    { id: 'mockup', label: 'Mockup', icon: <Box size={16} />, onClick: onMockup },
    { id: 'erase', label: '擦除', icon: <Eraser size={16} />, onClick: onErase },
    { id: 'edit-elements', label: '编辑元素', icon: <Layers size={16} />, onClick: onEditElements, isNew: true },
    { id: 'edit-text', label: '编辑文字', icon: <Type size={16} />, onClick: onEditText },
    { id: 'expand', label: '扩展', icon: <Expand size={16} />, onClick: onExpand },
  ];

  return (
    <div className="flex items-center gap-1 bg-white rounded-full shadow-lg px-2 py-1.5 border border-gray-100">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition-colors relative"
        >
          {tool.badge && (
            <span className="absolute -top-1 -left-1 px-1 py-0.5 bg-blue-500 text-white text-[10px] rounded font-medium">
              {tool.badge}
            </span>
          )}
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
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[120px]">
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
