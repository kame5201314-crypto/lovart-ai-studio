import { useRef, useEffect, useCallback, useState } from 'react';
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
import { VideoLayerComponent } from './VideoLayerComponent';
import { ImageToolbar, ImageAIToolsPanel, AIToolsTrigger, EditElementsPanel, BackgroundColorPicker, ContextMenu, getImageContextMenuItems, EditTextPanel, ExpandImagePanel, VideoToolbar } from '../ui';
import { MockupVideoEditor } from '../mockup';
import { Eraser } from 'lucide-react';
import type { Layer as LayerType, DrawingLine, ShapeType, ShapeLayer, MarkerLayer, PenLayer, PenPath, PenPoint, ImageLayer, VideoLayer } from '../../types';
import {
  aiSuperResolution,
  aiRemoveBackground,
  aiOutpaint,
  aiEditImage,
  aiTextReplace,
  inpaint,
} from '../../services/aiService';

// 框選狀態介面
interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

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
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
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

  // 擦除模式狀態
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [eraseTargetLayerId, setEraseTargetLayerId] = useState<string | null>(null);
  const [eraseMaskLines, setEraseMaskLines] = useState<number[][]>([]);

  // 編輯元素面板狀態
  const [showEditElementsPanel, setShowEditElementsPanel] = useState(false);
  const [editElementsImageData, setEditElementsImageData] = useState<string>('');

  // 右鍵選單狀態
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  // 編輯文字面板狀態
  const [showEditTextPanel, setShowEditTextPanel] = useState(false);
  const [editTextLayerId, setEditTextLayerId] = useState<string | null>(null);

  // 擴圖面板狀態
  const [showExpandPanel, setShowExpandPanel] = useState(false);
  const [expandLayerId, setExpandLayerId] = useState<string | null>(null);

  // Mockup 編輯器狀態
  const [showMockupEditor, setShowMockupEditor] = useState(false);
  const [mockupImageSrc, setMockupImageSrc] = useState<string>('');

  // 當選中圖層變化時，關閉 AI 工具面板和擦除模式
  useEffect(() => {
    setShowAIToolsPanel(false);
    // 如果選中了不同的圖層，退出擦除模式
    if (eraseTargetLayerId && selectedLayerId !== eraseTargetLayerId) {
      setIsEraseMode(false);
      setEraseTargetLayerId(null);
      setEraseMaskLines([]);
    }
  }, [selectedLayerId, eraseTargetLayerId]);

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
      if (e.target === e.target.getStage()) selectLayer(null);
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
      }
    },
    [currentTool, selectLayer]
  );

  // 右鍵選單處理
  const handleContextMenu = useCallback(
    (layerId: string, e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      e.cancelBubble = true;
      // 選中該圖層
      selectLayer(layerId);
      // 顯示右鍵選單
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        layerId,
      });
    },
    [selectLayer]
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
      // 擦除模式 - 繪製遮罩
      if (isEraseMode) {
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

      // 平移模式 - 使用 Konva 內建的 draggable，這裡只需設定游標狀態
      if (currentTool === 'move') {
        setIsPanning(true);
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

      // 標記工具 - 點擊即放置標記
      if (currentTool === 'marker') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos) {
          addMarkerLayer(pos.x, pos.y);
          saveToHistory('新增標記');
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
    [currentTool, activePenLayerId, addPenLayer, isEraseMode]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 擦除模式 - 繪製遮罩
      if (isEraseMode && isDrawing) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos && stage) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pos);
          setCurrentLine((prev) => [...prev, canvasPos.x, canvasPos.y]);
        }
        return;
      }

      // 平移模式 - 使用 Konva 內建的 draggable 處理，這裡不需要額外處理
      if (isPanning && currentTool === 'move') {
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
    [isDrawing, isPanning, isSelecting, isDrawingShape, currentTool, selectionStart, shapeStart, isEraseMode]
  );

  const handleMouseUp = useCallback(() => {
    // 擦除模式 - 保存遮罩線條
    if (isEraseMode && isDrawing) {
      setIsDrawing(false);
      if (currentLine.length > 2) {
        setEraseMaskLines((prev) => [...prev, currentLine]);
      }
      setCurrentLine([]);
      return;
    }

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
  }, [isDrawing, isPanning, isSelecting, isDrawingShape, tempShape, currentShapeType, layers, selectedLayerId, currentTool, currentLine, brushColor, brushSize, addLineToDrawing, addShapeLayer, saveToHistory, selectionBox, selectLayer, isEraseMode]);

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
            onContextMenu={(e) => handleContextMenu(layer.id, e)}
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
      case 'video':
        return (
          <VideoLayerComponent
            key={layer.id}
            layer={layer as VideoLayer}
            isDraggable={isDraggable}
            onClick={(e) => handleLayerClick(layer.id, e)}
            onDragEnd={(e) => handleDragEnd(layer.id, e)}
            onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
            onContextMenu={(e) => handleContextMenu(layer.id, e)}
            onVideoTimeUpdate={(time) => {
              useCanvasStore.getState().updateVideoState(layer.id, { currentTime: time });
            }}
          />
        );
      default:
        return null;
    }
  };

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  // 根據工具設定游標樣式
  const getCursorStyle = () => {
    // 擦除模式使用十字游標
    if (isEraseMode) {
      return 'crosshair';
    }
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
        backgroundColor: canvasState.backgroundColor === 'transparent' ? undefined : canvasState.backgroundColor,
        backgroundImage: canvasState.backgroundColor === 'transparent'
          ? 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)'
          : undefined,
        backgroundSize: canvasState.backgroundColor === 'transparent' ? '20px 20px' : undefined,
        backgroundPosition: canvasState.backgroundColor === 'transparent' ? '0 0, 0 10px, 10px -10px, -10px 0px' : undefined,
        cursor: getCursorStyle(),
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={canvasState.panX}
        y={canvasState.panY}
        scaleX={canvasState.zoom}
        scaleY={canvasState.zoom}
        draggable={currentTool === 'move'}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragEnd={(e) => {
          // 使用 Konva 內建拖曳功能時更新 pan 值
          setPan(e.target.x(), e.target.y());
        }}
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
          {/* 擦除遮罩預覽 - 已保存的線條（紫色半透明） */}
          {isEraseMode && eraseMaskLines.map((line, index) => (
            <Line
              key={`erase-mask-${index}`}
              points={line}
              stroke="rgba(139, 92, 246, 0.6)"
              strokeWidth={brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {/* 擦除遮罩預覽 - 當前繪製中的線條（紫色半透明） */}
          {isEraseMode && isDrawing && currentLine.length > 2 && (
            <Line
              points={currentLine}
              stroke="rgba(139, 92, 246, 0.6)"
              strokeWidth={brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
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

      {/* 擦除模式 UI 面板 */}
      {isEraseMode && (
        <div
          className="absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
          style={{
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* 標題 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eraser size={18} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">擦除模式</div>
                <div className="text-xs text-gray-500">塗抹要擦除的區域</div>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-200" />

            {/* 筆刷大小滑桿 */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">筆刷大小</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={brushSize}
                  onChange={(e) => useCanvasStore.getState().setBrushSize(parseInt(e.target.value))}
                  className="w-24 h-1.5 bg-gray-200 rounded-full cursor-pointer accent-purple-500"
                />
                <span className="text-xs font-medium text-gray-700 w-10 text-center bg-gray-100 rounded px-1.5 py-0.5">
                  {brushSize}px
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-200" />

            {/* 操作按鈕 */}
            <div className="flex items-center gap-2">
              {/* 復原按鈕 */}
              <button
                onClick={() => {
                  // 移除最後一條遮罩線
                  if (eraseMaskLines.length > 0) {
                    setEraseMaskLines(prev => prev.slice(0, -1));
                  }
                }}
                disabled={eraseMaskLines.length === 0}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  eraseMaskLines.length > 0
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="復原上一筆"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h10a5 5 0 015 5v2M3 10l6 6M3 10l6-6" />
                </svg>
                復原
              </button>

              {/* 清除全部 */}
              <button
                onClick={() => {
                  setEraseMaskLines([]);
                }}
                disabled={eraseMaskLines.length === 0}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  eraseMaskLines.length > 0
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                清除全部
              </button>

              {/* 取消 */}
              <button
                onClick={() => {
                  setIsEraseMode(false);
                  setEraseTargetLayerId(null);
                  setEraseMaskLines([]);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>

              {/* 確認擦除 */}
              <button
                onClick={async () => {
                // 執行擦除
                if (eraseMaskLines.length === 0) {
                  alert('請先用畫筆塗抹要擦除的區域');
                  return;
                }

                const targetLayer = layers.find(l => l.id === eraseTargetLayerId) as ImageLayer;
                if (!targetLayer?.src) return;

                setLoading(true, '擦除中...');
                try {
                  // 創建遮罩圖片
                  const maskCanvas = document.createElement('canvas');
                  // 使用目標圖層的尺寸
                  maskCanvas.width = targetLayer.width;
                  maskCanvas.height = targetLayer.height;
                  const ctx = maskCanvas.getContext('2d');
                  if (!ctx) throw new Error('無法創建 canvas context');

                  // 設置黑色背景（遮罩的未選區域）
                  ctx.fillStyle = '#000000';
                  ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

                  // 繪製白色線條（遮罩的選中區域）
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = brushSize;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';

                  // 計算座標轉換（從畫布座標轉換到圖層座標）
                  const offsetX = targetLayer.x;
                  const offsetY = targetLayer.y;

                  eraseMaskLines.forEach(line => {
                    if (line.length < 4) return;
                    ctx.beginPath();
                    ctx.moveTo(line[0] - offsetX, line[1] - offsetY);
                    for (let i = 2; i < line.length; i += 2) {
                      ctx.lineTo(line[i] - offsetX, line[i + 1] - offsetY);
                    }
                    ctx.stroke();
                  });

                  const maskDataUrl = maskCanvas.toDataURL('image/png');

                  // 呼叫 inpaint API
                  const result = await inpaint({
                    image: targetLayer.src,
                    mask: maskDataUrl,
                    prompt: '', // 空 prompt 表示純擦除
                  });

                  if (result) {
                    addImageLayer(result, '擦除結果');
                    saveToHistory('擦除');
                  }

                  // 退出擦除模式
                  setIsEraseMode(false);
                  setEraseTargetLayerId(null);
                  setEraseMaskLines([]);
                } catch (error) {
                  console.error('擦除失敗:', error);
                  alert('擦除失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={eraseMaskLines.length === 0}
              className={`px-4 py-1.5 text-sm text-white rounded-lg transition-colors ${
                eraseMaskLines.length > 0
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              確認擦除
            </button>
            </div>
          </div>
        </div>
      )}

      {/* 選取圖片後的 AI 工具列 */}
      {selectedLayerId && currentTool === 'select' && !isEraseMode && (() => {
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
                  imageWidth={selectedLayer.width}
                  imageHeight={selectedLayer.height}
                  onUpscale={async (scale: number) => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setLoading(true, `AI ${scale}倍放大中...`);
                    try {
                      const result = await aiSuperResolution({ image: imageLayer.src, scale: scale as 2 | 4 });
                      if (result) {
                        addImageLayer(result, `AI ${scale}倍放大結果`);
                        saveToHistory(`AI ${scale}倍放大`);
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
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setMockupImageSrc(imageLayer.src);
                    setShowMockupEditor(true);
                  }}
                  onErase={() => {
                    // 進入擦除模式
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    setIsEraseMode(true);
                    setEraseTargetLayerId(imageLayer.id);
                    setEraseMaskLines([]);
                  }}
                  onEditElements={() => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    // 開啟編輯元素面板
                    setEditElementsImageData(imageLayer.src);
                    setShowEditElementsPanel(true);
                  }}
                  onEditText={() => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    // 開啟編輯文字面板
                    setEditTextLayerId(imageLayer.id);
                    setShowEditTextPanel(true);
                  }}
                  onExpand={() => {
                    const imageLayer = selectedLayer as ImageLayer;
                    if (!imageLayer.src) return;
                    // 開啟擴圖面板
                    setExpandLayerId(imageLayer.id);
                    setShowExpandPanel(true);
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

        // 如果選中的是影片圖層，顯示影片工具列
        if (selectedLayer.type === 'video') {
          const videoLayer = selectedLayer as VideoLayer;
          return (
            <div
              className="absolute z-50"
              style={{
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <VideoToolbar
                isPlaying={videoLayer.isPlaying}
                currentTime={videoLayer.currentTime}
                duration={videoLayer.duration}
                volume={videoLayer.volume}
                isMuted={videoLayer.muted}
                isLooping={videoLayer.loop}
                playbackRate={videoLayer.playbackRate}
                onPlayPause={() => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    isPlaying: !videoLayer.isPlaying,
                  });
                }}
                onSeek={(time) => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    currentTime: time,
                  });
                }}
                onVolumeChange={(volume) => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    volume,
                    muted: volume === 0,
                  });
                }}
                onMuteToggle={() => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    muted: !videoLayer.muted,
                  });
                }}
                onLoopToggle={() => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    loop: !videoLayer.loop,
                  });
                }}
                onPlaybackRateChange={(rate) => {
                  useCanvasStore.getState().updateVideoState(videoLayer.id, {
                    playbackRate: rate,
                  });
                }}
                onTrim={() => {
                  alert('影片剪輯功能開發中...');
                }}
                onExport={() => {
                  // 匯出影片
                  const link = document.createElement('a');
                  link.href = videoLayer.src;
                  link.download = `${videoLayer.name || 'video'}.mp4`;
                  link.click();
                }}
                onDelete={() => {
                  deleteSelectedLayer();
                }}
              />
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

      {/* 底部工具列 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        {/* 背景顏色選擇器 */}
        <BackgroundColorPicker
          currentColor={canvasState.backgroundColor}
          onChange={(color) => useCanvasStore.getState().setBackgroundColor(color)}
        />

        {/* 縮放控制 */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-2">
          <button className="p-1 hover:bg-gray-100 rounded text-gray-600" title="設定">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
            onClick={() => setZoom(Math.max(0.1, canvasState.zoom - 0.1))}
          >
            −
          </button>
          <span className="text-sm text-gray-600 min-w-[40px] text-center">{Math.round(canvasState.zoom * 100)}%</span>
          <button
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
            onClick={() => setZoom(Math.min(5, canvasState.zoom + 0.1))}
          >
            +
          </button>
        </div>
      </div>

      {/* 編輯元素面板 */}
      <EditElementsPanel
        isOpen={showEditElementsPanel}
        onClose={() => {
          setShowEditElementsPanel(false);
          setEditElementsImageData('');
        }}
        imageData={editElementsImageData}
        onApply={(layersData) => {
          // 將分離的圖層添加到畫布
          layersData.forEach((layer) => {
            if (layer.imageData) {
              addImageLayer(layer.imageData, layer.name);
            }
          });
          saveToHistory('編輯元素 - 分離圖層');
        }}
      />

      {/* 右鍵選單 */}
      {contextMenu && (() => {
        const targetLayer = layers.find(l => l.id === contextMenu.layerId);
        if (!targetLayer) return null;

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getImageContextMenuItems({
              onCopy: () => copyLayer(),
              onPaste: () => pasteLayer(),
              onMoveUp: () => moveLayerUp(contextMenu.layerId),
              onMoveDown: () => moveLayerDown(contextMenu.layerId),
              onMoveToTop: () => moveLayerToTop(contextMenu.layerId),
              onMoveToBottom: () => moveLayerToBottom(contextMenu.layerId),
              onSendToChat: () => {
                // TODO: 實現發送至對話功能
                alert('發送至對話功能開發中...');
              },
              onCreateGroup: () => {
                // TODO: 實現群組功能
                alert('群組功能開發中...');
              },
              onToggleVisibility: () => toggleLayerVisibility(contextMenu.layerId),
              onToggleLock: () => toggleLayerLock(contextMenu.layerId),
              onExportPNG: () => {
                const imageLayer = targetLayer as ImageLayer;
                if (imageLayer.src) {
                  const link = document.createElement('a');
                  link.href = imageLayer.src;
                  link.download = `${targetLayer.name || 'image'}.png`;
                  link.click();
                }
              },
              onExportJPG: () => {
                const imageLayer = targetLayer as ImageLayer;
                if (imageLayer.src) {
                  // 轉換為 JPG
                  const img = new window.Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0);
                      const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
                      const link = document.createElement('a');
                      link.href = jpgUrl;
                      link.download = `${targetLayer.name || 'image'}.jpg`;
                      link.click();
                    }
                  };
                  img.src = imageLayer.src;
                }
              },
              onExportSVG: () => {
                alert('SVG 匯出功能開發中...');
              },
              onDelete: () => deleteSelectedLayer(),
              isLocked: targetLayer.locked,
              isVisible: targetLayer.visible,
            })}
            onClose={() => setContextMenu(null)}
          />
        );
      })()}

      {/* 編輯文字浮動面板 */}
      {showEditTextPanel && editTextLayerId && (() => {
        const targetLayer = layers.find(l => l.id === editTextLayerId) as ImageLayer;
        if (!targetLayer) return null;

        return (
          <div
            className="absolute z-50"
            style={{
              top: '60px',
              right: '20px',
            }}
          >
            <EditTextPanel
              isOpen={showEditTextPanel}
              onClose={() => {
                setShowEditTextPanel(false);
                setEditTextLayerId(null);
              }}
              onApply={async (newText) => {
                if (!targetLayer.src) return;
                setLoading(true, '編輯文字中...');
                try {
                  const results = await aiTextReplace({
                    image: targetLayer.src,
                    originalText: '',
                    newText,
                  });
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
            />
          </div>
        );
      })()}

      {/* 擴圖浮動面板 */}
      {showExpandPanel && expandLayerId && (() => {
        const targetLayer = layers.find(l => l.id === expandLayerId) as ImageLayer;
        if (!targetLayer) return null;

        return (
          <div
            className="absolute z-50"
            style={{
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <ExpandImagePanel
              isOpen={showExpandPanel}
              onClose={() => {
                setShowExpandPanel(false);
                setExpandLayerId(null);
              }}
              originalWidth={targetLayer.width}
              originalHeight={targetLayer.height}
              onApply={async (width, height, prompt) => {
                if (!targetLayer.src) return;
                setLoading(true, '擴展圖片中...');
                try {
                  const results = await aiOutpaint({
                    image: targetLayer.src,
                    direction: 'all',
                    prompt,
                  });
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
            />
          </div>
        );
      })()}

      {/* Mockup 影片編輯器 */}
      <MockupVideoEditor
        isOpen={showMockupEditor}
        onClose={() => {
          setShowMockupEditor(false);
          setMockupImageSrc('');
        }}
        videoSrc={mockupImageSrc}
        onExport={(result) => {
          if (result) {
            addImageLayer(result, 'Mockup 結果');
            saveToHistory('Mockup 生成');
          }
          setShowMockupEditor(false);
          setMockupImageSrc('');
        }}
      />
    </div>
  );
};
