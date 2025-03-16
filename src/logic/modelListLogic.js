import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { modelStore } from '../store/modelStore';

export function useModelListLogic() {
  const router = useRouter();
  const models = ref([]);
  const showModelEdit = ref(false);
  const currentEditModel = ref(null);

  // 初始化
  const initialize = () => {
    loadModels();
  };

  // 加载模型列表
  const loadModels = () => {
    models.value = [...modelStore.getModels()]; // Create a new array to ensure reactivity
  };

  // 返回上一页
  const goBack = () => {
    router.push('/settings');
  };

  // 添加新模型
  const addNewModel = () => {
    currentEditModel.value = {
      provider: '新的模型',
      api_mode: 'OpenAPI标准接口',
      api_endpoint: 'https://api.openai.com/v1',
      api_path: '/chat/completions',
      api_key: '',
      model_list: ['gpt-4o-mini'],
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
    modelStore.deleteModel(model.provider);
    loadModels();
  };

  // 保存模型
  const onModelSave = (model) => {
    modelStore.saveModel(model);
    showModelEdit.value = false;
    loadModels();
  };

  return {
    // 状态
    models,
    showModelEdit,
    currentEditModel,
    
    // 方法
    initialize,
    loadModels,
    goBack,
    addNewModel,
    editModel,
    setAsDefault,
    deleteModel,
    onModelSave
  };
}
