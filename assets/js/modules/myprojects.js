/**
 * myprojects.js — 내 프로젝트 할 일 관리
 * projectTasks store: { id, project, title, done, doneAt, createdAt }
 */

const MyProjects = (() => {
  const TAG_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  ];

  let activeProject = '전체';
  let showDoneMap   = {}; // { [project]: boolean }

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

  /* ─ 완료 토글 ─ */
  function toggleDone(id) {
    const t = getTasks().find(x => x.id === id);
    if (!t) return;
    Store.update('projectTasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    renderList();
  }

  function deleteTask(id) {
    Store.remove('projectTasks', id);
    renderList();
  }

  function addTask(project, title) {
    if (!title.trim()) return;
    Store.push('projectTasks', { project, title: title.trim(), done: false });
    renderList();
  }

  /* ─ 완료 보기 토글 ─ */
  function toggleShowDone(project) {
    showDoneMap[project] = !showDoneMap[project];
    renderList();
  }

  /* ─ 필터 ─ */
  function setFilter(proj) {
    activeProject = proj;
    render();
  }

  /* ─ 프로젝트 섹션 렌더 ─ */
  function renderSection(project, tasks) {
    const color     = projectColor(project);
    const todo      = tasks.filter(t => !t.done);
    const done      = tasks.filter(t => t.done);
    const showDone  = showDoneMap[project];

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

  function renderTask(t) {
    return `
      <div class="mp-task-item${t.done ? ' done' : ''}">
        <button class="mp-check${t.done ? ' checked' : ''}"
          onclick="MyProjects.toggleDone('${t.id}')" title="${t.done ? '완료 해제' : '완료'}">
          ${t.done ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </button>
        <span class="mp-task-title">${escapeHtml(t.title)}</span>
        <button class="mp-delete" onclick="MyProjects.deleteTask('${t.id}')" title="삭제">✕</button>
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
      .map(proj => {
        const tasks = all.filter(t => t.project === proj)
          .sort((a, b) => a.done - b.done || b.createdAt - a.createdAt);
        return renderSection(proj, tasks);
      })
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

  return { render, toggleDone, deleteTask, toggleShowDone, setFilter, handleAdd };
})();

document.addEventListener('DOMContentLoaded', () => MyProjects.render());
