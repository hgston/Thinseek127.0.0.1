<template>
    <div class="message-list" ref="messageListRef">
        <div v-for="msg in messages" :key="msg.messageid" class="message-item">
            <div :class="['message-bubble', msg.role]">
                <div class="timestamp">{{ formatTime(msg.timestamp) }}</div>
                <!-- 优化后的消息内容渲染 -->
                <div v-if="msg.role === 'assistant'" class="message-content" v-html="renderMarkdown(msg.content)"></div>
                <div v-else class="message-content">{{ msg.content }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../stores/chat.store';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 更换更清晰的代码主题

const chatStore = useChatStore();
const { messages } = storeToRefs(chatStore);
const messageListRef = ref<HTMLElement | null>(null);

// 加强滚动逻辑
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
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

// 优化后的Markdown配置
marked.setOptions({
    highlight: (code, lang) => {
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
    silent: true // 禁用警告
});

// 添加自定义思考标签解析
const renderMarkdown = (text: string) => {
    try {
        // 处理自定义标签
        const withThinkTags = text.replace(/<think>([\s\S]*?)<\/think>/g, (_, content) => {
            return `<div class="think-block">${marked.parse(content.trim())}</div>`;
        });

        return marked.parse(withThinkTags);
    } catch (error) {
        console.error('Markdown渲染错误:', error);
        return text;
    }
};

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// 优化监听逻辑
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

/* 加强代码块样式 */
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

/* 思考块样式 */
.message-content :deep(.think-block) {
    background-color: #f0f8ff;
    border: 2px dashed #93c5fd;
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    color: #a8bbf0;
}

.message-content :deep(.think-block)::before {
    content: "💭 Thinking Process";
    display: block;
    font-weight: 500;
    font-size: 0.9em;
    color: #3b82f6;
    margin-bottom: 8px;
}

/* 优化滚动条 */
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
</style>