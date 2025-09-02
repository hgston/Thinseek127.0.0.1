// services/ollama.service.js
export const ollamaService = {
    // 检查Ollama服务是否可用
    async checkService() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', { timeout: 3000 });
            return response.ok;
        } catch (error) {
            console.error('Ollama服务不可用:', error);
            return false;
        }
    },

    async sendMessage(messages, model = 'deepseek-r1:7b') {
        try {
            // 先检查服务是否可用
            const isAvailable = await this.checkService();
            if (!isAvailable) {
                throw new Error('Ollama服务未运行，请先启动Ollama服务');
            }

            const response = await fetch('http://localhost:11434/api/chat', {  // 使用chat接口
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages,  // 使用messages替代prompt
                    stream: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Ollama API错误: ${response.status} ${errorData.error || ''}`);
            }
            
            if (!response.body) {
                throw new Error('Ollama API未返回数据流');
            }
            
            return response.body;
        } catch (error) {
            console.error('发送消息失败:', error);
            throw error; // 重新抛出错误，让调用方处理
        }
    },

    async getModels() {
        try {
            // 先检查服务是否可用
            const isAvailable = await this.checkService();
            if (!isAvailable) {
                console.warn('Ollama服务未运行，无法获取模型列表');
                return [];
            }

            const response = await fetch('http://localhost:11434/api/tags', { timeout: 5000 });
            if (!response.ok) {
                throw new Error(`获取模型失败: HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data.models ? data.models.map((m) => m.name) : [];
        } catch (error) {
            console.error('获取模型列表错误:', error);
            return [];
        }
    }
};