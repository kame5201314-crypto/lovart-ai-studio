import { useState, useEffect } from 'react';
import { X, Loader2, Layers, Image, Type, Check, Palette } from 'lucide-react';

interface ElementLayer {
  id: string;
  name: string;
  type: 'background' | 'foreground' | 'text';
  imageData: string;
  visible: boolean;
  selected: boolean;
}

interface EditElementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  onApply: (layers: { name: string; type: string; imageData: string }[]) => void;
  isProcessing?: boolean;
}

// 預設的顏色選項
const BACKGROUND_COLORS = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#fef3c7', '#fde68a', '#fcd34d',
  '#dbeafe', '#bfdbfe', '#93c5fd',
  '#dcfce7', '#bbf7d0', '#86efac',
  '#fce7f3', '#fbcfe8', '#f9a8d4',
  '#f5f5f4', '#e7e5e4', '#d6d3d1',
];

export function EditElementsPanel({
  isOpen,
  onClose,
  imageData,
  onApply,
  isProcessing = false,
}: EditElementsPanelProps) {
  const [layers, setLayers] = useState<ElementLayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string | null>(null);

  // 當面板開啟時，開始處理圖片
  useEffect(() => {
    if (isOpen && imageData) {
      processImage();
    }
  }, [isOpen, imageData]);

  const processImage = async () => {
    setLoading(true);
    setError(null);
    setLayers([]);

    try {
      // 模擬 AI 處理 - 實際應該調用後端 API 來分離圖層
      // 這裡先用模擬數據展示 UI
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模擬生成的圖層
      const mockLayers: ElementLayer[] = [
        {
          id: 'bg',
          name: 'Background',
          type: 'background',
          imageData: imageData, // 實際應該是處理後的背景圖
          visible: true,
          selected: false,
        },
        {
          id: 'fg',
          name: 'Foreground',
          type: 'foreground',
          imageData: imageData, // 實際應該是去背後的前景圖
          visible: true,
          selected: false,
        },
        {
          id: 'text',
          name: 'Text',
          type: 'text',
          imageData: '', // 實際應該是提取的文字圖層
          visible: true,
          selected: false,
        },
      ];

      setLayers(mockLayers);
    } catch (err) {
      setError('圖片處理失敗，請重試');
      console.error('編輯元素處理錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const toggleLayerSelection = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, selected: !layer.selected } : layer
      )
    );
  };

  const handleApply = () => {
    const selectedLayers = layers
      .filter(layer => layer.visible && layer.imageData)
      .map(layer => ({
        name: layer.name,
        type: layer.type,
        imageData: layer.imageData,
      }));
    onApply(selectedLayers);
    onClose();
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'background':
        return <Image size={16} className="text-blue-500" />;
      case 'foreground':
        return <Layers size={16} className="text-green-500" />;
      case 'text':
        return <Type size={16} className="text-purple-500" />;
      default:
        return <Layers size={16} className="text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">編輯元素</h2>
              <p className="text-xs text-gray-500">AI 自動分離圖層</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-4">
          {loading || isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700">圖片生成中...</p>
              <p className="text-xs text-gray-500 mt-1">AI 正在分析並分離圖層元素</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                onClick={processImage}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                重新處理
              </button>
            </div>
          ) : (
            <>
              {/* 圖層列表 */}
              <div className="space-y-2 mb-4">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      layer.selected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* 可見性切換 */}
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        layer.visible
                          ? 'bg-white text-gray-700 shadow-sm'
                          : 'bg-transparent text-gray-300'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {layer.visible ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        )}
                      </svg>
                    </button>

                    {/* 圖層圖標和名稱 */}
                    <div className="flex items-center gap-2 flex-1">
                      {getLayerIcon(layer.type)}
                      <span className={`text-sm font-medium ${layer.visible ? 'text-gray-700' : 'text-gray-400'}`}>
                        {layer.name}
                      </span>
                    </div>

                    {/* 背景顏色選擇（僅 Background 圖層） */}
                    {layer.type === 'background' && (
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1.5 rounded-lg bg-white shadow-sm hover:shadow transition-shadow"
                        title="更換背景顏色"
                      >
                        <Palette size={16} className="text-gray-500" />
                      </button>
                    )}

                    {/* 選擇勾選 */}
                    <button
                      onClick={() => toggleLayerSelection(layer.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        layer.selected
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {layer.selected && <Check size={12} className="text-white" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* 背景顏色選擇器 */}
              {showColorPicker && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">選擇背景顏色</p>
                  <div className="grid grid-cols-6 gap-2">
                    {BACKGROUND_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedBackgroundColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          selectedBackgroundColor === color
                            ? 'border-blue-500 scale-110 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 預覽區 */}
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">預覽</p>
                <div className="relative aspect-video bg-white rounded-lg overflow-hidden shadow-inner">
                  {/* 背景層 */}
                  {layers.find(l => l.type === 'background')?.visible && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: selectedBackgroundColor || 'transparent',
                        backgroundImage: selectedBackgroundColor ? 'none' : `url(${imageData})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )}
                  {/* 前景層 */}
                  {layers.find(l => l.type === 'foreground')?.visible && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${imageData})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={loading || isProcessing || layers.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              loading || isProcessing || layers.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            應用圖層
          </button>
        </div>
      </div>
    </div>
  );
}
