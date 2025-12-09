import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// 從伺服器環境變數讀取 Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// 初始化 Gemini 客戶端
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  // 檢查 API Key
  if (!GEMINI_API_KEY || !genAI) {
    return res.status(500).json({ error: '伺服器未設定 GEMINI_API_KEY' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt 參數' });
    }

    // 智能檢測：用戶是否要求文字
    const hasTextRequest = /文字|字|text|word|letter|寫|標題|title|caption|label/i.test(prompt);

    // 優化提示詞：除非用戶明確要求文字，否則不加任何文字
    const enhancedPrompt = hasTextRequest
      ? prompt  // 用戶要求文字，直接使用原始提示詞
      : `Generate a photorealistic, high-quality image. STRICTLY NO TEXT, NO WORDS, NO LETTERS, NO CHARACTERS, NO WATERMARKS, NO CAPTIONS anywhere on the image.

Image description: ${prompt}

CRITICAL: The image must be completely free of any text, letters, numbers, symbols, or written characters. Pure visual content only.`;

    console.log(`使用 Gemini 生成圖片，優化後提示詞: ${enhancedPrompt}`);

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
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          images.push(dataUrl);
        }
      }
    }

    if (images.length === 0) {
      return res.status(500).json({ error: '圖片生成失敗，Gemini 未返回圖片' });
    }

    console.log(`成功生成 ${images.length} 張圖片`);
    return res.status(200).json({ images });
  } catch (error) {
    console.error('圖片生成錯誤:', error);
    return res.status(500).json({
      error: '圖片生成失敗',
      details: error instanceof Error ? error.message : '未知錯誤',
    });
  }
}
