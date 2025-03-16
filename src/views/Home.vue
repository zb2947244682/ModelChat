<template>
  <div class="home-container">
    <div class="header">
      <h1>AI聊天助手</h1>
      <div class="actions">
        <button @click="showChatList = !showChatList">对话列表</button>
        <button @click="createNewConversation">新建对话</button>
        <button @click="goToSettings">设置</button>
      </div>
    </div>

    <div class="model-selector">
      <div class="provider-selector">
        <label for="provider">选择提供商:</label>
        <select id="provider" v-model="selectedProvider" @change="onProviderChange">
          <option v-for="model in models" :key="model.provider" :value="model.provider">
            {{ model.provider }}
          </option>
        </select>
      </div>
      <div class="model-name-selector">
        <label for="model">选择模型:</label>
        <select id="model" v-model="selectedModelName">
          <option v-for="modelName in currentModelNames" :key="modelName" :value="modelName">
            {{ modelName }}
          </option>
        </select>
      </div>
    </div>

    <div class="system-prompt">
      <div class="system-prompt-header">
        <label for="systemPrompt">系统提示词:</label>
      </div>
      <textarea 
        id="systemPrompt" 
        v-model="systemPrompt" 
        @input="updateSystemPrompt"
        placeholder="输入系统提示词..."
      ></textarea>
    </div>

    <div class="chat-container">
      <div class="messages" ref="messagesContainer">
        <div v-if="!currentConversation || currentConversation.messages.length === 0" class="empty-state">
          <p>开始一个新的对话吧！</p>
        </div>
        <div v-else v-for="message in currentConversation.messages" :key="message.id" 
          :class="['message', message.role]">
          <div class="message-content">{{ message.content }}</div>
        </div>
        <div v-if="isLoading" class="message assistant">
          <div class="message-content loading">正在思考...</div>
        </div>
      </div>

      <div class="input-container">
        <textarea 
          v-model="userInput" 
          @keydown.enter.prevent="sendMessage"
          placeholder="输入消息..."
        ></textarea>
        <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">发送</button>
      </div>
    </div>

    <div class="chat-list-panel" v-if="showChatList">
      <ChatList 
        @select-conversation="selectConversation" 
        @close="showChatList = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ChatList from '../components/ChatList.vue';
import { modelStore } from '../store/modelStore';
import { chatStore } from '../store/chatStore';
import { getApiService } from '../services/apiService';

