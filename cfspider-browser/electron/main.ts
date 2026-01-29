import { app, BrowserWindow, ipcMain, session, Menu, webContents, dialog } from 'electron'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import https from 'https'
import http from 'http'

let mainWindow: BrowserWindow | null = null
let webviewContents: Electron.WebContents | null = null

function createWindow() {
  // 隐藏菜单栏
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'cfspider-智能浏览器',
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  })

  // 开发模式加载本地服务器
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 注册快捷键
  registerShortcuts()
}

// 注册快捷键
function registerShortcuts() {
  if (!mainWindow) return

  // 监听快捷键
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 - 打开/关闭 webview 的开发者工具（内嵌在底部）
    if (input.key === 'F12') {
      if (webviewContents && !webviewContents.isDestroyed()) {
        if (webviewContents.isDevToolsOpened()) {
          webviewContents.closeDevTools()
        } else {
          // 使用 'bottom' 模式让开发者工具显示在底部，像真实浏览器一样
          webviewContents.openDevTools({ mode: 'bottom' })
        }
      }
      event.preventDefault()
    }
    
    // Ctrl+Shift+I - 打开主窗口开发者工具（调试 Electron 应用本身）
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      if (mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow?.webContents.openDevTools({ mode: 'right' })
      }
      event.preventDefault()
    }
    
    // F5 或 Ctrl+R - 刷新 webview
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      mainWindow?.webContents.send('reload-webview')
      event.preventDefault()
    }
    
    // Alt+Left - 后退
    if (input.alt && input.key === 'ArrowLeft') {
      mainWindow?.webContents.send('navigate-back')
      event.preventDefault()
    }
    
    // Alt+Right - 前进
    if (input.alt && input.key === 'ArrowRight') {
      mainWindow?.webContents.send('navigate-forward')
      event.preventDefault()
    }
    
    // Ctrl+L - 聚焦地址栏
    if (input.control && input.key.toLowerCase() === 'l') {
      mainWindow?.webContents.send('focus-addressbar')
      event.preventDefault()
    }
    
    // Ctrl+T - 新建标签页
    if (input.control && input.key.toLowerCase() === 't') {
      mainWindow?.webContents.send('new-tab')
      event.preventDefault()
    }
    
    // Ctrl+W - 关闭当前标签页
    if (input.control && input.key.toLowerCase() === 'w') {
      mainWindow?.webContents.send('close-tab')
      event.preventDefault()
    }
  })
}

