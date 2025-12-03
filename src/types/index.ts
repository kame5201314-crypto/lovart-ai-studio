// 圖層類型定義
export type LayerType = 'image' | 'text' | 'mask' | 'drawing' | 'shape' | 'marker';

// 形狀類型
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star' | 'arrow' | 'hexagon';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  originalSrc?: string; // 原始圖片（去背前）
  filters?: ImageFilters;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface MaskLayer extends BaseLayer {
  type: 'mask';
  imageData: string; // Base64 黑白 mask
  targetLayerId?: string; // 關聯的圖片層
}

export interface DrawingLayer extends BaseLayer {
  type: 'drawing';
  lines: DrawingLine[];
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface MarkerLayer extends BaseLayer {
  type: 'marker';
  number: number; // 標記數字
  color: string; // 標記顏色
}

export interface DrawingLine {
  points: number[];
  stroke: string;
  strokeWidth: number;
  tension: number;
  lineCap: 'round' | 'butt' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export type Layer = ImageLayer | TextLayer | MaskLayer | DrawingLayer | ShapeLayer | MarkerLayer;

// 工具類型
export type ToolType =
  | 'select'
  | 'move'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'arrow'
  | 'hexagon'
  | 'ellipse'
  | 'mask'
  | 'inpaint'
  | 'marker'; // 標記工具

// AI 模型定義
export type AIModel =
  | 'gemini-flash'
  | 'nano-banana'
  | 'nano-banana-pro'
  | 'flux-pro'
  | 'flux-schnell'
  | 'sdxl'
  | 'midjourney'
  | 'runway'
  | 'sora'
  | 'veo';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  description: string;
  provider: string;
  capabilities: ('text-to-image' | 'inpainting' | 'outpainting' | 'upscale' | 'video')[];
  maxResolution: number;
  available: boolean;
}

// AI 請求類型
export interface TextToImageRequest {
  prompt: string;
  negativePrompt?: string;
  model: AIModel;
  width: number;
  height: number;
  numOutputs?: number;
  guidance?: number;
  steps?: number;
}

export interface InpaintRequest {
  image: string; // Base64
  mask: string; // Base64
  prompt: string;
  model: AIModel;
}

export interface OutpaintRequest {
  image: string;
  direction: 'left' | 'right' | 'up' | 'down' | 'all';
  expandSize: number;
  prompt?: string;
  model: AIModel;
}

export interface RemoveBackgroundRequest {
  image: string;
}

export interface UpscaleRequest {
  image: string;
  scale: 2 | 4;
}

// 畫布狀態
export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  backgroundColor: string;
}

// 歷史記錄
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  layers: Layer[];
  canvasState: CanvasState;
}

// 專案
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  layers: Layer[];
  canvasState: CanvasState;
  history: HistoryEntry[];
}
