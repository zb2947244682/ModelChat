<template>
  <div class="home-container">
    <!-- 左侧对话列表 - 在PC模式下始终显示 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>AI聊天助手</h2>
      </div>
      
      <div class="sidebar-content">
        <ChatList 
          @select-conversation="selectConversation"
          :class="{ 'mobile-chat-list': true }"
          :hide-close-button="true"
        />
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="main-content">
      <div class="main-header">
        <div class="conversation-title-container">
          <input 
            v-if="isTitleEditing" 
            v-model="editingTitle" 
            @blur="saveTitle" 
            @keydown.enter="saveTitle"
            ref="titleInput"
            class="title-input"
          />
          <h1 v-else @click="startEditingTitle">
            {{ currentConversation?.title || '新对话' }}
            <span class="edit-icon">✏️</span>
          </h1>
        </div>
        
        <div class="actions">
          <button @click="showChatList = !showChatList" title="对话列表" class="mobile-only">
            <span class="icon">&#9776;</span>
          </button>
          <button @click="goToSettings" title="设置">
            <span class="icon">&#9881;</span>
          </button>
        </div>
      </div>


      <div class="chat-container">
        <div class="messages" ref="messagesContainer">
          <div v-if="!currentConversation || (currentConversation.messages.length === 0 && !systemPrompt)" class="empty-state">
            <p>开始一个新的对话吧！</p>
            <button @click="clearConversation">清空对话记录</button>
          </div>
          <template v-else>
            <!-- 系统提示词作为一条消息显示 -->
            <div v-if="systemPrompt" class="message system-message">
              <div class="message-header">
                <div class="message-role">系统</div>
              </div>
              
              <div v-if="editingSystemPrompt" class="message-edit">
                <textarea v-model="editingSystemPromptContent"></textarea>
                <div class="edit-actions">
                  <button @click="saveSystemPromptEdit" title="保存">🗸</button>
                  <button @click="cancelSystemPromptEdit" title="取消">✗</button>
                </div>
              </div>
              <div v-else class="message-content">{{ systemPrompt }}</div>
              
              <div v-if="!editingSystemPrompt" class="message-actions visible">
                <button @click="editSystemPrompt" title="编辑">✏️</button>
              </div>
            </div>
            
            <!-- 用户和助手消息 -->
            <div v-for="message in currentConversation.messages" :key="message.id" 
              :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']">
              <div class="message-header">
                <div class="message-role">{{ message.role === 'user' ? '用户' : 'AI助手' }}</div>
              </div>
              
              <div v-if="editingMessageId === message.id" class="message-edit">
                <textarea v-model="editingContent"></textarea>
                <div class="edit-actions">
                  <button @click="saveEdit(message.id)">保存</button>
                  <button @click="cancelEdit()">取消</button>
                </div>
              </div>
              <div v-else class="message-content">{{ message.content }}</div>
              
              <!-- 用户消息操作 -->
              <div v-if="message.role === 'user'" class="message-actions visible">
                <button @click="editMessage(message)" title="编辑">✏️</button>
                <button @click="deleteMessage(message.id)" title="删除">🗑️</button>
              </div>
              
              <!-- 助手消息操作 -->
              <div v-else class="message-actions visible">
                <button @click="copyAsMarkdown(message.content)" title="复制为Markdown">📋</button>
                <button @click="copyAsText(message.content)" title="复制文本">📄</button>
                <button @click="regenerateMessage(message.id)" title="重新生成">🔄</button>
                <button @click="deleteMessage(message.id)" title="删除">🗑️</button>
              </div>
            </div>
          </template>
          
          <div v-if="isLoading" class="message assistant-message">
            <div class="message-content loading">
              {{ loadingTimeout ? '大模型无响应' : '正在思考...' }}
              <button v-if="!loadingTimeout" @click="stopLoading" class="stop-button" title="停止">⏹️</button>
            </div>
          </div>
          
          <div v-if="currentConversation && currentConversation.messages.length > 0" class="clear-conversation">
            <button @click="clearConversation">清空对话记录</button>
          </div>
        </div>

        <div class="input-area">
          <div class="custom-selects">
            <!-- 自定义提供商选择器 -->
            <div class="custom-select" :class="{ 'active': isProviderSelectOpen }">
              <div class="select-header" @click="toggleProviderSelect">
                <span>{{ selectedProvider || '选择提供商' }}</span>
                <span class="select-arrow">▼</span>
              </div>
              <div v-if="isProviderSelectOpen" class="select-options">
                <div 
                  v-for="model in models" 
                  :key="model.provider" 
                  class="select-option"
                  :class="{ 'selected': selectedProvider === model.provider }"
                  @click="selectProvider(model.provider)"
                >
                  {{ model.provider }}
                </div>
              </div>
            </div>
            
            <!-- 自定义模型选择器 -->
            <div class="custom-select" :class="{ 'active': isModelSelectOpen }">
              <div class="select-header" @click="toggleModelSelect">
                <span>{{ selectedModelName || '选择模型' }}</span>
                <span class="select-arrow">▼</span>
              </div>
              <div v-if="isModelSelectOpen" class="select-options">
                <div 
                  v-for="modelName in currentModelNames" 
                  :key="modelName" 
                  class="select-option"
                  :class="{ 'selected': selectedModelName === modelName }"
                  @click="selectModel(modelName)"
                >
                  {{ modelName }}
                </div>
              </div>
            </div>
            
          </div>
          
          <div class="input-container">
            <textarea 
              v-model="userInput" 
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.shift.enter="() => {}"
              placeholder="输入您的问题或指令... (Enter发送，Shift+Enter换行)"
              rows="4"
            ></textarea>
            <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">
              <span class="icon">&#10148;</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端对话列表面板 -->
    <div class="chat-list-panel" v-if="showChatList">
      <ChatList 
        @select-conversation="selectConversation" 
        @close="showChatList = false"
      />
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue';
import ChatList from '../components/ChatList.vue';
import { useHomeLogic } from '../logic/homeLogic';

