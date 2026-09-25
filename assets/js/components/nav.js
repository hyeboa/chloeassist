/**
 * nav.js — 사이드바 네비게이션 주입
 * app.js가 로드 시 자동 실행됨
 */

const Nav = (() => {
  const APP_VERSION = '20260824t';

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
    checklist: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 5.5l1.2 1.2L7.6 4.3M4 11.5l1.2 1.2L7.6 10.3M4 17.5l1.2 1.2L7.6 16.3"/>',
    issue: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
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
      ]
    },
    {
      label: '프로젝트',
      items: [
        { href: 'myprojects.html', label: '내 프로젝트',   icon: 'folder' },
        { href: 'goals.html',     label: '목표',         icon: 'target' },
        { href: 'roadmap.html',   label: '마일스톤',     icon: 'map' },
      ]
    },
    {
      label: '헬로아지',
      items: [
        { href: 'sitemap.html',   label: '제품 설계',    icon: 'layout' },
        { href: 'checklist.html', label: '출시 점검',    icon: 'checklist' },
        { href: 'issues.html',    label: '이슈 관리',     icon: 'issue' },
      ]
    },
    {
      label: '돌아보기',
      items: [
        { href: 'weekly.html',   label: '주간 리뷰',   icon: 'review' },
        { href: 'monthly.html',  label: '월간 리뷰',   icon: 'review' },
      ]
    },
  ];

  const PAGE_META = {
    'index.html':      { title: '오늘',          desc: '오늘 끝낼 일과 임박한 작업' },
    'schedule.html':   { title: '할 일 목록',   desc: '날짜와 분야별 전체 작업' },
    'braindump.html':  { title: '브레인 덤프',  desc: '생각은 빠르게 기록하고 나중에 정리' },
    'routine.html':    { title: '하루 루틴',    desc: '반복할 행동을 가볍게 체크' },
    'myprojects.html': { title: '내 프로젝트',  desc: '프로젝트별 다음 행동과 마감' },
    'goals.html':      { title: '목표',          desc: '큰 방향과 단계별 결과' },
    'roadmap.html':    { title: '마일스톤',      desc: '날짜 기준으로 진행 상황 확인' },
    'sitemap.html':    { title: '제품 설계',     desc: '기능과 화면 구조를 한곳에서 관리' },
    'checklist.html':  { title: '출시 점검',     desc: '배포 전 빠뜨릴 항목 확인' },
    'issues.html':     { title: '이슈 관리',     desc: '문제의 우선도와 처리 상태' },
    'weekly.html':     { title: '주간 리뷰',     desc: '이번 주 결과와 다음 주 한 가지' },
    'monthly.html':    { title: '월간 리뷰',     desc: '한 달의 변화와 다음 달 방향' },
    'help.html':       { title: '도움말',        desc: '가장 단순한 개인 운영 흐름' },
  };

  const BACKUP_SCHEMA = {
    tasks: 'array',
    notes: 'array',
    goals: 'array',
    milestones: 'array',
    projectTasks: 'array',
    features: 'array',
    issues: 'array',
    routines: 'array',
    routineLogs: 'object',
    launchChecklists: 'array',
    sitemapSections: 'array',
    sitemapScreens: 'array',
    sitemapComponents: 'array',
    weeklyReviews: 'object',
    monthlyReviews: 'object',
    uiSettings: 'object',
  };

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path === '' ? 'index.html' : path;
  }

  function pageHref(href) {
    return `${href}?v=${APP_VERSION}`;
  }

  function applyPageMeta(current) {
    const meta = PAGE_META[current];
    const title = document.querySelector('.page-header > .page-title');
    if (!meta || !title) return;

    title.textContent = meta.title;
    document.title = `${meta.title} — Chloe Assist`;

    const heading = document.createElement('div');
    heading.className = 'page-heading';
    title.before(heading);
    heading.appendChild(title);
    heading.insertAdjacentHTML('beforeend', `<span class="page-context">${meta.desc}</span>`);
  }

  function todayTaskCount() {
    const today = LocalDate.today();
    return (Store.get('tasks') || [])
      .filter(task => !task.done && (task.isToday || task.dueDate === today))
      .length;
  }

  /* 마감 초과 + 오늘 마감인 미완료 프로젝트 할 일 수 */
  function deadlineCount() {
    const today = LocalDate.today();
    return (Store.get('projectTasks') || [])
      .filter(t => !t.done && t.dueDate && t.dueDate <= today)
      .length;
  }

  function openIssueCount() {
    return (Store.get('issues') || []).filter(issue => issue.status !== 'resolved').length;
  }

  function badgeFor(href) {
    if (href === 'index.html') {
      const count = todayTaskCount();
      return count > 0 ? { count, cls: 'info', title: `오늘 할 일 ${count}개` } : null;
    }
    if (href === 'myprojects.html') {
      const count = deadlineCount();
      return count > 0 ? { count, cls: 'danger', title: `오늘까지 마감 ${count}개` } : null;
    }
    if (href === 'issues.html') {
      const count = openIssueCount();
      return count > 0 ? { count, cls: 'warn', title: `열린 이슈 ${count}개` } : null;
    }
    return null;
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    return target.matches('input, textarea, select, [contenteditable="true"]');
  }

  function focusQuickInput() {
    const selectors = [
      '#quick-input', '#bl-input', '#dump-input', '#routine-input',
      '#mp-new-project', '#goal-add-input', '#ms-input', '#feat-input',
      '#iss-input', '#cl-ai-input', '.bl-search-input', '.mp-add-input',
      'main textarea',
    ];
    const candidates = document.querySelectorAll(selectors.join(','));
    const input = Array.from(candidates).find((element) => {
      if (element.disabled || element.readOnly) return false;
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
    });
    if (!input) return false;
    input.focus();
    if (typeof input.select === 'function') input.select();
    return true;
  }

  function render() {
    const current = currentPage();
    applyPageMeta(current);
    const navHTML = NAV_SECTIONS.map(section => `
        <div class="sidebar-section">
          <div class="sidebar-section-label">${section.label}</div>
          ${section.items.map(({ href, label, icon }) => {
            const badge = badgeFor(href);
            return `
            <a href="${pageHref(href)}" class="nav-item ${current === href ? 'active' : ''}"
              ${current === href ? 'aria-current="page"' : ''}>
                <span class="nav-icon">${svgIcon(icon)}</span>
                <span class="nav-label">${label}</span>
                ${badge
                  ? `<span class="nav-badge ${badge.cls}" title="${badge.title}">${badge.count}</span>`
                  : ''}
            </a>
          `;}).join('')}
        </div>
    `).join('');

    const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <button class="sidebar-mobile-close" id="sidebar-mobile-close" type="button" aria-label="메뉴 닫기">✕</button>
            <div class="sidebar-logo">
                <div class="sidebar-logo-mark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3z"/>
                    </svg>
                </div>
                <div class="sidebar-logo-text-wrap">
                    <div class="sidebar-logo-text">Chloe Assist</div>
                    <div class="sidebar-logo-sub">나만의 프로젝트 운영실</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${navHTML}
            </nav>
            <div class="sidebar-footer">
                <div class="sidebar-storage" title="/ 키로 현재 화면의 빠른 입력으로 이동">
                    <span class="sidebar-storage-dot"></span>
                    <span>이 브라우저에 자동 저장</span>
                    <kbd>/</kbd>
                </div>
                <a href="${pageHref('help.html')}" class="nav-item ${current === 'help.html' ? 'active' : ''}"
                  ${current === 'help.html' ? 'aria-current="page"' : ''}>
                    <span class="nav-icon">${svgIcon('brain')}</span>
                    <span class="nav-label">도움말</span>
                </a>
                <button class="nav-item" id="btn-settings" type="button">
                    <span class="nav-icon">${svgIcon('settings')}</span>
                    <span class="nav-label">설정</span>
                </button>
            </div>
        </aside>
        <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    const header = document.querySelector('.page-header');
    header?.insertAdjacentHTML('afterbegin', `
      <button class="mobile-nav-toggle" id="mobile-nav-toggle" type="button"
        aria-label="메뉴 열기" aria-controls="sidebar" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>
    `);

    const setMobileOpen = (open) => {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      const toggle = document.getElementById('mobile-nav-toggle');
      sidebar?.classList.toggle('mobile-open', open);
      backdrop?.classList.toggle('open', open);
      document.body.classList.toggle('mobile-nav-open', open);
      toggle?.setAttribute('aria-expanded', String(open));
    };

    document.querySelector('#mobile-nav-toggle')?.addEventListener('click', () => setMobileOpen(true));
    document.querySelector('#sidebar-mobile-close')?.addEventListener('click', () => setMobileOpen(false));
    document.querySelector('#sidebar-backdrop')?.addEventListener('click', () => setMobileOpen(false));
    document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
      item.addEventListener('click', () => setMobileOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (
        event.key === '/' && !event.repeat &&
        !event.metaKey && !event.ctrlKey && !event.altKey &&
        !isEditableTarget(event.target) &&
        !document.getElementById('settings-modal')
      ) {
        if (focusQuickInput()) event.preventDefault();
      }
    });

    document.querySelector('#btn-settings')?.addEventListener('click', openSettings);
  }

  function openSettings() {
    const existing = document.getElementById('settings-modal');
    if (existing) { closeSettings(existing); return; }
    const trigger = document.activeElement;
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'settings-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'settings-title');
    modal._trigger = trigger;
    modal.innerHTML = `
      <div class="settings-dialog">
        <div class="settings-header">
          <div>
            <h2 class="settings-title" id="settings-title">설정</h2>
            <p class="settings-intro">개인 데이터와 로컬 AI 모드를 관리합니다.</p>
          </div>
          <button class="settings-close" id="settings-close" type="button" aria-label="설정 닫기">✕</button>
        </div>

        <section class="settings-section">
          <div class="settings-section-title">데이터 백업</div>
          <p class="settings-section-copy">
            입력한 내용은 현재 브라우저에 자동 저장됩니다. 주 1회 JSON 백업을 받아두면 안전합니다.
          </p>
          <div class="settings-actions">
            <button id="btn-export" class="btn btn-primary" type="button">↓ 백업 내보내기</button>
            <button id="btn-import" class="btn btn-ghost" type="button">↑ 백업 불러오기</button>
            <input id="import-file" type="file" accept="application/json,.json" hidden>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-section-title">로컬 AI 모드</div>
          <p class="settings-section-copy">
            외부 API 연결 없이 자연어 입력, 요약, 보조 응답을 로컬 데이터와 규칙 기반 처리로 동작시킵니다.
          </p>
          <div class="settings-note">
            별도 키 입력 없이 바로 사용할 수 있습니다.
          </div>
          <div class="settings-footer">
            <span class="settings-footer-spacer"></span>
            <button id="settings-cancel" class="btn btn-primary" type="button">닫기</button>
          </div>
        </section>
      </div>
    `;

    const close = () => closeSettings(modal);
    modal.querySelector('#settings-close').addEventListener('click', close);
    modal.querySelector('#settings-cancel').addEventListener('click', close);

    modal.querySelector('#btn-export').addEventListener('click', async () => { await exportData(); });
    modal.querySelector('#btn-import').addEventListener('click', () => {
      modal.querySelector('#import-file').click();
    });
    modal.querySelector('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      importData(file, modal);
    });

    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });

    document.body.appendChild(modal);
    document.body.classList.add('settings-open');
    modal.querySelector('#btn-export').focus();
  }

  function closeSettings(modal) {
    if (!modal) return;
    const trigger = modal._trigger;
    modal.remove();
    document.body.classList.remove('settings-open');
    if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
  }

  async function exportData() {
    const backup = {
      meta: {
        app: 'chloeassist',
        version: 2,
        exportedAt: new Date().toISOString(),
      },
      tasks: Store.get('tasks') || [],
      notes: Store.get('notes') || [],
      goals: Store.get('goals') || [],
      milestones: Store.get('milestones') || [],
      projectTasks: Store.get('projectTasks') || [],
      features: Store.get('features') || [],
      issues: Store.get('issues') || [],
      routines: Store.get('routines') || [],
      routineLogs: Store.get('routineLogs') || {},
      launchChecklists: Store.get('launchChecklists') || [],
      sitemapSections: Store.get('sitemapSections') || [],
      sitemapScreens: Store.get('sitemapScreens') || [],
      sitemapComponents: Store.get('sitemapComponents') || [],
      weeklyReviews: Store.get('weeklyReviews') || {},
      monthlyReviews: Store.get('monthlyReviews') || {},
      uiSettings: Store.get('uiSettings') || {},
    };
    const date = LocalDate.today();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.id       = 'backup-download-link';
    a.href     = url;
    a.download = `chloeassist-backup-${date}.json`;
    a.hidden   = true;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 60000);
    Toast.show('로컬 데이터를 백업했습니다.', 'success');
  }

  function getValidatedBackupKeys(backup) {
    if (typeof backup !== 'object' || backup === null || Array.isArray(backup)) {
      throw new Error('invalid-backup');
    }

    const included = Object.keys(BACKUP_SCHEMA)
      .filter(name => Object.prototype.hasOwnProperty.call(backup, name));
    if (included.length === 0) throw new Error('invalid-backup');

    included.forEach((name) => {
      const expected = BACKUP_SCHEMA[name];
      const value = backup[name];
      const valid = expected === 'array'
        ? Array.isArray(value)
        : typeof value === 'object' && value !== null && !Array.isArray(value);
      if (!valid) throw new Error('invalid-backup');
    });

    return included;
  }

  function applyBackup(backup, included) {
    const previous = new Map(included.map(name => [name, Store.get(name)]));
    try {
      included.forEach((name) => {
        if (!Store.set(name, backup[name])) throw new Error('storage-failed');
      });
    } catch (error) {
      previous.forEach((value, name) => {
        if (value === null) Store.clear(name);
        else Store.set(name, value);
      });
      throw error;
    }
  }

  async function importData(file, modal) {
    const reader = new FileReader();
    const fileInput = modal.querySelector('#import-file');
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const included = getValidatedBackupKeys(backup);

        const confirmed = confirm(
          `백업에 포함된 ${included.length}개 데이터 영역을 현재 값으로 덮어씁니다.\n` +
          '포함되지 않은 영역은 그대로 유지됩니다. 계속할까요?'
        );
        if (!confirmed) {
          fileInput.value = '';
          return;
        }

        applyBackup(backup, included);
        await Store.flush?.();

        Toast.show('로컬 데이터가 복원되었습니다. 페이지를 새로고침합니다.', 'success');
        closeSettings(modal);
        setTimeout(() => location.reload(), 1200);
      } catch (error) {
        const message = error.message === 'storage-failed'
          ? '백업을 적용하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'
          : '백업 파일 구조를 확인해 주세요.';
        Toast.show(message, 'error');
        fileInput.value = '';
      }
    };
    reader.onerror = () => {
      Toast.show('백업 파일을 읽지 못했습니다.', 'error');
      fileInput.value = '';
    };
    reader.readAsText(file);
  }

  return { render };
})();
