<template>
    <div class="chat-container">
        <div class="chat-sidebar">
            <Sidebar />
        </div>
        
        <div class="chat-window">
            <ModuleChoose />
            <MessageList />
            <ChatInput />
        </div>
    </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue';
import MessageList from '../components/MessageList.vue';
import ChatInput from '../components/ChatInput.vue';
import ModuleChoose from '../components/ModuleChoose.vue';
</script>

<style scoped>

.chat-container {
    display: flex;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
}

.chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    
}

</style>