<template>
  <div class="settings-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="left-icon" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="title">设置</div>
      <div class="right-icons">
        <div class="theme-toggle" @click="toggleTheme">
          <el-icon v-if="isDarkMode"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 厂商部分 -->
      <div class="section">
        <div class="section-header">
          <h2>厂商配置</h2>
          <el-button type="primary" @click="addNewVendor">添加厂商</el-button>
        </div>

        <!-- 厂商列表 -->
        <div v-if="vendors.length > 0" class="vendor-list">
          <el-collapse v-model="activeVendorNames">
            <el-collapse-item v-for="vendor in vendors" :key="vendor.id" :name="vendor.id">
              <template #title>
                <div class="vendor-item-header">
                  <span>{{ vendor.name }}</span>
                  <span class="vendor-type">{{ vendor.apiType }}</span>
                </div>
              </template>
              
              <div class="vendor-form">
                <el-form :model="getVendorForm(vendor.id)" label-position="top">
                  <el-form-item label="厂商名称">
                    <el-input v-model="getVendorForm(vendor.id).name" placeholder="给这个厂商起个名字" />
                  </el-form-item>
                  
                  <el-form-item label="API类型">
                    <el-select v-model="getVendorForm(vendor.id).apiType" placeholder="选择API类型" style="width: 100%">
                      <el-option label="OpenAI API" value="openai" />
                      <el-option label="Anthropic API" value="anthropic" />
                      <el-option label="Google Gemini API" value="gemini" />
                      <el-option label="自定义" value="custom" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="API地址">
                    <el-input v-model="getVendorForm(vendor.id).apiUrl" placeholder="例如: https://api.openai.com/v1" />
                  </el-form-item>
                  
                  <el-form-item label="API路径">
                    <el-input v-model="getVendorForm(vendor.id).apiPath" placeholder="例如: /chat/completions" />
                  </el-form-item>
                  
                  <div class="form-actions">
                    <el-button type="primary" @click="saveVendor(vendor.id)">保存</el-button>
                    <el-button type="danger" @click="deleteVendor(vendor.id)">删除</el-button>
                  </div>
                </el-form>
                
                <!-- 该厂商下的模型 -->
                <div class="vendor-models">
                  <div class="vendor-models-header">
                    <h3>模型列表</h3>
                    <el-button size="small" type="primary" @click="() => addNewModel(vendor.id)">添加模型</el-button>
                  </div>
                  
                  <div v-if="getVendorModels(vendor.id).length > 0" class="model-list">
                    <el-collapse v-model="activeModelNames">
                      <el-collapse-item v-for="model in getVendorModels(vendor.id)" :key="model.id" :name="model.id">
                        <template #title>
                          <div class="model-item-header">
                            <span>{{ model.name }}</span>
                            <span class="model-type">{{ model.model.split('\n')[0] }}{{ model.model.includes('\n') ? '...' : '' }}</span>
                          </div>
                        </template>
                        
                        <div class="model-form">
                          <el-form :model="getModelForm(model.id)" label-position="top">
                            <el-form-item label="名称">
                              <el-input v-model="getModelForm(model.id).name" placeholder="给这个模型起个名字" />
                            </el-form-item>
                            
                            <el-form-item label="API密钥">
                              <el-input 
                                v-model="getModelForm(model.id).apiKey" 
                                placeholder="输入您的API密钥" 
                                show-password 
                              />
                            </el-form-item>
                            
                            <el-form-item label="模型列表">
                              <el-input 
                                v-model="getModelForm(model.id).model" 
                                type="textarea" 
                                :rows="3"
                                placeholder="输入模型列表，一行一个，例如:
