import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Share2,
  Clock,
  Trash2,
  Plus,
  X,
  Copy,
  Check,
  Users,
  Link,
  Download,
  Upload,
  FileJson,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

interface Project {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators: string[];
  version: number;
}

interface ProjectManagerProps {
  onClose?: () => void;
}

// 本地儲存 key
const PROJECTS_STORAGE_KEY = 'lovart_projects';
const CURRENT_PROJECT_KEY = 'lovart_current_project';

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('未命名專案');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'versions'>('projects');

  const { layers, canvasState, history } = useCanvasStore();

  // 載入專案列表
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed.map((p: Project) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
      } catch (e) {
        console.error('載入專案失敗:', e);
      }
    }

    const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentId) {
      setCurrentProjectId(currentId);
    }
  }, []);

  // 儲存專案列表
  const saveProjectsList = (updatedProjects: Project[]) => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  // 建立新專案
  const createNewProject = () => {
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: `專案 ${projects.length + 1}`,
      thumbnail: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [],
      version: 1,
    };

    const updatedProjects = [newProject, ...projects];
    saveProjectsList(updatedProjects);
    setCurrentProjectId(newProject.id);
    localStorage.setItem(CURRENT_PROJECT_KEY, newProject.id);
    setProjectName(newProject.name);
  };

  // 儲存當前專案
  const saveCurrentProject = () => {
    if (!currentProjectId) {
      createNewProject();
      return;
    }

    // 儲存專案資料
    const projectData = {
      layers,
      canvasState,
      history: history.slice(-10), // 只保留最近 10 個歷史記錄
    };

    localStorage.setItem(`lovart_project_${currentProjectId}`, JSON.stringify(projectData));

    // 更新專案列表
    const updatedProjects = projects.map(p =>
      p.id === currentProjectId
        ? {
            ...p,
            name: projectName,
            updatedAt: new Date(),
            version: p.version + 1,
          }
        : p
    );
    saveProjectsList(updatedProjects);

    alert('專案已儲存！');
  };

  // 載入專案
  const loadProject = (projectId: string) => {
    const savedData = localStorage.getItem(`lovart_project_${projectId}`);
    if (savedData) {
      try {
        JSON.parse(savedData);
        // 這裡需要透過 store 的方法來恢復狀態
        // 簡化版本：直接使用 alert 提示
        alert('專案載入功能需要整合 store 的恢復方法');
        setCurrentProjectId(projectId);
        localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setProjectName(project.name);
        }
      } catch (e) {
        console.error('載入專案失敗:', e);
        alert('載入專案失敗');
      }
    }
  };

  // 刪除專案
  const deleteProject = (projectId: string) => {
    if (!confirm('確定要刪除此專案嗎？')) return;

    localStorage.removeItem(`lovart_project_${projectId}`);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjectsList(updatedProjects);

    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  };

  // 產生分享連結
  const generateShareLink = () => {
    if (!currentProjectId) {
      alert('請先儲存專案');
      return;
    }

    // 模擬產生分享連結（實際應用需要後端支援）
    const shareId = btoa(currentProjectId).replace(/=/g, '');
    const link = `${window.location.origin}/share/${shareId}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  // 複製連結
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 匯出專案
  const exportProject = () => {
    const projectData = {
      name: projectName,
      layers,
      canvasState,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'lovart-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 匯入專案
  const importProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            // 簡化版本：顯示匯入資訊
            alert(`匯入專案: ${data.name}\n包含 ${data.layers?.length || 0} 個圖層`);
          } catch (e) {
            alert('匯入失敗：檔案格式錯誤');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-gray-800">專案管理</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* 當前專案 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <label className="block text-xs text-gray-500 mb-1">當前專案</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="輸入專案名稱"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveCurrentProject}
            className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
          >
            <Save className="w-4 h-4" />
            儲存
          </button>
          <button
            onClick={generateShareLink}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </div>

      {/* 分頁標籤 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'projects'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          我的專案
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'versions'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          版本歷史
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'projects' ? (
          <>
            {/* 操作按鈕 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={createNewProject}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                新建
              </button>
              <button
                onClick={importProject}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                匯入
              </button>
              <button
                onClick={exportProject}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                匯出
              </button>
            </div>

            {/* 專案列表 */}
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FileJson className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">還沒有專案</p>
                <button
                  onClick={createNewProject}
                  className="mt-3 text-orange-600 text-sm hover:underline"
                >
                  建立第一個專案
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                      currentProjectId === project.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{project.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {project.updatedAt.toLocaleDateString()}
                          </span>
                          <span>v{project.version}</span>
                          {project.collaborators.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {project.collaborators.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* 版本歷史 */
          <div className="space-y-3">
            {history.slice().reverse().slice(0, 20).map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{entry.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">#{history.length - idx}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                目前沒有版本歷史
              </div>
            )}
          </div>
        )}
      </div>

      {/* 分享彈窗 */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90%]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">分享專案</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Link className="w-4 h-4 inline mr-1" />
                  分享連結
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyShareLink}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                      copied
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已複製' : '複製'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  邀請協作者（電子郵件）
                </label>
                <input
                  type="email"
                  placeholder="輸入電子郵件地址"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  發送邀請
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                擁有連結的人可以查看此專案
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
