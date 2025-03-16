import axios from 'axios'

export default {
  /**
   * 发送消息到API（非流式）
   */
  async sendMessage(modelConfig, messages) {
    try {
      const { apiMode, apiUrl, apiPath, apiKey, model, temperature, maxTokens, topP } = modelConfig
      
      let requestData = {}
      let headers = {
        'Content-Type': 'application/json'
      }
      
      // 处理模型名称
      const modelName = model
      
      // 根据不同的API模式构建不同的请求
      if (apiMode === 'OpenAPI标准接口') {
        headers['Authorization'] = `Bearer ${apiKey}`
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1
        }
      } else if (apiMode === 'Anthropic') {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1
        }
      } else if (apiMode === 'Gemini') {
        headers['x-goog-api-key'] = apiKey
        requestData = {
          contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          model: modelName,
          generationConfig: {
            temperature: parseFloat(temperature) || 0.7,
            maxOutputTokens: parseInt(maxTokens) || 2000,
            topP: parseFloat(topP) || 1
          }
        }
      } else {
        // 通用格式，用户可能需要根据实际API调整
        headers['Authorization'] = `Bearer ${apiKey}`
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1
        }
      }
      
      const response = await axios.post(`${apiUrl}${apiPath}`, requestData, { headers })
      
      // 解析不同API的响应
      let responseText = ''
      
      if (apiMode === 'OpenAPI标准接口') {
        responseText = response.data.choices[0].message.content
      } else if (apiMode === 'Anthropic') {
        responseText = response.data.content[0].text
      } else if (apiMode === 'Gemini') {
        responseText = response.data.candidates[0].content.parts[0].text
      } else {
        // 尝试通用解析，可能需要根据实际API调整
        responseText = response.data.choices ? 
          response.data.choices[0].message.content : 
          JSON.stringify(response.data)
      }
      
      return {
        role: 'assistant',
        content: responseText
      }
    } catch (error) {
      console.error('API请求错误:', error)
      return {
        role: 'assistant',
        content: `发生错误: ${error.message || '未知错误'}`
      }
    }
  },
  
  /**
   * 发送消息到API（流式输出）
   * @param {Object} modelConfig - 模型配置
   * @param {Array} messages - 消息历史
   * @param {Function} onChunk - 接收每个文本块的回调函数
   * @param {Function} onComplete - 完成时的回调函数
   * @param {Function} onError - 错误处理回调函数
   */
  async sendMessageStream(modelConfig, messages, onChunk, onComplete, onError) {
    try {
      if (!modelConfig) {
        throw new Error('模型配置不存在')
      }
      
      const { apiMode, apiUrl, apiPath, apiKey, model, temperature, maxTokens, topP } = modelConfig
      
      // 验证必要的API参数
      if (!apiUrl) {
        throw new Error('API URL未配置')
      }
      
      if (!apiPath) {
        throw new Error('API路径未配置')
      }
      
      if (!apiKey) {
        throw new Error('API密钥未配置')
      }
      
      if (!model) {
        throw new Error('模型未配置')
      }
      
      let requestData = {}
      let headers = {
        'Content-Type': 'application/json'
      }
      
      // 处理模型名称
      const modelName = model
      
      // 根据不同的API模式构建不同的请求
      if (apiMode === 'OpenAPI标准接口') {
        headers['Authorization'] = `Bearer ${apiKey}`
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1,
          stream: true // 启用流式输出
        }
      } else if (apiMode === 'Anthropic') {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1,
          stream: true // 启用流式输出
        }
      } else if (apiMode === 'Gemini') {
        headers['x-goog-api-key'] = apiKey
        requestData = {
          contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          model: modelName,
          generationConfig: {
            temperature: parseFloat(temperature) || 0.7,
            maxOutputTokens: parseInt(maxTokens) || 2000,
            topP: parseFloat(topP) || 1
          },
          stream: true // 启用流式输出
        }
      } else {
        // 通用格式，用户可能需要根据实际API调整
        headers['Authorization'] = `Bearer ${apiKey}`
        requestData = {
          model: modelName,
          messages: messages,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 2000,
          top_p: parseFloat(topP) || 1,
          stream: true // 启用流式输出
        }
      }
      
      // 使用fetch API进行流式请求
      const response = await fetch(`${apiUrl}${apiPath}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullText = ''
      
      // 处理不同API的流式响应
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              onComplete({
                role: 'assistant',
                content: fullText
              })
              break
            }
            
            const chunk = decoder.decode(value, { stream: true })
            
            // 根据不同API模式解析流式响应
            if (apiMode === 'OpenAPI标准接口') {
              // OpenAI格式: data: {"id":"...","object":"...","choices":[{"delta":{"content":"Hello"},"index":0}]}
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(line.substring(6))
                    if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                      const content = data.choices[0].delta.content
                      fullText += content
                      onChunk(content)
                    }
                  } catch (e) {
                    console.error('解析OpenAI流式响应错误:', e)
                  }
                }
              }
            } else if (apiMode === 'Anthropic') {
              // Anthropic格式: {"type":"content_block_delta","delta":{"text":"Hello"}}
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (line.trim() && !line.includes('event: ping')) {
                  try {
                    const data = JSON.parse(line)
                    if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
                      const content = data.delta.text
                      fullText += content
                      onChunk(content)
                    }
                  } catch (e) {
                    console.error('解析Anthropic流式响应错误:', e)
                  }
                }
              }
            } else if (apiMode === 'Gemini') {
              // Gemini格式: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}
              try {
                const data = JSON.parse(chunk)
                if (data.candidates && data.candidates[0].content && 
                    data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
                  const content = data.candidates[0].content.parts[0].text
                  fullText += content
                  onChunk(content)
                }
              } catch (e) {
                // 可能是不完整的JSON，忽略错误
              }
            } else {
              // 通用处理，尝试提取文本内容
              try {
                const data = JSON.parse(chunk)
                let content = ''
                
                // 尝试从各种可能的位置提取内容
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  content = data.choices[0].delta.content
                } else if (data.choices && data.choices[0].text) {
                  content = data.choices[0].text
                } else if (data.content) {
                  content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
                } else {
                  content = chunk // 如果无法解析，直接使用原始块
                }
                
                if (content) {
                  fullText += content
                  onChunk(content)
                }
              } catch (e) {
                // 可能是不完整的JSON，直接使用原始块
                fullText += chunk
                onChunk(chunk)
              }
            }
          }
        } catch (error) {
          onError(error)
        }
      }
      
      processStream()
      
      return {
        role: 'assistant',
        content: '正在生成回复...',
        streaming: true
      }
    } catch (error) {
      console.error('流式API请求错误:', error)
      onError(error)
      return {
        role: 'assistant',
        content: `发生错误: ${error.message || '未知错误'}`
      }
    }
  },
  
  /**
   * 将文本转换为Markdown格式
   */
  convertToMarkdown(text) {
    // 简单的Markdown转换，可以根据需要扩展
    return text
  },
  
  /**
   * 将文本转换为纯文本格式（去除Markdown标记）
   */
  convertToPlainText(text) {
    // 去除Markdown标记
    return text
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/`{3}[\s\S]*?`{3}/g, '') // 移除代码块
      .replace(/`(.*?)`/g, '$1') // 移除内联代码
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // 移除链接，保留链接文本
      .replace(/!\[(.*?)\]\((.*?)\)/g, '') // 移除图片
      .replace(/^\s*[-+*]\s+/gm, '') // 移除无序列表标记
      .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
      .replace(/^\s*>\s+/gm, '') // 移除引用标记
      .replace(/\n{2,}/g, '\n\n') // 将多个换行替换为两个换行
  }
}
