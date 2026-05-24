/**
 * routine.js — 하루 루틴 (날짜 이동 + 스트릭 + 주간 매트릭스)
 */

const Routine = (() => {
  let selectedDate = todayStr();
  let activeTab = 'week';

  /* ─ 날짜 유틸 ─ */
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function isFuture(date) { return date > todayStr(); }
  function isToday(date)  { return date === todayStr(); }

  function getWeekDays(forDate) {
    const d = new Date(forDate + 'T00:00:00');
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      return dd.toISOString().slice(0, 10);
    });
  }

  function dateLabel(date) {
    const d = new Date(date + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }

  function dayName(date) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[new Date(date + 'T00:00:00').getDay()];
  }

  function dayNum(date) { return new Date(date + 'T00:00:00').getDate(); }

  /* ─ 스토어 ─ */
  function getRoutines() { return Store.get('routines') || []; }

  function getLog(date) { return Store.get('routine-log:' + date) || {}; }

  function saveLog(date, log) { Store.set('routine-log:' + date, log); }

  /* ─ 스트릭 계산 (today 기준, 연속 완료일) ─ */
  function calcStreak(routineId) {
    const t = todayStr();
    const todayLog = getLog(t);
    if (!todayLog[routineId]) return 0;
    let streak = 1;
    const d = new Date(t + 'T00:00:00');
    for (let i = 0; i < 365; i++) {
      d.setDate(d.getDate() - 1);
      const ds = d.toISOString().slice(0, 10);
      if (getLog(ds)[routineId]) { streak++; } else { break; }
    }
    return streak;
  }

  /* ─ 공개 액션 ─ */
  function selectDate(date) { selectedDate = date; render(); }

  function prevWeek() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    selectedDate = d.toISOString().slice(0, 10);
    render();
  }

  function nextWeek() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    selectedDate = d.toISOString().slice(0, 10);
    render();
  }

  function goToday() { selectedDate = todayStr(); render(); }

  function setTab(tab) { activeTab = tab; render(); }

  function addRoutine(name) {
    if (!name.trim()) return;
    Store.push('routines', { name: name.trim() });
    render();
    setTimeout(() => { const el = document.getElementById('routine-input'); if (el) el.focus(); }, 0);
  }

  function deleteRoutine(id) { Store.remove('routines', id); render(); }

  function toggleCheck(id) {
    if (isFuture(selectedDate)) return;
    const log = getLog(selectedDate);
    if (log[id]) { delete log[id]; } else { log[id] = true; }
    saveLog(selectedDate, log);
    render();
  }

  /* ─ 날짜 네비 ─ */
  function renderDateNav(routines) {
    const weekDays = getWeekDays(selectedDate);
    const pills = weekDays.map(date => {
      const log  = getLog(date);
      const done = routines.filter(r => log[r.id]).length;
      const all  = routines.length;
      const dotClass = isFuture(date) || all === 0 ? 'none'
        : done === all ? 'full'
        : done > 0    ? 'partial'
        : 'empty';
      return `
        <button class="rdn-day-pill${date === selectedDate ? ' selected' : ''}${isToday(date) ? ' is-today' : ''}${isFuture(date) ? ' future' : ''}"
          onclick="Routine.selectDate('${date}')">
          <span class="rdn-dayname">${dayName(date)}</span>
          <span class="rdn-daynum">${dayNum(date)}</span>
          <span class="rdn-dot ${dotClass}"></span>
        </button>`;
    }).join('');

    const todayBtn = !isToday(selectedDate)
      ? `<button class="rdn-today-btn" onclick="Routine.goToday()">오늘</button>` : '';

    return `
      <div class="routine-date-nav">
        <button class="rdn-arrow" onclick="Routine.prevWeek()">&#8249;</button>
        <div class="rdn-week">${pills}</div>
        <button class="rdn-arrow" onclick="Routine.nextWeek()">&#8250;</button>
        ${todayBtn}
      </div>`;
  }

  /* ─ 주간 매트릭스 ─ */
  function renderWeekMatrix(routines) {
    const weekDays = getWeekDays(selectedDate);

    const headCells = weekDays.map(date => `
      <div class="rmatrix-head ${isToday(date) ? 'today' : ''} ${isFuture(date) ? 'future' : ''}">
        <span class="rmatrix-head-day">${dayName(date)}</span>
        <span class="rmatrix-head-num">${dayNum(date)}</span>
      </div>`).join('');

    const rows = routines.map(r => {
      const cells = weekDays.map(date => {
        if (isFuture(date)) return `<div class="rmatrix-cell future">─</div>`;
        const done = !!getLog(date)[r.id];
        return `<div class="rmatrix-cell ${done ? 'done' : 'miss'}">${done ? '✓' : '✗'}</div>`;
      }).join('');
      return `
        <div class="rmatrix-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</div>
        ${cells}`;
    }).join('');

    if (routines.length === 0) {
      return `<div class="rchart-empty">루틴을 추가하면 주간 현황이 표시됩니다</div>`;
    }

    return `
      <div class="rmatrix-wrap">
        <div class="rmatrix-table" style="grid-template-columns: 1fr repeat(7, 38px)">
          <div class="rmatrix-head-blank"></div>
          ${headCells}
          ${rows}
        </div>
      </div>`;
  }

  /* ─ 30일 바 차트 ─ */
  function renderChart(routines) {
    const days = [];
    for (let i = -29; i <= 0; i++) {
      const d = new Date(todayStr() + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      const log  = getLog(date);
      const done = routines.filter(r => log[r.id]).length;
      const pct  = routines.length ? Math.round(done / routines.length * 100) : 0;
      days.push({ date, pct, isToday: i === 0, day: dayName(date), num: dayNum(date) });
    }

    /* ── 통계 계산 ── */
    const past = days.slice(0, -1); // 오늘 제외

    // 최근 7일 vs 이전 7일 추세
    const recent7 = past.slice(-7);
    const prior7  = past.slice(-14, -7);
    const recentAvg = recent7.length ? Math.round(recent7.reduce((s,d)=>s+d.pct,0)/recent7.length) : 0;
    const priorAvg  = prior7.length  ? Math.round(prior7.reduce((s,d)=>s+d.pct,0)/prior7.length)  : 0;
    const trendDiff = recentAvg - priorAvg;

    // 연속 달성 스트릭 (어제 기준)
    let streak = 0;
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].pct === 100) streak++; else break;
    }

    // 최장 연속 달성
    let bestStreak = 0, cur = 0;
    for (const d of past) {
      if (d.pct === 100) { cur++; bestStreak = Math.max(bestStreak, cur); } else cur = 0;
    }

    // 30일 평균
    const avg30 = past.length ? Math.round(past.reduce((s,d)=>s+d.pct,0)/past.length) : 0;

    // 추세 레이블
    const trendClass = trendDiff > 0 ? 'up' : trendDiff < 0 ? 'down' : 'neutral';
    const trendIcon  = trendDiff > 0 ? '▲' : trendDiff < 0 ? '▼' : '—';
    const trendMsg   = trendDiff > 5  ? '좋아지고 있어요'
                     : trendDiff > 0  ? '소폭 상승 중'
                     : trendDiff === 0 ? '비슷한 수준'
                     : trendDiff > -5  ? '소폭 하락 중'
                     : '주춤하고 있어요';

    /* ── 막대 렌더 ── */
    const maxPct = Math.max(...days.map(d => d.pct), 1);
    const bars = days.map(d => {
      const h         = Math.round(d.pct / maxPct * 100);
      const barClass  = d.pct === 100 ? 'bar-perfect'
                      : d.pct >= 70   ? 'bar-good'
                      : d.pct > 0     ? 'bar-low'
                      : '';
      return `
        <div class="rchart-col${d.isToday ? ' today' : ''}">
          <div class="rchart-pct-label">${d.pct > 0 ? d.pct + '%' : ''}</div>
          <div class="rchart-bar-track">
            <div class="rchart-bar-fill ${barClass}" style="height:${h}%"></div>
          </div>
          <div class="rchart-day-label">${d.day}</div>
          <div class="rchart-date-label">${d.num}</div>
        </div>`;
    }).join('');

    /* ── 통계 푸터 ── */
    const statsFooter = `
      <div class="rchart-stats-footer">
        <div class="rchart-stat-card trend-${trendClass}">
          <div class="rchart-stat-top">
            <span class="rchart-trend-icon">${trendIcon}</span>
            <span class="rchart-stat-val">${trendDiff > 0 ? '+' : ''}${trendDiff}%p</span>
          </div>
          <div class="rchart-stat-label">${trendMsg}</div>
          <div class="rchart-stat-sub">최근 7일 vs 이전 7일</div>
        </div>
        <div class="rchart-stat-card">
          <div class="rchart-stat-val">${avg30}%</div>
          <div class="rchart-stat-label">30일 평균</div>
        </div>
        <div class="rchart-stat-card">
          <div class="rchart-stat-val">${streak > 0 ? streak + '일' : '—'}</div>
          <div class="rchart-stat-label">현재 연속 달성</div>
          <div class="rchart-stat-sub">어제 기준</div>
        </div>
        <div class="rchart-stat-card">
          <div class="rchart-stat-val">${bestStreak > 0 ? bestStreak + '일' : '—'}</div>
          <div class="rchart-stat-label">최장 연속 달성</div>
          <div class="rchart-stat-sub">30일 내 최고</div>
        </div>
      </div>`;

    return `<div class="rchart-grid">${bars}</div>${statsFooter}`;
  }

  /* ─ 메인 렌더 ─ */
  function render() {
    const routines  = getRoutines();
    const log       = getLog(selectedDate);
    const doneCount = routines.filter(r => log[r.id]).length;
    const total     = routines.length;
    const pct       = total ? Math.round(doneCount / total * 100) : 0;
    const future    = isFuture(selectedDate);

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      ${renderDateNav(routines)}

      <div class="routine-layout">

        <!-- 왼쪽: 선택 날짜 루틴 -->
        <div class="routine-left">
          <div class="routine-today-header">
            <div class="routine-date">${dateLabel(selectedDate)}</div>
            ${total > 0 && !future ? `
              <div class="routine-pct-big">${pct}<span class="routine-pct-unit">%</span></div>
              <div class="routine-progress-bar">
                <div class="routine-progress-fill" style="width:${pct}%"></div>
              </div>
              <div class="routine-done-label">${doneCount} / ${total} 완료</div>
            ` : ''}
          </div>

          <div class="routine-list">
            ${total === 0 ? `<div class="routine-empty">루틴을 추가해 매일 달성률을 확인해보세요</div>`
            : routines.map(r => {
              const done    = !!log[r.id];
              const streak  = isToday(selectedDate) ? calcStreak(r.id) : 0;
              const streakBadge = streak >= 3 ? `<span class="routine-streak fire">🔥 ${streak}일</span>`
                : streak > 0 ? `<span class="routine-streak">${streak}일</span>` : '';
              return `
                <div class="routine-item ${done ? 'done' : ''}">
                  <button class="routine-check ${done ? 'checked' : ''} ${future ? 'disabled' : ''}"
                    onclick="Routine.toggleCheck('${r.id}')" ${future ? 'disabled' : ''}>
                    ${done ? '✓' : ''}
                  </button>
                  <span class="routine-name">${escapeHtml(r.name)}</span>
                  ${streakBadge}
                  <button class="routine-delete" onclick="Routine.deleteRoutine('${r.id}')" title="삭제">✕</button>
                </div>`;
            }).join('')}
          </div>

          <div class="routine-add-form">
            <input id="routine-input" class="routine-input" type="text" placeholder="+ 루틴 추가"
              onkeydown="if(event.key==='Enter'){Routine.addRoutine(this.value);this.value='';}">
          </div>
        </div>

        <!-- 오른쪽: 탭 패널 -->
        <div class="routine-right">
          <div class="routine-tab-bar">
            <button class="routine-tab ${activeTab === 'week' ? 'active' : ''}" onclick="Routine.setTab('week')">이번 주 현황</button>
            <button class="routine-tab ${activeTab === 'history' ? 'active' : ''}" onclick="Routine.setTab('history')">30일 기록</button>
          </div>
          <div class="routine-tab-content">
            ${activeTab === 'week' ? renderWeekMatrix(routines) : renderChart(routines)}
          </div>
        </div>

      </div>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, addRoutine, deleteRoutine, toggleCheck, selectDate, prevWeek, nextWeek, goToday, setTab };
})();

document.addEventListener('DOMContentLoaded', () => Routine.render());
