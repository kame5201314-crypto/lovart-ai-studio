import React, { useEffect, useRef } from 'react';
import {
  Edit3,
  Maximize2,
  Zap,
  Eraser,
  Layers,
  Scissors,
  Type,
  Crop,
  MessageSquare,
  Download,
  Copy,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 調整位置確保選單不會超出視窗
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 220;
    const menuHeight = items.length * 36 + 16;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > windowWidth) {
      adjustedX = windowWidth - menuWidth - 10;
    }

    if (y + menuHeight > windowHeight) {
      adjustedY = windowHeight - menuHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, [x, y, items.length]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.divider && index > 0 && (
            <div className="my-1 border-t border-gray-100" />
          )}
          <button
            className={`w-full px-3 py-2 flex items-center justify-between text-left text-sm hover:bg-blue-50 transition-colors ${
              item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
            }`}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.shortcut && (
                <span className="text-xs text-gray-400">{item.shortcut}</span>
              )}
              {item.submenu && <ChevronRight size={14} className="text-gray-400" />}
            </div>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// 預設的圖片右鍵選單項目
export const getImageContextMenuItems = (handlers: {
  onAIEdit?: () => void;
  onAIOutpaint?: () => void;
  onAIUpscale?: () => void;
  onAIRemoveObject?: () => void;
  onLayerSplit?: () => void;
  onRemoveBackground?: () => void;
  onTextReplace?: () => void;
  onCrop?: () => void;
  onAddToChat?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onToggleVisibility?: () => void;
  isLocked?: boolean;
  isVisible?: boolean;
}): ContextMenuItem[] => [
  {
    id: 'ai-edit',
    label: 'AI 改圖',
    icon: <Edit3 size={16} />,
    onClick: handlers.onAIEdit,
  },
  {
    id: 'ai-outpaint',
    label: 'AI 擴圖',
    icon: <Maximize2 size={16} />,
    onClick: handlers.onAIOutpaint,
  },
  {
    id: 'ai-upscale',
    label: 'AI 超清',
    icon: <Zap size={16} />,
    onClick: handlers.onAIUpscale,
  },
  {
    id: 'ai-remove-object',
    label: 'AI 無痕消除',
    icon: <Eraser size={16} />,
    onClick: handlers.onAIRemoveObject,
  },
  {
    id: 'layer-split',
    label: '拆分圖層',
    icon: <Layers size={16} />,
    onClick: handlers.onLayerSplit,
    divider: true,
  },
  {
    id: 'remove-bg',
    label: '摳圖',
    icon: <Scissors size={16} />,
    onClick: handlers.onRemoveBackground,
  },
  {
    id: 'text-replace',
    label: '無痕改字',
    icon: <Type size={16} />,
    onClick: handlers.onTextReplace,
  },
  {
    id: 'crop',
    label: '裁剪',
    icon: <Crop size={16} />,
    onClick: handlers.onCrop,
    divider: true,
  },
  {
    id: 'add-to-chat',
    label: '添加到聊天',
    icon: <MessageSquare size={16} />,
    onClick: handlers.onAddToChat,
  },
  {
    id: 'download',
    label: '下載',
    icon: <Download size={16} />,
    onClick: handlers.onDownload,
    divider: true,
  },
  {
    id: 'copy',
    label: '複製',
    icon: <Copy size={16} />,
    shortcut: 'Ctrl+C',
    onClick: handlers.onCopy,
  },
  {
    id: 'paste',
    label: '貼上',
    icon: <Clipboard size={16} />,
    shortcut: 'Ctrl+V',
    onClick: handlers.onPaste,
  },
  {
    id: 'duplicate',
    label: '創建副本',
    icon: <Copy size={16} />,
    shortcut: 'Ctrl+D',
    onClick: handlers.onDuplicate,
    divider: true,
  },
  {
    id: 'lock',
    label: handlers.isLocked ? '解鎖圖層' : '鎖定圖層',
    icon: handlers.isLocked ? <Unlock size={16} /> : <Lock size={16} />,
    shortcut: 'Shift+Ctrl+L',
    onClick: handlers.isLocked ? handlers.onUnlock : handlers.onLock,
  },
  {
    id: 'visibility',
    label: handlers.isVisible ? '隱藏圖層' : '顯示圖層',
    icon: handlers.isVisible ? <EyeOff size={16} /> : <Eye size={16} />,
    onClick: handlers.onToggleVisibility,
  },
  {
    id: 'delete',
    label: '刪除',
    icon: <Trash2 size={16} />,
    shortcut: 'Delete',
    onClick: handlers.onDelete,
    divider: true,
  },
];

export default ContextMenu;
