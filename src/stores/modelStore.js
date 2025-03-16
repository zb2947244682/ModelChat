import { defineStore } from 'pinia'

export const useModelStore = defineStore('model', {
  state: () => ({
    vendors: [], // 厂商列表
    models: [], // 模型列表
    currentVendor: null, // 当前选中的厂商
    currentModel: null, // 当前选中的模型
    conversations: {}, // 会话记录
    currentConversation: null, // 当前会话
    theme: 'light', // 主题模式：light 或 dark
  }),
  
  getters: {
    // 获取当前厂商的所有模型
    currentVendorModels: (state) => {
      if (!state.currentVendor) return []
      return state.models.filter(model => model.vendorId === state.currentVendor)
    },
    
    // 获取所有厂商名称
    vendorNames: (state) => {
      return state.vendors.map(vendor => vendor.name)
    },
    
    // 获取当前主题
    isDarkMode: (state) => {
      return state.theme === 'dark'
    }
  },
  
  actions: {
    // 添加厂商
    addVendor(vendor) {
      const id = Date.now().toString()
      const newVendor = { 
        ...vendor, 
        id,
        apiType: vendor.apiType || 'custom',
        apiUrl: vendor.apiUrl || '',
        apiPath: vendor.apiPath || '',
      }
      
      this.vendors.push(newVendor)
      
      // 如果是第一个厂商，设为当前厂商
      if (this.vendors.length === 1) {
        this.currentVendor = id
      }
      
      return id
    },
    
    // 更新厂商
    updateVendor(id, updatedVendor) {
      const index = this.vendors.findIndex(vendor => vendor.id === id)
      if (index !== -1) {
        this.vendors[index] = { ...this.vendors[index], ...updatedVendor }
      }
    },
    
    // 删除厂商
    deleteVendor(id) {
      // 删除该厂商下的所有模型
      const vendorModels = this.models.filter(model => model.vendorId === id)
      vendorModels.forEach(model => {
        this.deleteModel(model.id)
      })
      
      this.vendors = this.vendors.filter(vendor => vendor.id !== id)
      
      // 如果删除的是当前厂商，切换到第一个厂商
      if (this.currentVendor === id) {
        this.currentVendor = this.vendors.length > 0 ? this.vendors[0].id : null
        
        // 如果还有厂商，选择第一个厂商的第一个模型
        if (this.currentVendor) {
          const firstModel = this.models.find(model => model.vendorId === this.currentVendor)
          if (firstModel) {
            this.currentModel = firstModel.id
          }
        } else {
          this.currentModel = null
        }
      }
    },
    
    // 设置当前厂商
    setCurrentVendor(id) {
      this.currentVendor = id
      
      // 切换到该厂商的第一个模型
      const firstModel = this.models.find(model => model.vendorId === id)
      if (firstModel) {
        this.setCurrentModel(firstModel.id)
      } else {
        this.currentModel = null
      }
    },
    
    // 添加模型
    addModel(model) {
      // 确保有vendorId
      if (!model.vendorId && this.currentVendor) {
        model.vendorId = this.currentVendor
      }
      
      // 如果没有指定厂商，创建一个新厂商
      if (!model.vendorId) {
        const vendorId = this.addVendor({
          name: model.apiType || 'Custom',
          apiType: model.apiType,
          apiUrl: model.apiUrl,
          apiPath: model.apiPath,
        })
        model.vendorId = vendorId
      }
      
      // 生成唯一ID
      const id = Date.now().toString()
      const newModel = { ...model, id }
      
      this.models.push(newModel)
      
      // 如果是第一个模型，设为当前模型
      if (this.models.length === 1) {
        this.currentModel = id
      }
      
      // 为新模型创建一个空会话
      this.createConversation(id)
      
      return id
    },
    
    // 更新模型
    updateModel(id, updatedModel) {
      const index = this.models.findIndex(model => model.id === id)
      if (index !== -1) {
        this.models[index] = { ...this.models[index], ...updatedModel }
        
        // 如果更新了厂商相关信息，同步更新厂商
        if (updatedModel.apiUrl || updatedModel.apiPath || updatedModel.apiType) {
          const vendorId = this.models[index].vendorId
          if (vendorId) {
            const vendorUpdates = {}
            if (updatedModel.apiUrl) vendorUpdates.apiUrl = updatedModel.apiUrl
            if (updatedModel.apiPath) vendorUpdates.apiPath = updatedModel.apiPath
            if (updatedModel.apiType) vendorUpdates.apiType = updatedModel.apiType
            
            this.updateVendor(vendorId, vendorUpdates)
          }
        }
      }
    },
    
    // 删除模型
    deleteModel(id) {
      this.models = this.models.filter(model => model.id !== id)
      
      // 如果删除的是当前模型，切换到同一厂商的第一个模型
      if (this.currentModel === id) {
        const vendorId = this.models.find(m => m.id === id)?.vendorId
        const firstModel = vendorId ? 
          this.models.find(m => m.vendorId === vendorId) : 
          this.models[0]
          
        this.currentModel = firstModel ? firstModel.id : null
      }
      
      // 删除相关会话
      delete this.conversations[id]
    },
    
    setCurrentModel(id) {
      this.currentModel = id
      // 切换到该模型的会话
      this.currentConversation = id
    },
    
    createConversation(modelId) {
      if (!this.conversations[modelId]) {
        this.conversations[modelId] = {
          messages: []
        }
      }
      this.currentConversation = modelId
    },
    
    addMessage(modelId, message) {
      if (this.conversations[modelId]) {
        this.conversations[modelId].messages.push(message)
      }
    },
    
    clearConversation(modelId) {
      if (this.conversations[modelId]) {
        this.conversations[modelId].messages = []
      }
    }
  }
})
