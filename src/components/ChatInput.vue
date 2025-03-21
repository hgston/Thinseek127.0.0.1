<template>
    <!-- 聊天输入组件 -->
    <div class="chat-input" :class="{ 'initial-position': !hasSentMessage }">
        <div class="input-wrapper">
            <input v-model="inputText" @keyup.enter="handleSend" placeholder="有什么我能帮您的吗?" :disabled="isLoading"
                class="styled-input" />
            <button @click="handleSend" :disabled="isLoading" class="send-btn">
                <svg v-if="!isLoading" viewBox="0 0 24 24" class="send-icon">
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <span v-else class="loading-dots">●●●</span>
            </button>
        </div>
        <div class="icons">
            <!-- 图标按钮 (取消注释后使用) -->
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChatStore } from '../stores/chat.store';
import { storeToRefs } from 'pinia';

const chatStore = useChatStore();
const { messages, isLoading } = storeToRefs(chatStore);
const inputText = ref('');
const hasSentMessage = computed(() => messages.value.length > 0);

const handleSend = () => {
    if (inputText.value.trim() && !isLoading.value) {
        chatStore.sendMessage(inputText.value);
        inputText.value = '';
    }
};
</script>

<style scoped>
/* 统一设计系统变量 */
:root {
    --primary: #2c5282;
    --secondary: #a3cdff;
    --background: linear-gradient(145deg, #f8fbff 0%, #f0f8ff 100%);
    --shadow: 0 4px 6px rgba(194, 219, 254, 0.1);
}

.chat-input {
    background: var(--background);
    border: 2px solid #c3dafe;
    border-radius: 16px;
    box-shadow: var(--shadow);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 20px auto;
    padding: 14px 20px;
    min-width: 50%;
    background-color: aliceblue;
}

.input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.styled-input {
    flex: 1;
    padding: 14px 20px;
    border: none;
    background: transparent;
    font-size: 16px;
    color: var(--primary);
    letter-spacing: 0.3px;
    border-radius: 12px;
    transition: all 0.25s ease;
}

.styled-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
}

.styled-input:focus {
    outline: none;
    background-color: aliceblue;
}

.styled-input:hover {
    background: rgba(227, 242, 253, 0.2);
}

.send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    /* background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); */
    background: linear-gradient(to right top,
                rgba(175, 216, 255, 0.9) 0%,
                /* 浅蓝紫色 */
                rgba(240, 248, 255, 0.95) 100%
                /* aliceblue透明度微调 */
            );
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.send-icon {
    width: 24px;
    height: 24px;
    color: white;
    transform: rotate(-30deg);
    transition: transform 0.3s ease;
}

.send-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(99, 102, 241, 0.25);
}

.send-btn:hover .send-icon {
    transform: rotate(0deg) translateX(2px);
}

.send-btn:active {
    transform: translateY(1px);
}

.loading-dots {
    color: white;
    letter-spacing: 2px;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.5;
    }

    50% {
        opacity: 1;
    }
}

.initial-position {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(163, 205, 255, 0.2);
}

@media (max-width: 768px) {
    .chat-input {
        min-width: 85%;
        padding: 12px;
        border-radius: 14px;
    }

    .styled-input {
        padding: 12px 16px;
        font-size: 15px;
    }

    .send-btn {
        width: 40px;
        height: 40px;
    }
}

.icons {
    display: flex;
    gap: 10px;
    margin-left: 20px;
}

.icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--background);
    border: 1px solid #c3dafe;
    transition: all 0.3s ease;
}

.icon-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.icon-button img {
    width: 18px;
    height: 18px;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}
</style>