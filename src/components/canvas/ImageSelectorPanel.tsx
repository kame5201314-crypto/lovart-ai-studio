import React, { useState } from 'react';
import { X, Check, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface GeneratedImage {
  id: string;
  src: string;
  selected: boolean;
}

interface ImageSelectorPanelProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  onSelect: (imageId: string) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  prompt?: string;
}

// T2I 生成 4 張圖選擇面板
export const ImageSelectorPanel: React.FC<ImageSelectorPanelProps> = ({
  images,
  isGenerating,
  onSelect,
  onConfirm,
  onRegenerate,
  onClose,
  prompt,
}) => {
  const selectedImage = images.find(img => img.selected);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">AI 生成結果</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* 提示詞顯示 */}
        {prompt && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600 truncate">
              <span className="font-medium">Prompt:</span> {prompt}
            </p>
          </div>
        )}

        {/* 圖片網格 */}
        <div className="p-4">
          {isGenerating ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-500">生成中...</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => onSelect(image.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    image.selected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={image.src} alt="" className="w-full h-full object-cover" />
                  {image.selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作列 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            <span>重新生成</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedImage || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              <span>使用此圖</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// I2I 變體生成面板
interface VariantPanelProps {
  originalImage: string;
  variants: GeneratedImage[];
  isGenerating: boolean;
  onSelect: (imageId: string) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export const VariantPanel: React.FC<VariantPanelProps> = ({
  originalImage,
  variants,
  isGenerating,
  onSelect,
  onConfirm,
  onRegenerate,
  onClose,
}) => {
  const selectedVariant = variants.find(v => v.selected);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">圖片變體</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex gap-4">
          {/* 原圖 */}
          <div className="flex-shrink-0">
            <p className="text-sm text-gray-500 mb-2">原始圖片</p>
            <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200">
              <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* 變體 */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">生成變體 (選擇一張)</p>
            {isGenerating ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 size={24} className="text-purple-500 animate-spin" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => onSelect(variant.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      variant.selected
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={variant.src} alt="" className="w-full h-full object-cover" />
                    {variant.selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            <span>重新生成變體</span>
          </button>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedVariant || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Check size={16} />
              <span>使用此變體</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorPanel;