export default {
  name: 'Home',
  components: {
    ChatList
  },
  setup() {
    const router = useRouter();
    const userInput = ref('');
    const isLoading = ref(false);
    const showChatList = ref(false);
    const messagesContainer = ref(null);
    const systemPrompt = ref('');

    // 模型相关
    const models = ref([]);
    const selectedProvider = ref('');
    const selectedModelName = ref('');
    const currentModelNames = computed(() => {
      if (!selectedProvider.value) return [];
      const model = models.value.find(m => m.provider === selectedProvider.value);
      return model ? model.model_list : [];
    });

    // 对话相关
    const currentConversation = computed(() => chatStore.getCurrentConversation());

    // 初始化
    onMounted(() => {
      console.log("组件挂载，开始初始化");
      
      // 加载模型
      models.value = modelStore.getModels();
      console.log("加载的模型:", models.value);
      
      // 设置默认模型
      const defaultModel = modelStore.getDefaultModel();
      if (defaultModel) {
        selectedProvider.value = defaultModel.provider;
        if (defaultModel.model_list && defaultModel.model_list.length > 0) {
          selectedModelName.value = defaultModel.model_list[0];
        }
      } else if (models.value.length > 0) {
        selectedProvider.value = models.value[0].provider;
        if (models.value[0].model_list && models.value[0].model_list.length > 0) {
          selectedModelName.value = models.value[0].model_list[0];
        }
      }
      
      // 获取所有对话
      const conversations = chatStore.getConversations();
      console.log("获取到的对话列表:", conversations, "长度:", conversations.length);
      
      // 如果有对话，使用第一个；如果没有，创建新对话
      if (conversations.length > 0) {
        console.log("使用现有对话:", conversations[0].id);
        chatStore.setCurrentConversation(conversations[0].id);
        
        // 确保当前对话设置成功
        const currentConv = chatStore.getCurrentConversation();
        console.log("当前对话:", currentConv);
        
        if (currentConv) {
          systemPrompt.value = currentConv.systemPrompt || '';
          console.log("从当前对话加载系统提示词:", systemPrompt.value);
        } else {
          console.warn("无法获取当前对话，尽管对话列表不为空");
          // 强制再次设置当前对话
          chatStore.setCurrentConversation(conversations[0].id);
        }
      } else {
        console.log("创建新对话");
        const newConv = createNewConversation();
        console.log("新创建的对话:", newConv);
      }
    });

    // 监听对话变化，滚动到底部
    watch(() => currentConversation.value?.messages.length, () => {
      scrollToBottom();
    });

    // 监听当前对话变化，更新系统提示词
    watch(() => currentConversation.value, (newConv) => {
      if (newConv) {
        systemPrompt.value = newConv.systemPrompt || '';
      }
    });

    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    // 提供商变化时更新模型
    const onProviderChange = () => {
      const model = models.value.find(m => m.provider === selectedProvider.value);
      if (model && model.model_list && model.model_list.length > 0) {
        selectedModelName.value = model.model_list[0];
      } else {
        selectedModelName.value = '';
      }
    };

    // 创建新对话
    const createNewConversation = () => {
      const newConv = chatStore.createConversation('新对话');
      console.log('在Home组件中创建了新对话:', newConv.id);
      systemPrompt.value = '';
      return newConv;
    };

    // 选择对话
    const selectConversation = (conversationId) => {
      chatStore.setCurrentConversation(conversationId);
      showChatList.value = false;
    };

    // 更新系统提示词
    const updateSystemPrompt = () => {
      console.log("更新系统提示词被调用");
      console.log("当前系统提示词内容:", systemPrompt.value);
      console.log("系统提示词类型:", typeof systemPrompt.value);
      console.log("系统提示词长度:", systemPrompt.value.length);
      
      if (currentConversation.value) {
        console.log("当前对话ID:", currentConversation.value.id);
        console.log("更新前对话的系统提示词:", currentConversation.value.systemPrompt);
        
        chatStore.updateConversation(currentConversation.value.id, {
          systemPrompt: systemPrompt.value
        });
        
        // 验证更新是否生效
        const updatedConv = chatStore.getConversations().find(c => c.id === currentConversation.value.id);
        console.log("更新后对话的系统提示词:", updatedConv.systemPrompt);
      } else {
        console.warn("没有当前对话，无法更新系统提示词");
      }
    };


    // 发送消息
    const sendMessage = () => {
      console.log("发送消息函数被调用");
      
      if (!userInput.value.trim()) {
        console.log("用户输入为空，不发送消息");
        return;
      }
      
      if (isLoading.value) {
        console.log("正在加载中，不发送消息");
        return;
      }
      
      // 获取或创建对话ID
      let conversationId;
      
      // 检查是否有当前对话
      if (currentConversation.value) {
        conversationId = currentConversation.value.id;
        console.log("使用现有对话ID:", conversationId);
      } else {
        // 获取所有对话
        const conversations = chatStore.getConversations();
        
        if (conversations.length > 0) {
          // 使用第一个对话
          conversationId = conversations[0].id;
          chatStore.setCurrentConversation(conversationId);
          console.log("使用对话列表中的第一个对话:", conversationId);
        } else {
          // 创建新对话
          const newConversation = chatStore.createConversation('新对话');
          conversationId = newConversation.id;
          console.log("创建了新对话:", conversationId);
        }
      }
      
      // 确保我们有对话ID
      if (!conversationId) {
        console.error("无法获取或创建对话ID");
        return;
      }
      
      console.log("发送消息到对话:", conversationId);
      console.log("用户消息:", userInput.value);
      
      // 添加用户消息
      chatStore.addMessage(conversationId, {
        role: 'user',
        content: userInput.value
      });
      
      const message = userInput.value;
      userInput.value = '';
      
      // 开始加载
      isLoading.value = true;
      
      // 创建一个空的助手消息用于更新
      const assistantMessageId = Date.now().toString();
      console.log("创建助手消息ID:", assistantMessageId);
      
      chatStore.addMessage(conversationId, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      });
      
      // 尝试调用API
      console.log("准备调用API");
      
      // 获取当前对话和系统提示词
      const conv = chatStore.getConversations().find(c => c.id === conversationId);
      const systemPromptText = conv?.systemPrompt || '';
      
      console.log("当前对话系统提示词:", systemPromptText);
      console.log("系统提示词类型:", typeof systemPromptText);
      console.log("系统提示词长度:", systemPromptText.length);
      console.log("系统提示词是否为null:", systemPromptText === null);
      console.log("系统提示词是否为undefined:", systemPromptText === undefined);
      console.log("系统提示词的HTML实体表示:", systemPromptText.split('').map(c => `&#${c.charCodeAt(0)};`).join(''));
      
      // 获取当前选中的模型
      const currentModel = models.value.find(m => m.provider === selectedProvider.value);
      
      // 如果有配置模型和API密钥，则调用API
      if (currentModel && currentModel.api_key) {
        console.log("使用API模式:", currentModel.api_mode);
        
        // 获取API服务
        const apiService = getApiService(currentModel.api_mode);
        
        // 准备消息历史 - 只包含历史消息，不包括刚刚添加的
        const messageHistory = conv?.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .slice(0, -2) // 排除最后添加的用户消息和空的助手消息
          .slice(-currentModel.max_context_messages)
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })) || [];
        
        // 添加当前用户消息
        messageHistory.push({
          role: 'user',
          content: message
        });
        
        console.log("消息历史:", messageHistory);
        console.log("系统提示词:", systemPromptText);

        // 调用API
        apiService.sendChatRequest(
          currentModel,
          messageHistory,
          systemPromptText,
          {
            modelName: selectedModelName.value,
            stream: true,
            onChunk: (chunk, fullContent) => {
              console.log("收到流式响应:", chunk);
              
              // 获取最新的对话，避免使用闭包中可能过期的引用
              const currentConv = chatStore.getConversations().find(c => c.id === conversationId);
              if (!currentConv) {
                console.error("找不到当前对话:", conversationId);
                return;
              }
              
              // 找到助手消息
              const assistantMessage = currentConv.messages.find(msg => msg.id === assistantMessageId);
              if (!assistantMessage) {
                console.error("找不到助手消息:", assistantMessageId);
                return;
              }
              
              // 更新消息内容
              const updatedMessages = currentConv.messages.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: fullContent } 
                  : msg
              );
              
              // 更新对话
              chatStore.updateConversation(conversationId, { 
                messages: updatedMessages 
              });
              
              // 强制滚动更新
              nextTick(() => {
                scrollToBottom();
              });
            }
          }
        ).then(response => {
          console.log("API响应完成:", response);
          isLoading.value = false;
        }).catch(error => {
          console.error("API调用失败:", error);
          
          // 更新消息内容为错误信息
          const updatedMessages = chatStore.getConversations()
            .find(c => c.id === conversationId)?.messages
            .map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: `API调用失败: ${error.message || '未知错误'}` } 
                : msg
            );
          
          if (updatedMessages) {
            chatStore.updateConversation(conversationId, { messages: updatedMessages });
          }
          
          isLoading.value = false;
        });
      } else {
        // 没有配置API或测试时使用模拟响应
        console.log("使用模拟响应");
        setTimeout(() => {
          console.log("更新助手消息内容");
          
          // 获取当前系统提示词
          let promptText = systemPromptText || '无';
          
          // 更新消息内容
          const updatedMessages = chatStore.getConversations()
            .find(c => c.id === conversationId)?.messages
            .map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: `这是对"${message}"的模拟回复。请先在设置中配置API密钥。系统提示词: ${promptText}` } 
                : msg
            );
          
          if (updatedMessages) {
            chatStore.updateConversation(conversationId, { messages: updatedMessages });
          }
          
          console.log("设置加载状态为false");
          isLoading.value = false;
        }, 1000);
      }
    };

    // 跳转到设置页面
    const goToSettings = () => {
      router.push('/settings');
    };

    return {
      userInput,
      isLoading,
      showChatList,
      messagesContainer,
      systemPrompt,
      models,
      selectedProvider,
      selectedModelName,
      currentModelNames,
      currentConversation,
      onProviderChange,
      createNewConversation,
      selectConversation,
      updateSystemPrompt,
      sendMessage,
      goToSettings
    };
  }
};
</script>

<style scoped>
/* 样式由用户单独优化 */
</style>
