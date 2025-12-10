import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  FileImage,
  FileType,
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    const menuHeight = items.length * 40 + 16;
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
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[220px]"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.divider && index > 0 && (
            <div className="my-1.5 border-t border-gray-100 mx-2" />
          )}
          <div
            className="relative"
            onMouseEnter={() => item.submenu && setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm transition-colors ${
                item.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
            >
              <span>{item.label}</span>
              <div className="flex items-center gap-2">
                {item.shortcut && (
                  <span className="text-xs text-gray-400">{item.shortcut}</span>
                )}
                {item.submenu && <ChevronRight size={14} className="text-gray-400" />}
              </div>
            </button>

            {/* 子選單 */}
            {item.submenu && hoveredItem === item.id && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[160px]">
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      if (subItem.onClick) {
                        subItem.onClick();
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </div>
                    {subItem.shortcut && (
                      <span className="text-xs text-gray-400">{subItem.shortcut}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// 右鍵選單項目 (繁體中文)
export const getImageContextMenuItems = (handlers: {
  onCopy?: () => void;
  onPaste?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToTop?: () => void;
  onMoveToBottom?: () => void;
  onSendToChat?: () => void;
  onCreateGroup?: () => void;
  onToggleVisibility?: () => void;
  onToggleLock?: () => void;
  onExport?: () => void;
  onExportPNG?: () => void;
  onExportJPG?: () => void;
  onExportSVG?: () => void;
  onDelete?: () => void;
  isLocked?: boolean;
  isVisible?: boolean;
}): ContextMenuItem[] => [
  {
    id: 'copy',
    label: '複製',
    shortcut: 'Ctrl + C',
    onClick: handlers.onCopy,
  },
  {
    id: 'paste',
    label: '貼上',
    shortcut: 'Ctrl + V',
    onClick: handlers.onPaste,
    divider: true,
  },
  {
    id: 'move-up',
    label: '上移一層',
    shortcut: 'Ctrl + ]',
    onClick: handlers.onMoveUp,
  },
  {
    id: 'move-down',
    label: '下移一層',
    shortcut: 'Ctrl + [',
    onClick: handlers.onMoveDown,
  },
  {
    id: 'move-to-top',
    label: '移動至頂層',
    shortcut: ']',
    onClick: handlers.onMoveToTop,
  },
  {
    id: 'move-to-bottom',
    label: '移動至底層',
    shortcut: '[',
    onClick: handlers.onMoveToBottom,
    divider: true,
  },
  {
    id: 'send-to-chat',
    label: '發送至對話',
    shortcut: 'Ctrl + Enter',
    onClick: handlers.onSendToChat,
  },
  {
    id: 'create-group',
    label: '建立群組',
    shortcut: 'Ctrl + G',
    onClick: handlers.onCreateGroup,
    divider: true,
  },
  {
    id: 'toggle-visibility',
    label: handlers.isVisible === false ? '顯示' : '隱藏',
    shortcut: 'Shift + Ctrl + H',
    onClick: handlers.onToggleVisibility,
  },
  {
    id: 'toggle-lock',
    label: handlers.isLocked ? '解鎖' : '鎖定',
    shortcut: 'Shift + Ctrl + L',
    onClick: handlers.onToggleLock,
  },
  {
    id: 'export',
    label: '匯出',
    submenu: [
      {
        id: 'export-png',
        label: 'PNG',
        icon: <FileImage size={14} />,
        onClick: handlers.onExportPNG,
      },
      {
        id: 'export-jpg',
        label: 'JPG',
        icon: <FileImage size={14} />,
        onClick: handlers.onExportJPG,
      },
      {
        id: 'export-svg',
        label: 'SVG',
        icon: <FileType size={14} />,
        onClick: handlers.onExportSVG,
      },
    ],
  },
  {
    id: 'delete',
    label: '刪除',
    onClick: handlers.onDelete,
    divider: true,
  },
];

export default ContextMenu;
