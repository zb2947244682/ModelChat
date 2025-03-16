<template>
  <div class="chat-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="left-icon" @click="openSidebar">
        <el-icon><ChatLineRound /></el-icon>
      </div>
      <div class="title">
        {{ currentProviderName }}
      </div>
      <div class="model-selector">
        <el-dropdown @command="handleProviderChange" trigger="click">
          <span class="model-dropdown">
            供应商 <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="provider in providers" :key="provider.id" :command="provider.id">
                {{ provider.provider }}
              </el-dropdown-item>
              <el-dropdown-item divided command="settings">
                <el-icon><Setting /></el-icon> 设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="model-selector ml-2">
        <el-dropdown @command="handleModelChange" trigger="click">
          <span class="model-dropdown">
            {{ currentModel || '选择模型' }} <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="modelName in currentProviderModels" :key="modelName" :command="modelName">
                {{ modelName }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="right-icons">
        <div class="theme-toggle" @click="toggleTheme">
          <el-icon v-if="isDarkMode"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </div>
        <div class="right-icon" @click="goToSettings">
          <el-icon><Setting /></el-icon>
        </div>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-container">
        <h1 class="welcome-title">Hello, {{ username }}</h1>
        <div class="suggestion-chips">
          <div class="suggestion-chip" @click="usePrompt('帮我写一篇文章')">
            Help me write
          </div>
          <div class="suggestion-chip" @click="usePrompt('研究一个话题')">
            Research a topic
          </div>
          <div class="suggestion-chip" @click="usePrompt('帮我计划')">
            Help me plan
          </div>
          <div class="suggestion-chip" @click="usePrompt('给我学习建议')">
            Give me study tips
          </div>
        </div>
      </div>
      <template v-else>
        <div v-for="(message, index) in messages" :key="index" 
             :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-content">
            <div v-if="message.role !== 'user'" class="avatar">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="message-text" :class="{ 'streaming': message.streaming }">
              {{ message.content }}
            </div>
            <div class="message-actions">
              <el-dropdown trigger="click" @command="(cmd) => handleMessageAction(cmd, index)">
                <el-icon class="action-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">复制</el-dropdown-item>
                    <el-dropdown-item command="copyMd">复制为Markdown</el-dropdown-item>
                    <el-dropdown-item v-if="message.role === 'user'" command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="message.role === 'user'" command="resend">重新发送</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <!-- 编辑消息 -->
          <div v-if="editingIndex === index" class="edit-message">
            <el-input
              v-model="editingContent"
              type="textarea"
              :rows="3"
              resize="none"
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 无模型配置提示 -->
      <el-empty 
        v-if="providers.length === 0 && messages.length === 0"
        description="未配置任何大模型供应商"
        class="no-models-tip"
      >
        <el-button type="primary" @click="goToSettings">去配置</el-button>
      </el-empty>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="1"
          :placeholder="providers.length > 0 ? 'Ask me anything...' : '请先配置大模型供应商'"
          resize="none"
          @keyup.enter.native="sendMessage"
          :disabled="providers.length === 0 || isLoading"
          ref="inputEl"
        />
        <div class="send-button" @click="sendMessage" :class="{ disabled: providers.length === 0 || isLoading }">
          <el-icon v-if="!isLoading"><Position /></el-icon>
          <el-icon v-else class="loading"><Loading /></el-icon>
        </div>
      </div>
    </div>

    <!-- 侧边栏 -->
    <el-drawer v-model="sidebarVisible" direction="ltr" size="80%">
      <template #header>
        <h3>对话</h3>
      </template>
      <div class="sidebar-content">
        <div class="sidebar-item" @click="newConversation">
          <el-icon><Plus /></el-icon>
          <span>新对话</span>
        </div>
        
        <!-- 对话列表 -->
        <div class="sidebar-section">
          <div class="sidebar-section-title">对话历史</div>
          <div class="sidebar-item" v-for="(conversation, id) in modelStore.conversations" :key="id" 
               :class="{ active: modelStore.currentConversation === id }"
               @click="selectConversation(id)">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ getConversationTitle(conversation) }}</span>
          </div>
          <div v-if="Object.keys(modelStore.conversations).length === 0" class="sidebar-empty">
            暂无对话历史
          </div>
        </div>
        
        <div class="sidebar-item settings" @click="goToSettings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useModelStore } from '../stores/modelStore'
import apiService from '../services/apiService'
import { ElMessage } from 'element-plus'
import { 
  ChatLineRound, ChatDotRound, Setting, ArrowDown, Plus, Position, 
  Loading, MoreFilled, Shop, Moon, Sunny, Delete, Edit, CopyDocument
} from '@element-plus/icons-vue'

