# ModelChat

ModelChat 是一个基于 Vue 3 和 Capacitor 构建的 AI 聊天应用，支持连接多种 AI 模型，并可打包为 Android 应用。

## 功能特点

- 🤖 支持多种 AI 模型提供商和模型
- 💬 多会话管理，可创建、切换、编辑和删除对话
- 📝 支持 Markdown 渲染，增强消息显示效果
- 🔄 消息编辑、重新生成和复制功能
- 🎯 自定义系统提示词，精确控制 AI 行为
- 📱 响应式设计，同时支持桌面和移动设备
- 📦 使用 Capacitor 打包为原生 Android 应用

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **Markdown 渲染**: Marked
- **移动应用框架**: Capacitor

## 项目设置

### 安装依赖

```sh
npm install
```

### 开发环境运行

```sh
npm run dev
```

### 构建生产版本

```sh
npm run build
```

### 预览构建结果

```sh
npm run preview
```

## Android 应用构建

本项目使用 Capacitor 将 Web 应用打包为原生 Android 应用。

### 前提条件

- 安装 [Android Studio](https://developer.android.com/studio)
- 安装 Android SDK
- 配置 JAVA_HOME 和 ANDROID_HOME 环境变量

### 构建步骤

1. 首先构建 Web 应用：

```sh
npm run build
```

2. 更新 Capacitor 配置（如需要）：

```sh
npx cap copy android
```

3. 打开 Android Studio 项目：

```sh
npx cap open android
```

4. 在 Android Studio 中构建应用：
   - 选择 `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - 或选择 `Build > Generate Signed Bundle / APK` 创建签名版本

## 应用结构

- `src/views/`: 主要视图组件
  - `Home.vue`: 主聊天界面
  - `ModelList.vue`: 模型管理界面
  - `Settings.vue`: 设置界面
- `src/components/`: 可复用组件
  - `ChatList.vue`: 对话列表组件
  - `ModelEdit.vue`: 模型编辑组件
- `src/store/`: 数据存储
  - `chatStore.js`: 对话数据管理
  - `modelStore.js`: 模型配置管理
- `src/services/`: 服务
  - `apiService.js`: API 通信服务
- `src/logic/`: 业务逻辑
  - 各组件对应的逻辑处理文件

## 使用说明

1. **添加模型配置**：
   - 进入"模型列表"页面
   - 点击"添加模型"按钮
   - 填写模型提供商、API 密钥等信息

2. **创建新对话**：
   - 在主页点击侧边栏的"+"按钮
   - 输入对话标题
   - 可选择设置系统提示词

3. **发送消息**：
   - 在输入框中输入问题或指令
   - 按 Enter 键发送（Shift+Enter 换行）
   - 支持 Markdown 格式

4. **管理消息**：
   - 编辑：点击消息旁的编辑按钮
   - 复制：点击消息旁的复制按钮
   - 重新生成：点击消息旁的重新生成按钮
   - 删除：点击消息旁的删除按钮

## 许可证

[MIT License](LICENSE)

## 贡献指南

欢迎提交 Issues 和 Pull Requests 来改进这个项目。
