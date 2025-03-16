<template>
  <div class="chat-list-container">
    <div class="header">
      <h2>对话列表</h2>
      <button @click="$emit('close')">关闭</button>
    </div>

    <div class="conversations">
      <div v-if="conversations.length === 0" class="empty-state">
        <p>暂无对话记录</p>
      </div>
      <div v-else class="conversation-items">
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id" 
          class="conversation-item"
          :class="{ 'active': isActive(conversation.id) }"
          @click="selectConversation(conversation.id)"
        >
          <div class="conversation-info">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-date">{{ formatDate(conversation.updatedAt) }}</div>
          </div>
          <div class="conversation-actions">
            <button @click.stop="deleteConversation(conversation.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="createNewConversation">新建对话</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { chatStore } from '../store/chatStore';

export default {
  name: 'ChatList',
  emits: ['select-conversation', 'close'],
  setup(props, { emit }) {
    const conversations = ref([]);

    // 初始化
    onMounted(() => {
      loadConversations();
    });

    // 加载对话列表
    const loadConversations = () => {
      conversations.value = chatStore.getConversations().sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    };

    // 当前对话
    const currentConversationId = computed(() => {
      const currentConv = chatStore.getCurrentConversation();
      return currentConv ? currentConv.id : null;
    });

    // 是否是当前对话
    const isActive = (id) => {
      return id === currentConversationId.value;
    };

    // 选择对话
    const selectConversation = (id) => {
      chatStore.setCurrentConversation(id);
      emit('select-conversation', id);
    };

    // 创建新对话
    const createNewConversation = () => {
      const newConversation = chatStore.createConversation('新对话');
      loadConversations();
      emit('select-conversation', newConversation.id);
    };

    // 删除对话
    const deleteConversation = (id) => {
      chatStore.deleteConversation(id);
      // 重新加载对话列表
      loadConversations();
      // 强制组件重新渲染
      conversations.value = [...conversations.value];
    };

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      conversations,
      isActive,
      selectConversation,
      createNewConversation,
      deleteConversation,
      formatDate
    };
  }
};
</script>

<style scoped>
/* 样式由用户单独优化 */
</style>
