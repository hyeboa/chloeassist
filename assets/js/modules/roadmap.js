/**
 * roadmap.js — 마일스톤 + 헬로아지 전체 수행도
 */

const Roadmap = (() => {
  let calYear       = new Date().getFullYear();
  let calMonth      = new Date().getMonth();
  let activeTab     = 'schedule';
  let pageMode      = 'schedule'; // 'goals' | 'schedule' | 'milestones'
  let expandedGoals = new Set();

  /* ─ 데이터 ─ */
  function getMilestones() { return Store.get('milestones') || []; }
  function getGoals()      { return Store.get('goals')      || []; }

  /* ─ D-day ─ */
  function dday(dateStr, done) {
    if (done) return { label: '완료', cls: 'dday-done' };
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff === 0)  return { label: 'D-Day', cls: 'dday-today' };
    if (diff < 0)    return { label: `D+${Math.abs(diff)}`, cls: 'dday-overdue' };
    if (diff <= 14)  return { label: `D-${diff}`, cls: 'dday-soon' };
    return { label: `D-${diff}`, cls: 'dday-future' };
  }

  function milestoneClass(m) {
    if (m.done) return 'done';
    const diff = Math.ceil((new Date(m.date) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff < 0) return 'overdue';
    return 'upcoming';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 마일스톤 추가 입력 ─ */
  function renderAddInput() {
    return `
      <div class="inline-nl-wrap">
        <div class="inline-nl-label">새 마일스톤 추가 <span class="ai-badge">✦ AI</span></div>
        <input id="ms-input" class="inline-nl-input" type="text"
          placeholder="베타 출시 6월 30일 유저 100명 테스트 시작...">
        <div class="inline-nl-footer">
          <span class="nl-rule-chip">이름</span>
          <span class="nl-rule-chip">날짜</span>
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">필수 · 나머지는 메모로 저장 · Enter로 추가</span>
        </div>
        <div class="inline-nl-status" id="ms-status"></div>
      </div>`;
  }

  /* ─ 마일스톤 리스트 ─ */
  function renderMilestoneList(milestones) {
    if (milestones.length === 0) return `
      <div class="ms-list-empty">
        <div style="font-size:2rem;opacity:0.5;margin-bottom:10px">🏁</div>
        <div style="font-size:0.95rem;color:var(--color-text-2);font-weight:500">마일스톤이 없어요</div>
        <div style="font-size:0.85rem;color:var(--color-text-3);margin-top:4px">위 입력창에서 추가해보세요</div>
      </div>`;
    const goals = getGoals();
    return `
      <div class="milestone-list">
        ${milestones.map(m => {
              const dd = dday(m.date, m.done);
              return `
                <div class="milestone-item ${milestoneClass(m)}">
                  <div class="milestone-check ${m.done ? 'checked' : ''}"
                    onclick="Roadmap.toggleDone('${m.id}')">${m.done ? '✓' : ''}</div>
                  <div class="milestone-title">${escapeHtml(m.title)}</div>
                  <span class="milestone-dday ${dd.cls}">${dd.label}</span>
                  <div class="milestone-actions">
                    <select class="ms-goal-select"
                      onchange="Roadmap.assignMilestoneGoal('${m.id}', this.value || null)"
                      title="목표에 연결">
                      <option value="">목표 연결 안함</option>
                      ${goals.map((g, i) => `
                        <option value="${g.id}" ${m.goalId === g.id ? 'selected' : ''}>${i + 1}차 · ${escapeHtml(g.title)}</option>
                      `).join('')}
                    </select>
                    <button class="ms-del-btn" onclick="Roadmap.deleteMilestone('${m.id}')">삭제</button>
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>
    `;
  }

  /* ─ 마일스톤 캘린더 뷰 ─ */
  function renderCalendarView(milestones) {
    const today    = new Date();
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay  = new Date(calYear, calMonth + 1, 0);

    const msMap = {};
    milestones.forEach(m => {
      if (!msMap[m.date]) msMap[m.date] = [];
      msMap[m.date].push(m);
    });

    const days     = [];
    const padStart = firstDay.getDay();
    for (let i = padStart - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      days.push({ date: d, thisMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(calYear, calMonth, i), thisMonth: true });
    }
    while (days.length % 7 !== 0 || days.length < 35) {
      const last = days[days.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      days.push({ date: d, thisMonth: false });
    }

    const todayStr = today.toDateString();
    const isNow    = calYear === today.getFullYear() && calMonth === today.getMonth();
    const DOW      = ['일', '월', '화', '수', '목', '금', '토'];

    return `
      <div class="cal-wrap">
        <div class="cal-nav">
          <button class="cal-nav-btn" onclick="Roadmap.prevMonth()">← 이전</button>
          <div class="cal-month-label">
            ${calYear}년 ${calMonth + 1}월
            ${isNow ? '<span class="cal-current-badge">이번 달</span>' : ''}
          </div>
          <button class="cal-nav-btn" onclick="Roadmap.nextMonth()">다음 →</button>
        </div>

        <div class="cal-grid">
          ${DOW.map((d, i) => `
            <div class="cal-dow${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${d}</div>
          `).join('')}

          ${days.map(({ date, thisMonth }) => {
            const key     = date.toISOString().slice(0, 10);
            const msList  = msMap[key] || [];
            const isToday = date.toDateString() === todayStr;
            const isSun   = date.getDay() === 0;
            const isSat   = date.getDay() === 6;
            return `
              <div class="cal-cell${!thisMonth ? ' other-month' : ''}${isToday ? ' is-today' : ''}${msList.length ? ' has-ms' : ''}">
                <div class="cal-date-num${isToday ? ' today-num' : ''}${isSun ? ' sun' : isSat ? ' sat' : ''}">${date.getDate()}</div>
                <div class="cal-ms-list">
                  ${msList.map(m => {
                    const dd  = dday(m.date, m.done);
                    const cls = m.done ? 'dday-done' : dd.cls;
                    return `<div class="cal-ms-item ${cls}" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</div>`;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${milestones.length === 0
          ? '<div class="cal-hint">등록된 마일스톤이 없어요.<br>마일스톤 탭에서 추가해보세요.</div>'
          : ''}
      </div>
    `;
  }

  /* ═══ 단계별 목표 ═══ */
  function checkSvg() {
    return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function goalProgress(goal) {
    const items  = goal.items || [];
    const linked = getMilestones().filter(m => m.goalId === goal.id);
    const total  = items.length + linked.length;
    const done   = items.filter(i => i.done).length + linked.filter(m => m.done).length;
    const pct    = total ? Math.round(done / total * 100) : 0;
    return { total, done, pct };
  }

  function renderGoalStrip(goals) {
    if (goals.length === 0) return '';

    const firstIncompleteIdx = goals.findIndex(g => goalProgress(g).pct < 100);

    const segs = goals.map((g, i) => {
      const { pct } = goalProgress(g);
      const isDone   = pct === 100;
      const isActive = i === firstIncompleteIdx;
      const dd       = g.targetDate ? dday(g.targetDate, isDone) : null;
      let state, flexVal;
      if (isDone)        { state = 'done';     flexVal = 0.6; }
      else if (isActive) { state = 'active';   flexVal = 3;   }
      else if (pct > 0)  { state = 'progress'; flexVal = 1.5; }
      else               { state = 'waiting';  flexVal = 1;   }
      return { g, i, pct, isDone, isActive, dd, state, flexVal };
    });

    const trackSegs = segs.map(({ pct, state, flexVal }) => `
      <div class="pipeline-seg ${state}" style="flex:${flexVal}">
        <div class="pipeline-fill" style="width:${pct}%"></div>
      </div>`).join('');

    const labelSegs = segs.map(({ g, i, pct, isDone, isActive, dd, state, flexVal }) => `
      <a href="goals.html" class="pipeline-label ${state}" style="flex:${flexVal}">
        <span class="pl-badge">${i + 1}차</span>
        <span class="pl-title">${escapeHtml(g.title)}</span>
        ${isDone
          ? '<span class="pl-chip done">완료</span>'
          : isActive
            ? `<div class="pl-meta">${dd ? `<span class="pl-dday ${dd.cls}">${dd.label}</span>` : ''}<span class="pl-pct">${pct}%</span></div>`
            : pct > 0
              ? `<span class="pl-pct">${pct}%</span>`
              : '<span class="pl-chip waiting">대기</span>'}
      </a>`).join('');

    return `
      <div class="goal-pipeline">
        <div class="pipeline-track">${trackSegs}</div>
        <div class="pipeline-labels">${labelSegs}</div>
      </div>`;
  }

  function renderGoalsSection() {
    const goals = getGoals();
    return `
      <div class="goals-section">
        <div class="ms-section-hd">
          <div class="section-title" style="margin:0">단계별 목표</div>
          <span class="ms-section-meta">전체 ${goals.length}개</span>
        </div>
        ${goals.length === 0
          ? '<div class="goal-empty">아직 목표가 없어요. 1차 목표부터 추가해보세요.</div>'
          : goals.map((g, i) => renderGoalCard(g, i)).join('')}
        ${renderAddGoalInput()}
      </div>`;
  }

  function chevronSvg() {
    return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderGoalCard(goal, index) {
    const { done, total: t, pct } = goalProgress(goal);
    const expanded  = expandedGoals.has(goal.id);
    const isDone    = pct === 100;
    const dd        = goal.targetDate ? dday(goal.targetDate, isDone) : null;
    const urgent    = dd && (dd.cls === 'dday-today' || dd.cls === 'dday-overdue' || dd.cls === 'dday-soon');
    const fillCls   = isDone ? 'goal-fill-done' : urgent ? 'goal-fill-urgent' : 'goal-fill-normal';
    const cardState = isDone ? ' done' : urgent ? ' urgent' : '';
    return `
      <div class="goal-card${cardState}${expanded ? ' expanded' : ''}">
        <div class="goal-card-head">
          <button class="goal-expand-btn${expanded ? ' expanded' : ''}"
            onclick="Roadmap.toggleExpand('${goal.id}')"
            title="${expanded ? '접기' : '펼치기'}">${chevronSvg()}</button>
          <span class="goal-phase-badge">${index + 1}차 목표</span>
          <input class="goal-title-edit" value="${escapeHtml(goal.title)}"
            onblur="Roadmap.editGoalTitle('${goal.id}', this.value)"
            onkeydown="if(event.key==='Enter')this.blur()">
          ${dd ? `<span class="goal-dday ${dd.cls}">${dd.label}</span>` : ''}
          <span class="goal-progress-compact">${done}/${t}</span>
          <button class="goal-del-btn" onclick="Roadmap.deleteGoal('${goal.id}')" title="목표 삭제">✕</button>
        </div>
        <div class="goal-bar-wrap">
          <div class="summary-bar goal-bar"><div class="summary-bar-fill ${fillCls}" style="width:${pct}%"></div></div>
          <span class="goal-bar-pct">${pct}%</span>
        </div>
        ${expanded ? `
          <div class="goal-detail">
            <div class="goal-date-row">
              <label class="goal-date-label">목표 날짜</label>
              <input type="date" class="goal-date-input" value="${goal.targetDate || ''}"
                onchange="Roadmap.setGoalDate('${goal.id}', this.value)">
              ${goal.targetDate ? `<button class="goal-date-clear" onclick="Roadmap.setGoalDate('${goal.id}', '')">지우기</button>` : ''}
            </div>
            ${renderChecklist(goal)}
            ${isDone ? '' : renderAddItemInput(goal.id)}
          </div>` : ''}
      </div>`;
  }

  function renderChecklist(goal) {
    const items  = goal.items || [];
    const linked = getMilestones().filter(m => m.goalId === goal.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (items.length === 0 && linked.length === 0) {
      return '<div class="goal-checklist-empty">항목을 추가하거나 마일스톤을 연결하세요</div>';
    }

    const itemRows = items.map(it => `
      <div class="mp-task-item${it.done ? ' done' : ''}">
        <div class="mp-task-main">
          <button class="mp-check${it.done ? ' checked' : ''}"
            onclick="Roadmap.toggleItem('${goal.id}','${it.id}')" title="${it.done ? '완료 해제' : '완료'}">
            ${it.done ? checkSvg() : ''}
          </button>
          <span class="mp-task-title">${escapeHtml(it.text)}</span>
          <button class="mp-delete" onclick="Roadmap.deleteItem('${goal.id}','${it.id}')" title="삭제">✕</button>
        </div>
      </div>`).join('');

    const msRows = linked.map(m => {
      const d = dday(m.date, m.done);
      return `
        <div class="mp-task-item${m.done ? ' done' : ''}">
          <div class="mp-task-main">
            <button class="mp-check${m.done ? ' checked' : ''}"
              onclick="Roadmap.toggleDone('${m.id}')" title="${m.done ? '완료 해제' : '완료'}">
              ${m.done ? checkSvg() : ''}
            </button>
            <span class="goal-ms-tag">마일스톤</span>
            <span class="mp-task-title">${escapeHtml(m.title)}</span>
            <span class="milestone-dday ${d.cls}">${d.label}</span>
            <button class="mp-delete" onclick="Roadmap.assignMilestoneGoal('${m.id}', null)" title="연결 해제">✕</button>
          </div>
        </div>`;
    }).join('');

    return `<div class="goal-checklist">${itemRows}${msRows}</div>`;
  }

  function renderAddGoalInput() {
    return `
      <div class="mp-add-row goal-add-row">
        <input id="goal-add-input" class="mp-add-input" type="text" placeholder="새 단계 목표 추가">
        <span class="mp-add-hint">Enter</span>
      </div>`;
  }

  function renderAddItemInput(goalId) {
    return `
      <div class="mp-add-row goal-item-add-row">
        <input class="mp-add-input goal-item-add-input" type="text" data-goal="${goalId}" placeholder="세부 항목 추가">
        <span class="mp-add-hint">Enter</span>
      </div>`;
  }

  /* ─ 렌더 ─ */
  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    const milestones = [...getMilestones()].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (pageMode === 'goals') {
      app.innerHTML = `
        <div class="goals-page-layout">
          <div class="goals-page-left">
            ${renderGoalsSection()}
          </div>
          <div class="goals-page-right">
            <div class="milestone-section">
              <div class="ms-section-hd">
                <div class="section-title" style="margin:0">마일스톤</div>
                <span class="ms-section-meta">전체 ${milestones.length}개</span>
              </div>
              <div class="ms-col-list">
                ${renderAddInput()}
                ${renderMilestoneList(milestones)}
              </div>
            </div>
          </div>
        </div>`;
      bindGoalInputs();
      bindMsInput();
      return;
    }

    if (pageMode === 'schedule') {
      const goals = getGoals();
      app.innerHTML = `
        ${renderGoalStrip(goals)}
        <div class="milestone-section">
          <div class="ms-section-hd">
            <div class="section-title" style="margin:0">스케줄</div>
            <span class="ms-section-meta">마일스톤 ${milestones.length}개</span>
          </div>
          ${renderCalendarView(milestones)}
        </div>`;
      return;
    }

    if (pageMode === 'milestones') {
      app.innerHTML = `
        <div class="milestone-section">
          <div class="ms-section-hd">
            <div class="section-title" style="margin:0">마일스톤</div>
            <span class="ms-section-meta">전체 ${milestones.length}개</span>
          </div>
          <div class="ms-col-list">
            ${renderAddInput()}
            ${renderMilestoneList(milestones)}
          </div>
        </div>`;
      bindMsInput();
      return;
    }
  }

  function bindGoalInputs() {
    const goalInput = document.getElementById('goal-add-input');
    goalInput?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const v = goalInput.value.trim();
      if (!v) return;
      addGoal(v);
    });

    document.querySelectorAll('.goal-item-add-input').forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        const v = inp.value.trim();
        if (!v) return;
        addItem(inp.dataset.goal, v);
      });
    });
  }

  function bindMsInput() {
    const input  = document.getElementById('ms-input');
    const status = document.getElementById('ms-status');
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
        const result = await NLInput.parse('milestone', text);
        Store.push('milestones', { title: result.title, date: result.date, desc: result.desc || '', done: false });
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

  function toggleDone(id) {
    const ms = getMilestones().find(m => m.id === id);
    if (!ms) return;
    Store.update('milestones', id, { done: !ms.done, doneAt: !ms.done ? Date.now() : null });
    render();
  }

  function deleteMilestone(id) {
    Store.remove('milestones', id);
    render();
  }

  /* ─ 목표 동작 ─ */
  function addGoal(title) {
    Store.push('goals', { title: title.trim(), items: [] });
    render();
  }

  function editGoalTitle(id, text) {
    const t = text.trim();
    if (!t) { render(); return; }
    Store.update('goals', id, { title: t });
  }

  function deleteGoal(id) {
    if (!confirm('이 목표를 삭제할까요? 연결된 마일스톤은 삭제되지 않고 연결만 해제됩니다.')) return;
    getMilestones()
      .filter(m => m.goalId === id)
      .forEach(m => Store.update('milestones', m.id, { goalId: null }));
    Store.remove('goals', id);
    render();
  }

  function moveGoalUp(id) {
    const goals = getGoals();
    const i = goals.findIndex(g => g.id === id);
    if (i <= 0) return;
    [goals[i - 1], goals[i]] = [goals[i], goals[i - 1]];
    Store.set('goals', goals);
    render();
  }

  function moveGoalDown(id) {
    const goals = getGoals();
    const i = goals.findIndex(g => g.id === id);
    if (i < 0 || i >= goals.length - 1) return;
    [goals[i + 1], goals[i]] = [goals[i], goals[i + 1]];
    Store.set('goals', goals);
    render();
  }

  function addItem(goalId, text) {
    const goal = getGoals().find(g => g.id === goalId);
    if (!goal) return;
    const items = [...(goal.items || []), { id: crypto.randomUUID(), text: text.trim(), done: false }];
    Store.update('goals', goalId, { items });
    render();
  }

  function toggleItem(goalId, itemId) {
    const goal = getGoals().find(g => g.id === goalId);
    if (!goal) return;
    const items = (goal.items || []).map(it => it.id === itemId ? { ...it, done: !it.done } : it);
    Store.update('goals', goalId, { items });
    render();
  }

  function deleteItem(goalId, itemId) {
    const goal = getGoals().find(g => g.id === goalId);
    if (!goal) return;
    const items = (goal.items || []).filter(it => it.id !== itemId);
    Store.update('goals', goalId, { items });
    render();
  }

  function toggleExpand(id) {
    if (expandedGoals.has(id)) expandedGoals.delete(id);
    else expandedGoals.add(id);
    render();
  }

  function setGoalDate(id, date) {
    Store.update('goals', id, { targetDate: date || null });
    render();
  }

  function assignMilestoneGoal(milestoneId, goalId) {
    Store.update('milestones', milestoneId, { goalId: goalId || null });
    render();
  }

  function setTab(tab) {
    activeTab = tab;
    render();
  }

  function prevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    render();
  }

  function nextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    render();
  }

  function setPageMode(mode) { pageMode = mode; }

  return {
    render, toggleDone, deleteMilestone, prevMonth, nextMonth, setTab, setPageMode,
    addGoal, editGoalTitle, deleteGoal, moveGoalUp, moveGoalDown,
    addItem, toggleItem, deleteItem, assignMilestoneGoal,
    toggleExpand, setGoalDate,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'goals.html')      Roadmap.setPageMode('goals');
  else if (page === 'milestones.html') Roadmap.setPageMode('milestones');
  else                             Roadmap.setPageMode('schedule');
  Roadmap.render();
});
