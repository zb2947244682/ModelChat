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
          :class="{ 'is-default': model.is_default }"
          @click="editModel(model)"
        >
          <div class="model-info">
            <div class="model-provider">{{ model.provider }}</div>
            <div class="model-api-mode">{{ model.api_mode }}</div>
            <div class="model-models">模型: {{ model.model_list.join(', ') }}</div>
          </div>
          <div class="model-actions">
            <button @click.stop="setAsDefault(model)" v-if="!model.is_default">设为默认</button>
            <span v-if="model.is_default" class="default-badge">默认</span>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ModelEdit from '../components/ModelEdit.vue';
import { modelStore } from '../store/modelStore';

export default {
  name: 'ModelList',
  components: {
    ModelEdit
  },
  setup() {
    const router = useRouter();
    const models = ref([]);
    const showModelEdit = ref(false);
    const currentEditModel = ref(null);

    // 初始化
    onMounted(() => {
      loadModels();
    });

    // 加载模型列表
    const loadModels = () => {
      models.value = modelStore.getModels();
    };

    // 返回上一页
    const goBack = () => {
      router.push('/settings');
    };

    // 添加新模型
    const addNewModel = () => {
      currentEditModel.value = {
        provider: '',
        api_mode: 'OpenAPI标准接口',
        api_endpoint: '',
        api_path: '',
        api_key: '',
        model_list: [],
        max_context_messages: 20,
        temperature: 0.7,
        top_p: 1,
        is_default: false
      };
      showModelEdit.value = true;
    };

    // 编辑模型
    const editModel = (model) => {
      currentEditModel.value = { ...model };
      showModelEdit.value = true;
    };

    // 设为默认模型
    const setAsDefault = (model) => {
      modelStore.setDefaultModel(model.provider);
      loadModels();
    };

    // 删除模型
    const deleteModel = (model) => {
      if (confirm(`确定要删除 ${model.provider} 的模型配置吗？`)) {
        modelStore.deleteModel(model.provider);
        loadModels();
      }
    };

    // 保存模型
    const onModelSave = (model) => {
      modelStore.saveModel(model);
      showModelEdit.value = false;
      loadModels();
    };

    return {
      models,
      showModelEdit,
      currentEditModel,
      goBack,
      addNewModel,
      editModel,
      setAsDefault,
      deleteModel,
      onModelSave
    };
  }
};
</script>

<style scoped>
/* 样式由用户单独优化 */
</style>
