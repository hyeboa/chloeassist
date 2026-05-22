/**
 * timeline.js — 헬로아지 전체 일정 타임라인
 */

const Timeline = (() => {
  const DAY_W = 26; // px per day
  const CATS  = ['기획', '디자인', '개발', '마케팅', '운영'];

  function getMilestones() { return Store.get('milestones') || []; }
  function getTasks()      { return Store.get('tasks')      || []; }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function startOfDay(d) {
    const r = new Date(d); r.setHours(0,0,0,0); return r;
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  function shortDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function dday(dateStr) {
    const today  = startOfDay(new Date());
    const target = startOfDay(new Date(dateStr));
    const diff   = daysBetween(today, target);
    if (diff  >  30) return { label: `D-${diff}`,         cls: 'far' };
    if (diff  >   0) return { label: `D-${diff}`,         cls: 'near' };
    if (diff === 0)  return { label: 'D-Day',              cls: 'soon' };
    return               { label: `D+${Math.abs(diff)}`, cls: 'overdue' };
  }

  /* ─ 눈금자 HTML ─ */
  function renderRuler(startDate, endDate) {
    const cells = [];
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (d <= endDate) {
      const x = daysBetween(startDate, d) * DAY_W;
      const w = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() * DAY_W;
      cells.push(`<div class="tl-ruler-cell" style="left:${x}px;width:${w}px">${d.getMonth() + 1}월</div>`);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return cells.join('');
  }

  /* ─ 메인 렌더 ─ */
  function render() {
    const milestones  = getMilestones().sort((a, b) => new Date(a.date) - new Date(b.date));
    const allTasks    = getTasks();
    const datedTasks  = allTasks.filter(t => t.dueDate);
    const today       = startOfDay(new Date());

    /* 날짜 범위 계산 */
    const allDates = [
      ...milestones.map(m => startOfDay(new Date(m.date))),
      ...datedTasks.map(t => startOfDay(new Date(t.dueDate))),
    ];

    const earliest = allDates.length ? new Date(Math.min(...allDates)) : today;
    const latest   = allDates.length ? new Date(Math.max(...allDates)) : today;

    /* 월 단위로 스냅 */
    const rawStart = new Date(Math.min(today.getTime() - 45 * 86400000, earliest.getTime() - 14 * 86400000));
    const startDate = new Date(rawStart.getFullYear(), rawStart.getMonth(), 1);

    const rawEnd = new Date(Math.max(today.getTime() + 90 * 86400000, latest.getTime() + 14 * 86400000));
    const endDate = new Date(rawEnd.getFullYear(), rawEnd.getMonth() + 1, 0);

    const totalWidth = (daysBetween(startDate, endDate) + 1) * DAY_W;
    const todayX     = daysBetween(startDate, today) * DAY_W;

    /* 통계 */
    const totalMs   = milestones.length;
    const doneMs    = milestones.filter(m => m.done).length;
    const overdueMs = milestones.filter(m => !m.done && new Date(m.date) < today).length;
    const upcoming  = milestones.filter(m => !m.done && new Date(m.date) >= today);
    const nextMs    = upcoming[0] || null;
    const ddNext    = nextMs ? dday(nextMs.date) : null;

    const doneTasks    = datedTasks.filter(t => t.done).length;
    const overdueTasks = datedTasks.filter(t => !t.done && new Date(t.dueDate) < today).length;

    /* 카테고리별 태스크 */
    const tasksByCat = {};
    CATS.forEach(cat => { tasksByCat[cat] = datedTasks.filter(t => t.category === cat); });

    /* 마일스톤 핀 HTML */
    const msPins = milestones.map((m, i) => {
      const x         = daysBetween(startDate, startOfDay(new Date(m.date))) * DAY_W;
      const doneCls   = m.done ? 'ms-done' : '';
      const overCls   = !m.done && new Date(m.date) < today ? 'ms-overdue' : '';
      const isAbove   = i % 2 === 0;
      const title     = `<div class="tl-ms-text">${escapeHtml(m.title)}</div>`;
      const diamond   = `<div class="tl-ms-diamond"></div>`;
      const date      = `<div class="tl-ms-date-text">${shortDate(m.date)}</div>`;
      const inner     = isAbove ? `${title}${diamond}${date}` : `${date}${diamond}${title}`;
      return `<div class="tl-ms-pin ${doneCls} ${overCls}" style="left:${x}px">${inner}</div>`;
    }).join('');

    /* 태스크 점 HTML */
    const taskRows = CATS.map(cat => {
      const dots = tasksByCat[cat].map(t => {
        const x       = daysBetween(startDate, startOfDay(new Date(t.dueDate))) * DAY_W;
        const doneCls = t.done ? 'task-done' : '';
        const overCls = !t.done && new Date(t.dueDate) < today ? 'task-overdue' : '';
        return `
          <div class="tl-task-dot cat-tl-${cat} ${doneCls} ${overCls}" style="left:${x}px">
            <div class="tl-task-tooltip">${escapeHtml(t.title)}<br><span style="opacity:0.55">${formatDate(t.dueDate)}</span></div>
          </div>`;
      }).join('');
      return `<div class="tl-row tl-row-tasks">${dots}</div>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      <!-- 요약 카드 -->
      <div class="tl-summary">
        <div class="tl-stat-card">
          <div class="tl-stat-label">마일스톤 달성</div>
          <div class="tl-stat-value">${doneMs}<span class="tl-stat-of"> / ${totalMs}</span></div>
          <div class="tl-progress-bar">
            <div class="tl-progress-fill" style="width:${totalMs ? Math.round(doneMs / totalMs * 100) : 0}%"></div>
          </div>
          ${overdueMs > 0
            ? `<div class="tl-stat-warn">⚠ ${overdueMs}개 기한 지남</div>`
            : `<div class="tl-stat-ok">일정대로 진행 중</div>`}
        </div>
        <div class="tl-stat-card">
          <div class="tl-stat-label">기한 있는 할 일</div>
          <div class="tl-stat-value">${doneTasks}<span class="tl-stat-of"> / ${datedTasks.length}</span></div>
          <div class="tl-progress-bar">
            <div class="tl-progress-fill green" style="width:${datedTasks.length ? Math.round(doneTasks / datedTasks.length * 100) : 0}%"></div>
          </div>
          ${overdueTasks > 0
            ? `<div class="tl-stat-warn">⚠ ${overdueTasks}개 기한 지남</div>`
            : `<div class="tl-stat-ok">${datedTasks.length ? '기한 내 처리 중' : '기한 있는 할 일 없음'}</div>`}
        </div>
        <div class="tl-stat-card">
          <div class="tl-stat-label">다음 마일스톤</div>
          ${nextMs
            ? `<div class="tl-stat-ms-title">${escapeHtml(nextMs.title)}</div>
               <div class="tl-stat-ms-date">${formatDate(nextMs.date)}</div>
               <span class="tl-dday-badge tl-dday-${ddNext.cls}">${ddNext.label}</span>`
            : `<div class="tl-stat-ms-title" style="color:var(--color-text-3)">모든 마일스톤 완료!</div>`}
        </div>
      </div>

      <!-- 타임라인 -->
      <div class="tl-section">
        <div class="tl-section-title">타임라인</div>
        <div class="tl-outer">
          <!-- 왼쪽 행 라벨 -->
          <div class="tl-labels">
            <div class="tl-ruler-spacer"></div>
            <div class="tl-row-label tl-label-ms">마일스톤</div>
            ${CATS.map(c => `<div class="tl-row-label tl-label-cat">${c}</div>`).join('')}
          </div>
          <!-- 타임라인 캔버스 -->
          <div class="tl-canvas" id="tl-canvas">
            <div class="tl-inner" style="width:${totalWidth}px">
              <div class="tl-ruler">${renderRuler(startDate, endDate)}</div>
              <div class="tl-today-line" style="left:${todayX}px">
                <div class="tl-today-tag">오늘</div>
              </div>
              <div class="tl-row tl-row-ms">${msPins}</div>
              ${taskRows}
            </div>
          </div>
        </div>
        ${datedTasks.length === 0
          ? `<div class="tl-hint">기한이 등록된 할 일이 없어요. 할 일 목록에서 "오늘로" 버튼으로 날짜를 지정하면 여기에 표시돼요.</div>`
          : ''}
      </div>

      <!-- 다가오는 마일스톤 -->
      ${upcoming.length > 0 ? `
      <div class="tl-section">
        <div class="tl-section-title">다가오는 마일스톤</div>
        <div class="tl-upcoming-list">
          ${upcoming.map(m => {
            const dd = dday(m.date);
            return `
              <div class="tl-upcoming-item">
                <span class="tl-dday-badge tl-dday-${dd.cls}">${dd.label}</span>
                <div class="tl-upcoming-info">
                  <span class="tl-upcoming-title">${escapeHtml(m.title)}</span>
                  ${m.desc ? `<span class="tl-upcoming-desc">${escapeHtml(m.desc)}</span>` : ''}
                </div>
                <span class="tl-upcoming-date">${formatDate(m.date)}</span>
              </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    `;

    /* 오늘 위치로 자동 스크롤 */
    const canvas = document.getElementById('tl-canvas');
    if (canvas) {
      requestAnimationFrame(() => {
        canvas.scrollLeft = Math.max(0, todayX - canvas.clientWidth / 3);
      });
    }

    /* 드래그 스크롤 */
    bindDragScroll(canvas);
  }

  /* ─ 드래그로 좌우 스크롤 ─ */
  function bindDragScroll(el) {
    if (!el) return;
    let startX = 0, startLeft = 0, dragging = false;
    el.addEventListener('mousedown', e => {
      dragging  = true;
      startX    = e.pageX;
      startLeft = el.scrollLeft;
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      el.scrollLeft = startLeft - (e.pageX - startX);
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  return { render };
})();

document.addEventListener('DOMContentLoaded', () => Timeline.render());
