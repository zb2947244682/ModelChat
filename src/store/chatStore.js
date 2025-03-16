// 对话存储
const CHAT_STORAGE_KEY = 'model-chat-conversations';
const CURRENT_CONVERSATION_KEY = 'model-chat-current-conversation';

import { reactive } from 'vue';

export const chatStore = {
  state: reactive({
    conversations: [],
    currentConversationId: null
  }),

  // 初始化，从localStorage加载数据
  init() {
    try {
      // 加载对话列表
      const storedConversations = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedConversations) {
        this.state.conversations = JSON.parse(storedConversations).map(conv => reactive(conv));
        console.log('已从localStorage加载对话列表:', this.state.conversations.length, '个对话');
      }
      
      // 加载当前对话ID
      const currentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
      if (currentId) {
        this.state.currentConversationId = currentId;
        console.log('已从localStorage加载当前对话ID:', currentId);
        
        // 验证ID是否存在于对话列表中
        const exists = this.state.conversations.some(conv => conv.id === currentId);
        if (!exists) {
          console.warn('加载的当前对话ID不存在于对话列表中，重置当前对话');
          this.state.currentConversationId = null;
        }
      }
      
      // 若当前无对话且有对话列表，则设置第一个为当前对话
      if (!this.state.currentConversationId && this.state.conversations.length > 0) {
        this.state.currentConversationId = this.state.conversations[0].id;
        console.log('初始化设置第一个对话为当前对话:', this.state.currentConversationId);
        this._saveCurrentConversationIdToStorage();
      }
      
      // 确保至少有一个对话
      if (this.state.conversations.length === 0) {
        console.log('没有对话记录，创建一个新对话');
        const newConversation = this.createConversation('新对话');
        this.state.currentConversationId = newConversation.id;
        console.log('初始化创建新对话:', this.state.currentConversationId);
      }
    } catch (error) {
      console.error('加载对话数据失败:', error);
      this.state.conversations = [];
      this.state.currentConversationId = null;
      
      // 即使出错也确保有一个对话
      console.log('初始化出错，创建一个新对话');
      const newConversation = this.createConversation('新对话');
      this.state.currentConversationId = newConversation.id;
    }
  },

  // 获取所有对话
  getConversations() {
    return this.state.conversations;
  },

  // 获取当前对话
  getCurrentConversation() {
    if (!this.state.currentConversationId) return null;
    return this.state.conversations.find(conv => conv.id === this.state.currentConversationId) || null;
  },

  // 设置当前对话
  setCurrentConversation(conversationId) {
    console.log('设置当前对话ID:', conversationId);
    
    // 验证对话ID是否存在
    const exists = this.state.conversations.some(conv => conv.id === conversationId);
    
    if (exists) {
      this.state.currentConversationId = conversationId;
      this._saveCurrentConversationIdToStorage();
      return true;
    } else {
      console.error('尝试设置的对话ID不存在:', conversationId);
      return false;
    }
  },
  
  // 保存当前对话ID到localStorage
  _saveCurrentConversationIdToStorage() {
    try {
      if (this.state.currentConversationId) {
        localStorage.setItem(CURRENT_CONVERSATION_KEY, this.state.currentConversationId);
        console.log('已保存当前对话ID到localStorage:', this.state.currentConversationId);
      } else {
        localStorage.removeItem(CURRENT_CONVERSATION_KEY);
        console.log('已从localStorage移除当前对话ID');
      }
    } catch (error) {
      console.error('保存当前对话ID到localStorage失败:', error);
    }
  },

  // 创建新对话
  createConversation(title, systemPrompt = '') {
    const newConversation = reactive({
      id: Date.now().toString(),
      title: title || `对话 ${this.state.conversations.length + 1}`,
      systemPrompt: systemPrompt,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('创建新对话:', newConversation.id, '系统提示词:', systemPrompt);
    
    this.state.conversations.push(newConversation);
    this.state.currentConversationId = newConversation.id;
    
    // 保存到localStorage
    this._saveToStorage();
    this._saveCurrentConversationIdToStorage();
    
    console.log('当前对话ID设置为:', this.state.currentConversationId);
    
    return newConversation;
  },

  // 更新对话
  updateConversation(conversationId, updates) {
    const index = this.state.conversations.findIndex(conv => conv.id === conversationId);
    if (index !== -1) {
      const conversation = this.state.conversations[index];
      this.state.conversations[index] = {
        ...conversation,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // 保存到localStorage
      this._saveToStorage();
      
      return this.state.conversations[index];
    }
    return null;
  },

  // 删除对话
  deleteConversation(conversationId) {
    const index = this.state.conversations.findIndex(conv => conv.id === conversationId);
    if (index !== -1) {
      this.state.conversations.splice(index, 1);
      
      // 如果删除的是当前对话
      if (this.state.currentConversationId === conversationId) {
        console.log('删除的是当前对话，需要重置');
        
        // 如果还有其他对话，设置第一个为当前对话
        if (this.state.conversations.length > 0) {
          this.state.currentConversationId = this.state.conversations[0].id;
          console.log('设置新的当前对话:', this.state.currentConversationId);
        } else {
          // 没有对话了，创建一个新对话
          console.log('没有更多对话，创建新对话');
          const newConversation = this.createConversation('新对话');
          this.state.currentConversationId = newConversation.id;
          console.log('创建新对话并设置为当前对话:', this.state.currentConversationId);
        }
        
        // 更新localStorage中的当前对话ID
        this._saveCurrentConversationIdToStorage();
      }
      
      // 保存对话列表到localStorage
      this._saveToStorage();
      
      return true;
    }
    return false;
  },

  // 添加消息到对话
  addMessage(conversationId, message) {
    const conversation = this.state.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      // 如果没有提供id，则生成一个唯一id
      const messageToAdd = { ...message };
      if (!messageToAdd.id) {
        // 使用时间戳+随机数确保唯一性
        messageToAdd.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      // 添加消息
      conversation.messages.push({
        ...messageToAdd,
        timestamp: new Date().toISOString()
      });
      
      // 更新对话的更新时间
      conversation.updatedAt = new Date().toISOString();
      
      // 保存到localStorage
      this._saveToStorage();
      
      return conversation;
    }
    return null;
  },

  // 保存到localStorage
  _saveToStorage() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.state.conversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error);
    }
  }
};

// 初始化
chatStore.init();