export default {
  name: 'Home',
  components: {
    ChatList
  },
  setup() {
    const homeLogic = useHomeLogic();
    
    // 初始化
    onMounted(() => {
      homeLogic.initialize();
      homeLogic.setupWatchers();
      const cleanupEventListeners = homeLogic.setupEventListeners();
      
      // 清理事件监听器
      onUnmounted(() => {
        cleanupEventListeners();
      });
    });

    return {
      // 状态
      userInput: homeLogic.userInput,
      isLoading: homeLogic.isLoading,
      loadingTimeout: homeLogic.loadingTimeout,
      showChatList: homeLogic.showChatList,
      messagesContainer: homeLogic.messagesContainer,
      systemPrompt: homeLogic.systemPrompt,
      models: homeLogic.models,
      selectedProvider: homeLogic.selectedProvider,
      selectedModelName: homeLogic.selectedModelName,
      currentModelNames: homeLogic.currentModelNames,
      currentConversation: homeLogic.currentConversation,
      editingMessageId: homeLogic.editingMessageId,
      editingContent: homeLogic.editingContent,
      isTitleEditing: homeLogic.isTitleEditing,
      editingTitle: homeLogic.editingTitle,
      titleInput: homeLogic.titleInput,
      editingSystemPrompt: homeLogic.editingSystemPrompt,
      editingSystemPromptContent: homeLogic.editingSystemPromptContent,
      showSystemPromptModal: homeLogic.showSystemPromptModal,
      isProviderSelectOpen: homeLogic.isProviderSelectOpen,
      isModelSelectOpen: homeLogic.isModelSelectOpen,
      
      // 方法
      onProviderChange: homeLogic.onProviderChange,
      createNewConversation: homeLogic.createNewConversation,
      selectConversation: homeLogic.selectConversation,
      updateSystemPrompt: homeLogic.updateSystemPrompt,
      sendMessage: homeLogic.sendMessage,
      goToSettings: homeLogic.goToSettings,
      stopLoading: homeLogic.stopLoading,
      editMessage: homeLogic.editMessage,
      saveEdit: homeLogic.saveEdit,
      cancelEdit: homeLogic.cancelEdit,
      copyAsMarkdown: homeLogic.copyAsMarkdown,
      copyAsText: homeLogic.copyAsText,
      deleteMessage: homeLogic.deleteMessage,
      regenerateMessage: homeLogic.regenerateMessage,
      clearConversation: homeLogic.clearConversation,
      startEditingTitle: homeLogic.startEditingTitle,
      saveTitle: homeLogic.saveTitle,
      editSystemPrompt: homeLogic.editSystemPrompt,
      saveSystemPromptEdit: homeLogic.saveSystemPromptEdit,
      cancelSystemPromptEdit: homeLogic.cancelSystemPromptEdit,
      toggleProviderSelect: homeLogic.toggleProviderSelect,
      toggleModelSelect: homeLogic.toggleModelSelect,
      selectProvider: homeLogic.selectProvider,
      selectModel: homeLogic.selectModel
    };
  }
};
</script>

<style scoped>
@import '../assets/styles/home.css';
</style>
