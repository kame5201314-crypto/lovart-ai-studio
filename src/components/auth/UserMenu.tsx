import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Image, Settings, ChevronDown } from 'lucide-react';
import { logoutUser } from '../../lib/firebase';

interface UserMenuProps {
  user: {
    email: string;
    displayName: string;
  } | null;
  onLoginClick: () => void;
  onViewGallery?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLoginClick, onViewGallery }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 未登入狀態
  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        <User size={16} />
        登入 / 註冊
      </button>
    );
  }

  // 已登入狀態
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {user.displayName}
        </span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* 用戶資訊 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-900">{user.displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          {/* 選單項目 */}
          <div className="py-1">
            <button
              onClick={() => {
                onViewGallery?.();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
            >
              <Image size={16} className="text-gray-500" />
              我的作品庫
            </button>
            <button
              onClick={() => {
                alert('設定功能開發中...');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
            >
              <Settings size={16} className="text-gray-500" />
              帳戶設定
            </button>
          </div>

          {/* 登出 */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 text-red-600 text-sm"
            >
              <LogOut size={16} />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
