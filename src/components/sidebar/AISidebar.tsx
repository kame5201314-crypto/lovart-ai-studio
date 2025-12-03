import { useState, useCallback } from 'react';
import {
  Sparkles,
  Image,
  Eraser,
  Expand,
  ZoomIn,
  Film,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import {
  generateImage,
  removeBackground,
  upscaleImage,
  AI_MODELS,
} from '../../services/aiService';
import type { AIModel } from '../../types';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
};

export const AISidebar: React.FC = () => {
  const {
    selectedModel,
    setSelectedModel,
    addImageLayer,
    isLoading,
    setLoading,
    layers,
    selectedLayerId,
    updateLayer,
  } = useCanvasStore();

  // 文生圖狀態
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [outputWidth, setOutputWidth] = useState(1024);
  const [outputHeight, setOutputHeight] = useState(1024);
  const [numOutputs, setNumOutputs] = useState(1);

  // 擴圖狀態
  const [outpaintDirection, setOutpaintDirection] = useState<
    'left' | 'right' | 'up' | 'down' | 'all'
  >('all');
  const [outpaintSize, setOutpaintSize] = useState(256);

  // 高清放大狀態
  const [upscaleScale, setUpscaleScale] = useState<2 | 4>(2);

  // 局部重繪狀態
  const [inpaintPrompt, setInpaintPrompt] = useState('');

  // 取得選中的圖片層
  const selectedImageLayer = layers.find(
    (l) => l.id === selectedLayerId && l.type === 'image'
  );

  // 文生圖
  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true, '正在生成圖片...');

    try {
      const results = await generateImage({
        prompt,
        negativePrompt,
        model: selectedModel,
        width: outputWidth,
        height: outputHeight,
        numOutputs,
      });

      results.forEach((url, index) => {
        addImageLayer(url, `生成圖片 ${index + 1}`);
      });

      setPrompt('');
    } catch (error) {
      console.error('生成失敗:', error);
      alert('生成失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    prompt,
    negativePrompt,
    selectedModel,
    outputWidth,
    outputHeight,
    numOutputs,
    addImageLayer,
    setLoading,
  ]);

  // 去背
  const handleRemoveBackground = useCallback(async () => {
    if (!selectedImageLayer) {
      alert('請先選擇一個圖片層');
      return;
    }

    setLoading(true, '正在去除背景...');

    try {
      const result = await removeBackground({
        image: (selectedImageLayer as any).src,
      });

      updateLayer(selectedImageLayer.id, {
        src: result,
      });
    } catch (error) {
      console.error('去背失敗:', error);
      alert('去背失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedImageLayer, updateLayer, setLoading]);

  // 高清放大
  const handleUpscale = useCallback(async () => {
    if (!selectedImageLayer) {
      alert('請先選擇一個圖片層');
      return;
    }

    setLoading(true, `正在放大圖片 ${upscaleScale}x...`);

    try {
      const result = await upscaleImage({
        image: (selectedImageLayer as any).src,
        scale: upscaleScale,
      });

      updateLayer(selectedImageLayer.id, {
        src: result,
        width: (selectedImageLayer as any).width * upscaleScale,
        height: (selectedImageLayer as any).height * upscaleScale,
      });
    } catch (error) {
      console.error('放大失敗:', error);
      alert('放大失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedImageLayer, upscaleScale, updateLayer, setLoading]);

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
          addImageLayer(src, file.name);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [addImageLayer]);

  return (
    <div className="w-80 bg-gray-900 text-white flex flex-col h-full border-l border-gray-700 overflow-hidden">
      {/* 標題 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-accent" size={20} />
          <span className="font-semibold">AI 工具</span>
        </div>
      </div>

      {/* 內容 */}
      <div className="flex-1 overflow-y-auto">
        {/* 模型選擇 */}
        <div className="p-3 border-b border-gray-700">
          <label className="text-xs text-gray-400 mb-2 block">AI 模型</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          >
            {AI_MODELS.map((model) => (
              <option
                key={model.id}
                value={model.id}
                disabled={!model.available}
              >
                {model.name} {!model.available && '(即將推出)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {AI_MODELS.find((m) => m.id === selectedModel)?.description}
          </p>
        </div>

        {/* 上傳圖片 */}
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={handleUploadImage}
            className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 rounded-lg p-4 transition-colors"
          >
            <Upload size={20} />
            <span>上傳圖片</span>
          </button>
        </div>

        {/* 文生圖 */}
        <CollapsibleSection
          title="文生圖 (Text to Image)"
          icon={<Image size={16} className="text-blue-400" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                提示詞 (Prompt)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述您想要生成的圖片..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm h-24 resize-none focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                負面提示詞 (可選)
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="排除不想要的元素..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm h-16 resize-none focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">寬度</label>
                <select
                  value={outputWidth}
                  onChange={(e) => setOutputWidth(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                  <option value={1280}>1280px</option>
                  <option value={1536}>1536px</option>
                  <option value={2048}>2048px</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">高度</label>
                <select
                  value={outputHeight}
                  onChange={(e) => setOutputHeight(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                  <option value={1280}>1280px</option>
                  <option value={1536}>1536px</option>
                  <option value={2048}>2048px</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                生成數量: {numOutputs}
              </label>
              <input
                type="range"
                min={1}
                max={4}
                value={numOutputs}
                onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>生成圖片</span>
                </>
              )}
            </button>
          </div>
        </CollapsibleSection>

        {/* 一鍵去背 */}
        <CollapsibleSection
          title="一鍵去背"
          icon={<Eraser size={16} className="text-green-400" />}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              選擇圖片層後，點擊按鈕自動去除背景
            </p>
            {selectedImageLayer ? (
              <div className="text-xs text-gray-300 bg-gray-800 p-2 rounded">
                已選擇: {selectedImageLayer.name}
              </div>
            ) : (
              <div className="text-xs text-yellow-500 bg-yellow-900/20 p-2 rounded">
                請先在畫布上選擇一個圖片層
              </div>
            )}
            <button
              onClick={handleRemoveBackground}
              disabled={isLoading || !selectedImageLayer}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>處理中...</span>
                </>
              ) : (
                <>
                  <Eraser size={18} />
                  <span>去除背景</span>
                </>
              )}
            </button>
          </div>
        </CollapsibleSection>

        {/* 局部重繪 */}
        <CollapsibleSection
          title="局部重繪 (Inpainting)"
          icon={<Sparkles size={16} className="text-purple-400" />}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              1. 使用遮罩工具 (K) 塗抹要修改的區域
              <br />
              2. 輸入提示詞描述想要的內容
              <br />
              3. 點擊「開始重繪」
            </p>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                重繪提示詞
              </label>
              <textarea
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
                placeholder="描述修改後的內容..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm h-20 resize-none focus:outline-none focus:border-accent"
              />
            </div>

            <button
              disabled={isLoading || !inpaintPrompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>重繪中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>開始重繪</span>
                </>
              )}
            </button>
          </div>
        </CollapsibleSection>

        {/* 擴圖 */}
        <CollapsibleSection
          title="擴圖 (Outpainting)"
          icon={<Expand size={16} className="text-orange-400" />}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              向選定方向擴展畫布，AI 會自動補全邊緣內容
            </p>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                擴展方向
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'up', 'right', 'all', 'down'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setOutpaintDirection(dir)}
                    className={`p-2 rounded text-xs ${
                      outpaintDirection === dir
                        ? 'bg-accent text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${dir === 'all' ? 'col-span-1' : ''}`}
                  >
                    {dir === 'all'
                      ? '全部'
                      : dir === 'left'
                      ? '左'
                      : dir === 'right'
                      ? '右'
                      : dir === 'up'
                      ? '上'
                      : '下'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                擴展大小: {outpaintSize}px
              </label>
              <input
                type="range"
                min={64}
                max={512}
                step={64}
                value={outpaintSize}
                onChange={(e) => setOutpaintSize(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              disabled={isLoading || !selectedImageLayer}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>擴圖中...</span>
                </>
              ) : (
                <>
                  <Expand size={18} />
                  <span>開始擴圖</span>
                </>
              )}
            </button>
          </div>
        </CollapsibleSection>

        {/* 高清放大 */}
        <CollapsibleSection
          title="高清放大 (Upscale)"
          icon={<ZoomIn size={16} className="text-cyan-400" />}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              使用 AI 將圖片放大，同時保持清晰度
            </p>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                放大倍數
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([2, 4] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setUpscaleScale(scale)}
                    className={`p-2 rounded text-sm ${
                      upscaleScale === scale
                        ? 'bg-accent text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {scale}x 放大
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpscale}
              disabled={isLoading || !selectedImageLayer}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>放大中...</span>
                </>
              ) : (
                <>
                  <ZoomIn size={18} />
                  <span>放大圖片</span>
                </>
              )}
            </button>
          </div>
        </CollapsibleSection>

        {/* 影片生成 (Coming Soon) */}
        <CollapsibleSection
          title="影片生成 (即將推出)"
          icon={<Film size={16} className="text-pink-400" />}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              支援 Sora、Veo、Runway 等影片生成模型
            </p>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Film size={32} className="mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-500">功能開發中</p>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* 載入遮罩 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <Loader2 className="animate-spin text-accent" size={24} />
            <span className="text-sm">{useCanvasStore.getState().loadingMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
