import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ImageLayer, TextLayer } from '../../types';

// Google Fonts 常用字體
const FONT_FAMILIES = [
  { value: 'Noto Sans TC', label: '思源黑體' },
  { value: 'Noto Serif TC', label: '思源宋體' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
];

const FONT_WEIGHTS = [
  { value: '100', label: '極細' },
  { value: '300', label: '細' },
  { value: 'normal', label: '正常' },
  { value: '500', label: '中' },
  { value: 'bold', label: '粗' },
  { value: '900', label: '極粗' },
];

export const PropertiesPanel: React.FC = () => {
  const { layers, selectedLayerId, updateLayer, canvasState, setCanvasSize, setBackgroundColor } =
    useCanvasStore();

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // 畫布屬性
  const renderCanvasProperties = () => (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase">畫布設定</h4>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">寬度</label>
          <input
            type="number"
            value={canvasState.width}
            onChange={(e) =>
              setCanvasSize(parseInt(e.target.value) || 1024, canvasState.height)
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">高度</label>
          <input
            type="number"
            value={canvasState.height}
            onChange={(e) =>
              setCanvasSize(canvasState.width, parseInt(e.target.value) || 1024)
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">背景顏色</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={canvasState.backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={canvasState.backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
      </div>

      {/* 預設尺寸 */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">預設尺寸</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { w: 1024, h: 1024, label: '1:1' },
            { w: 1280, h: 720, label: '16:9' },
            { w: 1080, h: 1920, label: '9:16' },
            { w: 1200, h: 630, label: 'Facebook' },
            { w: 1080, h: 1080, label: 'Instagram' },
            { w: 2048, h: 2048, label: '2K' },
          ].map((preset) => (
            <button
              key={`${preset.w}x${preset.h}`}
              onClick={() => setCanvasSize(preset.w, preset.h)}
              className="text-xs bg-gray-800 hover:bg-gray-700 rounded p-2 transition-colors"
            >
              {preset.label}
              <br />
              <span className="text-gray-500">
                {preset.w}×{preset.h}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 圖片層屬性
  const renderImageProperties = (layer: ImageLayer) => (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase">圖片屬性</h4>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">X</label>
          <input
            type="number"
            value={Math.round(layer.x)}
            onChange={(e) =>
              updateLayer(layer.id, { x: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Y</label>
          <input
            type="number"
            value={Math.round(layer.y)}
            onChange={(e) =>
              updateLayer(layer.id, { y: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">寬度</label>
          <input
            type="number"
            value={Math.round(layer.width)}
            onChange={(e) =>
              updateLayer(layer.id, { width: parseInt(e.target.value) || 100 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">高度</label>
          <input
            type="number"
            value={Math.round(layer.height)}
            onChange={(e) =>
              updateLayer(layer.id, { height: parseInt(e.target.value) || 100 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">旋轉角度</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min={-180}
            max={180}
            value={layer.rotation}
            onChange={(e) =>
              updateLayer(layer.id, { rotation: parseInt(e.target.value) })
            }
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm w-12 text-right">{Math.round(layer.rotation)}°</span>
        </div>
      </div>

      {/* 濾鏡 */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">濾鏡</label>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>亮度</span>
              <span>{Math.round((layer.filters?.brightness || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.1}
              value={layer.filters?.brightness || 0}
              onChange={(e) =>
                updateLayer(layer.id, {
                  filters: {
                    ...layer.filters,
                    brightness: parseFloat(e.target.value),
                  } as any,
                })
              }
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>對比度</span>
              <span>{Math.round((layer.filters?.contrast || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.1}
              value={layer.filters?.contrast || 0}
              onChange={(e) =>
                updateLayer(layer.id, {
                  filters: {
                    ...layer.filters,
                    contrast: parseFloat(e.target.value),
                  } as any,
                })
              }
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>模糊</span>
              <span>{layer.filters?.blur || 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={layer.filters?.blur || 0}
              onChange={(e) =>
                updateLayer(layer.id, {
                  filters: {
                    ...layer.filters,
                    blur: parseFloat(e.target.value),
                  } as any,
                })
              }
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // 文字層屬性
  const renderTextProperties = (layer: TextLayer) => (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase">文字屬性</h4>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">文字內容</label>
        <textarea
          value={layer.text}
          onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm h-20 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">字體</label>
        <select
          value={layer.fontFamily}
          onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">字體大小</label>
          <input
            type="number"
            value={layer.fontSize}
            onChange={(e) =>
              updateLayer(layer.id, { fontSize: parseInt(e.target.value) || 16 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">字重</label>
          <select
            value={layer.fontWeight}
            onChange={(e) => updateLayer(layer.id, { fontWeight: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">文字顏色</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={layer.fill}
            onChange={(e) => updateLayer(layer.id, { fill: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={layer.fill}
            onChange={(e) => updateLayer(layer.id, { fill: e.target.value })}
            className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">對齊方式</label>
        <div className="flex space-x-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => updateLayer(layer.id, { align })}
              className={`flex-1 p-2 rounded text-sm ${
                layer.align === align
                  ? 'bg-accent text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {align === 'left' ? '靠左' : align === 'center' ? '置中' : '靠右'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">行高: {layer.lineHeight}</label>
        <input
          type="range"
          min={0.8}
          max={3}
          step={0.1}
          value={layer.lineHeight}
          onChange={(e) =>
            updateLayer(layer.id, { lineHeight: parseFloat(e.target.value) })
          }
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">X</label>
          <input
            type="number"
            value={Math.round(layer.x)}
            onChange={(e) =>
              updateLayer(layer.id, { x: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Y</label>
          <input
            type="number"
            value={Math.round(layer.y)}
            onChange={(e) =>
              updateLayer(layer.id, { y: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">旋轉角度</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min={-180}
            max={180}
            value={layer.rotation}
            onChange={(e) =>
              updateLayer(layer.id, { rotation: parseInt(e.target.value) })
            }
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm w-12 text-right">{Math.round(layer.rotation)}°</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">屬性</h3>
      </div>

      <div className="p-3">
        {selectedLayer ? (
          selectedLayer.type === 'image' ? (
            renderImageProperties(selectedLayer as ImageLayer)
          ) : selectedLayer.type === 'text' ? (
            renderTextProperties(selectedLayer as TextLayer)
          ) : (
            <div className="text-gray-500 text-sm">
              此圖層類型暫不支援屬性編輯
            </div>
          )
        ) : (
          renderCanvasProperties()
        )}
      </div>
    </div>
  );
};
