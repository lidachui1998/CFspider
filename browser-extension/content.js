// CFspider GitHub 加速 - Content Script

(function() {
  'use strict';
  
  let config = { workersUrl: '', uuid: '', enabled: true, cloneAccel: true, downloadAccel: true };
  
  // GitHub 下载链接匹配模式
  const GITHUB_DOWNLOAD_PATTERNS = [
    /https:\/\/github\.com\/[^\/]+\/[^\/]+\/releases\/download\/.+/,
    /https:\/\/github\.com\/[^\/]+\/[^\/]+\/archive\/.+/,
    /https:\/\/github\.com\/[^\/]+\/[^\/]+\/raw\/.+/,
    /https:\/\/objects\.githubusercontent\.com\/.+/,
    /https:\/\/raw\.githubusercontent\.com\/.+/,
    /https:\/\/codeload\.github\.com\/.+/,
    /https:\/\/github\.com\/[^\/]+\/[^\/]+\/suites\/\d+\/artifacts\/.+/
  ];
  
  // 检查是否是 GitHub 下载链接
  function isGitHubDownloadLink(url) {
    return GITHUB_DOWNLOAD_PATTERNS.some(pattern => pattern.test(url));
  }
  
  // 检查是否是 Git clone 链接
  function isGitCloneLink(url) {
    if (!url) return false;
    if (url.includes('github.com/') && !url.includes('/releases/') && !url.includes('/blob/') && !url.includes('/tree/')) {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (match && match[1] && match[2]) {
        return true;
      }
    }
    return false;
  }
  
  // 生成加速的 clone 链接
  function generateAcceleratedCloneUrl(originalUrl) {
    if (!config.workersUrl) return null;
    
    const workersHost = config.workersUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const githubPath = originalUrl.replace('https://github.com/', '');
    
    return `https://${workersHost}/github/${githubPath}`;
  }
  
  // 生成加速链接（下载）- 使用专门的 GitHub 代理路由
  function generateAcceleratedUrl(originalUrl) {
    if (!config.workersUrl) return null;
    
    const workersHost = config.workersUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // 根据不同的 GitHub 域名使用不同的代理路由
    if (originalUrl.includes('raw.githubusercontent.com/')) {
      const path = originalUrl.replace('https://raw.githubusercontent.com/', '');
      return `https://${workersHost}/gh-raw/${path}`;
    }
    
    if (originalUrl.includes('codeload.github.com/')) {
      const path = originalUrl.replace('https://codeload.github.com/', '');
      return `https://${workersHost}/gh-codeload/${path}`;
    }
    
    if (originalUrl.includes('objects.githubusercontent.com/')) {
      const path = originalUrl.replace('https://objects.githubusercontent.com/', '');
      return `https://${workersHost}/gh-objects/${path}`;
    }
    
    if (originalUrl.includes('github.com/')) {
      const path = originalUrl.replace('https://github.com/', '');
      return `https://${workersHost}/github/${path}`;
    }
    
    return null;
  }
  
  // 创建下载加速按钮
  function createAccelerateButton(link) {
    if (link.nextElementSibling?.classList.contains('cfspider-btn')) return;
    if (link.parentElement.querySelector('.cfspider-btn')) return;
    
    const btn = document.createElement('a');
    btn.className = 'cfspider-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"/>
      </svg>
      加速
    `;
    btn.title = 'CFspider 加速下载';
    btn.href = generateAcceleratedUrl(link.href) || '#';
    btn.target = '_blank';
    
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!config.workersUrl) {
        alert('请先在 CFspider 扩展中配置 Workers 地址');
        return;
      }
      
      const acceleratedUrl = generateAcceleratedUrl(link.href);
      if (acceleratedUrl) {
        window.open(acceleratedUrl, '_blank');
      } else {
        alert('不支持加速此链接类型');
      }
    });
    
    if (link.parentElement.classList.contains('d-flex') || 
        link.closest('.Box-row') || 
        link.closest('.release-main-section')) {
      link.parentElement.insertBefore(btn, link.nextSibling);
    } else {
      link.insertAdjacentElement('afterend', btn);
    }
  }
  
  // 扫描并处理下载链接
  function scanDownloadLinks() {
    if (!config.enabled || !config.downloadAccel) return;
    
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      if (isGitHubDownloadLink(link.href)) {
        createAccelerateButton(link);
      }
    });
  }
  
  // 处理 Clone URL - 直接替换输入框内容和复制按钮
  function processCloneUrl() {
    if (!config.enabled || !config.cloneAccel || !config.workersUrl) return;
    
    const selectors = [
      'input[readonly]',
      'input[data-autoselect]',
      'input.form-control[readonly]',
      'input[aria-label*="clone"]',
      'input[aria-label*="Clone"]',
      '.input-group input',
      '[data-target="get-repo-modal.cloneInput"]'
    ];
    
    let cloneInputs = [];
    selectors.forEach(sel => {
      const inputs = document.querySelectorAll(sel);
      inputs.forEach(i => {
        if (!cloneInputs.includes(i)) cloneInputs.push(i);
      });
    });
    
    cloneInputs.forEach(input => {
      if (input.dataset.cfspiderProcessed) return;
      
      const value = input.value;
      if (!isGitCloneLink(value)) return;
      
      input.dataset.cfspiderProcessed = 'true';
      
      const originalUrl = value;
      const acceleratedUrl = generateAcceleratedCloneUrl(originalUrl);
      if (!acceleratedUrl) return;
      
      const inputGroup = input.closest('.input-group') || input.parentElement;
      
      // 创建加速按钮
      const accelBtn = document.createElement('button');
      accelBtn.className = 'cfspider-accel-toggle';
      accelBtn.type = 'button';
      accelBtn.innerHTML = '⚡ 加速';
      accelBtn.title = '点击切换为 CFspider 加速链接';
      
      // 存储状态到 input 元素上
      input._cfspiderState = { original: originalUrl, accelerated: acceleratedUrl, isAccelerated: false };
      
      accelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const state = input._cfspiderState;
        
        if (!state.isAccelerated) {
          input.value = acceleratedUrl;
          accelBtn.innerHTML = '✓ 已加速';
          accelBtn.classList.add('active');
          state.isAccelerated = true;
        } else {
          input.value = originalUrl;
          accelBtn.innerHTML = '⚡ 加速';
          accelBtn.classList.remove('active');
          state.isAccelerated = false;
        }
        
        input.select();
      });
      
      input.insertAdjacentElement('afterend', accelBtn);
      
      // 拦截容器内所有按钮的点击（可能是复制按钮）
      interceptCopyButtons(inputGroup, input);
    });
  }
  
  // 拦截复制按钮
  function interceptCopyButtons(container, input) {
    let searchContainer = container;
    for (let i = 0; i < 3; i++) {
      if (searchContainer.parentElement) {
        searchContainer = searchContainer.parentElement;
      }
    }
    
    const buttons = searchContainer.querySelectorAll('button, [role="button"]');
    
    buttons.forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const title = btn.getAttribute('title') || '';
      const text = btn.textContent || '';
      
      if (ariaLabel.toLowerCase().includes('copy') || 
          title.toLowerCase().includes('copy') ||
          text.toLowerCase().includes('copy') ||
          btn.querySelector('svg.octicon-copy')) {
        
        btn.addEventListener('click', (e) => {
          const state = input._cfspiderState;
          if (state && state.isAccelerated) {
            e.stopImmediatePropagation();
            e.preventDefault();
            
            navigator.clipboard.writeText(state.accelerated).then(() => {
              showCopySuccess(btn);
            });
            
            return false;
          }
        }, true);
      }
    });
  }
  
  // 显示复制成功
  function showCopySuccess(btn) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="#3fb950"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 1500);
  }
  
  // 加载配置
  async function loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['workersUrl', 'uuid', 'enabled', 'cloneAccel', 'downloadAccel']);
      config.workersUrl = result.workersUrl || '';
      config.uuid = result.uuid || '';
      config.enabled = result.enabled !== false;
      config.cloneAccel = result.cloneAccel !== false;
      config.downloadAccel = result.downloadAccel !== false;
    } catch (e) {
      console.error('CFspider: 加载配置失败', e);
    }
  }
  
  // 监听配置变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.workersUrl) config.workersUrl = changes.workersUrl.newValue || '';
    if (changes.uuid) config.uuid = changes.uuid.newValue || '';
    if (changes.enabled !== undefined) config.enabled = changes.enabled.newValue !== false;
    if (changes.cloneAccel !== undefined) config.cloneAccel = changes.cloneAccel.newValue !== false;
    if (changes.downloadAccel !== undefined) config.downloadAccel = changes.downloadAccel.newValue !== false;
    
    if (config.enabled) {
      scanDownloadLinks();
      processCloneUrl();
    }
  });
  
  // 防抖变量
  let scanTimeout = null;
  let lastScanTime = 0;
  const SCAN_THROTTLE = 500;
  
  // 节流扫描函数
  function throttledScan() {
    const now = Date.now();
    if (now - lastScanTime < SCAN_THROTTLE) {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(() => {
        lastScanTime = Date.now();
        scanDownloadLinks();
        processCloneUrl();
      }, SCAN_THROTTLE);
      return;
    }
    
    lastScanTime = now;
    scanDownloadLinks();
    processCloneUrl();
  }
  
  // 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
      }
    });
    
    if (shouldScan) {
      throttledScan();
    }
  });
  
  // 初始化
  async function init() {
    await loadConfig();
    scanDownloadLinks();
    processCloneUrl();
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    document.addEventListener('pjax:end', () => {
      scanDownloadLinks();
      processCloneUrl();
    });
    document.addEventListener('turbo:load', () => {
      scanDownloadLinks();
      processCloneUrl();
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