const router = useRouter()
const modelStore = useModelStore()

// 响应式状态
const userInput = ref('')
const isLoading = ref(false)
const sidebarVisible = ref(false)
const messagesContainer = ref(null)
const inputEl = ref(null)
const username = ref('User') // 可以从用户配置中获取
const editingIndex = ref(-1) // 当前正在编辑的消息索引
const editingContent = ref('') // 编辑中的消息内容
const streamingMessageId = ref(null) // 当前正在流式输出的消息ID

// 计算属性
const currentModel = computed(() => modelStore.currentModel)
const currentProvider = computed(() => modelStore.currentProvider)
const providers = computed(() => modelStore.providers)
const isDarkMode = computed(() => modelStore.isDarkMode)

const currentProviderModels = computed(() => modelStore.currentProviderModels)

const currentProviderName = computed(() => {
  const provider = providers.value.find(p => p.id === currentProvider.value)
  return provider ? provider.provider : 'AI Chat'
})

const messages = computed(() => {
  if (!modelStore.currentConversation || !modelStore.conversations[modelStore.currentConversation]) {
    return []
  }
  return modelStore.conversations[modelStore.currentConversation].messages
})

// 方法
const openSidebar = () => {
  sidebarVisible.value = true
}

const goToSettings = () => {
  router.push('/settings')
}

const handleProviderChange = (command) => {
  if (command === 'settings') {
    goToSettings()
  } else {
    modelStore.setCurrentProvider(command)
  }
}

const handleModelChange = (command) => {
  modelStore.setCurrentModel(command)
}

const selectConversation = (conversationId) => {
  modelStore.setCurrentConversation(conversationId)
  sidebarVisible.value = false
}

// 获取对话标题
const getConversationTitle = (conversation) => {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return '新对话'
  }
  
  // 查找第一条用户消息作为标题
  const firstUserMessage = conversation.messages.find(msg => msg.role === 'user')
  if (firstUserMessage) {
    // 截取前20个字符作为标题
    const title = firstUserMessage.content.trim()
    return title.length > 20 ? title.substring(0, 20) + '...' : title
  }
  
  return '新对话'
}

const newConversation = () => {
  modelStore.createNewConversation()
  sidebarVisible.value = false
}

const usePrompt = (prompt) => {
  userInput.value = prompt
  nextTick(() => {
    inputEl.value.focus()
  })
}

// 切换深色/浅色模式
const toggleTheme = () => {
  modelStore.theme = modelStore.theme === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', modelStore.theme)
}

// 处理消息操作（复制、编辑、删除等）
const handleMessageAction = (action, index) => {
  const message = messages.value[index]
  
  switch (action) {
    case 'copy':
      copyToClipboard(message.content)
      ElMessage.success('已复制到剪贴板')
      break
      
    case 'copyMd':
      copyToClipboard(apiService.convertToMarkdown(message.content))
      ElMessage.success('已复制Markdown格式到剪贴板')
      break
      
    case 'edit':
      if (message.role === 'user') {
        editingIndex.value = index
        editingContent.value = message.content
      }
      break
      
    case 'resend':
      if (message.role === 'user') {
        userInput.value = message.content
        // 删除此消息之后的所有消息
        if (modelStore.currentConversation) {
          modelStore.deleteMessagesAfter(index)
        }
      }
      break
      
    case 'delete':
      if (modelStore.currentConversation) {
        // 如果删除的是用户消息，同时删除下一条AI回复
        if (message.role === 'user' && index + 1 < messages.value.length && 
            messages.value[index + 1].role === 'assistant') {
          modelStore.deleteMessages(index, 2) // 删除两条消息
        } else {
          modelStore.deleteMessages(index, 1) // 删除一条消息
        }
      }
      break
  }
}

// 复制文本到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('复制到剪贴板失败:', err)
    ElMessage.error('复制失败')
  })
}

// 取消编辑消息
const cancelEdit = () => {
  editingIndex.value = -1
  editingContent.value = ''
}

