/**
 * assistant.js — 오른쪽 고정 AI 사이드바
 */

const Assistant = (() => {
  let isOpen = false;
  let isLoading = false;
  const history = [];

  const SYSTEM_PROMPT = `당신은 사용자의 전담 AI 비서 Chloe입니다.
사용자는 반려견 플랫폼 모바일 앱 "헬로아지"를 1인으로 기획·디자인·운영하고 있습니다.
주요 업무 영역: 기획, 디자인, 개발 관리, 마케팅, 운영.
질문에 간결하고 실용적으로 한국어로 답변하세요.
업무 우선순위 조언, 기획 아이디어 발전, 디자인 방향 제안 등을 적극적으로 도와주세요.`;

  function render() {
    // 사이드바 주입
    const sidebar = document.createElement('div');
    sidebar.className = 'ai-sidebar';
    sidebar.id = 'ai-sidebar';
    sidebar.innerHTML = `
      <div class="ai-sidebar-header">
        <div class="ai-sidebar-title">Chloe AI</div>
        <button class="ai-sidebar-close" id="ai-close" title="닫기">✕</button>
      </div>
      <div class="ai-messages" id="ai-messages">
        <div class="msg msg-ai">안녕하세요! 헬로아지 작업을 도와드릴 Chloe입니다. 기획, 디자인, 업무 우선순위 등 뭐든 물어보세요 😊</div>
      </div>
      <div class="ai-input-area">
        <textarea class="ai-input" id="ai-input" rows="1" placeholder="메시지 입력..."></textarea>
        <button class="ai-send-btn" id="ai-send" title="전송">➤</button>
      </div>
    `;
    document.body.appendChild(sidebar);

    // 헤더에 토글 버튼 주입
    const headerActions = document.querySelector('.page-header-actions');
    if (headerActions) {
      const btn = document.createElement('button');
      btn.id = 'ai-toggle-btn';
      btn.className = 'ai-toggle-btn';
      btn.innerHTML = `<span class="ai-toggle-dot"></span> AI 비서`;
      btn.addEventListener('click', toggle);
      headerActions.prepend(btn);
    }

    bindEvents();
  }

  function bindEvents() {
    document.getElementById('ai-close')?.addEventListener('click', () => setOpen(false));

    const input = document.getElementById('ai-input');
    const send  = document.getElementById('ai-send');

    send?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 96) + 'px';
    });
  }

  function toggle() {
    setOpen(!isOpen);
  }

  function setOpen(state) {
    isOpen = state;

    const sidebar   = document.getElementById('ai-sidebar');
    const wrapper   = document.querySelector('.main-wrapper');
    const toggleBtn = document.getElementById('ai-toggle-btn');

    sidebar?.classList.toggle('open', isOpen);
    wrapper?.classList.toggle('ai-open', isOpen);
    toggleBtn?.classList.toggle('active', isOpen);

    if (isOpen) {
      setTimeout(() => document.getElementById('ai-input')?.focus(), 260);
    }
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('ai-input');
    const text  = input?.value.trim();
    if (!text) return;

    if (!AI.getApiKey()) {
      Toast.show('설정(⚙)에서 Claude API 키를 먼저 입력해 주세요.', 'warning');
      return;
    }

    appendMsg('user', text);
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
        () => { history.push({ role: 'assistant', content: fullText }); }
      );
    } catch (err) {
      typingEl.className = 'msg msg-ai';
      typingEl.textContent = `오류: ${err.message}`;
      Toast.show(err.message, 'error');
    } finally {
      isLoading = false;
      document.getElementById('ai-send').disabled = false;
    }
  }

  function appendMsg(role, text) {
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
    div.className = 'msg-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function scrollToBottom() {
    const msgs = document.getElementById('ai-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  return { render, toggle };
})();
