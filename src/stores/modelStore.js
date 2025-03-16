import { defineStore } from 'pinia'

export const useModelStore = defineStore('model', {
  state: () => ({
    providers: [], // 大模型供应商列表
    currentProvider: null, // 当前选中的供应商
    currentModel: null, // 当前选中的模型名称
    conversations: {}, // 会话记录，按会话ID索引
    currentConversation: null, // 当前会话ID
    theme: 'light', // 主题模式：light 或 dark
  }),
  
  getters: {
    // 获取当前供应商的所有模型
    currentProviderModels: (state) => {
      if (!state.currentProvider) return []
      const provider = state.providers.find(p => p.id === state.currentProvider)
      return provider ? provider.model_list : []
    },
    
    // 获取所有供应商名称
    providerNames: (state) => {
      return state.providers.map(provider => provider.provider)
    },
    
    // 获取当前主题
    isDarkMode: (state) => {
      return state.theme === 'dark'
    },
    
    // 获取当前模型的完整配置
    currentModelConfig: (state) => {
      if (!state.currentProvider || !state.currentModel) return null
      
      const provider = state.providers.find(p => p.id === state.currentProvider)
      if (!provider) return null
      
      return {
        provider: provider.provider,
        apiMode: provider.api_mode,
        apiUrl: provider.api_endpoint,
        apiPath: provider.api_path,
        apiKey: provider.api_key,
        model: state.currentModel,
        maxContextMessages: provider.max_context_messages || 20,
        temperature: provider.temperature || 0.7,
        maxTokens: provider.max_tokens || 2000,
        topP: provider.top_p || 1
      }
    },
    
    // 获取默认供应商
    defaultProvider: (state) => {
      return state.providers.find(p => p.is_default === true) || 
             (state.providers.length > 0 ? state.providers[0] : null)
    }
  },
  
  actions: {
    // 添加供应商
    addProvider(provider) {
      const id = Date.now().toString()
      const newProvider = { 
        ...provider, 
        id,
        api_mode: provider.api_mode || 'OpenAPI标准接口',
        api_endpoint: provider.api_endpoint || '',
        api_path: provider.api_path || '',
        model_list: provider.model_list || [],
        max_context_messages: provider.max_context_messages || 20,
        temperature: provider.temperature || 0.7,
        max_tokens: provider.max_tokens || 2000,
        top_p: provider.top_p || 1,
        is_default: provider.is_default || (this.providers.length === 0) // 如果是第一个供应商，默认设为默认
      }
      
      // 如果这个供应商被设为默认，将其他供应商设为非默认
      if (newProvider.is_default) {
        this.providers.forEach(p => {
          p.is_default = false
        })
      }
      
      this.providers.push(newProvider)
      
      // 如果是第一个供应商，设为当前供应商
      if (this.providers.length === 1) {
        this.currentProvider = id
        if (newProvider.model_list && newProvider.model_list.length > 0) {
          this.currentModel = newProvider.model_list[0]
        }
      }
      
      return id
    },
    
    // 更新供应商
    updateProvider(id, updatedProvider) {
      const index = this.providers.findIndex(provider => provider.id === id)
      if (index !== -1) {
        // 如果更新了is_default为true，将其他供应商设为非默认
        if (updatedProvider.is_default) {
          this.providers.forEach(p => {
            if (p.id !== id) {
              p.is_default = false
            }
          })
        }
        
        this.providers[index] = { ...this.providers[index], ...updatedProvider }
      }
    },
    
    // 删除供应商
    deleteProvider(id) {
      const wasDefault = this.providers.find(p => p.id === id)?.is_default
      
      this.providers = this.providers.filter(provider => provider.id !== id)
      
      // 如果删除的是当前供应商，切换到默认供应商或第一个供应商
      if (this.currentProvider === id) {
        const defaultProvider = this.providers.find(p => p.is_default) || 
                               (this.providers.length > 0 ? this.providers[0] : null)
        
        if (defaultProvider) {
          this.currentProvider = defaultProvider.id
          if (defaultProvider.model_list && defaultProvider.model_list.length > 0) {
            this.currentModel = defaultProvider.model_list[0]
          } else {
            this.currentModel = null
          }
        } else {
          this.currentProvider = null
          this.currentModel = null
        }
      }
      
      // 如果删除的是默认供应商，将第一个供应商设为默认
      if (wasDefault && this.providers.length > 0) {
        this.providers[0].is_default = true
      }
    },
    
    // 设置当前供应商
    setCurrentProvider(id) {
      this.currentProvider = id
      
      // 切换到该供应商的第一个模型
      const provider = this.providers.find(p => p.id === id)
      if (provider && provider.model_list && provider.model_list.length > 0) {
        this.currentModel = provider.model_list[0]
      } else {
        this.currentModel = null
      }
    },
    
    // 设置当前模型
    setCurrentModel(modelName) {
      this.currentModel = modelName
    },
    
    // 创建新会话
    createNewConversation() {
      const id = Date.now().toString()
      
      // 使用默认供应商或第一个供应商
      const defaultProvider = this.providers.find(p => p.is_default) || 
                             (this.providers.length > 0 ? this.providers[0] : null)
      
      if (defaultProvider) {
        this.conversations[id] = {
          id,
          providerId: defaultProvider.id,
          modelName: defaultProvider.model_list && defaultProvider.model_list.length > 0 ? 
                    defaultProvider.model_list[0] : null,
          messages: []
        }
        
        this.currentConversation = id
        this.currentProvider = defaultProvider.id
        this.currentModel = this.conversations[id].modelName
      }
      
      return id
    },
    
    // 切换到指定会话
    switchConversation(id) {
      if (this.conversations[id]) {
        this.currentConversation = id
        this.currentProvider = this.conversations[id].providerId
        this.currentModel = this.conversations[id].modelName
      }
    },
    
    // 添加消息到当前会话
    addMessage(message) {
      if (!this.currentConversation) {
        this.createNewConversation()
      }
      
      // 添加消息ID
      const messageWithId = {
        ...message,
        id: message.id || Date.now().toString()
      }
      
      this.conversations[this.currentConversation].messages.push(messageWithId)
    },
    
    // 更新消息内容
    updateMessageContent(index, content) {
      if (this.currentConversation && 
          this.conversations[this.currentConversation] &&
          this.conversations[this.currentConversation].messages[index]) {
        this.conversations[this.currentConversation].messages[index].content = content
      }
    },
    
    // 删除指定数量的消息
    deleteMessages(startIndex, count = 1) {
      if (this.currentConversation && this.conversations[this.currentConversation]) {
        const messages = this.conversations[this.currentConversation].messages
        if (startIndex >= 0 && startIndex < messages.length) {
          this.conversations[this.currentConversation].messages = [
            ...messages.slice(0, startIndex),
            ...messages.slice(startIndex + count)
          ]
        }
      }
    },
    
    // 删除指定索引之后的所有消息
    deleteMessagesAfter(index) {
      if (this.currentConversation && this.conversations[this.currentConversation]) {
        const messages = this.conversations[this.currentConversation].messages
        if (index >= 0 && index < messages.length) {
          this.conversations[this.currentConversation].messages = messages.slice(0, index + 1)
        }
      }
    },
    
    // 设置当前会话
    setCurrentConversation(conversationId) {
      if (this.conversations[conversationId]) {
        this.currentConversation = conversationId
        // 更新当前供应商和模型
        const conversation = this.conversations[conversationId]
        if (conversation.providerId) {
          this.currentProvider = conversation.providerId
        }
        if (conversation.modelName) {
          this.currentModel = conversation.modelName
        }
      }
    },
    
    // 清空当前会话
    clearCurrentConversation() {
      if (this.currentConversation && this.conversations[this.currentConversation]) {
        this.conversations[this.currentConversation].messages = []
      }
    },
    
    // 删除会话
    deleteConversation(id) {
      if (this.conversations[id]) {
        delete this.conversations[id]
        
        // 如果删除的是当前会话，切换到其他会话或创建新会话
        if (this.currentConversation === id) {
          const conversationIds = Object.keys(this.conversations)
          if (conversationIds.length > 0) {
            this.switchConversation(conversationIds[0])
          } else {
            this.createNewConversation()
          }
        }
      }
    },
    
    // 更新当前会话的供应商和模型
    updateCurrentConversationModel(providerId, modelName) {
      if (this.currentConversation && this.conversations[this.currentConversation]) {
        this.conversations[this.currentConversation].providerId = providerId
        this.conversations[this.currentConversation].modelName = modelName
        this.currentProvider = providerId
        this.currentModel = modelName
      }
    },
    
    // 初始化存储
    initStore() {
      // 如果没有会话，创建一个新会话
      if (Object.keys(this.conversations).length === 0) {
        this.createNewConversation()
      } 
      // 如果有会话但没有当前会话，选择第一个会话
      else if (!this.currentConversation) {
        this.currentConversation = Object.keys(this.conversations)[0]
        const conversation = this.conversations[this.currentConversation]
        this.currentProvider = conversation.providerId
        this.currentModel = conversation.modelName
      }
    }
  }
})
