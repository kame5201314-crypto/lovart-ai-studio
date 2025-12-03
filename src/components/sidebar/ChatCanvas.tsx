import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Sparkles,
  Image,
  Wand2,
  Eraser,
  ZoomIn,
  Bot,
  User,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import {
  generateImage,
  removeBackground,
  upscaleImage,
} from '../../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: 'generate' | 'remove-bg' | 'upscale' | 'inpaint' | 'outpaint' | 'edit';
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: string;
  };
}

interface ChatCanvasProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// AI 指令解析
const parseCommand = (input: string): { command: string; params: Record<string, string> } | null => {
  const lowerInput = input.toLowerCase();

  // 生成圖片
  if (lowerInput.includes('生成') || lowerInput.includes('創建') || lowerInput.includes('畫') ||
      lowerInput.includes('generate') || lowerInput.includes('create') || lowerInput.includes('draw')) {
    return { command: 'generate', params: { prompt: input } };
  }

  // 去背
  if (lowerInput.includes('去背') || lowerInput.includes('去除背景') || lowerInput.includes('透明背景') ||
      lowerInput.includes('remove background') || lowerInput.includes('transparent')) {
    return { command: 'remove-bg', params: {} };
  }

  // 放大
  if (lowerInput.includes('放大') || lowerInput.includes('高清') || lowerInput.includes('upscale') ||
      lowerInput.includes('enhance') || lowerInput.includes('enlarge')) {
    const scale = lowerInput.includes('4x') || lowerInput.includes('4倍') ? '4' : '2';
    return { command: 'upscale', params: { scale } };
  }

  // 局部重繪
  if (lowerInput.includes('重繪') || lowerInput.includes('修改') || lowerInput.includes('inpaint') ||
      lowerInput.includes('edit') || lowerInput.includes('change')) {
    return { command: 'inpaint', params: { prompt: input } };
  }

  // 擴圖
  if (lowerInput.includes('擴展') || lowerInput.includes('擴圖') || lowerInput.includes('outpaint') ||
      lowerInput.includes('expand')) {
    return { command: 'outpaint', params: { prompt: input } };
  }

  return null;
};

