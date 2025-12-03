import {
  MousePointer2,
  Move,
  Brush,
  Eraser,
  Type,
  Scan,
  Wand2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ToolType } from '../../types';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  currentTool: ToolType;
  onClick: (tool: ToolType) => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  label,
  currentTool,
  onClick,
}) => (
  <button
    onClick={() => onClick(tool)}
    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
      currentTool === tool
        ? 'bg-accent text-white'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export const Toolbar: React.FC = () => {
  const {
    currentTool,
    setTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    canvasState,
    setZoom,
    undo,
    redo,
    history,
    historyIndex,
  } = useCanvasStore();

  const tools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer2 size={18} />, label: '選取工具 (V)' },
    { tool: 'move', icon: <Move size={18} />, label: '移動工具 (M)' },
    { tool: 'brush', icon: <Brush size={18} />, label: '筆刷工具 (B)' },
    { tool: 'eraser', icon: <Eraser size={18} />, label: '橡皮擦 (E)' },
    { tool: 'text', icon: <Type size={18} />, label: '文字工具 (T)' },
    { tool: 'mask', icon: <Scan size={18} />, label: '遮罩工具 (K)' },
    { tool: 'inpaint', icon: <Wand2 size={18} />, label: '局部重繪 (I)' },
  ];

  const handleZoomIn = () => setZoom(canvasState.zoom * 1.2);
  const handleZoomOut = () => setZoom(canvasState.zoom / 1.2);
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col bg-gray-900 border-r border-gray-700 p-2 space-y-2">
      {/* 主要工具 */}
      <div className="space-y-1">
        {tools.map(({ tool, icon, label }) => (
          <ToolButton
            key={tool}
            tool={tool}
            icon={icon}
            label={label}
            currentTool={currentTool}
            onClick={setTool}
          />
        ))}
      </div>

      <div className="border-t border-gray-700 pt-2" />

      {/* 筆刷設定 */}
      {(currentTool === 'brush' || currentTool === 'mask' || currentTool === 'eraser') && (
        <div className="space-y-2 px-1">
          <div className="text-xs text-gray-400 text-center">筆刷大小</div>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-300 text-center">{brushSize}px</div>

          {currentTool === 'brush' && (
            <>
              <div className="text-xs text-gray-400 text-center mt-2">顏色</div>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* 縮放控制 */}
      <div className="space-y-1">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-10 h-8 flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors text-xs"
          title="重設縮放"
        >
          {Math.round(canvasState.zoom * 100)}%
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          title="縮小"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="border-t border-gray-700 pt-2" />

      {/* 復原/重做 */}
      <div className="space-y-1">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="復原 (Ctrl+Z)"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="重做 (Ctrl+Y)"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};
