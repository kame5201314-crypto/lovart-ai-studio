import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer2,
  Plus,
  Square,
  Type,
  Pencil,
  PenTool,
  Image,
  Video,
  Sparkles,
  SlidersHorizontal,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  MessageSquare,
  Hexagon,
} from 'lucide-react';

type ToolType = 'select' | 'hand' | 'mark' | 'add' | 'shape' | 'text' | 'pencil' | 'pen';

interface LovartToolbarProps {
  onToolChange?: (tool: string) => void;
  onUploadImage?: () => void;
  onUploadVideo?: () => void;
  onOpenImageGenerator?: () => void;
  onOpenVideoGenerator?: () => void;
  onOpenSmartPanel?: () => void;
}

export const LovartToolbar: React.FC<LovartToolbarProps> = ({
  onToolChange,
  onUploadImage,
  onUploadVideo,
  onOpenImageGenerator,
  onOpenVideoGenerator,
  onOpenSmartPanel,
}) => {
  // 在組件載入時打印 props
  console.log('LovartToolbar 渲染, onUploadImage:', typeof onUploadImage, onUploadImage ? '已定義' : '未定義');

  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [openMenu, setOpenMenu] = useState<ToolType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolClick = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    onToolChange?.(tool);
    setOpenMenu(null);
  }, [onToolChange]);

  const toggleMenu = useCallback((tool: ToolType) => {
    setOpenMenu(prev => prev === tool ? null : tool);
  }, []);

  // 處理選擇工具子選單點擊
  const handleSelectSubItemClick = useCallback((itemId: string) => {
    console.log('選擇工具:', itemId);
    setOpenMenu(null);
    setActiveTool(itemId as ToolType);
    onToolChange?.(itemId);
  }, [onToolChange]);

  // 處理新增子選單點擊
  const handleAddSubItemClick = useCallback((itemId: string) => {
    console.log('新增子選單點擊:', itemId);
    setOpenMenu(null);

    // 使用 requestAnimationFrame 確保選單關閉後再執行
    requestAnimationFrame(() => {
      switch (itemId) {
        case 'upload-image':
          console.log('觸發上傳圖片, onUploadImage:', typeof onUploadImage);
          if (onUploadImage) {
            onUploadImage();
          } else {
            console.error('onUploadImage 未定義');
          }
          break;
        case 'upload-video':
          onUploadVideo?.();
          break;
        case 'image-generator':
          onOpenImageGenerator?.();
          break;
        case 'video-generator':
          onOpenVideoGenerator?.();
          break;
        case 'smart-panel':
          onOpenSmartPanel?.();
          break;
      }
    });
  }, [onUploadImage, onUploadVideo, onOpenImageGenerator, onOpenVideoGenerator, onOpenSmartPanel]);

  // 處理形狀子選單點擊
  const handleShapeSubItemClick = useCallback((itemId: string) => {
    console.log('形狀工具:', itemId);
    setOpenMenu(null);
    onToolChange?.(itemId);
  }, [onToolChange]);

  // 處理畫筆子選單點擊
  const handlePencilSubItemClick = useCallback((itemId: string) => {
    console.log('畫筆工具:', itemId);
    setOpenMenu(null);
    setActiveTool(itemId as ToolType);
    onToolChange?.(itemId);
  }, [onToolChange]);

  const tools = [
    { id: 'select', icon: <MousePointer2 size={20} />, hasSubMenu: true, label: '選擇' },
    { id: 'add', icon: <Plus size={20} />, hasSubMenu: true, label: '新增' },
    { id: 'shape', icon: <Square size={20} />, hasSubMenu: true, label: '形狀' },
    { id: 'text', icon: <Type size={20} />, hasSubMenu: false, label: '文字' },
    { id: 'pencil', icon: <Pencil size={20} />, hasSubMenu: true, label: '畫筆' },
  ];

  return (
    <div ref={menuRef} className="flex flex-col items-center py-3 px-2 bg-white border-r border-gray-200 shadow-sm">
      {tools.map((tool) => (
        <div key={tool.id} className="relative group">
          <button
            onClick={() => {
              console.log('工具列按鈕點擊:', tool.id);
              // 對於選擇工具，直接選中並同時顯示選單
              if (tool.id === 'select') {
                handleToolClick('select');
                toggleMenu(tool.id as ToolType);
              } else if (tool.hasSubMenu) {
                toggleMenu(tool.id as ToolType);
              } else {
                handleToolClick(tool.id as ToolType);
              }
            }}
            title={tool.label}
            className={`w-10 h-10 flex items-center justify-center rounded-lg mb-1 transition-all ${
              activeTool === tool.id || openMenu === tool.id
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tool.icon}
            {tool.hasSubMenu && (
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gray-400 rounded-full" />
            )}
          </button>

          {/* 選擇工具子選單 */}
          {openMenu === 'select' && tool.id === 'select' && (
            <div className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
              <button
                onClick={() => handleSelectSubItemClick('select')}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm ${
                  activeTool === 'select' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MousePointer2 size={16} />
                  <span>選擇</span>
                </div>
                <span className="text-xs text-gray-400">V</span>
              </button>
              <button
                onClick={() => handleSelectSubItemClick('hand')}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm ${
                  activeTool === 'hand' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">✋</span>
                  <span>手形工具</span>
                </div>
                <span className="text-xs text-gray-400">H</span>
              </button>
              <button
                onClick={() => handleSelectSubItemClick('mark')}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm ${
                  activeTool === 'mark' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⊙</span>
                  <span>標記</span>
                </div>
                <span className="text-xs text-gray-400">M</span>
              </button>
            </div>
          )}

          {/* 新增子選單 */}
          {openMenu === 'add' && tool.id === 'add' && (
            <div className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
              <div className="px-3 py-1 text-xs text-gray-500 font-medium">新增</div>
              <button
                onClick={() => handleAddSubItemClick('upload-image')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Image size={16} />
                  <span>上傳圖片</span>
                </div>
              </button>
              <button
                onClick={() => handleAddSubItemClick('upload-video')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Video size={16} />
                  <span>上傳影片</span>
                </div>
              </button>
              <button
                onClick={() => handleAddSubItemClick('image-generator')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>圖像生成器</span>
                </div>
                <span className="text-xs text-gray-400">A</span>
              </button>
              <button
                onClick={() => handleAddSubItemClick('video-generator')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <Video size={16} />
                  <span>影片生成器</span>
                </div>
              </button>
              <button
                onClick={() => handleAddSubItemClick('smart-panel')}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  <span>智慧畫板</span>
                </div>
                <span className="text-xs text-gray-400">F</span>
              </button>
            </div>
          )}

          {/* 形狀子選單 */}
          {openMenu === 'shape' && tool.id === 'shape' && (
            <div className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
              <div className="px-3 py-1 text-xs text-gray-500 font-medium">形狀</div>
              <div className="px-3 py-2 grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleShapeSubItemClick('rectangle')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Square size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('circle')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Circle size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('triangle')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Triangle size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('star')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Star size={16} />
                </button>
              </div>
              <div className="px-3 py-1 text-xs text-gray-500 font-medium">形狀文字</div>
              <div className="px-3 py-2 grid grid-cols-5 gap-2">
                <button
                  onClick={() => handleShapeSubItemClick('rect-text')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Square size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('circle-text')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Circle size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('speech')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('arrow')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => handleShapeSubItemClick('hexagon')}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                >
                  <Hexagon size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 畫筆子選單 */}
          {openMenu === 'pencil' && tool.id === 'pencil' && (
            <div className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
              <button
                onClick={() => handlePencilSubItemClick('pencil')}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm ${
                  activeTool === 'pencil' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Pencil size={16} />
                  <span>鉛筆</span>
                </div>
                <span className="text-xs text-gray-400">Shift + P</span>
              </button>
              <button
                onClick={() => handlePencilSubItemClick('pen')}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm ${
                  activeTool === 'pen' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PenTool size={16} />
                  <span>鋼筆</span>
                </div>
                <span className="text-xs text-gray-400">P</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LovartToolbar;
