import { useEffect, useState, useCallback } from 'react';
import { LovartToolbar, LovartSidebar, LovartHeader } from './components/lovart';
import { SmartCanvas, ImageGeneratorBlock, VideoGeneratorBlock } from './components/canvas';
import { ContextMenu, getImageContextMenuItems, NanoBananaProTip, SelectionToolbar } from './components/ui';
import { StudioPanel } from './components/studio';
import { AuthModal, ImageGallery } from './components/auth';
import { onUserStateChanged, uploadImage, getCurrentUser } from './lib/firebase';
import { useCanvasStore } from './store/canvasStore';
import {
  aiEditImage,
  aiOutpaint,
  aiSuperResolution,
  aiRemoveBackground,
  aiTextReplace,
  generateImage,
} from './services/aiService';
import type {
  AIModel, ImageLayer } from './types';
import { Menu, X, MessageSquare, Wrench } from 'lucide-react';

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
  const [projectName, setProjectName] = useState('未命名');
  const [showNanoBananaTip, setShowNanoBananaTip] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

  // RWD 響應式狀態
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  // Firebase 用戶狀態
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // 監聽用戶登入狀態
  useEffect(() => {
    const unsubscribe = onUserStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({ email: firebaseUser.email || '', displayName: firebaseUser.displayName || '用戶' });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 對話歷史
  const [chatHistory, setChatHistory] = useState([
    {
      id: '1',
      title: 'I NEED A STORY BOARD F...',
      preview: 'C',
      timestamp: new Date(),
    },
  ]);

  // 生成的文件列表
  const [generatedFiles, setGeneratedFiles] = useState([
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

  // 儲存圖片到 Firebase
  const handleSaveImage = async () => {
    if (!user) { setShowAuthModal(true); return; }
    const imageLayer = layers.filter(l => l.type === 'image').pop() as ImageLayer | undefined;
    if (!imageLayer?.src) { alert('沒有可儲存的圖片'); return; }
    setLoading(true, '儲存到雲端...');
    try {
      await uploadImage(imageLayer.src, projectName + '_' + Date.now() + '.png');
      alert('圖片已儲存到雲端！');
    } catch (error) {
      alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally { setLoading(false); }
  };

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
    onCopy: () => {
      // TODO: 實現複製功能
      closeContextMenu();
    },
    onPaste: () => {
      // TODO: 實現粘貼功能
      closeContextMenu();
    },
    onMoveUp: () => {
      // TODO: 實現上移一層
      closeContextMenu();
    },
    onMoveDown: () => {
      // TODO: 實現下移一層
      closeContextMenu();
    },
    onMoveToTop: () => {
      // TODO: 實現移動至頂層
      closeContextMenu();
    },
    onMoveToBottom: () => {
      // TODO: 實現移動至底層
      closeContextMenu();
    },
    onSendToChat: () => {
      // TODO: 實現發送至對話
      closeContextMenu();
    },
    onCreateGroup: () => {
      // TODO: 實現創建編組
      closeContextMenu();
    },
    onToggleVisibility: () => {
      // TODO: 實現顯示/隱藏
      closeContextMenu();
    },
    onToggleLock: () => {
      // TODO: 實現鎖定/解鎖
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
      // TODO: 實現刪除
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
        video.preload = 'auto';
        video.muted = true; // 靜音以允許自動播放
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        let thumbnailCaptured = false;

        const captureThumbnail = () => {
          if (thumbnailCaptured) return;
          thumbnailCaptured = true;

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx && video.videoWidth > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
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
            console.log('影片縮圖已創建:', file.name);
          } else {
            // 如果無法取得縮圖，使用預設尺寸
            console.warn('無法取得影片縮圖，使用預設圖片');
            addImageLayer('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiB2aWV3Qm94PSIwIDAgNjQwIDM2MCI+PHJlY3QgZmlsbD0iIzMzMyIgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiLz48cG9seWdvbiBmaWxsPSIjZmZmIiBwb2ludHM9IjI1MCwxMjAgNDAwLDE4MCAyNTAsMjQwIi8+PHRleHQgeD0iMzIwIiB5PSIzMDAiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuW9seeJhzwvdGV4dD48L3N2Zz4=', `影片: ${file.name}`, 640, 360);
            saveToHistory('上傳影片');
          }
          video.pause();
          URL.revokeObjectURL(url);
        };

        video.onloadeddata = () => {
          // 嘗試跳到影片中間位置取縮圖
          const seekTime = Math.min(video.duration * 0.1, 1);
          if (seekTime > 0 && isFinite(seekTime)) {
            video.currentTime = seekTime;
          } else {
            captureThumbnail();
          }
        };

        video.onseeked = () => {
          captureThumbnail();
        };

        video.onerror = (err) => {
          console.error('影片載入失敗:', err);
          alert('影片載入失敗，請確認檔案格式是否支援');
          URL.revokeObjectURL(url);
        };

        // 設定超時，避免卡住
        setTimeout(() => {
          if (!thumbnailCaptured) {
            console.warn('影片載入超時，使用預設縮圖');
            captureThumbnail();
          }
        }, 5000);

        video.src = url;
        video.load();
      }
    };
    input.click();
  }, [addImageLayer, saveToHistory]);

  // 當前對話ID
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // 處理 AI 訊息
  const handleSendMessage = async (message: string) => {
    console.log('=== handleSendMessage 開始 ===');
    console.log('訊息:', message);
    console.log('選擇的模型:', selectedModel);

    // 如果是新對話，創建一個新的歷史記錄
    if (!currentChatId) {
      const newChatId = Date.now().toString();
      const newChat = {
        id: newChatId,
        title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        preview: message.substring(0, 50),
        timestamp: new Date(),
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChatId);
    }

    setLoading(true, '正在生成圖片...');
    try {
      console.log('調用 generateImage...');
      const results = await generateImage({
        prompt: message,
        model: selectedModel,
        width: 1024,
        height: 1024,
        numOutputs: 1,
      });

      console.log('generateImage 返回結果:', results?.length || 0, '張圖片');

      if (results[0]) {
        console.log('添加圖片到畫布, URL長度:', results[0].length);
        handleImageGenerated(results[0]);
      } else {
        console.warn('沒有收到圖片結果');
        alert('生成完成但沒有收到圖片');
      }
    } catch (error) {
      console.error('生成失敗:', error);
      alert('生成失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 刪除歷史對話
  const handleDeleteHistory = (chatId: string) => {
    setChatHistory(prev => prev.filter(item => item.id !== chatId));
    // 如果刪除的是當前對話，重置
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  // 新建對話
  const handleNewChat = () => {
    setCurrentChatId(null);
    console.log('新建對話');
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
        onUploadImage={handleUploadImage}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onViewGallery={() => setShowImageGallery(true)}
        onSaveImage={handleSaveImage}
      />

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 移動端底部導航按鈕 */}
        <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white rounded-full shadow-lg px-2 py-2 border border-gray-200">
          <button
            onClick={() => {
              setShowMobileToolbar(!showMobileToolbar);
              setShowMobileSidebar(false);
            }}
            className={`p-3 rounded-full transition-colors ${showMobileToolbar ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Wrench size={20} />
          </button>
          <button
            onClick={() => {
              setShowMobileSidebar(!showMobileSidebar);
              setShowMobileToolbar(false);
            }}
            className={`p-3 rounded-full transition-colors ${showMobileSidebar ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <MessageSquare size={20} />
          </button>
        </div>

        {/* 移動端工具列覆蓋層 */}
        {showMobileToolbar && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileToolbar(false)}>
            <div className="absolute left-0 top-0 bottom-16 w-16 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <LovartToolbar
                onToolChange={(tool: string) => {
                  switch (tool) {
                    case 'select': setTool('select'); break;
                    case 'hand': setTool('move'); break;
                    case 'mark': setTool('marker'); break;
                    case 'text': setTool('text'); addTextLayer('雙擊編輯文字'); break;
                    case 'pencil': setTool('pencil'); if (currentTool !== 'pencil' && currentTool !== 'brush') addDrawingLayer(); break;
                    case 'pen': setTool('pen'); break;
                    case 'rectangle': setTool('rectangle'); break;
                    case 'circle': setTool('circle'); break;
                    case 'triangle': setTool('triangle'); break;
                    case 'star': setTool('star'); break;
                    case 'arrow': setTool('arrow'); break;
                    case 'hexagon': setTool('hexagon'); break;
                  }
                  setShowMobileToolbar(false);
                }}
                onUploadImage={() => { handleUploadImage(); setShowMobileToolbar(false); }}
                onUploadVideo={() => { handleUploadVideo(); setShowMobileToolbar(false); }}
                onOpenImageGenerator={() => { setShowImageGenerator(true); setShowMobileToolbar(false); }}
                onOpenVideoGenerator={() => { setShowVideoGenerator(true); setShowMobileToolbar(false); }}
              />
            </div>
          </div>
        )}

        {/* 移動端 AI 側邊欄覆蓋層 */}
        {showMobileSidebar && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileSidebar(false)}>
            <div className="absolute right-0 top-0 bottom-16 w-full max-w-[360px] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg z-10"
              >
                <X size={20} />
              </button>
              <LovartSidebar
                onSendMessage={(msg) => { handleSendMessage(msg); }}
                onSelectExample={(example) => handleSendMessage(example.description)}
                onOpenStudio={() => { setShowStudioPanel(true); setShowMobileSidebar(false); }}
                chatHistory={chatHistory}
                generatedFiles={generatedFiles}
                isGenerating={isLoading}
                lastGeneratedImage={layers.length > 0 ? (layers[layers.length - 1] as ImageLayer)?.src : undefined}
                onNewChat={handleNewChat}
                onSelectHistory={(chatId) => { setCurrentChatId(chatId); }}
                onDeleteHistory={handleDeleteHistory}
                onShare={() => { navigator.clipboard.writeText(window.location.href); alert('分享連結已複製到剪貼板！'); }}
                onSelectFile={(fileId) => {
                  const file = generatedFiles.find((f) => f.id === fileId);
                  if (file) { addImageLayer(file.thumbnail, file.name); saveToHistory('添加生成的文件'); }
                }}
              />
            </div>
          </div>
        )}

        {/* 左側工具列 - 桌面版 */}
        <div className="hidden lg:block">
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
          <SmartCanvas className="w-full h-full" />

          {/* 圖像生成器 */}
          {showImageGenerator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <ImageGeneratorBlock
                  isGenerating={isLoading}
                  onGenerate={async (prompt, model, width, height, referenceImage) => {
                    setLoading(true, '正在生成圖片...');
                    try {
                      const results = await generateImage({
                        prompt,
                        model: model as AIModel,
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
                  onGenerate={async (prompt, model, ratio, duration, startFrame, endFrame) => {
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
        <LovartSidebar
          onSendMessage={handleSendMessage}
          onSelectExample={(example) => {
            handleSendMessage(example.description);
          }}
          onOpenStudio={() => setShowStudioPanel(true)}
          chatHistory={chatHistory}
          generatedFiles={generatedFiles}
          isGenerating={isLoading}
          lastGeneratedImage={layers.length > 0 ? (layers[layers.length - 1] as ImageLayer)?.src : undefined}
          onNewChat={handleNewChat}
          onSelectHistory={(chatId) => {
            console.log('選擇歷史對話:', chatId);
            setCurrentChatId(chatId);
            // TODO: 載入歷史對話的訊息
          }}
          onDeleteHistory={handleDeleteHistory}
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
      </div>

      {/* 智慧工作室面板 */}
      <StudioPanel
        isOpen={showStudioPanel}
        onClose={() => setShowStudioPanel(false)}
        onImageGenerated={handleImageGenerated}
      />

      {/* Nano Banana Pro 提示 */}
      {showNanoBananaTip && (
        <NanoBananaProTip onClose={() => setShowNanoBananaTip(false)} />
      )}

      {/* 登入/註冊彈窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(userData) => { setUser(userData); setShowAuthModal(false); }}
      />

      {/* 圖片庫 */}
      <ImageGallery
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={(imageUrl) => { addImageLayer(imageUrl, '從雲端載入'); saveToHistory('從雲端載入圖片'); }}
      />
    </div>
  );
}

export default App;
