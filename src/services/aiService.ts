import type {
  TextToImageRequest,
  AIModel,
  AIModelConfig,
} from '../types';

// ==================== 安全的後端 API 調用 ====================
// 注意：所有 API Key 都保存在 Vercel 後端，不會暴露到前端

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    description: 'fal.ai 快速圖片生成',
    provider: 'fal.ai',
    capabilities: ['text-to-image'],
    maxResolution: 2048,
    available: true,
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'fal.ai 進階圖片生成，支援更高解析度',
    provider: 'fal.ai',
    capabilities: ['text-to-image', 'inpainting'],
    maxResolution: 4096,
    available: true,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google Gemini 圖片生成（需要後端支援）',
    provider: 'Google',
    capabilities: ['text-to-image'],
    maxResolution: 2048,
    available: true,
  },
];

// ==================== 圖片生成 API ====================

export async function generateImage(request: TextToImageRequest): Promise<string[]> {
  console.log('=== generateImage 開始（使用後端 API） ===');
  console.log('請求參數:', JSON.stringify(request, null, 2));

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model,
        width: request.width || 1024,
        height: request.height || 1024,
        numOutputs: request.numOutputs || 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    console.log('生成結果:', data);

    if (!data.images || data.images.length === 0) {
      throw new Error('未收到圖片結果');
    }

    return data.images;
  } catch (error) {
    console.error('圖片生成錯誤:', error);
    throw error;
  }
}

// ==================== 圖片超清 API ====================

export interface AISuperResolutionRequest {
  image: string;
  scale?: 2 | 4;
}

export async function aiSuperResolution(request: AISuperResolutionRequest): Promise<string> {
  console.log('=== aiSuperResolution 開始（使用後端 API） ===');

  try {
    // 處理 base64 圖片 - 上傳並獲取 URL
    let imageUrl = request.image;
    if (request.image.startsWith('data:')) {
      // 將 base64 轉換為 blob 並上傳
      const response = await fetch(request.image);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'image.png');

      // 使用免費圖床服務
      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=demo', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.data?.url || request.image;
      }
    }

    const response = await fetch('/api/upscale-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
        scale: request.scale || 2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    console.log('超清結果:', data);

    if (!data.image) {
      throw new Error('未收到超清結果');
    }

    return data.image;
  } catch (error) {
    console.error('圖片超清錯誤:', error);
    throw error;
  }
}

// ==================== 去背 API ====================

export interface AIRemoveBackgroundRequest {
  image: string;
  mode?: 'auto' | 'portrait' | 'product';
}

export async function aiRemoveBackground(request: AIRemoveBackgroundRequest): Promise<string> {
  console.log('=== aiRemoveBackground 開始（使用後端 API） ===');

  try {
    // 處理 base64 圖片
    let imageUrl = request.image;
    if (request.image.startsWith('data:')) {
      const response = await fetch(request.image);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'image.png');

      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=demo', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.data?.url || request.image;
      }
    }

    const response = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    console.log('去背結果:', data);

    if (!data.image) {
      throw new Error('未收到去背結果');
    }

    return data.image;
  } catch (error) {
    console.error('去背錯誤:', error);
    throw error;
  }
}

// ==================== 兼容性匯出 ====================

export const removeBackground = aiRemoveBackground;
export const upscaleImage = aiSuperResolution;

// ==================== 功能開發中的 API（stub） ====================

export interface AIEditImageRequest {
  image: string;
  prompt: string;
}

export async function aiEditImage(_request: AIEditImageRequest): Promise<string[]> {
  throw new Error('AI 改圖功能開發中');
}

export interface AIOutpaintRequest {
  image: string;
  direction: 'up' | 'down' | 'left' | 'right' | 'all';
  prompt?: string;
}

export async function aiOutpaint(_request: AIOutpaintRequest): Promise<string[]> {
  throw new Error('AI 擴圖功能開發中');
}

export interface AITextReplaceRequest {
  image: string;
  originalText: string;
  newText: string;
}

export async function aiTextReplace(_request: AITextReplaceRequest): Promise<string[]> {
  throw new Error('AI 無痕改字功能開發中');
}

export interface InpaintRequest {
  image: string;
  mask: string;
  prompt: string;
  model?: string;
}

export async function inpaint(_request: InpaintRequest): Promise<string[]> {
  throw new Error('Inpaint 功能開發中');
}

// AI 對話類型（保持向後兼容）
export interface AIDesignChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// AI 設計對話（功能開發中）
export async function aiDesignChat(
  _messages: AIDesignChatMessage[],
  _referenceImage?: string
): Promise<{ message: string; images?: string[] }> {
  throw new Error('AI 設計對話功能開發中');
}

// ==================== 輔助函數 ====================

export function getModelConfig(modelId: AIModel): AIModelConfig | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function getAvailableModels(): AIModelConfig[] {
  return AI_MODELS.filter((m) => m.available);
}

export function modelSupports(
  modelId: AIModel,
  capability: 'text-to-image' | 'inpainting' | 'outpainting' | 'upscale' | 'video'
): boolean {
  const config = getModelConfig(modelId);
  return config?.capabilities.includes(capability) || false;
}
