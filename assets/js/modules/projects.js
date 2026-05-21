/**
 * projects.js — 프로젝트 관리 (카드 + 칸반 뷰)
 */

const Projects = (() => {
  let view = 'card';

  const STATUSES = ['todo', 'inprogress', 'done'];
  const STATUS_LABELS = { todo: '할 일', inprogress: '진행 중', done: '완료' };
  const EMOJIS = ['📁', '🚀', '💡', '📊', '🎯', '🛠', '📝', '🌟'];

  function getProjects() {
    return Store.get('projects') || [];
  }

  function getProgress(project) {
    const tasks = (project.tasks || []);
    if (!tasks.length) return 0;
    return Math.round(tasks.filter(t => t.done).length / tasks.length * 100);
  }

  function deleteProject(id) {
    if (!confirm('프로젝트를 삭제할까요?')) return;
    Store.remove('projects', id);
    render();
  }

  function setView(v) {
    view = v;
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderCardView(projects) {
    if (!projects.length) {
      return '<div class="empty-state"><div class="empty-state-icon">◉</div><div class="empty-state-text">프로젝트를 추가해 보세요!</div></div>';
    }
    return `<div class="grid-auto">${projects.map(p => {
      const progress = getProgress(p);
      const taskCount = (p.tasks || []).length;
      return `
        <div class="project-card" onclick="Projects.openProject('${p.id}')">
          <div class="project-card-header">
            <div class="project-icon">${p.icon || '📁'}</div>
            <div class="project-card-actions" onclick="event.stopPropagation()">
              <button class="icon-btn" onclick="Projects.showEditModal('${p.id}')" title="수정">✎</button>
              <button class="icon-btn danger" onclick="Projects.deleteProject('${p.id}')" title="삭제">✕</button>
            </div>
          </div>
          <div class="project-name">${escapeHtml(p.name)}</div>
          <div class="project-desc">${escapeHtml(p.description || '설명 없음')}</div>
          <div class="project-progress">
            <div class="progress-label">
              <span>진행률</span><span>${progress}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          </div>
          <div class="project-card-footer">
            <span class="project-task-count">태스크 ${taskCount}개</span>
            <span class="badge badge-${p.status === 'done' ? 'success' : p.status === 'inprogress' ? 'warning' : 'primary'}">${STATUS_LABELS[p.status] || '할 일'}</span>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }

  function renderKanbanView(projects) {
    return `
      <div class="kanban-board">
        ${STATUSES.map(status => {
          const cols = projects.filter(p => (p.status || 'todo') === status);
          return `
            <div class="kanban-col">
              <div class="kanban-col-header">
                <span class="kanban-col-title">${STATUS_LABELS[status]}</span>
                <span class="kanban-count">${cols.length}</span>
              </div>
              ${cols.map(p => `
                <div class="kanban-card" onclick="Projects.openProject('${p.id}')">
                  <div class="kanban-card-title">${p.icon || '📁'} ${escapeHtml(p.name)}</div>
                  <div class="kanban-card-meta">
                    <span class="badge badge-primary" style="font-size:0.7rem">태스크 ${(p.tasks||[]).length}개</span>
                    <span style="font-size:0.72rem;color:var(--color-text-3)">${getProgress(p)}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function render() {
    const projects = getProjects();

    document.getElementById('app').innerHTML = `
      <div class="projects-toolbar">
        <div class="view-toggle">
          <button class="view-btn ${view === 'card' ? 'active' : ''}" onclick="Projects.setView('card')">카드 뷰</button>
          <button class="view-btn ${view === 'kanban' ? 'active' : ''}" onclick="Projects.setView('kanban')">칸반 뷰</button>
        </div>
        <button class="btn btn-primary" onclick="Projects.showAddModal()">+ 프로젝트 추가</button>
      </div>
      ${view === 'card' ? renderCardView(projects) : renderKanbanView(projects)}
    `;
  }

  function openProject(id) {
    const project = getProjects().find(p => p.id === id);
    if (!project) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;';
    const tasks = project.tasks || [];

    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:480px;max-height:80vh;overflow-y:auto;box-shadow:var(--shadow-lg)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <span style="font-size:1.8rem">${project.icon || '📁'}</span>
          <div>
            <h3 style="font-size:1rem;font-weight:700">${escapeHtml(project.name)}</h3>
            <p style="font-size:0.82rem;color:var(--color-text-2)">${escapeHtml(project.description || '')}</p>
          </div>
          <button onclick="this.closest('[style]').remove()" style="margin-left:auto;color:var(--color-text-3);font-size:1rem;padding:4px 8px">✕</button>
        </div>

        <div style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:10px">태스크</div>
          <div id="proj-tasks">
            ${tasks.map(t => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--color-border)">
                <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="Projects.toggleProjectTask('${id}', '${t.id}', this)">${t.done ? '✓' : ''}</div>
                <span style="font-size:0.87rem;${t.done ? 'text-decoration:line-through;color:var(--color-text-3)' : ''}">${escapeHtml(t.title)}</span>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <input id="new-task-input" type="text" placeholder="새 태스크 추가..."
              style="flex:1;padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.87rem;outline:none">
            <button class="btn btn-primary" onclick="Projects.addProjectTask('${id}')">추가</button>
          </div>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function toggleProjectTask(projId, taskId, el) {
    const projects = getProjects();
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    proj.tasks = (proj.tasks || []).map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    Store.set('projects', projects);
    el.classList.toggle('checked');
    el.textContent = el.classList.contains('checked') ? '✓' : '';
    render();
  }

  function addProjectTask(projId) {
    const input = document.getElementById('new-task-input');
    const title = input?.value.trim();
    if (!title) return;
    const projects = getProjects();
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    if (!proj.tasks) proj.tasks = [];
    proj.tasks.push({ id: crypto.randomUUID(), title, done: false });
    Store.set('projects', projects);
    input.value = '';
    const overlay = input.closest('[style]');
    if (overlay) overlay.remove();
    openProject(projId);
    render();
  }

  function showAddModal() {
    openModal({ title: '프로젝트 추가', project: { name: '', description: '', icon: '📁', status: 'todo' }, onSave: (data) => {
      Store.push('projects', { ...data, tasks: [] });
      render();
      Toast.show('프로젝트가 추가되었습니다.', 'success');
    }});
  }

  function showEditModal(id) {
    const project = getProjects().find(p => p.id === id);
    if (!project) return;
    openModal({ title: '프로젝트 수정', project, onSave: (data) => {
      Store.update('projects', id, data);
      render();
      Toast.show('프로젝트가 수정되었습니다.', 'success');
    }});
  }

  function openModal({ title, project, onSave }) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:400px;box-shadow:var(--shadow-lg)">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:20px">${title}</h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">이름 *</label>
            <input id="m-name" type="text" value="${escapeHtml(project.name)}" placeholder="프로젝트 이름"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">설명</label>
            <input id="m-desc" type="text" value="${escapeHtml(project.description || '')}" placeholder="간략한 설명"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:8px">아이콘</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${EMOJIS.map(e => `<span data-emoji="${e}" onclick="this.parentNode.querySelectorAll('span').forEach(s=>s.style.background='');this.style.background='var(--color-primary-light)'"
                style="font-size:1.3rem;cursor:pointer;padding:4px 8px;border-radius:6px;${project.icon===e?'background:var(--color-primary-light)':''}">${e}</span>`).join('')}
            </div>
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">상태</label>
            <select id="m-status"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none;background:var(--color-surface)">
              ${STATUSES.map(s => `<option value="${s}" ${project.status===s?'selected':''}>${STATUS_LABELS[s]}</option>`).join('')}
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
      const name = overlay.querySelector('#m-name').value.trim();
      if (!name) { Toast.show('프로젝트 이름을 입력해 주세요.', 'warning'); return; }
      const selectedEmoji = [...overlay.querySelectorAll('[data-emoji]')].find(el => el.style.background)?.dataset.emoji || project.icon;
      onSave({
        name,
        description: overlay.querySelector('#m-desc').value.trim(),
        icon: selectedEmoji || '📁',
        status: overlay.querySelector('#m-status').value,
      });
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    overlay.querySelector('#m-name').focus();
  }

  return { render, setView, deleteProject, openProject, toggleProjectTask, addProjectTask, showAddModal, showEditModal };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
