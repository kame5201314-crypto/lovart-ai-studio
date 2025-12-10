import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { registerUser, loginUser } from '../../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { email: string; displayName: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!displayName.trim()) {
          setError('請輸入顯示名稱');
          setIsLoading(false);
          return;
        }
        const user = await registerUser(email, password, displayName);
        onAuthSuccess({
          email: user.email || email,
          displayName: user.displayName || displayName
        });
      } else {
        const user = await loginUser(email, password);
        onAuthSuccess({
          email: user.email || email,
          displayName: user.displayName || '用戶'
        });
      }
      onClose();
    } catch (err: unknown) {
      console.error('認證失敗:', err);
      const error = err as { code?: string; message?: string };
      // 處理 Firebase 錯誤訊息
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('此電子郵件已被註冊');
          break;
        case 'auth/invalid-email':
          setError('無效的電子郵件格式');
          break;
        case 'auth/weak-password':
          setError('密碼強度不足（至少6個字符）');
          break;
        case 'auth/user-not-found':
          setError('找不到此用戶');
          break;
        case 'auth/wrong-password':
          setError('密碼錯誤');
          break;
        case 'auth/invalid-credential':
          setError('電子郵件或密碼錯誤');
          break;
        default:
          setError(error.message || '認證失敗，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">L</span>
          </div>
        </div>

        {/* 標題 */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {mode === 'login' ? '歡迎回來' : '建立帳戶'}
        </h2>
        <p className="text-gray-500 text-center mb-6">
          {mode === 'login' ? '登入以儲存你的作品' : '註冊以開始創作'}
        </p>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 顯示名稱（僅註冊時） */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                顯示名稱
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名稱"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* 電子郵件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少6個字符' : '輸入密碼'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                處理中...
              </>
            ) : (
              mode === 'login' ? '登入' : '註冊'
            )}
          </button>
        </form>

        {/* 切換模式 */}
        <div className="mt-6 text-center">
          <span className="text-gray-500">
            {mode === 'login' ? '還沒有帳戶？' : '已有帳戶？'}
          </span>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="ml-2 text-blue-600 font-medium hover:underline"
          >
            {mode === 'login' ? '立即註冊' : '返回登入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
