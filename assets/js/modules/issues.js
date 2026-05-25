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

  let filter = 'all'; // 'all' | 'open' | 'progress' | 'resolved'

  /* ─ 데이터 ─ */
  function getIssues() { return Store.get('issues') || []; }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function nextStatus(status) {
    const i = STATUSES.indexOf(status);
    return STATUSES[(i + 1) % STATUSES.length];
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
    return `
      <div class="iss-item ${meta.cls}">
        <button class="iss-status-btn ${meta.cls}" onclick="Issues.cycleStatus('${it.id}')"
          title="클릭하면 다음 상태로 변경">
          <span class="iss-status-dot ${meta.dot}"></span>${meta.label}
        </button>
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
      .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.createdAt || 0) - (a.createdAt || 0));

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

  return { render, addIssue, cycleStatus, editTitle, deleteIssue, setFilter };
})();

document.addEventListener('DOMContentLoaded', () => Issues.render());
