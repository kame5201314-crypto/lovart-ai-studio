// Chat-to-Action 服務 - 將自然語言指令轉換為畫布操作

export interface CanvasAction {
  type: 'update_style' | 'move' | 'resize' | 'delete' | 'duplicate' | 'generate' | 'inpaint' | 'unknown';
  target: 'all' | 'text' | 'image' | 'selected' | 'layer';
  layerId?: string;
  params?: Record<string, unknown>;
}

// 關鍵字映射表
const ACTION_KEYWORDS = {
  color: ['顏色', '色彩', 'color', '換色', '改色', '變色'],
  fontSize: ['字體', '字號', '字大小', 'font', 'size', '放大', '縮小', '大小'],
  move: ['移動', '移到', '放到', 'move', '拖', '挪'],
  delete: ['刪除', '移除', '刪掉', 'delete', 'remove', '去掉'],
  duplicate: ['複製', '拷貝', 'copy', 'duplicate', '克隆'],
  generate: ['生成', '創建', '產生', 'generate', 'create', '畫'],
  inpaint: ['重繪', '修改', '換成', '替換', 'inpaint', 'replace'],
  resize: ['調整大小', '縮放', 'resize', 'scale'],
};

const TARGET_KEYWORDS = {
  text: ['文字', '文本', 'text', '字'],
  image: ['圖片', '圖像', 'image', '照片', '圖'],
  all: ['所有', '全部', 'all', '每個'],
  selected: ['選中', '選取', 'selected', '當前'],
};

const COLOR_MAP: Record<string, string> = {
  '紅色': '#FF0000', '紅': '#FF0000', 'red': '#FF0000',
  '藍色': '#0000FF', '藍': '#0000FF', 'blue': '#0000FF',
  '綠色': '#00FF00', '綠': '#00FF00', 'green': '#00FF00',
  '黃色': '#FFFF00', '黃': '#FFFF00', 'yellow': '#FFFF00',
  '白色': '#FFFFFF', '白': '#FFFFFF', 'white': '#FFFFFF',
  '黑色': '#000000', '黑': '#000000', 'black': '#000000',
  '橙色': '#FFA500', '橙': '#FFA500', 'orange': '#FFA500',
  '紫色': '#800080', '紫': '#800080', 'purple': '#800080',
  '粉色': '#FFC0CB', '粉': '#FFC0CB', 'pink': '#FFC0CB',
  '灰色': '#808080', '灰': '#808080', 'gray': '#808080',
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

  // 放大縮小檢測
  if (input.includes('放大') || input.includes('變大')) {
    params.scale = 1.5;
    if (actionType === 'unknown') actionType = 'resize';
  } else if (input.includes('縮小') || input.includes('變小')) {
    params.scale = 0.75;
    if (actionType === 'unknown') actionType = 'resize';
  }

  return { type: actionType, target, params };
};

// 執行動作的輔助函數
export const executeAction = (
  action: CanvasAction,
  updateLayer: (id: string, updates: Record<string, unknown>) => void,
  layers: Array<{ id: string; type: string; [key: string]: unknown }>,
  selectedLayerId: string | null
): { success: boolean; message: string } => {
  const targetLayers = getTargetLayers(action.target, layers, selectedLayerId);

  if (targetLayers.length === 0) {
    return { success: false, message: '找不到目標圖層' };
  }

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
        const currentWidth = (layer.width as number) || 100;
        const currentHeight = (layer.height as number) || 100;
        updateLayer(layer.id, {
          width: currentWidth * scale,
          height: currentHeight * scale,
        });
      });
      return { success: true, message: `已調整 ${targetLayers.length} 個圖層的大小` };

    case 'delete':
      return { success: true, message: `將刪除 ${targetLayers.length} 個圖層（需確認）` };

    case 'duplicate':
      return { success: true, message: `將複製 ${targetLayers.length} 個圖層` };

    default:
      return { success: false, message: '無法識別的指令' };
  }
};

// 獲取目標圖層
const getTargetLayers = (
  target: CanvasAction['target'],
  layers: Array<{ id: string; type: string; [key: string]: unknown }>,
  selectedLayerId: string | null
) => {
  switch (target) {
    case 'all':
      return layers;
    case 'text':
      return layers.filter(l => l.type === 'text');
    case 'image':
      return layers.filter(l => l.type === 'image');
    case 'selected':
      return selectedLayerId ? layers.filter(l => l.id === selectedLayerId) : [];
    default:
      return [];
  }
};

// 生成回應訊息
export const generateResponse = (action: CanvasAction): string => {
  switch (action.type) {
    case 'update_style':
      return `好的，我會幫你更新${action.target === 'all' ? '所有' : action.target === 'text' ? '文字' : '選中'}圖層的樣式。`;
    case 'move':
      return '正在移動圖層...';
    case 'resize':
      return '正在調整大小...';
    case 'delete':
      return '確定要刪除嗎？';
    case 'duplicate':
      return '正在複製圖層...';
    case 'generate':
      return '正在生成圖片，請稍候...';
    case 'inpaint':
      return '正在重繪選定區域...';
    default:
      return '抱歉，我不太理解這個指令。您可以嘗試：\n- 把文字改成紅色\n- 放大選中的圖片\n- 刪除所有文字';
  }
};

export default { parseCommand, executeAction, generateResponse };
