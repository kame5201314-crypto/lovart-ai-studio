import React, { useState } from 'react';
import {
  Group,
  Layers,
  Lock,
  Unlock,
  Download,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from 'lucide-react';
import type { Layer } from '../../types';

interface SelectionToolbarProps {
  selectedLayer: Layer | null;
  onUpdateLayer?: (id: string, updates: Partial<Layer>) => void;
  onGroupLayers?: () => void;
  onMergeLayers?: () => void;
  onDownload?: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedLayer,
  onUpdateLayer,
  onGroupLayers,
  onMergeLayers,
  onDownload,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [width, setWidth] = useState(selectedLayer?.width || 0);
  const [height, setHeight] = useState(selectedLayer?.height || 0);
  const [color, setColor] = useState('#FFA500');

  React.useEffect(() => {
    if (selectedLayer) {
      setWidth(Math.round(selectedLayer.width));
      setHeight(Math.round(selectedLayer.height));
    }
  }, [selectedLayer]);

  if (!selectedLayer) return null;

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (selectedLayer && onUpdateLayer) {
      onUpdateLayer(selectedLayer.id, { width: newWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (selectedLayer && onUpdateLayer) {
      onUpdateLayer(selectedLayer.id, { height: newHeight });
    }
  };

  const handleLockToggle = () => {
    if (selectedLayer && onUpdateLayer) {
      onUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked });
    }
  };

  const colors = ['#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2 z-40">
      {/* 創建編組 */}
      <button
        onClick={onGroupLayers}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        title="創建編組"
      >
        <Group size={16} />
        <span>創建編組</span>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 合併圖層 */}
      <button
        onClick={onMergeLayers}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        title="合併圖層"
      >
        <Layers size={16} />
        <span>合併圖層</span>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 更多選項 */}
      <button
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
        title="更多選項"
      >
        <MoreHorizontal size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 寬度 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">W</span>
        <input
          type="number"
          value={width}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
          className="w-14 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-center"
        />
      </div>

      {/* 鎖定比例 */}
      <button
        onClick={handleLockToggle}
        className={`p-1.5 rounded-lg ${selectedLayer.locked ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
        title={selectedLayer.locked ? '解除鎖定' : '鎖定比例'}
      >
        {selectedLayer.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>

      {/* 高度 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">H</span>
        <input
          type="number"
          value={height}
          onChange={(e) => handleHeightChange(Number(e.target.value))}
          className="w-14 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400 text-center"
        />
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* 顏色選擇器 */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400"
          style={{ backgroundColor: color }}
          title="填充顏色"
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="grid grid-cols-4 gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded border-2 ${color === c ? 'border-blue-500' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* 對齊選項 */}
      <div className="relative">
        <button
          onClick={() => setShowAlignMenu(!showAlignMenu)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
          title="對齊選項"
        >
          <AlignLeft size={16} />
        </button>
        {showAlignMenu && (
          <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="flex gap-1 mb-2">
              <button className="p-1.5 hover:bg-gray-100 rounded" title="靠左對齊">
                <AlignLeft size={16} />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded" title="水平置中">
                <AlignCenter size={16} />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded" title="靠右對齊">
                <AlignRight size={16} />
              </button>
            </div>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-gray-100 rounded" title="靠上對齊">
                <AlignStartVertical size={16} />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded" title="垂直置中">
                <AlignCenterVertical size={16} />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded" title="靠下對齊">
                <AlignEndVertical size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 垂直分佈 */}
      <button
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
        title="垂直分佈"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* 下載 */}
      <button
        onClick={onDownload}
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
        title="下載"
      >
        <Download size={16} />
      </button>
    </div>
  );
};

export default SelectionToolbar;
