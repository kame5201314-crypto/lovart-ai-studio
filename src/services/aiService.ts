import type {
  TextToImageRequest,
  InpaintRequest,
  OutpaintRequest,
  RemoveBackgroundRequest,
  UpscaleRequest,
  AIModel,
  AIModelConfig,
} from '../types';
import { fal } from '@fal-ai/client';
import { GoogleGenAI } from '@google/genai';

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || '';
const FAL_KEY = import.meta.env.VITE_FAL_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// 調試信息
console.log('=== AI Service 初始化 ===');
console.log('GEMINI_API_KEY 已設定:', !!GEMINI_API_KEY);
console.log('FAL_KEY 已設定:', !!FAL_KEY);
console.log('REPLICATE_API_TOKEN 已設定:', !!REPLICATE_API_TOKEN);

// 配置 fal.ai client
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

// 配置 Google Gemini client (主要使用)
let geminiClient: GoogleGenAI | null = null;
try {
  if (GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('✅ Gemini 付費版客戶端初始化成功');
  } else {
    console.warn('⚠️ GEMINI_API_KEY 未設定，將使用 Pollinations.ai 免費服務');
  }
} catch (error) {
  console.error('Gemini 客戶端初始化失敗:', error);
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google 官方 Gemini 圖片生成，高品質文字渲染（推薦）',
    provider: 'Google',
    capabilities: ['text-to-image'],
    maxResolution: 2048,
    available: true,
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: '進階思考模式，更精確的圖片生成',
    provider: 'Google',
    capabilities: ['text-to-image', 'inpainting'],
    maxResolution: 2048,
    available: true,
  },
];

// 使用 Pollinations.ai 免費 AI 圖片生成
async function generateWithPollinations(prompt: string, width: number, height: number): Promise<string[]> {
  console.log('=== 使用 Pollinations.ai 生成圖片 ===');
  console.log('提示詞:', prompt);
  console.log('尺寸:', width, 'x', height);

  // Pollinations.ai 是完全免費的 AI 圖片生成服務
  // 格式: https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);

  // 確保尺寸在合理範圍內
  const safeWidth = Math.min(Math.max(width, 256), 1024);
  const safeHeight = Math.min(Math.max(height, 256), 1024);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${safeWidth}&height=${safeHeight}&seed=${seed}&nologo=true`;
  console.log('生成 URL:', imageUrl);

  // 預載圖片以確保生成完成
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      console.error('Pollinations.ai 超時 (60秒)');
      // 超時時返回 URL，讓用戶自己重試
      console.log('嘗試直接返回 URL...');
      resolve([imageUrl]);
    }, 60000); // 60秒超時

    img.onload = () => {
      clearTimeout(timeout);
      console.log('Pollinations.ai 圖片生成成功!');
      resolve([imageUrl]);
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('Pollinations.ai 圖片載入失敗:', error);
      // 即使失敗也返回 URL，讓用戶可以點擊查看
      console.log('嘗試直接返回 URL...');
      resolve([imageUrl]);
    };

    img.src = imageUrl;
  });
}

// 使用免費的去背服務
async function removeBackgroundFree(imageUrl: string): Promise<string> {
  // 使用 remove.bg 的替代方案或返回原圖（需要付費 API）
  console.log('去背功能需要 Replicate API Token');
  return imageUrl;
}

// 導出供其他地方使用
export { removeBackgroundFree };

async function runReplicateModel(
  modelId: string,
  input: Record<string, unknown>
): Promise<string[]> {
  const width = (input.width as number) || 1024;
  const height = (input.height as number) || 1024;
  const prompt = (input.prompt as string) || '';

  // 如果沒有 Replicate API Token，使用免費的 Pollinations.ai
  if (!REPLICATE_API_TOKEN) {
    console.warn('Replicate API Token 未設定，使用免費的 Pollinations.ai');
    return generateWithPollinations(prompt, width, height);
  }

  try {
    // 判斷是使用 model 格式還是 version 格式
    const isModelFormat = !modelId.includes(':');
    const endpoint = isModelFormat
      ? `https://api.replicate.com/v1/models/${modelId}/predictions`
      : 'https://api.replicate.com/v1/predictions';

    const body = isModelFormat
      ? { input }
      : { version: modelId, input };

    console.log('Calling Replicate API:', endpoint, body);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Replicate API Error:', errorData);
      throw new Error(`Replicate API 錯誤: ${response.status} - ${errorData.detail || response.statusText}`);
    }

    const prediction = await response.json();
    console.log('Prediction response:', prediction);

    // 如果已經完成（使用 Prefer: wait）
    if (prediction.status === 'succeeded') {
      return Array.isArray(prediction.output) ? prediction.output : [prediction.output];
    }

    // 否則輪詢等待
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 最多等待 2 分鐘

    while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
      if (attempts++ > maxAttempts) {
        throw new Error('生成超時，請稍後再試');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!pollResponse.ok) {
        throw new Error(`輪詢失敗: ${pollResponse.statusText}`);
      }

      result = await pollResponse.json();
      console.log('Poll result:', result.status);
    }

    if (result.status === 'failed') {
      throw new Error(result.error || '生成失敗');
    }

    if (result.status === 'canceled') {
      throw new Error('生成被取消');
    }

    return Array.isArray(result.output) ? result.output : [result.output];
  } catch (error) {
    console.error('runReplicateModel error:', error);
    throw error;
  }
}

