import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Layer,
  ImageLayer,
  TextLayer,
  MaskLayer,
  DrawingLayer,
  ShapeLayer,
  MarkerLayer,
  ShapeType,
  ToolType,
  AIModel,
  CanvasState,
  HistoryEntry,
  DrawingLine,
} from '../types';

interface CanvasStore {
  layers: Layer[];
  selectedLayerId: string | null;
  canvasState: CanvasState;
  currentTool: ToolType;
  brushSize: number;
  brushColor: string;
  eraserSize: number;
  selectedModel: AIModel;
  history: HistoryEntry[];
  historyIndex: number;
  isLoading: boolean;
  loadingMessage: string;
  clipboard: Layer | null; // 剪貼簿
  markerCounter: number; // 標記計數器

  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => string;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  selectLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  addImageLayer: (src: string, name?: string, width?: number, height?: number) => string;
  addTextLayer: (text: string, options?: Partial<TextLayer>) => string;
  addMaskLayer: (targetLayerId?: string) => string;
  updateMaskData: (id: string, imageData: string) => void;
  addDrawingLayer: () => string;
  addLineToDrawing: (layerId: string, line: DrawingLine) => void;
  addShapeLayer: (shapeType: ShapeType, x: number, y: number, width: number, height: number) => string;
  addMarkerLayer: (x: number, y: number) => string;
  resetMarkerCounter: () => void;
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setBackgroundColor: (color: string) => void;
  setTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setEraserSize: (size: number) => void;
  setSelectedModel: (model: AIModel) => void;
  setLoading: (loading: boolean, message?: string) => void;
  saveToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  exportCanvas: () => Promise<string>;
  clearCanvas: () => void;
  getSelectedLayer: () => Layer | null;
  // 剪貼簿操作
  copyLayer: () => void;
  cutLayer: () => void;
  pasteLayer: () => void;
  deleteSelectedLayer: () => void;
  selectAllLayers: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  canvasState: {
    width: 1280,
    height: 1024,
    zoom: 1,
    panX: 0,
    panY: 0,
    backgroundColor: '#ffffff',
  },
  currentTool: 'select',
  brushSize: 20,
  brushColor: '#000000',
  eraserSize: 20,
  selectedModel: 'gemini-flash',
  history: [],
  historyIndex: -1,
  isLoading: false,
  loadingMessage: '',
  clipboard: null,
  markerCounter: 0,

