<script setup>
import { nextTick, ref } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import capyImage from '@/img/capy.jpg';

const isChatOpen = ref(false);
const chatMessage = ref('');
const isLoading = ref(false);
const chatMessagesRef = ref(null);
const suggestedQuestions = [
  'Gợi ý giày đá bóng',
  'Chính sách đổi trả thế nào?',
  'Kiểm tra đơn HD12345',
];

const messages = ref([
  {
    text: 'Xin chào, mình là Bee Bot. Mình có thể giúp bạn tìm sản phẩm, kiểm tra đơn hàng hoặc tư vấn chính sách đổi trả.',
    sender: 'bot',
  },
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const toggleChat = async () => {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value) {
    await scrollToBottom();
  }
};

const buildHistoryPayload = () =>
  messages.value
    .slice(-8)
    .map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

const sendMessage = async (presetText) => {
  const textToSend = (presetText ?? chatMessage.value).trim();
  if (!textToSend || isLoading.value) return;

  const history = buildHistoryPayload();
  messages.value.push({ text: textToSend, sender: 'user' });
  chatMessage.value = '';
  isLoading.value = true;
  await scrollToBottom();

  try {
    const res = await axios.post(`${API_BASE_URL}/api/chatbot/chat`, {
      message: textToSend,
      history,
    });

    const botText = typeof res.data === 'string' ? res.data : 'Mình chưa nhận được phản hồi hợp lệ.';
    messages.value.push({ text: botText, sender: 'bot' });
  } catch (error) {
    console.error('Lỗi Chatbot:', error);
    messages.value.push({
      text: 'Bee Bot đang gặp sự cố kết nối. Bạn thử lại sau ít phút hoặc để lại câu hỏi ngắn hơn nhé.',
      sender: 'bot',
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
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
    <button @click="toggleChat" class="chatbot-toggle shadow-lg" aria-label="Mở chatbot">
      <img :src="capyImage" alt="ChatBot" class="bot-icon">
      <span class="pulse-ring"></span>
    </button>

    <div v-if="isChatOpen" class="chat-window shadow-lg border-0 rounded-4 overflow-hidden animate-slide-up">
      <div class="chat-header d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <div class="position-relative">
            <img :src="capyImage" width="35" height="35" class="rounded-circle border border-2 border-warning" alt="Bee Bot">
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
        <button @click="toggleChat" class="btn btn-sm btn-link text-white p-0 close-btn" aria-label="Thu gọn chatbot">
          <i class="fas fa-minus fs-6"></i>
        </button>
      </div>

      <div ref="chatMessagesRef" class="chat-messages p-3">
        <div v-if="messages.length === 1" class="quick-prompts mb-3">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            class="quick-prompt-btn"
            @click="sendMessage(question)"
          >
            {{ question }}
          </button>
        </div>

        <div v-for="(msg, index) in messages" :key="index" :class="['message-container mb-4', msg.sender]">
          <div v-if="msg.sender === 'bot'" class="bot-avatar shadow-sm">
            <img :src="capyImage" alt="Bot">
          </div>

          <div class="message-bubble shadow-sm">
            <div v-for="(part, i) in parseMessage(msg.text)" :key="i">
              <span v-if="part.type === 'text'" class="text-content">{{ part.content }}</span>
              <router-link
                v-else-if="part.type === 'product'"
                :to="'/product/' + part.id"
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

        <div v-if="isLoading" class="message-container bot mb-3">
          <div class="bot-avatar shadow-sm">
            <img :src="capyImage" width="24" height="24" class="rounded-circle" alt="Bot typing">
          </div>
          <div class="typing-bubble shadow-sm">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input p-3 bg-white border-top">
        <div class="input-group bg-light rounded-pill px-2 py-1">
          <input
            v-model="chatMessage"
            type="text"
            class="form-control border-0 shadow-none bg-transparent"
            placeholder="Bạn cần hỗ trợ gì?"
            :disabled="isLoading"
            @keyup.enter="sendMessage()"
          >
          <button
            @click="sendMessage()"
            class="btn btn-warning rounded-circle d-flex align-items-center justify-content-center ms-1"
            style="width: 32px; height: 32px;"
            :disabled="isLoading"
          >
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
  right: 25px;
  bottom: 25px;
  z-index: 1050;
}

.chatbot-toggle {
  position: relative;
  width: 65px;
  height: 65px;
  padding: 0;
  overflow: visible;
  cursor: pointer;
  background: #ffc107;
  border: 4px solid #fff;
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chatbot-toggle:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 10px 20px rgba(255, 193, 7, 0.3);
}

.bot-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.chat-window {
  position: absolute;
  right: 0;
  bottom: 85px;
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 520px;
  background: #f8f9fa;
}

.chat-header {
  padding: 1rem;
  color: #fff;
  background: linear-gradient(135deg, #22313f 0%, #101820 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.online-status {
  position: absolute;
  right: -2px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  background: #2ecc71;
  border: 2px solid #22313f;
  border-radius: 50%;
}

.online-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #2ecc71;
  border-radius: 50%;
}

.chat-messages {
  flex-grow: 1;
  padding-bottom: 20px;
  overflow-y: auto;
  background: linear-gradient(180deg, #f9fafb 0%, #eef2f7 100%);
  scrollbar-width: thin;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-prompt-btn {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #22313f;
  background: #fff7db;
  border: 1px solid #ffe08a;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.quick-prompt-btn:hover {
  background: #ffe8a3;
  transform: translateY(-1px);
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
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  overflow: hidden;
  background: #fff;
  border-radius: 50%;
}

.bot-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-bubble {
  position: relative;
  max-width: 82%;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 18px;
}

.bot .message-bubble {
  color: #24323f;
  background: #fff;
  border-bottom-left-radius: 4px;
}

.user .message-bubble {
  font-weight: 500;
  color: #1a1a1a;
  background: #ffc107;
  border-bottom-right-radius: 4px;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.product-card {
  overflow: hidden;
  background: #fdfdfd;
  border: 1px solid #eee;
  border-radius: 12px;
  transition: all 0.25s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  border-color: #ffc107;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-inner {
  background: #fff;
}

.product-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 10px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
}

.chat-input {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.typing-bubble {
  width: fit-content;
  padding: 12px 16px;
  background: #fff;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #ffc107;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
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

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 10px;
}

@media (max-width: 576px) {
  .chatbot-container {
    right: 16px;
    bottom: 16px;
  }

  .chat-window {
    right: -8px;
    width: min(92vw, 340px);
    height: 70vh;
  }
}
</style>
