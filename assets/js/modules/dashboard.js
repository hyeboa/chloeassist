/**
 * dashboard.js — 대시보드 렌더링
 */

const Dashboard = (() => {
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return '좋은 아침이에요';
    if (h < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  }

  function formatDate() {
    return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }

  function getStats() {
    const tasks    = Store.get('tasks') || [];
    const notes    = Store.get('notes') || [];
    const projects = Store.get('projects') || [];

    const todayStr = new Date().toDateString();
    const todayTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === todayStr;
    });

    return {
      todayTotal:     todayTasks.length,
      todayDone:      todayTasks.filter(t => t.done).length,
      totalNotes:     notes.length,
      activeProjects: projects.filter(p => p.status !== 'done').length,
    };
  }

  function getTodayTasks() {
    const tasks = Store.get('tasks') || [];
    const todayStr = new Date().toDateString();
    return tasks
      .filter(t => !t.dueDate || new Date(t.dueDate).toDateString() === todayStr)
      .slice(0, 5);
  }

  function getRecentNotes() {
    const notes = Store.get('notes') || [];
    return [...notes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  }

  function toggleTask(id) {
    const tasks = Store.get('tasks') || [];
    const task  = tasks.find(t => t.id === id);
    if (!task) return;
    Store.update('tasks', id, { done: !task.done });
    render();
  }

  function render() {
    const stats      = getStats();
    const todayTasks = getTodayTasks();
    const recentNotes= getRecentNotes();

    document.getElementById('app').innerHTML = `
      <div class="dashboard-greeting">
        <h1>${getGreeting()}, Chloe!</h1>
        <p>${formatDate()}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">오늘 할 일</div>
          <div class="stat-value">${stats.todayDone}<span style="color:var(--color-text-3);font-size:1.1rem"> / ${stats.todayTotal}</span></div>
          <div class="stat-sub">완료율 ${stats.todayTotal ? Math.round(stats.todayDone/stats.todayTotal*100) : 0}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">브레인 덤프</div>
          <div class="stat-value">${stats.totalNotes}</div>
          <div class="stat-sub">저장된 노트</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">진행 중 프로젝트</div>
          <div class="stat-value">${stats.activeProjects}</div>
          <div class="stat-sub">활성 프로젝트</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="dash-section-header">
            <div class="dash-section-title">오늘의 할 일</div>
            <a href="schedule.html" class="dash-section-link">전체 보기</a>
          </div>
          ${todayTasks.length === 0
            ? '<div class="empty-state"><div class="empty-state-icon">◷</div><div class="empty-state-text">오늘 등록된 일정이 없어요</div></div>'
            : todayTasks.map(t => `
              <div class="task-preview-item">
                <div class="task-check ${t.done ? 'done' : ''}" data-id="${t.id}" onclick="Dashboard.toggleTask('${t.id}')"></div>
                <span class="task-preview-text ${t.done ? 'done' : ''}">${t.title}</span>
                ${t.priority ? `<span class="badge badge-${t.priority === '높음' ? 'danger' : t.priority === '보통' ? 'warning' : 'primary'}">${t.priority}</span>` : ''}
              </div>
            `).join('')
          }
        </div>

        <div class="card">
          <div class="dash-section-header">
            <div class="dash-section-title">최근 브레인 덤프</div>
            <a href="braindump.html" class="dash-section-link">전체 보기</a>
          </div>
          ${recentNotes.length === 0
            ? '<div class="empty-state"><div class="empty-state-icon">◈</div><div class="empty-state-text">아직 작성된 노트가 없어요</div></div>'
            : recentNotes.map(n => `
              <div style="padding:9px 0;border-bottom:1px solid var(--color-border)">
                <div style="font-size:0.85rem;color:var(--color-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.text}</div>
                <div style="font-size:0.72rem;color:var(--color-text-3);margin-top:3px">${new Date(n.createdAt).toLocaleDateString('ko-KR')}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }

  return { render, toggleTask };
})();

document.addEventListener('DOMContentLoaded', () => Dashboard.render());
