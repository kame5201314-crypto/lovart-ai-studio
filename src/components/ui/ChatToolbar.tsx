import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  History,
  Share2,
  FolderOpen,
  Pin,
  X,
  Search,
  RotateCcw,
  Trash2,
} from 'lucide-react';

// 對話歷史項目
interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

// 生成的文件項目
interface GeneratedFile {
  id: string;
  name: string;
  thumbnail: string;
  type: 'image' | 'video';
}

interface ChatToolbarProps {
  onNewChat?: () => void;
  onSelectHistory?: (chatId: string) => void;
  onDeleteHistory?: (chatId: string) => void;
  onShare?: () => void;
  onSelectFile?: (fileId: string) => void;
  onPin?: () => void;
  chatHistory?: ChatHistoryItem[];
  generatedFiles?: GeneratedFile[];
}

export function ChatToolbar({
  onNewChat,
  onSelectHistory,
  onDeleteHistory,
  onShare,
  onSelectFile,
  onPin,
  chatHistory = [],
  generatedFiles = [],
}: ChatToolbarProps) {
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [showNewChatTooltip, setShowNewChatTooltip] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const historyRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistoryPanel(false);
      }
      if (filesRef.current && !filesRef.current.contains(e.target as Node)) {
        setShowFilesPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 過濾歷史對話
  const filteredHistory = chatHistory.filter(
    (item) =>
      item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.preview.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex items-center gap-1">
      {/* 新建對話 */}
      <div className="relative">
        <button
          onClick={() => {
            onNewChat?.();
            setShowNewChatTooltip(true);
            setTimeout(() => setShowNewChatTooltip(false), 1500);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title="新建對話"
        >
          <Plus size={18} />
        </button>
        {showNewChatTooltip && (
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50">
            新建对话
          </div>
        )}
      </div>

      {/* 歷史對話 */}
      <div className="relative" ref={historyRef}>
        <button
          onClick={() => {
            setShowHistoryPanel(!showHistoryPanel);
            setShowFilesPanel(false);
          }}
          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
            showHistoryPanel ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
          }`}
          title="歷史對話"
        >
          <History size={18} />
        </button>

        {showHistoryPanel && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div className="p-3">
              <div className="text-sm font-medium text-gray-900 mb-3">历史对话</div>

              {/* 搜尋框 */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="请输入搜索关键词"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 新對話按鈕 */}
              <button
                onClick={() => {
                  onNewChat?.();
                  setShowHistoryPanel(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
              >
                <Plus size={14} />
                <span>新对话</span>
              </button>

              {/* 歷史列表 */}
              <div className="mt-2 max-h-64 overflow-y-auto">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="group w-full px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <button
                        onClick={() => {
                          onSelectHistory?.(item.id);
                          setShowHistoryPanel(false);
                        }}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate">{item.title}</div>
                        </div>
                      </button>
                      {/* 刪除按鈕 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistory?.(item.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="刪除對話"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-gray-400">
                    {historySearch ? '没有找到相关对话' : '暂无历史对话'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分享對話 */}
      <div className="relative">
        <button
          onClick={() => {
            onShare?.();
            setShowShareTooltip(true);
            setTimeout(() => setShowShareTooltip(false), 1500);
          }}
          onMouseEnter={() => setShowShareTooltip(true)}
          onMouseLeave={() => setShowShareTooltip(false)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title="分享對話"
        >
          <Share2 size={18} />
        </button>
        {showShareTooltip && (
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50">
            分享对话
          </div>
        )}
      </div>

      {/* 文件列表 */}
      <div className="relative" ref={filesRef}>
        <button
          onClick={() => {
            setShowFilesPanel(!showFilesPanel);
            setShowHistoryPanel(false);
          }}
          onMouseEnter={() => !showFilesPanel && setShowFilesPanel(false)}
          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
            showFilesPanel ? 'bg-gray-100 text-gray-900' : 'text-gray-500'
          }`}
          title="文件列表"
        >
          <FolderOpen size={18} />
        </button>

        {/* 懸停提示 */}
        {!showFilesPanel && (
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 opacity-0 hover:opacity-100 pointer-events-none">
            文件列表
          </div>
        )}

        {showFilesPanel && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-900">已生成文件列表</div>
                <button
                  onClick={() => setShowFilesPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 文件列表 */}
              <div className="max-h-80 overflow-y-auto">
                {generatedFiles.length > 0 ? (
                  generatedFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        onSelectFile?.(file.id);
                      }}
                      className="w-full px-2 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    >
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{file.name}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400">
                    暂无生成的文件
                  </div>
                )}
              </div>

              {generatedFiles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                  <span className="text-xs text-blue-500">到底了</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 釘選 */}
      <button
        onClick={onPin}
        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        title="釘選"
      >
        <Pin size={18} />
      </button>
    </div>
  );
}
