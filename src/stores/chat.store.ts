import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { ollamaService } from '../services/ollama.service.ts';
import { useSessionStore } from './session.store.ts';

// 一个消息数组，可以直接存到文件里，然后也可以直接读出来
export interface Message {
    messageid: string;
    content: string;
    role: string;
    timestamp: number;
}

export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [{messageid: '1',  content: '你今天来陪我玩我真是太高兴了，你有什么想和我说的吗?', role: 'assistant', timestamp: Date.now() }] as Message[],
        isLoading: false,
        error: null as string | null,
        selectedModel: 'deepseek-r1:7b' as string, // 默认模型
        models: [] as string[], // 模型列表
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
        async sendMessage(content: string) {
            if (!content.trim()) return;

            const userMessage = {
                messageid: uuidv4(),
                content,
                role: "user",
                timestamp: Date.now(),
            };
            this.messages.push(userMessage);
            if (!useSessionStore().currentSession) {
                useSessionStore().createNewSession();
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
                useSessionStore().loadSessions();
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
                useSessionStore().saveSession(useSessionStore().currentSession);
            } catch (error) {
                this.error = '请求失败';
                console.error(error);
            } finally {
                this.isLoading = false;
            }
        },
        updateModel(model: string) {
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