gpt-3.5-turbo
gpt-4-turbo" 
                              />
                            </el-form-item>
                            
                            <div class="advanced-settings">
                              <div class="advanced-header" @click="toggleAdvanced(model.id)">
                                高级设置
                                <el-icon>
                                  <ArrowDown v-if="!advancedVisible[model.id]" />
                                  <ArrowUp v-else />
                                </el-icon>
                              </div>
                              
                              <div v-show="advancedVisible[model.id]" class="advanced-content">
                                <el-form-item label="Temperature">
                                  <div class="slider-with-input">
                                    <el-slider 
                                      v-model="getModelForm(model.id).temperature" 
                                      :min="0" 
                                      :max="1" 
                                      :step="0.1" 
                                      style="flex: 1" 
                                    />
                                    <el-input-number 
                                      v-model="getModelForm(model.id).temperature" 
                                      :min="0" 
                                      :max="1" 
                                      :step="0.1" 
                                      controls-position="right" 
                                      style="width: 120px; margin-left: 16px" 
                                    />
                                  </div>
                                </el-form-item>
                                
                                <el-form-item label="最大Token数">
                                  <el-input-number 
                                    v-model="getModelForm(model.id).maxTokens" 
                                    :min="1" 
                                    :max="100000" 
                                    :step="1" 
                                    controls-position="right" 
                                    style="width: 100%" 
                                  />
                                </el-form-item>
                                
                                <el-form-item label="Top P">
                                  <div class="slider-with-input">
                                    <el-slider 
                                      v-model="getModelForm(model.id).topP" 
                                      :min="0" 
                                      :max="1" 
                                      :step="0.1" 
                                      style="flex: 1" 
                                    />
                                    <el-input-number 
                                      v-model="getModelForm(model.id).topP" 
                                      :min="0" 
                                      :max="1" 
                                      :step="0.1" 
                                      controls-position="right" 
                                      style="width: 120px; margin-left: 16px" 
                                    />
                                  </div>
                                </el-form-item>
                              </div>
                            </div>
                            
                            <div class="form-actions">
                              <el-button type="primary" @click="saveModel(model.id)">保存</el-button>
                              <el-button type="danger" @click="deleteModel(model.id)">删除</el-button>
                            </div>
                          </el-form>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                  
                  <div v-else class="empty-state">
                    <el-empty description="暂无模型" />
                    <el-button size="small" type="primary" @click="() => addNewModel(vendor.id)">添加模型</el-button>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <div v-else class="empty-state">
          <el-empty description="暂无厂商配置" />
          <el-button type="primary" @click="addNewVendor">添加厂商</el-button>
        </div>
      </div>
      
      <!-- 主题设置 -->
      <div class="section">
        <div class="section-header">
          <h2>外观设置</h2>
        </div>
        
        <div class="theme-settings">
          <div class="theme-option">
            <span>深色模式</span>
            <el-switch v-model="darkMode" @change="toggleTheme" />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加厂商对话框 -->
    <el-dialog v-model="vendorDialogVisible" title="添加新厂商" width="500px">
      <el-form :model="newVendorForm" label-position="top">
        <el-form-item label="厂商名称" required>
          <el-input v-model="newVendorForm.name" placeholder="给这个厂商起个名字" />
        </el-form-item>
        
        <el-form-item label="API类型" required>
          <el-select v-model="newVendorForm.apiType" placeholder="选择API类型" style="width: 100%">
            <el-option label="OpenAI API" value="openai" />
            <el-option label="Anthropic API" value="anthropic" />
            <el-option label="Google Gemini API" value="gemini" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="API地址" required>
          <el-input 
            v-model="newVendorForm.apiUrl" 
            :placeholder="getApiUrlPlaceholder(newVendorForm.apiType)" 
          />
        </el-form-item>
        
        <el-form-item label="API路径" required>
          <el-input 
            v-model="newVendorForm.apiPath" 
            :placeholder="getApiPathPlaceholder(newVendorForm.apiType)" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="vendorDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createVendor">创建</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 添加模型对话框 -->
    <el-dialog v-model="modelDialogVisible" title="添加新模型" width="500px">
      <el-form :model="newModelForm" label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="newModelForm.name" placeholder="给这个模型起个名字" />
        </el-form-item>
        
        <el-form-item label="API密钥" required>
          <el-input 
            v-model="newModelForm.apiKey" 
            placeholder="输入您的API密钥" 
            show-password 
          />
        </el-form-item>
        
        <el-form-item label="模型列表" required>
          <el-input 
            v-model="newModelForm.model" 
            type="textarea"
            :rows="3"
            :placeholder="'输入模型列表，一行一个，例如:\n' + getModelPlaceholder(selectedVendorApiType)" 
          />
        </el-form-item>
        
        <el-form-item label="Temperature">
          <el-slider 
            v-model="newModelForm.temperature" 
            :min="0" 
            :max="1" 
            :step="0.1" 
          />
        </el-form-item>
        
        <el-form-item label="最大Token数">
          <el-input-number 
            v-model="newModelForm.maxTokens" 
            :min="1" 
            :max="100000" 
            :step="1" 
            controls-position="right" 
            style="width: 100%" 
          />
        </el-form-item>
        
        <el-form-item label="Top P">
          <el-slider 
            v-model="newModelForm.topP" 
            :min="0" 
            :max="1" 
            :step="0.1" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="modelDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createModel">创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useModelStore } from '../stores/modelStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowDown, ArrowUp, Moon, Sunny, Shop } from '@element-plus/icons-vue'

