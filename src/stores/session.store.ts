// stores/session.ts
import { defineStore } from 'pinia';
import { useChatStore, type Message } from './chat.store.ts';

export interface Session {
    id: string;
    sessionName: string;
    filePath: string;
    createdAt: number;
    lastUpdated: number;
    messages: Message[];
}

export const useSessionStore = defineStore('session', {
    state: () => ({
        currentSession: null as Session | null,
        sessions: [] as Session[],
    }),

    actions: {
        async createNewSession() {
            try {
                // 创建包含默认值的新会话对象
                const newSession: Session = {
                    id: '0',
                    sessionName: '新建会话',
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    messages: [{
                        messageid: crypto.randomUUID(), // 生成唯一ID
                        content: '你今天来陪我玩我真是太高兴了，你有什么想和我说的吗?',
                        role: 'assistant',
                        timestamp: Date.now()
                    }], // 必须包含至少一个消息
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
        async saveSession(session: Session) {
            try {
                const sion = this.sessions.find(s => s.id === session.id);
                if (!sion) return;
                const ChatStore = useChatStore();
                session.messages = ChatStore.messages;
                const response = await fetch(`http://localhost:3001/savesessions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(session)
                });

                if (response.ok) {
                    session.lastUpdated = Date.now();
                }
            } catch (error) {
                console.error('自动保存失败:', error);
            }
        },

        // 加载会话列表
        async loadSessions() {
            const response = await fetch('http://localhost:3001/getsessions');
            this.sessions = await response.json();
        },

        // 切换会话
        async switchSession(session: Session) {
            const response = await fetch(`http://localhost:3001/catsessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });

            const nowsession = await response.json();
            const chatStore = useChatStore();
            chatStore.messages = nowsession.messages;
            this.currentSession = session;
        }
    }
});