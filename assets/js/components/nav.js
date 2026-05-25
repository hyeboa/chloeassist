/**
 * nav.js — 사이드바 네비게이션 주입
 * app.js가 로드 시 자동 실행됨
 */

const Nav = (() => {
  /* 일관된 라인 아이콘 세트 (stroke=currentColor, 24 viewBox) */
  const ICONS = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    brain: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.3 1 2.1v.3h6v-.3c0-.8.4-1.6 1-2.1A6.5 6.5 0 0 0 12 2.5z"/>',
    routine: '<path d="M17 2.5l3 3-3 3"/><path d="M20.5 5.5H8a4 4 0 0 0-4 4"/><path d="M7 21.5l-3-3 3-3"/><path d="M3.5 18.5H16a4 4 0 0 0 4-4"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M9 14l2 2 4-4"/>',
    map: '<path d="M9 4 3.5 6v13.5L9 17.5l6 2 5.5-2V4l-5.5 2-6-2z"/><path d="M9 4v13.5M15 6v13.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    layout: '<rect x="3" y="3.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M9.5 20.5V9.5"/>',
    review: '<path d="M3.5 3.5v17h17"/><path d="M7.5 16v-4M12 16V8.5M16.5 16v-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2v.1a2 2 0 1 1-4 0v-.06A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1.1H3a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.1-1.6V3a2 2 0 1 1 4 0v.06a1.7 1.7 0 0 0 2.87 1.14l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.1a1.7 1.7 0 0 0 1.5 1.4H21a2 2 0 1 1 0 4h-.06a1.7 1.7 0 0 0-1.54.9z"/>',
  };

  function svgIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  const NAV_SECTIONS = [
    {
      label: '매일',
      items: [
        { href: 'index.html',      label: '오늘',       icon: 'today' },
        { href: 'schedule.html',   label: '할 일 목록',  icon: 'list' },
        { href: 'braindump.html',  label: '브레인 덤프', icon: 'brain' },
        { href: 'routine.html',    label: '하루 루틴',   icon: 'routine' },
        { href: 'myprojects.html', label: '내 프로젝트', icon: 'folder' },
      ]
    },
    {
      label: '헬로아지',
      items: [
        { href: 'roadmap.html', label: '마일스톤',  icon: 'map' },
        { href: 'goals.html',   label: '목표',      icon: 'target' },
        { href: 'sitemap.html', label: '제품 설계', icon: 'layout' },
      ]
    },
    {
      label: '돌아보기',
      items: [
        { href: 'weekly.html',   label: '리뷰',        icon: 'review' },
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
        <div class="sidebar-section">
          <div class="sidebar-section-label">${section.label}</div>
          ${section.items.map(({ href, label, icon }) => `
            <a href="${href}" class="nav-item ${current === href ? 'active' : ''}">
                <span class="nav-icon">${svgIcon(icon)}</span>
                <span class="nav-label">${label}</span>
                ${href === 'myprojects.html' && dlCount > 0
                  ? `<span class="nav-badge" title="마감 임박 ${dlCount}개">${dlCount}</span>`
                  : ''}
            </a>
          `).join('')}
        </div>
    `).join('');

    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <div class="sidebar-logo-mark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3z"/>
                    </svg>
                </div>
                <div class="sidebar-logo-text-wrap">
                    <div class="sidebar-logo-text">헬로아지</div>
                    <div class="sidebar-logo-sub">작업 관리 by Chloe</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${navHTML}
            </nav>
            <div class="sidebar-footer">
                <button class="nav-item" id="btn-settings" style="width:100%">
                    <span class="nav-icon">${svgIcon('settings')}</span>
                    <span class="nav-label">설정</span>
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
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:400px;box-shadow:var(--shadow-lg);max-height:80vh;overflow-y:auto">
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
        <div style="border-top:1px solid var(--color-border);margin:16px 0;padding-top:16px">
          <button id="guide-toggle" style="background:none;border:none;cursor:pointer;padding:0;width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font-size:0.78rem;font-weight:600;color:var(--color-text-2)">기능 가이드</span>
            <span style="font-size:0.8rem;color:var(--color-text-3)">▼</span>
          </button>
          <div id="guide-content" style="display:none;font-size:0.75rem;color:var(--color-text-2);line-height:1.6">
            <div style="margin-bottom:10px">
              <div style="font-weight:600;color:var(--color-text);margin-bottom:3px">◆ AI 자연어 입력</div>
              <div style="color:var(--color-text-3)">마일스톤·목표 입력창에 "베타 출시 6월 30일"처럼 자연어로 입력하면 AI가 자동으로 제목과 날짜를 파싱합니다.</div>
            </div>
            <div style="margin-bottom:10px">
              <div style="font-weight:600;color:var(--color-text);margin-bottom:3px">◆ 마감 임박 배너</div>
              <div style="color:var(--color-text-3)">미완료 항목의 마감이 7일 이내면 상단에 색상별 경고 배너가 표시됩니다. ✕로 오늘 하루 숨길 수 있습니다.</div>
            </div>
            <div style="margin-bottom:10px">
              <div style="font-weight:600;color:var(--color-text);margin-bottom:3px">◆ 마일스톤 연결</div>
              <div style="color:var(--color-text-3)">마일스톤을 목표에 연결하면 목표의 세부 항목으로 함께 추적됩니다.</div>
            </div>
            <div style="margin-bottom:10px">
              <div style="font-weight:600;color:var(--color-text);margin-bottom:3px">◆ D-day 계산</div>
              <div style="color:var(--color-text-3)">날짜가 있는 모든 항목에서 D-day가 자동으로 계산되어 시각적 우선순위를 표시합니다.</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button id="settings-cancel" class="btn btn-ghost">취소</button>
          <button id="settings-save" class="btn btn-primary">저장</button>
        </div>
      </div>
    `;

    modal.querySelector('#guide-toggle').addEventListener('click', () => {
      const content = modal.querySelector('#guide-content');
      const toggle = modal.querySelector('#guide-toggle span:last-child');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
      } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
      }
    });

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
