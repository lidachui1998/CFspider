import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // AI 相关（非流式）
  aiChat: (params: {
    endpoint: string
    apiKey: string
    model: string
    messages: Array<{ role: string; content: string }>
    tools?: Array<object>
  }) => ipcRenderer.invoke('ai:chat', params),

  // AI 流式调用
  aiChatStream: (params: {
    requestId: string
    endpoint: string
    apiKey: string
    model: string
    messages: Array<{ role: string; content: string }>
  }) => ipcRenderer.send('ai:chat-stream', params),

  // 监听流式数据
  onStreamData: (callback: (data: { requestId: string; content: string }) => void) => {
    ipcRenderer.on('ai:chat-stream-data', (_event, data) => callback(data))
  },
  onStreamEnd: (callback: (data: { requestId: string }) => void) => {
    ipcRenderer.on('ai:chat-stream-end', (_event, data) => callback(data))
  },
  onStreamError: (callback: (data: { requestId: string; error: string }) => void) => {
    ipcRenderer.on('ai:chat-stream-error', (_event, data) => callback(data))
  },
  removeStreamListeners: () => {
    ipcRenderer.removeAllListeners('ai:chat-stream-data')
    ipcRenderer.removeAllListeners('ai:chat-stream-end')
    ipcRenderer.removeAllListeners('ai:chat-stream-error')
  },

  // 文件操作（支持用户自定义保存路径）
  saveFile: (params: { 
    filename: string; 
    content: string; 
    type: string;
    isBase64?: boolean;
  }) => ipcRenderer.invoke('file:save', params),

  // 规则管理
  loadRules: () => ipcRenderer.invoke('rules:load'),
  saveRules: (rules: object[]) => ipcRenderer.invoke('rules:save', rules),

  // 配置管理
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config: object) => ipcRenderer.invoke('config:save', config),
  
  // 已保存的配置管理
  loadSavedConfigs: () => ipcRenderer.invoke('saved-configs:load'),
  saveSavedConfigs: (configs: object[]) => ipcRenderer.invoke('saved-configs:save', configs),

  // 浏览器设置
  loadBrowserSettings: () => ipcRenderer.invoke('browser-settings:load'),
  saveBrowserSettings: (settings: object) => ipcRenderer.invoke('browser-settings:save', settings),

  // 历史记录
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (history: object[]) => ipcRenderer.invoke('history:save', history),

  // 下载功能
  downloadImage: (url: string, filename: string) => ipcRenderer.invoke('download:image', url, filename),
  openDownloadFolder: () => ipcRenderer.invoke('download:openFolder'),

  // 学习记忆
  loadLearningMemory: () => ipcRenderer.invoke('learning-memory:load'),
  saveLearningMemory: (memories: object[]) => ipcRenderer.invoke('learning-memory:save', memories),

  // 聊天会话
  loadChatSessions: () => ipcRenderer.invoke('chat-sessions:load'),
  saveChatSessions: (sessions: object[]) => ipcRenderer.invoke('chat-sessions:save', sessions),

  // 快捷键事件
  onToggleDevtools: (callback: () => void) => {
    ipcRenderer.on('toggle-devtools', () => callback())
  },
  onReloadWebview: (callback: () => void) => {
    ipcRenderer.on('reload-webview', () => callback())
  },
  onNavigateBack: (callback: () => void) => {
    ipcRenderer.on('navigate-back', () => callback())
  },
  onNavigateForward: (callback: () => void) => {
    ipcRenderer.on('navigate-forward', () => callback())
  },
  onFocusAddressbar: (callback: () => void) => {
    ipcRenderer.on('focus-addressbar', () => callback())
  },
  onNewTab: (callback: () => void) => {
    ipcRenderer.on('new-tab', () => callback())
  },
  onCloseTab: (callback: () => void) => {
    ipcRenderer.on('close-tab', () => callback())
  }
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      aiChat: (params: {
        endpoint: string
        apiKey: string
        model: string
        messages: Array<{ role: string; content: string }>
        tools?: Array<object>
      }) => Promise<object>
      aiChatStream: (params: {
        requestId: string
        endpoint: string
        apiKey: string
        model: string
        messages: Array<{ role: string; content: string }>
      }) => void
      onStreamData: (callback: (data: { requestId: string; content: string }) => void) => void
      onStreamEnd: (callback: (data: { requestId: string }) => void) => void
      onStreamError: (callback: (data: { requestId: string; error: string }) => void) => void
      removeStreamListeners: () => void
      saveFile: (params: { 
        filename: string; 
        content: string; 
        type: string;
        isBase64?: boolean;
      }) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
      loadRules: () => Promise<object[]>
      saveRules: (rules: object[]) => Promise<boolean>
      loadConfig: () => Promise<{ endpoint: string; apiKey: string; model: string }>
      saveConfig: (config: object) => Promise<boolean>
      loadSavedConfigs: () => Promise<object[]>
      saveSavedConfigs: (configs: object[]) => Promise<boolean>
      loadBrowserSettings: () => Promise<object>
      saveBrowserSettings: (settings: object) => Promise<boolean>
      loadHistory: () => Promise<object[]>
      saveHistory: (history: object[]) => Promise<boolean>
      downloadImage: (url: string, filename: string) => Promise<{ success: boolean; filename?: string; path?: string; error?: string }>
      openDownloadFolder: () => Promise<boolean>
      loadLearningMemory: () => Promise<object[]>
      saveLearningMemory: (memories: object[]) => Promise<boolean>
      loadChatSessions: () => Promise<object[]>
      saveChatSessions: (sessions: object[]) => Promise<boolean>
      onToggleDevtools: (callback: () => void) => void
      onReloadWebview: (callback: () => void) => void
      onNavigateBack: (callback: () => void) => void
      onNavigateForward: (callback: () => void) => void
      onFocusAddressbar: (callback: () => void) => void
      onNewTab: (callback: () => void) => void
      onCloseTab: (callback: () => void) => void
    }
  }
}