// 保存编辑的消息
const saveEdit = () => {
  if (editingIndex.value >= 0 && modelStore.currentConversation) {
    // 更新消息内容
    modelStore.updateMessageContent(editingIndex.value, editingContent.value)
    
    // 如果编辑的是用户消息，删除之后的AI回复
    if (messages.value[editingIndex.value].role === 'user' && 
        editingIndex.value + 1 < messages.value.length && 
        messages.value[editingIndex.value + 1].role === 'assistant') {
      modelStore.deleteMessagesAfter(editingIndex.value)
    }
    
    // 重置编辑状态
    editingIndex.value = -1
    editingContent.value = ''
  }
}

  // 发送消息（非流式）
  const sendMessage = async () => {
    if (!userInput.value.trim() || isLoading.value || !currentModel.value) return
    
    const userMessage = {
      role: 'user',
      content: userInput.value.trim()
    }
    
    // 添加用户消息
    modelStore.addMessage(userMessage)
    userInput.value = ''
    
    // 滚动到底部
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
    
    // 获取当前模型配置（包含供应商信息）
    const modelConfig = modelStore.currentModelConfig
    if (!modelConfig) {
      ElMessage.error('未找到模型配置')
      return
    }
  
  isLoading.value = true
  
  try {
    // 添加一个占位消息，用于流式输出
    const placeholderId = Date.now().toString()
    const placeholderMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      streaming: true
    }
    modelStore.addMessage(placeholderMessage)
    streamingMessageId.value = placeholderId
    
    // 滚动到底部
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
    
    // 使用流式API
    await apiService.sendMessageStream(
      modelConfig,
      modelStore.conversations[modelStore.currentConversation].messages.slice(0, -1), // 不包括占位消息
      
      // 处理每个文本块
      (chunk) => {
        if (modelStore.currentConversation && modelStore.conversations[modelStore.currentConversation]) {
          const messages = modelStore.conversations[modelStore.currentConversation].messages
          const streamingMsgIndex = messages.findIndex(msg => msg.id === placeholderId)
          
          if (streamingMsgIndex !== -1) {
            messages[streamingMsgIndex].content += chunk
            
            // 滚动到底部
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          }
        }
      },
      
      // 完成回调
      (finalMessage) => {
        if (modelStore.currentConversation && modelStore.conversations[modelStore.currentConversation]) {
          const messages = modelStore.conversations[modelStore.currentConversation].messages
          const streamingMsgIndex = messages.findIndex(msg => msg.id === placeholderId)
          
          if (streamingMsgIndex !== -1) {
            // 更新最终消息内容，移除streaming标记
            messages[streamingMsgIndex] = {
              ...messages[streamingMsgIndex],
              content: finalMessage.content,
              streaming: false
            }
          }
        }
        
        streamingMessageId.value = null
        isLoading.value = false
      },
      
      // 错误回调
      (error) => {
        console.error('流式API请求错误:', error)
        
        if (modelStore.currentConversation && modelStore.conversations[modelStore.currentConversation]) {
          const messages = modelStore.conversations[modelStore.currentConversation].messages
          const streamingMsgIndex = messages.findIndex(msg => msg.id === placeholderId)
          
          if (streamingMsgIndex !== -1) {
            // 更新为错误消息
            messages[streamingMsgIndex] = {
              ...messages[streamingMsgIndex],
              content: `发生错误: ${error.message || '未知错误'}`,
              streaming: false,
              error: true
            }
          }
        }
        
        streamingMessageId.value = null
        isLoading.value = false
        ElMessage.error(`发送消息失败: ${error.message || '未知错误'}`)
      }
    )
  } catch (error) {
    console.error('发送消息错误:', error)
    ElMessage.error(`发送消息失败: ${error.message || '未知错误'}`)
    isLoading.value = false
  }
}

