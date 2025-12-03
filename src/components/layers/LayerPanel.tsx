import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Image,
  Type,
  Brush,
  Square,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import type { Layer } from '../../types';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    selectedLayerId,
    selectLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    updateLayer,
  } = useCanvasStore();

  // 反向排序顯示（最上層在最前面）
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'image':
        return <Image size={16} />;
      case 'text':
        return <Type size={16} />;
      case 'mask':
        return <Square size={16} className="text-orange-400" />;
      case 'drawing':
        return <Brush size={16} />;
      default:
        return <Square size={16} />;
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const fromIndex = layers.findIndex(
        (l) => l.id === sortedLayers[index].id
      );
      const toIndex = layers.findIndex(
        (l) => l.id === sortedLayers[index - 1].id
      );
      reorderLayers(fromIndex, toIndex);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sortedLayers.length - 1) {
      const fromIndex = layers.findIndex(
        (l) => l.id === sortedLayers[index].id
      );
      const toIndex = layers.findIndex(
        (l) => l.id === sortedLayers[index + 1].id
      );
      reorderLayers(fromIndex, toIndex);
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity: opacity / 100 });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">圖層</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            尚無圖層
            <br />
            <span className="text-xs">新增圖片或文字開始編輯</span>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {sortedLayers.map((layer, index) => (
              <li
                key={layer.id}
                className={`group rounded-lg transition-colors ${
                  selectedLayerId === layer.id
                    ? 'bg-accent/20 border border-accent'
                    : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
                }`}
              >
                <div
                  className="flex items-center p-2 cursor-pointer"
                  onClick={() => selectLayer(layer.id)}
                >
                  {/* 圖層圖示 */}
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded mr-2">
                    {getLayerIcon(layer.type)}
                  </div>

                  {/* 圖層名稱 */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) =>
                        updateLayer(layer.id, { name: e.target.value })
                      }
                      className="w-full bg-transparent text-sm font-medium truncate focus:outline-none focus:bg-gray-700 rounded px-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="text-xs text-gray-500 capitalize px-1">
                      {layer.type === 'image'
                        ? '圖片'
                        : layer.type === 'text'
                        ? '文字'
                        : layer.type === 'mask'
                        ? '遮罩'
                        : '繪圖'}
                    </div>
                  </div>

                  {/* 可見性與鎖定 */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title={layer.visible ? '隱藏' : '顯示'}
                    >
                      {layer.visible ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} className="text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title={layer.locked ? '解鎖' : '鎖定'}
                    >
                      {layer.locked ? (
                        <Lock size={14} className="text-orange-400" />
                      ) : (
                        <Unlock size={14} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 選中時顯示更多選項 */}
                {selectedLayerId === layer.id && (
                  <div className="px-2 pb-2 space-y-2">
                    {/* 透明度 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 w-12">透明度</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(layer.opacity * 100)}
                        onChange={(e) =>
                          handleOpacityChange(layer.id, parseInt(e.target.value))
                        }
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-400 w-8">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors disabled:opacity-30"
                          title="上移"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === sortedLayers.length - 1}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors disabled:opacity-30"
                          title="下移"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => duplicateLayer(layer.id)}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                          title="複製"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => removeLayer(layer.id)}
                          className="p-1.5 hover:bg-red-600 rounded transition-colors text-red-400"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
