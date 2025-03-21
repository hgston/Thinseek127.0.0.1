<template>
    <div class="session-list">
        <div class="header">
            <button @click="createNew" class="new-btn">
                <span class="icon">+</span> 新建会话
            </button>
        </div>

        <div v-if="loading" class="loading">加载中...</div>

        <div v-else class="scroll-container">
            <div v-for="session in sortedSessions" :key="session.id" class="session-item"
                :class="{ active: isActive(session) }" @click="selectSession(session)">
                <div class="session-meta">
                    <span>{{ session.sessionName }}</span>
                    <span class="date">{{ formatTimestamp(session.lastUpdated) }}</span>
                </div>
                <div v-if="session.id === '0'" class="status-badge">创建中...</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSessionStore, type Session } from '../stores/session.store'

const sessionStore = useSessionStore()
const loading = ref(false)

onMounted(async () => {
    try {
        loading.value = true
        await sessionStore.loadSessions()
    } finally {
        loading.value = false
    }
})

// 日期格式化函数
const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })
}

// 修正后的排序逻辑
const sortedSessions = computed(() => {
    return [...sessionStore.sessions].sort((a, b) => b.lastUpdated - a.lastUpdated)
})

// 优化后的会话选择逻辑
const selectSession = async (session: Session) => {
    if (sessionStore.currentSession?.id === session.id) return

    try {
        loading.value = true
        await sessionStore.switchSession(session)
    } catch (error) {
        console.error('切换会话失败:', error)
        throw new Error('无法加载会话内容')
    } finally {
        loading.value = false
    }
}

// 创建新会话逻辑
const createNew = async () => {
    try {
        loading.value = true
        await sessionStore.createNewSession()
    } finally {
        loading.value = false
    }
}

// 判断当前会话是否激活
const isActive = (session: Session): boolean => {
    return sessionStore.currentSession?.id === session.id
}
</script>

<style scoped>
span {
    width:fit-content;
}

.date {
    color: #8694a3;
    font-size: 12px;
}

.session-list {
    height: 100vh;
}

.header {
    padding: 1.5rem 0;
}

.new-btn {
    border-radius: 10px;
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.25s ease-in-out;
    background: linear-gradient(145deg, #f0f8ff 0%, #e1f3ff 100%);
    color: #2c5282;
    border: 1.5px solid #c3dafe;
    box-shadow:
        0 2px 4px rgba(194, 219, 254, 0.2),
        0 1px 2px rgba(194, 219, 254, 0.15);
    display: inline-flex;
    justify-content: center;
    gap: 10px;
    width: 210px;
}

.new-btn:hover {
    background: linear-gradient(145deg, #e3f2ff 0%, #d4ebff 100%);
    transform: translateY(-1px);
    box-shadow:
        0 4px 6px rgba(163, 205, 255, 0.15),
        0 2px 4px rgba(163, 205, 255, 0.1);
    border-color: #a3cdff;
}

.scroll-container {
    height: 750px;
    overflow-y: auto;
    padding: 0 1rem;
    border-radius: 50px;
}

.scroll-container::-webkit-scrollbar {
    width: 4px;
}

.scroll-container::-webkit-scrollbar-track {
    background: rgba(211, 227, 253, 0.3);
    border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
    background: #a8c7ff;
    border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
    background: #7ab2ff;
}

.session-item {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    margin: 1rem 0;
    padding: 10px;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.session-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(122, 178, 255, 0.15);
}

.session-item.active {
    background: white;
    border-left: 4px solid #7ab2ff;
    box-shadow: 0 4px 12px rgba(122, 178, 255, 0.2);
}

.session-meta {
    /* display: flex;
    justify-content: column; */
    font-size: 0.9rem;
    color: #6b8db3;
    display: flex;
    flex-direction: column;
    /* 改为垂直方向 */
    gap: 9px;
}

.session-footer {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #88a9c7;
    text-align: right;
}

.loading {
    padding: 2rem;
    color: #7ab2ff;
    text-align: center;
    font-size: 1.1rem;
}
</style>