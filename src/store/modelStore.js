// 模型配置存储
const MODEL_STORAGE_KEY = 'model-chat-models';

export const modelStore = {
  state: {
    models: [],
    defaultModel: null
  },

  // 初始化，从localStorage加载数据
  init() {
    try {
      const storedModels = localStorage.getItem(MODEL_STORAGE_KEY);
      if (storedModels) {
        this.state.models = JSON.parse(storedModels);
        // 设置默认模型
        this.state.defaultModel = this.state.models.find(model => model.is_default === true) || null;
      }
    } catch (error) {
      console.error('Failed to load models from localStorage:', error);
      this.state.models = [];
    }
  },

  // 获取所有模型
  getModels() {
    return this.state.models;
  },

  // 获取默认模型
  getDefaultModel() {
    return this.state.defaultModel;
  },

  // 根据提供商获取模型
  getModelsByProvider(provider) {
    return this.state.models.filter(model => model.provider === provider);
  },

  // 添加或更新模型
  saveModel(model) {
    const index = this.state.models.findIndex(m => m.provider === model.provider);
    
    // 如果设置为默认，则将其他模型设为非默认
    if (model.is_default) {
      this.state.models.forEach(m => {
        m.is_default = false;
      });
    }
    
    if (index !== -1) {
      // 更新现有模型
      this.state.models[index] = model;
    } else {
      // 添加新模型
      this.state.models.push(model);
    }
    
    // 更新默认模型
    if (model.is_default) {
      this.state.defaultModel = model;
    } else if (this.state.defaultModel && this.state.defaultModel.provider === model.provider) {
      // 如果当前模型是默认模型但被设置为非默认，则清除默认模型
      this.state.defaultModel = null;
    }
    
    // 保存到localStorage
    this._saveToStorage();
    
    return model;
  },

  // 删除模型
  deleteModel(provider) {
    const index = this.state.models.findIndex(m => m.provider === provider);
    if (index !== -1) {
      const deletedModel = this.state.models[index];
      this.state.models.splice(index, 1);
      
      // 如果删除的是默认模型，则清除默认模型
      if (deletedModel.is_default) {
        this.state.defaultModel = null;
      }
      
      // 保存到localStorage
      this._saveToStorage();
      return true;
    }
    return false;
  },

  // 设置默认模型
  setDefaultModel(provider) {
    const model = this.state.models.find(m => m.provider === provider);
    if (model) {
      // 将所有模型设为非默认
      this.state.models.forEach(m => {
        m.is_default = false;
      });
      
      // 设置新的默认模型
      model.is_default = true;
      this.state.defaultModel = model;
      
      // 保存到localStorage
      this._saveToStorage();
      return true;
    }
    return false;
  },

  // 保存到localStorage
  _saveToStorage() {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(this.state.models));
    } catch (error) {
      console.error('Failed to save models to localStorage:', error);
    }
  }
};

// 初始化
modelStore.init();

// 添加默认的OpenRouter配置用于测试
// if (modelStore.state.models.length === 0) {
//   modelStore.saveModel({
//     provider: "OpenRouter",
//     api_mode: "OpenAPI标准接口",
//     api_endpoint: "https://openrouter.ai/api/v1",
//     api_path: "/chat/completions",
//     api_key: "",
//     model_list: ["GPT-4o-mini"],
//     max_context_messages: 20,
//     temperature: 0.7,
//     top_p: 1,
//     is_default: true
//   });
//   console.log('已添加默认OpenRouter配置');
// }
