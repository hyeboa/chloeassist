/**
 * issues.js — 이슈 관리
 * 이슈를 등록하고 상태(열림 → 진행중 → 해결)를 관리한다.
 */

const Issues = (() => {
  /* ─ 상태 정의 (순서 = 흐름) ─ */
  const STATUSES = ['open', 'progress', 'resolved'];
  const STATUS_META = {
    open:     { label: '열림',   cls: 'st-open',     dot: 'dot-open' },
    progress: { label: '진행중', cls: 'st-progress', dot: 'dot-progress' },
    resolved: { label: '해결',   cls: 'st-resolved', dot: 'dot-resolved' },
  };

  /* ─ 우선도 정의 (순서 = 순환) ─ */
  const PRIORITIES = ['low', 'normal', 'high', 'critical'];
  const PRIORITY_META = {
    critical: { label: '긴급',   cls: 'pr-critical', color: '#dc2626' },
    high:     { label: '높음',   cls: 'pr-high',     color: '#ea580c' },
    normal:   { label: '보통',   cls: 'pr-normal',   color: '#6b7280' },
    low:      { label: '낮음',   cls: 'pr-low',      color: '#2563eb' },
  };

  let filter = 'all'; // 'all' | 'open' | 'progress' | 'resolved'
  let showLegend = true;

  /* ─ 데이터 ─ */
  function getIssues() { return Store.get('issues') || []; }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function nextStatus(status) {
    const i = STATUSES.indexOf(status);
    return STATUSES[(i + 1) % STATUSES.length];
  }

  function nextPriority(priority) {
    const i = PRIORITIES.indexOf(priority);
    return PRIORITIES[(i + 1) % PRIORITIES.length];
  }

  function counts(issues) {
    return {
      all:      issues.length,
      open:     issues.filter(i => i.status === 'open').length,
      progress: issues.filter(i => i.status === 'progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
    };
  }

  /* ─ 빠른 추가 입력 ─ */
  function renderAddInput() {
    return `
      <div class="mp-add-row iss-add-row">
        <input id="iss-input" class="mp-add-input" type="text" placeholder="새 이슈 입력 (예: 로그인 화면 버튼 정렬 깨짐)">
        <span class="mp-add-hint">Enter</span>
      </div>`;
  }

  /* ─ 범례 섹션 ─ */
  function renderLegend() {
    return `
      <div class="iss-legend-wrapper">
        <button class="iss-legend-toggle" onclick="Issues.toggleLegend()" title="범례 열기/닫기">
          ${showLegend ? '▼' : '▶'} 범례
        </button>
        ${!showLegend ? '' : `
          <div class="iss-legend-content">
            <div class="iss-legend-section">
              <div class="iss-legend-title">상태</div>
              <div class="iss-legend-items">
                <div class="iss-legend-item">
                  <span class="iss-legend-dot" style="background: var(--color-danger)"></span>
                  <span class="iss-legend-label">열림</span>
                  <span class="iss-legend-desc">아직 시작 안 함</span>
                </div>
                <div class="iss-legend-item">
                  <span class="iss-legend-dot" style="background: var(--color-primary)"></span>
                  <span class="iss-legend-label">진행중</span>
                  <span class="iss-legend-desc">지금 작업 중</span>
                </div>
                <div class="iss-legend-item">
                  <span class="iss-legend-dot" style="background: var(--color-success)"></span>
                  <span class="iss-legend-label">해결</span>
                  <span class="iss-legend-desc">완료됨</span>
                </div>
              </div>
            </div>
            <div class="iss-legend-section">
              <div class="iss-legend-title">우선도</div>
              <div class="iss-legend-items">
                <div class="iss-legend-item">
                  <span class="iss-legend-badge" style="background: #dc2626">긴급</span>
                  <span class="iss-legend-desc">즉시 처리</span>
                </div>
                <div class="iss-legend-item">
                  <span class="iss-legend-badge" style="background: #ea580c">높음</span>
                  <span class="iss-legend-desc">우선 처리</span>
                </div>
                <div class="iss-legend-item">
                  <span class="iss-legend-badge" style="background: #6b7280">보통</span>
                  <span class="iss-legend-desc">일반</span>
                </div>
                <div class="iss-legend-item">
                  <span class="iss-legend-badge" style="background: #2563eb">낮음</span>
                  <span class="iss-legend-desc">나중에</span>
                </div>
              </div>
            </div>
          </div>
        `}
      </div>`;
  }

  /* ─ 필터 바 ─ */
  function renderFilters(c) {
    const tabs = [
      ['all', '전체', c.all],
      ['open', '열림', c.open],
      ['progress', '진행중', c.progress],
      ['resolved', '해결', c.resolved],
    ];
    return `
      <div class="iss-filters">
        ${tabs.map(([key, label, n]) => `
          <button class="iss-filter-btn${filter === key ? ' active' : ''}" onclick="Issues.setFilter('${key}')">
            ${label}<span class="iss-filter-count">${n}</span>
          </button>`).join('')}
      </div>`;
  }

  /* ─ 이슈 행 ─ */
  function renderRow(it) {
    const meta = STATUS_META[it.status] || STATUS_META.open;
    const priorMeta = PRIORITY_META[it.priority || 'normal'];
    return `
      <div class="iss-item ${meta.cls}">
        <button class="iss-status-btn ${meta.cls}" onclick="Issues.cycleStatus('${it.id}')"
          title="클릭하면 다음 상태로 변경">
          <span class="iss-status-dot ${meta.dot}"></span>${meta.label}
        </button>
        <button class="iss-priority-btn ${priorMeta.cls}" onclick="Issues.cyclePriority('${it.id}')"
          title="클릭하면 다음 우선도로 변경">${priorMeta.label}</button>
        <input class="iss-title-edit" value="${escapeHtml(it.title)}"
          onblur="Issues.editTitle('${it.id}', this.value)"
          onkeydown="if(event.key==='Enter')this.blur()">
        <button class="iss-del-btn" onclick="Issues.deleteIssue('${it.id}')" title="삭제">✕</button>
      </div>`;
  }

  /* ─ 렌더 ─ */
  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    const issues = getIssues();
    const c = counts(issues);

    const visible = (filter === 'all' ? issues : issues.filter(i => i.status === filter))
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
        const pA = PRIORITIES.indexOf(a.priority || 'normal');
        const pB = PRIORITIES.indexOf(b.priority || 'normal');
        return pB - pA || (b.createdAt || 0) - (a.createdAt || 0); // 우선도 높은순, 그 다음 최신순
      });

    app.innerHTML = `
      <div class="iss-summary">
        <div class="summary-card">
          <div class="summary-label">미해결 이슈</div>
          <div class="summary-value">${c.open + c.progress}<span>건</span></div>
          <div class="summary-sub">열림 ${c.open} · 진행중 ${c.progress}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">해결 완료</div>
          <div class="summary-value">${c.resolved}<span>건</span></div>
          <div class="summary-sub">전체 ${c.all}건 중</div>
        </div>
      </div>

      ${renderLegend()}

      ${renderAddInput()}
      ${renderFilters(c)}

      <div class="iss-list">
        ${visible.length === 0
          ? `<div class="iss-empty">
               <div class="iss-empty-icon">🐞</div>
               <div class="iss-empty-title">${filter === 'all' ? '아직 등록된 이슈가 없어요' : '해당 상태의 이슈가 없어요'}</div>
               <div class="iss-empty-sub">위 입력창에서 이슈를 추가해보세요</div>
             </div>`
          : visible.map(renderRow).join('')}
      </div>`;

    bindInput();
  }

  function bindInput() {
    const input = document.getElementById('iss-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const text = input.value.trim();
      if (!text) return;
      addIssue(text);
      input.value = '';
    });
  }

  /* ─ 동작 ─ */
  function addIssue(title) {
    Store.push('issues', { title: title.trim(), status: 'open' });
    render();
  }

  function cycleStatus(id) {
    const it = getIssues().find(i => i.id === id);
    if (!it) return;
    Store.update('issues', id, { status: nextStatus(it.status) });
    render();
  }

  function cyclePriority(id) {
    const it = getIssues().find(i => i.id === id);
    if (!it) return;
    Store.update('issues', id, { priority: nextPriority(it.priority || 'normal') });
    render();
  }

  function editTitle(id, text) {
    const t = text.trim();
    if (!t) { render(); return; }
    Store.update('issues', id, { title: t });
  }

  function deleteIssue(id) {
    if (!confirm('이 이슈를 삭제할까요?')) return;
    Store.remove('issues', id);
    render();
  }

  function setFilter(f) {
    filter = f;
    render();
  }

  function toggleLegend() {
    showLegend = !showLegend;
    render();
  }

  return { render, addIssue, cycleStatus, cyclePriority, editTitle, deleteIssue, setFilter, toggleLegend };
})();

document.addEventListener('DOMContentLoaded', () => Issues.render());
