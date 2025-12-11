import React, { useState, useRef } from 'react';
import {
  Plus,
  Paperclip,
  AtSign,
  Lightbulb,
  Zap,
  Globe,
  Smile,
  Send,
  ChevronDown,
  Sparkles,
  Camera,
  User,
  Bot,
  Loader2,
  Tag,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ChatToolbar } from '../ui/ChatToolbar';
import type { AIModel, MarkerLayer } from '../../types';

// 範例卡片數據
const exampleCards = [
  {
    id: '1',
    title: '酒單設計',
    description: '模仿這個效果生成一張海報...',
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    ],
  },
  {
    id: '2',
    title: '咖啡廳品牌設計',
    description: '你是一位品牌設計專家，生成...',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop',
    ],
  },
  {
    id: '3',
    title: '故事板',
    description: '我需要一個故事板來呈現這個...',
    images: [
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=100&h=100&fit=crop',
    ],
  },
];

// AI 模型列表（使用 Gemini API）
const aiModels: { id: AIModel; name: string; icon: string }[] = [
  { id: 'gemini-flash', name: 'Gemini 2.5 Flash', icon: '✨' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', icon: '🍌' },
];

// 對話歷史項目
interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

// 生成的文件項目
interface GeneratedFile {
  id: string;
  name: string;
  thumbnail: string;
  type: 'image' | 'video';
}

// 對話訊息類型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface LovartSidebarProps {
  onSendMessage?: (message: string, model: string) => void;
  onSelectExample?: (example: typeof exampleCards[0]) => void;
  onOpenStudio?: () => void;
  chatHistory?: ChatHistoryItem[];
  generatedFiles?: GeneratedFile[];
  onNewChat?: () => void;
  onSelectHistory?: (chatId: string) => void;
  onDeleteHistory?: (chatId: string) => void;
  onShare?: () => void;
  onSelectFile?: (fileId: string) => void;
  isGenerating?: boolean;
  lastGeneratedImage?: string;
}

