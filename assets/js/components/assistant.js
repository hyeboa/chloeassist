/**
 * assistant.js — 플로팅 AI 비서
 * 모든 페이지에 FAB 버튼 + 채팅 패널 주입
 */

const Assistant = (() => {
  let isOpen = false;
  let isLoading = false;
  const history = [];

  const SYSTEM_PROMPT = `당신은 사용자의 전담 AI 비서 Chloe입니다.
현재 앱은 업무 일정 관리, 브레인 덤프, 프로젝트 관리 기능을 갖추고 있습니다.
사용자의 질문에 간결하고 친절하게 한국어로 답변하세요.
업무 관련 조언, 일정 정리, 아이디어 발전 등을 적극적으로 도와주세요.`;

  function render() {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="ai-panel" id="ai-panel">
        <div class="ai-panel-header">
          <div class="ai-panel-title">Chloe AI</div>
          <button class="ai-panel-close" id="ai-close">✕</button>
        </div>
        <div class="ai-messages" id="ai-messages">
          <div class="msg msg-ai">안녕하세요! 저는 Chloe입니다. 일정 관리, 프로젝트, 아이디어 정리 등 무엇이든 도와드릴게요. 😊</div>
        </div>
        <div class="ai-input-area">
          <textarea class="ai-input" id="ai-input" rows="1" placeholder="메시지 입력..."></textarea>
          <button class="ai-send-btn" id="ai-send">➤</button>
        </div>
      </div>
      <button class="ai-fab" id="ai-fab" title="AI 비서 열기">✦</button>
    `;

    document.body.appendChild(el.firstElementChild);
    document.body.appendChild(el.lastElementChild);

    bindEvents();
  }

  function bindEvents() {
    const fab    = document.getElementById('ai-fab');
    const panel  = document.getElementById('ai-panel');
    const close  = document.getElementById('ai-close');
    const input  = document.getElementById('ai-input');
    const send   = document.getElementById('ai-send');

    fab.addEventListener('click', toggle);
    close.addEventListener('click', () => setOpen(false));

    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
  }

  function toggle() {
    setOpen(!isOpen);
  }

  function setOpen(state) {
    isOpen = state;
    const fab   = document.getElementById('ai-fab');
    const panel = document.getElementById('ai-panel');
    fab.classList.toggle('active', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      setTimeout(() => document.getElementById('ai-input')?.focus(), 200);
    }
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('ai-input');
    const text  = input.value.trim();
    if (!text) return;

    if (!AI.getApiKey()) {
      Toast.show('설정에서 Claude API 키를 먼저 입력해 주세요.', 'warning');
      return;
    }

    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    isLoading = true;
    document.getElementById('ai-send').disabled = true;

    const typingEl = appendTyping();

    try {
      let fullText = '';
      await AI.chatStream(
        history,
        SYSTEM_PROMPT,
        (chunk) => {
          fullText += chunk;
          typingEl.className = 'msg msg-ai';
          typingEl.textContent = fullText;
          scrollToBottom();
        },
        () => {
          history.push({ role: 'assistant', content: fullText });
        }
      );
    } catch (err) {
      typingEl.className = 'msg msg-ai';
      typingEl.textContent = `오류가 발생했습니다: ${err.message}`;
      Toast.show(err.message, 'error');
    } finally {
      isLoading = false;
      document.getElementById('ai-send').disabled = false;
    }
  }

  function appendMessage(role, text) {
    const msgs = document.getElementById('ai-messages');
    const div  = document.createElement('div');
    div.className = `msg msg-${role}`;
    div.textContent = text;
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendTyping() {
    const msgs = document.getElementById('ai-messages');
    const div  = document.createElement('div');
    div.className = 'msg msg-ai msg-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function scrollToBottom() {
    const msgs = document.getElementById('ai-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  return { render };
})();
