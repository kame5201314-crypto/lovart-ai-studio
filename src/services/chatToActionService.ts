// Chat-to-Action 服務 - 將自然語言指令轉換為畫布操作

export interface CanvasAction {
  type: 'update_style' | 'move' | 'resize' | 'delete' | 'duplicate' | 'generate' | 'inpaint' | 'outpaint' | 'remove_bg' | 'upscale' | 'rotate' | 'flip' | 'opacity' | 'unknown';
  target: 'all' | 'text' | 'image' | 'selected' | 'layer' | 'shape';
  layerId?: string;
  params?: Record<string, unknown>;
}

// 關鍵字映射表
const ACTION_KEYWORDS = {
  color: ['顏色', '色彩', 'color', '換色', '改色', '變色', '著色'],
  fontSize: ['字體', '字號', '字大小', 'font', 'size', '字體大小'],
  move: ['移動', '移到', '放到', 'move', '拖', '挪', '搬'],
  delete: ['刪除', '移除', '刪掉', 'delete', 'remove', '去掉', '清除'],
  duplicate: ['複製', '拷貝', 'copy', 'duplicate', '克隆', '複製一份'],
  generate: ['生成', '創建', '產生', 'generate', 'create', '畫', '製作'],
  inpaint: ['重繪', '修改區域', '換成', '替換', 'inpaint', 'replace', '修復'],
  outpaint: ['擴展', '延伸', '擴圖', 'outpaint', 'extend', '向外擴展'],
  remove_bg: ['去背', '去除背景', '移除背景', 'remove background', '摳圖', '透明背景'],
  upscale: ['放大', '超清', '高清化', 'upscale', '提升畫質', '增強', '超解析'],
  resize: ['調整大小', '縮放', 'resize', 'scale', '變大', '變小'],
  rotate: ['旋轉', '轉動', 'rotate', '轉向', '翻轉角度'],
  flip: ['翻轉', '鏡像', 'flip', 'mirror', '水平翻轉', '垂直翻轉'],
  opacity: ['透明度', '透明', 'opacity', '半透明', '不透明度'],
};

const TARGET_KEYWORDS = {
  text: ['文字', '文本', 'text', '字', '標題'],
  image: ['圖片', '圖像', 'image', '照片', '圖', '相片'],
  shape: ['形狀', '圖形', 'shape', '矩形', '圓形', '三角形'],
  all: ['所有', '全部', 'all', '每個', '整個'],
  selected: ['選中', '選取', 'selected', '當前', '這個'],
};

const COLOR_MAP: Record<string, string> = {
  '紅色': '#FF0000', '紅': '#FF0000', 'red': '#FF0000',
  '藍色': '#0000FF', '藍': '#0000FF', 'blue': '#0000FF',
  '綠色': '#00FF00', '綠': '#00FF00', 'green': '#00FF00',
  '深綠': '#006400', '墨綠': '#006400',
  '黃色': '#FFFF00', '黃': '#FFFF00', 'yellow': '#FFFF00',
  '白色': '#FFFFFF', '白': '#FFFFFF', 'white': '#FFFFFF',
  '黑色': '#000000', '黑': '#000000', 'black': '#000000',
  '橙色': '#FFA500', '橙': '#FFA500', 'orange': '#FFA500',
  '紫色': '#800080', '紫': '#800080', 'purple': '#800080',
  '粉色': '#FFC0CB', '粉': '#FFC0CB', 'pink': '#FFC0CB',
  '粉紅': '#FF69B4', '桃紅': '#FF69B4',
  '灰色': '#808080', '灰': '#808080', 'gray': '#808080',
  '淺灰': '#D3D3D3', '深灰': '#696969',
  '棕色': '#8B4513', '棕': '#8B4513', 'brown': '#8B4513',
  '金色': '#FFD700', '金': '#FFD700', 'gold': '#FFD700',
  '銀色': '#C0C0C0', '銀': '#C0C0C0', 'silver': '#C0C0C0',
  '青色': '#00FFFF', '青': '#00FFFF', 'cyan': '#00FFFF',
  '深藍': '#00008B', '藏藍': '#00008B',
  '淺藍': '#87CEEB', '天藍': '#87CEEB',
  '酒紅': '#722F37', '暗紅': '#8B0000',
  '橄欖': '#808000', '軍綠': '#556B2F',
  '珊瑚': '#FF7F50', '番茄': '#FF6347',
};

