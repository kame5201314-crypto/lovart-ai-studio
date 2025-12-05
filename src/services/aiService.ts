import type {
  TextToImageRequest,
  AIModel,
  AIModelConfig,
} from '../types';

// 不再需要前端 API Key！所有請求都透過後端 API 處理

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    description: 'fal.ai 高品質圖片生成',
    provider: 'fal.ai',
    capabilities: ['text-to-image'],
    maxResolution: 2048,
    available: true,
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'fal.ai 進階圖片生成',
    provider: 'fal.ai',
    capabilities: ['text-to-image', 'inpainting'],
    maxResolution: 4096,
    available: true,
  },
  {
    id: 'flux-pro',
    name: 'Flux.1 Pro',
    description: '高品質文生圖模型，支援複雜場景',
    provider: 'Black Forest Labs (fal.ai)',
    capabilities: ['text-to-image', 'inpainting'],
    maxResolution: 2048,
    available: true,
  },
  {
    id: 'flux-schnell',
    name: 'Flux.1 Schnell',
    description: '快速文生圖模型，適合快速預覽',
    provider: 'Black Forest Labs (fal.ai)',
    capabilities: ['text-to-image'],
    maxResolution: 1024,
    available: true,
  },
];

// ==================== 安全的 API 呼叫（透過後端） ====================

/**
 * 生成圖片 - 透過後端 API
 */
export async function generateImage(request: TextToImageRequest): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model,
        width: request.width,
        height: request.height,
        numOutputs: request.numOutputs || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '圖片生成失敗');
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error('generateImage 錯誤:', error);
    throw error;
  }
}

/**
 * AI 超清（圖片放大）- 透過後端 API
 */
export interface AISuperResolutionRequest {
  image: string;
  scale?: 2 | 4;
}

export async function aiSuperResolution(request: AISuperResolutionRequest): Promise<string> {
  try {
    const response = await fetch('/api/upscale-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: request.image,
        scale: request.scale || 2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '圖片放大失敗');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('aiSuperResolution 錯誤:', error);
    throw error;
  }
}

/**
 * AI 去背 - 透過後端 API
 */
export interface AIRemoveBackgroundRequest {
  image: string;
}

export async function aiRemoveBackground(request: AIRemoveBackgroundRequest): Promise<string> {
  try {
    const response = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: request.image,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '去背失敗');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('aiRemoveBackground 錯誤:', error);
    throw error;
  }
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

// ==================== 兼容性匯出（保持向後兼容） ====================

// 為了與現有程式碼相容，提供別名
export const removeBackground = aiRemoveBackground;
export const upscaleImage = aiSuperResolution;

// AI 對話類型（保持向後兼容）
export interface AIDesignChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// AI 設計對話（功能開發中）
export async function aiDesignChat(
  _messages: AIDesignChatMessage[],
  _referenceImage?: string
): Promise<string> {
  // 此功能尚未實作後端 API
  throw new Error('AI 設計對話功能開發中');
}

// ==================== 本地備用功能（不需要 API Key） ====================

/**
 * 使用 Pollinations.ai 免費生成（僅作為備用）
 */
export async function generateWithPollinations(
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<string[]> {
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      reject(new Error('圖片生成超時，請重試'));
    }, 60000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve([imageUrl]);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('圖片生成失敗，請重試'));
    };

    img.src = imageUrl;
  });
}
