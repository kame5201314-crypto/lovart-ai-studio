import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface LovartHeaderProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
}

export const LovartHeader: React.FC<LovartHeaderProps> = ({
  projectName = '未命名專案',
  onProjectNameChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (name.trim()) {
      onProjectNameChange?.(name.trim());
    } else {
      setName(projectName);
    }
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">L</span>
        </div>

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
              className="px-2 py-1 border-2 border-blue-400 rounded text-sm focus:outline-none bg-white min-w-[150px]"
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
