/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];

  let expandedId = null;

  function getFeatures() { return Store.get('features') || []; }
  function getTasks()    { return Store.get('tasks')    || []; }

  function linkedTasks(featureId) {
    return getTasks().filter(t => t.featureId === featureId);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 태스크 패널 ─ */
  function renderTaskPanel(f) {
    const tasks   = linkedTasks(f.id);
    const done    = tasks.filter(t => t.done).length;
    const pct     = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const unlinked = getTasks().filter(t => !t.featureId && !t.done);

    return `
      <div class="feat-panel">
        <div class="feat-panel-progress">
          <div class="feat-panel-bar-wrap">
            <div class="feat-panel-bar">
              <div class="feat-panel-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <span class="feat-panel-stat">${done}/${tasks.length} 완료</span>
        </div>

        <div class="feat-panel-tasks">
          ${tasks.length === 0
            ? '<div class="feat-panel-empty">연결된 할 일이 없어요</div>'
            : tasks.map(t => `
              <div class="feat-panel-row ${t.done ? 'done' : ''}">
                <div class="feat-check ${t.done ? 'checked' : ''}"
                  onclick="Projects.toggleTaskDone('${t.id}')">${t.done ? '✓' : ''}</div>
                <span class="feat-task-title">${escapeHtml(t.title)}</span>
                ${t.dueDate ? `<span class="feat-task-date">${shortDate(t.dueDate)}</span>` : ''}
                <button class="feat-task-unlink" onclick="Projects.unlinkTask('${t.id}')" title="연결 해제">✕</button>
              </div>
            `).join('')}
        </div>

        <div class="feat-panel-add">
          <input class="feat-panel-input" id="feat-task-new-${f.id}"
            placeholder="할 일 추가 (Enter)..." autocomplete="off">
        </div>

        ${unlinked.length ? `
        <div class="feat-panel-link">
          <select class="feat-panel-select" id="feat-link-sel-${f.id}"
            onchange="Projects.linkExisting('${f.id}', this.value)">
            <option value="">기존 할 일 연결...</option>
            ${unlinked.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>
    `;
  }

  function shortDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
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
      <div class="feature-card ${isOpen ? 'expanded' : ''}">
        <div class="feature-card-main" onclick="Projects.toggleExpand('${f.id}')">
          <div class="feature-card-top">
            <div class="feature-card-name">${escapeHtml(f.name)}</div>
            <span class="feat-expand-icon">${isOpen ? '▴' : '▾'}</span>
          </div>
          ${f.desc ? `<div class="feature-card-desc">${escapeHtml(f.desc)}</div>` : ''}
          <div class="feature-card-footer">
            <span class="feature-card-cat cat-badge ${f.category || ''}">${f.category || ''}</span>
            ${tasks.length ? `
              <div class="feat-mini-progress">
                <div class="feat-mini-bar">
                  <div class="feat-mini-fill" style="width:${pct}%"></div>
                </div>
                <span class="feat-mini-pct">${pct}%</span>
              </div>` : ''}
          </div>
        </div>

        <div class="feature-card-actions-row">
          ${prevStatus ? `<button class="feature-action-btn" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${prevStatus}')">◀ ${prevStatus}</button>` : ''}
          ${nextStatus ? `<button class="feature-action-btn" onclick="event.stopPropagation();Projects.moveStatus('${f.id}','${nextStatus}')" style="color:var(--color-primary)">${nextStatus} ▶</button>` : ''}
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
    bindPanelInputs();
  }

  /* ─ 패널 입력 바인딩 ─ */
  function bindPanelInputs() {
    if (!expandedId) return;
    const input = document.getElementById(`feat-task-new-${expandedId}`);
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const text = input.value.trim();
      if (!text) return;
      Store.push('tasks', {
        title: text,
        featureId: expandedId,
        category: (getFeatures().find(f => f.id === expandedId) || {}).category || '',
        done: false,
        isToday: false,
        dueDate: null,
      });
      render();
    });
    input.focus();
  }

  /* ─ 기능 입력 바인딩 ─ */
  function bindFeatInput() {
    const input  = document.getElementById('feat-input');
    const status = document.getElementById('feat-status');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
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

  function toggleTaskDone(taskId) {
    const t = getTasks().find(t => t.id === taskId);
    if (!t) return;
    Store.update('tasks', taskId, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    render();
  }

  function unlinkTask(taskId) {
    Store.update('tasks', taskId, { featureId: null });
    render();
  }

  function linkExisting(featureId, taskId) {
    if (!taskId) return;
    Store.update('tasks', taskId, { featureId });
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

  return { render, deleteFeature, moveStatus, toggleExpand, toggleTaskDone, unlinkTask, linkExisting };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
