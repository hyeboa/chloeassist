/**
 * routine.js — 하루 루틴 (매일 반복 체크 + 달성률 + 히스토리 차트)
 */

const Routine = (() => {
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateStr(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function getRoutines() { return Store.get('routines') || []; }

  function getLog(date) { return Store.get('routine-log:' + date) || {}; }

  function saveLog(log) { Store.set('routine-log:' + today(), log); }

  function todayLabel() {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }

  function dayLabel(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[d.getDay()];
  }

  function shortDate(dateString) {
    const d = new Date(dateString + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /* ─ 액션 ─ */
  function addRoutine(name) {
    if (!name.trim()) return;
    Store.push('routines', { name: name.trim() });
    render();
    setTimeout(() => { const el = document.getElementById('routine-input'); if (el) el.focus(); }, 0);
  }

  function deleteRoutine(id) {
    Store.remove('routines', id);
    render();
  }

  function toggleCheck(id) {
    const log = getLog(today());
    if (log[id]) { delete log[id]; } else { log[id] = true; }
    saveLog(log);
    render();
  }

  /* ─ 히스토리 차트 (최근 14일) ─ */
  function renderChart(routines) {
    const days = [];
    for (let i = -13; i <= 0; i++) {
      const date = dateStr(i);
      const log  = getLog(date);
      const done = routines.length ? routines.filter(r => log[r.id]).length : 0;
      const pct  = routines.length ? Math.round(done / routines.length * 100) : 0;
      days.push({ date, pct, done, total: routines.length, isToday: i === 0, day: dayLabel(date), short: shortDate(date) });
    }

    const maxPct = Math.max(...days.map(d => d.pct), 1);

    const bars = days.map(d => {
      const heightPct = Math.round(d.pct / maxPct * 100);
      return `
        <div class="rchart-col ${d.isToday ? 'today' : ''}">
          <div class="rchart-pct">${d.pct > 0 ? d.pct + '%' : ''}</div>
          <div class="rchart-bar-wrap">
            <div class="rchart-bar-fill" style="height:${heightPct}%"></div>
          </div>
          <div class="rchart-day-label">${d.day}</div>
          <div class="rchart-date-label">${d.short}</div>
        </div>
      `;
    }).join('');

    /* 평균 + 연속 달성 계산 */
    const loggedDays = days.filter(d => !d.isToday);
    const avg = loggedDays.length ? Math.round(loggedDays.reduce((s, d) => s + d.pct, 0) / loggedDays.length) : 0;
    let streak = 0;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i].pct === 100) streak++; else break;
    }

    return `
      <div class="rchart-panel">
        <div class="rchart-header">
          <span class="rchart-title">14일 달성 기록</span>
          <div class="rchart-stats">
            <span class="rchart-stat"><em>${avg}%</em> 평균</span>
            ${streak > 0 ? `<span class="rchart-stat streak"><em>${streak}일</em> 연속 100%</span>` : ''}
          </div>
        </div>
        <div class="rchart-grid">${bars}</div>
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    const routines = getRoutines();
    const log = getLog(today());
    const doneCount = routines.filter(r => log[r.id]).length;
    const total = routines.length;
    const pct = total ? Math.round(doneCount / total * 100) : 0;

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="routine-layout">

        <!-- 왼쪽: 오늘 루틴 -->
        <div class="routine-left">
          <div class="routine-today-header">
            <div class="routine-date">${todayLabel()}</div>
            ${total > 0 ? `
              <div class="routine-pct-big">${pct}<span class="routine-pct-unit">%</span></div>
              <div class="routine-progress-bar">
                <div class="routine-progress-fill" style="width:${pct}%"></div>
              </div>
              <div class="routine-done-label">${doneCount} / ${total} 완료</div>
            ` : ''}
          </div>

          <div class="routine-list">
            ${total === 0 ? `
              <div class="routine-empty">루틴을 추가해 매일 달성률을 확인해보세요</div>
            ` : routines.map(r => {
              const done = !!log[r.id];
              return `
                <div class="routine-item ${done ? 'done' : ''}">
                  <button class="routine-check ${done ? 'checked' : ''}" onclick="Routine.toggleCheck('${r.id}')">
                    ${done ? '✓' : ''}
                  </button>
                  <span class="routine-name">${escapeHtml(r.name)}</span>
                  <button class="routine-delete" onclick="Routine.deleteRoutine('${r.id}')" title="삭제">✕</button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="routine-add-form">
            <input
              id="routine-input"
              class="routine-input"
              type="text"
              placeholder="+ 루틴 추가"
              onkeydown="if(event.key==='Enter'){Routine.addRoutine(this.value);this.value='';}"
            >
          </div>
        </div>

        <!-- 오른쪽: 히스토리 차트 -->
        <div class="routine-right">
          ${renderChart(routines)}
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
