import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Sun,
  Image as ImageIcon,
  Lightbulb,
  Layers,
  RefreshCw,
  Download,
  X,
} from 'lucide-react';

interface ProductStudioProps {
  onImageGenerated?: (imageUrl: string) => void;
  onClose?: () => void;
}

// 預設背景選項
const backgroundPresets = [
  { id: 'white', name: '純白背景', color: '#ffffff', icon: '⬜' },
  { id: 'gray', name: '淺灰背景', color: '#f0f0f0', icon: '🔘' },
  { id: 'gradient', name: '漸層背景', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '🌈' },
  { id: 'studio', name: '攝影棚', color: '#e8e8e8', icon: '📷' },
  { id: 'marble', name: '大理石', color: '#f5f5f5', icon: '🪨' },
  { id: 'wood', name: '木質紋理', color: '#d4a574', icon: '🪵' },
];

// 打光預設
const lightingPresets = [
  { id: 'soft-top', name: '柔和頂光', description: '專業柔和的頂部光源，適合電商主圖' },
  { id: 'dramatic', name: '戲劇性光源', description: '強對比光影，適合藝術感呈現' },
  { id: 'natural', name: '自然光', description: '模擬戶外自然光線' },
  { id: 'ring', name: '環形光', description: '均勻環繞光源，減少陰影' },
  { id: 'three-point', name: '三點布光', description: '專業攝影標準布光' },
];

export const ProductStudio: React.FC<ProductStudioProps> = ({
  onImageGenerated,
  onClose,
}) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState('white');
  const [selectedLighting, setSelectedLighting] = useState('soft-top');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage) {
      alert('請先上傳產品圖片');
      return;
    }

    setIsProcessing(true);

    const bgPreset = backgroundPresets.find(b => b.id === selectedBackground);
    const lightPreset = lightingPresets.find(l => l.id === selectedLighting);

    // 組合提示詞
    const prompt = `Professional product photography of the uploaded product, ${bgPreset?.name || '純白背景'}, ${lightPreset?.description || '柔和頂光'}, high-end e-commerce style, clean and minimalist, studio lighting, sharp details, 4K quality${customPrompt ? `, ${customPrompt}` : ''}`;

    try {
      // 使用 Pollinations.ai 免費服務
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

      // 預加載圖片
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setGeneratedImages(prev => [imageUrl, ...prev].slice(0, 6));
        setIsProcessing(false);
      };
      img.onerror = () => {
        console.error('圖片載入失敗');
        setIsProcessing(false);
        alert('生成失敗，請重試');
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('生成失敗:', error);
      setIsProcessing(false);
      alert('生成失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleSelectGenerated = (imageUrl: string) => {
    onImageGenerated?.(imageUrl);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">產品攝影棚</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 上傳產品圖片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="w-4 h-4 inline mr-1" />
            上傳產品原圖
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              productImage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {productImage ? (
              <div className="relative">
                <img src={productImage} alt="產品" className="max-h-40 mx-auto rounded-lg" />
                <p className="text-sm text-gray-500 mt-2">點擊更換圖片</p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">點擊上傳產品圖片</p>
                <p className="text-xs text-gray-400 mt-1">支援 JPG、PNG、WebP</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* 背景選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Layers className="w-4 h-4 inline mr-1" />
            選擇背景
          </label>
          <div className="grid grid-cols-3 gap-2">
            {backgroundPresets.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedBackground === bg.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{bg.icon}</span>
                <p className="text-xs text-gray-600 mt-1">{bg.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 打光選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lightbulb className="w-4 h-4 inline mr-1" />
            打光模式
          </label>
          <div className="space-y-2">
            {lightingPresets.map((light) => (
              <button
                key={light.id}
                onClick={() => setSelectedLighting(light.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLighting === light.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className={`w-4 h-4 ${selectedLighting === light.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{light.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">{light.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 自定義提示詞 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Sparkles className="w-4 h-4 inline mr-1" />
            自定義效果（選填）
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：增加反射效果、添加裝飾元素..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        {/* 生成按鈕 */}
        <button
          onClick={handleGenerate}
          disabled={!productImage || isProcessing}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            productImage && !isProcessing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              生成電商主圖
            </>
          )}
        </button>

        {/* 生成結果 */}
        {generatedImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成結果
            </label>
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`生成結果 ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleSelectGenerated(img)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="加入畫布"
                    >
                      <Layers className="w-4 h-4 text-gray-700" />
                    </button>
                    <a
                      href={img}
                      download={`product-${Date.now()}.png`}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="下載"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStudio;