export const ChatCanvas: React.FC<ChatCanvasProps> = ({ isExpanded = false, onToggleExpand }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '嗨！我是 Lovart AI 設計助手 🎨\n\n你可以告訴我想要什麼，例如：\n• "生成一張日落海灘的圖片"\n• "幫我去除背景"\n• "把這張圖放大2倍"\n• "重繪選中區域為藍色天空"\n\n讓我們開始創作吧！',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    addImageLayer,
    layers,
    selectedLayerId,
    updateLayer,
    selectedModel,
    setLoading,
  } = useCanvasStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, action?: Message['action']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      action,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessageAction = (id: string, action: Partial<Message['action']>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, action: { ...msg.action, ...action } as Message['action'] } : msg
      )
    );
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    addMessage('user', userInput);

    const command = parseCommand(userInput);

    if (!command) {
      // 一般對話回應
      setTimeout(() => {
        addMessage('assistant',
          '我理解你想要進行設計。請告訴我更具體的需求，例如：\n\n' +
          '📝 **生成圖片**: "生成一隻可愛的貓咪"\n' +
          '🎨 **去背**: "幫我去除背景"\n' +
          '🔍 **放大**: "把圖片放大2倍"\n' +
          '✨ **重繪**: "把天空改成星空"\n\n' +
          '我會立即幫你處理！'
        );
      }, 500);
      return;
    }

    setIsProcessing(true);
    setLoading(true, '正在處理您的請求...');

    try {
      switch (command.command) {
        case 'generate': {
          const msgId = addMessage('assistant', '正在為您生成圖片...', {
            type: 'generate',
            status: 'processing',
          });

          const prompt = userInput.replace(/生成|創建|畫|generate|create|draw/gi, '').trim();
          const results = await generateImage({
            prompt: prompt || userInput,
            model: selectedModel,
            width: 1024,
            height: 1024,
            numOutputs: 1,
          });

          results.forEach((url, i) => {
            addImageLayer(url, `AI 生成 ${i + 1}`);
          });

          updateMessageAction(msgId, { status: 'completed', result: results[0] });
          addMessage('assistant', `✨ 圖片已生成並添加到畫布！\n\n提示詞: "${prompt || userInput}"\n\n你可以：\n• 拖動調整位置\n• 縮放大小\n• 繼續輸入指令進行編輯`);
          break;
        }

        case 'remove-bg': {
          const selectedLayer = layers.find((l) => l.id === selectedLayerId && l.type === 'image');
          if (!selectedLayer) {
            addMessage('assistant', '⚠️ 請先選擇一個圖片圖層，然後再執行去背操作。\n\n提示：點擊畫布上的圖片即可選中它。');
            break;
          }

          const msgId = addMessage('assistant', '正在去除背景...', {
            type: 'remove-bg',
            status: 'processing',
          });

          const result = await removeBackground({
            image: (selectedLayer as any).src,
          });

          updateLayer(selectedLayer.id, { src: result });
          updateMessageAction(msgId, { status: 'completed', result });
          addMessage('assistant', '✅ 背景已成功去除！圖片現在是透明背景。');
          break;
        }

        case 'upscale': {
          const selectedLayer = layers.find((l) => l.id === selectedLayerId && l.type === 'image');
          if (!selectedLayer) {
            addMessage('assistant', '⚠️ 請先選擇一個圖片圖層，然後再執行放大操作。');
            break;
          }

          const scale = command.params.scale === '4' ? 4 : 2;
          const msgId = addMessage('assistant', `正在放大圖片 ${scale}x...`, {
            type: 'upscale',
            status: 'processing',
          });

          const result = await upscaleImage({
            image: (selectedLayer as any).src,
            scale: scale as 2 | 4,
          });

          updateLayer(selectedLayer.id, {
            src: result,
            width: (selectedLayer as any).width * scale,
            height: (selectedLayer as any).height * scale,
          });

          updateMessageAction(msgId, { status: 'completed', result });
          addMessage('assistant', `✅ 圖片已放大 ${scale} 倍！解析度大幅提升。`);
          break;
        }

        case 'inpaint': {
          addMessage('assistant',
            '🎨 要進行局部重繪，請按照以下步驟：\n\n' +
            '1. 選擇工具欄的「遮罩工具」(K)\n' +
            '2. 在要修改的區域塗抹\n' +
            '3. 在右側 AI 工具面板輸入重繪提示詞\n' +
            '4. 點擊「開始重繪」\n\n' +
            '我已準備好協助您！'
          );
          break;
        }

        case 'outpaint': {
          addMessage('assistant',
            '🖼️ 要擴展圖片，請在右側 AI 工具面板中：\n\n' +
            '1. 選擇「擴圖」功能\n' +
            '2. 選擇擴展方向（上/下/左/右/全部）\n' +
            '3. 設定擴展大小\n' +
            '4. 點擊「開始擴圖」\n\n' +
            '我會幫您無縫擴展畫面！'
          );
          break;
        }
      }
    } catch (error) {
      addMessage('assistant', `❌ 操作失敗: ${(error as Error).message}\n\n請稍後再試，或嘗試其他操作。`);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  }, [input, isProcessing, layers, selectedLayerId, selectedModel, addImageLayer, updateLayer, setLoading]);

  const quickActions = [
    { icon: <Image size={16} />, label: '生成圖片', prompt: '生成一張' },
    { icon: <Eraser size={16} />, label: '去背', prompt: '幫我去除背景' },
    { icon: <ZoomIn size={16} />, label: '放大', prompt: '把圖片放大2倍' },
    { icon: <Wand2 size={16} />, label: '重繪', prompt: '重繪選中區域' },
  ];

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${isExpanded ? 'w-96' : 'w-80'}`}>
      {/* 標題欄 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <span className="font-semibold">AI 助手</span>
            <p className="text-xs text-gray-400">與 AI 對話創作</p>
          </div>
        </div>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
      </div>

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 ${
                message.role === 'user'
                  ? 'bg-accent text-white rounded-br-md'
                  : 'bg-gray-800 text-gray-100 rounded-bl-md'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot size={16} className="mt-1 text-accent flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.action?.status === 'processing' && (
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
                      <Loader2 size={12} className="animate-spin" />
                      <span>處理中...</span>
                    </div>
                  )}
                  {message.action?.status === 'completed' && message.action.result && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={message.action.result}
                        alt="Generated"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <User size={16} className="mt-1 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快速操作 */}
      <div className="px-4 py-2 border-t border-gray-700">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInput(action.prompt)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs whitespace-nowrap transition-colors"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 輸入區 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="描述你想要的設計..."
            rows={2}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            className="p-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            {isProcessing ? (
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
