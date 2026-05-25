/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];

  let expandedId = null;
  let draggedFeatureId = null;

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

  /* ─ 상태별 컬러 ─ */
  const STATUS_COLOR = {
    '아이디어': { bg: '#eef0f5', text: '#64748b', border: '#cbd5e1' },
    '기획중':   { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    '디자인중': { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    '개발중':   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    '완료':     { bg: '#dcfce7', text: '#15803d', border: '#6ee7b7' },
    '미정':     { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0' },
  };
  function sc(status) { return STATUS_COLOR[status] || STATUS_COLOR['미정']; }

  /* ─ 아이콘 SVG ─ */
  function chevronRightSvg() {
    return `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M3.5 1.5l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function chevronLeftSvg() {
    return `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function checkSvg() {
    return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  /* ─ 태스크 패널 (펼침) ─ */
  function renderTaskPanel(f) {
    const tasks = linkedTasks(f.id);

    return `
      <div class="feat-panel">
        ${tasks.length ? `<div class="feat-panel-tasks">
              ${tasks.map(t => `
                <div class="feat-panel-row ${t.done ? 'done' : ''}">
                  <button class="feat-task-check" title="${t.done ? '완료 해제' : '완료'}"
                    onclick="event.stopPropagation();Projects.toggleTaskDone('${t.id}')">
                    ${t.done ? checkSvg() : ''}</button>
                  <span class="feat-task-title">${escapeHtml(t.title)}</span>
                  <button class="feat-task-del" title="삭제" onclick="event.stopPropagation();Projects.deleteTask('${t.id}')">✕</button>
                </div>
              `).join('')}
            </div>` : ''}
        <input type="text" class="feat-task-input"
          placeholder="할 일 추가"
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

    /* 접힌 상태에서 할 일 미리보기 (최대 3개) */
    const taskPreview = !isOpen && tasks.length > 0 ? `
      <div class="feat-task-preview">
        ${tasks.slice(0, 3).map(t => `
          <div class="feat-preview-row ${t.done ? 'done' : ''}">
            <span class="feat-preview-check">${t.done ? checkSvg() : ''}</span>
            <span class="feat-preview-title">${escapeHtml(t.title)}</span>
          </div>`).join('')}
        ${tasks.length > 3 ? `<div class="feat-preview-more">+ ${tasks.length - 3}개 더</div>` : ''}
      </div>` : '';

    return `
      <div class="feature-card ${isOpen ? 'expanded' : ''}" data-status="${f.status}" data-id="${f.id}"
        draggable="true"
        ondragstart="Projects.cardDragStart(event,'${f.id}')"
        ondragend="Projects.cardDragEnd(event)"
        onclick="Projects.toggleExpand('${f.id}')">
        <div class="feature-card-name">${escapeHtml(f.name)}</div>
        ${f.desc ? `<div class="feature-card-desc">${escapeHtml(f.desc)}</div>` : ''}

        ${tasks.length ? `
          <div class="feature-progress">
            <div class="feature-progress-bar">
              <div class="feature-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="feature-progress-text">${done}/${tasks.length}</span>
          </div>` : ''}

        ${taskPreview}

        ${isOpen ? `
          ${renderTaskPanel(f)}
          ${(() => {
            const screens = linkedScreens(f.id);
            if (!screens.length) return '';
            return `
              <div class="feat-linked-screens">
                <div class="feat-linked-label">관련 화면 <span class="feat-linked-count">${screens.length}</span></div>
                <div class="feat-linked-list">
                  ${screens.map(s => {
                    const sColor = sc(s.status || '미정');
                    return `
                    <span class="feat-linked-chip"
                      onclick="event.stopPropagation();Projects.goToScreens()" title="화면 탭으로 이동"
                      style="background:${sColor.bg};border-color:${sColor.border}">
                      <span class="feat-linked-chip-name" style="color:${sColor.text}">${escapeHtml(s.name)}</span>
                      <span class="feat-linked-status" style="color:${sColor.text};border-color:${sColor.border};opacity:0.7">${s.status || '미정'}</span>
                    </span>`;
                  }).join('')}
                </div>
              </div>`;
          })()}
          <button class="feature-action-btn del" style="margin-top:12px" onclick="event.stopPropagation();Projects.deleteFeature('${f.id}')">삭제</button>` : ''}
      </div>
    `;
  }

  /* ─ HTML 빌더 ─ */
  function buildHTML() {
    const features = getFeatures();
    return `
      <div class="quick-add-wrap">
        <div class="quick-add-inner">
          <div class="quick-add-top">
            <input id="feat-input" class="quick-add-input" type="text"
              placeholder="산책 기록 기능 디자인 GPS 경로 저장 및 공유...">
            <span class="ai-badge">✦ AI</span>
          </div>
          <div class="quick-add-footer">
            <span class="quick-add-hint">Enter로 추가</span>
          </div>
        </div>
      </div>

      <div class="kanban-board">
        ${STATUSES.map(status => {
          const cols = features.filter(f => f.status === status);
          return `
            <div class="kanban-col" data-status="${status}"
              ondragover="Projects.colDragOver(event)"
              ondragleave="Projects.colDragLeave(event)"
              ondrop="Projects.colDrop(event,'${status}')">
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

      if (!AI.getApiKey()) {
        Store.push('features', { name: text, desc: '', category: '기획', status: '아이디어' });
        input.value = '';
        render();
        return;
      }

      input.disabled = true;
      input.placeholder = '✦ AI가 분석 중...';
      try {
        const result = await NLInput.parse('feature', text);
        Store.push('features', {
          name: result.name || text,
          desc: result.desc || '',
          category: result.category || '기획',
          status: '아이디어',
        });
        input.value = '';
        render();
      } catch {
        Store.push('features', { name: text, desc: '', category: '기획', status: '아이디어' });
        input.value = '';
        render();
      } finally {
        input.disabled = false;
        input.placeholder = '산책 기록 기능 디자인 GPS 경로 저장 및 공유...';
        const nextInput = document.getElementById('feat-input');
        if (nextInput) nextInput.focus();
      }
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

  /* ─ 드래그&드롭 ─ */
  function cardDragStart(e, featureId) {
    draggedFeatureId = featureId;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  }

  function cardDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedFeatureId = null;
  }

  function colDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.background = 'var(--color-surface-2)';
  }

  function colDragLeave(e) {
    e.currentTarget.style.background = '';
  }

  function colDrop(e, status) {
    e.preventDefault();
    e.currentTarget.style.background = '';
    if (draggedFeatureId) {
      moveStatus(draggedFeatureId, status);
    }
  }

  return {
    render, buildHTML, bindFeatInput, goToScreens,
    deleteFeature, moveStatus, toggleExpand, handleTaskAdd, deleteTask, toggleTaskDone,
    cardDragStart, cardDragEnd, colDragOver, colDragLeave, colDrop,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Sitemap === 'undefined') Projects.render();
});

