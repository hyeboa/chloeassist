/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];

  let expandedId = null;

  function getFeatures() { return Store.get('features') || []; }
  function getTasks()    { return Store.get('tasks')    || []; }

  function linkedTasks(featureId) {
    return getTasks().filter(t => t.featureId === featureId);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 태스크 패널 (심플) ─ */
  function renderTaskPanel(f) {
    const tasks = linkedTasks(f.id);

    return `
      <div class="feat-panel">
        ${tasks.length === 0
          ? '<div class="feat-panel-empty">아직 할 일이 없어요</div>'
          : `<div class="feat-panel-tasks">
              ${tasks.map(t => `
                <div class="feat-panel-row ${t.done ? 'done' : ''}">
                  <span class="feat-task-title">${escapeHtml(t.title)}</span>
                  <button class="feat-task-del" onclick="event.stopPropagation();Projects.deleteTask('${t.id}')" title="삭제">✕</button>
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

    return `
      <div class="feature-card ${isOpen ? 'expanded' : ''}" onclick="Projects.toggleExpand('${f.id}')">
        <div class="feature-card-name">${escapeHtml(f.name)}</div>
        ${f.desc ? `<div class="feature-card-desc">${escapeHtml(f.desc)}</div>` : ''}
        <div class="feature-card-footer">
          <span class="feature-card-cat cat-badge ${f.category || ''}">${f.category || ''}</span>
          ${tasks.length ? `<span class="feat-mini-pct">${done}/${tasks.length}</span>` : ''}
        </div>

        <div class="feature-card-actions-row">
          ${prevStatus ? `<button class="feature-action-btn" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${prevStatus}')">◀ ${prevStatus}</button>` : ''}
          ${nextStatus ? `<button class="feature-action-btn next" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${nextStatus}')">${nextStatus} ▶</button>` : ''}
          <button class="feature-action-btn del" onclick="event.stopPropagation();Projects.deleteFeature('${f.id}')">✕</button>
        </div>

        ${isOpen ? renderTaskPanel(f) : ''}
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    const features = getFeatures();

    document.getElementById('app').innerHTML = `
      <div class="inline-nl-wrap">
        <div class="inline-nl-label">새 기능 추가</div>
        <input id="feat-input" class="inline-nl-input" type="text"
          placeholder="산책 기록 기능 디자인 GPS 경로 저장 및 공유...">
        <div class="inline-nl-footer">
          <span class="nl-rule-chip">기능명</span>
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">필수 · 분야·설명은 선택 · Enter로 추가</span>
        </div>
        <div class="inline-nl-status" id="feat-status"></div>
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

    bindFeatInput();
  }

  /* ─ 기능 입력 바인딩 ─ */
  function bindFeatInput() {
    const input  = document.getElementById('feat-input');
    const status = document.getElementById('feat-status');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const text = input.value.trim();
      if (!text) return;

      if (!AI.getApiKey()) {
        Toast.show('설정(⚙)에서 API 키를 먼저 입력해 주세요.', 'warning');
        return;
      }

      input.disabled = true;
      status.textContent = '✦ AI가 분석 중...';
      status.className = 'inline-nl-status';

      try {
        const result = await NLInput.parse('feature', text);
        Store.push('features', {
          name: result.name,
          desc: result.desc || '',
          category: result.category || '기획',
          status: '아이디어',
        });
        input.value = '';
        status.textContent = '';
        render();
      } catch (err) {
        status.textContent = '⚠ ' + err.message;
        status.className = 'inline-nl-status error';
        input.disabled = false;
        input.focus();
      }
    });
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

  return { render, deleteFeature, moveStatus, toggleExpand, handleTaskAdd, deleteTask };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
