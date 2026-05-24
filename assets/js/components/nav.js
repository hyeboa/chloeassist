/**
 * nav.js — 사이드바 네비게이션 주입
 * app.js가 로드 시 자동 실행됨
 */

const Nav = (() => {
  const NAV_SECTIONS = [
    {
      label: '매일',
      items: [
        { href: 'index.html',    label: '오늘',       icon: '◎' },
        { href: 'schedule.html', label: '할 일 목록',  icon: '☰' },
        { href: 'braindump.html',  label: '브레인 덤프', icon: '✦' },
      { href: 'myprojects.html', label: '내 프로젝트', icon: '◉' },
      ]
    },
    {
      label: '헬로아지',
      items: [
        { href: 'roadmap.html', label: '마일스톤',  icon: '◈' },
        { href: 'goals.html',   label: '목표',      icon: '⚑' },
        { href: 'sitemap.html', label: '제품 설계', icon: '◧' },
      ]
    },
    {
      label: '돌아보기',
      items: [
        { href: 'weekly.html',   label: '리뷰',        icon: '◫' },
      ]
    },
  ];

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path === '' ? 'index.html' : path;
  }

  /* 마감 초과 + 오늘 마감인 미완료 프로젝트 할 일 수 */
  function deadlineCount() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (Store.get('projectTasks') || [])
      .filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') <= today)
      .length;
  }

  function render() {
    const current = currentPage();
    const dlCount = deadlineCount();
    const navHTML = NAV_SECTIONS.map(section => `
        <div class="sidebar-section-label">${section.label}</div>
        ${section.items.map(({ href, label, icon }) => `
            <a href="${href}" class="nav-item ${current === href ? 'active' : ''}">
                <span class="nav-icon">${icon}</span>
                <span>${label}</span>
                ${href === 'myprojects.html' && dlCount > 0
                  ? `<span class="nav-badge" title="마감 임박 ${dlCount}개">${dlCount}</span>`
                  : ''}
            </a>
        `).join('')}
    `).join('');

    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <div class="sidebar-logo-text">헬로아지</div>
                <div class="sidebar-logo-sub">작업 관리 by Chloe</div>
            </div>
            <nav class="sidebar-nav">
                ${navHTML}
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
        <div style="border-top:1px solid var(--color-border);margin:4px 0 16px;padding-top:16px">
          <div style="font-size:0.78rem;font-weight:600;color:var(--color-text-2);margin-bottom:10px">데이터 백업</div>
          <div style="display:flex;gap:8px">
            <button id="btn-export" class="btn btn-ghost" style="flex:1;font-size:0.8rem">↓ 내보내기</button>
            <button id="btn-import" class="btn btn-ghost" style="flex:1;font-size:0.8rem">↑ 불러오기</button>
            <input id="import-file" type="file" accept=".json" style="display:none">
          </div>
        </div>
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

    modal.querySelector('#btn-export').addEventListener('click', () => exportData());
    modal.querySelector('#btn-import').addEventListener('click', () => {
      modal.querySelector('#import-file').click();
    });
    modal.querySelector('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      importData(file, modal);
    });

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.body.appendChild(modal);
    modal.querySelector('#api-key-input').focus();
  }

  function exportData() {
    const PREFIX = 'chloeassist:';
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) {
        try { backup[key] = JSON.parse(localStorage.getItem(key)); }
        catch { backup[key] = localStorage.getItem(key); }
      }
    }
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `chloeassist-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('백업 파일이 다운로드되었습니다.', 'success');
  }

  function importData(file, modal) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (typeof backup !== 'object' || backup === null) throw new Error();
        Object.entries(backup).forEach(([key, val]) => {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        });
        Toast.show('데이터가 복원되었습니다. 페이지를 새로고침합니다.', 'success');
        modal.remove();
        setTimeout(() => location.reload(), 1200);
      } catch {
        Toast.show('올바른 백업 파일이 아닙니다.', 'error');
      }
    };
    reader.readAsText(file);
  }

  return { render };
})();
