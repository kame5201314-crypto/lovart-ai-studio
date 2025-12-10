import { useState } from 'react';
import { X, Type, Check } from 'lucide-react';

interface EditTextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newText: string) => void;
  defaultText?: string;
}

export function EditTextPanel({
  isOpen,
  onClose,
  onApply,
  defaultText = '',
}: EditTextPanelProps) {
  const [newText, setNewText] = useState(defaultText);

  if (!isOpen) return null;

  const handleApply = () => {
    if (newText.trim()) {
      onApply(newText);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[280px]">
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
          <Type size={14} className="text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-800">編輯文字</span>
      </div>

      {/* 輸入框 */}
      <input
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        placeholder="輸入新的文字內容..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 mb-3"
        autoFocus
      />

      {/* 按鈕 */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleApply}
          disabled={!newText.trim()}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            newText.trim()
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check size={16} />
          應用修改
        </button>
      </div>
    </div>
  );
}
