/**
 * roadmap.js — 마일스톤 + 헬로아지 전체 수행도
 */

const Roadmap = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];

  let viewMode = 'list';
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  /* ─ 데이터 ─ */
  function getMilestones() { return Store.get('milestones') || []; }
  function getFeatures()   { return Store.get('features')   || []; }
  function getTasks()      { return Store.get('tasks')      || []; }

  /* ─ 계산 ─ */
  function featureStats() {
    const list = getFeatures();
    const total = list.length;
    const done  = list.filter(f => f.status === '완료').length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    const bySt  = {};
    STATUSES.forEach(s => { bySt[s] = list.filter(f => f.status === s).length; });
    return { total, done, pct, bySt };
  }

  function todayStats() {
    const all   = getTasks();
    const today = new Date().toDateString();
    const list  = all.filter(t => t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === today));
    const done  = list.filter(t => t.done).length;
    return { total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  function nextMilestone() {
    const ms = getMilestones().filter(m => !m.done).sort((a, b) => new Date(a.date) - new Date(b.date));
    return ms[0] || null;
  }

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

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 마일스톤 리스트 뷰 ─ */
  function renderMilestoneList(milestones) {
    return `
      <div class="inline-nl-wrap">
        <div class="inline-nl-label">새 마일스톤 추가</div>
        <input id="ms-input" class="inline-nl-input" type="text"
          placeholder="베타 출시 6월 30일 유저 100명 테스트 시작...">
        <div class="inline-nl-footer">
          <span class="nl-rule-chip">이름</span>
          <span class="nl-rule-chip">날짜</span>
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">필수 · 나머지는 메모로 저장 · Enter로 추가</span>
        </div>
        <div class="inline-nl-status" id="ms-status"></div>
      </div>

      <div class="milestone-list">
        ${milestones.length === 0
          ? '<div class="empty-state"><div class="empty-state-text">첫 마일스톤을 입력해보세요</div></div>'
          : milestones.map(m => {
              const dd = dday(m.date, m.done);
              return `
                <div class="milestone-item ${milestoneClass(m)}">
                  <div class="milestone-check ${m.done ? 'checked' : ''}"
                    onclick="Roadmap.toggleDone('${m.id}')">${m.done ? '✓' : ''}</div>
                  <div class="milestone-body">
                    <div class="milestone-title">${escapeHtml(m.title)}</div>
                    ${m.desc ? `<div class="milestone-desc">${escapeHtml(m.desc)}</div>` : ''}
                  </div>
                  <span class="milestone-date">${formatDate(m.date)}</span>
                  <span class="milestone-dday ${dd.cls}">${dd.label}</span>
                  <div class="milestone-actions">
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
          ? '<div class="cal-hint">등록된 마일스톤이 없어요.<br>리스트 뷰에서 추가해보세요.</div>'
          : ''}
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    const feat   = featureStats();
    const today  = todayStats();
    const next   = nextMilestone();
    const dd     = next ? dday(next.date, next.done) : null;
    const milestones = [...getMilestones()].sort((a, b) => new Date(a.date) - new Date(b.date));

    document.getElementById('app').innerHTML = `
      <!-- 수행도 요약 -->
      <div class="roadmap-summary">
        <div class="summary-card">
          <div class="summary-label">기능 개발 수행도</div>
          <div class="summary-value">${feat.pct}<span>%</span></div>
          <div class="summary-sub">${feat.done} / ${feat.total}개 완료</div>
          <div class="summary-bar"><div class="summary-bar-fill green" style="width:${feat.pct}%"></div></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">오늘 달성률</div>
          <div class="summary-value">${today.pct}<span>%</span></div>
          <div class="summary-sub">${today.done} / ${today.total}개 완료</div>
          <div class="summary-bar"><div class="summary-bar-fill orange" style="width:${today.pct}%"></div></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">다음 마일스톤</div>
          ${next
            ? `<div class="summary-value" style="font-size:1.3rem">${escapeHtml(next.title)}</div>
               <div class="summary-sub">${formatDate(next.date)}</div>
               <div style="margin-top:10px"><span class="milestone-dday ${dd.cls}">${dd.label}</span></div>`
            : `<div class="summary-value" style="font-size:1rem;color:var(--color-text-3)">없음</div>
               <div class="summary-sub">마일스톤을 추가해보세요</div>`
          }
        </div>
      </div>

      <!-- 기능 개발 현황 -->
      <div class="feature-status-section">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="section-title" style="margin:0">기능 개발 현황</div>
          <span style="font-size:0.78rem;color:var(--color-text-3)">전체 ${feat.total}개</span>
        </div>
        <div class="feature-status-bars">
          ${STATUSES.map(s => `
            <div class="status-bar-row">
              <span class="status-bar-label">${s}</span>
              <div class="status-bar-track">
                <div class="status-bar-fill ${s}"
                  style="width:${feat.total ? Math.round(feat.bySt[s] / feat.total * 100) : 0}%"></div>
              </div>
              <span class="status-bar-count">${feat.bySt[s]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 마일스톤 -->
      <div class="milestone-section">
        <div class="ms-section-hd">
          <div class="section-title">마일스톤</div>
          <div class="ms-view-tabs">
            <button class="ms-view-tab ${viewMode === 'list' ? 'active' : ''}"
              onclick="Roadmap.setView('list')">≡ 리스트</button>
            <button class="ms-view-tab ${viewMode === 'calendar' ? 'active' : ''}"
              onclick="Roadmap.setView('calendar')">☷ 캘린더</button>
          </div>
        </div>
        ${viewMode === 'list' ? renderMilestoneList(milestones) : renderCalendarView(milestones)}
      </div>
    `;

    if (viewMode === 'list') bindMsInput();
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

  function setView(mode) {
    viewMode = mode;
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

  return { render, toggleDone, deleteMilestone, setView, prevMonth, nextMonth };
})();

document.addEventListener('DOMContentLoaded', () => Roadmap.render());
