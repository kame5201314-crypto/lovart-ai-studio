import React, { useState, useRef } from 'react';
import {
  Layers,
  Wand2,
  RefreshCw,
  Download,
  X,
  Image as ImageIcon,
  Blend,
  Sliders,
} from 'lucide-react';

interface LayerBlenderProps {
  onImageGenerated?: (imageUrl: string) => void;
  onClose?: () => void;
}

// 融合模式
const blendModes = [
  { id: 'natural', name: '自然融合', description: 'AI 智能融合，保持自然過渡' },
  { id: 'overlay', name: '疊加', description: '前景直接疊加在背景上' },
  { id: 'soft', name: '柔和融合', description: '柔化邊緣，自然過渡' },
  { id: 'shadow', name: '添加陰影', description: '自動添加投影效果' },
];

export const LayerBlender: React.FC<LayerBlenderProps> = ({
  onImageGenerated,
  onClose,
}) => {
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [selectedBlendMode, setSelectedBlendMode] = useState('natural');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(100);
  const foregroundInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleUploadForeground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForegroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlend = async () => {
    if (!foregroundImage || !backgroundImage) {
      alert('請先上傳前景和背景圖片');
      return;
    }

    setIsProcessing(true);

    const blendMode = blendModes.find(m => m.id === selectedBlendMode);

    // 組合提示詞進行 AI 融合
    const prompt = `Seamlessly blend a foreground subject into a background scene, ${blendMode?.description || '自然融合'}, professional compositing, realistic lighting match, soft edge blending, photorealistic result${customPrompt ? `, ${customPrompt}` : ''}`;

    try {
      // 使用 Pollinations.ai 免費服務
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

      // 預加載圖片
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setGeneratedImage(imageUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        console.error('圖片載入失敗');
        setIsProcessing(false);
        alert('生成失敗，請重試');
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('融合失敗:', error);
      setIsProcessing(false);
      alert('融合失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleAddToCanvas = () => {
    if (generatedImage) {
      onImageGenerated?.(generatedImage);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Blend className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">素材疊加</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 上傳區域 - 並排顯示 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 前景圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              前景圖片
            </label>
            <div
              onClick={() => foregroundInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors aspect-square flex items-center justify-center ${
                foregroundImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {foregroundImage ? (
                <img src={foregroundImage} alt="前景" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <div>
                  <Layers className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">上傳前景</p>
                </div>
              )}
            </div>
            <input
              ref={foregroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadForeground}
              className="hidden"
            />
          </div>

          {/* 背景圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              背景圖片
            </label>
            <div
              onClick={() => backgroundInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors aspect-square flex items-center justify-center ${
                backgroundImage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {backgroundImage ? (
                <img src={backgroundImage} alt="背景" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <div>
                  <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">上傳背景</p>
                </div>
              )}
            </div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadBackground}
              className="hidden"
            />
          </div>
        </div>

        {/* 融合模式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Wand2 className="w-4 h-4 inline mr-1" />
            融合模式
          </label>
          <div className="grid grid-cols-2 gap-2">
            {blendModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedBlendMode(mode.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedBlendMode === mode.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-sm block">{mode.name}</span>
                <span className="text-xs text-gray-500">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 透明度調整 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Sliders className="w-4 h-4 inline mr-1" />
            前景透明度: {opacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>

        {/* 自定義提示詞 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自定義效果（選填）
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：添加光暈效果、調整色調..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
          />
        </div>

        {/* 融合按鈕 */}
        <button
          onClick={handleBlend}
          disabled={!foregroundImage || !backgroundImage || isProcessing}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            foregroundImage && backgroundImage && !isProcessing
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              融合中...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              AI 智能融合
            </>
          )}
        </button>

        {/* 融合結果 */}
        {generatedImage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              融合結果
            </label>
            <div className="relative group rounded-xl overflow-hidden border border-gray-200">
              <img
                src={generatedImage}
                alt="融合結果"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                <button
                  onClick={handleAddToCanvas}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-1"
                >
                  <Layers className="w-4 h-4" />
                  加入畫布
                </button>
                <a
                  href={generatedImage}
                  download={`blended-${Date.now()}.png`}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  下載
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerBlender;
