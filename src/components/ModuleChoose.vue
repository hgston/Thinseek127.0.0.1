<template>
    <div class="module-choose">
        <div class="select-wrapper">
            <select v-model="selectedModel" @change="updateModel" :disabled="!isModelsLoaded" class="styled-select">
                <!-- 加载完成前显示默认选项 -->
                <option v-if="!isModelsLoaded" :value="selectedModel" disabled>
                    {{ defaultModel }} (Loading...)
                </option>
                <option v-for="model in chatStore.models" :key="model" :value="model">
                    {{ model }}
                </option>
            </select>
            <div class="select-arrow">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChatStore } from '../stores/chat.store.js';

const chatStore = useChatStore();
const isModelsLoaded = ref(false);
const defaultModel = 'deepseek-r1:7b'; // 默认首选模型
const selectedModel = ref('');
// 初始化逻辑
const initializeModel = () => {
    // 优先级: 1. 本地存储的模型 2. 默认模型 3. 第一个可用模型
    const targetModel = chatStore.selectedModel || defaultModel;

    if (chatStore.models.includes(targetModel)) {
        selectedModel.value = targetModel;
        chatStore.updateModel(targetModel);
    } else if (chatStore.models.length > 0) {
        selectedModel.value = chatStore.models[0];
        chatStore.updateModel(selectedModel.value);
    }
};

// 响应式模型引用



onMounted(async () => {
    try {
        await chatStore.fetchModels();
        isModelsLoaded.value = true;
        initializeModel();
        // 确保至少选中第一个模型
        if (!selectedModel.value && chatStore.models.length > 0) {
            selectedModel.value = chatStore.models[0];
            chatStore.updateModel(selectedModel.value);
        }
    } catch (error) {
        console.error('模型加载失败:', error);
        // 降级处理：设置默认值
        isModelsLoaded.value = true;
        selectedModel.value = defaultModel;
        chatStore.models = [defaultModel]; // 确保至少有一个可选项
        chatStore.updateModel(defaultModel);
    }
});

const updateModel = () => {
    if (selectedModel.value) {
        chatStore.updateModel(selectedModel.value);
    }
};
</script>

<style scoped>
.module-choose {
    height: 60px;
    display: flex;
    justify-content: space-between;
}

.select-wrapper {
    position: relative;
    min-width: 200px;
    margin: 6px 20px;
}

.styled-select {
    /* 基础样式 */
    width: 100%;
    padding: 14px 48px 14px 16px;
    
    border: 2px solid #c3dafe;
    border-radius: 10px;
    background: linear-gradient(145deg, #f8fbff 0%, #f0f8ff 100%);
    color: #2c5282;
    font-size: 15px;
    font-weight: 500;
    appearance: none;
    transition: all 0.25s ease-in-out;
    box-shadow:
        0 2px 4px rgba(194, 219, 254, 0.1),
        0 1px 2px rgba(194, 219, 254, 0.05);

    /* 文字样式 */
    letter-spacing: 0.3px;
    text-overflow: ellipsis;
}

/* 自定义下拉箭头 */
.select-arrow {
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    pointer-events: none;
    color: #2c5282;
    opacity: 0.8;
}

/* 悬停效果 */
.styled-select:hover {
    border-color: #a3cdff;
    box-shadow:
        0 4px 6px rgba(163, 205, 255, 0.1),
        0 2px 4px rgba(163, 205, 255, 0.05);
    background: linear-gradient(145deg, #f4f9ff 0%, #e8f4ff 100%);
}

/* 聚焦效果 */
.styled-select:focus {
    outline: none;
    border-color: #7eb8ff;
    box-shadow:
        0 0 0 3px rgba(126, 184, 255, 0.2),
        0 4px 8px rgba(163, 205, 255, 0.1);
}

/* 禁用状态 */
.styled-select:disabled {
    opacity: 0.7;
    background: #f0f8ff;
    color: #94a3b8;
    border-color: #e2e8f0;
}

/* 下拉菜单样式 (Chrome/Safari) */
.styled-select option {
    padding: 12px;
    background: #f8fbff;
    color: #2c5282;
}

.styled-select option:hover {
    background: #e8f4ff !important;
}


/* 响应式调整 */
@media (max-width: 768px) {
    .styled-select {
        padding: 12px 40px 12px 14px;
        font-size: 14px;
    }

    .select-arrow {
        right: 12px;
    }
}
</style>