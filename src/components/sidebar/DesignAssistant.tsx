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
} from 'lucide-react';
import { generateImage } from '../../services/aiService';
import type { AIModel } from '../../types';

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
}

interface DesignAssistantProps {
  onImageGenerated?: (imageUrl: string) => void;
  onAddToCanvas?: (imageUrl: string) => void;
  currentImage?: string;
  selectedModel?: AIModel;
}

export const DesignAssistant: React.FC<DesignAssistantProps> = ({
  onImageGenerated,
  onAddToCanvas,
  selectedModel = 'gemini-flash',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 設計助手，可以幫你：\n\n1. 🎨 生成產品主圖、場景圖\n2. ✨ 修改和優化圖片\n3. 📦 生成電商產品套圖\n4. 💡 提供設計建議\n\n請告訴我你想要什麼？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
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
    setInput('');
    setUploadedImages([]);
    setIsLoading(true);

    try {
      // 檢查是否是生成圖片的請求
      const isGenerateRequest = /生成|創建|製作|畫/.test(input);

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
          prompt: input,
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
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (images[0] && onImageGenerated) {
          onImageGenerated(images[0]);
        }
      } else {
        // AI 對話功能開發中，使用圖片生成代替
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'AI 對話功能開發中，正在嘗試為您生成圖片...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 嘗試生成圖片
        try {
          const images = await generateImage({
            prompt: input,
            model: selectedModel,
            width: 1024,
            height: 1024,
          });
          if (images[0] && onImageGenerated) {
            onImageGenerated(images[0]);
            const imageMessage: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: '圖片已生成！',
              images,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, imageMessage]);
          }
        } catch {
          const errorMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'AI 對話功能開發中，請使用圖片生成相關指令',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
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

  const quickActions = [
    { label: '生成產品主圖', prompt: '幫我生成一張電商產品主圖' },
    { label: '場景圖', prompt: '幫我生成一張產品場景應用圖' },
    { label: '白底圖', prompt: '幫我生成一張白底產品展示圖' },
    { label: '套圖設計', prompt: '幫我設計一套完整的電商產品套圖' },
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
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action.prompt)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-700 hover:border-accent hover:text-white"
              >
                {action.label}
              </button>
            ))}
          </div>
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
