import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fal } from '@fal-ai/client';

const FAL_KEY = process.env.FAL_KEY || '';

if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  if (!FAL_KEY) {
    return res.status(500).json({ error: '伺服器未設定 FAL_KEY' });
  }

  try {
    const { image, mask, prompt = '' } = req.body;

    if (!image) {
      return res.status(400).json({ error: '缺少 image 參數' });
    }

    if (!mask) {
      return res.status(400).json({ error: '缺少 mask 參數' });
    }

    console.log('使用 fal-ai/inpaint 進行局部重繪/擦除');

    // 使用 fal.ai 的 inpaint 模型
    // 如果沒有 prompt，就是純擦除（用背景填充）
    const inpaintPrompt = prompt || 'clean background, seamless blend, natural fill';

    const result = await fal.subscribe('fal-ai/inpaint', {
      input: {
        image_url: image,
        mask_url: mask,
        prompt: inpaintPrompt,
      },
      logs: true,
    });

    console.log('fal.ai inpaint 結果:', result);

    const output = result.data as {
      image?: { url: string };
      images?: Array<{ url: string }>;
    };

    let imageUrl: string | null = null;

    if (output.image?.url) {
      imageUrl = output.image.url;
    } else if (output.images && output.images.length > 0) {
      imageUrl = output.images[0].url;
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Inpaint 失敗，未收到結果' });
    }

    return res.status(200).json({ image: imageUrl });
  } catch (error) {
    console.error('Inpaint 錯誤:', error);
    return res.status(500).json({
      error: 'Inpaint 失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
    });
  }
}
