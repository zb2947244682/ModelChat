<template>
  <div class="model-edit-overlay">
    <div class="model-edit-container">
      <div class="header">
        <h2>{{ isNewModel ? '添加模型' : '编辑模型' }}</h2>
        <button @click="cancel">关闭</button>
      </div>

      <div class="form-container">
        <div class="form-group">
          <label for="provider">提供商名称</label>
          <input type="text" id="provider" v-model="formData.provider" placeholder="例如：阿里云、腾讯云等" />
        </div>

        <div class="form-group">
          <label for="api_mode">API模式</label>
          <select id="api_mode" v-model="formData.api_mode">
            <option value="OpenAPI标准接口">OpenAPI标准接口</option>
            <option value="Anthropic标准接口">Anthropic标准接口</option>
            <option value="Gemini标准接口">Gemini标准接口</option>
          </select>
        </div>

        <div class="form-group">
          <label for="api_endpoint">API域名</label>
          <input type="text" id="api_endpoint" v-model="formData.api_endpoint" placeholder="例如：https://api.openai.com/v1" />
        </div>

        <div class="form-group">
          <label for="api_path">API路径</label>
          <input type="text" id="api_path" v-model="formData.api_path" placeholder="例如：/chat/completions" />
        </div>

        <div class="form-group">
          <label for="api_key">API密钥</label>
          <input type="password" id="api_key" v-model="formData.api_key" placeholder="输入API密钥" />
        </div>

        <div class="form-group">
          <label for="model_list">模型列表</label>
          <div class="model-list-input">
            <input 
              type="text" 
              v-model="newModelName" 
              placeholder="输入模型名称后按回车添加" 
              @keydown.enter.prevent="addModelToList"
            />
            <button @click="addModelToList">添加</button>
          </div>
          <div class="model-tags">
            <div v-for="(model, index) in formData.model_list" :key="index" class="model-tag">
              {{ model }}
              <span @click="removeModelFromList(index)" class="remove-tag">×</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="max_context_messages">最大上下文消息数</label>
          <input type="number" id="max_context_messages" v-model.number="formData.max_context_messages" min="1" />
        </div>

        <div class="form-group">
          <label for="temperature">温度 (0.0-1.0)</label>
          <input type="number" id="temperature" v-model.number="formData.temperature" min="0" max="1" step="0.1" />
        </div>

        <div class="form-group">
          <label for="top_p">Top P (0.0-1.0)</label>
          <input type="number" id="top_p" v-model.number="formData.top_p" min="0" max="1" step="0.1" />
        </div>

        <div class="form-group checkbox">
          <input type="checkbox" id="is_default" v-model="formData.is_default" />
          <label for="is_default">设为默认模型</label>
        </div>

        <div class="form-actions">
          <button @click="cancel">取消</button>
          <button @click="save" :disabled="!isFormValid">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useModelEditLogic } from '../logic/modelEditLogic';

export default {
  name: 'ModelEdit',
  props: {
    model: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const modelEditLogic = useModelEditLogic(props, emit);
    
    // 初始化监听器
    modelEditLogic.setupWatchers();

    return {
      // 状态
      formData: modelEditLogic.formData,
      newModelName: modelEditLogic.newModelName,
      isNewModel: modelEditLogic.isNewModel,
      isFormValid: modelEditLogic.isFormValid,
      
      // 方法
      addModelToList: modelEditLogic.addModelToList,
      removeModelFromList: modelEditLogic.removeModelFromList,
      save: modelEditLogic.save,
      cancel: modelEditLogic.cancel
    };
  }
};
</script>

<style scoped>
/* 样式由用户单独优化 */
</style>
