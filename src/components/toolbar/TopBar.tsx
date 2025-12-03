import { useState, useCallback } from 'react';
import {
  Download,
  Trash2,
  Type,
  Image,
  Brush,
  Square,
  Loader2,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export const TopBar: React.FC = () => {
  const {
    addTextLayer,
    addImageLayer,
    addDrawingLayer,
    addMaskLayer,
    clearCanvas,
    canvasState,
    layers,
    isLoading,
    setTool,
  } = useCanvasStore();

  const [isExporting, setIsExporting] = useState(false);

  // 新增文字
  const handleAddText = useCallback(() => {
    addTextLayer('雙擊編輯文字');
  }, [addTextLayer]);

  // 新增繪圖層
  const handleAddDrawing = useCallback(() => {
    addDrawingLayer();
  }, [addDrawingLayer]);

  // 新增遮罩層
  const handleAddMask = useCallback(() => {
    addMaskLayer();
  }, [addMaskLayer]);

  // 匯出畫布
  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      // 找到 Stage 元素
      const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
      if (!stage) {
        throw new Error('找不到畫布');
      }

      // 創建離屏 canvas 以確保輸出尺寸
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasState.width;
      offscreenCanvas.height = canvasState.height;
      const ctx = offscreenCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('無法創建 Canvas 上下文');
      }

      // 填充背景
      ctx.fillStyle = canvasState.backgroundColor;
      ctx.fillRect(0, 0, canvasState.width, canvasState.height);

      // 繪製 stage 內容
      ctx.drawImage(stage, 0, 0, canvasState.width, canvasState.height);

      // 轉換為 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreenCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('匯出失敗'));
            }
          },
          'image/png',
          1.0
        );
      });

      // 下載
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovart-export-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('匯出失敗:', error);
      alert('匯出失敗: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  }, [canvasState]);

  // 上傳圖片
  const handleUploadImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            addImageLayer(src, file.name);
            setTool('select'); // 確保添加圖片後工具設為選擇模式
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  }, [addImageLayer, setTool]);

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
      {/* 左側 - Logo 和檔案操作 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-white">Lovart AI Studio</span>
        </div>

        <div className="h-6 w-px bg-gray-700" />

        {/* 新增元素 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleUploadImage}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="上傳圖片"
          >
            <Image size={16} />
            <span>圖片</span>
          </button>
          <button
            onClick={handleAddText}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="新增文字"
          >
            <Type size={16} />
            <span>文字</span>
          </button>
          <button
            onClick={handleAddDrawing}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="新增繪圖層"
          >
            <Brush size={16} />
            <span>繪圖</span>
          </button>
          <button
            onClick={handleAddMask}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="新增遮罩層"
          >
            <Square size={16} />
            <span>遮罩</span>
          </button>
        </div>
      </div>

      {/* 中間 - 畫布資訊 */}
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <span>
          {canvasState.width} × {canvasState.height}
        </span>
        <span>•</span>
        <span>{layers.length} 圖層</span>
      </div>

      {/* 右側 - 匯出和設定 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={clearCanvas}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="清除畫布"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || isLoading}
          className="flex items-center space-x-2 px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>匯出中...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>匯出 PNG</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
