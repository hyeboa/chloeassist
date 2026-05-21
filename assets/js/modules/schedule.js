/**
 * schedule.js — 업무 일정 관리
 */

const Schedule = (() => {
  let filter = 'all';

  const PRIORITIES = ['높음', '보통', '낮음'];

  function getTasks() {
    return Store.get('tasks') || [];
  }

  function filtered() {
    const tasks = getTasks();
    if (filter === 'today') {
      const today = new Date().toDateString();
      return tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
    }
    if (filter === 'pending')   return tasks.filter(t => !t.done);
    if (filter === 'completed') return tasks.filter(t => t.done);
    return tasks.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
  }

  function addTask(title) {
    if (!title.trim()) return;
    Store.push('tasks', { title: title.trim(), done: false, priority: '보통', dueDate: null });
    render();
  }

  function toggleDone(id) {
    const tasks = getTasks();
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done });
    render();
  }

  function deleteTask(id) {
    Store.remove('tasks', id);
    render();
  }

  function render() {
    const tasks = filtered();

    document.getElementById('app').innerHTML = `
      <div class="schedule-toolbar">
        <div class="schedule-filter-group">
          ${['all','today','pending','completed'].map(f => `
            <button class="filter-btn ${filter === f ? 'active' : ''}" onclick="Schedule.setFilter('${f}')">
              ${{ all:'전체', today:'오늘', pending:'진행 중', completed:'완료' }[f]}
            </button>
          `).join('')}
        </div>
        <button class="btn btn-primary" onclick="Schedule.showAddModal()">+ 일정 추가</button>
      </div>

      <div class="task-list" id="task-list">
        ${tasks.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon">◷</div><div class="empty-state-text">일정이 없어요. 새 일정을 추가해 보세요!</div></div>'
          : tasks.map(t => `
            <div class="task-item ${t.done ? 'completed' : ''}">
              <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="Schedule.toggleDone('${t.id}')">
                ${t.done ? '✓' : ''}
              </div>
              <div class="task-body">
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-meta">
                  ${t.dueDate ? `<span class="task-date">📅 ${new Date(t.dueDate).toLocaleDateString('ko-KR')}</span>` : ''}
                  ${t.priority ? `<span class="badge badge-${t.priority === '높음' ? 'danger' : t.priority === '보통' ? 'warning' : 'primary'}">${t.priority}</span>` : ''}
                </div>
              </div>
              <div class="task-actions">
                <button class="icon-btn" onclick="Schedule.showEditModal('${t.id}')" title="수정">✎</button>
                <button class="icon-btn danger" onclick="Schedule.deleteTask('${t.id}')" title="삭제">✕</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
  }

  function showAddModal(prefill = {}) {
    openModal({
      title: '일정 추가',
      task: { title: '', priority: '보통', dueDate: '', ...prefill },
      onSave: (data) => {
        Store.push('tasks', { ...data, done: false });
        render();
        Toast.show('일정이 추가되었습니다.', 'success');
      },
    });
  }

  function showEditModal(id) {
    const task = getTasks().find(t => t.id === id);
    if (!task) return;
    openModal({
      title: '일정 수정',
      task,
      onSave: (data) => {
        Store.update('tasks', id, data);
        render();
        Toast.show('일정이 수정되었습니다.', 'success');
      },
    });
  }

  function openModal({ title, task, onSave }) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:400px;box-shadow:var(--shadow-lg)">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:20px">${title}</h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">제목 *</label>
            <input id="m-title" type="text" value="${escapeHtml(task.title)}" placeholder="할 일을 입력하세요"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">마감일</label>
            <input id="m-date" type="date" value="${task.dueDate || ''}"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">우선순위</label>
            <select id="m-priority"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none;background:var(--color-surface)">
              ${PRIORITIES.map(p => `<option value="${p}" ${task.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:24px">
          <button id="m-cancel" class="btn btn-ghost">취소</button>
          <button id="m-save" class="btn btn-primary">저장</button>
        </div>
      </div>
    `;

    overlay.querySelector('#m-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#m-save').addEventListener('click', () => {
      const titleVal = overlay.querySelector('#m-title').value.trim();
      if (!titleVal) { Toast.show('제목을 입력해 주세요.', 'warning'); return; }
      onSave({
        title: titleVal,
        dueDate: overlay.querySelector('#m-date').value || null,
        priority: overlay.querySelector('#m-priority').value,
      });
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    overlay.querySelector('#m-title').focus();
  }

  function setFilter(f) {
    filter = f;
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, setFilter, toggleDone, deleteTask, showAddModal, showEditModal };
})();

document.addEventListener('DOMContentLoaded', () => Schedule.render());
