<template>
  <div class="chat-list-container">
    <div class="header">
      <h2 class="mobile-only">对话列表</h2>
      <button v-if="!hideCloseButton" @click="$emit('close')" title="关闭">✕</button>
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
            <button @click.stop="deleteConversation(conversation.id)" title="删除">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="createNewConversation">
        <span>+</span>
        <span>新建对话</span>
      </button>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useChatListLogic } from '../logic/chatListLogic';

export default {
  name: 'ChatList',
  props: {
    hideCloseButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select-conversation', 'close'],
  setup(props, { emit }) {
    const chatListLogic = useChatListLogic(props, emit);
    
    // 初始化
    onMounted(() => {
      chatListLogic.initialize();
    });

    return {
      // 状态
      conversations: chatListLogic.conversations,
      
      // 方法
      isActive: chatListLogic.isActive,
      selectConversation: chatListLogic.selectConversation,
      createNewConversation: chatListLogic.createNewConversation,
      deleteConversation: chatListLogic.deleteConversation,
      formatDate: chatListLogic.formatDate
    };
  }
};
</script>

<style scoped>
@import '../assets/styles/chat-list.css';
</style>
