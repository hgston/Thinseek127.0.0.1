import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { ollamaService } from '../services/ollama.service.js';
import { useSessionStore } from './session.store.js';

// 一个消息数组，可以直接存到文件里，然后也可以直接读出来
// Message interface removed for JavaScript compatibility

export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [{messageid: '1',  content: '你今天来陪我玩我真是太高兴了，你有什么想和我说的吗?', role: 'assistant', timestamp: Date.now() }],
        isLoading: false,
        error: null,
        selectedModel: 'qwen3:1.7b', // 默认模型
        models: [], // 模型列表
        saveTimeout: null // 用于防抖保存
    }),
    actions: {
        exportToTxt() {
            try {
                const content = this.messages
                    .map(msg => {
                        const date = new Date(msg.timestamp);
                        return `[${date.toLocaleString()}] ${msg.role.toUpperCase()}:\n${msg.content}\n\n`;
                    })
                    .join('\n');

                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');

                a.href = url;
                a.download = `chat_history_${new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '')}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('导出失败:', error);
                this.error = '导出聊天记录失败';
            }
        },
        // 防抖保存函数
        debouncedSave() {
            console.log('触发防抖保存');
            // 清除之前的定时器
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            
            // 设置新的定时器，延迟保存
            this.saveTimeout = setTimeout(() => {
                const sessionStore = useSessionStore();
                console.log('执行保存，当前会话:', sessionStore.currentSession?.id);
                if (sessionStore.currentSession) {
                    this.saveChatHistory();
                } else {
                    console.log('没有当前会话，无法保存');
                }
            }, 1000); // 1秒延迟，避免频繁保存
        },
        
        // 从文本中提取简短摘要作为会话标题
        extractSessionTitle(text) {
            // 移除多余的空白字符
            const cleanedText = text.trim().replace(/\s+/g, ' ');
            
            // 如果文本很短，直接使用
            if (cleanedText.length <= 20) {
                return cleanedText;
            }
            
            // 提取前20个字符并添加省略号
            return cleanedText.substring(0, 20) + '...';
        },
        
        // 保存聊天历史
        async saveChatHistory() {
            console.log('开始保存聊天历史');
            try {
                const sessionStore = useSessionStore();
                if (sessionStore.currentSession) {
                    // 检查是否需要更新会话标题（如果标题是默认的时间戳格式）
                    if (sessionStore.currentSession.sessionName.startsWith('对话 ')) {
                        // 查找用户的第一条消息
                        const firstUserMessage = this.messages.find(msg => msg.role === 'user');
                        if (firstUserMessage) {
                            // 提取摘要作为新的会话标题
                            const newTitle = this.extractSessionTitle(firstUserMessage.content);
                            if (newTitle) {
                                sessionStore.currentSession.sessionName = newTitle;
                                console.log('已更新会话标题:', newTitle);
                            }
                        }
                    }
                    
                    const success = await sessionStore.saveSession(sessionStore.currentSession);
                    console.log('保存聊天历史结果:', success);
                } else {
                    console.log('没有当前会话，无法保存');
                }
            } catch (error) {
                console.error('保存聊天记录失败:', error);
                this.error = '保存聊天记录失败';
            }
        },
        
        async sendMessage(content) {
            if (!content.trim()) return;

            const userMessage = {
                messageid: uuidv4(),
                content,
                role: "user",
                timestamp: Date.now(),
            };
            this.messages.push(userMessage);
            
            // 用户发送消息后立即尝试保存
            const sessionStore = useSessionStore();
            if (!sessionStore.currentSession) {
                await sessionStore.createNewSession();
            } else {
                this.debouncedSave(); // 防抖保存
            }

            this.isLoading = true;
            try {
                const messagesForOllama = this.messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }));
                
                const stream = await ollamaService.sendMessage(messagesForOllama, this.selectedModel);
                if (!stream) {
                    this.error = '请求失败';
                    return;
                }

                const reader = stream.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                // 预先创建bot消息
                const botMessage = {
                    messageid: uuidv4(),
                    content: '',
                    role: 'assistant',  // 确保角色正确
                    timestamp: Date.now(),
                };
                this.messages.push(botMessage);
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';  // 保留不完整的数据

                    for (const line of lines) {
                        try {
                            if (!line.trim()) continue;
                            const data = JSON.parse(line);

                            // 根据Ollama Chat API格式调整
                            if (data.message?.content) {
                                const lastMessage = this.messages[this.messages.length - 1];
                                if (lastMessage.role === 'assistant') {
                                    lastMessage.content += data.message.content;
                                    this.messages = [...this.messages]; // 触发响应式更新
                                }
                            }
                        } catch (error) {
                            console.error('解析错误:', error, '原始数据:', line);
                        }
                    }
                }
                // 消息完成后再次保存
                await this.saveChatHistory();
            } catch (error) {
                this.error = '请求失败';
                console.error(error);
            } finally {
                this.isLoading = false;
            }
        },
        updateModel(model) {
            this.selectedModel = model;
        },
        async fetchModels() {
            try {
                this.models = await ollamaService.getModels();
            } catch (error) {
                this.error = 'Failed to fetch models';
                console.error(error);
            }
        },

    },
});