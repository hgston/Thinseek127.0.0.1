<template>
    <div class="message-list" ref="messageListRef">
        <div v-for="msg in messages" :key="msg.messageid" class="message-item">
            <div :class="['message-bubble', msg.role]">
                <div class="timestamp">{{ formatTime(msg.timestamp) }}</div>
                <div v-if="msg.role === 'assistant'" class="message-content" v-html="renderMarkdown(msg.content)"></div>
                <div v-else class="message-content">{{ msg.content }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../stores/chat.store.js';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';

const chatStore = useChatStore();
const { messages } = storeToRefs(chatStore);
const messageListRef = ref(null);

const scrollToBottom = (behavior = 'smooth') => {
    nextTick(() => {
        const container = messageListRef.value;
        if (container) {
            const shouldScroll = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
            if (shouldScroll) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior
                });
            }
        }
    });
};

marked.setOptions({
    highlight: (code, lang) => {
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
    silent: true
});

const renderMarkdown = (text) => {
    try {
        // 检查是否包含思考过程
        if (text.includes('现在用户的新消息是') || text.includes('需要考虑用户的内心感受') || text.includes('要回应他的需求')) {
            // 将思考过程部分包裹在特殊的div中
            let processedText = text;
            // 简单的模式匹配，实际应用中可能需要更复杂的解析
            const thoughtPatterns = [
                /现在用户的新消息是.*?要回应他的需求/g,
                /现在用户的新消息是[^。]*?。/g,
                /需要考虑用户的内心感受.*?。/g,
                /要回应他的需求.*?。/g
            ];
            
            thoughtPatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        processedText = processedText.replace(match, `<div class="thought-process">${match}</div>`);
                    });
                }
            });
            
            const html = marked.parse(processedText);
            return DOMPurify.sanitize(html);
        }
        
        const html = marked.parse(text);
        return DOMPurify.sanitize(html);
    } catch (error) {
        console.error('Markdown渲染错误:', error);
        return text;
    }
};

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

watch(
    () => messages.value.length,
    (newVal, oldVal) => {
        if (newVal !== oldVal) {
            scrollToBottom(oldVal === 0 ? 'auto' : 'smooth');
        }
    }
);

onMounted(() => {
    scrollToBottom('auto');
});
</script>

<style scoped>
.message-list {
    height: 80vh;
    overflow-y: auto;
    padding: 10px 10% 10px 10%;
    scroll-behavior: smooth;
}

.message-item {
    margin: 20px 10px;
    display: flex;
    flex-direction: column;
}

.message-bubble {
    max-width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 16px;
    line-height: 1.6;
    word-wrap: break-word;
}

.message-bubble.assistant {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    color: #535e70;
}

.message-bubble.user {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    margin-left: auto;
    color: #7193e8;
}

.timestamp {
    font-size: 10px;
    color: #6b7280;
    margin-bottom: 4px;
}

.message-content :deep(pre) {
    background-color: #f6f8fa !important;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 12px 0;
    border: 1px solid #e5e7eb;
}

.message-content :deep(code) {
    font-family: 'Fira Code', Monaco, Consolas, 'Courier New', monospace;
    font-size: 0.9em;
    padding: 0.2em 0.4em;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 4px;
}

.message-content :deep(pre code) {
    background: none;
    padding: 0;
    font-size: 14px;
}

.message-list::-webkit-scrollbar {
    width: 8px;
    background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 思考过程样式 */
.message-content :deep(.thought-process) {
    background-color: #f0f7ff;
    border-left: 4px solid #bfdbfe;
    padding: 12px 16px;
    margin: 8px 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #4f46e5;
    font-size: 0.95em;
}
</style>