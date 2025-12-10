import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
  Plus,
  Square,
  Type,
  Link2,
  Layers,
  ChevronDown,
  ZoomIn,
  Scissors,
  ImageIcon,
  Sparkles,
  RotateCcw,
  RotateCw,
  Loader2,
} from 'lucide-react';

interface MockupVideoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  videoDuration?: number;
  onExport?: (videoUrl: string) => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: string;
    color?: string;
    backgroundColor?: string;
  };
}

// 頂部工具選項
const TOP_TOOLS = [
  { id: 'video', label: 'Video', icon: <ImageIcon size={14} /> },
  { id: 'upscale', label: 'Upscale', icon: <ZoomIn size={14} /> },
  { id: 'remove-bg', label: 'Remove bg', icon: <Scissors size={14} /> },
  { id: 'mockup', label: 'Mockup', icon: <Sparkles size={14} />, active: true },
];

export const MockupVideoEditor: React.FC<MockupVideoEditorProps> = ({
  isOpen,
  onClose,
  videoSrc,
  videoDuration = 16,
  onExport,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);
  const [opacity, setOpacity] = useState(100);

  // 畫布元素
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: 'text-1',
      type: 'text',
      x: 550,
      y: 280,
      width: 200,
      height: 50,
      content: 'Lovart',
      style: {
        fontSize: 48,
        fontFamily: 'cursive',
        fontStyle: 'italic',
        color: '#000000',
      },
    },
  ]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 處理影片時間更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 播放/暫停
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // 靜音切換
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // 進度條點擊
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 添加元素
  const addElement = useCallback((type: 'text' | 'shape' | 'image') => {
    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 400,
      y: 300,
      width: type === 'text' ? 150 : 100,
      height: type === 'text' ? 40 : 100,
      content: type === 'text' ? '新文字' : undefined,
      style: type === 'text' ? {
        fontSize: 32,
        fontFamily: 'sans-serif',
        color: '#000000',
      } : {
        backgroundColor: '#3b82f6',
      },
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setActiveTool(null);
  }, []);

  // 導出影片
  const handleExport = useCallback(async () => {
    setIsGenerating(true);
    // 模擬導出過程
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    onExport?.(videoSrc || '');
    alert('影片導出成功！');
  }, [videoSrc, onExport]);

  // 全螢幕切換
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  if (!isOpen) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-gray-100 z-[100] flex flex-col">
      {/* 頂部標題列 */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        {/* 左側：Logo 和標題 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-sm font-medium text-gray-700">MockUp</span>
        </div>

        {/* 中間：工具選項 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TOP_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                tool.active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500">
            <span>•••</span>
          </button>

          {/* Opacity 下拉選單 */}
          <div className="relative">
            <button
              onClick={() => setShowOpacityMenu(!showOpacityMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>Opacity</span>
              <ChevronDown size={14} />
            </button>
            {showOpacityMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[150px] z-50">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-gray-500 text-center mt-1">{opacity}%</div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：導出和關閉 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側工具列 */}
        <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setActiveTool(activeTool === 'add' ? null : 'add')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="新增"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => addElement('shape')}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
            title="形狀"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => addElement('text')}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
            title="文字"
          >
            <Type size={18} />
          </button>
          <button
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
            title="連結"
          >
            <Link2 size={18} />
          </button>
          <button
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
            title="關鍵影格"
          >
            <Layers size={18} />
          </button>
        </div>

        {/* 畫布區域 */}
        <div
          ref={canvasRef}
          className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-auto"
        >
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ width: 500, height: 600, opacity: opacity / 100 }}
          >
            {/* 影片或圖片預覽 */}
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center">
                {/* 模擬的咖啡杯 Mockup */}
                <div className="relative">
                  <div className="w-32 h-40 bg-gray-100 rounded-t-lg rounded-b-2xl shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-20 bg-white rounded shadow-inner flex items-center justify-center">
                        <span className="text-xs text-gray-400">杯身</span>
                      </div>
                    </div>
                  </div>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                      <div className="bg-black/60 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 浮動元素 */}
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move ${
                  selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                }}
                onClick={() => setSelectedElementId(element.id)}
              >
                {element.type === 'text' && (
                  <span
                    style={{
                      fontSize: element.style?.fontSize,
                      fontFamily: element.style?.fontFamily,
                      fontStyle: element.style?.fontStyle,
                      color: element.style?.color,
                    }}
                  >
                    {element.content}
                  </span>
                )}
                {element.type === 'shape' && (
                  <div
                    className="w-full h-full rounded"
                    style={{ backgroundColor: element.style?.backgroundColor }}
                  />
                )}
              </div>
            ))}

            {/* Chat 按鈕 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button className="px-3 py-1 bg-white rounded shadow text-xs text-gray-600 flex items-center gap-1">
                Chat
                <span className="text-gray-400 text-[10px]">Tab</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部時間軸和控制 */}
      <div className="h-32 bg-gray-900 flex flex-col">
        {/* 時間顯示 */}
        <div className="flex items-center justify-between px-4 py-2 text-white text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 進度條 */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="mx-4 h-2 bg-gray-700 rounded-full cursor-pointer relative group"
        >
          {/* 進度 */}
          <div
            className="absolute h-full bg-cyan-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* 拖曳手柄 */}
          <div
            className="absolute w-4 h-4 bg-white rounded-full -translate-y-1/4 shadow-lg"
            style={{ left: `calc(${progress}% - 8px)`, top: '-25%' }}
          />
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* 播放/暫停 */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* 音量 */}
            <button
              onClick={toggleMute}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* 縮放和其他控制 */}
            <div className="flex items-center gap-2 text-gray-400 text-xs ml-4">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center text-[10px]">◉</span>
                75
              </span>
              <span>+</span>
              <span>41%</span>
              <span>—</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 上一幀/下一幀 */}
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <RotateCcw size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <RotateCw size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 下載 */}
            <button
              onClick={handleExport}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Download size={20} />
            </button>

            {/* 全螢幕 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupVideoEditor;
