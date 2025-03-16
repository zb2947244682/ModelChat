import { createPinia } from 'pinia'
import { watch } from 'vue'

// 创建pinia实例
const pinia = createPinia()

// 添加本地存储插件
pinia.use(({ store }) => {
  // 从本地存储恢复状态
  const storeId = store.$id
  const savedState = localStorage.getItem(`model-chat-${storeId}`)
  
  if (savedState) {
    store.$patch(JSON.parse(savedState))
  }
  
  // 监听状态变化，保存到本地存储
  watch(
    () => store.$state,
    (state) => {
      localStorage.setItem(`model-chat-${storeId}`, JSON.stringify(state))
    },
    { deep: true }
  )
})

export default pinia