app.whenReady().then(() => {
  // 配置 webview 的独立 session（persist: 前缀确保数据持久化到磁盘）
  const webviewSession = session.fromPartition('persist:cfspider')
  
  // 设置 Edge 浏览器的 User-Agent，避免 Bing 显示 Copilot 广告
  // Edge 用户不会看到 Copilot 推广，因为 Edge 本身集成了 Copilot
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'
  webviewSession.setUserAgent(userAgent)
  
  // 设置默认 session 的 User-Agent（某些情况会用到）
  session.defaultSession.setUserAgent(userAgent)

  // 移除 X-Frame-Options 和 CSP 限制，允许在 webview 中加载任何网站
  webviewSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    
    // 移除阻止嵌入的响应头
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']
    delete headers['content-security-policy']
    delete headers['Content-Security-Policy']
    delete headers['content-security-policy-report-only']
    delete headers['Content-Security-Policy-Report-Only']
    
    callback({ responseHeaders: headers })
  })

  // 允许所有权限请求
  webviewSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })

  // 处理 webview 中的新窗口请求
  app.on('web-contents-created', (_event, contents) => {
    // 处理 webview 类型的 webContents
    if (contents.getType() === 'webview') {
      // 保存 webview 的 webContents 引用
      webviewContents = contents
      
      // 拦截新窗口请求，在当前 webview 中打开
      contents.setWindowOpenHandler(({ url }) => {
        // 不允许打开新窗口，改为在当前页面导航
        if (url && !url.startsWith('javascript:')) {
          contents.loadURL(url)
        }
        return { action: 'deny' }
      })
      
      // 当 webview 被销毁时清除引用
      contents.on('destroyed', () => {
        if (webviewContents === contents) {
          webviewContents = null
        }
      })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 处理：AI API 调用（非流式，用于工具调用）
ipcMain.handle('ai:chat', async (_event, { endpoint, apiKey, model, messages, tools }) => {
  try {
    // 验证 endpoint
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('请先配置 API 地址')
    }
    
    // Local/LAN services (Ollama etc.) do not require API Key
    const isLocalEndpoint = (url: string) => {
      return url.includes('localhost') || 
             url.includes('127.0.0.1') ||
             url.includes('192.168.') ||
             url.includes('10.') ||
             /172\.(1[6-9]|2[0-9]|3[01])\./.test(url) ||
             url.includes(':11434')  // Ollama default port
    }
    if (!isLocalEndpoint(endpoint) && (!apiKey || typeof apiKey !== 'string')) {
      throw new Error('请先配置 API Key')
    }

    // 添加超时控制（增加到 180 秒，因为大模型响应可能较慢）
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000) // 180秒超时

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          tools,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`API 错误 ${response.status}: ${errorText.slice(0, 100) || response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('请求超时（180秒），可能原因：\n1. 网络连接不稳定\n2. API 服务器响应慢\n3. 需要科学上网访问该 API')
      }
      throw fetchError
    }
  } catch (error) {
    console.error('AI API error:', error)
    const message = error instanceof Error ? error.message : '未知错误'
    // 友好的错误信息
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      throw new Error('网络连接失败，请检查：\n1. 网络是否正常\n2. API 地址是否正确\n3. 是否需要代理')
    }
    throw new Error(message)
  }
})

// IPC 处理：AI API 流式调用
ipcMain.on('ai:chat-stream', async (event, { requestId, endpoint, apiKey, model, messages }) => {
  try {
    // Local/LAN services do not require API Key
    const isLocalEndpoint = (url: string) => {
      return url?.includes('localhost') || 
             url?.includes('127.0.0.1') ||
             url?.includes('192.168.') ||
             url?.includes('10.') ||
             /172\.(1[6-9]|2[0-9]|3[01])\./.test(url || '') ||
             url?.includes(':11434')  // Ollama default port
    }
    if (!endpoint || (!isLocalEndpoint(endpoint) && !apiKey)) {
      event.sender.send('ai:chat-stream-error', { requestId, error: '请先配置 API 地址和 Key' })
      return
    }

    // 添加超时控制（增加到 180 秒）
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          stream: true
        }),
        signal: controller.signal
      })
      clearTimeout(timeout)
    } catch (fetchError) {
      clearTimeout(timeout)
      const msg = fetchError instanceof Error && fetchError.name === 'AbortError' 
        ? '请求超时' 
        : '网络连接失败，请检查网络和 API 配置'
      event.sender.send('ai:chat-stream-error', { requestId, error: msg })
      return
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      event.sender.send('ai:chat-stream-error', { requestId, error: `API 错误 ${response.status}: ${errorText.slice(0, 100) || response.statusText}` })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      event.sender.send('ai:chat-stream-error', { requestId, error: 'No response body' })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            event.sender.send('ai:chat-stream-data', { requestId, content })
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    event.sender.send('ai:chat-stream-end', { requestId })
  } catch (error) {
    console.error('AI stream error:', error)
    event.sender.send('ai:chat-stream-error', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// IPC 处理：保存文件（支持用户自定义路径）
ipcMain.handle('file:save', async (_event, { filename, content, type, isBase64 }) => {
  const fs = await import('fs/promises')

  // 根据类型设置过滤器
  let filters: Electron.FileFilter[]
  switch (type) {
    case 'json':
      filters = [{ name: 'JSON 文件', extensions: ['json'] }]
      break
    case 'csv':
      filters = [{ name: 'CSV 文件', extensions: ['csv'] }]
      break
    case 'excel':
      filters = [{ name: 'Excel 文件', extensions: ['xlsx'] }]
      break
    case 'txt':
      filters = [{ name: '文本文件', extensions: ['txt'] }]
      break
    default:
      filters = [{ name: '所有文件', extensions: ['*'] }]
  }

  // 显示保存对话框让用户选择路径
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '保存文件',
    defaultPath: filename,
    filters,
    properties: ['showOverwriteConfirmation']
  })

  if (!result.canceled && result.filePath) {
    try {
      // 处理 base64 编码的内容（用于 Excel）
      if (isBase64) {
        const buffer = Buffer.from(content, 'base64')
        await fs.writeFile(result.filePath, buffer)
      } else {
        await fs.writeFile(result.filePath, content, 'utf-8')
      }
      return { success: true, filePath: result.filePath }
    } catch (error) {
      return { success: false, error: `保存失败: ${error}` }
    }
  }
  return { success: false, canceled: true }
})

// IPC 处理：读取保存的规则
ipcMain.handle('rules:load', async () => {
  const fs = await import('fs/promises')
  const rulesPath = join(app.getPath('userData'), 'rules.json')
  
  try {
    const content = await fs.readFile(rulesPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})

// IPC 处理：保存规则
ipcMain.handle('rules:save', async (_event, rules) => {
  const fs = await import('fs/promises')
  const rulesPath = join(app.getPath('userData'), 'rules.json')
  
  await fs.writeFile(rulesPath, JSON.stringify(rules, null, 2))
  return true
})

// IPC 处理：读取 AI 配置
ipcMain.handle('config:load', async () => {
  const fs = await import('fs/promises')
  const configPath = join(app.getPath('userData'), 'ai-config.json')

  try {
    const content = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    // 默认使用内置 AI
    return {
      endpoint: '',
      apiKey: '',
      model: '',
      useBuiltIn: true
    }
  }
})

// IPC 处理：保存 AI 配置
ipcMain.handle('config:save', async (_event, config) => {
  const fs = await import('fs/promises')
  const configPath = join(app.getPath('userData'), 'ai-config.json')
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))
  return true
})

// IPC 处理：读取已保存的配置列表
ipcMain.handle('saved-configs:load', async () => {
  const fs = await import('fs/promises')
  const configsPath = join(app.getPath('userData'), 'saved-configs.json')
  
  try {
    const content = await fs.readFile(configsPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})

// IPC 处理：保存配置列表
ipcMain.handle('saved-configs:save', async (_event, configs) => {
  const fs = await import('fs/promises')
  const configsPath = join(app.getPath('userData'), 'saved-configs.json')
  
  await fs.writeFile(configsPath, JSON.stringify(configs, null, 2))
  return true
})

// IPC 处理：读取浏览器设置
ipcMain.handle('browser-settings:load', async () => {
  const fs = await import('fs/promises')
  const settingsPath = join(app.getPath('userData'), 'browser-settings.json')
  
  try {
    const content = await fs.readFile(settingsPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {
      searchEngine: 'bing',
      homepage: 'https://www.bing.com',
      defaultZoom: 100
    }
  }
})

// IPC 处理：保存浏览器设置
ipcMain.handle('browser-settings:save', async (_event, settings) => {
  const fs = await import('fs/promises')
  const settingsPath = join(app.getPath('userData'), 'browser-settings.json')
  
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
  return true
})

// IPC 处理：读取历史记录
ipcMain.handle('history:load', async () => {
  const fs = await import('fs/promises')
  const historyPath = join(app.getPath('userData'), 'history.json')
  
  try {
    const content = await fs.readFile(historyPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})

// IPC 处理：保存历史记录
ipcMain.handle('history:save', async (_event, history) => {
  const fs = await import('fs/promises')
  const historyPath = join(app.getPath('userData'), 'history.json')
  
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2))
  return true
})

// IPC 处理：下载图片
ipcMain.handle('download:image', async (_event, url: string, filename: string) => {
  try {
    // 创建下载目录
    const downloadsPath = join(app.getPath('downloads'), 'cfspider-images')
    if (!existsSync(downloadsPath)) {
      await mkdir(downloadsPath, { recursive: true })
    }
    
    // 从 URL 获取扩展名
    const urlObj = new URL(url)
    let ext = '.jpg'
    const pathExt = urlObj.pathname.split('.').pop()?.toLowerCase()
    if (pathExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(pathExt)) {
      ext = `.${pathExt}`
    }
    
    // 清理文件名
    const cleanFilename = filename.replace(/[<>:"/\\|?*]/g, '_')
    const fullFilename = `${cleanFilename}${ext}`
    const filePath = join(downloadsPath, fullFilename)
    
    // 下载图片
    const protocol = url.startsWith('https') ? https : http
    
    return new Promise((resolve) => {
      const request = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': urlObj.origin
        }
      }, async (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            // 递归处理重定向
            const result = await ipcMain.emit('download:image', _event, redirectUrl, filename)
            resolve(result)
            return
          }
        }
        
        if (response.statusCode !== 200) {
          resolve({ success: false, error: `HTTP ${response.statusCode}` })
          return
        }
        
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks)
            await writeFile(filePath, buffer)
            resolve({ 
              success: true, 
              filename: fullFilename,
              path: filePath 
            })
          } catch (writeError) {
            resolve({ success: false, error: `写入失败: ${writeError}` })
          }
        })
        response.on('error', (err) => {
          resolve({ success: false, error: `下载失败: ${err.message}` })
        })
      })
      
      request.on('error', (err) => {
        resolve({ success: false, error: `请求失败: ${err.message}` })
      })
      
      request.setTimeout(30000, () => {
        request.destroy()
        resolve({ success: false, error: '下载超时' })
      })
    })
  } catch (error) {
    return { success: false, error: `下载失败: ${error}` }
  }
})

// IPC 处理：打开下载文件夹
ipcMain.handle('download:openFolder', async () => {
  const { shell } = await import('electron')
  const downloadsPath = join(app.getPath('downloads'), 'cfspider-images')
  if (!existsSync(downloadsPath)) {
    await mkdir(downloadsPath, { recursive: true })
  }
  shell.openPath(downloadsPath)
  return true
})

// IPC 处理：加载学习记忆
ipcMain.handle('learning-memory:load', async () => {
  const fs = await import('fs/promises')
  const memoryPath = join(app.getPath('userData'), 'learning-memory.json')
  
  try {
    const content = await fs.readFile(memoryPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})

// IPC 处理：保存学习记忆
ipcMain.handle('learning-memory:save', async (_event, memories) => {
  const fs = await import('fs/promises')
  const memoryPath = join(app.getPath('userData'), 'learning-memory.json')
  
  await fs.writeFile(memoryPath, JSON.stringify(memories, null, 2))
  return true
})

// IPC 处理：读取聊天会话历史
ipcMain.handle('chat-sessions:load', async () => {
  const fs = await import('fs/promises')
  const sessionsPath = join(app.getPath('userData'), 'chat-sessions.json')
  
  try {
    const content = await fs.readFile(sessionsPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})

// IPC 处理：保存聊天会话历史
ipcMain.handle('chat-sessions:save', async (_event, sessions) => {
  const fs = await import('fs/promises')
  const sessionsPath = join(app.getPath('userData'), 'chat-sessions.json')
  
  await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2))
  return true
})
