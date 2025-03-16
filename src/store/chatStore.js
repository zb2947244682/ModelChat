// 对话存储
const CHAT_STORAGE_KEY = 'model-chat-conversations';

export const chatStore = {
  state: {
    conversations: [],
    currentConversationId: null
  },

  // 初始化，从localStorage加载数据
  init() {
    try {
      const storedConversations = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedConversations) {
        this.state.conversations = JSON.parse(storedConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error);
      this.state.conversations = [];
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
    this.state.currentConversationId = conversationId;
  },

  // 创建新对话
  createConversation(title, systemPrompt = '') {
    const newConversation = {
      id: Date.now().toString(),
      title: title || `对话 ${this.state.conversations.length + 1}`,
      systemPrompt: systemPrompt,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.state.conversations.push(newConversation);
    this.state.currentConversationId = newConversation.id;
    
    // 保存到localStorage
    this._saveToStorage();
    
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
      
      // 如果删除的是当前对话，则清除当前对话
      if (this.state.currentConversationId === conversationId) {
        this.state.currentConversationId = null;
      }
      
      // 保存到localStorage
      this._saveToStorage();
      
      return true;
    }
    return false;
  },

  // 添加消息到对话
  addMessage(conversationId, message) {
    const conversation = this.state.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      // 添加消息
      conversation.messages.push({
        id: Date.now().toString(),
        ...message,
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
