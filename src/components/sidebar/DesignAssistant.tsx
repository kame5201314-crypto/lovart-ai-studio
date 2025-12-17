import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Wand2,
  Palette,
  Move,
  Trash2,
  Copy,
  ZoomIn,
  RotateCw,
  FlipHorizontal,
  Eraser,
} from 'lucide-react';
import { generateImage, aiDesignChat, aiRemoveBackground, aiSuperResolution, aiOutpaint } from '../../services/aiService';
import { parseCommand, executeAction, generateResponse, isQuickCommand, getSuggestedActions } from '../../services/chatToActionService';
import type { AIModel, Layer } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  task?: {
    type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    progress?: number;
  };
  suggestedActions?: string[];
}

interface DesignAssistantProps {
  onImageGenerated?: (imageUrl: string) => void;
  onAddToCanvas?: (imageUrl: string) => void;
  currentImage?: string;
  selectedModel?: AIModel;
  // Canvas 操作 callbacks
  layers?: Layer[];
  selectedLayerId?: string | null;
  updateLayer?: (id: string, updates: Record<string, unknown>) => void;
  deleteLayer?: (id: string) => void;
  duplicateLayer?: (id: string) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export const DesignAssistant: React.FC<DesignAssistantProps> = ({
  onImageGenerated,
  onAddToCanvas,
  currentImage,
  selectedModel = 'gemini-flash',
  layers = [],
  selectedLayerId = null,
  updateLayer,
  deleteLayer,
  duplicateLayer,
  canvasWidth = 1280,
  canvasHeight = 1024,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 設計助手，可以幫你：\n\n1. 🎨 生成產品主圖、場景圖\n2. ✨ 修改和優化圖片\n3. 📦 生成電商產品套圖\n4. 💡 執行畫布操作（移動、縮放、旋轉等）\n5. 🗑️ 去背、超清、擴圖等 AI 功能\n\n請告訴我你想要什麼？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string; images?: string[] }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 獲取選中圖層的圖片
  const getSelectedImage = (): string | undefined => {
    if (!selectedLayerId) return currentImage;
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (selectedLayer?.type === 'image') {
      return (selectedLayer as { src: string }).src;
    }
    return currentImage;
  };

  // 執行快捷命令
  const executeQuickCommand = async (command: string) => {
    const action = parseCommand(command);
    const response = generateResponse(action);

    // 添加助手回覆
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // 如果是畫布操作
    if (updateLayer && deleteLayer && duplicateLayer) {
      const callbacks = {
        updateLayer,
        deleteLayer,
        duplicateLayer,
        canvasWidth,
        canvasHeight,
        generateImage: async (prompt: string) => {
          const images = await generateImage({
            prompt,
            model: selectedModel,
            width: 1024,
            height: 1024,
          });
          if (images[0] && onImageGenerated) {
            onImageGenerated(images[0]);
          }
        },
        removeBackground: async (layerId: string) => {
          const layer = layers.find(l => l.id === layerId);
          if (layer?.type === 'image') {
            const result = await aiRemoveBackground({ image: (layer as { src: string }).src });
            if (result && onImageGenerated) {
              onImageGenerated(result);
            }
          }
        },
        upscale: async (layerId: string, level: number) => {
          const layer = layers.find(l => l.id === layerId);
          if (layer?.type === 'image') {
            const result = await aiSuperResolution({
              image: (layer as { src: string }).src,
              scale: level as 2 | 4
            });
            if (result && onImageGenerated) {
              onImageGenerated(result);
            }
          }
        },
        outpaint: async (layerId: string, direction: string) => {
          const layer = layers.find(l => l.id === layerId);
          if (layer?.type === 'image') {
            const results = await aiOutpaint({
              image: (layer as { src: string }).src,
              direction: direction as 'up' | 'down' | 'left' | 'right' | 'all'
            });
            if (results[0] && onImageGenerated) {
              onImageGenerated(results[0]);
            }
          }
        },
      };

      const layerData = layers.map(l => ({
        id: l.id,
        type: l.type,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
        opacity: l.opacity,
      }));

      const result = executeAction(action, callbacks, layerData, selectedLayerId);

      if (!result.success) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // 如果有建議的後續操作
        const suggestions = getSuggestedActions(action);
        if (suggestions.length > 0) {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.role === 'assistant') {
              return prev.map((msg, idx) =>
                idx === prev.length - 1
                  ? { ...msg, suggestedActions: suggestions }
                  : msg
              );
            }
            return prev;
          });
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setUploadedImages([]);
    setIsLoading(true);

    try {
      // 檢查是否是快捷命令（針對畫布操作）
      if (isQuickCommand(currentInput) && !uploadedImages.length) {
        await executeQuickCommand(currentInput);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
          )
        );
        setIsLoading(false);
        return;
      }

      // 檢查是否是生成圖片的請求
      const isGenerateRequest = /生成|創建|製作|畫|產生/.test(currentInput);

      // 更新對話歷史
      const newHistory = [
        ...conversationHistory,
        {
          role: 'user' as const,
          content: currentInput,
          images: uploadedImages.length > 0 ? uploadedImages : undefined
        },
      ];
      setConversationHistory(newHistory);

      if (isGenerateRequest && !uploadedImages.length) {
        // 添加任務狀態訊息
        const taskMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: '任務執行',
          timestamp: new Date(),
          task: {
            type: '生成圖片',
            status: 'in_progress',
          },
        };
        setMessages((prev) => [...prev, taskMessage]);

        // 生成圖片
        const images = await generateImage({
          prompt: currentInput,
          model: selectedModel,
          width: 1024,
          height: 1024,
        });

