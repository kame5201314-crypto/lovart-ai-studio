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
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ChatToolbar } from '../ui/ChatToolbar';
import type { AIModel } from '../../types';

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

// AI 模型列表
const aiModels: { id: AIModel; name: string; icon: string }[] = [
  { id: 'gemini-flash', name: 'Gemini 2.5 Flash', icon: '✨' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', icon: '◉' },
  { id: 'nano-banana', name: 'Nano Banana', icon: '◉' },
  { id: 'flux-pro', name: 'Flux Pro', icon: '▊' },
  { id: 'flux-schnell', name: 'Flux Schnell', icon: '⚡' },
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

interface LovartSidebarProps {
  onSendMessage?: (message: string, model: string) => void;
  onSelectExample?: (example: typeof exampleCards[0]) => void;
  onOpenStudio?: () => void;
  chatHistory?: ChatHistoryItem[];
  generatedFiles?: GeneratedFile[];
  onNewChat?: () => void;
  onSelectHistory?: (chatId: string) => void;
  onShare?: () => void;
  onSelectFile?: (fileId: string) => void;
}

export const LovartSidebar: React.FC<LovartSidebarProps> = ({
  onSendMessage,
  onSelectExample,
  onOpenStudio,
  chatHistory = [],
  generatedFiles = [],
  onNewChat,
  onSelectHistory,
  onShare,
  onSelectFile,
}) => {
  const { selectedModel, setSelectedModel } = useCanvasStore();
  const [message, setMessage] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<'thinking' | 'fast'>('fast');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage?.(message, selectedModel);
      setMessage('');
    }
  };

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
      <div className="flex-1 overflow-y-auto p-4">
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
      </div>

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
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setThinkingMode('thinking')}
              className={`p-2 rounded-lg ${thinkingMode === 'thinking' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-500'}`}
              title="思考模式 - 制定複雜任務並自主執行"
            >
              <Lightbulb size={18} />
            </button>
            <button
              onClick={() => setThinkingMode('fast')}
              className={`p-2 rounded-lg ${thinkingMode === 'fast' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
              title="快速模式 - 快速制定和執行任務"
            >
              <Zap size={18} />
            </button>
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
