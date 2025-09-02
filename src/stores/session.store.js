// stores/session.js
import { defineStore } from 'pinia';
import { useChatStore } from './chat.store.js';

// Session interface removed for JavaScript compatibility

export const useSessionStore = defineStore('session', {
    state: () => ({
        currentSession: null,
        sessions: [],
    }),

    actions: {
        async createNewSession() {
            try {
                // 创建真正的全新会话，无论当前是否有消息
                // 生成包含时间戳的独特会话名称
                const timestamp = new Date().toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/[/:]/g, '-');
                
                const newSession = {
                    id: crypto.randomUUID(), // 使用UUID避免ID冲突
                    sessionName: `对话 ${timestamp}`,
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    messages: [{
                        messageid: crypto.randomUUID(), // 生成唯一ID
                        content: '你今天来陪我玩我真是太高兴了，你有什么想和我说的吗?',
                        role: 'assistant',
                        timestamp: Date.now()
                    }], // 始终创建包含默认消息的新会话
                    filePath: '' // 由后端生成
                };
                const response = await fetch('http://localhost:3001/newsessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newSession) // 关键修改点：序列化对象
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '未知错误');
                }

                const createdSession = await response.json();
                this.currentSession = createdSession.session;
                useChatStore().messages = createdSession.session.messages;
                this.sessions.push(createdSession.session);
                return createdSession.session;

            } catch (error) {
                console.error('创建会话失败:', error);
            }
        },

        // 保存会话到后端
        async saveSession(session) {
            try {
                console.log('=== 开始保存会话流程 ===');
                console.log('传入的会话对象:', session?.id ? '有效' : '无效');
                
                // 确保传入的session有效
                if (!session) {
                    console.error('保存失败: 会话对象为空');
                    return false;
                }
                
                console.log('准备保存的会话ID:', session.id);
                
                // 查找完整的会话信息
                const existingSession = this.sessions.find(s => s.id === session.id);
                console.log('查找现有会话结果:', existingSession ? '找到' : '未找到');
                
                if (!existingSession) {
                    console.error('保存失败: 找不到对应会话', session.id);
                    console.log('当前sessions数组:', this.sessions.map(s => s.id));
                    return false;
                }
                
                // 确保filePath存在
                console.log('现有会话filePath:', existingSession.filePath);
                if (!existingSession.filePath) {
                    console.error('保存失败: 会话缺少filePath参数');
                    return false;
                }
                
                const ChatStore = useChatStore();
                console.log('准备保存的消息数量:', ChatStore.messages.length);
                
                // 准备要保存的数据
                const sessionToSave = {
                    ...existingSession, // 优先使用完整的现有会话数据
                    ...session,         // 合并传入的更新数据
                    messages: ChatStore.messages,
                    lastUpdated: Date.now()
                };
                
                console.log('准备发送保存请求，filePath:', sessionToSave.filePath);
                console.log('保存请求前检查: 会话ID=' + sessionToSave.id + ', 标题=' + sessionToSave.sessionName);
                
                // 发送保存请求
                console.log('开始发送保存请求到后端...');
                const response = await fetch(`http://localhost:3001/savesessions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionToSave)
                });

                console.log('保存请求响应状态:', response.status);
                
                if (response.ok) {
                    // 更新本地会话数据
                    Object.assign(session, sessionToSave);
                    // 同时更新sessions数组中的会话
                    const index = this.sessions.findIndex(s => s.id === session.id);
                    if (index !== -1) {
                        this.sessions[index] = { ...sessionToSave };
                    }
                    console.log('会话保存成功，数据已更新');
                    return true;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('保存会话失败:', response.status, errorData);
                    console.log('保存失败的响应内容:', JSON.stringify(errorData));
                    return false;
                }
            } catch (error) {
                console.error('自动保存失败:', error);
                return false;
            }
        },

        // 加载会话列表
        async loadSessions() {
            try {
                const response = await fetch('http://localhost:3001/getsessions');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                // 检查返回的格式，确保正确处理
                this.sessions = result.sessions || result || [];
                console.log('会话列表加载成功，会话数量:', this.sessions.length);
            } catch (error) {
                console.error('加载会话列表失败:', error);
                this.sessions = [];
            }
        },

        // 切换会话
        async switchSession(session) {
            try {
                const response = await fetch(`http://localhost:3001/getsession`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: session.filePath }) // 只传递必要的filePath
                });

                const nowsession = await response.json();
                const chatStore = useChatStore();
                chatStore.messages = nowsession.messages;
                this.currentSession = session;
            } catch (error) {
                console.error('切换会话失败:', error);
                // 如果切换失败，保持当前会话不变
            }
        }
    }
});