import { useRouter } from 'vue-router';

export function useSettingsLogic() {
  const router = useRouter();

  // 返回主页
  const goBack = () => {
    router.push('/');
  };

  // 跳转到模型列表页面
  const goToModelList = () => {
    router.push('/model-list');
  };

  return {
    goBack,
    goToModelList
  };
}