const POSITION_MAP: Record<string, { x: number | 'center'; y: number | 'center' }> = {
  '左上': { x: 0, y: 0 },
  '上方': { x: 'center', y: 0 },
  '右上': { x: 1, y: 0 },
  '左邊': { x: 0, y: 'center' },
  '左側': { x: 0, y: 'center' },
  '中間': { x: 'center', y: 'center' },
  '中央': { x: 'center', y: 'center' },
  '置中': { x: 'center', y: 'center' },
  'center': { x: 'center', y: 'center' },
  '右邊': { x: 1, y: 'center' },
  '右側': { x: 1, y: 'center' },
  '左下': { x: 0, y: 1 },
  '下方': { x: 'center', y: 1 },
  '右下': { x: 1, y: 1 },
};

const DIRECTION_MAP: Record<string, { dx: number; dy: number }> = {
  '向上': { dx: 0, dy: -50 },
  '往上': { dx: 0, dy: -50 },
  '上移': { dx: 0, dy: -50 },
  '向下': { dx: 0, dy: 50 },
  '往下': { dx: 0, dy: 50 },
  '下移': { dx: 0, dy: 50 },
  '向左': { dx: -50, dy: 0 },
  '往左': { dx: -50, dy: 0 },
  '左移': { dx: -50, dy: 0 },
  '向右': { dx: 50, dy: 0 },
  '往右': { dx: 50, dy: 0 },
  '右移': { dx: 50, dy: 0 },
};

// 解析自然語言指令
export const parseCommand = (input: string): CanvasAction => {
  const lowerInput = input.toLowerCase();

  // 檢測動作類型
  let actionType: CanvasAction['type'] = 'unknown';

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(kw => input.includes(kw))) {
      actionType = action as CanvasAction['type'];
      break;
    }
  }

  // 檢測目標
  let target: CanvasAction['target'] = 'selected';

  for (const [t, keywords] of Object.entries(TARGET_KEYWORDS)) {
    if (keywords.some(kw => input.includes(kw))) {
      target = t as CanvasAction['target'];
      break;
    }
  }

  // 解析參數
  const params: Record<string, unknown> = {};

  // 顏色檢測
  for (const [colorName, colorValue] of Object.entries(COLOR_MAP)) {
    if (input.includes(colorName)) {
      params.color = colorValue;
      if (actionType === 'unknown') actionType = 'update_style';
      break;
    }
  }

  // 字體大小檢測
  const fontSizeMatch = input.match(/(\d+)(px|像素|號)?/);
  if (fontSizeMatch && (input.includes('字') || input.includes('font'))) {
    params.fontSize = parseInt(fontSizeMatch[1]);
    if (actionType === 'unknown') actionType = 'update_style';
  }

  // 放大縮小倍數檢測
  const scaleMatch = input.match(/(\d+\.?\d*)倍/);
  if (scaleMatch) {
    params.scale = parseFloat(scaleMatch[1]);
    if (actionType === 'unknown') actionType = 'resize';
  } else if (input.includes('放大') || input.includes('變大')) {
    params.scale = 1.5;
    if (actionType === 'unknown') actionType = 'resize';
  } else if (input.includes('縮小') || input.includes('變小')) {
    params.scale = 0.75;
    if (actionType === 'unknown') actionType = 'resize';
  }

  // 超清倍數檢測
  if (actionType === 'upscale') {
    const upscaleMatch = input.match(/(2|4)[xX倍]/);
    params.upscaleLevel = upscaleMatch ? parseInt(upscaleMatch[1]) : 2;
  }

  // 位置檢測
  for (const [posName, posValue] of Object.entries(POSITION_MAP)) {
    if (input.includes(posName)) {
      params.position = posValue;
      if (actionType === 'unknown') actionType = 'move';
      break;
    }
  }

  // 方向移動檢測
  for (const [dirName, dirValue] of Object.entries(DIRECTION_MAP)) {
    if (input.includes(dirName)) {
      params.direction = dirValue;
      if (actionType === 'unknown') actionType = 'move';
      break;
    }
  }

  // 旋轉角度檢測
  const rotateMatch = input.match(/(\d+)(度|°)/);
  if (rotateMatch && (input.includes('旋轉') || input.includes('轉'))) {
    params.angle = parseInt(rotateMatch[1]);
    if (actionType === 'unknown') actionType = 'rotate';
  } else if (input.includes('順時針')) {
    params.angle = 90;
    actionType = 'rotate';
  } else if (input.includes('逆時針')) {
    params.angle = -90;
    actionType = 'rotate';
  }

  // 翻轉方向檢測
  if (actionType === 'flip') {
    if (input.includes('水平') || input.includes('左右')) {
      params.direction = 'horizontal';
    } else if (input.includes('垂直') || input.includes('上下')) {
      params.direction = 'vertical';
    } else {
      params.direction = 'horizontal'; // 默認水平翻轉
    }
  }

  // 透明度檢測
  const opacityMatch = input.match(/(\d+)(%|%)/);
  if (opacityMatch && (input.includes('透明') || input.includes('opacity'))) {
    params.opacity = parseInt(opacityMatch[1]) / 100;
    if (actionType === 'unknown') actionType = 'opacity';
  } else if (input.includes('半透明')) {
    params.opacity = 0.5;
    if (actionType === 'unknown') actionType = 'opacity';
  }

  // 擴圖方向檢測
  if (actionType === 'outpaint') {
    if (input.includes('向上') || input.includes('往上')) {
      params.outpaintDirection = 'up';
    } else if (input.includes('向下') || input.includes('往下')) {
      params.outpaintDirection = 'down';
    } else if (input.includes('向左') || input.includes('往左')) {
      params.outpaintDirection = 'left';
    } else if (input.includes('向右') || input.includes('往右')) {
      params.outpaintDirection = 'right';
    } else {
      params.outpaintDirection = 'all';
    }
  }

  // 保存原始輸入作為生成提示詞
  if (actionType === 'generate' || actionType === 'inpaint') {
    params.prompt = input;
  }

  return { type: actionType, target, params };
};

