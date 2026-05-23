/**
 * myprojects.js — 내 프로젝트 할 일 관리
 * projectTasks store: { id, project, title, done, doneAt, dueDate?, priority?, memo?, createdAt }
 */

const MyProjects = (() => {
  const TAG_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  ];
  const PRIORITIES = [
    { val: 'high',   label: '높음' },
    { val: 'normal', label: '보통' },
    { val: 'low',    label: '낮음' },
  ];
  const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

  let activeProject  = '전체';
  let showDoneMap    = {}; // { [project]: boolean }
  let expandedTaskId = null;

  function getTasks() { return Store.get('projectTasks') || []; }

  function projectColor(name) {
    if (!name) return TAG_COLORS[0];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return TAG_COLORS[hash % TAG_COLORS.length];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─ 마감일 배지 ─ */
  function dueBadge(t) {
    if (!t.dueDate) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due   = new Date(t.dueDate + 'T00:00:00');
    const diff  = Math.round((due - today) / 86400000);

    let cls = 'mp-due', label;
    if (!t.done && diff < 0)      { cls += ' overdue'; label = `${-diff}일 지남`; }
    else if (diff === 0)          { cls += ' today';   label = '오늘'; }
    else if (diff === 1)          { label = '내일'; }
    else                          { label = `${due.getMonth() + 1}/${due.getDate()}`; }
    return `<span class="${cls}">${label}</span>`;
  }

  /* ─ 동작 ─ */
  function toggleDone(id) {
    const t = getTasks().find(x => x.id === id);
    if (!t) return;
    Store.update('projectTasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    renderList();
  }

  function deleteTask(id) {
    Store.remove('projectTasks', id);
    if (expandedTaskId === id) expandedTaskId = null;
    renderList();
  }

  function addTask(project, title) {
    if (!title.trim()) return;
    Store.push('projectTasks', { project, title: title.trim(), done: false, priority: 'normal' });
    renderList();
  }

  function toggleExpand(id) {
    expandedTaskId = expandedTaskId === id ? null : id;
    renderList();
  }

  function setPriority(id, priority) {
    Store.update('projectTasks', id, { priority });
    renderList();
  }

  function setDueDate(id, dateStr) {
    Store.update('projectTasks', id, { dueDate: dateStr || null });
    renderList();
  }

  function clearDueDate(id) {
    Store.update('projectTasks', id, { dueDate: null });
    renderList();
  }

  function saveMemo(id, text) {
    Store.update('projectTasks', id, { memo: text.trim() || null });
    renderList();
  }

  function toggleShowDone(project) {
    showDoneMap[project] = !showDoneMap[project];
    renderList();
  }

  function setFilter(proj) {
    activeProject = proj;
    render();
  }

  /* ─ 정렬 ─ */
  function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done - b.done;       // 미완료 우선
      if (a.done) return b.doneAt - a.doneAt;              // 완료: 최근순
      const pa = PRIORITY_ORDER[a.priority || 'normal'];
      const pb = PRIORITY_ORDER[b.priority || 'normal'];
      if (pa !== pb) return pa - pb;                       // 우선순위
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  }

  /* ─ 프로젝트 섹션 ─ */
  function renderSection(project, tasks) {
    const color    = projectColor(project);
    const todo     = tasks.filter(t => !t.done);
    const done     = tasks.filter(t => t.done);
    const showDone = showDoneMap[project];

    return `
      <div class="mp-section">
        <div class="mp-section-header">
          <span class="mp-project-badge"
            style="background:${color.bg};color:${color.text};border-color:${color.border}">
            ${escapeHtml(project)}
          </span>
          <span class="mp-section-count">${todo.length}개 남음${done.length ? ` · 완료 ${done.length}` : ''}</span>
        </div>

        <div class="mp-task-list">
          ${todo.map(t => renderTask(t)).join('')}

          ${done.length ? `
            <button class="mp-show-done-btn" onclick="MyProjects.toggleShowDone('${escapeHtml(project)}')">
              ${showDone ? '▲ 완료 숨기기' : `▼ 완료된 항목 ${done.length}개 보기`}
            </button>
            ${showDone ? done.map(t => renderTask(t)).join('') : ''}
          ` : ''}
        </div>

        <div class="mp-add-row">
          <input class="mp-add-input" type="text"
            placeholder="+ 할 일 추가 (Enter)"
            data-project="${escapeHtml(project)}"
            onkeydown="MyProjects.handleAdd(event)">
        </div>
      </div>
    `;
  }

  /* ─ 할 일 아이템 ─ */
  function renderTask(t) {
    const isOpen   = expandedTaskId === t.id;
    const priority = t.priority || 'normal';
    const hasMemo  = !!t.memo;

    return `
      <div class="mp-task-item${t.done ? ' done' : ''}${isOpen ? ' expanded' : ''}">
        <div class="mp-task-main">
          <button class="mp-check${t.done ? ' checked' : ''}"
            onclick="MyProjects.toggleDone('${t.id}')" title="${t.done ? '완료 해제' : '완료'}">
            ${t.done ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
          </button>
          ${priority !== 'normal' ? `<span class="mp-prio-dot ${priority}" title="우선순위 ${priority === 'high' ? '높음' : '낮음'}"></span>` : ''}
          <span class="mp-task-title" onclick="MyProjects.toggleExpand('${t.id}')">${escapeHtml(t.title)}</span>
          ${dueBadge(t)}
          ${hasMemo ? `<span class="mp-memo-icon" title="메모 있음">✎</span>` : ''}
          <button class="mp-delete" onclick="MyProjects.deleteTask('${t.id}')" title="삭제">✕</button>
        </div>

        ${isOpen ? `
          <div class="mp-task-editor">
            <div class="mp-edit-group">
              <span class="mp-edit-label">우선순위</span>
              ${PRIORITIES.map(p => `
                <button class="mp-prio-chip ${p.val}${priority === p.val ? ' selected' : ''}"
                  onclick="MyProjects.setPriority('${t.id}','${p.val}')">${p.label}</button>
              `).join('')}
            </div>
            <div class="mp-edit-group">
              <span class="mp-edit-label">마감일</span>
              <input type="date" class="mp-date-input" value="${t.dueDate || ''}"
                onchange="MyProjects.setDueDate('${t.id}', this.value)">
              ${t.dueDate ? `<button class="mp-date-clear" onclick="MyProjects.clearDueDate('${t.id}')">지우기</button>` : ''}
            </div>
            <textarea class="mp-memo-input" placeholder="메모..."
              onblur="MyProjects.saveMemo('${t.id}', this.value)">${escapeHtml(t.memo || '')}</textarea>
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ─ 리스트 재렌더 ─ */
  function renderList() {
    const listEl = document.getElementById('mp-list');
    if (!listEl) return;

    const all      = getTasks();
    const projects = [...new Set(all.map(t => t.project).filter(Boolean))];

    if (projects.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-text">브레인 덤프에서 프로젝트 태그를 달고 할 일로 변환하면 여기 나타나요</div>
        </div>`;
      return;
    }

    const filtered = activeProject === '전체' ? projects : [activeProject];

    listEl.innerHTML = filtered
      .map(proj => renderSection(proj, sortTasks(all.filter(t => t.project === proj))))
      .join('');
  }

  /* ─ 전체 렌더 ─ */
  function render() {
    const all      = getTasks();
    const projects = [...new Set(all.map(t => t.project).filter(Boolean))];

    const filterBtns = ['전체', ...projects]
      .map(p => `<button class="mp-filter-btn${activeProject === p ? ' active' : ''}"
          data-proj="${p}" onclick="MyProjects.setFilter('${p}')">${p}</button>`)
      .join('');

    document.getElementById('app').innerHTML = `
      ${projects.length > 1 ? `<div class="mp-filter-bar">${filterBtns}</div>` : ''}
      <div id="mp-list"></div>
    `;

    renderList();
  }

  /* ─ Enter 핸들러 ─ */
  function handleAdd(e) {
    if (e.key !== 'Enter' || e.isComposing) return;
    const input   = e.currentTarget;
    const project = input.dataset.project;
    const title   = input.value.trim();
    if (!title) return;
    addTask(project, title);
    input.value = '';
  }

  return {
    render, toggleDone, deleteTask, toggleShowDone, setFilter, handleAdd,
    toggleExpand, setPriority, setDueDate, clearDueDate, saveMemo,
  };
})();

document.addEventListener('DOMContentLoaded', () => MyProjects.render());