const router = useRouter()
const modelStore = useModelStore()

// 响应式状态
const activeVendorNames = ref([])
const activeModelNames = ref([])
const vendorDialogVisible = ref(false)
const modelDialogVisible = ref(false)
const advancedVisible = reactive({})
const vendorForms = reactive({})
const modelForms = reactive({})
const selectedVendorId = ref(null)
const darkMode = ref(false)

// 新厂商表单
const newVendorForm = reactive({
  name: '',
  apiType: 'openai',
  apiUrl: '',
  apiPath: ''
})

// 新模型表单
const newModelForm = reactive({
  name: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1
})

// 计算属性
const vendors = computed(() => modelStore.vendors)
const models = computed(() => modelStore.models)
const isDarkMode = computed(() => modelStore.isDarkMode)

// 获取选中厂商的API类型
const selectedVendorApiType = computed(() => {
  if (!selectedVendorId.value) return 'custom'
  const vendor = vendors.value.find(v => v.id === selectedVendorId.value)
  return vendor ? vendor.apiType : 'custom'
})

// 方法
const goBack = () => {
  router.push('/')
}

// 切换深色/浅色模式
const toggleTheme = () => {
  modelStore.theme = modelStore.theme === 'light' ? 'dark' : 'light'
  darkMode.value = modelStore.theme === 'dark'
  document.documentElement.setAttribute('data-theme', modelStore.theme)
}

// 获取指定厂商的所有模型
const getVendorModels = (vendorId) => {
  return models.value.filter(model => model.vendorId === vendorId)
}

const toggleAdvanced = (modelId) => {
  advancedVisible[modelId] = !advancedVisible[modelId]
}

const getApiUrlPlaceholder = (apiType) => {
  switch (apiType) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com/v1'
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1'
    default:
      return '输入API基础URL（包含版本）'
  }
}

const getApiPathPlaceholder = (apiType) => {
  switch (apiType) {
    case 'openai':
      return '/chat/completions'
    case 'anthropic':
      return '/messages'
    case 'gemini':
      return '/models/gemini-pro:generateContent'
    default:
      return '输入API路径（不含版本）'
  }
}

const getModelPlaceholder = (apiType) => {
  switch (apiType) {
    case 'openai':
      return 'gpt-3.5-turbo'
    case 'anthropic':
      return 'claude-3-opus-20240229'
    case 'gemini':
      return 'gemini-pro'
    default:
      return '输入模型名称'
  }
}

