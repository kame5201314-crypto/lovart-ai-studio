import { useEffect, useState, useCallback } from 'react';
import { LovartToolbar, LovartSidebar, LovartHeader } from './components/lovart';
import { SmartCanvas, ImageGeneratorBlock, VideoGeneratorBlock } from './components/canvas';
import { ContextMenu, getImageContextMenuItems, OnboardingTutorial, NanoBananaProTip } from './components/ui';
import { StudioPanel } from './components/studio';
import { useCanvasStore } from './store/canvasStore';
import {
  aiSuperResolution,
  aiRemoveBackground,
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
    copyLayer,
    pasteLayer,
    deleteSelectedLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
  } = useCanvasStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [showStudioPanel, setShowStudioPanel] = useState(false);
  const [projectName, setProjectName] = useState('未命名');
  const [showTutorial, setShowTutorial] = useState(true);
  const [showNanoBananaTip, setShowNanoBananaTip] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

  // RWD 響應式狀態
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 監聽視窗大小變化
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsToolbarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 對話歷史
  const [chatHistory] = useState([
    {
      id: '1',
      title: 'I NEED A STORY BOARD F...',
      preview: 'C',
      timestamp: new Date(),
    },
  ]);

  // 生成的文件列表
  const [generatedFiles] = useState([
    {
      id: '1',
      name: 'Storyboard_Frame_5_Hostel',
      thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop',
      type: 'image' as const,
    },
    {
      id: '2',
      name: 'Storyboard_Frame_3_Walking',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
      type: 'image' as const,
    },
    {
      id: '3',
      name: 'Storyboard_Frame_2_Boombox',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
      type: 'image' as const,
    },
  ]);

  // 獲取當前選中的圖層
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedImage = selectedLayer?.type === 'image' ? (selectedLayer as ImageLayer).src : undefined;

  // AI 功能處理函數（進階功能，待後續添加後端 API）
  const handleAIEdit = async (_prompt: string) => {
    alert('AI 改圖功能開發中...\n此功能需要後端 API 支援');
  };

  const handleAIOutpaint = async (_direction: 'up' | 'down' | 'left' | 'right' | 'all', _prompt?: string) => {
    alert('AI 擴圖功能開發中...\n此功能需要後端 API 支援');
  };

  const handleTextReplace = async (_originalText: string, _newText: string) => {
    alert('無痕改字功能開發中...\n此功能需要後端 API 支援');
  };

  // 將函數暴露給 window 供其他元件使用
  useEffect(() => {
    (window as unknown as Record<string, unknown>).aiHandlers = {
      handleAIEdit,
      handleAIOutpaint,
      handleTextReplace,
    };
  }, []);

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
    onCopy: () => {
      copyLayer();
      closeContextMenu();
    },
    onPaste: () => {
      pasteLayer();
      closeContextMenu();
    },
    onMoveUp: () => {
      if (selectedLayerId) {
        moveLayerUp(selectedLayerId);
        saveToHistory('上移一層');
      }
      closeContextMenu();
    },
    onMoveDown: () => {
      if (selectedLayerId) {
        moveLayerDown(selectedLayerId);
        saveToHistory('下移一層');
      }
      closeContextMenu();
    },
    onMoveToTop: () => {
      if (selectedLayerId) {
        moveLayerToTop(selectedLayerId);
        saveToHistory('移動至頂層');
      }
      closeContextMenu();
    },
    onMoveToBottom: () => {
      if (selectedLayerId) {
        moveLayerToBottom(selectedLayerId);
        saveToHistory('移動至底層');
      }
      closeContextMenu();
    },
    onSendToChat: () => {
      // 發送圖片到對話
      if (selectedImage) {
        alert('圖片已準備發送至對話');
      }
      closeContextMenu();
    },
    onCreateGroup: () => {
      alert('建立群組功能開發中...');
      closeContextMenu();
    },
    onToggleVisibility: () => {
      if (selectedLayerId) {
        toggleLayerVisibility(selectedLayerId);
        saveToHistory(selectedLayer?.visible ? '隱藏圖層' : '顯示圖層');
      }
      closeContextMenu();
    },
    onToggleLock: () => {
      if (selectedLayerId) {
        toggleLayerLock(selectedLayerId);
        saveToHistory(selectedLayer?.locked ? '解鎖圖層' : '鎖定圖層');
      }
      closeContextMenu();
    },
    onExportPNG: () => {
      handleDownload();
      closeContextMenu();
    },
    onExportJPG: () => {
      handleDownload();
      closeContextMenu();
    },
    onDelete: () => {
      deleteSelectedLayer();
      saveToHistory('刪除圖層');
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
            setTool('select'); // 確保上傳後工具設為選擇模式
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
        case 'a':
          setShowImageGenerator(true);
          break;
        case 'escape':
          setShowImageGenerator(false);
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* 手機版工具列切換按鈕 */}
        {isMobile && (
          <button
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            className="absolute top-2 left-2 z-50 p-2 bg-white rounded-lg shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* 手機版側邊欄切換按鈕 */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-2 right-2 z-50 p-2 bg-white rounded-lg shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>
        )}

        {/* 左側工具列 */}
        <div className={`${isMobile && isToolbarCollapsed ? 'hidden' : ''} ${isMobile ? 'absolute left-0 top-12 z-40 bg-white shadow-lg rounded-r-lg' : ''}`}>
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
                console.log('設定工具為: pencil (鉛筆)');
                setTool('pencil');
                if (currentTool !== 'pencil' && currentTool !== 'brush') {
                  addDrawingLayer();
                }
                break;
              case 'pen':
                console.log('設定工具為: pen (鋼筆)');
                setTool('pen');
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
            setShowImageGenerator(true);
            setShowVideoGenerator(false);
          }}
          onOpenVideoGenerator={() => {
            setShowVideoGenerator(true);
            setShowImageGenerator(false);
          }}
        />
        </div>

        {/* 中央畫布區 */}
        <div className="flex-1 relative" onContextMenu={handleContextMenu}>
          <SmartCanvas
            className="w-full h-full"
            onAIUpscale={(imageUrl) => {
              console.log('AI 放大:', imageUrl);
              handleAIUpscale(2);
            }}
            onAIRemoveBackground={(imageUrl) => {
              console.log('AI 移除背景:', imageUrl);
              handleRemoveBackground();
            }}
            onAIMockup={(imageUrl) => {
              console.log('AI Mockup:', imageUrl);
              alert('Mockup 功能開發中...');
            }}
            onAIErase={(imageUrl) => {
              console.log('AI 擦除:', imageUrl);
              alert('擦除功能開發中...');
            }}
            onAIEditElements={(imageUrl) => {
              console.log('AI 編輯元素:', imageUrl);
              alert('編輯元素功能開發中...');
            }}
            onAIEditText={(imageUrl) => {
              console.log('AI 編輯文字:', imageUrl);
              alert('編輯文字功能開發中...');
            }}
            onAIExpand={(imageUrl) => {
              console.log('AI 擴展:', imageUrl);
              handleAIOutpaint('all');
            }}
            onAIImageChat={(imageUrl) => {
              console.log('圖片交流:', imageUrl);
              alert('圖片交流功能開發中...');
            }}
            onAIExtractText={(imageUrl) => {
              console.log('提取文字:', imageUrl);
              alert('提取文字功能開發中...');
            }}
            onAITranslate={(imageUrl, lang) => {
              console.log('翻譯:', imageUrl, lang);
              alert(`翻譯成 ${lang} 功能開發中...`);
            }}
            onAISaveToMemo={(imageUrl) => {
              console.log('儲存到備忘錄:', imageUrl);
              alert('儲存到備忘錄功能開發中...');
            }}
            onAIRemoveObject={(imageUrl) => {
              console.log('移除物件:', imageUrl);
              alert('移除物件功能開發中...');
            }}
            onAIImageGenerator={() => {
              console.log('AI 圖像生成器');
              setShowImageGenerator(true);
            }}
            onAIImageToAnimation={(imageUrl) => {
              console.log('AI 圖生動畫:', imageUrl);
              setShowVideoGenerator(true);
            }}
            onAIRemoveText={(imageUrl) => {
              console.log('移除文字:', imageUrl);
              alert('移除文字功能開發中...');
            }}
            onAIChangeBackground={(imageUrl) => {
              console.log('更換背景:', imageUrl);
              alert('更換背景功能開發中...');
            }}
          />

          {/* 圖像生成器 */}
          {showImageGenerator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <ImageGeneratorBlock
                  isGenerating={isLoading}
                  onGenerate={async (prompt, _model, width, height) => {
                    setLoading(true, '正在生成圖片...');
                    try {
                      const results = await generateImage({
                        prompt,
                        model: selectedModel,
                        width,
                        height,
                        numOutputs: 1,
                      });
                      if (results[0]) {
                        addImageLayer(results[0], 'AI 生成圖片', width / 2, height / 2);
                        saveToHistory('AI 生成圖片');
                        setShowImageGenerator(false);
                      }
                    } catch (error) {
                      console.error('生成失敗:', error);
                      alert('生成失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onClose={() => setShowImageGenerator(false)}
                />
              </div>
            </div>
          )}

          {/* 影片生成器 */}
          {showVideoGenerator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <VideoGeneratorBlock
                  isGenerating={isLoading}
                  onGenerate={async () => {
                    setLoading(true, '正在生成影片...');
                    try {
                      // TODO: 實現影片生成 API
                      alert('影片生成功能開發中...');
                    } catch (error) {
                      console.error('生成失敗:', error);
                      alert('生成失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onClose={() => setShowVideoGenerator(false)}
                />
              </div>
            </div>
          )}

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
        {(!isMobile || isSidebarOpen) && (
          <div className={`${isMobile ? 'absolute right-0 top-0 h-full z-40 shadow-lg' : ''}`}>
            <LovartSidebar
              onSendMessage={handleSendMessage}
              onSelectExample={(example) => {
                handleSendMessage(example.description);
              }}
              onOpenStudio={() => setShowStudioPanel(true)}
              chatHistory={chatHistory}
              generatedFiles={generatedFiles}
              onNewChat={() => {
                console.log('新建對話');
                // 清空當前對話並開始新對話
              }}
              onSelectHistory={(chatId) => {
                console.log('選擇歷史對話:', chatId);
                // 載入歷史對話
              }}
              onShare={() => {
                console.log('分享對話');
                // 複製分享連結到剪貼板
                navigator.clipboard.writeText(window.location.href);
                alert('分享連結已複製到剪貼板！');
              }}
              onSelectFile={(fileId) => {
                console.log('選擇文件:', fileId);
                // 在畫布中顯示選擇的文件
                const file = generatedFiles.find((f) => f.id === fileId);
                if (file) {
                  addImageLayer(file.thumbnail, file.name);
                  saveToHistory('添加生成的文件');
                }
              }}
            />
            {/* 手機版側邊欄關閉按鈕 */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-2 left-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 手機版背景遮罩 */}
        {isMobile && isSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/30 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* 智慧工作室面板 */}
      <StudioPanel
        isOpen={showStudioPanel}
        onClose={() => setShowStudioPanel(false)}
        onImageGenerated={handleImageGenerated}
      />

      {/* 新手引導教學 */}
      {showTutorial && (
        <OnboardingTutorial onComplete={() => {
          setShowTutorial(false);
          setShowNanoBananaTip(true);
        }} />
      )}

      {/* Nano Banana Pro 提示 */}
      {showNanoBananaTip && (
        <NanoBananaProTip onClose={() => setShowNanoBananaTip(false)} />
      )}
    </div>
  );
}

export default App;
