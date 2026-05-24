/**
 * routine.js — 하루 루틴 (매일 반복 체크 + 달성률)
 */

const Routine = (() => {
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getRoutines() { return Store.get('routines') || []; }

  function getLog() { return Store.get('routine-log:' + today()) || {}; }

  function saveLog(log) { Store.set('routine-log:' + today(), log); }

  function todayLabel() {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }

  /* ─ 액션 ─ */
  function addRoutine(name) {
    if (!name.trim()) return;
    Store.push('routines', { name: name.trim() });
    render();
  }

  function deleteRoutine(id) {
    Store.remove('routines', id);
    render();
  }

  function toggleCheck(id) {
    const log = getLog();
    if (log[id]) { delete log[id]; } else { log[id] = true; }
    saveLog(log);
    render();
  }

  /* ─ 렌더 ─ */
  function render() {
    const routines = getRoutines();
    const log = getLog();
    const doneCount = routines.filter(r => log[r.id]).length;
    const total = routines.length;
    const pct = total ? Math.round(doneCount / total * 100) : 0;

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="routine-wrap">

        <div class="routine-header">
          <div class="routine-date">${todayLabel()}</div>
          <div class="routine-progress-wrap">
            <div class="routine-progress-bar">
              <div class="routine-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="routine-progress-label">${doneCount} / ${total} · ${pct}%</span>
          </div>
        </div>

        <div class="routine-list">
          ${total === 0 ? `
            <div class="routine-empty">루틴을 추가해 매일 달성률을 확인해보세요</div>
          ` : routines.map(r => {
            const done = !!log[r.id];
            return `
              <div class="routine-item ${done ? 'done' : ''}">
                <button class="routine-check ${done ? 'checked' : ''}" onclick="Routine.toggleCheck('${r.id}')" title="${done ? '완료 취소' : '완료'}">
                  ${done ? '✓' : ''}
                </button>
                <span class="routine-name">${escapeHtml(r.name)}</span>
                <button class="routine-delete" onclick="Routine.deleteRoutine('${r.id}')" title="삭제">✕</button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="quick-add-wrap routine-add-wrap">
          <div class="quick-add-inner">
            <input
              id="routine-input"
              class="quick-add-input"
              type="text"
              placeholder="새 루틴 추가"
              onkeydown="if(event.key==='Enter'){Routine.addRoutine(this.value);this.value='';}"
            >
            <div class="quick-add-footer">
              <span class="quick-add-hint">Enter로 추가</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, addRoutine, deleteRoutine, toggleCheck };
})();

document.addEventListener('DOMContentLoaded', () => Routine.render());