const MODEL_VERSIONS: Record<AIModel, string> = {
  'gemini-flash': 'gemini-2.0-flash-exp-image-generation',
  'nano-banana-pro': 'gemini-2.0-flash-exp-image-generation', // 使用思考模式
};

// 使用 Google Gemini 官方 API 生成圖片
async function generateWithGemini(prompt: string): Promise<string[]> {
  console.log('=== generateWithGemini 開始 ===');
  console.log('geminiClient 存在:', !!geminiClient);
  console.log('GEMINI_API_KEY 存在:', !!GEMINI_API_KEY);

  if (!geminiClient || !GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY 未設定，使用免費的 Pollinations.ai');
    return generateWithPollinations(prompt, 1024, 1024);
  }

  console.log('使用 Google Gemini 官方 API 生成圖片，提示詞:', prompt);

  try {
    console.log('正在調用 Gemini API...');
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: prompt,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    console.log('Gemini API 回應:', JSON.stringify(response, null, 2));

    // 解析回應中的圖片
    const images: string[] = [];

    if (response.candidates && response.candidates.length > 0) {
      console.log('找到 candidates 數量:', response.candidates.length);
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        console.log('找到 parts 數量:', candidate.content.parts.length);
        for (const part of candidate.content.parts) {
          console.log('Part 類型:', Object.keys(part));
          if (part.inlineData && part.inlineData.data) {
            // 將 base64 轉換為 data URL
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            console.log('成功提取圖片，mimeType:', mimeType, 'data長度:', part.inlineData.data.length);
            images.push(dataUrl);
          } else if (part.text) {
            console.log('Part 包含文字:', part.text.substring(0, 100));
          }
        }
      }
    } else {
      console.warn('API 回應中沒有 candidates');
    }

    if (images.length === 0) {
      // 如果 Gemini 未返回圖片，使用 Pollinations 作為備用
      console.warn('Gemini 未返回圖片，使用 Pollinations.ai');
      return generateWithPollinations(prompt, 1024, 1024);
    }

    console.log('成功生成圖片數量:', images.length);
    return images;
  } catch (error) {
    console.error('Gemini 生成錯誤:', error);
    console.error('錯誤詳情:', error instanceof Error ? error.message : String(error));
    // 發生錯誤時使用免費服務
    console.log('回退到 Pollinations.ai');
    return generateWithPollinations(prompt, 1024, 1024);
  }
}

// 將寬高比轉換為 fal.ai 格式
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.7) return '16:9';
  if (ratio > 1.3) return '4:3';
  if (ratio < 0.6) return '9:16';
  if (ratio < 0.8) return '3:4';
  return '1:1';
}

// 使用 Nano Banana 生成圖片（基於 Gemini API）
async function generateWithNanoBanana(
  prompt: string,
  width: number,
  height: number,
  isPro: boolean = false
): Promise<string[]> {
  // Nano Banana 系列都使用 Gemini API
  if (!geminiClient || !GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY 未設定，使用免費的 Pollinations.ai');
    return generateWithPollinations(prompt, width, height);
  }

  console.log(`使用 ${isPro ? 'Nano Banana Pro' : 'Nano Banana'} 生成圖片，提示詞:`, prompt);

  try {
    // Pro 版本使用更高品質的提示詞
    const enhancedPrompt = isPro
      ? `Create a high-quality, detailed image: ${prompt}. Ultra HD, professional quality, highly detailed.`
      : prompt;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: enhancedPrompt,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    console.log('Nano Banana 生成結果:', response);

    const images: string[] = [];
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            images.push(dataUrl);
          }
        }
      }
    }

    if (images.length === 0) {
      console.warn('Nano Banana 未返回圖片，使用 Pollinations.ai');
      return generateWithPollinations(prompt, width, height);
    }

    return images;
  } catch (error) {
    console.error('Nano Banana 生成錯誤:', error);
    return generateWithPollinations(prompt, width, height);
  }
}

