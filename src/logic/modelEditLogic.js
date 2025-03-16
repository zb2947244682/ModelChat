import { ref, computed, reactive, watch } from 'vue';

export function useModelEditLogic(props, emit) {
  // 表单数据
  const formData = reactive({
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
  });

  // 新模型名称输入
  const newModelName = ref('');

  // 是否是新模型
  const isNewModel = computed(() => !props.model || !props.model.provider);

  // 表单是否有效
  const isFormValid = computed(() => {
    return (
      formData.provider.trim() !== '' &&
      formData.api_endpoint.trim() !== '' &&
      formData.api_path.trim() !== '' &&
      formData.api_key.trim() !== '' &&
      formData.model_list.length > 0
    );
  });

  // 监听props变化，更新表单数据
  const setupWatchers = () => {
    watch(() => props.model, (newModel) => {
      if (newModel) {
        Object.keys(formData).forEach(key => {
          if (key in newModel) {
            if (key === 'model_list') {
              formData[key] = [...newModel[key]];
            } else {
              formData[key] = newModel[key];
            }
          }
        });
      }
    }, { immediate: true });
  };

  // 添加模型到列表
  const addModelToList = () => {
    if (newModelName.value.trim() !== '' && !formData.model_list.includes(newModelName.value.trim())) {
      formData.model_list.push(newModelName.value.trim());
      newModelName.value = '';
    }
  };

  // 从列表中移除模型
  const removeModelFromList = (index) => {
    formData.model_list.splice(index, 1);
  };

  // 保存
  const save = () => {
    if (isFormValid.value) {
      emit('save', { ...formData });
    }
  };

  // 取消
  const cancel = () => {
    emit('cancel');
  };

  return {
    // 状态
    formData,
    newModelName,
    isNewModel,
    isFormValid,
    
    // 方法
    setupWatchers,
    addModelToList,
    removeModelFromList,
    save,
    cancel
  };
}
