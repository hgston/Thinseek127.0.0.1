import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useChatStore } from './stores/chat.store.js'
import { useSessionStore } from './stores/session.store.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化store并设置自动保存
const chatStore = useChatStore()
const sessionStore = useSessionStore()
// 加载现有会话列表
sessionStore.loadSessions().then(() => {
    console.log('会话列表已加载')
})


app.mount('#app')