/**
 * schedule.js — 할 일 목록 (오늘 뷰에서 넘어온 것 + 미래 태스크)
 */

const Schedule = (() => {
  const CATS = ['전체', '기획', '디자인', '개발', '마케팅', '운영'];
  let activeFilter = '전체';

  function getTasks() {
    return Store.get('tasks') || [];
  }

  function filtered() {
    const all = getTasks();
    const list = activeFilter === '전체' ? all : all.filter(t => t.category === activeFilter);
    return list.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.createdAt - a.createdAt);
  }

  function addTask(title, category) {
    if (!title.trim()) return;
    Store.push('tasks', { title: title.trim(), category, done: false, isToday: false });
    render();
  }

  function toggleDone(id) {
    const t = getTasks().find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done });
    render();
  }

  function moveToToday(id) {
    Store.update('tasks', id, { isToday: true, dueDate: new Date().toISOString().slice(0, 10) });
    Toast.show('오늘 할 일로 추가됐어요.', 'success');
    render();
  }

  function deleteTask(id) {
    Store.remove('tasks', id);
    render();
  }

  function setFilter(f) {
    activeFilter = f;
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  let selectedCat = '기획';

  function selectCat(cat) {
    selectedCat = cat;
    document.querySelectorAll('#bl-cat-pills .cat-pill').forEach(el => {
      el.className = `cat-pill${el.dataset.cat === cat ? ' selected-' + cat : ''}`;
    });
  }

  function render() {
    const tasks = filtered();

    document.getElementById('app').innerHTML = `
      <div class="backlog-toolbar">
        <div class="cat-filter-group">
          ${CATS.map(c => `
            <button class="cat-filter-btn ${activeFilter === c ? 'active-' + c : ''}"
              onclick="Schedule.setFilter('${c}')">${c}</button>
          `).join('')}
        </div>
      </div>

      <div class="bl-add-wrap">
        <input id="bl-input" class="bl-add-input" type="text" placeholder="할 일을 입력하세요">
        <div class="bl-add-footer">
          <div class="cat-pills" id="bl-cat-pills">
            ${CATS.slice(1).map(c => `
              <button class="cat-pill${selectedCat === c ? ' selected-' + c : ''}"
                data-cat="${c}" onclick="Schedule.selectCat('${c}')">${c}</button>
            `).join('')}
          </div>
          <span class="bl-add-hint">Enter로 추가</span>
        </div>
      </div>

      <div id="bl-list">
        ${tasks.length === 0
          ? '<div class="empty-state"><div class="empty-state-text">할 일이 없어요</div></div>'
          : tasks.map(t => `
            <div class="bl-task ${t.done ? 'done' : ''}">
              <div class="bl-checkbox ${t.done ? 'checked' : ''}"
                onclick="Schedule.toggleDone('${t.id}')">${t.done ? '✓' : ''}</div>
              <span class="bl-title">${escapeHtml(t.title)}</span>
              <span class="cat-badge ${t.category || ''}">${t.category || ''}</span>
              <div class="bl-actions">
                ${!t.isToday && !t.done ? `<button class="bl-btn bl-btn-today" onclick="Schedule.moveToToday('${t.id}')">오늘로</button>` : ''}
                <button class="bl-btn bl-btn-del" onclick="Schedule.deleteTask('${t.id}')">삭제</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    const input = document.getElementById('bl-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTask(input.value, selectedCat);
        input.value = '';
        input.focus();
      }
    });
    input?.focus();
  }

  return { render, setFilter, toggleDone, moveToToday, deleteTask, selectCat };
})();

document.addEventListener('DOMContentLoaded', () => Schedule.render());