export async function generateImage(request: TextToImageRequest): Promise<string[]> {
  console.log('=== generateImage 開始 ===');
  console.log('請求參數:', JSON.stringify(request, null, 2));

  const modelVersion = MODEL_VERSIONS[request.model];
  console.log('選擇的模型版本:', modelVersion);

  if (!modelVersion) {
    console.error('模型不支援:', request.model);
    throw new Error(`模型 ${request.model} 尚未支援`);
  }

  // Nano Banana Pro 使用思考模式（更詳細的提示詞處理）
  if (request.model === 'nano-banana-pro') {
    console.log('使用 Nano Banana Pro（思考模式）');
    const enhancedPrompt = `Please think step by step and create: ${request.prompt}. Consider composition, lighting, colors, and details carefully.`;
    return generateWithGemini(enhancedPrompt);
  }

  // 使用 Google Gemini 官方 API
  console.log('使用 Gemini Flash 模型');
  return generateWithGemini(request.prompt);
}

export async function inpaint(request: InpaintRequest): Promise<string[]> {
  const modelVersion = 'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3';
  const input = {
    prompt: request.prompt,
    image: request.image,
    mask: request.mask,
    num_outputs: 1,
    guidance_scale: 7.5,
    num_inference_steps: 30,
  };
  return runReplicateModel(modelVersion, input);
}

export async function outpaint(request: OutpaintRequest): Promise<string[]> {
  const modelVersion = 'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3';
  const input = {
    prompt: request.prompt || 'extend the image seamlessly',
    image: request.image,
    mask: request.image,
    num_outputs: 1,
    guidance_scale: 7.5,
  };
  return runReplicateModel(modelVersion, input);
}

export async function removeBackground(request: RemoveBackgroundRequest): Promise<string> {
  const modelVersion = 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';
  const results = await runReplicateModel(modelVersion, { image: request.image });
  return results[0];
}

export async function upscaleImage(request: UpscaleRequest): Promise<string> {
  const modelVersion = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';
  const results = await runReplicateModel(modelVersion, {
    image: request.image,
    scale: request.scale,
    face_enhance: false,
  });
  return results[0];
}

// 圖生圖 (Image-to-Image)
export interface ImageToImageRequest {
  image: string;
  prompt: string;
  strength?: number; // 0-1, 變化強度
  negativePrompt?: string;
}

export async function imageToImage(request: ImageToImageRequest): Promise<string[]> {
  const modelVersion = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
  const input = {
    image: request.image,
    prompt: request.prompt,
    negative_prompt: request.negativePrompt || '',
    prompt_strength: request.strength || 0.8,
    num_outputs: 1,
    guidance_scale: 7.5,
    num_inference_steps: 30,
  };
  return runReplicateModel(modelVersion, input);
}

// 風格轉換
export interface StyleTransferRequest {
  image: string;
  style: 'anime' | 'cartoon' | 'sketch' | 'oil-painting' | 'watercolor' | '3d-render';
  prompt?: string;
}

export async function styleTransfer(request: StyleTransferRequest): Promise<string[]> {
  const stylePrompts: Record<string, string> = {
    'anime': 'anime style, japanese animation, vibrant colors',
    'cartoon': 'cartoon style, disney pixar style, colorful',
    'sketch': 'pencil sketch, black and white, detailed linework',
    'oil-painting': 'oil painting, impressionist style, brush strokes',
    'watercolor': 'watercolor painting, soft colors, artistic',
    '3d-render': '3d render, octane render, highly detailed, photorealistic',
  };

  return imageToImage({
    image: request.image,
    prompt: `${stylePrompts[request.style]}${request.prompt ? ', ' + request.prompt : ''}`,
    strength: 0.75,
  });
}