// 執行動作的輔助函數
export interface LayerData {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  fill?: string;
  fontSize?: number;
  [key: string]: unknown;
}

export interface ActionCallbacks {
  updateLayer: (id: string, updates: Record<string, unknown>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  generateImage?: (prompt: string) => Promise<void>;
  inpaint?: (layerId: string, prompt: string) => Promise<void>;
  outpaint?: (layerId: string, direction: string) => Promise<void>;
  removeBackground?: (layerId: string) => Promise<void>;
  upscale?: (layerId: string, level: number) => Promise<void>;
  canvasWidth: number;
  canvasHeight: number;
}

export const executeAction = (
  action: CanvasAction,
  callbacks: ActionCallbacks,
  layers: LayerData[],
  selectedLayerId: string | null
): { success: boolean; message: string; requiresAsync?: boolean } => {
  const targetLayers = getTargetLayers(action.target, layers, selectedLayerId);

  if (targetLayers.length === 0 && action.type !== 'generate') {
    return { success: false, message: '找不到目標圖層，請先選擇一個圖層' };
  }

  const { updateLayer, deleteLayer, duplicateLayer, canvasWidth, canvasHeight } = callbacks;

  switch (action.type) {
    case 'update_style':
      targetLayers.forEach(layer => {
        const updates: Record<string, unknown> = {};
        if (action.params?.color) updates.fill = action.params.color;
        if (action.params?.fontSize) updates.fontSize = action.params.fontSize;
        updateLayer(layer.id, updates);
      });
      return { success: true, message: `已更新 ${targetLayers.length} 個圖層的樣式` };

    case 'resize':
      targetLayers.forEach(layer => {
        const scale = action.params?.scale as number || 1;
        updateLayer(layer.id, {
          width: layer.width * scale,
          height: layer.height * scale,
        });
      });
      return { success: true, message: `已調整 ${targetLayers.length} 個圖層的大小` };

    case 'move':
      targetLayers.forEach(layer => {
        let newX = layer.x;
        let newY = layer.y;

        // 如果有指定位置
        if (action.params?.position) {
          const pos = action.params.position as { x: number | 'center'; y: number | 'center' };
          if (pos.x === 'center') {
            newX = (canvasWidth - layer.width) / 2;
          } else {
            newX = pos.x === 0 ? 20 : (canvasWidth - layer.width - 20);
          }
          if (pos.y === 'center') {
            newY = (canvasHeight - layer.height) / 2;
          } else {
            newY = pos.y === 0 ? 20 : (canvasHeight - layer.height - 20);
          }
        }

        // 如果有指定方向移動
        if (action.params?.direction) {
          const dir = action.params.direction as { dx: number; dy: number };
          newX = layer.x + dir.dx;
          newY = layer.y + dir.dy;
        }

        updateLayer(layer.id, { x: newX, y: newY });
      });
      return { success: true, message: `已移動 ${targetLayers.length} 個圖層` };

    case 'rotate':
      targetLayers.forEach(layer => {
        const currentRotation = layer.rotation || 0;
        const angle = action.params?.angle as number || 90;
        updateLayer(layer.id, { rotation: currentRotation + angle });
      });
      return { success: true, message: `已旋轉 ${targetLayers.length} 個圖層` };

    case 'flip':
      targetLayers.forEach(layer => {
        const direction = action.params?.direction as string;
        if (direction === 'horizontal') {
          updateLayer(layer.id, { scaleX: (layer.scaleX as number || 1) * -1 });
        } else {
          updateLayer(layer.id, { scaleY: (layer.scaleY as number || 1) * -1 });
        }
      });
      return { success: true, message: `已翻轉 ${targetLayers.length} 個圖層` };

    case 'opacity':
      targetLayers.forEach(layer => {
        const opacity = action.params?.opacity as number || 1;
        updateLayer(layer.id, { opacity });
      });
      return { success: true, message: `已調整 ${targetLayers.length} 個圖層的透明度` };

    case 'delete':
      targetLayers.forEach(layer => {
        deleteLayer(layer.id);
      });
      return { success: true, message: `已刪除 ${targetLayers.length} 個圖層` };

    case 'duplicate':
      targetLayers.forEach(layer => {
        duplicateLayer(layer.id);
      });
      return { success: true, message: `已複製 ${targetLayers.length} 個圖層` };

    case 'generate':
      if (callbacks.generateImage && action.params?.prompt) {
        callbacks.generateImage(action.params.prompt as string);
        return { success: true, message: '正在生成圖片...', requiresAsync: true };
      }
      return { success: false, message: '生成功能未配置' };

    case 'inpaint':
      if (callbacks.inpaint && targetLayers.length > 0 && action.params?.prompt) {
        callbacks.inpaint(targetLayers[0].id, action.params.prompt as string);
        return { success: true, message: '正在重繪選定區域...', requiresAsync: true };
      }
      return { success: false, message: '請選擇要重繪的圖層' };

    case 'outpaint':
      if (callbacks.outpaint && targetLayers.length > 0) {
        const direction = action.params?.outpaintDirection as string || 'all';
        callbacks.outpaint(targetLayers[0].id, direction);
        return { success: true, message: '正在擴展圖片...', requiresAsync: true };
      }
      return { success: false, message: '請選擇要擴展的圖片' };

    case 'remove_bg':
      if (callbacks.removeBackground && targetLayers.length > 0) {
        callbacks.removeBackground(targetLayers[0].id);
        return { success: true, message: '正在去除背景...', requiresAsync: true };
      }
      return { success: false, message: '請選擇要去背的圖片' };

    case 'upscale':
      if (callbacks.upscale && targetLayers.length > 0) {
        const level = action.params?.upscaleLevel as number || 2;
        callbacks.upscale(targetLayers[0].id, level);
        return { success: true, message: `正在進行 ${level}x 超清處理...`, requiresAsync: true };
      }
      return { success: false, message: '請選擇要超清的圖片' };

    default:
      return { success: false, message: '無法識別的指令' };
  }
};

// 獲取目標圖層
const getTargetLayers = (
  target: CanvasAction['target'],
  layers: LayerData[],
  selectedLayerId: string | null
): LayerData[] => {
  switch (target) {
    case 'all':
      return layers;
    case 'text':
      return layers.filter(l => l.type === 'text');
    case 'image':
      return layers.filter(l => l.type === 'image');
    case 'shape':
      return layers.filter(l => l.type === 'shape');
    case 'selected':
    case 'layer':
      return selectedLayerId ? layers.filter(l => l.id === selectedLayerId) : [];
    default:
      return [];
  }
};

// 生成回應訊息
export const generateResponse = (action: CanvasAction): string => {
  const targetText = getTargetText(action.target);

  switch (action.type) {
    case 'update_style':
      const styleChanges: string[] = [];
      if (action.params?.color) styleChanges.push(`顏色改為 ${getColorName(action.params.color as string)}`);
      if (action.params?.fontSize) styleChanges.push(`字體大小改為 ${action.params.fontSize}px`);
      return `好的，我會幫你${styleChanges.join('，')}${targetText}。`;
    case 'move':
      if (action.params?.position) {
        return `正在將${targetText}移動到指定位置...`;
      }
      return `正在移動${targetText}...`;
    case 'resize':
      const scale = action.params?.scale as number;
      if (scale) {
        return scale > 1
          ? `正在將${targetText}放大 ${scale} 倍...`
          : `正在將${targetText}縮小至 ${Math.round(scale * 100)}%...`;
      }
      return `正在調整${targetText}的大小...`;
    case 'rotate':
      return `正在旋轉${targetText} ${action.params?.angle || 90} 度...`;
    case 'flip':
      const flipDir = action.params?.direction === 'horizontal' ? '水平' : '垂直';
      return `正在${flipDir}翻轉${targetText}...`;
    case 'opacity':
      return `正在調整${targetText}的透明度為 ${Math.round((action.params?.opacity as number || 1) * 100)}%...`;
    case 'delete':
      return `確定要刪除${targetText}嗎？已執行刪除操作。`;
    case 'duplicate':
      return `已複製${targetText}。`;
    case 'generate':
      return '正在根據您的描述生成圖片，請稍候...';
    case 'inpaint':
      return '正在重繪選定區域，請稍候...';
    case 'outpaint':
      const outDir = getOutpaintDirectionText(action.params?.outpaintDirection as string);
      return `正在${outDir}擴展圖片，請稍候...`;
    case 'remove_bg':
      return '正在去除背景，請稍候...';
    case 'upscale':
      return `正在進行 ${action.params?.upscaleLevel || 2}x 超清處理，請稍候...`;
    default:
      return `抱歉，我不太理解這個指令。您可以嘗試：
• 把文字改成紅色
• 放大選中的圖片 1.5 倍
• 把圖片移到中間
• 旋轉 45 度
• 水平翻轉
• 透明度設為 50%
• 去除背景
• 超清 2 倍
• 刪除所有文字
• 生成一張日落海灘的圖片`;
  }
};

// 獲取目標文字描述
const getTargetText = (target: CanvasAction['target']): string => {
  switch (target) {
    case 'all':
      return '所有圖層';
    case 'text':
      return '文字圖層';
    case 'image':
      return '圖片圖層';
    case 'shape':
      return '形狀圖層';
    case 'selected':
    case 'layer':
    default:
      return '選中的圖層';
  }
};

// 獲取顏色名稱
const getColorName = (colorValue: string): string => {
  for (const [name, value] of Object.entries(COLOR_MAP)) {
    if (value.toLowerCase() === colorValue.toLowerCase()) {
      return name;
    }
  }
  return colorValue;
};

// 獲取擴圖方向文字
const getOutpaintDirectionText = (direction: string): string => {
  switch (direction) {
    case 'up': return '向上';
    case 'down': return '向下';
    case 'left': return '向左';
    case 'right': return '向右';
    default: return '四周';
  }
};

// 快捷指令檢測
export const isQuickCommand = (input: string): boolean => {
  const quickCommands = [
    '去背', '去除背景', '超清', '放大', '縮小',
    '刪除', '複製', '旋轉', '翻轉', '置中',
  ];
  return quickCommands.some(cmd => input.includes(cmd));
};

// 建議的後續操作
export const getSuggestedActions = (action: CanvasAction): string[] => {
  switch (action.type) {
    case 'generate':
      return ['去背', '超清 2 倍', '調整大小', '移到中間'];
    case 'remove_bg':
      return ['添加新背景', '調整位置', '縮放大小'];
    case 'upscale':
      return ['下載圖片', '添加文字', '繼續編輯'];
    case 'duplicate':
      return ['移動副本', '調整大小', '修改顏色'];
    default:
      return [];
  }
};

export default { parseCommand, executeAction, generateResponse, isQuickCommand, getSuggestedActions };
