import React, { useState, useEffect } from 'react';
import { X, User, Key, Palette, Bell, Save, Check, AlertCircle } from 'lucide-react';
import { updateUserProfile, getCurrentUser } from '../../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    email: string;
    displayName: string;
  } | null;
}

type TabType = 'profile' | 'api' | 'appearance' | 'notifications';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // API Keys (存儲在 localStorage)
  const [geminiKey, setGeminiKey] = useState('');
  const [falKey, setFalKey] = useState('');
  const [replicateKey, setReplicateKey] = useState('');

  // 外觀設定
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'zh-TW' | 'zh-CN' | 'en'>('zh-TW');

  // 通知設定
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
    }
    // 從 localStorage 載入設定
    const savedSettings = localStorage.getItem('lovart_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTheme(settings.theme || 'light');
        setLanguage(settings.language || 'zh-TW');
        setEmailNotifications(settings.emailNotifications ?? true);
        setBrowserNotifications(settings.browserNotifications ?? false);
      } catch (e) {
        console.error('載入設定失敗:', e);
      }
    }
    // 載入 API keys (隱藏顯示)
    setGeminiKey(localStorage.getItem('VITE_GEMINI_API_KEY') ? '••••••••' : '');
    setFalKey(localStorage.getItem('VITE_FAL_KEY') ? '••••••••' : '');
    setReplicateKey(localStorage.getItem('VITE_REPLICATE_API_TOKEN') ? '••••••••' : '');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('更新個人資料失敗:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApiKeys = () => {
    setIsSaving(true);
    try {
      if (geminiKey && geminiKey !== '••••••••') {
        localStorage.setItem('VITE_GEMINI_API_KEY', geminiKey);
      }
      if (falKey && falKey !== '••••••••') {
        localStorage.setItem('VITE_FAL_KEY', falKey);
      }
      if (replicateKey && replicateKey !== '••••••••') {
        localStorage.setItem('VITE_REPLICATE_API_TOKEN', replicateKey);
      }
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        // 提示需要重新載入頁面
        if (window.confirm('API Key 已儲存。需要重新載入頁面才能生效，是否現在重新載入？')) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('儲存 API Key 失敗:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = () => {
    setIsSaving(true);
    try {
      const settings = {
        theme,
        language,
        emailNotifications,
        browserNotifications,
      };
      localStorage.setItem('lovart_settings', JSON.stringify(settings));

      // 應用主題
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('儲存外觀設定失敗:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, label: '個人資料', icon: User },
    { id: 'api' as TabType, label: 'API 設定', icon: Key },
    { id: 'appearance' as TabType, label: '外觀', icon: Palette },
    { id: 'notifications' as TabType, label: '通知', icon: Bell },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 標題 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">帳戶設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* 側邊標籤 */}
          <div className="w-48 border-r border-gray-200 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors mb-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 內容區域 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 個人資料 */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">電子郵件無法更改</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    顯示名稱
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="輸入您的名稱"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={18} /> : <Save size={18} />}
                  {isSaving ? '儲存中...' : saveStatus === 'success' ? '已儲存' : '儲存變更'}
                </button>
              </div>
            )}

            {/* API 設定 */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">API Key 安全提示</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        API Key 將儲存在您的瀏覽器中。請勿在公用電腦上儲存敏感資訊。
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="輸入 Gemini API Key"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    從 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a> 取得
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    fal.ai API Key
                  </label>
                  <input
                    type="password"
                    value={falKey}
                    onChange={(e) => setFalKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="輸入 fal.ai API Key"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    從 <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">fal.ai</a> 取得（用於影片生成）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Replicate API Token
                  </label>
                  <input
                    type="password"
                    value={replicateKey}
                    onChange={(e) => setReplicateKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="輸入 Replicate API Token"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    從 <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Replicate</a> 取得（備用）
                  </p>
                </div>

                <button
                  onClick={handleSaveApiKeys}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={18} /> : <Save size={18} />}
                  {isSaving ? '儲存中...' : saveStatus === 'success' ? '已儲存' : '儲存 API Keys'}
                </button>
              </div>
            )}

            {/* 外觀設定 */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    主題模式
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: '淺色' },
                      { id: 'dark', label: '深色' },
                      { id: 'system', label: '跟隨系統' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id as typeof theme)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          theme === option.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    語言
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as typeof language)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveAppearance}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={18} /> : <Save size={18} />}
                  {isSaving ? '儲存中...' : saveStatus === 'success' ? '已儲存' : '儲存設定'}
                </button>
              </div>
            )}

            {/* 通知設定 */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">電子郵件通知</p>
                    <p className="text-sm text-gray-500">接收生成完成的通知郵件</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        emailNotifications ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">瀏覽器通知</p>
                    <p className="text-sm text-gray-500">允許瀏覽器推送通知</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!browserNotifications) {
                        Notification.requestPermission().then((permission) => {
                          setBrowserNotifications(permission === 'granted');
                        });
                      } else {
                        setBrowserNotifications(false);
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      browserNotifications ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        browserNotifications ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleSaveAppearance}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'success' ? <Check size={18} /> : <Save size={18} />}
                  {isSaving ? '儲存中...' : saveStatus === 'success' ? '已儲存' : '儲存設定'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