export const LovartSidebar: React.FC<LovartSidebarProps> = ({
  onSendMessage,
  onSelectExample,
  onOpenStudio,
  chatHistory = [],
  generatedFiles = [],
  onNewChat,
  onSelectHistory,
  onDeleteHistory,
  onShare,
  onSelectFile,
  isGenerating = false,
  lastGeneratedImage,
}) => {
  const { selectedModel, setSelectedModel, layers, selectLayer, updateMarkerObjectName } = useCanvasStore();
  const [message, setMessage] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<'thinking' | 'fast'>('fast');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 對話記錄狀態
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 編輯標記名稱狀態
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 獲取所有標記圖層
  const markerLayers = layers.filter(l => l.type === 'marker') as MarkerLayer[];

  const handleSend = () => {
    if (message.trim()) {
      // 添加用戶訊息到對話記錄
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 添加 AI 回應佔位符（正在生成中）
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '正在生成圖片...',
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages(prev => [...prev, aiMessage]);

      // 發送訊息
      onSendMessage?.(message, selectedModel);
      setMessage('');

      // 滾動到底部
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  };

  // 當收到生成的圖片時，更新最後一條 AI 訊息
  React.useEffect(() => {
    if (lastGeneratedImage && messages.length > 0) {
      setMessages(prev => {
        const newMessages = [...prev];
        // 找到最後一條 AI 訊息
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant' && newMessages[i].isLoading) {
            newMessages[i] = {
              ...newMessages[i],
              content: '圖片已生成！',
              image: lastGeneratedImage,
              isLoading: false,
            };
            break;
          }
        }
        return newMessages;
      });
    }
  }, [lastGeneratedImage]);

  // 當生成狀態改變時更新
  React.useEffect(() => {
    if (!isGenerating && messages.length > 0) {
      setMessages(prev => {
        const newMessages = [...prev];
        // 找到正在載入的 AI 訊息並更新
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant' && newMessages[i].isLoading) {
            if (!newMessages[i].image) {
              newMessages[i] = {
                ...newMessages[i],
                content: '生成完成',
                isLoading: false,
              };
            }
            break;
          }
        }
        return newMessages;
      });
    }
  }, [isGenerating]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-[360px] h-full flex flex-col bg-white border-l border-gray-200 relative">
      {/* 頂部工具列 */}
      <div className="flex items-center justify-end gap-1 p-3 border-b border-gray-100 relative">
        <ChatToolbar
          onNewChat={onNewChat}
          onSelectHistory={onSelectHistory}
          onDeleteHistory={onDeleteHistory}
          onShare={onShare}
          onSelectFile={onSelectFile}
          chatHistory={chatHistory}
          generatedFiles={generatedFiles}
        />
        <button
          onClick={onOpenStudio}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          title="智慧工作室"
        >
          <Camera size={18} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="智慧設計師">
          <Sparkles size={18} />
        </button>
      </div>

      {/* 主要內容區 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <>
            {/* AI 頭像和歡迎訊息 */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Hi，我是你的 AI 設計師</h2>
              <p className="text-sm text-gray-500">讓我們開始今天的創作吧！</p>
            </div>

            {/* 範例卡片 */}
            <div className="space-y-3">
              {exampleCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onSelectExample?.(card)}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-left transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{card.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {card.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 切換更多 */}
            <button className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
              <span className="text-xs">○</span> 切換
            </button>
          </>
        ) : (
          /* 對話記錄 */
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* 頭像 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  {msg.role === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-gray-600" />
                  )}
                </div>

                {/* 訊息內容 */}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>

                  {/* 生成的圖片 */}
                  {msg.image && (
                    <div className="mt-2">
                      <img
                        src={msg.image}
                        alt="生成的圖片"
                        className="rounded-lg max-w-full h-auto shadow-md"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}

                  {/* 時間戳記 */}
                  <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 標記物件列表 */}
      {markerLayers.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-red-500" />
            <h3 className="text-sm font-medium text-gray-900">已標記物件</h3>
            <span className="text-xs text-gray-400">({markerLayers.length})</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {markerLayers.map((marker) => (
              <div
                key={marker.id}
                className="group flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => selectLayer(marker.id)}
              >
                {/* 標記數字 */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: marker.color }}
                >
                  {marker.number}
                </div>

                {/* 物件名稱（可編輯） */}
                {editingMarkerId === marker.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateMarkerObjectName(marker.id, editingName);
                          setEditingMarkerId(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingMarkerId(null);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateMarkerObjectName(marker.id, editingName);
                        setEditingMarkerId(null);
                      }}
                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMarkerId(null);
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {marker.isIdentifying ? (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Loader2 size={12} className="animate-spin" />
                          識別中...
                        </span>
                      ) : (
                        marker.objectName || '未識別'
                      )}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMarkerId(marker.id);
                        setEditingName(marker.objectName || '');
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="自定義名稱"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部輸入區 */}
      <div className="p-4 border-t border-gray-100">
        {/* 模型選擇器 */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="text-blue-500">◉</span>
            <span>{aiModels.find(m => m.id === selectedModel)?.name}</span>
            <ChevronDown size={14} />
          </button>

          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-50">
              <div className="px-3 py-1 text-xs text-gray-500">模型</div>
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id as AIModel);
                    setShowModelSelector(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-gray-50 ${
                    selectedModel === model.id ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className={selectedModel === model.id ? 'text-blue-500' : 'text-gray-400'}>
                    {model.icon}
                  </span>
                  {model.name}
                </button>
              ))}
              <div className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                ••• 更多
              </div>
            </div>
          )}
        </div>

        {/* 輸入框 */}
        <div className="relative z-20">
          <div className="flex items-center gap-1 text-gray-400 mb-2">
            <AtSign size={14} />
            <span className="text-sm">搜尋圖片、模型或專案</span>
          </div>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => console.log('輸入框獲得焦點')}
            placeholder="請輸入你的設計需求..."
            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm min-h-[60px] shadow-sm text-gray-900"
            rows={3}
          />
        </div>

        {/* 底部工具列 */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="附件">
              <Paperclip size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="@引用">
              <AtSign size={18} />
            </button>

            {/* 思考模式切換器 */}
            <div className="relative">
              <button
                onClick={() => setThinkingMode(thinkingMode === 'thinking' ? 'fast' : 'thinking')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  thinkingMode === 'thinking'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Lightbulb size={14} />
                <span className="hidden sm:inline">思考模式</span>
              </button>

              {/* 思考模式提示 */}
              {thinkingMode === 'thinking' && (
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">思考模式</div>
                  <div className="text-gray-300">制定複雜任務並自主執行</div>
                  <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="網頁搜尋">
              <Globe size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="表情">
              <Smile size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg text-white ml-1"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LovartSidebar;
