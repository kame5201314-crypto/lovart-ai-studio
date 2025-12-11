import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home, FolderOpen, FilePlus, Trash2, Image, Undo2, Redo2, Copy, Eye, ZoomIn, ZoomOut, HelpCircle, Save } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { UserMenu } from '../auth';

interface LovartHeaderProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onUploadImage?: () => void;
  onShowTutorial?: () => void;
  user?: { email: string; displayName: string } | null;
  onLoginClick?: () => void;
  onViewGallery?: () => void;
  onSaveImage?: () => void;
}

export const LovartHeader: React.FC<LovartHeaderProps> = ({
  projectName = '未命名專案',
  onProjectNameChange,
  onUploadImage,
  onShowTutorial,
  user,
  onLoginClick,
  onViewGallery,
  onSaveImage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { undo, redo, duplicateLayer, setZoom, canvasState, selectedLayerId } = useCanvasStore();

  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    { id: 'projects', label: '我的作品庫', icon: <FolderOpen size={16} />, onClick: () => onViewGallery?.() },
    { type: 'divider' },
    { id: 'new', label: '新建項目', icon: <FilePlus size={16} />, onClick: () => window.location.reload() },
    { id: 'delete', label: '刪除目前項目', icon: <Trash2 size={16} />, onClick: () => { if (confirm('確定要刪除目前項目嗎？')) window.location.reload(); } },
    { type: 'divider' },
    { id: 'import', label: '導入圖片', icon: <Image size={16} />, onClick: () => onUploadImage?.() },
    { id: 'save', label: '儲存到雲端', icon: <Save size={16} />, onClick: () => onSaveImage?.() },
    { type: 'divider' },
    { id: 'undo', label: '撤銷', icon: <Undo2 size={16} />, shortcut: 'Ctrl + Z', onClick: () => undo() },
    { id: 'redo', label: '重做', icon: <Redo2 size={16} />, shortcut: 'Ctrl + Shift + Z', onClick: () => redo() },
    { id: 'duplicate', label: '複製對象', icon: <Copy size={16} />, shortcut: 'Ctrl + D', onClick: () => selectedLayerId && duplicateLayer(selectedLayerId) },
    { type: 'divider' },
    { id: 'showAll', label: '顯示畫布所有圖片', icon: <Eye size={16} />, shortcut: 'Shift + 1', onClick: () => setZoom(1) },
    { id: 'zoomIn', label: '放大', icon: <ZoomIn size={16} />, shortcut: 'Ctrl + +', onClick: handleZoomIn },
    { id: 'zoomOut', label: '縮小', icon: <ZoomOut size={16} />, shortcut: 'Ctrl + -', onClick: handleZoomOut },
    { type: 'divider' },
    { id: 'tutorial', label: '查看教學', icon: <HelpCircle size={16} />, onClick: () => onShowTutorial?.() },
  ];

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center pl-2 pr-4 relative z-50">
      <div className="flex items-center gap-2" ref={menuRef}>
        <button
          onClick={() => setShowLogoMenu(!showLogoMenu)}
          className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <span className="text-white text-sm font-bold">M</span>
        </button>

        {showLogoMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[220px] z-50">
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
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
            >
              <span>{name || '未命名專案'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={onSaveImage}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Save size={16} />
            儲存
          </button>
        )}
        <UserMenu
          user={user || null}
          onLoginClick={onLoginClick || (() => {})}
          onViewGallery={onViewGallery}
        />
      </div>
    </div>
  );
};

export default LovartHeader;
