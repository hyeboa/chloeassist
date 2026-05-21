/**
 * dashboard.js — 오늘 집중 뷰 (헬로아지 중심)
 */

const Dashboard = (() => {
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];
  let showDone = false;

  function todayStr() {
    return new Date().toDateString();
  }

  function getTodayTasks() {
    const all = Store.get('tasks') || [];
    return all.filter(t => t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === todayStr()));
  }

  function formatDate() {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
  }

  function addTask(title, category) {
    if (!title.trim()) return;
    Store.push('tasks', { title: title.trim(), category, done: false, isToday: true });
    render();
  }

  function toggleDone(id) {
    const tasks = Store.get('tasks') || [];
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done });
    render();
  }

  function deleteTask(id) {
    Store.remove('tasks', id);
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderCatGroup(cat, tasks) {
    const active = tasks.filter(t => !t.done);
    const done   = tasks.filter(t => t.done);
    const toShow = showDone ? tasks : active;
    if (!toShow.length && !active.length) return '';

    return `
      <div class="cat-group cat-${cat}">
        <div class="cat-group-header">
          <div class="cat-dot"></div>
          <span class="cat-label">${cat}</span>
          <span class="cat-count">${active.length}개</span>
        </div>
        ${toShow.map(t => `
          <div class="today-task ${t.done ? 'done' : ''}">
            <div class="today-checkbox ${t.done ? 'checked' : ''}"
              onclick="Dashboard.toggleDone('${t.id}')">${t.done ? '✓' : ''}</div>
            <span class="today-task-text">${escapeHtml(t.title)}</span>
            <button class="today-task-del" onclick="Dashboard.deleteTask('${t.id}')">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  let selectedCat = '기획';

  function selectCat(cat) {
    selectedCat = cat;
    document.querySelectorAll('#quick-cat-pills .cat-pill').forEach(el => {
      el.className = `cat-pill${el.dataset.cat === cat ? ' selected-' + cat : ''}`;
    });
  }

  function render() {
    const tasks  = getTodayTasks();
    const total  = tasks.length;
    const done   = tasks.filter(t => t.done).length;
    const pct    = total ? Math.round(done / total * 100) : 0;

    const byCat  = {};
    CATS.forEach(c => { byCat[c] = tasks.filter(t => t.category === c); });
    const hasAny = tasks.filter(t => !t.done).length > 0 || (showDone && done > 0);

    document.getElementById('app').innerHTML = `
      <div class="today-header">
        <div class="today-date">${formatDate()}</div>
        <div class="today-progress-row">
          <div class="today-progress-bar">
            <div class="today-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="today-progress-text">${done} / ${total} 완료</span>
        </div>
      </div>

      <div class="quick-add-wrap">
        <input id="quick-input" class="quick-add-input" type="text"
          placeholder="오늘 할 일을 입력하세요" autofocus>
        <div class="quick-add-footer">
          <div class="cat-pills" id="quick-cat-pills">
            ${CATS.map(c => `
              <button class="cat-pill${selectedCat === c ? ' selected-' + c : ''}"
                data-cat="${c}" onclick="Dashboard.selectCat('${c}')">${c}</button>
            `).join('')}
          </div>
          <span class="quick-add-hint">Enter로 추가</span>
        </div>
      </div>

      <div id="today-list">
        ${!hasAny && total === 0
          ? `<div class="empty-state">
               <div class="empty-state-icon">✦</div>
               <div class="empty-state-text">오늘 할 일을 추가해보세요</div>
             </div>`
          : CATS.map(c => renderCatGroup(c, byCat[c])).join('')
        }
        ${done > 0 ? `
          <div class="done-section-toggle" onclick="Dashboard.toggleShowDone()">
            ${showDone ? '▴' : '▾'} 완료된 항목 ${done}개 ${showDone ? '숨기기' : '보기'}
          </div>
        ` : ''}
      </div>
    `;

    const input = document.getElementById('quick-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTask(input.value, selectedCat);
        input.value = '';
        input.focus();
      }
    });
  }

  function toggleShowDone() {
    showDone = !showDone;
    render();
  }

  return { render, toggleDone, deleteTask, toggleShowDone, selectCat };
})();

document.addEventListener('DOMContentLoaded', () => Dashboard.render());
