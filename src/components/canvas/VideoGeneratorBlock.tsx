import { useState, useRef, useEffect } from 'react';
import { Video, ChevronDown, Check, Zap, Plus } from 'lucide-react';

// 影片模型列表
const videoModels = [
  { id: 'kling-2.1-master', name: 'Kling 2.1 Master', icon: '🎬' },
  { id: 'kling-2.0', name: 'Kling 2.0', icon: '🎬' },
  { id: 'runway-gen3', name: 'Runway Gen-3', icon: '🎥' },
  { id: 'pika-1.5', name: 'Pika 1.5', icon: '🎞️' },
  { id: 'luma-dream', name: 'Luma Dream Machine', icon: '✨' },
];

// 影片比例列表
const videoRatios = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
];

// 影片時長列表
const videoDurations = [
  { id: '5s', label: '5s', seconds: 5 },
  { id: '10s', label: '10s', seconds: 10 },
];

interface VideoGeneratorBlockProps {
  onGenerate?: (prompt: string, model: string, ratio: string, duration: number, startFrame?: string, endFrame?: string) => void;
  onClose?: () => void;
  isGenerating?: boolean;
}

export function VideoGeneratorBlock({ onGenerate, onClose, isGenerating = false }: VideoGeneratorBlockProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(videoModels[0]);
  const [selectedRatio, setSelectedRatio] = useState(videoRatios[0]);
  const [selectedDuration, setSelectedDuration] = useState(videoDurations[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [mode, setMode] = useState<'first-last' | 'multi-ref'>('first-last');

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const startFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate?.(
      prompt,
      selectedModel.id,
      selectedRatio.id,
      selectedDuration.seconds,
      startFrame || undefined,
      endFrame || undefined
    );
  };

  const handleStartFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStartFrame(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEndFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEndFrame(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 計算預覽區域的尺寸
  const previewMaxWidth = 400;
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
          <Video size={14} />
          <span>Video Generator</span>
        </div>
        <span className="text-xs text-gray-400">{selectedRatio.width} × {selectedRatio.height}</span>
      </div>

      {/* 預覽區域 */}
      <div
        className="bg-blue-100 rounded-lg flex items-center justify-center mb-4 border-2 border-blue-300 relative overflow-hidden"
        style={{ width: previewWidth, height: previewHeight }}
      >
        {/* 播放圖示 */}
        <div className="text-blue-300">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
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

        {/* 起始幀和結束幀 */}
        <div className="flex gap-2 mb-4">
          {/* 起始幀 */}
          <button
            onClick={() => startFrameInputRef.current?.click()}
            className="flex-1 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {startFrame ? (
              <img src={startFrame} alt="起始幀" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <Plus size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400">起始帧</span>
              </>
            )}
          </button>
          <input
            ref={startFrameInputRef}
            type="file"
            accept="image/*"
            onChange={handleStartFrameUpload}
            className="hidden"
          />

          {/* 結束幀 */}
          <button
            onClick={() => endFrameInputRef.current?.click()}
            className="flex-1 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {endFrame ? (
              <img src={endFrame} alt="結束幀" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <Plus size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400">结束帧</span>
              </>
            )}
          </button>
          <input
            ref={endFrameInputRef}
            type="file"
            accept="image/*"
            onChange={handleEndFrameUpload}
            className="hidden"
          />
        </div>

        {/* 底部工具列 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 模式切換 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode('first-last')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  mode === 'first-last' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                首尾帧
              </button>
              <button
                onClick={() => setMode('multi-ref')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  mode === 'multi-ref' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                多图参考
              </button>
            </div>

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
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50">
                  {videoModels.map((model) => (
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
          </div>

          <div className="flex items-center gap-2">
            {/* 比例和時長選擇 */}
            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-500"
              >
                <span>{selectedRatio.label}</span>
                <span>·</span>
                <span>{selectedDuration.label}</span>
                <ChevronDown size={14} />
              </button>

              {showSettingsDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-[200px] z-50">
                  {/* 比例選擇 */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Size</div>
                    <div className="flex gap-2">
                      {videoRatios.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setSelectedRatio(ratio)}
                          className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                            selectedRatio.id === ratio.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`border rounded-sm ${
                              selectedRatio.id === ratio.id ? 'border-blue-400' : 'border-gray-300'
                            }`}
                            style={{
                              width: ratio.width > ratio.height ? 24 : 24 * (ratio.width / ratio.height),
                              height: ratio.height > ratio.width ? 16 : 16 * (ratio.height / ratio.width),
                            }}
                          />
                          <span className="text-xs">{ratio.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 時長選擇 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Duration</div>
                    <div className="flex gap-2">
                      {videoDurations.map((duration) => (
                        <button
                          key={duration.id}
                          onClick={() => setSelectedDuration(duration)}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            selectedDuration.id === duration.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm">{duration.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
              <span>160</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
