import React, { useState } from 'react';
import {
  Camera,
  FolderOpen,
  Layers,
  Users,
  X,
  ChevronLeft,
} from 'lucide-react';
import { ProductStudio } from './ProductStudio';
import { AssetLibrary } from './AssetLibrary';
import { LayerBlender } from './LayerBlender';
import { ProjectManager } from './ProjectManager';

type StudioMode = 'menu' | 'product' | 'asset' | 'blend' | 'project';

interface StudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated?: (imageUrl: string) => void;
}

const menuItems = [
  {
    id: 'product',
    name: '產品攝影棚',
    description: '快速生成電商主圖',
    icon: Camera,
    color: 'blue',
  },
  {
    id: 'asset',
    name: '素材庫',
    description: '模特兒、情境、元素',
    icon: Users,
    color: 'purple',
  },
  {
    id: 'blend',
    name: '素材疊加',
    description: '前景背景智能融合',
    icon: Layers,
    color: 'green',
  },
  {
    id: 'project',
    name: '專案管理',
    description: '儲存、分享、版本控制',
    icon: FolderOpen,
    color: 'orange',
  },
];

export const StudioPanel: React.FC<StudioPanelProps> = ({
  isOpen,
  onClose,
  onImageGenerated,
}) => {
  const [mode, setMode] = useState<StudioMode>('menu');

  const handleBack = () => {
    setMode('menu');
  };

  const handleImageGenerated = (imageUrl: string) => {
    onImageGenerated?.(imageUrl);
  };

  if (!isOpen) return null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
      green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-50' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-50' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] h-[600px] max-h-[90vh] max-w-[95vw] flex flex-col overflow-hidden">
        {/* 頂部標題 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {mode !== 'menu' && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-semibold text-gray-800">
              {mode === 'menu' && '智慧工作室'}
              {mode === 'product' && '產品攝影棚'}
              {mode === 'asset' && '素材庫'}
              {mode === 'blend' && '素材疊加'}
              {mode === 'project' && '專案管理'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex-1 overflow-hidden">
          {mode === 'menu' && (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                選擇工具開始創作
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const colors = getColorClasses(item.color);
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as StudioMode)}
                    className={`w-full p-4 rounded-xl border-2 border-gray-200 ${colors.hover} transition-all text-left flex items-center gap-4`}
                  >
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mode === 'product' && (
            <ProductStudio onImageGenerated={handleImageGenerated} />
          )}

          {mode === 'asset' && (
            <AssetLibrary
              onSelectAsset={(asset) => handleImageGenerated(asset.imageUrl)}
            />
          )}

          {mode === 'blend' && (
            <LayerBlender onImageGenerated={handleImageGenerated} />
          )}

          {mode === 'project' && <ProjectManager />}
        </div>
      </div>
    </div>
  );
};

export default StudioPanel;
