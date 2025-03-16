<template>
  <div class="settings-container">
    <div class="header">
      <h1>设置</h1>
      <button @click="goBack">返回</button>
    </div>

    <div class="settings-list">
      <div class="settings-item" @click="goToModelList">
        <div class="item-title">模型列表</div>
        <div class="item-description">管理AI模型配置</div>
        <div class="item-arrow">→</div>
      </div>
      <!-- 可以在这里添加更多设置项 -->
    </div>
  </div>
</template>

<script>
import { useSettingsLogic } from '../logic/settingsLogic';

export default {
  name: 'Settings',
  setup() {
    const settingsLogic = useSettingsLogic();

    return {
      goBack: settingsLogic.goBack,
      goToModelList: settingsLogic.goToModelList
    };
  }
};
</script>

<style scoped>
/* 样式由用户单独优化 */
</style>
