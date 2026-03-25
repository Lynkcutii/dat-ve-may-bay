<script setup>
import { ref, nextTick } from 'vue';
import axios from 'axios'; // Đảm bảo đã cài axios: npm install axios
import capyImage from '@/img/capy.jpg';

const isChatOpen = ref(false);
const chatMessage = ref('');
const isLoading = ref(false); // Thêm trạng thái loading
const messages = ref([
  { text: 'Xin chào! Tôi là Bee Bot, tôi có thể giúp gì cho bạn?', sender: 'bot' }
]);

const toggleChat = () => { isChatOpen.value = !isChatOpen.value; };

const sendMessage = async () => {
  if (chatMessage.value.trim() === '') return;
  
  const userText = chatMessage.value;
  messages.value.push({ text: userText, sender: 'user' });
  chatMessage.value = '';
  isLoading.value = true;

  try {
    // Gọi đến Backend Spring Boot
    const res = await axios.post('http://localhost:8080/api/chatbot/chat', {
      message: userText
    });

    messages.value.push({ text: res.data, sender: 'bot' });
  } catch (error) {
    console.error("Lỗi Chatbot:", error);
    messages.value.push({ 
      text: 'Bee Bot đang bận một chút, bạn thử lại sau nhé!', 
      sender: 'bot' 
    });
  } finally {
    isLoading.value = false;
    // Cuộn xuống cuối tin nhắn
    await nextTick();
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }
};

const parseMessage = (text) => {
  const parts = [];
  const regex = /\[PRODUCT:(\d+):([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'product', id: match[1], name: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
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
            <div class="fw-bold lh-1 mb-1" style="font-size: 14px;">Bee Bot AI</div>
            <div class="d-flex align-items-center">
              <span class="online-dot me-1"></span>
              <div class="small opacity-75" style="font-size: 10px;">Đang trực tuyến</div>
            </div>
          </div>
        </div>
        <button @click="toggleChat" class="btn btn-sm btn-link text-white p-0 close-btn">
          <i class="fas fa-minus fs-6"></i>
        </button>
      </div>

      <div class="chat-messages p-3">
        <div v-for="(msg, index) in messages" :key="index" :class="['message-container mb-4', msg.sender]">
          <div v-if="msg.sender === 'bot'" class="bot-avatar shadow-sm">
            <img :src="capyImage" alt="Bot">
          </div>
          <div class="message-bubble shadow-sm">
            <div v-for="(part, i) in parseMessage(msg.text)" :key="i">
              <span v-if="part.type === 'text'" class="text-content">{{ part.content }}</span>
              <router-link 
                v-else-if="part.type === 'product'" 
                :to="'/product-detail/' + part.id" 
                class="product-card d-block mt-2 text-decoration-none"
              >
                <div class="card-inner p-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="product-icon me-2">
                      <i class="fas fa-shopping-bag text-warning"></i>
                    </div>
                    <div class="fw-bold text-dark text-truncate small">{{ part.name }}</div>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-primary fw-bold" style="font-size: 11px;">Xem chi tiết</span>
                    <i class="fas fa-chevron-right text-muted" style="font-size: 8px;"></i>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div v-if="isLoading" class="message-wrapper bot mb-3">
          <div class="bot-avatar me-2">
            <img :src="capyImage" width="24" height="24" class="rounded-circle">
          </div>
          <div class="bubble-content p-2 px-3 rounded-4 shadow-sm typing-bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
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
  background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
  color: white;
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.online-dot {
  width: 6px;
  height: 6px;
  background-color: #2ecc71;
  border-radius: 50%;
  display: inline-block;
}

.message-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-container.user {
  flex-direction: row-reverse;
}

.bot-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: white;
  flex-shrink: 0;
}

.bot-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
}

.bot .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
}

.user .message-bubble {
  background: #ffc107;
  color: #1a1a1a;
  border-bottom-right-radius: 4px;
  font-weight: 500;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.product-card {
  background: #fdfdfd;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.product-card:hover {
  border-color: #ffc107;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-inner {
  background: white;
}

.product-icon {
  width: 24px;
  height: 24px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 20px;
  background-color: #f0f2f5;
  scrollbar-width: thin;
}

.chat-input {
  background: white;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.typing-bubble {
  padding: 12px 16px;
  background: white;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #ffc107;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
  display: inline-block;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Product Card Styling */
.product-card-link {
  transition: all 0.2s ease;
  min-width: 180px;
}

.product-card-link:hover {
  background: #fff !important;
  border-color: #ffc107 !important;
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.product-icon-bg {
  width: 32px;
  height: 32px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-name-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
}

.smaller {
  font-size: 11px;
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
