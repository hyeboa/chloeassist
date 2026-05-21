/**
 * nav.js — 사이드바 네비게이션 주입
 * app.js가 로드 시 자동 실행됨
 */

const Nav = (() => {
  const NAV_ITEMS = [
    { href: 'index.html',      label: '대시보드',       icon: '▦' },
    { href: 'schedule.html',   label: '업무 일정',       icon: '◷' },
    { href: 'braindump.html',  label: '브레인 덤프',     icon: '◈' },
    { href: 'projects.html',   label: '프로젝트',        icon: '◉' },
  ];

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path === '' ? 'index.html' : path;
  }

  function render() {
    const current = currentPage();

    const sidebarHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-text">ChloeAssist</div>
          <div class="sidebar-logo-sub">나만의 AI 업무 비서</div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">메뉴</div>
          ${NAV_ITEMS.map(({ href, label, icon }) => `
            <a href="${href}" class="nav-item ${current === href ? 'active' : ''}">
              <span class="nav-icon">${icon}</span>
              <span>${label}</span>
            </a>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="nav-item" id="btn-settings" style="width:100%">
            <span class="nav-icon">⚙</span>
            <span>설정</span>
          </button>
        </div>
      </aside>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    document.querySelector('#btn-settings')?.addEventListener('click', openSettings);
  }

  function openSettings() {
    const existing = document.getElementById('settings-modal');
    if (existing) { existing.remove(); return; }

    const currentKey = AI.getApiKey();
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:300;
      display:flex; align-items:center; justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:360px;box-shadow:var(--shadow-lg)">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">설정</h3>
        <label style="font-size:0.82rem;color:var(--color-text-2);display:block;margin-bottom:6px">
          Claude API 키
        </label>
        <input id="api-key-input" type="password" placeholder="sk-ant-..." value="${currentKey}"
          style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.85rem;outline:none;margin-bottom:16px">
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="settings-cancel" class="btn btn-ghost">취소</button>
          <button id="settings-save" class="btn btn-primary">저장</button>
        </div>
      </div>
    `;

    modal.querySelector('#settings-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#settings-save').addEventListener('click', () => {
      const val = modal.querySelector('#api-key-input').value.trim();
      if (val) { AI.setApiKey(val); Toast.show('API 키가 저장되었습니다.', 'success'); }
      modal.remove();
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.body.appendChild(modal);
    modal.querySelector('#api-key-input').focus();
  }

  return { render };
})();
