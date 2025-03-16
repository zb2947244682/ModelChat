import { ref, computed, onMounted } from 'vue';
import { chatStore } from '../store/chatStore';

export function useChatListLogic(props, emit) {
  const conversations = ref([]);

  // 初始化
  const initialize = () => {
    loadConversations();
  };

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
    // 状态
    conversations,
    
    // 方法
    initialize,
    loadConversations,
    isActive,
    selectConversation,
    createNewConversation,
    deleteConversation,
    formatDate
  };
}
