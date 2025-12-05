import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fal } from '@fal-ai/client';

// 從伺服器環境變數讀取（不是 VITE_ 前綴，所以不會暴露到前端）
const FAL_KEY = process.env.FAL_KEY || '';

// 配置 fal.ai client
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

// fal.ai 模型 ID 對應表
const MODEL_MAP: Record<string, string> = {
  'nano-banana': 'fal-ai/nano-banana',
  'nano-banana-pro': 'fal-ai/nano-banana-pro',
  'flux-pro': 'fal-ai/flux-pro/v1.1',
  'flux-schnell': 'fal-ai/flux/schnell',
  'flux-dev': 'fal-ai/flux/dev',
};

// 將寬高比轉換為 fal.ai 格式
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.7) return '16:9';
  if (ratio > 1.3) return '4:3';
  if (ratio < 0.6) return '9:16';
  if (ratio < 0.8) return '3:4';
  return '1:1';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  // 檢查 API Key
  if (!FAL_KEY) {
    return res.status(500).json({ error: '伺服器未設定 FAL_KEY' });
  }

  try {
    const { prompt, model, width = 1024, height = 1024, numOutputs = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt 參數' });
    }

    // 取得 fal.ai 模型 ID
    const modelId = MODEL_MAP[model] || MODEL_MAP['nano-banana'];

    console.log(`使用模型 ${modelId} 生成圖片，提示詞: ${prompt}`);

    const result = await fal.subscribe(modelId, {
      input: {
        prompt,
        image_size: getAspectRatio(width, height),
        num_images: numOutputs,
        output_format: 'png',
      },
      logs: true,
    });

    console.log('fal.ai 生成結果:', result);

    // 處理不同的回應格式
    const output = result.data as {
      images?: Array<{ url: string }>;
      image?: { url: string };
    };

    let images: string[] = [];

    if (output.images && output.images.length > 0) {
      images = output.images.map((img) => img.url);
    } else if (output.image?.url) {
      images = [output.image.url];
    }

    if (images.length === 0) {
      return res.status(500).json({ error: '圖片生成失敗，未收到結果' });
    }

    return res.status(200).json({ images });
  } catch (error) {
    console.error('圖片生成錯誤:', error);
    return res.status(500).json({
      error: '圖片生成失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
    });
  }
}
