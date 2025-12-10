import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Circle, RegularPolygon, Star, Arrow, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../../store/canvasStore';
import { ImageLayerComponent } from './ImageLayerComponent';
import { TextLayerComponent } from './TextLayerComponent';
import { MaskLayerComponent } from './MaskLayerComponent';
import { DrawingLayerComponent } from './DrawingLayerComponent';
import { ShapeLayerComponent } from './ShapeLayerComponent';
import { MarkerLayerComponent } from './MarkerLayerComponent';
import { PenLayerComponent } from './PenLayerComponent';
import { ImageToolbar, ImageAIToolsPanel, AIToolsTrigger } from '../ui';
import type { Layer as LayerType, DrawingLine, ShapeType, ShapeLayer, MarkerLayer, PenLayer, PenPath, PenPoint, ImageLayer, TextLayer } from '../../types';
import {
  aiSuperResolution,
  aiRemoveBackground,
  aiOutpaint,
  aiEditImage,
  aiTextReplace,
  inpaint,
  aiIdentifyObject,
} from '../../services/aiService';

// 框選狀態介面
interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

// 標記編輯彈窗組件
const MarkerEditPopup: React.FC<{
  marker: MarkerLayer;
  position: { x: number; y: number };
  onSave: (name: string) => void;
  onClose: () => void;
  onAIAction: (prompt: string) => void;
  isProcessing?: boolean;
}> = ({ marker, position, onSave, onClose, onAIAction, isProcessing = false }) => {
  const [editName, setEditName] = React.useState(marker.objectName || '');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'name' | 'ai'>('ai');

  return (
    <div
      className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      style={{
        left: position.x + 40,
        top: position.y - 20,
        minWidth: '260px',
        maxWidth: '320px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 標記資訊頭部 */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: marker.color }}
        >
          {marker.number}
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-800">
            {marker.isIdentifying ? '識別中...' : (marker.objectName || '標記 ' + marker.number)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 標籤切換 */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✨ AI 協作
        </button>
        <button
          onClick={() => setActiveTab('name')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'name'
              ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✏️ 自定義名稱
        </button>
      </div>

      <div className="p-3">
        {activeTab === 'ai' ? (
          <>
            {/* AI 指令輸入 */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">對這個位置下達指令</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`例如：\n• 在這裡加上文字 "123"\n• 移除這個物件\n• 將這裡改成紅色\n• 在這個位置加上箭頭`}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    if (aiPrompt.trim()) {
                      onAIAction(aiPrompt);
                    }
                  }
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
                autoFocus
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-400 mt-1">按 Ctrl+Enter 快速執行</p>
            </div>

            {/* AI 快捷操作 */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">快捷操作</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setAiPrompt('在這個位置加上文字')}
                  className="px-2 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                  disabled={isProcessing}
                >
                  📝 加文字
                </button>
                <button
                  onClick={() => setAiPrompt('移除這個物件')}
                  className="px-2 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                  disabled={isProcessing}
                >
                  🗑️ 移除物件
                </button>
                <button
                  onClick={() => setAiPrompt('用周圍背景填補這個區域')}
                  className="px-2 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                  disabled={isProcessing}
                >
                  🩹 修復區域
                </button>
                <button
                  onClick={() => setAiPrompt('在這裡加上標註箭頭')}
                  className="px-2 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
                  disabled={isProcessing}
                >
                  ➡️ 加箭頭
                </button>
              </div>
            </div>

            {/* 執行按鈕 */}
            <button
              onClick={() => {
                if (aiPrompt.trim()) {
                  onAIAction(aiPrompt);
                }
              }}
              disabled={!aiPrompt.trim() || isProcessing}
              className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  ✨ 執行 AI 協作
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* 自定義名稱輸入 */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1.5">物件名稱</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="輸入物件名稱"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave(editName);
                  }
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
                autoFocus
              />
            </div>

            {/* 確定按鈕 */}
            <button
              onClick={() => onSave(editName)}
              className="w-full py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              確定
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface SmartCanvasProps {
  className?: string;
}

export const SmartCanvas: React.FC<SmartCanvasProps> = ({ className }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  // 框選狀態
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    x: 0, y: 0, width: 0, height: 0, visible: false
  });
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });

  const {
    layers,
    selectedLayerId,
    canvasState,
    currentTool,
    brushSize,
    brushColor,
    selectLayer,
    updateLayer,
    addLineToDrawing,
    addShapeLayer,
    addMarkerLayer,
    updateMarkerObjectName,
    setMarkerIdentifying,
    addPenLayer,
    addPathToPen,
    updatePenPath,
    setZoom,
    setPan,
    saveToHistory,
    undo,
    redo,
    copyLayer,
    cutLayer,
    pasteLayer,
    deleteSelectedLayer,
    duplicateLayer,
    selectAllLayers,
    addImageLayer,
    setLoading,
    history,
    historyIndex,
    toggleLayerVisibility,
    toggleLayerLock,
    removeLayer,
    reorderLayers,
    restoreHistoryState,
  } = useCanvasStore();

  // 形狀繪製狀態
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });
  const [currentShapeType, setCurrentShapeType] = useState<ShapeType | null>(null);
  const [tempShape, setTempShape] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // 鋼筆工具狀態
  const [penPoints, setPenPoints] = useState<PenPoint[]>([]);
  const [activePenLayerId, setActivePenLayerId] = useState<string | null>(null);
  const [isDrawingPen, setIsDrawingPen] = useState(false);

  // AI 工具面板狀態
  const [showAIToolsPanel, setShowAIToolsPanel] = useState(false);

  // 標記編輯彈窗狀態
  const [showMarkerPopup, setShowMarkerPopup] = useState(false);
  const [markerPopupPosition, setMarkerPopupPosition] = useState({ x: 0, y: 0 });
  const [isMarkerAIProcessing, setIsMarkerAIProcessing] = useState(false);

  // 底部面板狀態
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<'layers' | 'history'>('layers');

  // 當選中圖層變化時，關閉 AI 工具面板
  useEffect(() => {
    setShowAIToolsPanel(false);
  }, [selectedLayerId]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });

        // 滿版模式 - 不縮放，不偏移
        if (!initialized && rect.width > 0 && rect.height > 0) {
          setZoom(1);
          setPan(0, 0);
          setInitialized(true);
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initialized, setZoom, setPan]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const attachTransformer = () => {
      if (selectedLayerId && currentTool === 'select') {
        const selectedNode = stage.findOne(`#${selectedLayerId}`);
        if (selectedNode) {
          transformer.nodes([selectedNode]);
          transformer.getLayer()?.batchDraw();
          return true;
        }
        return false;
      } else {
        transformer.nodes([]);
        return true;
      }
    };

    // 嘗試附加 transformer，如果找不到節點，延遲重試
    if (!attachTransformer()) {
      const timer = setTimeout(() => {
        attachTransformer();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedLayerId, currentTool, layers]);

  // 鍵盤快捷鍵處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在輸入文字（例如在 input 或 textarea 中），不處理快捷鍵
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+C: 複製
      if (isCtrlOrCmd && e.key === 'c') {
        e.preventDefault();
        copyLayer();
        return;
      }

      // Ctrl+V: 貼上
      if (isCtrlOrCmd && e.key === 'v') {
        e.preventDefault();
        pasteLayer();
        return;
      }

      // Ctrl+X: 剪下
      if (isCtrlOrCmd && e.key === 'x') {
        e.preventDefault();
        cutLayer();
        return;
      }

      // Ctrl+D: 複製圖層
      if (isCtrlOrCmd && e.key === 'd') {
        e.preventDefault();
        if (selectedLayerId) {
          duplicateLayer(selectedLayerId);
        }
        return;
      }

      // Ctrl+Z: 復原
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y 或 Ctrl+Shift+Z: 重做
      if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+A: 全選
      if (isCtrlOrCmd && e.key === 'a') {
        e.preventDefault();
        selectAllLayers();
        return;
      }

      // Delete 或 Backspace: 刪除選中的圖層
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedLayer();
        return;
      }

      // Escape: 取消選擇 / 取消鋼筆繪製
      if (e.key === 'Escape') {
        e.preventDefault();
        if (currentTool === 'pen' && penPoints.length > 0) {
          // 取消鋼筆繪製
          setPenPoints([]);
          setIsDrawingPen(false);
          return;
        }
        selectLayer(null);
        return;
      }

      // Enter: 完成鋼筆路徑
      if (e.key === 'Enter' && currentTool === 'pen' && penPoints.length >= 2) {
        e.preventDefault();
        // 將當前路徑保存到圖層
        if (activePenLayerId) {
          const newPath: PenPath = {
            points: penPoints,
            stroke: brushColor,
            strokeWidth: 2,
            closed: false,
          };
          addPathToPen(activePenLayerId, newPath);
          saveToHistory('完成鋼筆路徑');
        }
        // 清空當前繪製狀態，準備繪製新路徑
        setPenPoints([]);
        setIsDrawingPen(false);
        return;
      }

      // 方向鍵: 微調選中圖層的位置
      if (selectedLayerId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer && !selectedLayer.locked) {
          const step = e.shiftKey ? 10 : 1; // Shift 按住時移動 10px
          let newX = selectedLayer.x;
          let newY = selectedLayer.y;

          switch (e.key) {
            case 'ArrowUp':
              newY -= step;
              break;
            case 'ArrowDown':
              newY += step;
              break;
            case 'ArrowLeft':
              newX -= step;
              break;
            case 'ArrowRight':
              newX += step;
              break;
          }

          updateLayer(selectedLayerId, { x: newX, y: newY });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, copyLayer, cutLayer, pasteLayer, deleteSelectedLayer, duplicateLayer, selectAllLayers, undo, redo, selectLayer, updateLayer, currentTool, penPoints, activePenLayerId, brushColor, addPathToPen, saveToHistory]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        selectLayer(null);
        setShowMarkerPopup(false);
      }
    },
    [selectLayer]
  );

  const handleLayerClick = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true; // 防止事件冒泡到 Stage
      console.log('handleLayerClick 被呼叫, layerId:', layerId, 'currentTool:', currentTool);
      // 在 select 或預設狀態下都可以選取
      if (currentTool === 'select' || currentTool === 'text') {
        selectLayer(layerId);

        // 如果點擊的是標記，顯示編輯彈窗
        const clickedLayer = layers.find(l => l.id === layerId);
        if (clickedLayer && clickedLayer.type === 'marker') {
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          if (pos) {
            setMarkerPopupPosition({ x: pos.x, y: pos.y });
            setShowMarkerPopup(true);
          }
        } else {
          setShowMarkerPopup(false);
        }
      }
    },
    [currentTool, selectLayer, layers]
  );

  const handleDragEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      updateLayer(layerId, { x: node.x(), y: node.y() });
      saveToHistory('移動圖層');
    },
    [updateLayer, saveToHistory]
  );

  const handleTransformEnd = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      updateLayer(layerId, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
      saveToHistory('調整圖層');
    },
    [updateLayer, saveToHistory]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 平移模式
      if (currentTool === 'move') {
        setIsPanning(true);
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) setLastPanPos(pos);
        return;
      }

      // 選擇工具 - 在空白區域開始框選
      if (currentTool === 'select') {
        const stage = e.target.getStage();
        // 檢查點擊目標的類型
        const targetClassName = e.target.getClassName?.() || '';
        const clickedOnLayer = targetClassName === 'Image' || targetClassName === 'Text';

        console.log('滑鼠按下 - 目標類型:', targetClassName, '是否點擊圖層:', clickedOnLayer);

        // 如果點擊的不是圖層，就開始框選
        if (!clickedOnLayer && stage) {
          const pos = stage.getPointerPosition();
          if (pos) {
            console.log('開始框選，起始位置:', pos);
            setIsSelecting(true);
            setSelectionStart({ x: pos.x, y: pos.y });
            setSelectionBox({
              x: pos.x,
              y: pos.y,
              width: 0,
              height: 0,
              visible: true,
            });
          }
        }
        return;
      }

      // 標記工具 - 點擊即放置標記並進行 AI 識別
      if (currentTool === 'marker') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          const markerId = addMarkerLayer(pos.x, pos.y);
          saveToHistory('新增標記');

          // 找到最近的圖片圖層進行 AI 物件識別
          const imageLayers = layers.filter(l => l.type === 'image' && l.visible) as ImageLayer[];
          if (imageLayers.length > 0) {
            // 找到包含標記點的圖片
            const targetImage = imageLayers.find(img => {
              return pos.x >= img.x && pos.x <= img.x + img.width &&
                     pos.y >= img.y && pos.y <= img.y + img.height;
            });

            if (targetImage) {
              // 設置識別中狀態
              setMarkerIdentifying(markerId, true);

              // 計算標記相對於圖片的位置
              const relX = pos.x - targetImage.x;
              const relY = pos.y - targetImage.y;

              // 調用 AI 識別
              aiIdentifyObject({
                image: targetImage.src,
                x: relX,
                y: relY,
                imageWidth: targetImage.width,
                imageHeight: targetImage.height,
              }).then(objectName => {
                updateMarkerObjectName(markerId, objectName);
              }).catch(error => {
                console.error('AI 識別失敗:', error);
                updateMarkerObjectName(markerId, '未知物件');
              });
            }
          }
        }
        return;
      }

      // 形狀繪製模式
      const shapeTools = ['rectangle', 'circle', 'triangle', 'star', 'arrow', 'hexagon'];
      if (shapeTools.includes(currentTool)) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          setIsDrawingShape(true);
          setCurrentShapeType(currentTool as ShapeType);
          setShapeStart({ x: pos.x, y: pos.y });
          setTempShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
        }
        return;
      }

      // 鉛筆工具 - 粗線自由繪製
      if (currentTool === 'pencil') {
        setIsDrawing(true);
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos && stage) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pos);
          setCurrentLine([canvasPos.x, canvasPos.y]);
        }
        return;
      }

      // 鋼筆工具 - 點擊添加控制點
      if (currentTool === 'pen') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos && stage) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pos);

          // 添加新的控制點
          const newPoint: PenPoint = {
            x: canvasPos.x,
            y: canvasPos.y,
          };

          setPenPoints((prev) => [...prev, newPoint]);
          setIsDrawingPen(true);

          // 如果沒有活動的鋼筆圖層，創建一個
          if (!activePenLayerId) {
            const newLayerId = addPenLayer();
            setActivePenLayerId(newLayerId);
          }
        }
        return;
      }

      // 繪圖模式（原有的 brush 工具）
      if (currentTool !== 'brush' && currentTool !== 'mask') return;
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (pos && stage) {
        // 將螢幕座標轉換為畫布座標
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(pos);
        setCurrentLine([canvasPos.x, canvasPos.y]);
      }
    },
    [currentTool, activePenLayerId, addPenLayer]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 平移模式
      if (isPanning && currentTool === 'move') {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          const dx = pos.x - lastPanPos.x;
          const dy = pos.y - lastPanPos.y;
          setPan(canvasState.panX + dx, canvasState.panY + dy);
          setLastPanPos(pos);
        }
        return;
      }

      // 框選模式
      if (isSelecting && currentTool === 'select') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          const x = Math.min(selectionStart.x, pos.x);
          const y = Math.min(selectionStart.y, pos.y);
          const width = Math.abs(pos.x - selectionStart.x);
          const height = Math.abs(pos.y - selectionStart.y);
          setSelectionBox({ x, y, width, height, visible: true });
        }
        return;
      }

      // 形狀繪製模式
      if (isDrawingShape) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          const x = Math.min(shapeStart.x, pos.x);
          const y = Math.min(shapeStart.y, pos.y);
          const width = Math.abs(pos.x - shapeStart.x);
          const height = Math.abs(pos.y - shapeStart.y);
          setTempShape({ x, y, width, height });
        }
        return;
      }

      // 鉛筆工具繪圖模式
      if (isDrawing && currentTool === 'pencil') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos && stage) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pos);
          setCurrentLine((prev) => [...prev, canvasPos.x, canvasPos.y]);
        }
        return;
      }

      // 繪圖模式（brush/mask）
      if (!isDrawing) return;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (pos && stage) {
        // 將螢幕座標轉換為畫布座標
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(pos);
        setCurrentLine((prev) => [...prev, canvasPos.x, canvasPos.y]);
      }
    },
    [isDrawing, isPanning, isSelecting, isDrawingShape, currentTool, lastPanPos, selectionStart, shapeStart, canvasState.panX, canvasState.panY, setPan]
  );

  const handleMouseUp = useCallback(() => {
    // 停止平移
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // 停止框選
    if (isSelecting) {
      setIsSelecting(false);
      // 檢查框選範圍內的圖層 - 即使很小的框選也處理（用於點擊選擇）
      if (selectionBox.width > 2 || selectionBox.height > 2) {
        console.log('框選範圍:', selectionBox);
        console.log('所有圖層:', layers.map(l => ({ id: l.id, x: l.x, y: l.y, width: l.width, height: l.height, name: l.name })));

        // 尋找框選範圍內的圖層（從最上層開始找）
        const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
        const foundLayer = sortedLayers.find((layer) => {
          if (!layer.visible) return false;
          // 檢查圖層是否與框選範圍重疊
          const layerRight = layer.x + layer.width;
          const layerBottom = layer.y + layer.height;
          const boxRight = selectionBox.x + selectionBox.width;
          const boxBottom = selectionBox.y + selectionBox.height;

          const isOverlap = (
            layer.x < boxRight &&
            layerRight > selectionBox.x &&
            layer.y < boxBottom &&
            layerBottom > selectionBox.y
          );

          console.log(`檢查圖層 ${layer.name}:`, {
            layerBounds: { x: layer.x, y: layer.y, right: layerRight, bottom: layerBottom },
            boxBounds: { x: selectionBox.x, y: selectionBox.y, right: boxRight, bottom: boxBottom },
            isOverlap
          });

          return isOverlap;
        });

        if (foundLayer) {
          console.log('選中圖層:', foundLayer.name);
          selectLayer(foundLayer.id);
        } else {
          console.log('沒有找到重疊的圖層');
          // 如果沒有選中任何圖層，取消選擇
          selectLayer(null);
        }
      } else {
        // 框選太小，取消選擇
        selectLayer(null);
      }
      setSelectionBox({ x: 0, y: 0, width: 0, height: 0, visible: false });
      return;
    }

    // 停止形狀繪製
    if (isDrawingShape && tempShape && currentShapeType) {
      setIsDrawingShape(false);
      // 只有當形狀有一定大小時才創建
      if (tempShape.width > 10 && tempShape.height > 10) {
        addShapeLayer(currentShapeType, tempShape.x, tempShape.y, tempShape.width, tempShape.height);
        saveToHistory(`新增${currentShapeType === 'rectangle' ? '矩形' : currentShapeType === 'circle' ? '圓形' : '形狀'}`);
      }
      setTempShape(null);
      setCurrentShapeType(null);
      return;
    }

    // 鉛筆工具完成繪製
    if (isDrawing && currentTool === 'pencil') {
      setIsDrawing(false);
      if (currentLine.length > 2) {
        // 找到或創建繪圖圖層
        let targetLayer = layers.find(
          (l) => l.id === selectedLayerId && l.type === 'drawing'
        );
        if (!targetLayer) {
          // 如果沒有選中的繪圖圖層，創建一個新的
          const { addDrawingLayer } = useCanvasStore.getState();
          const newLayerId = addDrawingLayer();
          targetLayer = layers.find((l) => l.id === newLayerId);
        }
        if (targetLayer) {
          const line: DrawingLine = {
            points: currentLine,
            stroke: brushColor,
            strokeWidth: brushSize * 3, // 鉛筆線條比較粗
            tension: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          };
          addLineToDrawing(targetLayer.id, line);
          saveToHistory('鉛筆繪圖');
        }
      }
      setCurrentLine([]);
      return;
    }

    // 停止繪圖（brush/mask）
    if (!isDrawing) return;
    setIsDrawing(false);
    const targetLayer = layers.find(
      (l) => l.id === selectedLayerId && (l.type === 'drawing' || l.type === 'mask')
    );
    if (targetLayer && currentLine.length > 2) {
      const line: DrawingLine = {
        points: currentLine,
        stroke: currentTool === 'mask' ? '#ffffff' : brushColor,
        strokeWidth: brushSize,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      };
      addLineToDrawing(targetLayer.id, line);
      saveToHistory(currentTool === 'mask' ? '繪製遮罩' : '繪圖');
    }
    setCurrentLine([]);
  }, [isDrawing, isPanning, isSelecting, isDrawingShape, tempShape, currentShapeType, layers, selectedLayerId, currentTool, currentLine, brushColor, brushSize, addLineToDrawing, addShapeLayer, saveToHistory, selectionBox, selectLayer]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = canvasState.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - canvasState.panX) / oldScale,
        y: (pointer.y - canvasState.panY) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
      setZoom(newScale);
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setPan(newPos.x, newPos.y);
    },
    [canvasState.zoom, canvasState.panX, canvasState.panY, setZoom, setPan]
  );

  const renderLayer = (layer: LayerType) => {
    if (!layer.visible) return null;
    // 允許在 select 工具或非繪圖工具時拖曳
    const isDraggable = !layer.locked && (currentTool === 'select' || currentTool === 'text' || currentTool === 'rectangle');

    switch (layer.type) {
      case 'image':
        return (
          <ImageLayerComponent
            key={layer.id}
            layer={layer}
            isDraggable={isDraggable}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onDragEnd={(e) => handleDragEnd(layer.id, e)}
            onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
          />
        );
      case 'text':
        return (
          <TextLayerComponent
            key={layer.id}
            layer={layer}
            isSelected={layer.id === selectedLayerId}
            isDraggable={isDraggable}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onDragEnd={(e) => handleDragEnd(layer.id, e)}
            onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
          />
        );
      case 'mask':
        return <MaskLayerComponent key={layer.id} layer={layer} isSelected={layer.id === selectedLayerId} />;
      case 'drawing':
        return <DrawingLayerComponent key={layer.id} layer={layer} isSelected={layer.id === selectedLayerId} />;
      case 'shape':
        return (
          <ShapeLayerComponent
            key={layer.id}
            layer={layer as ShapeLayer}
            isDraggable={isDraggable}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onDragEnd={(e) => handleDragEnd(layer.id, e)}
            onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
          />
        );
      case 'marker':
        return (
          <MarkerLayerComponent
            key={layer.id}
            layer={layer as MarkerLayer}
            isDraggable={isDraggable}
            isSelected={layer.id === selectedLayerId}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onDragEnd={(e) => handleDragEnd(layer.id, e)}
            onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
          />
        );
      case 'pen':
        return (
          <PenLayerComponent
            key={layer.id}
            layer={layer as PenLayer}
            isSelected={layer.id === selectedLayerId}
            showControlPoints={currentTool === 'pen' && layer.id === activePenLayerId}
          />
        );
      default:
        return null;
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  // 根據工具設定游標樣式
  const getCursorStyle = () => {
    switch (currentTool) {
      case 'move':
        return isPanning ? 'grabbing' : 'grab';
      case 'brush':
      case 'mask':
      case 'pencil':
      case 'pen':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'select':
        return isSelecting ? 'crosshair' : 'default';
      case 'marker':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: '#ffffff',
        cursor: getCursorStyle(),
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={canvasState.zoom}
        scaleY={canvasState.zoom}
        x={canvasState.panX}
        y={canvasState.panY}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          {/* 背景矩形 - 用於接收框選的滑鼠事件 */}
          <Rect
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            fill="transparent"
            listening={true}
          />
          {sortedLayers.map(renderLayer)}
          {/* 繪圖預覽（brush/mask） */}
          {isDrawing && currentLine.length > 2 && currentTool !== 'pencil' && (
            <Line
              points={currentLine}
              stroke={currentTool === 'mask' ? '#ffffff' : brushColor}
              strokeWidth={brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {/* 鉛筆預覽 */}
          {isDrawing && currentLine.length > 2 && currentTool === 'pencil' && (
            <Line
              points={currentLine}
              stroke={brushColor}
              strokeWidth={brushSize * 3}
              tension={0.3}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {/* 鋼筆路徑預覽 */}
          {penPoints.length > 0 && currentTool === 'pen' && (
            <>
              {/* 路徑線條 */}
              <Line
                points={penPoints.flatMap(p => [p.x, p.y])}
                stroke={brushColor}
                strokeWidth={2}
                tension={0.3}
                lineCap="round"
                lineJoin="round"
              />
              {/* 控制點 */}
              {penPoints.map((point, index) => (
                <Circle
                  key={index}
                  x={point.x}
                  y={point.y}
                  radius={6}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              ))}
            </>
          )}
          {/* 框選矩形 */}
          {selectionBox.visible && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
          {/* 臨時形狀預覽 */}
          {isDrawingShape && tempShape && tempShape.width > 0 && tempShape.height > 0 && (() => {
            const previewProps = {
              fill: "rgba(59, 130, 246, 0.3)",
              stroke: "#3b82f6",
              strokeWidth: 2,
              dash: [4, 4],
            };
            const centerX = tempShape.x + tempShape.width / 2;
            const centerY = tempShape.y + tempShape.height / 2;
            const radius = Math.min(tempShape.width, tempShape.height) / 2;

            switch (currentShapeType) {
              case 'circle':
                return (
                  <Circle
                    x={centerX}
                    y={centerY}
                    radius={radius}
                    {...previewProps}
                  />
                );
              case 'triangle':
                return (
                  <RegularPolygon
                    x={centerX}
                    y={centerY}
                    sides={3}
                    radius={radius}
                    {...previewProps}
                  />
                );
              case 'star':
                return (
                  <Star
                    x={centerX}
                    y={centerY}
                    numPoints={5}
                    innerRadius={radius / 2}
                    outerRadius={radius}
                    {...previewProps}
                  />
                );
              case 'hexagon':
                return (
                  <RegularPolygon
                    x={centerX}
                    y={centerY}
                    sides={6}
                    radius={radius}
                    {...previewProps}
                  />
                );
              case 'arrow':
                return (
                  <Arrow
                    x={tempShape.x}
                    y={tempShape.y}
                    points={[0, tempShape.height / 2, tempShape.width, tempShape.height / 2]}
                    pointerLength={20}
                    pointerWidth={20}
                    {...previewProps}
                  />
                );
              case 'rectangle':
              default:
                return (
                  <Rect
                    x={tempShape.x}
                    y={tempShape.y}
                    width={tempShape.width}
                    height={tempShape.height}
                    {...previewProps}
                  />
                );
            }
          })()}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)}
            enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
            rotateEnabled={true}
            borderStroke="#3b82f6"
            borderStrokeWidth={1}
            borderDash={[4, 4]}
            anchorFill="#ffffff"
            anchorStroke="#3b82f6"
            anchorSize={8}
            anchorCornerRadius={4}
          />
        </Layer>
      </Stage>
      {/* 選取圖片後的 AI 工具列 */}
      {selectedLayerId && currentTool === 'select' && (() => {
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return null;

        // 如果選中的是圖片圖層，顯示 AI 圖片工具
        if (selectedLayer.type === 'image') {
          return (
            <>
              {/* 頂部 AI 工具列 */}
              <div
                className="absolute z-50"
                style={{
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <ImageToolbar
                  onUpscale={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setLoading(true, 'AI 放大中...');
                    try {
                      const result = await aiSuperResolution({ image: imageLayer.src, scale: 2 });
                      if (result) {
                        addImageLayer(result, 'AI 放大結果');
                        saveToHistory('AI 放大');
                      }
                    } catch (error) {
                      console.error('AI 放大失敗:', error);
                      alert('AI 放大失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onRemoveBackground={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setLoading(true, '移除背景中...');
                    try {
                      const result = await aiRemoveBackground({ image: imageLayer.src });
                      if (result) {
                        addImageLayer(result, '去背結果');
                        saveToHistory('移除背景');
                      }
                    } catch (error) {
                      console.error('移除背景失敗:', error);
                      alert('移除背景失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onMockup={() => {
                    alert('Mockup 功能開發中...\n可將圖片套用到手機、電腦等產品模板上');
                  }}
                  onErase={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    const prompt = window.prompt('請描述要擦除的內容（例如：移除背景中的人物）');
                    if (!prompt) return;
                    setLoading(true, '擦除中...');
                    try {
                      const results = await aiEditImage({ image: imageLayer.src, prompt: `移除圖片中的${prompt}，用周圍背景自然填補` });
                      if (results[0]) {
                        addImageLayer(results[0], '擦除結果');
                        saveToHistory('擦除');
                      }
                    } catch (error) {
                      console.error('擦除失敗:', error);
                      alert('擦除失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onEditElements={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    const prompt = window.prompt('請描述要編輯的內容（例如：將紅色車變成藍色）');
                    if (!prompt) return;
                    setLoading(true, '編輯元素中...');
                    try {
                      const results = await aiEditImage({ image: imageLayer.src, prompt });
                      if (results[0]) {
                        addImageLayer(results[0], '編輯結果');
                        saveToHistory('編輯元素');
                      }
                    } catch (error) {
                      console.error('編輯元素失敗:', error);
                      alert('編輯元素失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onEditText={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    const originalText = window.prompt('請輸入圖片中要替換的文字');
                    if (!originalText) return;
                    const newText = window.prompt('請輸入新的文字');
                    if (!newText) return;
                    setLoading(true, '編輯文字中...');
                    try {
                      const results = await aiTextReplace({ image: imageLayer.src, originalText, newText });
                      if (results[0]) {
                        addImageLayer(results[0], '文字編輯結果');
                        saveToHistory('編輯文字');
                      }
                    } catch (error) {
                      console.error('編輯文字失敗:', error);
                      alert('編輯文字失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onExpand={async () => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setLoading(true, '擴展圖片中...');
                    try {
                      const results = await aiOutpaint({ image: imageLayer.src, direction: 'all' });
                      if (results[0]) {
                        addImageLayer(results[0], '擴展結果');
                        saveToHistory('擴展圖片');
                      }
                    } catch (error) {
                      console.error('擴展圖片失敗:', error);
                      alert('擴展圖片失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onDownload={() => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    const link = document.createElement('a');
                    link.href = imageLayer.src;
                    link.download = `${selectedLayer.name || 'image'}.png`;
                    link.click();
                  }}
                />
              </div>

              {/* 右下角 AI 工具觸發按鈕 */}
              <div
                className="absolute z-50"
                style={{
                  bottom: '80px',
                  right: '16px',
                }}
              >
                <AIToolsTrigger onClick={() => setShowAIToolsPanel(!showAIToolsPanel)} />
              </div>

              {/* AI 工具浮動面板 */}
              {showAIToolsPanel && (
                <div
                  className="absolute z-50"
                  style={{
                    bottom: '120px',
                    right: '16px',
                  }}
                >
                  <ImageAIToolsPanel
                    onImageChat={() => {
                      alert('圖片交流功能開發中...');
                      setShowAIToolsPanel(false);
                    }}
                    onExtractText={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      setShowAIToolsPanel(false);
                      setLoading(true, '提取文字中...');
                      try {
                        const results = await aiEditImage({ image: imageLayer.src, prompt: '請識別並提取這張圖片中的所有文字內容，以純文字格式輸出' });
                        alert('文字提取完成，結果已添加為新圖層');
                      } catch (error) {
                        alert('提取文字失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onTranslate={async (lang) => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      setShowAIToolsPanel(false);
                      setLoading(true, `翻譯成${lang}中...`);
                      try {
                        const results = await aiEditImage({ image: imageLayer.src, prompt: `將圖片中的所有文字翻譯成${lang}，保持原有排版和字體風格` });
                        if (results[0]) {
                          addImageLayer(results[0], `翻譯結果 (${lang})`);
                          saveToHistory('翻譯');
                        }
                      } catch (error) {
                        alert('翻譯失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onSaveToMemo={() => {
                      alert('儲存到備忘錄功能開發中...');
                      setShowAIToolsPanel(false);
                    }}
                    onRemoveBackground={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      setShowAIToolsPanel(false);
                      setLoading(true, '移除背景中...');
                      try {
                        const result = await aiRemoveBackground({ image: imageLayer.src });
                        if (result) {
                          addImageLayer(result, '去背結果');
                          saveToHistory('移除背景');
                        }
                      } catch (error) {
                        alert('移除背景失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onRemoveBrushArea={() => {
                      alert('移除刷選區域功能開發中...\n請先使用畫筆工具塗抹要移除的區域');
                      setShowAIToolsPanel(false);
                    }}
                    onRemoveObject={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      const prompt = window.prompt('請描述要移除的物件（例如：背景中的人物、文字浮水印）');
                      if (!prompt) {
                        setShowAIToolsPanel(false);
                        return;
                      }
                      setShowAIToolsPanel(false);
                      setLoading(true, '移除物件中...');
                      try {
                        const results = await aiEditImage({ image: imageLayer.src, prompt: `移除圖片中的${prompt}，用周圍背景自然填補` });
                        if (results[0]) {
                          addImageLayer(results[0], '移除物件結果');
                          saveToHistory('移除物件');
                        }
                      } catch (error) {
                        alert('移除物件失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onImageGenerator={() => {
                      alert('請使用左側工具列的 AI 圖像生成功能');
                      setShowAIToolsPanel(false);
                    }}
                    onImageToAnimation={() => {
                      alert('AI 圖生動畫功能開發中...');
                      setShowAIToolsPanel(false);
                    }}
                    onRemoveText={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      setShowAIToolsPanel(false);
                      setLoading(true, '移除文字中...');
                      try {
                        const results = await aiEditImage({ image: imageLayer.src, prompt: '移除圖片中所有的文字，用周圍背景自然填補' });
                        if (results[0]) {
                          addImageLayer(results[0], '移除文字結果');
                          saveToHistory('移除文字');
                        }
                      } catch (error) {
                        alert('移除文字失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onChangeBackground={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      const prompt = window.prompt('請描述新的背景（例如：白色背景、海灘背景、城市夜景）');
                      if (!prompt) {
                        setShowAIToolsPanel(false);
                        return;
                      }
                      setShowAIToolsPanel(false);
                      setLoading(true, '更換背景中...');
                      try {
                        const results = await aiEditImage({ image: imageLayer.src, prompt: `將背景更換為${prompt}，保持主體物件不變` });
                        if (results[0]) {
                          addImageLayer(results[0], '更換背景結果');
                          saveToHistory('更換背景');
                        }
                      } catch (error) {
                        alert('更換背景失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onUpscale={async () => {
                      const imageLayer = selectedLayer as ImageLayer;
                      if (!imageLayer.src) return;
                      setShowAIToolsPanel(false);
                      setLoading(true, 'AI 放大中...');
                      try {
                        const result = await aiSuperResolution({ image: imageLayer.src, scale: 2 });
                        if (result) {
                          addImageLayer(result, 'AI 放大結果');
                          saveToHistory('AI 放大');
                        }
                      } catch (error) {
                        alert('AI 放大失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </div>
              )}
            </>
          );
        }

        // 文字圖層專用工具列
        if (selectedLayer.type === 'text') {
          const textLayer = selectedLayer as TextLayer;
          return (
            <div
              className="absolute bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2 z-50"
              style={{
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {/* 文字顏色 */}
              <div className="relative">
                <input
                  type="color"
                  value={textLayer.fill || '#000000'}
                  onChange={(e) => updateLayer(selectedLayerId, { fill: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                  title="文字顏色"
                />
              </div>

              <div className="w-px h-6 bg-gray-200" />

              {/* 字體選擇 */}
              <select
                value={textLayer.fontFamily || 'Inter'}
                onChange={(e) => updateLayer(selectedLayerId, { fontFamily: e.target.value })}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400 bg-white"
                title="字體"
              >
                <option value="Inter">Inter</option>
                <option value="Noto Sans TC">Noto Sans TC</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Microsoft JhengHei">微軟正黑體</option>
                <option value="PingFang TC">蘋方</option>
              </select>

              <div className="w-px h-6 bg-gray-200" />

              {/* 字重 */}
              <select
                value={textLayer.fontWeight || 'normal'}
                onChange={(e) => updateLayer(selectedLayerId, { fontWeight: e.target.value })}
                className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400 bg-white"
                title="字重"
              >
                <option value="normal">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="bold">Bold</option>
                <option value="100">Thin</option>
                <option value="300">Light</option>
              </select>

              <div className="w-px h-6 bg-gray-200" />

              {/* 字體大小 */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={textLayer.fontSize || 24}
                  onChange={(e) => updateLayer(selectedLayerId, { fontSize: Number(e.target.value) })}
                  className="w-14 px-2 py-1 text-sm border border-gray-200 rounded text-center focus:outline-none focus:border-blue-400"
                  min={8}
                  max={200}
                  title="字體大小"
                />
              </div>

              <div className="w-px h-6 bg-gray-200" />

              {/* 文字對齊 */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => updateLayer(selectedLayerId, { align: 'left' })}
                  className={`p-1.5 rounded transition-colors ${textLayer.align === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="靠左對齊"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="15" y2="12" />
                    <line x1="3" y1="18" x2="18" y2="18" />
                  </svg>
                </button>
                <button
                  onClick={() => updateLayer(selectedLayerId, { align: 'center' })}
                  className={`p-1.5 rounded transition-colors ${textLayer.align === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="置中對齊"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
                <button
                  onClick={() => updateLayer(selectedLayerId, { align: 'right' })}
                  className={`p-1.5 rounded transition-colors ${textLayer.align === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="靠右對齊"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="9" y1="12" x2="21" y2="12" />
                    <line x1="6" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="w-px h-6 bg-gray-200" />

              {/* 斜體 */}
              <button
                onClick={() => updateLayer(selectedLayerId, { fontStyle: textLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`p-1.5 rounded transition-colors ${textLayer.fontStyle === 'italic' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="斜體"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="4" x2="10" y2="4" />
                  <line x1="14" y1="20" x2="5" y2="20" />
                  <line x1="15" y1="4" x2="9" y2="20" />
                </svg>
              </button>

              <div className="w-px h-6 bg-gray-200" />

              {/* 設定 */}
              <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="更多設定">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

              {/* 下載 */}
              <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="下載">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </button>
            </div>
          );
        }

        // 非圖片圖層，顯示通用工具列
        return (
          <div
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2 z-50"
            style={{
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* 創建編組 / 合併圖層 */}
            <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1" title="創建編組">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>創建編組</span>
            </button>
            <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1" title="合併圖層">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
              <span>合併圖層</span>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* 更多選項 */}
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="更多">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* 路徑工具 */}
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="路徑">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M3 12h18" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* 寬度 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">W</span>
              <input
                type="number"
                value={Math.round(selectedLayer.width)}
                onChange={(e) => updateLayer(selectedLayerId, { width: Number(e.target.value) })}
                className="w-14 px-1 py-0.5 text-sm border border-gray-200 rounded text-center focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* 鎖定比例 */}
            <button className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="鎖定比例">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </button>

            {/* 高度 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">H</span>
              <input
                type="number"
                value={Math.round(selectedLayer.height)}
                onChange={(e) => updateLayer(selectedLayerId, { height: Number(e.target.value) })}
                className="w-14 px-1 py-0.5 text-sm border border-gray-200 rounded text-center focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* 顏色選擇 */}
            <button className="p-1.5 hover:bg-gray-100 rounded" title="填充顏色">
              <div className="w-4 h-4 rounded border border-gray-300 bg-gradient-to-br from-orange-400 to-yellow-300" />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* 對齊工具 */}
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="對齊">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* 分佈工具 */}
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="分佈">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="4" height="16" rx="1" />
                <rect x="10" y="4" width="4" height="16" rx="1" />
                <rect x="16" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* 下載 */}
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="下載">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>
        );
      })()}

      {/* 底部左側面板 - 圖層和歷史記錄 */}
      <div className="absolute bottom-4 left-4 z-40">
        {/* 展開的面板 */}
        {showBottomPanel && (
          <div className="mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden" style={{ width: '280px', maxHeight: '320px' }}>
            {/* 面板標籤 */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setBottomPanelTab('layers')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  bottomPanelTab === 'layers'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                圖層
              </button>
              <button
                onClick={() => setBottomPanelTab('history')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  bottomPanelTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                歷史記錄
              </button>
            </div>

            {/* 面板內容 */}
            <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
              {bottomPanelTab === 'layers' ? (
                /* 圖層列表 */
                <div className="p-2">
                  {layers.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      尚無圖層
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {[...layers].sort((a, b) => b.zIndex - a.zIndex).map((layer, index) => (
                        <div
                          key={layer.id}
                          onClick={() => selectLayer(layer.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedLayerId === layer.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          {/* 圖層預覽縮圖 */}
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {layer.type === 'image' && (layer as ImageLayer).src ? (
                              <img
                                src={(layer as ImageLayer).src}
                                alt={layer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : layer.type === 'text' ? (
                              <span className="text-xs text-gray-500">T</span>
                            ) : layer.type === 'shape' ? (
                              <span className="text-xs text-gray-500">⬢</span>
                            ) : layer.type === 'marker' ? (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: (layer as MarkerLayer).color }}
                              >
                                {(layer as MarkerLayer).number}
                              </div>
                            ) : layer.type === 'drawing' ? (
                              <span className="text-xs text-gray-500">✏️</span>
                            ) : (
                              <span className="text-xs text-gray-500">📄</span>
                            )}
                          </div>

                          {/* 圖層名稱 */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 truncate">{layer.name}</div>
                            <div className="text-xs text-gray-400">{layer.type}</div>
                          </div>

                          {/* 圖層操作按鈕 */}
                          <div className="flex items-center gap-1">
                            {/* 可見性 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerVisibility(layer.id);
                              }}
                              className={`p-1 rounded hover:bg-gray-200 ${layer.visible ? 'text-gray-600' : 'text-gray-300'}`}
                              title={layer.visible ? '隱藏' : '顯示'}
                            >
                              {layer.visible ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              )}
                            </button>
                            {/* 鎖定 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerLock(layer.id);
                              }}
                              className={`p-1 rounded hover:bg-gray-200 ${layer.locked ? 'text-blue-500' : 'text-gray-300'}`}
                              title={layer.locked ? '解鎖' : '鎖定'}
                            >
                              {layer.locked ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                              )}
                            </button>
                            {/* 刪除 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLayer(layer.id);
                              }}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                              title="刪除"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* 歷史記錄列表 */
                <div className="p-2">
                  {history.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      尚無歷史記錄
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {history.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            index === historyIndex
                              ? 'bg-blue-50 border border-blue-200'
                              : index < historyIndex
                              ? 'hover:bg-gray-50 border border-transparent'
                              : 'opacity-50 hover:bg-gray-50 border border-transparent'
                          }`}
                          onClick={() => {
                            // 直接跳轉到指定歷史狀態
                            restoreHistoryState(index);
                          }}
                        >
                          {/* 歷史狀態指示 */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            index === historyIndex ? 'bg-blue-500' : index < historyIndex ? 'bg-gray-400' : 'bg-gray-200'
                          }`} />

                          {/* 操作名稱 */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 truncate">{entry.action}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(entry.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>

                          {/* 當前狀態標記 */}
                          {index === historyIndex && (
                            <span className="text-xs text-blue-500 font-medium">當前</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 底部工具列 */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          {/* 圖層按鈕 */}
          <button
            onClick={() => {
              setShowBottomPanel(!showBottomPanel);
              setBottomPanelTab('layers');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
              showBottomPanel && bottomPanelTab === 'layers'
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="圖層"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-sm">圖層</span>
          </button>

          <span className="text-gray-200">|</span>

          {/* 縮放控制 */}
          <button
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
            onClick={() => setZoom(Math.max(0.1, canvasState.zoom - 0.1))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
            {Math.round(canvasState.zoom * 100)}%
          </span>
          <button
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
            onClick={() => setZoom(Math.min(5, canvasState.zoom + 0.1))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      {/* 標記編輯彈窗 */}
      {showMarkerPopup && selectedLayerId && (() => {
        const selectedMarker = layers.find(l => l.id === selectedLayerId && l.type === 'marker') as MarkerLayer | undefined;
        if (!selectedMarker) return null;

        // 找到標記所在的圖片
        const markerCenterX = selectedMarker.x + selectedMarker.width / 2;
        const markerCenterY = selectedMarker.y + selectedMarker.height / 2;
        const targetImageLayer = (layers.filter(l => l.type === 'image' && l.visible) as ImageLayer[]).find(img => {
          return markerCenterX >= img.x && markerCenterX <= img.x + img.width &&
                 markerCenterY >= img.y && markerCenterY <= img.y + img.height;
        });

        return (
          <MarkerEditPopup
            marker={selectedMarker}
            position={markerPopupPosition}
            onSave={(name) => {
              updateMarkerObjectName(selectedMarker.id, name);
              setShowMarkerPopup(false);
            }}
            onClose={() => setShowMarkerPopup(false)}
            isProcessing={isMarkerAIProcessing}
            onAIAction={async (prompt) => {
              if (!targetImageLayer) {
                alert('請先在圖片上放置標記');
                return;
              }

              setIsMarkerAIProcessing(true);
              try {
                // 計算標記相對於圖片的位置百分比
                const relX = markerCenterX - targetImageLayer.x;
                const relY = markerCenterY - targetImageLayer.y;
                const xPercent = Math.round((relX / targetImageLayer.width) * 100);
                const yPercent = Math.round((relY / targetImageLayer.height) * 100);

                // 構建帶位置資訊的 AI 指令
                const positionPrompt = `在圖片中位於 ${xPercent}% 從左邊、${yPercent}% 從上方的位置（標記為「${selectedMarker.objectName || '標記點'}」），${prompt}`;

                console.log('AI 協作指令:', positionPrompt);

                // 調用 AI 編輯
                const results = await aiEditImage({
                  image: targetImageLayer.src,
                  prompt: positionPrompt,
                });

                if (results[0]) {
                  // 將結果添加為新圖層
                  addImageLayer(results[0], `AI 協作: ${prompt.substring(0, 20)}...`);
                  saveToHistory('AI 協作編輯');
                  setShowMarkerPopup(false);
                }
              } catch (error) {
                console.error('AI 協作失敗:', error);
                alert('AI 協作失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
              } finally {
                setIsMarkerAIProcessing(false);
              }
            }}
          />
        );
      })()}
    </div>
  );
};
