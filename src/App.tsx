import { useEffect, useState, useCallback } from 'react';
import { LovartToolbar, LovartSidebar, LovartHeader } from './components/lovart';
import { SmartCanvas } from './components/canvas';
import { ContextMenu, getImageContextMenuItems } from './components/ui';
import { StudioPanel } from './components/studio';
import { useCanvasStore } from './store/canvasStore';
import {
  aiEditImage,
  aiOutpaint,
  aiSuperResolution,
  aiRemoveBackground,
  aiTextReplace,
  generateImage,
} from './services/aiService';
import type { ImageLayer } from './types';

function App() {
  const {
    undo,
    redo,
    setTool,
    saveToHistory,
    isLoading,
    loadingMessage,
    addImageLayer,
    addTextLayer,
    addDrawingLayer,
    selectedLayerId,
    layers,
    setLoading,
    selectedModel,
    currentTool,
  } = useCanvasStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [showStudioPanel, setShowStudioPanel] = useState(false);
  const [projectName, setProjectName] = useState('未命名專案');

  // 獲取當前選中的圖層
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedImage = selectedLayer?.type === 'image' ? (selectedLayer as ImageLayer).src : undefined;

  // AI 功能處理函數
  const handleAIEdit = async (prompt: string) => {
    if (!selectedImage) return;
    setLoading(true, 'AI 改圖中...');
    try {
      const results = await aiEditImage({ image: selectedImage, prompt });
      if (results[0]) {
        addImageLayer(results[0], 'AI 改圖結果');
        saveToHistory('AI 改圖');
      }
    } catch (error) {
      console.error('AI 改圖失敗:', error);
      alert('AI 改圖失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleAIOutpaint = async (direction: 'up' | 'down' | 'left' | 'right' | 'all', prompt?: string) => {
    if (!selectedImage) return;
    setLoading(true, 'AI 擴圖中...');
    try {
      const results = await aiOutpaint({ image: selectedImage, direction, prompt });
      if (results[0]) {
        addImageLayer(results[0], 'AI 擴圖結果');
        saveToHistory('AI 擴圖');
      }
    } catch (error) {
      console.error('AI 擴圖失敗:', error);
      alert('AI 擴圖失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleTextReplace = async (originalText: string, newText: string) => {
    if (!selectedImage) return;
    setLoading(true, '無痕改字中...');
    try {
      const results = await aiTextReplace({ image: selectedImage, originalText, newText });
      if (results[0]) {
        addImageLayer(results[0], '改字結果');
        saveToHistory('無痕改字');
      }
    } catch (error) {
      console.error('改字失敗:', error);
      alert('改字失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 將函數暴露給 window 供其他元件使用
  useEffect(() => {
    (window as unknown as Record<string, unknown>).aiHandlers = {
      handleAIEdit,
      handleAIOutpaint,
      handleTextReplace,
    };
  }, [selectedImage]);

  const handleAIUpscale = async (scale: 2 | 4) => {
    if (!selectedImage) return;
    setLoading(true, `AI 超清 ${scale}x 中...`);
    try {
      const result = await aiSuperResolution({ image: selectedImage, scale });
      if (result) {
        addImageLayer(result, `AI 超清 ${scale}x`);
        saveToHistory('AI 超清');
      }
    } catch (error) {
      console.error('AI 超清失敗:', error);
      alert('AI 超清失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedImage) return;
    setLoading(true, '去背中...');
    try {
      const result = await aiRemoveBackground({ image: selectedImage });
      if (result) {
        addImageLayer(result, '去背結果');
        saveToHistory('去背');
      }
    } catch (error) {
      console.error('去背失敗:', error);
      alert('去背失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageGenerated = (imageUrl: string) => {
    addImageLayer(imageUrl, 'AI 生成圖片');
    saveToHistory('AI 生成圖片');
  };

  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `lovart-${Date.now()}.png`;
    link.click();
  };

  // 右鍵選單
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const contextMenuItems = getImageContextMenuItems({
    onAIEdit: () => {
      closeContextMenu();
    },
    onAIOutpaint: () => {
      closeContextMenu();
    },
    onAIUpscale: () => handleAIUpscale(2),
    onRemoveBackground: handleRemoveBackground,
    onDownload: handleDownload,
    onDelete: () => {
      closeContextMenu();
    },
    isLocked: selectedLayer?.locked,
    isVisible: selectedLayer?.visible,
  });

  // 上傳圖片
  const handleUploadImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
              } else {
                width = (width / height) * maxSize;
                height = maxSize;
              }
            }
            addImageLayer(src, file.name, width, height);
            saveToHistory('上傳圖片');
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [addImageLayer, saveToHistory]);

  // 上傳影片
  const handleUploadVideo = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        // 創建影片縮圖
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          video.currentTime = 1; // 跳到第1秒取縮圖
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const thumbnail = canvas.toDataURL('image/jpeg');
            let width = video.videoWidth;
            let height = video.videoHeight;
            const maxSize = 640;
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
              } else {
                width = (width / height) * maxSize;
                height = maxSize;
              }
            }
            addImageLayer(thumbnail, `影片: ${file.name}`, width, height);
            saveToHistory('上傳影片');
          }
          URL.revokeObjectURL(url);
        };
        video.src = url;
      }
    };
    input.click();
  }, [addImageLayer, saveToHistory]);

  // 處理 AI 訊息
  const handleSendMessage = async (message: string) => {
    setLoading(true, '正在生成圖片...');
    try {
      const results = await generateImage({
        prompt: message,
        model: selectedModel,
        width: 1024,
        height: 1024,
        numOutputs: 1,
      });

      if (results[0]) {
        handleImageGenerated(results[0]);
      }
    } catch (error) {
      console.error('生成失敗:', error);
      alert('生成失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + Z - 復原
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y - 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }

      // 工具快捷鍵
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          break;
        case 'h':
          setTool('move');
          break;
        case 't':
          setTool('text');
          break;
        case 'p':
          setTool('brush');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setTool]);

  // 初始化歷史記錄
  useEffect(() => {
    saveToHistory('初始化');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* 頂部標題列 */}
      <LovartHeader
        projectName={projectName}
        onProjectNameChange={(name) => setProjectName(name)}
      />

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側工具列 */}
        <LovartToolbar
          onToolChange={(tool: string) => {
            console.log('=== App onToolChange 被呼叫 ===');
            console.log('工具參數:', tool);
            console.log('當前工具 (改變前):', currentTool);
            switch (tool) {
              case 'select':
                console.log('設定工具為: select');
                setTool('select');
                break;
              case 'hand':
                console.log('設定工具為: move');
                setTool('move');
                break;
              case 'mark':
                console.log('設定工具為: marker');
                setTool('marker');
                break;
              case 'text':
                console.log('設定工具為: text，並新增文字圖層');
                setTool('text');
                addTextLayer('雙擊編輯文字');
                break;
              case 'pencil':
              case 'pen':
                console.log('設定工具為: brush');
                setTool('brush');
                if (currentTool !== 'brush') {
                  addDrawingLayer();
                }
                break;
              case 'rectangle':
                console.log('設定工具為: rectangle');
                setTool('rectangle');
                break;
              case 'circle':
                console.log('設定工具為: circle');
                setTool('circle');
                break;
              case 'triangle':
                console.log('設定工具為: triangle');
                setTool('triangle');
                break;
              case 'star':
                console.log('設定工具為: star');
                setTool('star');
                break;
              case 'arrow':
                console.log('設定工具為: arrow');
                setTool('arrow');
                break;
              case 'hexagon':
                console.log('設定工具為: hexagon');
                setTool('hexagon');
                break;
              case 'add':
              case 'shape':
                console.log('選單按鈕，不設定工具');
                break;
              default:
                console.log('未知工具:', tool);
                break;
            }
          }}
          onUploadImage={handleUploadImage}
          onUploadVideo={handleUploadVideo}
          onOpenImageGenerator={() => {
            // 可以打開生成器對話框
          }}
        />

        {/* 中央畫布區 */}
        <div className="flex-1 relative" onContextMenu={handleContextMenu}>
          <SmartCanvas className="w-full h-full" />

          {/* 載入指示器 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 flex flex-col items-center space-y-4 shadow-lg">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-700">
                  {loadingMessage || '處理中...'}
                </span>
              </div>
            </div>
          )}

          {/* 右鍵選單 */}
          {contextMenu.visible && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              items={contextMenuItems}
              onClose={closeContextMenu}
            />
          )}
        </div>

        {/* 右側 AI 面板 */}
        <LovartSidebar
          onSendMessage={handleSendMessage}
          onSelectExample={(example) => {
            handleSendMessage(example.description);
          }}
          onOpenStudio={() => setShowStudioPanel(true)}
        />
      </div>

      {/* 智慧工作室面板 */}
      <StudioPanel
        isOpen={showStudioPanel}
        onClose={() => setShowStudioPanel(false)}
        onImageGenerated={handleImageGenerated}
      />
    </div>
  );
}

export default App;
