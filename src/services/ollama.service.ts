// services/ollama.service.ts
export const ollamaService = {
    async sendMessage(messages: Array<{ role: string; content: string }>, model: string = 'deepseek-r1:7b') {
        const response = await fetch('http://localhost:11434/api/chat', {  // 修改为 chat 接口
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,  // 使用 messages 替代 prompt
                stream: true
            }),
        });

        if (!response.ok) throw new Error(`Ollama API Error: ${response.status}`);
        return response.body;
    },

    async getModels(): Promise<string[]> {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.models.map((m: any) => m.name);
        } catch (error) {
            console.error('Model fetch error:', error);
            return [];
        }
    }
};