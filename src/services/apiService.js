import axios from 'axios';

// OpenAPI标准接口服务
export const openApiService = {
  // 发送聊天请求
  async sendChatRequest(model, messages, systemPrompt, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.api_key}`
      };

      console.log('准备API请求，系统提示词:', systemPrompt);
      console.log('系统提示词类型:', typeof systemPrompt, '长度:', systemPrompt ? systemPrompt.length : 0);
      console.log('系统提示词是否为空字符串:', systemPrompt === '');
      console.log('系统提示词trim后是否为空:', systemPrompt && systemPrompt.trim() === '');
      console.log('收到的消息历史:', messages);

      // 构建消息数组，添加系统提示词
      const requestMessages = [];
      // 确保系统提示词是字符串类型并且有内容才添加
      if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim() !== '') {
        // 去除可能存在的不可见字符
        const cleanSystemPrompt = systemPrompt.trim();
        requestMessages.push({
          role: 'system',
          content: cleanSystemPrompt
        });
        console.log('添加了系统提示词到请求:', cleanSystemPrompt);
        console.log('添加的系统提示词长度:', cleanSystemPrompt.length);
      } else {
        console.log('系统提示词为空或无效，不添加到请求');
      }

      // 添加对话历史消息
      requestMessages.push(...messages);
      
      console.log('最终请求消息数组:', requestMessages);

      // 构建请求体
      const requestBody = {
        model: options.modelName || model.model_list[0],
        messages: requestMessages,
        temperature: options.temperature || model.temperature,
        top_p: options.top_p || model.top_p,
        stream: options.stream || true
      };

      // 如果是流式输出
      if (options.stream) {
        return this.streamChatRequest(model, requestBody, headers, options.onChunk);
      } else {
        // 非流式输出
        const response = await axios.post(
          `${model.api_endpoint}${model.api_path}`,
          requestBody,
          { headers }
        );
        
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error) {
      console.error('OpenAPI请求失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // 流式请求
  async streamChatRequest(model, requestBody, headers, onChunk) {
    try {
      const response = await fetch(`${model.api_endpoint}${model.api_path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullContent = '';

      // 处理流式响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 处理数据行
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;

          try {
            // 处理不同前缀的行
            let jsonStr = '';
            
            // 处理标准 "data: " 前缀
            if (line.startsWith('data: ')) {
              jsonStr = line.replace(/^data: /, '').trim();
            } 
            // 处理冒号开头的特殊消息 (如 ": OPENROUTER PROCESSING")
            else if (line.startsWith(': ')) {
              console.log("收到OpenRouter特殊消息:", line);
              continue; // 跳过这种消息的处理
            } 
            // 其他情况，尝试作为普通消息处理
            else {
              jsonStr = line.trim();
            }
            
            if (!jsonStr) continue;
            
            console.log("收到的JSON字符串:", jsonStr);
            
            // 处理特殊情况
            if (jsonStr === '[DONE]') {
              console.log("流式响应结束");
              continue;
            }
            
            try {
              const json = JSON.parse(jsonStr);
              const content = json.choices?.[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                if (onChunk) {
                  onChunk(content, fullContent);
                }
              }
            } catch (parseError) {
              console.error('JSON解析失败:', parseError, '内容:', jsonStr);
              
              // 不将解析失败的内容添加到响应中
              // 避免将错误的JSON字符串显示给用户
              console.log('跳过无效JSON内容');
            }
          } catch (e) {
            console.error('处理流式响应行失败:', e, line);
          }
        }
      }

      return {
        success: true,
        data: {
          content: fullContent
        }
      };
    } catch (error) {
      console.error('流式请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 根据API模式获取对应的服务
export const getApiService = (apiMode) => {
  switch (apiMode) {
    case 'OpenAPI标准接口':
      return openApiService;
    // 可以在这里添加其他API模式的服务
    // case 'Anthropic标准接口':
    //   return anthropicApiService;
    // case 'Gemini标准接口':
    //   return geminiApiService;
    default:
      return openApiService;
  }
};