  addLayer: (layer) => {
    const id = uuidv4();
    const { layers } = get();
    const zIndex = layers.length;
    const newLayer = { ...layer, id, zIndex } as Layer;
    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: id,
    }));
    get().saveToHistory(`新增圖層: ${layer.name}`);
    return id;
  },

  removeLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
    get().saveToHistory('刪除圖層');
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } as Layer : layer
      ),
    }));
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [movedLayer] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, movedLayer);
      return {
        layers: newLayers.map((layer, index) => ({ ...layer, zIndex: index })),
      };
    });
    get().saveToHistory('重新排序圖層');
  },

  duplicateLayer: (id) => {
    const { layers, addLayer } = get();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const { id: _, zIndex: __, ...rest } = layer;
      addLayer({
        ...rest,
        name: `${layer.name} (複製)`,
        x: layer.x + 20,
        y: layer.y + 20,
      } as Omit<Layer, 'id' | 'zIndex'>);
    }
  },

  toggleLayerVisibility: (id) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  },

  toggleLayerLock: (id) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      ),
    }));
  },

  addImageLayer: (src, name = '圖片', width?: number, height?: number) => {
    // 如果沒有指定尺寸，使用預設值
    const imgWidth = width || 400;
    const imgHeight = height || 300;
    // 將圖片放置在畫布左上角附近
    const x = 100;
    const y = 100;

    return get().addLayer({
      type: 'image',
      name,
      visible: true,
      locked: false,
      opacity: 1,
      x,
      y,
      width: imgWidth,
      height: imgHeight,
      rotation: 0,
      src,
      originalSrc: src,
    } as Omit<ImageLayer, 'id' | 'zIndex'>);
  },

  addTextLayer: (text, options = {}) => {
    return get().addLayer({
      type: 'text',
      name: '文字',
      visible: true,
      locked: false,
      opacity: 1,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      text,
      fontFamily: 'Noto Sans TC',
      fontSize: 32,
      fontWeight: 'normal',
      fontStyle: 'normal',
      fill: '#000000',
      align: 'left',
      lineHeight: 1.2,
      ...options,
    } as Omit<TextLayer, 'id' | 'zIndex'>);
  },

  addMaskLayer: (targetLayerId) => {
    return get().addLayer({
      type: 'mask',
      name: '遮罩',
      visible: true,
      locked: false,
      opacity: 0.5,
      x: 0,
      y: 0,
      width: get().canvasState.width,
      height: get().canvasState.height,
      rotation: 0,
      imageData: '',
      targetLayerId,
    } as Omit<MaskLayer, 'id' | 'zIndex'>);
  },

  updateMaskData: (id, imageData) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id && layer.type === 'mask' ? { ...layer, imageData } : layer
      ),
    }));
  },

  addDrawingLayer: () => {
    return get().addLayer({
      type: 'drawing',
      name: '繪圖',
      visible: true,
      locked: false,
      opacity: 1,
      x: 0,
      y: 0,
      width: get().canvasState.width,
      height: get().canvasState.height,
      rotation: 0,
      lines: [],
    } as Omit<DrawingLayer, 'id' | 'zIndex'>);
  },

  addLineToDrawing: (layerId, line) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId && layer.type === 'drawing'
          ? { ...layer, lines: [...layer.lines, line] }
          : layer
      ),
    }));
  },

  addShapeLayer: (shapeType, x, y, width, height) => {
    const shapeNames: Record<ShapeType, string> = {
      rectangle: '矩形',
      circle: '圓形',
      triangle: '三角形',
      star: '星形',
      arrow: '箭頭',
      hexagon: '六邊形',
    };
    return get().addLayer({
      type: 'shape',
      name: shapeNames[shapeType] || '形狀',
      visible: true,
      locked: false,
      opacity: 1,
      x,
      y,
      width,
      height,
      rotation: 0,
      shapeType,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
    } as Omit<ShapeLayer, 'id' | 'zIndex'>);
  },

  addMarkerLayer: (x, y) => {
    const currentCounter = get().markerCounter + 1;
    set({ markerCounter: currentCounter });
    return get().addLayer({
      type: 'marker',
      name: `標記 ${currentCounter}`,
      visible: true,
      locked: false,
      opacity: 1,
      x: x - 15, // 圓心偏移
      y: y - 15,
      width: 30,
      height: 30,
      rotation: 0,
      number: currentCounter,
      color: '#ef4444', // 紅色標記
    } as Omit<MarkerLayer, 'id' | 'zIndex'>);
  },

  resetMarkerCounter: () => {
    set({ markerCounter: 0 });
  },

  setCanvasSize: (width, height) => {
    set((state) => ({ canvasState: { ...state.canvasState, width, height } }));
    get().saveToHistory('調整畫布大小');
  },

  setZoom: (zoom) => {
    set((state) => ({
      canvasState: { ...state.canvasState, zoom: Math.max(0.1, Math.min(5, zoom)) },
    }));
  },

  setPan: (panX, panY) => {
    set((state) => ({ canvasState: { ...state.canvasState, panX, panY } }));
  },

  setBackgroundColor: (backgroundColor) => {
    set((state) => ({ canvasState: { ...state.canvasState, backgroundColor } }));
  },

  setTool: (tool) => set({ currentTool: tool }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushColor: (color) => set({ brushColor: color }),
  setEraserSize: (size) => set({ eraserSize: size }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),

  saveToHistory: (action) => {
    const { layers, canvasState, history, historyIndex } = get();
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      action,
      layers: JSON.parse(JSON.stringify(layers)),
      canvasState: { ...canvasState },
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      set({
        layers: JSON.parse(JSON.stringify(prevEntry.layers)),
        canvasState: { ...prevEntry.canvasState },
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      set({
        layers: JSON.parse(JSON.stringify(nextEntry.layers)),
        canvasState: { ...nextEntry.canvasState },
        historyIndex: historyIndex + 1,
      });
    }
  },

  exportCanvas: async () => '',
  clearCanvas: () => {
    set({ layers: [], selectedLayerId: null });
    get().saveToHistory('清除畫布');
  },

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find((l) => l.id === selectedLayerId) || null;
  },

  // 複製圖層
  copyLayer: () => {
    const { layers, selectedLayerId } = get();
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer) {
      set({ clipboard: JSON.parse(JSON.stringify(layer)) });
      console.log('已複製圖層:', layer.name);
    }
  },

  // 剪下圖層
  cutLayer: () => {
    const { layers, selectedLayerId, removeLayer } = get();
    const layer = layers.find((l) => l.id === selectedLayerId);
    if (layer) {
      set({ clipboard: JSON.parse(JSON.stringify(layer)) });
      removeLayer(layer.id);
      console.log('已剪下圖層:', layer.name);
    }
  },

  // 貼上圖層
  pasteLayer: () => {
    const { clipboard, addLayer } = get();
    if (clipboard) {
      const { id: _, zIndex: __, ...rest } = clipboard;
      addLayer({
        ...rest,
        name: `${clipboard.name} (複製)`,
        x: clipboard.x + 20,
        y: clipboard.y + 20,
      } as Omit<Layer, 'id' | 'zIndex'>);
      console.log('已貼上圖層:', clipboard.name);
    }
  },

  // 刪除選中的圖層
  deleteSelectedLayer: () => {
    const { selectedLayerId, removeLayer } = get();
    if (selectedLayerId) {
      removeLayer(selectedLayerId);
    }
  },

  // 全選（選擇第一個圖層，因為目前不支援多選）
  selectAllLayers: () => {
    const { layers } = get();
    if (layers.length > 0) {
      // 選擇最上層的圖層
      const topLayer = [...layers].sort((a, b) => b.zIndex - a.zIndex)[0];
      set({ selectedLayerId: topLayer.id });
      console.log('已選擇圖層:', topLayer.name);
    }
  },
}));
