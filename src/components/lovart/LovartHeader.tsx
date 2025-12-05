import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home, FolderOpen, FilePlus, Trash2, Image, Undo2, Redo2, Copy, Eye, ZoomIn, ZoomOut, Link2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

interface LovartHeaderProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onUploadImage?: () => void;
}

export const LovartHeader: React.FC<LovartHeaderProps> = ({
  projectName = '未命名專案',
  onProjectNameChange,
  onUploadImage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { undo, redo, duplicateLayer, setZoom, canvasState, selectedLayerId } = useCanvasStore();

  // 同步外部傳入的 projectName
  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  // 自動聚焦輸入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLogoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (name.trim()) {
      onProjectNameChange?.(name.trim());
    } else {
      setName(projectName);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(canvasState.zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(canvasState.zoom - 0.1, 0.1));
  };

  const menuItems = [
    { id: 'home', label: '首頁', icon: <Home size={16} />, onClick: () => window.location.reload() },
    { id: 'projects', label: '專案庫', icon: <FolderOpen size={16} />, onClick: () => alert('專案庫功能開發中...') },
    { type: 'divider' },
    { id: 'new', label: '新建項目', icon: <FilePlus size={16} />, onClick: () => window.location.reload() },
    { id: 'delete', label: '刪除目前項目', icon: <Trash2 size={16} />, onClick: () => { if (confirm('確定要刪除目前項目嗎？')) window.location.reload(); } },
    { type: 'divider' },
    { id: 'import', label: '導入圖片', icon: <Image size={16} />, onClick: () => onUploadImage?.() },
    { type: 'divider' },
    { id: 'undo', label: '撤銷', icon: <Undo2 size={16} />, shortcut: 'Ctrl + Z', onClick: () => undo() },
    { id: 'redo', label: '重做', icon: <Redo2 size={16} />, shortcut: 'Ctrl + 轉移 + Z', onClick: () => redo() },
    { id: 'duplicate', label: '複製對象', icon: <Copy size={16} />, shortcut: 'Ctrl + D', onClick: () => selectedLayerId && duplicateLayer(selectedLayerId) },
    { type: 'divider' },
    { id: 'showAll', label: '顯示畫布所有圖片', icon: <Eye size={16} />, shortcut: '轉移 + 1', onClick: () => setZoom(1) },
    { id: 'zoomIn', label: '放大', icon: <ZoomIn size={16} />, shortcut: 'Ctrl + +', onClick: handleZoomIn },
    { id: 'zoomOut', label: '縮小', icon: <ZoomOut size={16} />, shortcut: 'Ctrl + -', onClick: handleZoomOut },
  ];

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 relative z-50">
      {/* Logo 與選單 */}
      <div className="flex items-center gap-3" ref={menuRef}>
        <button
          onClick={() => setShowLogoMenu(!showLogoMenu)}
          className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <span className="text-white text-sm font-bold">L</span>
        </button>

        {/* Logo 下拉選單 */}
        {showLogoMenu && (
          <div className="absolute top-full left-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-50">
            {menuItems.map((item, index) => (
              item.type === 'divider' ? (
                <div key={index} className="h-px bg-gray-100 my-1" />
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick?.();
                    setShowLogoMenu(false);
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400">{item.shortcut}</span>
                  )}
                </button>
              )
            ))}
          </div>
        )}

        {/* 專案名稱 */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setName(projectName);
                  setIsEditing(false);
                }
              }}
              className="px-2 py-1 border-2 border-blue-400 rounded text-sm focus:outline-none bg-white min-w-[150px] text-gray-900"
              placeholder="輸入專案名稱..."
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
            >
              <span>{name || '未命名專案'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 右側可擴展區域 */}
      <div className="flex-1" />
    </div>
  );
};

export default LovartHeader;
