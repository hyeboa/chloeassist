/**
 * myprojects.js — 내 프로젝트 할 일 관리
 * projectTasks store: { id, project, title, done, doneAt, dueDate?, priority?, memo?, createdAt }
 */

const MyProjects = (() => {
  const TAG_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }, // 바이올렛
    { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' }, // 인디고
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' }, // 블루
    { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' }, // 시안
    { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' }, // 틸
    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }, // 에메랄드
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // 그린
    { bg: '#fef9c3', text: '#a16207', border: '#fde047' }, // 옐로
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }, // 오렌지
    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }, // 레드
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // 핑크
    { bg: '#fae8ff', text: '#a21caf', border: '#f0abfc' }, // 푸시아
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
  let tasksCache = [];

  function getTasks() { return tasksCache.length ? tasksCache : (Store.get('projectTasks') || []); }

  async function loadTasks() {
    tasksCache = await Store.loadProjectTasks();
    return tasksCache;
  }

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
  async function toggleDone(id) {
    const t = getTasks().find(x => x.id === id);
    if (!t) return;
    await Store.updateProjectTask(id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    Store.update('projectTasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    renderList();
  }

  async function deleteTask(id) {
    await Store.removeProjectTask(id);
    Store.remove('projectTasks', id);
    if (expandedTaskId === id) expandedTaskId = null;
    renderList();
  }

  async function addTask(project, title) {
    if (!title.trim()) return;
    const item = {
      id: crypto.randomUUID(),
      project,
      title: title.trim(),
      done: false,
      priority: 'normal',
      createdAt: Date.now(),
    };
    await Store.pushProjectTask(item);
    renderList();
  }

  function toggleExpand(id) {
    expandedTaskId = expandedTaskId === id ? null : id;
    renderList();
  }

  async function setPriority(id, priority) {
    await Store.updateProjectTask(id, { priority });
    Store.update('projectTasks', id, { priority });
    renderList();
  }

  async function setDueDate(id, dateStr) {
    await Store.updateProjectTask(id, { dueDate: dateStr || null });
    Store.update('projectTasks', id, { dueDate: dateStr || null });
    renderList();
  }

  async function saveMemo(id, text) {
    await Store.updateProjectTask(id, { memo: text.trim() || null });
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
          ${done.length ? `
            <button class="mp-show-done-btn${showDone ? ' open' : ''}" onclick="MyProjects.toggleShowDone('${escapeHtml(project)}')">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M4 5.5l3 3 3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>완료 ${done.length}</span>
            </button>
          ` : ''}
        </div>

        <div class="mp-task-list">
          ${todo.map(t => renderTask(t)).join('')}

          ${done.length && showDone ? done.map(t => renderTask(t)).join('') : ''}
        </div>

        <div class="mp-add-row">
          <input class="mp-add-input" type="text"
            placeholder="할 일 추가"
            data-project="${escapeHtml(project)}"
            onkeydown="MyProjects.handleAdd(event)">
          <span class="mp-add-hint">Enter</span>
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
          ${hasMemo ? `<span class="mp-memo-preview" onclick="MyProjects.toggleExpand('${t.id}')">${escapeHtml(t.memo.length > 22 ? t.memo.slice(0, 22) + '…' : t.memo)}</span>` : ''}
          ${dueBadge(t)}
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
            </div>
            <textarea class="mp-memo-input" placeholder="메모..."
              onblur="MyProjects.saveMemo('${t.id}', this.value)">${escapeHtml(t.memo || '')}</textarea>
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ─ 대시보드 ─ */
  function renderDashboard(all, projects) {
    const el = document.getElementById('mp-dashboard');
    if (!el || projects.length === 0) { if (el) el.innerHTML = ''; return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);

    el.innerHTML = `
      <div class="mp-dashboard">
        ${projects.map(proj => {
          const tasks    = all.filter(t => t.project === proj);
          const total    = tasks.length;
          const doneNum  = tasks.filter(t => t.done).length;
          const todoNum  = total - doneNum;
          const pct      = total ? Math.round(doneNum / total * 100) : 0;
          const color    = projectColor(proj);
          const isActive = activeProject === proj;

          const withDue  = tasks.filter(t => !t.done && t.dueDate)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const overdue  = withDue.filter(t => new Date(t.dueDate + 'T00:00:00') < today);

          let dueHtml = '';
          if (overdue.length) {
            dueHtml = `<span class="mp-dash-due overdue">${overdue.length}개 마감 초과</span>`;
          } else if (withDue.length) {
            const d    = new Date(withDue[0].dueDate + 'T00:00:00');
            const diff = Math.round((d - today) / 86400000);
            const lbl  = diff === 0 ? '오늘 마감' : diff === 1 ? '내일 마감' : `${d.getMonth() + 1}/${d.getDate()} 마감`;
            dueHtml = `<span class="mp-dash-due">${lbl}</span>`;
          }

          return `
            <div class="mp-dash-card${isActive ? ' active' : ''}"
              onclick="MyProjects.setFilter('${escapeHtml(proj)}')"
              style="${isActive ? `border-color:${color.text};box-shadow:0 0 0 2px ${color.bg}` : ''}">
              <span class="mp-project-badge"
                style="background:${color.bg};color:${color.text};border-color:${color.border}">
                ${escapeHtml(proj)}
              </span>
              <div class="mp-dash-progress-wrap">
                <div class="mp-dash-progress-bar">
                  <div class="mp-dash-progress-fill" style="width:${pct}%;background:${color.text}"></div>
                </div>
                <span class="mp-dash-pct">${pct}%</span>
              </div>
              <div class="mp-dash-stats">
                <span class="mp-dash-remain">${todoNum > 0 ? `${todoNum}개 남음` : '모두 완료 ✓'}</span>
                ${dueHtml}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  /* ─ 리스트 재렌더 ─ */
  function renderList() {
    const listEl = document.getElementById('mp-list');
    if (!listEl) return;

    const all      = getTasks();
    const projects = [...new Set(all.map(t => t.project).filter(Boolean))];

    renderDashboard(all, projects);

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
  async function render() {
    await loadTasks();
    const all      = getTasks();
    const projects = [...new Set(all.map(t => t.project).filter(Boolean))];

    const filterBtns = ['전체', ...projects]
      .map(p => `<button class="mp-filter-btn${activeProject === p ? ' active' : ''}"
          data-proj="${p}" onclick="MyProjects.setFilter('${p}')">${p}</button>`)
      .join('');

    document.getElementById('app').innerHTML = `
      <div class="mp-braindump-hint">새 프로젝트와 할 일 추가는 <a href="braindump.html">브레인 덤프</a>에서 — 생각을 적고 프로젝트 태그를 달면 여기로 모여요.</div>
      <div id="mp-dashboard"></div>
      ${projects.length > 1 ? `<div class="mp-filter-bar" style="margin-top:20px">${filterBtns}</div>` : ''}
      <div id="mp-list" style="margin-top:24px"></div>
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
    toggleExpand, setPriority, setDueDate, saveMemo,
  };
})();

document.addEventListener('DOMContentLoaded', () => MyProjects.render());
