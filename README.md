# Chat-Ollama

一个基于Vue 3和Flask的AI聊天应用，使用Ollama API进行本地AI交互。

## 项目介绍

Chat-Ollama是一个可以在本地运行的AI聊天应用，允许用户与本地部署的Ollama模型进行对话。应用支持多会话管理、自动保存聊天记录、模型切换等功能。

## 技术栈

- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: Python Flask
- **AI服务**: Ollama API (本地运行)
- **数据存储**: 本地文件系统 (.olm格式会话文件)

## 前提条件

在运行此应用之前，您需要安装以下软件：

1. **Node.js** (推荐v16或更高版本)
2. **Python** (推荐v3.8或更高版本)
3. **Ollama** (本地运行的AI模型服务)

## 安装步骤

### 1. 克隆项目

```bash
# 克隆项目代码
# 注意：请替换为实际的仓库地址
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 安装后端依赖

```bash
cd server
pip install flask flask-cors
```

### 4. 启动Ollama服务

确保Ollama服务已在本地启动并运行在默认端口(11434)上。

## 运行应用

使用以下命令同时启动前端和后端服务：

```bash
npm run dev
```

应用启动后，可以通过浏览器访问 `http://localhost:5173` 来使用聊天界面。

## 功能特性

- 🤖 **多模型支持**: 可以选择不同的Ollama模型进行对话
- 💬 **会话管理**: 创建、切换和保存多个聊天会话
- 💾 **自动保存**: 聊天记录自动保存到本地文件系统
- 📝 **导出功能**: 支持将聊天记录导出为文本文件
- 🎨 **现代界面**: 简洁美观的用户界面

## 项目结构

```
├── src/             # Vue前端代码
│   ├── components/  # Vue组件
│   ├── stores/      # Pinia状态管理
│   ├── services/    # API服务
│   └── views/       # 页面视图
├── server/          # Python后端代码
├── sessions/        # 会话文件存储目录
└── public/          # 静态资源
```

## 配置说明

- **前端服务**: 默认运行在 http://localhost:5173
- **后端服务**: 默认运行在 http://localhost:3001
- **Ollama API**: 默认运行在 http://localhost:11434

## 常见问题

### Ollama服务未连接

如果应用显示"Ollama服务未运行"的错误，请确保：
- Ollama服务已正确安装
- Ollama服务正在运行 (可以通过 `ollama run <模型名称>` 命令启动)
- 端口11434没有被其他程序占用

### 会话文件保存位置

所有的会话文件默认保存在项目根目录下的 `sessions/` 文件夹中，以 `.olm` 为扩展名。

## 开发说明

### 前端开发

```bash
npm run dev  # 启动开发服务器
npm run build  # 构建生产版本
```

### 后端开发

```bash
cd server
python app.py  # 单独启动后端服务
```

## License

MIT