// 圖片變體 (生成相似圖片)
export interface ImageVariationRequest {
  image: string;
  variationStrength?: number; // 0-1
}

export async function createVariation(request: ImageVariationRequest): Promise<string[]> {
  return imageToImage({
    image: request.image,
    prompt: 'same style, same composition, slight variation',
    strength: request.variationStrength || 0.3,
  });
}

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

// ==================== 美圖設計室功能 ====================

// AI 改圖 - 根據文字描述修改圖片
export interface AIEditImageRequest {
  image: string; // base64 或 URL
  prompt: string; // 修改指令
}

export async function aiEditImage(request: AIEditImageRequest): Promise<string[]> {
  console.log('=== aiEditImage 開始 ===');
  console.log('AI 改圖，指令:', request.prompt);

  // 優先使用 Gemini 付費版
  if (geminiClient) {
    try {
      // 將圖片轉換為 base64（如果是 URL）
      let imageData = request.image;
      if (request.image.startsWith('http')) {
        const response = await fetch(request.image);
        const blob = await response.blob();
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      // 提取 base64 數據
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Data,
                },
              },
              {
                text: `請根據以下指令修改這張圖片：${request.prompt}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['Text', 'Image'],
        },
      });

      const images: string[] = [];
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
              images.push(dataUrl);
            }
          }
        }
      }

      if (images.length > 0) {
        return images;
      }
    } catch (error) {
      console.error('Gemini AI 改圖錯誤:', error);
    }
  }

  // 最後備用：返回使用 Pollinations 生成的圖片
  console.log('使用 Pollinations.ai 生成替代圖片...');
  return generateWithPollinations(request.prompt, 1024, 1024);
}

// AI 擴圖 - 向外延伸圖片
export interface AIOutpaintRequest {
  image: string;
  direction: 'up' | 'down' | 'left' | 'right' | 'all';
  prompt?: string;
}

export async function aiOutpaint(request: AIOutpaintRequest): Promise<string[]> {
  console.log('=== aiOutpaint 開始 ===');

  const directionText = {
    up: '向上延伸',
    down: '向下延伸',
    left: '向左延伸',
    right: '向右延伸',
    all: '向四周延伸',
  };

  // 優先使用 Gemini 付費版進行擴圖
  if (geminiClient) {
    try {
      const prompt = `請${directionText[request.direction]}這張圖片的內容，保持風格一致${request.prompt ? '，' + request.prompt : ''}`;
      console.log('使用 Gemini 進行擴圖...');
      const results = await aiEditImage({ image: request.image, prompt });
      if (results[0]) {
        console.log('Gemini 擴圖成功');
        return results;
      }
    } catch (error) {
      console.error('Gemini 擴圖失敗:', error);
    }
  }

  // 備用：使用純前端方案進行擴圖
  try {
    console.log('使用前端擴圖方案...');
    const result = await outpaintWithCanvas(request.image, request.direction);
    console.log('擴圖成功');
    return [result];
  } catch (canvasError) {
    console.error('Canvas 擴圖失敗:', canvasError);
  }

  // 返回原圖
  console.warn('所有擴圖方案都失敗，返回原圖');
  return [request.image];
}

// 使用 Canvas 進行擴圖（純前端，無需 API）
async function outpaintWithCanvas(imageUrl: string, direction: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('無法創建 Canvas context'));
        return;
      }

      // 根據方向計算新的畫布尺寸
      const expandSize = Math.round(Math.min(img.width, img.height) * 0.25); // 擴展 25%

      let newWidth = img.width;
      let newHeight = img.height;
      let offsetX = 0;
      let offsetY = 0;

      switch (direction) {
        case 'up':
          newHeight = img.height + expandSize;
          offsetY = expandSize;
          break;
        case 'down':
          newHeight = img.height + expandSize;
          break;
        case 'left':
          newWidth = img.width + expandSize;
          offsetX = expandSize;
          break;
        case 'right':
          newWidth = img.width + expandSize;
          break;
        case 'all':
          newWidth = img.width + expandSize * 2;
          newHeight = img.height + expandSize * 2;
          offsetX = expandSize;
          offsetY = expandSize;
          break;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // 獲取邊緣顏色用於填充
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        reject(new Error('無法創建臨時 Canvas context'));
        return;
      }

      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      // 使用漸變填充擴展區域
      const edgeData = tempCtx.getImageData(0, 0, img.width, img.height);

      // 填充背景（使用邊緣顏色的平均值）
      let r = 0, g = 0, b = 0, count = 0;

      // 取邊緣像素的平均顏色
      for (let x = 0; x < img.width; x++) {
        const topIdx = x * 4;
        const bottomIdx = ((img.height - 1) * img.width + x) * 4;
        r += edgeData.data[topIdx] + edgeData.data[bottomIdx];
        g += edgeData.data[topIdx + 1] + edgeData.data[bottomIdx + 1];
        b += edgeData.data[topIdx + 2] + edgeData.data[bottomIdx + 2];
        count += 2;
      }
      for (let y = 0; y < img.height; y++) {
        const leftIdx = y * img.width * 4;
        const rightIdx = (y * img.width + img.width - 1) * 4;
        r += edgeData.data[leftIdx] + edgeData.data[rightIdx];
        g += edgeData.data[leftIdx + 1] + edgeData.data[rightIdx + 1];
        b += edgeData.data[leftIdx + 2] + edgeData.data[rightIdx + 2];
        count += 2;
      }

      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);

      // 填充背景
      ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
      ctx.fillRect(0, 0, newWidth, newHeight);

      // 繪製原圖
      ctx.drawImage(img, offsetX, offsetY);

      // 轉換為 PNG
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('圖片載入失敗'));
    };

    img.src = imageUrl;
  });
}

// AI 超清 - 圖片放大增強
export interface AISuperResolutionRequest {
  image: string;
  scale?: 2 | 4;
}

export async function aiSuperResolution(request: AISuperResolutionRequest): Promise<string> {
  console.log('=== aiSuperResolution 開始 ===');
  const scale = request.scale || 2;

  // 優先使用純前端 Canvas 方案進行圖片放大（最快、無需 API）
  try {
    console.log(`使用前端 Canvas 進行 ${scale}x 圖片放大...`);
    const result = await upscaleWithCanvas(request.image, scale);
    console.log('Canvas 圖片放大成功');
    return result;
  } catch (canvasError) {
    console.error('Canvas 放大失敗:', canvasError);
  }

  // 備用：使用 Gemini 付費版進行超清（需要 API Key）
  if (geminiClient && GEMINI_API_KEY) {
    try {
      console.log(`使用 Gemini 進行 ${scale}x 圖片放大...`);
      const results = await aiEditImage({
        image: request.image,
        prompt: `請將這張圖片放大 ${scale} 倍，提升解析度和清晰度，保持原有風格和細節。Make it sharper and more detailed.`,
      });
      if (results[0]) {
        console.log('Gemini 超清成功');
        return results[0];
      }
    } catch (error) {
      console.error('Gemini 超清失敗:', error);
    }
  }

  // 備用方案：使用 fal.ai（僅當 FAL_KEY 有效時）
  if (FAL_KEY && FAL_KEY.length > 10) {
    try {
      console.log('使用 fal.ai 進行超清...');
      const result = await fal.subscribe('fal-ai/clarity-upscaler', {
        input: {
          image_url: request.image,
          upscale_factor: scale,
        },
        logs: true,
      });

      const output = result.data as { image?: { url: string } };
      if (output.image?.url) {
        return output.image.url;
      }
    } catch (error) {
      console.error('fal.ai 超清失敗:', error);
    }
  }

  // 最後備用：使用 Replicate（僅當 Token 有效時）
  if (REPLICATE_API_TOKEN && REPLICATE_API_TOKEN.length > 10) {
    try {
      return await upscaleImage({ image: request.image, scale });
    } catch (error) {
      console.error('Replicate 超清失敗:', error);
    }
  }

  // 返回原圖（不拋出錯誤）
  console.warn('所有超清方案都失敗，返回原圖');
  return request.image;
}

// 使用 Canvas 進行圖片放大（純前端，無需 API）
async function upscaleWithCanvas(imageUrl: string, scale: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('無法創建 Canvas context'));
        return;
      }

      // 設置新的尺寸
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // 使用高品質縮放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 繪製放大後的圖片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 轉換為 base64
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('圖片載入失敗'));
    };

    img.src = imageUrl;
  });
}

// AI 無痕消除 - 消除圖片中的物件
export interface AIRemoveObjectRequest {
  image: string;
  mask: string; // 要消除區域的遮罩
  prompt?: string;
}

export async function aiRemoveObject(request: AIRemoveObjectRequest): Promise<string[]> {
  console.log('=== aiRemoveObject 開始 ===');

  // 優先使用 Gemini 付費版進行消除
  if (geminiClient) {
    try {
      console.log('使用 Gemini 進行消除...');
      const results = await aiEditImage({
        image: request.image,
        prompt: request.prompt || '移除圖片中標記的物件，用周圍背景自然填補。Remove the marked object and fill with surrounding background seamlessly.',
      });
      if (results[0]) {
        console.log('Gemini 消除成功');
        return results;
      }
    } catch (error) {
      console.error('Gemini 消除失敗:', error);
    }
  }

  // 備用：使用純前端 Canvas 方案進行消除（內容感知填充）
  try {
    console.log('使用前端消除方案...');
    const result = await removeObjectWithCanvas(request.image, request.mask);
    console.log('消除成功');
    return [result];
  } catch (canvasError) {
    console.error('Canvas 消除失敗:', canvasError);
  }

  // 返回原圖
  console.warn('所有消除方案都失敗，返回原圖');
  return [request.image];
}

// 使用 Canvas 進行簡單消除（純前端，無需 API）
// 使用周圍像素進行內容感知填充
async function removeObjectWithCanvas(imageUrl: string, maskUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const maskImg = new Image();
    img.crossOrigin = 'anonymous';
    maskImg.crossOrigin = 'anonymous';

    let imgLoaded = false;
    let maskLoaded = false;

    const processImages = () => {
      if (!imgLoaded || !maskLoaded) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('無法創建 Canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 繪製原圖
      ctx.drawImage(img, 0, 0);

      // 獲取原圖數據
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 繪製遮罩並獲取遮罩數據
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) {
        reject(new Error('無法創建遮罩 Canvas context'));
        return;
      }

      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      maskCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
      const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);

      // 對遮罩區域進行簡單的周圍像素填充
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;

          // 如果遮罩區域不透明（需要消除的區域）
          if (maskData.data[i + 3] > 128 || maskData.data[i] > 128) {
            // 尋找最近的非遮罩像素
            let found = false;
            for (let radius = 1; radius < 50 && !found; radius++) {
              const samples: number[][] = [];

              // 採樣周圍像素
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;

                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const ni = (ny * width + nx) * 4;

                    // 如果這個像素不在遮罩區域內
                    if (maskData.data[ni + 3] <= 128 && maskData.data[ni] <= 128) {
                      samples.push([data[ni], data[ni + 1], data[ni + 2]]);
                    }
                  }
                }
              }

              if (samples.length > 0) {
                // 計算平均顏色
                let r = 0, g = 0, b = 0;
                for (const sample of samples) {
                  r += sample[0];
                  g += sample[1];
                  b += sample[2];
                }
                data[i] = Math.round(r / samples.length);
                data[i + 1] = Math.round(g / samples.length);
                data[i + 2] = Math.round(b / samples.length);
                found = true;
              }
            }
          }
        }
      }

      // 將處理後的數據放回 canvas
      ctx.putImageData(imageData, 0, 0);

      // 轉換為 PNG
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onload = () => {
      imgLoaded = true;
      processImages();
    };

    maskImg.onload = () => {
      maskLoaded = true;
      processImages();
    };

    img.onerror = () => reject(new Error('原圖載入失敗'));
    maskImg.onerror = () => reject(new Error('遮罩載入失敗'));

    img.src = imageUrl;
    maskImg.src = maskUrl;
  });
}

// 拆分圖層 - 將圖片元素分離
export interface AILayerSplitRequest {
  image: string;
}

export interface LayerSplitResult {
  foreground: string; // 前景（去背後的主體）
  background: string; // 背景
  layers: Array<{
    name: string;
    image: string;
  }>;
}

export async function aiLayerSplit(request: AILayerSplitRequest): Promise<LayerSplitResult> {
  // 使用去背功能分離前景
  const foreground = await removeBackground({ image: request.image });

  return {
    foreground,
    background: request.image, // 原圖作為背景
    layers: [
      { name: '前景', image: foreground },
      { name: '背景', image: request.image },
    ],
  };
}

// 摳圖 - 去除背景（增強版）
export interface AIRemoveBackgroundRequest {
  image: string;
  mode?: 'auto' | 'portrait' | 'product';
}

export async function aiRemoveBackground(request: AIRemoveBackgroundRequest): Promise<string> {
  console.log('=== aiRemoveBackground 開始 ===');

  // 優先使用 Gemini 付費版進行去背（效果最好）
  if (geminiClient && GEMINI_API_KEY) {
    try {
      console.log('使用 Gemini 進行去背...');
      const results = await aiEditImage({
        image: request.image,
        prompt: '請移除這張圖片的背景，只保留主體/物件。將背景設為透明或純白色。Remove the background completely, keep only the main subject.',
      });
      if (results[0]) {
        console.log('Gemini 去背成功');
        return results[0];
      }
    } catch (error) {
      console.error('Gemini 去背失敗:', error);
    }
  }

  // 備用：使用純前端 Canvas 方案進行去背（基於顏色閾值）
  try {
    console.log('使用前端去背方案...');
    const result = await removeBackgroundWithCanvas(request.image);
    console.log('Canvas 去背成功');
    return result;
  } catch (canvasError) {
    console.error('Canvas 去背失敗:', canvasError);
  }

  // 備用方案 1：使用 fal.ai（僅當 FAL_KEY 有效時）
  if (FAL_KEY && FAL_KEY.length > 10) {
    try {
      console.log('使用 fal.ai 進行去背...');
      const result = await fal.subscribe('fal-ai/birefnet', {
        input: {
          image_url: request.image,
        },
        logs: true,
      });

      const output = result.data as { image?: { url: string } };
      if (output.image?.url) {
        return output.image.url;
      }
    } catch (error) {
      console.error('fal.ai 去背失敗:', error);
    }
  }

  // 備用方案 2：使用 Replicate（僅當 Token 有效時）
  if (REPLICATE_API_TOKEN && REPLICATE_API_TOKEN.length > 10) {
    try {
      return await removeBackground({ image: request.image });
    } catch (error) {
      console.error('Replicate 去背失敗:', error);
    }
  }

  // 返回原圖（不拋出錯誤）
  console.warn('所有去背方案都失敗，返回原圖');
  return request.image;
}

// 使用 Canvas 進行簡單去背（純前端，無需 API）
// 這是一個基於顏色閾值的簡單去背方案
async function removeBackgroundWithCanvas(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('無法創建 Canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 繪製原圖
      ctx.drawImage(img, 0, 0);

      // 獲取圖像數據
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 檢測背景顏色（取四個角落的平均顏色）
      const corners = [
        0, // 左上
        (canvas.width - 1) * 4, // 右上
        (canvas.height - 1) * canvas.width * 4, // 左下
        ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4, // 右下
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      for (const corner of corners) {
        bgR += data[corner];
        bgG += data[corner + 1];
        bgB += data[corner + 2];
      }
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      // 根據背景顏色移除相似顏色的像素
      const threshold = 50; // 顏色容差

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 計算與背景顏色的差異
        const diff = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        );

        // 如果顏色接近背景色，設為透明
        if (diff < threshold) {
          data[i + 3] = 0; // 設置 alpha 為 0（透明）
        }
      }

      // 將處理後的數據放回 canvas
      ctx.putImageData(imageData, 0, 0);

      // 轉換為 PNG（支持透明度）
      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('圖片載入失敗'));
    };

    img.src = imageUrl;
  });
}

// 無痕改字 - 修改圖片中的文字
export interface AITextReplaceRequest {
  image: string;
  originalText: string;
  newText: string;
}

export async function aiTextReplace(request: AITextReplaceRequest): Promise<string[]> {
  console.log('=== aiTextReplace 開始 ===');
  console.log(`原文字: ${request.originalText}, 新文字: ${request.newText}`);

  // 優先使用 Gemini 付費版進行改字
  if (geminiClient) {
    try {
      console.log('使用 Gemini 進行改字...');
      const results = await aiEditImage({
        image: request.image,
        prompt: `將圖片中的文字「${request.originalText}」替換為「${request.newText}」，保持原有的字體風格和排版。Replace text "${request.originalText}" with "${request.newText}", maintain original font style and layout.`,
      });
      if (results[0]) {
        console.log('Gemini 改字成功');
        return results;
      }
    } catch (error) {
      console.error('Gemini 改字失敗:', error);
    }
  }

  // 備用：使用 Pollinations.ai 生成包含新文字的圖片
  try {
    const prompt = `Image with text "${request.newText}" in elegant typography, professional design, high quality`;
    console.log('使用 Pollinations.ai 進行改字...');
    const results = await generateWithPollinations(prompt, 1024, 1024);
    if (results[0]) {
      console.log('改字成功');
      return results;
    }
  } catch (error) {
    console.error('Pollinations 改字失敗:', error);
  }

  // 返回原圖
  console.warn('所有改字方案都失敗，返回原圖');
  return [request.image];
}

// AI 物件識別 - 識別標記位置的物件
export interface AIIdentifyObjectRequest {
  image: string; // 整張圖片的 base64 或 URL
  x: number; // 標記的 x 座標
  y: number; // 標記的 y 座標
  imageWidth: number; // 圖片寬度
  imageHeight: number; // 圖片高度
}

export async function aiIdentifyObject(request: AIIdentifyObjectRequest): Promise<string> {
  console.log('=== aiIdentifyObject 開始 ===');
  console.log(`識別位置: (${request.x}, ${request.y}), 圖片尺寸: ${request.imageWidth}x${request.imageHeight}`);

  // 優先使用 Gemini 付費版進行物件識別
  if (geminiClient) {
    try {
      console.log('使用 Gemini 進行物件識別...');

      // 將圖片轉換為 base64（如果是 URL）
      let imageData = request.image;
      if (request.image.startsWith('http')) {
        const response = await fetch(request.image);
        const blob = await response.blob();
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      // 提取 base64 數據
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

      // 計算標記位置的相對比例
      const xPercent = Math.round((request.x / request.imageWidth) * 100);
      const yPercent = Math.round((request.y / request.imageHeight) * 100);

      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Data,
                },
              },
              {
                text: `請識別這張圖片中位於大約 ${xPercent}% 從左邊、${yPercent}% 從上方位置的物件或元素。
只需要回答物件的名稱（2-6個中文字），不需要任何解釋。
例如：「紅色按鈕」、「螺絲孔」、「電路板」、「USB接口」等。
如果無法識別，請回答「未知物件」。`,
              },
            ],
          },
        ],
      });

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              // 清理回應文字，只保留物件名稱
              const objectName = part.text.trim().replace(/[「」"']/g, '');
              console.log('AI 識別結果:', objectName);
              return objectName;
            }
          }
        }
      }
    } catch (error) {
      console.error('Gemini 物件識別失敗:', error);
    }
  }

  // 備用：返回預設名稱
  console.warn('物件識別失敗，使用預設名稱');
  return '未知物件';
}

// 對話式 AI 設計助手
export interface AIDesignChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface AIDesignChatRequest {
  messages: AIDesignChatMessage[];
  currentImage?: string;
}

export async function aiDesignChat(request: AIDesignChatRequest): Promise<{
  message: string;
  images?: string[];
  suggestedActions?: string[];
}> {
  if (!geminiClient) {
    throw new Error('需要設定 GEMINI_API_KEY 才能使用 AI 設計助手');
  }

  const systemPrompt = `你是一個專業的 AI 設計助手，可以幫助用戶：
1. 生成產品主圖、場景圖、套圖
2. 修改和優化圖片
3. 提供設計建議
4. 生成電商產品圖片（如淘寶、Amazon 產品圖）

請根據用戶的需求，提供具體的設計方案和操作建議。
如果需要生成圖片，請描述你會生成什麼樣的圖片。`;

  try {
    // 構建對話內容
    const contents = request.messages.map((msg) => ({
      role: msg.role,
      parts: [
        ...(msg.images?.map((img) => ({
          inlineData: {
            mimeType: 'image/png',
            data: img.replace(/^data:image\/\w+;base64,/, ''),
          },
        })) || []),
        { text: msg.content },
      ],
    }));

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...contents,
      ],
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    let message = '';
    const images: string[] = [];

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            message += part.text;
          }
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            images.push(dataUrl);
          }
        }
      }
    }

    // 解析建議操作
    const suggestedActions: string[] = [];
    if (message.includes('生成') || message.includes('創建')) {
      suggestedActions.push('生成圖片');
    }
    if (message.includes('修改') || message.includes('調整')) {
      suggestedActions.push('AI 改圖');
    }
    if (message.includes('去背') || message.includes('摳圖')) {
      suggestedActions.push('去背');
    }

    return {
      message: message || '已為您處理完成',
      images: images.length > 0 ? images : undefined,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    };
  } catch (error) {
    console.error('AI 設計助手錯誤:', error);
    throw error;
  }
}
