import { GoogleGenAI } from '@google/genai';
import type {
  TextToImageRequest,
  AIModel,
  AIModelConfig,
} from '../types';

// ==================== Gemini API 設定 ====================
// 本地開發時直接使用 Gemini API，生產環境使用 Vercel 後端

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// 初始化 Gemini 客戶端（如果有 API Key）
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// 檢查是否在生產環境
const isProduction = import.meta.env.PROD;

// Gemini API 模型配置（僅此一個模型可用）
export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google Gemini 圖片生成，使用 gemini-2.5-flash-preview-image-generation',
    provider: 'Google',
    capabilities: ['text-to-image'],
    maxResolution: 2048,
    available: true,
  },
];

// ==================== 圖片生成 API ====================

// 使用 Gemini API 直接生成圖片
async function generateWithGemini(prompt: string): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini API Key 未設定。請在 .env.local 中設定 VITE_GEMINI_API_KEY');
  }

  console.log('=== 使用 Gemini API 生成圖片 ===');
  console.log('原始 Prompt:', prompt);

  // 優化提示詞：除非用戶明確要求文字，否則不加任何文字
  const hasTextRequest = /文字|字|text|word|letter|寫|標題|title|caption|label/i.test(prompt);

  const enhancedPrompt = hasTextRequest
    ? prompt  // 用戶要求文字，直接使用原始提示詞
    : `Generate a photorealistic, high-quality image. STRICTLY NO TEXT, NO WORDS, NO LETTERS, NO CHARACTERS, NO WATERMARKS, NO CAPTIONS anywhere on the image.

Image description: ${prompt}

CRITICAL: The image must be completely free of any text, letters, numbers, symbols, or written characters. Pure visual content only.`;

  console.log('優化後 Prompt:', enhancedPrompt);

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-image-generation',
      contents: enhancedPrompt,
      config: {
        responseModalities: ['Text', 'Image'] as ('Text' | 'Image')[],
      },
    });

    const images: string[] = [];

    // 解析回應中的圖片
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          // 將 base64 轉為 data URL
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          images.push(dataUrl);
        }
      }
    }

    if (images.length === 0) {
      throw new Error('Gemini 未返回圖片');
    }

    console.log(`成功生成 ${images.length} 張圖片`);
    return images;
  } catch (error: unknown) {
    console.error('Gemini API 錯誤:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Gemini API Key 無效或已過期');
    }
    throw error;
  }
}

// 使用後端 API 生成圖片（生產環境）
async function generateWithBackend(request: TextToImageRequest): Promise<string[]> {
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

  if (!data.images || data.images.length === 0) {
    throw new Error('未收到圖片結果');
  }

  return data.images;
}

export async function generateImage(request: TextToImageRequest): Promise<string[]> {
  console.log('=== generateImage 開始（Google 生態系）===');
  console.log('請求參數:', JSON.stringify(request, null, 2));
  console.log('環境:', isProduction ? '生產環境' : '本地開發');
  console.log('Gemini API Key:', GEMINI_API_KEY ? '已設定' : '未設定');

  try {
    // 所有模型都使用 Gemini API（Google 生態系）
    if (GEMINI_API_KEY) {
      return await generateWithGemini(request.prompt);
    }

    // 生產環境使用後端 API（後端也是呼叫 Gemini）
    if (isProduction) {
      return await generateWithBackend(request);
    }

    // 沒有 API Key
    throw new Error('請設定 VITE_GEMINI_API_KEY 環境變數');
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
  prompt?: string;
}

export async function inpaint(request: InpaintRequest): Promise<string> {
  console.log('=== inpaint 開始（使用後端 API） ===');

  try {
    // 處理 base64 圖片
    let imageUrl = request.image;
    let maskUrl = request.mask;

    // 上傳原圖
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

    // 上傳遮罩
    if (request.mask.startsWith('data:')) {
      const response = await fetch(request.mask);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, 'mask.png');

      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=demo', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        maskUrl = uploadData.data?.url || request.mask;
      }
    }

    const response = await fetch('/api/inpaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
        mask: maskUrl,
        prompt: request.prompt || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    console.log('Inpaint 結果:', data);

    if (!data.image) {
      throw new Error('未收到 Inpaint 結果');
    }

    return data.image;
  } catch (error) {
    console.error('Inpaint 錯誤:', error);
    throw error;
  }
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