// 监听当前模型变化，滚动到底部
watch(currentModel, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

// 初始化
onMounted(() => {
  // 设置主题
  document.documentElement.setAttribute('data-theme', modelStore.theme)
  
  // 滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})
</script>

<style scoped>
/* 基础样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f9f9f9;
  color: #333;
  transition: all 0.3s ease;
}

/* 深色模式 */
.chat-container.dark-mode {
  background-color: #1a1a1a;
  color: #f0f0f0;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.3s ease;
}

.dark-mode .header {
  background-color: #2a2a2a;
  box-shadow: 0 1px 2px rgba(255, 255, 255, 0.05);
}

.left-icon, .right-icon {
  font-size: 24px;
  cursor: pointer;
  color: #555;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.dark-mode .left-icon, 
.dark-mode .right-icon,
.dark-mode .theme-toggle {
  color: #ccc;
}

.right-icons {
  display: flex;
  align-items: center;
}

.theme-toggle {
  font-size: 24px;
  cursor: pointer;
  color: #555;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  transition: color 0.3s ease;
}

.dark-mode .title {
  color: #f0f0f0;
}

.model-selector {
  margin-right: 16px;
}

.model-dropdown {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dark-mode .model-dropdown {
  background-color: #3a3a3a;
  color: #f0f0f0;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

.dark-mode .messages-container {
  background-color: #1a1a1a;
}

.welcome-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  background: linear-gradient(90deg, #4285f4, #ea4335, #fbbc05, #34a853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 40px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  max-width: 600px;
}

.suggestion-chip {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 24px;
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark-mode .suggestion-chip {
  background-color: #2a2a2a;
  border-color: #444;
  color: #f0f0f0;
}

.suggestion-chip:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.dark-mode .suggestion-chip:hover {
  background-color: #3a3a3a;
}

/* 消息样式 */
.message {
  margin-bottom: 16px;
  max-width: 85%;
  position: relative;
}

.user-message {
  align-self: flex-end;
}

.ai-message {
  align-self: flex-start;
}

.message-content {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #4285f4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.message-text {
  background-color: #fff;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-size: 15px;
  line-height: 1.5;
  transition: all 0.3s ease;
  white-space: pre-wrap;
  word-break: break-word;
}

.dark-mode .message-text {
  background-color: #2a2a2a;
  color: #f0f0f0;
  box-shadow: 0 1px 2px rgba(255, 255, 255, 0.05);
}

.user-message .message-text {
  background-color: #4285f4;
  color: white;
}

.dark-mode .user-message .message-text {
  background-color: #1a73e8;
}

.message-text.streaming::after {
  content: '▋';
  display: inline-block;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.message-actions {
  position: absolute;
  right: -30px;
  top: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.action-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #555;
  transition: all 0.2s;
}

.dark-mode .action-icon {
  background-color: #3a3a3a;
  color: #ccc;
}

.action-icon:hover {
  background-color: #e0e0e0;
}

.dark-mode .action-icon:hover {
  background-color: #4a4a4a;
}

.edit-message {
  margin-top: 8px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 8px;
  transition: background-color 0.3s ease;
}

.dark-mode .edit-message {
  background-color: #2a2a2a;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

.no-models-tip {
  margin: auto;
}

/* 输入区域 */
.input-container {
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #eee;
  transition: all 0.3s ease;
}

.dark-mode .input-container {
  background-color: #2a2a2a;
  border-top-color: #444;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 24px;
  padding: 8px 16px;
  transition: background-color 0.3s ease;
}

.dark-mode .input-wrapper {
  background-color: #3a3a3a;
}

.input-wrapper :deep(.el-textarea__inner) {
  background-color: transparent;
  border: none;
  padding: 8px 0;
  max-height: 120px;
  font-size: 16px;
  color: inherit;
  transition: color 0.3s ease;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.dark-mode .input-wrapper :deep(.el-textarea__inner) {
  color: #f0f0f0;
}

.dark-mode .input-wrapper :deep(.el-textarea__inner::placeholder) {
  color: #aaa;
}

.send-button {
  margin-left: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #4285f4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover {
  background-color: #1a73e8;
}

.send-button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.dark-mode .send-button.disabled {
  background-color: #555;
}

.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 侧边栏 */
.sidebar-content {
  padding: 16px;
  transition: background-color 0.3s ease;
}

.dark-mode :deep(.el-drawer) {
  background-color: #2a2a2a;
  color: #f0f0f0;
}

.dark-mode :deep(.el-drawer__header) {
  color: #f0f0f0;
  border-bottom-color: #444;
}

.sidebar-section {
  margin-top: 16px;
  margin-bottom: 16px;
}

.sidebar-section-title {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
  padding-left: 16px;
  transition: color 0.3s ease;
}

.dark-mode .sidebar-section-title {
  color: #aaa;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.3s ease;
}

.sidebar-item:hover {
  background-color: #f0f0f0;
}

.dark-mode .sidebar-item:hover {
  background-color: #3a3a3a;
}

.sidebar-item.active {
  background-color: #e6f4ff;
  color: #4285f4;
}

.dark-mode .sidebar-item.active {
  background-color: #1a3c61;
}

.sidebar-item .el-icon {
  margin-right: 12px;
}

.sidebar-item.settings {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 16px;
  transition: border-color 0.3s ease;
}

.dark-mode .sidebar-item.settings {
  border-top-color: #444;
}

.sidebar-empty {
  padding: 12px 16px;
  color: #888;
  font-style: italic;
  text-align: center;
}

.dark-mode .sidebar-empty {
  color: #aaa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .model-selector {
    display: none;
  }
  
  .message {
    max-width: 90%;
  }
  
  .message-actions {
    right: 0;
    top: -20px;
  }
}
</style>
