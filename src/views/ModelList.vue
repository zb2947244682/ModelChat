<template>
  <div class="model-list-container">
    <div class="header">
      <h1>模型列表</h1>
      <div class="actions">
        <button @click="goBack">返回</button>
        <button @click="addNewModel">添加模型</button>
      </div>
    </div>

    <div class="models-container">
      <div v-if="models.length === 0" class="empty-state">
        <p>暂无模型配置，请点击"添加模型"按钮添加</p>
      </div>
      <div v-else class="model-items">
        <div 
          v-for="model in models" 
          :key="model.provider" 
          class="model-item"
          @click="editModel(model)"
        >
          <div class="model-info">
            <div class="model-provider">{{ model.provider }}</div>
            <div class="model-api-mode">{{ model.api_mode }}</div>
            <div class="model-models">模型: {{ model.model_list.join(', ') }}</div>
          </div>
          <div class="model-actions">
            <button @click.stop="setAsDefault(model)">设为默认</button>
            <button @click.stop="deleteModel(model)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <ModelEdit 
      v-if="showModelEdit" 
      :model="currentEditModel" 
      @save="onModelSave" 
      @cancel="showModelEdit = false"
    />
  </div>
</template>

<script>
import { onMounted } from 'vue';
import ModelEdit from '../components/ModelEdit.vue';
import { useModelListLogic } from '../logic/modelListLogic';

export default {
  name: 'ModelList',
  components: {
    ModelEdit
  },
  setup() {
    const modelListLogic = useModelListLogic();
    
    // 初始化
    onMounted(() => {
      modelListLogic.initialize();
    });

    return {
      // 状态
      models: modelListLogic.models,
      showModelEdit: modelListLogic.showModelEdit,
      currentEditModel: modelListLogic.currentEditModel,
      
      // 方法
      goBack: modelListLogic.goBack,
      addNewModel: modelListLogic.addNewModel,
      editModel: modelListLogic.editModel,
      setAsDefault: modelListLogic.setAsDefault,
      deleteModel: modelListLogic.deleteModel,
      onModelSave: modelListLogic.onModelSave
    };
  }
};
</script>

<style scoped>
@import '../assets/styles/model-list.css';
</style>
