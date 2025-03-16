<template>
  <router-view />
</template>

<style>
:root {
  /* 浅色模式变量 */
  --bg-primary: #f9f9f9;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f0f0f0;
  
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #888888;
  
  --border-color: #eeeeee;
  --shadow-color: rgba(0, 0, 0, 0.1);
  
  --primary-color: #4285f4;
  --primary-light: #e6f4ff;
  --primary-dark: #1a73e8;
  
  --accent-color: #ea4335;
  --success-color: #34a853;
  --warning-color: #fbbc05;
  
  --scrollbar-track: #f1f1f1;
  --scrollbar-thumb: #cccccc;
  --scrollbar-thumb-hover: #aaaaaa;
}

[data-theme="dark"] {
  /* 深色模式变量 */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  
  --text-primary: #f0f0f0;
  --text-secondary: #cccccc;
  --text-muted: #aaaaaa;
  
  --border-color: #444444;
  --shadow-color: rgba(255, 255, 255, 0.05);
  
  --primary-color: #4285f4;
  --primary-light: #1a3c61;
  --primary-dark: #1a73e8;
  
  --accent-color: #ea4335;
  --success-color: #34a853;
  --warning-color: #fbbc05;
  
  --scrollbar-track: #2a2a2a;
  --scrollbar-thumb: #555555;
  --scrollbar-thumb-hover: #666666;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  height: 100%;
  width: 100%;
  overflow: hidden;
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  height: 100vh;
  width: 100vw;
}

/* Element Plus 主题覆盖 */
:deep(.el-button--primary) {
  --el-button-bg-color: var(--primary-color);
  --el-button-border-color: var(--primary-color);
  --el-button-hover-bg-color: var(--primary-dark);
  --el-button-hover-border-color: var(--primary-dark);
}

:deep(.el-message-box),
:deep(.el-dialog),
:deep(.el-drawer) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* 响应式工具类 */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
  
  .desktop-only {
    display: none;
  }
}
</style>
