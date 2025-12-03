import React, { useState, useRef } from 'react';
import {
  Users,
  Image as ImageIcon,
  FolderPlus,
  Trash2,
  Search,
  Plus,
  X,
  Tag,
  Star,
  StarOff,
} from 'lucide-react';

// 素材類型
interface Asset {
  id: string;
  name: string;
  category: 'model' | 'scene' | 'element' | 'background';
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
}

interface AssetLibraryProps {
  onSelectAsset?: (asset: Asset) => void;
  onClose?: () => void;
}

// 預設分類
const categories = [
  { id: 'model', name: '虛擬模特兒', icon: Users },
  { id: 'scene', name: '情境場景', icon: ImageIcon },
  { id: 'element', name: '裝飾元素', icon: Tag },
  { id: 'background', name: '背景素材', icon: ImageIcon },
];

// 示範素材資料
const defaultAssets: Asset[] = [
  {
    id: '1',
    name: '年輕女性登山',
    category: 'model',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop',
    tags: ['戶外', '運動', '年輕女性'],
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: '商務男士',
    category: 'model',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    tags: ['商務', '正式', '男性'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: '咖啡廳場景',
    category: 'scene',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
    tags: ['室內', '咖啡', '休閒'],
    isFavorite: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: '海灘日落',
    category: 'scene',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    tags: ['戶外', '海灘', '夕陽'],
    isFavorite: false,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: '純白背景',
    category: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=200&fit=crop',
    tags: ['簡約', '白色', '電商'],
    isFavorite: true,
    createdAt: new Date(),
  },
];

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onSelectAsset,
  onClose,
}) => {
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 過濾素材
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 切換收藏
  const toggleFavorite = (id: string) => {
    setAssets(assets.map(asset =>
      asset.id === id ? { ...asset, isFavorite: !asset.isFavorite } : asset
    ));
  };

  // 刪除素材
  const deleteAsset = (id: string) => {
    if (confirm('確定要刪除此素材嗎？')) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  // 上傳新素材
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAsset: Asset = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'element',
          imageUrl: event.target?.result as string,
          tags: [],
          isFavorite: false,
          createdAt: new Date(),
        };
        setAssets([newAsset, ...assets]);
      };
      reader.readAsDataURL(file);
    }
    setShowAddModal(false);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-800">素材庫</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-600"
          >
            <Plus className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* 搜尋列 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋素材..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 分類標籤 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setSelectedCategory('favorites')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
            selectedCategory === 'favorites'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className="w-3 h-3" />
          收藏
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 素材列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">沒有找到素材</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-purple-600 text-sm hover:underline"
            >
              上傳新素材
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAssets
              .filter(asset => selectedCategory !== 'favorites' || asset.isFavorite)
              .map((asset) => (
              <div
                key={asset.id}
                className="relative group rounded-xl overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => onSelectAsset?.(asset)}
              >
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-xs font-medium truncate">{asset.name}</p>
                  <div className="flex gap-1 mt-1">
                    {asset.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* 操作按鈕 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(asset.id);
                    }}
                    className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                  >
                    {asset.isFavorite ? (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAsset(asset.id);
                    }}
                    className="p-1.5 bg-white rounded-full shadow hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增素材彈窗 */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 max-w-[90%]">
            <h3 className="font-semibold text-lg mb-4">新增素材</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <Plus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">點擊上傳素材</p>
              <p className="text-xs text-gray-400 mt-1">支援 JPG、PNG、WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;