// 添加新厂商
const addNewVendor = () => {
  // 重置表单
  Object.assign(newVendorForm, {
    name: '',
    apiType: 'openai',
    apiUrl: getApiUrlPlaceholder('openai'),
    apiPath: getApiPathPlaceholder('openai')
  })
  
  vendorDialogVisible.value = true
}

// 创建厂商
const createVendor = () => {
  // 验证必填字段
  if (!newVendorForm.name || !newVendorForm.apiUrl || !newVendorForm.apiPath) {
    ElMessage.error('请填写所有必填字段')
    return
  }
  
  // 添加新厂商
  const vendorId = modelStore.addVendor({
    name: newVendorForm.name,
    apiType: newVendorForm.apiType,
    apiUrl: newVendorForm.apiUrl,
    apiPath: newVendorForm.apiPath
  })
  
  // 初始化表单
  initVendorForm(vendorId)
  
  vendorDialogVisible.value = false
  ElMessage.success('厂商添加成功')
  
  // 展开新添加的厂商
  activeVendorNames.value.push(vendorId)
}

// 保存厂商
const saveVendor = (vendorId) => {
  modelStore.updateVendor(vendorId, vendorForms[vendorId])
  ElMessage.success('保存成功')
}

// 删除厂商
const deleteVendor = (vendorId) => {
  ElMessageBox.confirm('确定要删除这个厂商配置吗？这将同时删除该厂商下的所有模型！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    modelStore.deleteVendor(vendorId)
    delete vendorForms[vendorId]
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 添加新模型
const addNewModel = (vendorId) => {
  selectedVendorId.value = vendorId
  
  // 重置表单
  Object.assign(newModelForm, {
    name: '',
    apiKey: '',
    model: getModelPlaceholder(selectedVendorApiType.value),
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1
  })
  
  modelDialogVisible.value = true
}

// 创建模型
const createModel = () => {
  // 验证必填字段
  if (!newModelForm.name || !newModelForm.apiKey || !newModelForm.model) {
    ElMessage.error('请填写所有必填字段')
    return
  }
  
  // 添加新模型
  const modelId = modelStore.addModel({
    name: newModelForm.name,
    vendorId: selectedVendorId.value,
    apiKey: newModelForm.apiKey,
    model: newModelForm.model,
    temperature: newModelForm.temperature,
    maxTokens: newModelForm.maxTokens,
    topP: newModelForm.topP
  })
  
  // 初始化表单和高级设置状态
  initModelForm(modelId)
  
  modelDialogVisible.value = false
  ElMessage.success('模型添加成功')
  
  // 展开新添加的模型
  activeModelNames.value.push(modelId)
}

// 保存模型
const saveModel = (modelId) => {
  modelStore.updateModel(modelId, modelForms[modelId])
  ElMessage.success('保存成功')
}

// 删除模型
const deleteModel = (modelId) => {
  ElMessageBox.confirm('确定要删除这个模型配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    modelStore.deleteModel(modelId)
    delete modelForms[modelId]
    delete advancedVisible[modelId]
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 获取厂商表单，确保表单对象存在
const getVendorForm = (vendorId) => {
  if (!vendorForms[vendorId]) {
    const vendor = vendors.value.find(v => v.id === vendorId)
    if (vendor) {
      vendorForms[vendorId] = { ...vendor }
    } else {
      vendorForms[vendorId] = {
        name: '',
        apiType: 'openai',
        apiUrl: '',
        apiPath: ''
      }
    }
  }
  return vendorForms[vendorId]
}

// 初始化厂商表单
const initVendorForm = (vendorId) => {
  getVendorForm(vendorId)
}

// 获取模型表单，确保表单对象存在
const getModelForm = (modelId) => {
  if (!modelForms[modelId]) {
    const model = models.value.find(m => m.id === modelId)
    if (model) {
      modelForms[modelId] = { ...model }
    } else {
      modelForms[modelId] = {
        name: '',
        apiKey: '',
        model: '',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1
      }
    }
    advancedVisible[modelId] = false
  }
  return modelForms[modelId]
}

// 初始化模型表单
const initModelForm = (modelId) => {
  getModelForm(modelId)
}

// 初始化所有厂商和模型表单
const initAllForms = () => {
  vendors.value.forEach(vendor => {
    initVendorForm(vendor.id)
  })
  
  models.value.forEach(model => {
    initModelForm(model.id)
  })
}

// 监听API类型变化，自动填充默认值
watch(() => newVendorForm.apiType, (newType) => {
  newVendorForm.apiUrl = getApiUrlPlaceholder(newType)
  newVendorForm.apiPath = getApiPathPlaceholder(newType)
})

// 组件挂载时初始化
onMounted(() => {
  initAllForms()
  
  // 设置深色模式状态
  darkMode.value = modelStore.theme === 'dark'
  
  // 如果有厂商，默认展开第一个
  if (vendors.value.length > 0) {
    activeVendorNames.value = [vendors.value[0].id]
    
    // 如果第一个厂商有模型，默认展开第一个模型
    const firstVendorModels = getVendorModels(vendors.value[0].id)
    if (firstVendorModels.length > 0) {
      activeModelNames.value = [firstVendorModels[0].id]
    }
  }
})
</script>

<style scoped>
/* 基础样式 */
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-secondary);
  box-shadow: 0 1px 2px var(--shadow-color);
  z-index: 10;
  transition: all 0.3s ease;
}

.left-icon, .right-icon, .theme-toggle {
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.right-icons {
  display: flex;
  align-items: center;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

/* 设置内容 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: background-color 0.3s ease;
}

.section {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

/* 厂商样式 */
.vendor-list {
  margin-top: 20px;
}

.vendor-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.vendor-type {
  font-size: 14px;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.vendor-form {
  padding: 16px 0;
}

.vendor-models {
  margin-top: 24px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  transition: border-color 0.3s ease;
}

.vendor-models-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.vendor-models-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

/* 模型样式 */
.model-list {
  margin-top: 16px;
}

.model-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.model-type {
  font-size: 14px;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.model-form {
  padding: 16px 0;
}

/* 高级设置 */
.advanced-settings {
  margin: 16px 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.advanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.advanced-content {
  padding: 16px;
  background-color: var(--bg-tertiary);
  transition: background-color 0.3s ease;
}

.slider-with-input {
  display: flex;
  align-items: center;
}

/* 主题设置 */
.theme-settings {
  padding: 16px 0;
}

.theme-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

/* 表单操作 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.empty-state .el-button {
  margin-top: 20px;
}

/* Element Plus 深色模式覆盖 */
.dark-mode :deep(.el-collapse-item__header) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-color: var(--border-color);
}

.dark-mode :deep(.el-collapse-item__content) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.dark-mode :deep(.el-form-item__label) {
  color: var(--text-secondary);
}

.dark-mode :deep(.el-input__inner),
.dark-mode :deep(.el-textarea__inner) {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-select-dropdown) {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-select-dropdown__item) {
  color: var(--text-primary);
}

.dark-mode :deep(.el-select-dropdown__item.hover),
.dark-mode :deep(.el-select-dropdown__item:hover) {
  background-color: var(--bg-tertiary);
}

.dark-mode :deep(.el-dialog) {
  background-color: var(--bg-secondary);
}

.dark-mode :deep(.el-dialog__title) {
  color: var(--text-primary);
}

.dark-mode :deep(.el-dialog__body) {
  color: var(--text-primary);
}

.dark-mode :deep(.el-empty__description) {
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    padding: 12px;
  }
  
  .section {
    padding: 16px;
  }
  
  .slider-with-input {
    flex-direction: column;
  }
  
  .slider-with-input .el-input-number {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>
