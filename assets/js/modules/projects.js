/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];

  let expandedId = null;

  function getFeatures() { return Store.get('features') || []; }
  function getTasks()    { return Store.get('tasks')    || []; }
  function getScreens()  { return Store.get('sitemapScreens') || []; }

  function linkedScreens(featureId) {
    return getScreens().filter(s => Array.isArray(s.featureIds) && s.featureIds.includes(featureId));
  }

  function linkedTasks(featureId) {
    return getTasks().filter(t => t.featureId === featureId);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 태스크 패널 ─ */
  function renderTaskPanel(f) {
    const tasks = linkedTasks(f.id);
    const done  = tasks.filter(t => t.done).length;

    return `
      <div class="feat-panel">
        <div class="feat-panel-label">
          <span>할 일</span>
          ${tasks.length ? `<span class="feat-panel-count">${done}/${tasks.length}</span>` : ''}
        </div>
        ${tasks.length === 0
          ? '<div class="feat-panel-empty">아래에서 할 일을 추가해보세요</div>'
          : `<div class="feat-panel-tasks">
              ${tasks.map(t => `
                <div class="feat-panel-row ${t.done ? 'done' : ''}">
                  <button class="feat-task-check" title="${t.done ? '완료 해제' : '완료'}"
                    onclick="event.stopPropagation();Projects.toggleTaskDone('${t.id}')">
                    ${t.done ? '✓' : ''}
                  </button>
                  <span class="feat-task-title">${escapeHtml(t.title)}</span>
                  <button class="feat-task-del" title="삭제" onclick="event.stopPropagation();Projects.deleteTask('${t.id}')">✕</button>
                </div>
              `).join('')}
            </div>`
        }

        <input type="text" class="feat-task-input"
          placeholder="+ 할 일 추가 (Enter)"
          onclick="event.stopPropagation()"
          onkeydown="Projects.handleTaskAdd(event, '${f.id}')">
      </div>
    `;
  }

  /* ─ 기능 카드 ─ */
  function renderCard(f) {
    const isOpen     = expandedId === f.id;
    const tasks      = linkedTasks(f.id);
    const done       = tasks.filter(t => t.done).length;
    const pct        = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const nextStatus = STATUSES[STATUSES.indexOf(f.status) + 1];
    const prevStatus = STATUSES[STATUSES.indexOf(f.status) - 1];
    const cat        = f.category || '';

    return `
      <div class="feature-card ${isOpen ? 'expanded' : ''}" data-status="${f.status}" onclick="Projects.toggleExpand('${f.id}')">
        <div class="feature-card-head">
          ${cat ? `<span class="cat-badge ${cat}">${cat}</span>` : '<span class="cat-badge cat-empty">미분류</span>'}
          ${nextStatus ? `
            <button class="feature-quick-next" title="다음 단계: ${nextStatus}"
              onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${nextStatus}')">▶</button>
          ` : `<span class="feature-quick-done" title="완료">✓</span>`}
        </div>

        <div class="feature-card-name">${escapeHtml(f.name)}</div>
        ${f.desc ? `<div class="feature-card-desc">${escapeHtml(f.desc)}</div>` : ''}

        ${tasks.length ? `
          <div class="feature-progress">
            <div class="feature-progress-bar">
              <div class="feature-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="feature-progress-text">${done}/${tasks.length}</span>
          </div>` : `
          <div class="feature-progress empty">
            <div class="feature-progress-bar"><div class="feature-progress-fill" style="width:0"></div></div>
            <span class="feature-progress-text">할 일 없음</span>
          </div>`}

        ${isOpen ? `
          ${(() => {
            const screens = linkedScreens(f.id);
            if (!screens.length) return '';
            return `
              <div class="feat-linked-screens">
                <div class="feat-linked-label">관련 화면 <span class="feat-linked-count">${screens.length}</span></div>
                <div class="feat-linked-list">
                  ${screens.map(s => `
                    <span class="feat-linked-chip"
                      onclick="event.stopPropagation();Projects.goToScreens()" title="화면 탭으로 이동">
                      ${escapeHtml(s.name)}
                      <span class="feat-linked-status">${s.status || '미정'}</span>
                    </span>
                  `).join('')}
                </div>
              </div>`;
          })()}
          ${renderTaskPanel(f)}
          <div class="feature-card-actions-row">
            ${prevStatus ? `<button class="feature-action-btn prev" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${prevStatus}')">◀ ${prevStatus}</button>` : ''}
            ${nextStatus ? `<button class="feature-action-btn next" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${nextStatus}')">${nextStatus} ▶</button>` : ''}
            <button class="feature-action-btn del" title="기능 삭제" onclick="event.stopPropagation();Projects.deleteFeature('${f.id}')">✕</button>
          </div>` : ''}
      </div>
    `;
  }

  /* ─ HTML 빌더 ─ */
  function buildHTML() {
    const features = getFeatures();
    return `
      <div class="proj-from-braindump-hint">
        💡 프로젝트 추가는 <a href="braindump.html" class="proj-hint-link">브레인 덤프</a>에서 — 생각을 덤프하고 프로젝트 태그를 입력하면 자동으로 등록돼요.
      </div>

      <div class="inline-nl-wrap">
        <div class="inline-nl-label">새 기능 추가</div>
        <input id="feat-input" class="inline-nl-input" type="text"
          placeholder="산책 기록 기능 디자인 GPS 경로 저장 및 공유...">
        <div class="inline-nl-footer">
          <span class="nl-rule-chip">기능명</span>
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">필수 · 분야·설명은 선택 · Enter로 추가</span>
        </div>
      </div>

      <div class="kanban-board">
        ${STATUSES.map(status => {
          const cols = features.filter(f => f.status === status);
          return `
            <div class="kanban-col" data-status="${status}">
              <div class="kanban-col-header">
                <span class="kanban-col-title">${status}</span>
                <span class="kanban-count">${cols.length}</span>
              </div>
              ${cols.map(f => renderCard(f)).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    if (typeof Sitemap !== 'undefined') {
      Sitemap.rerender();
      return;
    }
    document.getElementById('app').innerHTML = buildHTML();
    bindFeatInput();
  }

  /* ─ 기능 입력 바인딩 ─ */
  function bindFeatInput() {
    const input = document.getElementById('feat-input');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const text = input.value.trim();
      if (!text) return;

      Store.push('features', {
        name: text, desc: '', category: '기획', status: '아이디어',
      });
      input.value = '';
      render();
    });
  }

  /* ─ 화면 탭으로 이동 ─ */
  function goToScreens() {
    if (typeof Sitemap !== 'undefined') {
      Sitemap.setPageTab('screens');
    } else {
      location.href = 'sitemap.html';
    }
  }

  /* ─ 공개 메서드 ─ */
  function toggleExpand(id) {
    expandedId = expandedId === id ? null : id;
    render();
  }

  function handleTaskAdd(e, featureId) {
    if (e.key !== 'Enter' || e.isComposing) return;
    const input = e.currentTarget;
    const text  = input.value.trim();
    if (!text) return;
    Store.push('tasks', {
      title: text, featureId, done: false, isToday: false, category: '',
    });
    input.value = '';
    render();
    setTimeout(() => {
      const next = document.querySelector(`.feature-card.expanded .feat-task-input`);
      if (next) next.focus();
    }, 30);
  }

  function deleteTask(taskId) {
    Store.remove('tasks', taskId);
    render();
  }

  function toggleTaskDone(taskId) {
    const t = getTasks().find(x => x.id === taskId);
    if (!t) return;
    Store.update('tasks', taskId, { done: !t.done });
    render();
  }

  function deleteFeature(id) {
    getTasks().filter(t => t.featureId === id)
      .forEach(t => Store.update('tasks', t.id, { featureId: null }));
    Store.remove('features', id);
    if (expandedId === id) expandedId = null;
    render();
  }

  function moveStatus(id, newStatus) {
    Store.update('features', id, {
      status: newStatus,
      doneAt: newStatus === '완료' ? Date.now() : null,
    });
    render();
  }

  return {
    render, buildHTML, bindFeatInput, goToScreens,
    deleteFeature, moveStatus, toggleExpand, handleTaskAdd, deleteTask, toggleTaskDone,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Sitemap === 'undefined') Projects.render();
});

