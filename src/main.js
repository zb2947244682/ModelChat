import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { useModelStore } from './stores/modelStore'

import './assets/main.css'

const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化模型存储
const modelStore = useModelStore()
modelStore.initStore()

// 设置主题
document.documentElement.setAttribute('data-theme', modelStore.theme)

app.mount('#app')