        // 更新任務狀態
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === taskMessage.id
              ? { ...msg, task: { ...msg.task!, status: 'completed' } }
              : msg
          )
        );

        // 添加助手回覆
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '好的，我已經根據你的描述生成了圖片：',
          images,
          timestamp: new Date(),
          suggestedActions: ['去背', '超清 2 倍', '移到中間', '調整大小'],
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 更新對話歷史
        setConversationHistory([
          ...newHistory,
          { role: 'assistant', content: '已生成圖片', images },
        ]);

        if (images[0] && onImageGenerated) {
          onImageGenerated(images[0]);
        }
      } else {
        // 使用 AI 設計對話
        try {
          const chatResponse = await aiDesignChat({
            messages: newHistory,
            currentImage: getSelectedImage(),
          });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: chatResponse.message,
            images: chatResponse.images,
            timestamp: new Date(),
            suggestedActions: chatResponse.suggestedActions,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // 更新對話歷史
          setConversationHistory([
            ...newHistory,
            {
              role: 'assistant',
              content: chatResponse.message,
              images: chatResponse.images
            },
          ]);

          if (chatResponse.images && chatResponse.images[0] && onImageGenerated) {
            onImageGenerated(chatResponse.images[0]);
          }
        } catch (chatError) {
          // 如果 AI 對話失敗，嘗試直接生成圖片
          console.warn('AI 對話失敗，嘗試直接生成圖片:', chatError);

          const images = await generateImage({
            prompt: currentInput,
            model: selectedModel,
            width: 1024,
            height: 1024,
          });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '我理解了您的需求，這是我為您生成的圖片：',
            images,
            timestamp: new Date(),
            suggestedActions: ['去背', '超清 2 倍', '繼續編輯'],
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (images[0] && onImageGenerated) {
            onImageGenerated(images[0]);
          }
        }
      }

      // 更新用戶訊息狀態
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，處理時發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
    // 自動發送
    setTimeout(() => {
      const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
      sendButton?.click();
    }, 100);
  };

  const quickActions = [
    { label: '生成產品主圖', prompt: '幫我生成一張電商產品主圖', icon: ImageIcon },
    { label: '場景圖', prompt: '幫我生成一張產品場景應用圖', icon: Palette },
    { label: '去背', prompt: '幫我去除圖片背景', icon: Eraser },
    { label: '超清', prompt: '幫我將圖片超清放大 2 倍', icon: ZoomIn },
  ];

  const canvasQuickActions = [
    { label: '置中', prompt: '把圖片移到中間', icon: Move },
    { label: '放大', prompt: '放大 1.5 倍', icon: ZoomIn },
    { label: '旋轉', prompt: '旋轉 90 度', icon: RotateCw },
    { label: '翻轉', prompt: '水平翻轉', icon: FlipHorizontal },
    { label: '複製', prompt: '複製這個圖層', icon: Copy },
    { label: '刪除', prompt: '刪除選中的圖層', icon: Trash2 },
  ];

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: '新會話已開始！請告訴我你想要什麼？',
        timestamp: new Date(),
      },
    ]);
    setConversationHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* 頂部工具欄 */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          <span className="font-medium">AI 設計助手</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white"
            title="新會話"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white"
            title="歷史記錄"
          >
            <Clock size={18} />
          </button>
        </div>
      </div>

      {/* 訊息區域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'system' && message.task ? (
              // 任務狀態卡片
              <div className="w-full bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {message.task.status === 'in_progress' && (
                    <Loader2 size={16} className="animate-spin text-accent" />
                  )}
                  {message.task.status === 'completed' && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {message.task.status === 'error' && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                  <span className="font-medium">{message.task.type}</span>
                </div>
                {message.task.status === 'in_progress' && (
                  <div className="text-sm text-gray-400">正在處理中...</div>
                )}
                {message.task.status === 'completed' && (
                  <div className="text-sm text-green-500">任務已完成</div>
                )}
              </div>
            ) : (
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                {/* 上傳的圖片 */}
                {message.images && message.images.length > 0 && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {message.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full rounded-lg cursor-pointer hover:opacity-90"
                          onClick={() => onAddToCanvas?.(img)}
                        />
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => onAddToCanvas?.(img)}
                            className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70"
                          >
                            添加到畫布
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 訊息內容 */}
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* 建議的後續操作 */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedAction(action)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-gray-300 hover:text-white flex items-center gap-1"
                      >
                        <Wand2 size={12} />
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                {/* 訊息狀態 */}
                {message.role === 'user' && (
                  <div className="flex justify-end mt-1">
                    {message.status === 'sending' && (
                      <Loader2 size={12} className="animate-spin opacity-70" />
                    )}
                    {message.status === 'sent' && (
                      <CheckCircle2 size={12} className="opacity-70" />
                    )}
                    {message.status === 'error' && (
                      <AlertCircle size={12} className="text-red-300" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷操作 */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 space-y-2">
          <div className="text-xs text-gray-500 mb-1">AI 功能</div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action.prompt)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-700 hover:border-accent hover:text-white flex items-center gap-1"
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>
          {selectedLayerId && (
            <>
              <div className="text-xs text-gray-500 mb-1 mt-2">畫布操作</div>
              <div className="flex flex-wrap gap-2">
                {canvasQuickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.prompt)}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-700 hover:border-accent hover:text-white flex items-center gap-1"
                  >
                    <action.icon size={14} />
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 上傳的圖片預覽 */}
      {uploadedImages.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative shrink-0">
                <img
                  src={img}
                  alt={`Upload ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeUploadedImage(idx)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 輸入區域 */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-700 rounded-lg shrink-0"
            title="上傳圖片"
          >
            <ImageIcon size={20} className="text-gray-400" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="輸入一句話讓 AI 幫你設計..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-gray-500"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            data-send-button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
            className="p-3 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignAssistant;
