import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, Loader2, Image as ImageIcon, Calendar } from 'lucide-react';
import type { SavedImage } from '../../lib/firebase';
import { getUserImages, deleteImage } from '../../lib/firebase';

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ isOpen, onClose, onSelectImage }) => {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 載入用戶圖片
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const userImages = await getUserImages();
      setImages(userImages);
    } catch (error) {
      console.error('載入圖片失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (image: SavedImage) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return;

    setIsDeleting(image.id);
    try {
      await deleteImage(image.id);
      setImages(images.filter(img => img.id !== image.id));
      if (selectedImage?.id === image.id) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = (image: SavedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name || `lovart-${Date.now()}.png`;
    link.click();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ImageIcon size={24} className="text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">我的作品庫</h2>
            <span className="text-sm text-gray-500">({images.length} 張圖片)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 圖片列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">還沒有儲存的圖片</p>
                <p className="text-sm">生成圖片後點擊儲存按鈕即可保存</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.id === image.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full aspect-square object-cover"
                    />
                    {/* Hover 覆蓋層 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                        title="下載"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                        disabled={isDeleting === image.id}
                        className="p-2 bg-white rounded-full hover:bg-red-50 text-red-500"
                        title="刪除"
                      >
                        {isDeleting === image.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 圖片詳情面板 */}
          {selectedImage && (
            <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full rounded-lg mb-4"
              />
              <h3 className="font-medium text-gray-900 mb-2">{selectedImage.name}</h3>

              {selectedImage.prompt && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">生成提示詞</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedImage.prompt}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                {formatDate(selectedImage.createdAt)}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectImage?.(selectedImage.url);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  添加到畫布
                </button>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
