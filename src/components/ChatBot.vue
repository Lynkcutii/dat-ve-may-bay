<script setup>
import { ref } from 'vue';
import capyImage from '@/img/capy.jpg';

const isChatOpen = ref(false);
const chatMessage = ref('');
const messages = ref([
  { text: 'Xin chào! Tôi là Bee Bot, tôi có thể giúp gì cho bạn?', sender: 'bot' }
]);

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

const sendMessage = () => {
  if (chatMessage.value.trim() === '') return;
  
  messages.value.push({ text: chatMessage.value, sender: 'user' });
  const userMsg = chatMessage.value.toLowerCase();
  chatMessage.value = '';

  // Giả lập bot trả lời thông minh hơn
  setTimeout(() => {
    let response = 'Bee Bot đã nhận được tin nhắn của bạn. Đội ngũ hỗ trợ sẽ phản hồi sớm nhất có thể!';
    
    if (userMsg.includes('chào') || userMsg.includes('hi') || userMsg.includes('hello')) {
      response = 'Chào bạn! Chúc bạn một ngày tốt lành. Bee Sport có thể giúp gì cho bạn hôm nay?';
    } else if (userMsg.includes('giá') || userMsg.includes('bao nhiêu')) {
      response = 'Bạn có thể xem giá chi tiết của từng sản phẩm trong mục "SẢN PHẨM" nhé!';
    } else if (userMsg.includes('ship') || userMsg.includes('giao hàng')) {
      response = 'Bee Sport giao hàng toàn quốc và miễn phí vận chuyển cho đơn hàng từ 500k!';
    }

    messages.value.push({ text: response, sender: 'bot' });
  }, 800);
};
</script>

<template>
  <div class="chatbot-container">
    <!-- Nút Chat Floating -->
    <button @click="toggleChat" class="chatbot-toggle shadow-lg">
      <img :src="capyImage" alt="ChatBot" class="bot-icon">
      <span class="pulse-ring"></span>
    </button>

    <!-- Cửa sổ Chat -->
    <div v-if="isChatOpen" class="chat-window shadow-lg border-0 rounded-4 overflow-hidden animate-slide-up">
      <div class="chat-header d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <div class="position-relative">
            <img :src="capyImage" width="35" height="35" class="rounded-circle border border-2 border-warning">
            <span class="online-status"></span>
          </div>
          <div class="ms-2">
            <div class="fw-bold lh-1 mb-1">Bee Bot</div>
            <div class="small opacity-75" style="font-size: 10px;">Đang trực tuyến</div>
          </div>
        </div>
        <button @click="toggleChat" class="btn btn-sm btn-link text-white p-0">
          <i class="fas fa-times fs-5"></i>
        </button>
      </div>

      <div class="chat-messages p-3">
        <div v-for="(msg, index) in messages" :key="index" :class="['message-wrapper mb-3', msg.sender]">
          <div v-if="msg.sender === 'bot'" class="bot-avatar me-2">
            <img :src="capyImage" width="24" height="24" class="rounded-circle">
          </div>
          <div class="bubble-content p-2 px-3 rounded-4 shadow-sm small">
            {{ msg.text }}
          </div>
        </div>
      </div>

      <div class="chat-input p-3 bg-white border-top">
        <div class="input-group bg-light rounded-pill px-2 py-1">
          <input 
            type="text" 
            v-model="chatMessage" 
            @keyup.enter="sendMessage"
            class="form-control border-0 shadow-none bg-transparent" 
            placeholder="Bạn cần hỗ trợ gì?"
          >
          <button @click="sendMessage" class="btn btn-warning rounded-circle d-flex align-items-center justify-content-center ms-1" style="width: 32px; height: 32px;">
            <i class="fas fa-paper-plane text-white small"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 1050;
}

.chatbot-toggle {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  border: 4px solid #fff;
  padding: 0;
  background: #ffc107;
  cursor: pointer;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: visible;
}

.chatbot-toggle:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 10px 20px rgba(255, 193, 7, 0.3);
}

.bot-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-window {
  position: absolute;
  bottom: 85px;
  right: 0;
  width: 350px;
  height: 500px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background: linear-gradient(135deg, #212529 0%, #343a40 100%);
  color: white;
  padding: 1rem;
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #28a745;
  border: 2px solid #212529;
  border-radius: 50%;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-image: radial-gradient(#dee2e6 1px, transparent 1px);
  background-size: 20px 20px;
}

.message-wrapper {
  display: flex;
  max-width: 85%;
  align-items: flex-end;
}

.message-wrapper.bot {
  align-self: flex-start;
}

.message-wrapper.bot .bubble-content {
  background: white;
  color: #212529;
  border-bottom-left-radius: 4px !important;
}

.message-wrapper.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-wrapper.user .bubble-content {
  background: #ffc107;
  color: #212529;
  font-weight: 500;
  border-bottom-right-radius: 4px !important;
}

.animate-slide-up {
  animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.pulse-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 65px;
  height: 65px;
  border: 4px solid #ffc107;
  border-radius: 50%;
  animation: pulse 2.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Custom Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 10px;
}

@media (max-width: 576px) {
  .chat-window {
    width: 300px;
    height: 450px;
    right: -10px;
  }
}
</style>
