import React, { useState } from 'react';
import {
  Edit3,
  Maximize2,
  Zap,
  Eraser,
  Layers,
  Scissors,
  Type,
  Crop,
  MessageSquare,
  Download,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
} from 'lucide-react';

interface AIToolbarProps {
  selectedImage?: string;
  onAIEdit: (prompt: string) => Promise<void>;
  onAIOutpaint: (direction: 'up' | 'down' | 'left' | 'right' | 'all', prompt?: string) => Promise<void>;
  onAIUpscale: (scale: 2 | 4) => Promise<void>;
  onAIRemoveObject: () => Promise<void>;
  onLayerSplit: () => Promise<void>;
  onRemoveBackground: () => Promise<void>;
  onTextReplace: (originalText: string, newText: string) => Promise<void>;
  onCrop: () => void;
  onAddToChat: () => void;
  onDownload: () => void;
  isProcessing?: boolean;
}

type ActiveTool = 'edit' | 'outpaint' | 'upscale' | 'remove' | 'split' | 'bg' | 'text' | 'crop' | null;

export const AIToolbar: React.FC<AIToolbarProps> = ({
  selectedImage,
  onAIEdit,
  onAIOutpaint,
  onAIUpscale,
  onAIRemoveObject,
  onLayerSplit,
  onRemoveBackground,
  onTextReplace,
  onCrop,
  onAddToChat,
  onDownload,
  isProcessing = false,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [outpaintPrompt, setOutpaintPrompt] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [newText, setNewText] = useState('');
  const [upscaleValue, setUpscaleValue] = useState<2 | 4>(2);

  const tools = [
    { id: 'edit', icon: Edit3, label: 'AI 改圖', color: 'text-blue-600' },
    { id: 'outpaint', icon: Maximize2, label: 'AI 擴圖', color: 'text-purple-600' },
    { id: 'upscale', icon: Zap, label: 'AI 超清', color: 'text-yellow-600' },
    { id: 'remove', icon: Eraser, label: 'AI 無痕消除', color: 'text-red-600' },
    { id: 'split', icon: Layers, label: '拆分圖層', color: 'text-green-600' },
    { id: 'bg', icon: Scissors, label: '摳圖', color: 'text-pink-600' },
    { id: 'text', icon: Type, label: '無痕改字', color: 'text-indigo-600' },
    { id: 'crop', icon: Crop, label: '裁剪', color: 'text-orange-600' },
  ];

  const handleToolClick = async (toolId: string) => {
    if (toolId === activeTool) {
      setActiveTool(null);
      return;
    }

    // 直接執行的工具
    switch (toolId) {
      case 'remove':
        await onAIRemoveObject();
        break;
      case 'split':
        await onLayerSplit();
        break;
      case 'bg':
        await onRemoveBackground();
        break;
      case 'crop':
        onCrop();
        break;
      default:
        setActiveTool(toolId as ActiveTool);
    }
  };

  const handleEditSubmit = async () => {
    if (editPrompt.trim()) {
      await onAIEdit(editPrompt);
      setEditPrompt('');
      setActiveTool(null);
    }
  };

  const handleTextReplaceSubmit = async () => {
    if (originalText.trim() && newText.trim()) {
      await onTextReplace(originalText, newText);
      setOriginalText('');
      setNewText('');
      setActiveTool(null);
    }
  };

  const handleUpscaleSubmit = async () => {
    await onAIUpscale(upscaleValue);
    setActiveTool(null);
  };

  const handleOutpaintSubmit = async (direction: 'up' | 'down' | 'left' | 'right' | 'all') => {
    await onAIOutpaint(direction, outpaintPrompt || undefined);
    setOutpaintPrompt('');
    setActiveTool(null);
  };

  if (!selectedImage) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 text-center text-gray-500">
        <p>請選擇一張圖片以使用 AI 工具</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 工具按鈕列 */}
      <div className="p-2 border-b border-gray-100">
        <div className="grid grid-cols-4 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                activeTool === tool.id
                  ? 'bg-blue-50 ring-2 ring-blue-500'
                  : 'hover:bg-gray-50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <tool.icon size={20} className={tool.color} />
              <span className="text-xs mt-1 text-gray-600">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 工具詳細面板 */}
      {activeTool && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">
              {tools.find((t) => t.id === activeTool)?.label}
            </h4>
            <button
              onClick={() => setActiveTool(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X size={16} />
            </button>
          </div>

          {/* AI 改圖面板 */}
          {activeTool === 'edit' && (
            <div className="space-y-3">
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="描述你想要的修改，例如：將背景改成海灘、添加陽光效果..."
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleEditSubmit}
                disabled={!editPrompt.trim() || isProcessing}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    處理中...
                  </>
                ) : (
                  '開始修改'
                )}
              </button>
            </div>
          )}

          {/* AI 擴圖面板 */}
          {activeTool === 'outpaint' && (
            <div className="space-y-3">
              <textarea
                value={outpaintPrompt}
                onChange={(e) => setOutpaintPrompt(e.target.value)}
                placeholder="描述延伸的內容（選填）"
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleOutpaintSubmit('up')}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                >
                  <ArrowUp size={20} className="text-purple-600" />
                  <span className="text-xs mt-1">向上</span>
                </button>
                <button
                  onClick={() => handleOutpaintSubmit('all')}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                >
                  <Move size={20} className="text-purple-600" />
                  <span className="text-xs mt-1">四周</span>
                </button>
                <button
                  onClick={() => handleOutpaintSubmit('down')}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                >
                  <ArrowDown size={20} className="text-purple-600" />
                  <span className="text-xs mt-1">向下</span>
                </button>
                <button
                  onClick={() => handleOutpaintSubmit('left')}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                >
                  <ArrowLeft size={20} className="text-purple-600" />
                  <span className="text-xs mt-1">向左</span>
                </button>
                <div />
                <button
                  onClick={() => handleOutpaintSubmit('right')}
                  disabled={isProcessing}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300"
                >
                  <ArrowRight size={20} className="text-purple-600" />
                  <span className="text-xs mt-1">向右</span>
                </button>
              </div>
            </div>
          )}

          {/* AI 超清面板 */}
          {activeTool === 'upscale' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setUpscaleValue(2)}
                  className={`flex-1 py-2 rounded-lg border ${
                    upscaleValue === 2
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  2x 放大
                </button>
                <button
                  onClick={() => setUpscaleValue(4)}
                  className={`flex-1 py-2 rounded-lg border ${
                    upscaleValue === 4
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  4x 放大
                </button>
              </div>
              <button
                onClick={handleUpscaleSubmit}
                disabled={isProcessing}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    處理中...
                  </>
                ) : (
                  `放大 ${upscaleValue}x`
                )}
              </button>
            </div>
          )}

          {/* 無痕改字面板 */}
          {activeTool === 'text' && (
            <div className="space-y-3">
              <input
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="原始文字"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="新文字"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleTextReplaceSubmit}
                disabled={!originalText.trim() || !newText.trim() || isProcessing}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    處理中...
                  </>
                ) : (
                  '替換文字'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div className="p-2 flex justify-between">
        <button
          onClick={onAddToChat}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <MessageSquare size={16} />
          添加到聊天
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Download size={16} />
          下載
        </button>
      </div>

      {/* 處理中遮罩 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">AI 處理中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolbar;
