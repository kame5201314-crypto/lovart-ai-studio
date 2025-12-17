import { useState, useRef, useEffect } from 'react';
import { Image, ChevronDown, Check, Zap, Upload, Layers } from 'lucide-react';

// 模型列表（使用 Gemini API）
const models = [
  { id: 'gemini-flash', name: 'Gemini 2.5 Flash', icon: '✨' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', icon: '🍌' },
];

// 解析度列表
const resolutions = [
  { id: '1K', label: '1K', multiplier: 1 },
  { id: '2K', label: '2K', multiplier: 2 },
  { id: '4K', label: '4K', multiplier: 4 },
];

// 比例列表
const aspectRatios = [
  { id: '21:9', label: '21:9', size: '1568×672', width: 1568, height: 672 },
  { id: '16:9', label: '16:9', size: '1456×816', width: 1456, height: 816 },
  { id: '4:3', label: '4:3', size: '1232×928', width: 1232, height: 928 },
  { id: '3:2', label: '3:2', size: '1344×896', width: 1344, height: 896 },
  { id: '1:1', label: '1:1', size: '1024×1024', width: 1024, height: 1024 },
  { id: '9:16', label: '9:16', size: '816×1456', width: 816, height: 1456 },
  { id: '3:4', label: '3:4', size: '928×1232', width: 928, height: 1232 },
  { id: '2:3', label: '2:3', size: '896×1344', width: 896, height: 1344 },
  { id: '5:4', label: '5:4', size: '1280×1024', width: 1280, height: 1024 },
  { id: '4:5', label: '4:5', size: '1024×1280', width: 1024, height: 1280 },
];

interface CanvasLayer {
  id: string;
  type: string;
  name: string;
  src?: string;
}

interface ImageGeneratorBlockProps {
  onGenerate?: (prompt: string, model: string, width: number, height: number, referenceImage?: string) => void;
  onClose?: () => void;
  isGenerating?: boolean;
  canvasLayers?: CanvasLayer[];
  onSelectFromCanvas?: (layerId: string) => string | null;
}

export function ImageGeneratorBlock({ onGenerate, isGenerating = false, canvasLayers = [], onSelectFromCanvas }: ImageGeneratorBlockProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[1]); // 預設 Nano Banana Pro
  const [showCanvasSelector, setShowCanvasSelector] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[4]); // 預設 1:1
  const [selectedResolution, setSelectedResolution] = useState(resolutions[0]); // 預設 1K
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const uploadDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(e.target as Node)) {
        setShowRatioDropdown(false);
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(e.target as Node)) {
        setShowResolutionDropdown(false);
      }
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(e.target as Node)) {
        setShowUploadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate?.(prompt, selectedModel.id, selectedRatio.width, selectedRatio.height, referenceImage || undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowUploadDropdown(false);
  };

  // 計算預覽區域的尺寸
  const previewMaxWidth = 300;
  const previewMaxHeight = 250;
  const ratio = selectedRatio.width / selectedRatio.height;
  let previewWidth = previewMaxWidth;
  let previewHeight = previewMaxWidth / ratio;
  if (previewHeight > previewMaxHeight) {
    previewHeight = previewMaxHeight;
    previewWidth = previewMaxHeight * ratio;
  }

  return (
    <div className="flex flex-col items-center">
      {/* 標題列 */}
      <div className="flex items-center justify-between w-full mb-2" style={{ maxWidth: previewWidth }}>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Image size={14} />
          <span>Image Generator</span>
        </div>
        <span className="text-xs text-gray-400">{selectedRatio.width} × {selectedRatio.height}</span>
      </div>

      {/* 預覽區域 */}
      <div
        className="bg-blue-100 rounded-lg flex items-center justify-center mb-4 border-2 border-blue-300 relative overflow-hidden"
        style={{ width: previewWidth, height: previewHeight }}
      >
        {referenceImage ? (
          <img src={referenceImage} alt="參考圖" className="w-full h-full object-cover" />
        ) : (
          <div className="text-blue-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4-4 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        )}
      </div>

      {/* 輸入區域 */}
      <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-md">
        {/* 提示詞輸入框 */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="今天我們要創作什麼"
          className="w-full resize-none border-none outline-none text-sm text-gray-700 placeholder-gray-400 mb-3"
          rows={2}
        />

        {/* 底部工具列 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 模型選擇 */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <span>{selectedModel.icon}</span>
                <span className="text-gray-700">{selectedModel.name}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px] z-50">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        <span className="text-sm text-gray-700">{model.name}</span>
                      </div>
                      {selectedModel.id === model.id && (
                        <Check size={14} className="text-gray-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 上傳按鈕 */}
            <div className="relative" ref={uploadDropdownRef}>
              <button
                onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <Upload size={18} />
              </button>

              {showUploadDropdown && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[140px] z-50">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Upload size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">從本地上傳</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCanvasSelector(true);
                      setShowUploadDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Layers size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">從畫布選擇</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 解析度選擇 */}
            <div className="relative" ref={resolutionDropdownRef}>
              <button
                onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-500"
              >
                <span>{selectedResolution.label}</span>
                <ChevronDown size={14} />
              </button>

              {showResolutionDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[100px] z-50">
                  <div className="px-3 py-1.5 text-xs text-gray-500 font-medium">分辨率</div>
                  {resolutions.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        setSelectedResolution(res);
                        setShowResolutionDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-900">{res.label}</span>
                      {selectedResolution.id === res.id && (
                        <Check size={14} className="text-gray-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 比例選擇 */}
            <div className="relative" ref={ratioDropdownRef}>
              <button
                onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-500"
              >
                <span>{selectedRatio.label}</span>
                <ChevronDown size={14} />
              </button>

              {showRatioDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px] z-50">
                  <div className="px-3 py-1.5 text-xs text-gray-500 font-medium">格式</div>
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => {
                        setSelectedRatio(ratio);
                        setShowRatioDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* 比例圖示 */}
                        <div
                          className="border border-gray-300 rounded-sm"
                          style={{
                            width: ratio.width > ratio.height ? 16 : 16 * (ratio.width / ratio.height),
                            height: ratio.height > ratio.width ? 16 : 16 * (ratio.height / ratio.width),
                          }}
                        />
                        <span className="text-sm text-gray-900">{ratio.label}</span>
                        <span className="text-xs text-gray-400">{ratio.size}</span>
                      </div>
                      {selectedRatio.id === ratio.id && (
                        <Check size={14} className="text-gray-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 生成按鈕 */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Zap size={14} />
              <span>22</span>
            </button>
          </div>
        </div>
      </div>

      {/* 畫布圖層選擇器 */}
      {showCanvasSelector && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">從畫布選擇圖片</h3>
            <button
              onClick={() => setShowCanvasSelector(false)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              ✕
            </button>
          </div>

          {canvasLayers.filter(l => l.type === 'image' && l.src).length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {canvasLayers
                .filter(l => l.type === 'image' && l.src)
                .map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      if (layer.src) {
                        setReferenceImage(layer.src);
                        setShowCanvasSelector(false);
                      }
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors group"
                  >
                    <img
                      src={layer.src}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <span className="text-xs text-white truncate block">{layer.name}</span>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Layers size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">畫布中沒有圖片圖層</p>
              <p className="text-xs mt-1">請先上傳或生成圖片</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
