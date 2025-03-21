<template>
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
        <div class="content">
            <button @click="chatStore.exportToTxt" class="export-btn">
                <svg class="icon" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M14,2H6C4.89,2 4,2.89 4,4V20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H11V12H13V15H16L12,19Z" />
                </svg>
                <span class="btn-text">导出当前聊天记录</span>
            </button>
            <SessionList />
        </div>

        <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <svg class="icon" viewBox="0 0 24 24">
                <path v-if="!isCollapsed" fill="currentColor"
                    d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z" />
                <path v-else fill="currentColor" d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z" />
            </svg>
        </button>

        
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chat.store';
import  SessionList  from './SessionList.vue'

const chatStore = useChatStore();
const isCollapsed = ref(false);
</script>

<style scoped>
.sidebar {
    --sidebar-width: 240px;
    --collapsed-width: 30px;
    --transition-duration: 0.3s;
    --accent-color: #2c5282;
    --hover-bg: #ebf4ff;

    position: relative;
    width: var(--sidebar-width);
    min-height: 100%;
    background: linear-gradient(145deg, #f8fcff 0%, #f0f7ff 100%);
    border-right: 1px solid #e0efff;
    transition: all var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 250px;
    height: 100vh;
    background-color: aliceblue;
    align-items: center;
    text-align: center;
}

.sidebar.collapsed {
    width: var(--collapsed-width);
}

.content {
    padding: 16px;
    opacity: 1;
    transition:
        opacity 0.2s ease,
        transform var(--transition-duration) ease;
}

.collapsed .content {
    opacity: 0;
    transform: translateX(-20px);
    pointer-events: none;
}

.export-btn {
    /* 基础样式 */
    border-radius: 10px;
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.25s ease-in-out;

    /* 颜色方案 */
    background: linear-gradient(145deg, #f0f8ff 0%, #e1f3ff 100%);
    color: #2c5282;
    border: 1.5px solid #c3dafe;
    box-shadow:
        0 2px 4px rgba(194, 219, 254, 0.2),
        0 1px 2px rgba(194, 219, 254, 0.15);

    /* 布局 */
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

/* 悬停效果 */
.export-btn:hover {
    background: linear-gradient(145deg, #e3f2ff 0%, #d4ebff 100%);
    transform: translateY(-1px);
    box-shadow:
        0 4px 6px rgba(163, 205, 255, 0.15),
        0 2px 4px rgba(163, 205, 255, 0.1);
    border-color: #a3cdff;
}

/* 点击效果 */
.export-btn:active {
    transform: translateY(1px);
    background: linear-gradient(145deg, #d4ebff 0%, #c5e4ff 100%);
    box-shadow:
        0 1px 2px rgba(163, 205, 255, 0.1) inset;
}

.btn-text {
    margin-left: 0px;
    white-space: nowrap;
}

.collapse-btn {
    position: absolute;
    top: 16px;
    right: -16px;
    width: 32px;
    height: 32px;
    background: white;
    border: 1px solid #e0efff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(163, 205, 255, 0.15);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.collapse-btn:hover {
    background: var(--hover-bg);
    transform: scale(1.1);
}

.collapse-btn .icon {
    width: 20px;
    height: 20px;
    color: #4975ab;
}

/* 图标样式 */
.icon {
    width: 20px;
    height: 20px;
    opacity: 0.8;
    transition: transform 0.2s ease;
}

/* 悬停时图标动画 */
.export-btn:hover .icon {
    transform: translateY(-2px);
    opacity: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .export-btn {
        padding: 10px 20px;
        font-size: 14px;
        margin: 6px 10px;
        gap: 8px;
    }

    .icon {
        width: 18px;
        height: 18px;
    }
}
</style>