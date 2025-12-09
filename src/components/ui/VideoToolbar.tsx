import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Repeat,
  Scissors,
  FastForward,
  Download,
  MoreHorizontal,
  ChevronDown,
  Trash2,
} from 'lucide-react';

interface VideoToolbarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onLoopToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onTrim?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoToolbar({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLooping,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onLoopToggle,
  onPlaybackRateChange,
  onTrim,
  onExport,
  onDelete,
}: VideoToolbarProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false);
      }
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 進度條點擊處理
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(duration, percent * duration)));
  };

  // 計算進度百分比
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100 min-w-[400px]">
      {/* 進度條 */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
      >
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 8px)`, top: '-25%' }}
        />
      </div>

      {/* 時間顯示 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* 控制按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* 後退 5 秒 */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            title="後退 5 秒"
          >
            <SkipBack size={18} />
          </button>

          {/* 播放/暫停 */}
          <button
            onClick={onPlayPause}
            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          {/* 前進 5 秒 */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            title="前進 5 秒"
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* 音量控制 */}
          <div ref={volumeRef} className="relative">
            <button
              onClick={onMuteToggle}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {showVolumeSlider && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 p-3"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2 accent-blue-500"
                  style={{ writingMode: 'horizontal-tb' }}
                />
              </div>
            )}
          </div>

          {/* 循環播放 */}
          <button
            onClick={onLoopToggle}
            className={`p-2 rounded-full transition-colors ${
              isLooping ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="循環播放"
          >
            <Repeat size={18} />
          </button>

          {/* 播放速度 */}
          <div ref={speedRef} className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FastForward size={16} />
              <span>{playbackRate}x</span>
              <ChevronDown size={14} />
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[80px] z-50">
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onPlaybackRateChange(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      playbackRate === rate ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 剪輯 */}
          <button
            onClick={onTrim}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            title="剪輯影片"
          >
            <Scissors size={18} />
          </button>

          {/* 匯出 */}
          <button
            onClick={onExport}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            title="匯出影片"
          >
            <Download size={18} />
          </button>

          {/* 更多選項 */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px] z-50">
                <button
                  onClick={() => {
                    onDelete?.();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  刪除影片
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
