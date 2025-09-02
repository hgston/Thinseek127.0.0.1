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
        console.log('原始文本内容:', text);
        
        // 处理<think>标签的流式输出
        // 当检测到<think>开始标记时立即开始渲染思考过程
        // 当检测到</think>结束标记时立即关闭思考过程渲染
        let processedText = text;
        
        // 检查是否包含<think>开始标记
        const hasThinkStart = processedText.includes('<think>');
        // 检查是否包含</think>结束标记
        const hasThinkEnd = processedText.includes('</think>');
        
        console.log(`检测到<think>开始标记: ${hasThinkStart}, 检测到</think>结束标记: ${hasThinkEnd}`);
        
        // 如果有开始标记
        if (hasThinkStart) {
            // 查找<think>标记的位置
            const thinkStartIndex = processedText.indexOf('<think>');
            
            // 提取<think>标记之前的内容
            const beforeThink = processedText.substring(0, thinkStartIndex);
            
            // 提取<think>标记之后的内容
            let afterThinkStart = processedText.substring(thinkStartIndex + 7); // 7是<think>的长度
            
            // 如果也有结束标记
            if (hasThinkEnd) {
                // 查找</think>标记的位置
                const thinkEndIndex = afterThinkStart.indexOf('</think>');
                
                // 提取思考过程内容
                const thinkingProcess = afterThinkStart.substring(0, thinkEndIndex);
                
                // 提取</think>标记之后的内容
                const afterThinkEnd = afterThinkStart.substring(thinkEndIndex + 8); // 8是</think>的长度
                
                // 将思考过程内容转换为HTML格式（替换换行符）
                const formattedThinkingProcess = thinkingProcess.split('\n').join('<br>');
                
                // 组合处理后的文本
                processedText = beforeThink + 
                  '<div class="thought-process">' + formattedThinkingProcess + '</div>' + 
                  afterThinkEnd;
            } else {
                // 只有开始标记，没有结束标记（流式输出中）
                // 将<think>之后的所有内容都视为思考过程
                const thinkingProcess = afterThinkStart;
                
                // 将思考过程内容转换为HTML格式（替换换行符）
                const formattedThinkingProcess = thinkingProcess.split('\n').join('<br>');
                
                // 组合处理后的文本（注意：这里不闭合div，因为流式输出还未结束）
                processedText = beforeThink + 
                  '<div class="thought-process">' + formattedThinkingProcess;
            }
        } else if (hasThinkEnd) {
            // 只有结束标记，没有开始标记（这不应该发生，但为了健壮性考虑）
            const thinkEndIndex = processedText.indexOf('</think>');
            
            // 提取</think>标记之前的内容
            const beforeThinkEnd = processedText.substring(0, thinkEndIndex);
            
            // 提取</think>标记之后的内容
            const afterThinkEnd = processedText.substring(thinkEndIndex + 8);
            
            // 闭合思考过程div并组合文本
            processedText = beforeThinkEnd + '</div>' + afterThinkEnd;
        }
        
        console.log('准备解析的最终文本:', processedText);
        
        // 对处理后的文本进行Markdown解析和HTML净化
        // 使用try-catch确保解析失败时不会影响用户体验
        let html;
        try {
            html = marked.parse(processedText);
            console.log('解析后的HTML:', html);
        } catch (markdownError) {
            console.error('Markdown解析错误:', markdownError);
            // 解析失败时，返回原始文本的净化版本
            console.log('Markdown解析失败，尝试直接净化原始文本');
            try {
                return DOMPurify.sanitize(processedText);
            } catch (sanitizeError) {
                console.error('文本净化错误:', sanitizeError);
                return processedText; // 最后返回原始文本
            }
        }
        
        // 净化HTML
        const sanitizedHtml = DOMPurify.sanitize(html);
        console.log('净化后的HTML:', sanitizedHtml);
        return sanitizedHtml;
    } catch (error) {
        console.error('Markdown渲染错误:', error);
        console.error('错误发生时的文本:', text);
        // 在错误情况下，尝试直接渲染原始文本，确保用户至少能看到内容
        try {
            console.log('尝试直接净化原始文本');
            return DOMPurify.sanitize(text);
        } catch (innerError) {
            console.error('净化HTML错误:', innerError);
            return text;
        }
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
    background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
    border: 1px solid #bbdefb;
    border-left: 5px solid #2196f3;
    padding: 20px;
    margin: 16px 0;
    border-radius: 8px;
    font-style: normal;
    color: #212121;
    font-size: 0.95em;
    line-height: 1.8;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

/* 思考过程悬停效果 */
.message-content :deep(.thought-process:hover) {
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.25);
    transform: translateY(-2px);
}

/* 思考过程伪元素装饰 */
.message-content :deep(.thought-process::before) {
    content: "";
    position: absolute;
    top: -12px;
    left: 16px;
    background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
    color: white;
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 20px;
    font-style: normal;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
}

/* 思考过程内容样式 */
.message-content :deep(.thought-process) {
    padding-top: 0;
}

/* 思考过程段落样式 */
.message-content :deep(.thought-process) p {
    margin: 12px 0;
    text-indent: 2em;
}

/* 思考过程中的代码块样式 */
.message-content :deep(.thought-process code) {
    background-color: rgba(33, 150, 243, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', Monaco, Consolas, 'Courier New', monospace;
}

/* 思考过程中的强调文本 */
.message-content :deep(.thought-process strong) {
    color: #0d47a1;
    font-weight: 600;
}
</style>