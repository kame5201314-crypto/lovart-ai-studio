import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface LovartHeaderProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
}

export const LovartHeader: React.FC<LovartHeaderProps> = ({
  projectName = '未命名',
  onProjectNameChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);

  const handleNameSubmit = () => {
    setIsEditing(false);
    onProjectNameChange?.(name);
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">L</span>
        </div>

        {/* 專案名稱 */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <span>{name}</span>
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
