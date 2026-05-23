/**
 * hello.js — 헬로아지 한눈에 보기 (통합 패널)
 */

const Hello = (() => {
  function getMilestones() { return Store.get('milestones')      || []; }
  function getFeatures()   { return Store.get('features')        || []; }
  function getTasks()      { return Store.get('tasks')           || []; }
  function getScreens()    { return Store.get('sitemapScreens')  || []; }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function dday(dateStr) {
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff === 0) return { label: 'D-Day',           cls: 'today' };
    if (diff < 0)   return { label: `D+${Math.abs(diff)}`, cls: 'overdue' };
    if (diff <= 7)  return { label: `D-${diff}`,       cls: 'soon' };
    if (diff <= 21) return { label: `D-${diff}`,       cls: 'near' };
    return            { label: `D-${diff}`,            cls: 'far' };
  }

  function fmtShort(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function fmtLong(str) {
    const d = new Date(str);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  }

  function weekRange() {
    const today = new Date();
    const day   = today.getDay();
    const mon   = new Date(today);
    mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { today, mon, sun };
  }

  /* ─ 다음 마일스톤 카드 ─ */
  function renderMilestone() {
    const upcoming = getMilestones()
      .filter(m => !m.done && m.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
      return `
        <a class="hello-ms-card empty" href="roadmap.html">
          <div class="hello-ms-label">다음 마일스톤</div>
          <div class="hello-ms-title">예정된 마일스톤이 없어요</div>
          <div class="hello-ms-sub">로드맵에서 추가해보세요 →</div>
        </a>`;
    }

    const ms   = upcoming[0];
    const dd   = dday(ms.date);
    const rest = upcoming.slice(1, 3);

    return `
      <a class="hello-ms-card dday-${dd.cls}" href="roadmap.html">
        <div class="hello-ms-header">
          <span class="hello-ms-label">다음 마일스톤</span>
          <span class="hello-ms-link">로드맵에서 보기 →</span>
        </div>
        <div class="hello-ms-main">
          <div class="hello-ms-title">${escapeHtml(ms.title)}</div>
          <div class="hello-ms-dday">${dd.label}</div>
        </div>
        <div class="hello-ms-date">${fmtLong(ms.date)}</div>
        ${ms.desc ? `<div class="hello-ms-desc">${escapeHtml(ms.desc)}</div>` : ''}
        ${rest.length ? `
          <div class="hello-ms-rest">
            그 다음: ${rest.map(m => `${escapeHtml(m.title)} <span class="hello-ms-rest-date">${fmtShort(m.date)}</span>`).join(' · ')}
          </div>` : ''}
      </a>`;
  }

  /* ─ 전체 진행도 3칸 ─ */
  function renderProgress() {
    const milestones = getMilestones();
    const features   = getFeatures();
    const screens    = getScreens();

    const items = [
      { label: '마일스톤 달성', done: milestones.filter(m => m.done).length,                total: milestones.length, href: 'roadmap.html', color: 'orange' },
      { label: '기능 완료',     done: features.filter(f => f.status === '완료').length,    total: features.length,   href: 'projects.html', color: 'green' },
      { label: '화면 완료',     done: screens.filter(s => s.status === '완료').length,     total: screens.length,    href: 'sitemap.html',  color: 'blue' },
    ];

    return `
      <div class="hello-progress-grid">
        ${items.map(i => {
          const pct = i.total ? Math.round(i.done / i.total * 100) : 0;
          return `
            <a class="hello-progress-card" href="${i.href}">
              <div class="hello-progress-label">${i.label}</div>
              <div class="hello-progress-value">${i.done}<span> / ${i.total}</span></div>
              <div class="hello-progress-bar">
                <div class="hello-progress-bar-fill ${i.color}" style="width:${pct}%"></div>
              </div>
              <div class="hello-progress-pct">${pct}%</div>
            </a>`;
        }).join('')}
      </div>`;
  }

  /* ─ 진행 중 기능 ─ */
  function renderFeatures() {
    const features = getFeatures();
    const tasks    = getTasks();
    const ACTIVE   = ['기획중', '디자인중', '개발중'];
    const STATUS_ORDER = { '개발중': 0, '디자인중': 1, '기획중': 2 };

    const active = features
      .filter(f => ACTIVE.includes(f.status))
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

    if (active.length === 0) {
      return `
        <div class="hello-section">
          <div class="hello-section-hd">
            <span>진행 중 기능</span>
            <a class="hello-section-link" href="projects.html">기능 보드 →</a>
          </div>
          <div class="hello-empty">진행 중인 기능이 없어요</div>
        </div>`;
    }

    const top = active.slice(0, 5);

    return `
      <div class="hello-section">
        <div class="hello-section-hd">
          <span>진행 중 기능 <span class="hello-count">${active.length}</span></span>
          <a class="hello-section-link" href="projects.html">기능 보드 →</a>
        </div>
        ${top.map(f => {
          const ftasks = tasks.filter(t => t.featureId === f.id);
          const done   = ftasks.filter(t => t.done).length;
          const pct    = ftasks.length ? Math.round(done / ftasks.length * 100) : 0;
          return `
            <a class="hello-feat-row" href="projects.html">
              <span class="hello-feat-status status-${f.status}">${f.status}</span>
              <span class="hello-feat-name">${escapeHtml(f.name)}</span>
              ${ftasks.length ? `
                <div class="hello-feat-bar">
                  <div class="hello-feat-bar-fill" style="width:${pct}%"></div>
                </div>
                <span class="hello-feat-pct">${done}/${ftasks.length}</span>` : `
                <span class="hello-feat-empty">할 일 없음</span>`}
            </a>`;
        }).join('')}
        ${active.length > 5 ? `<div class="hello-more">+ ${active.length - 5}개 더</div>` : ''}
      </div>`;
  }

  /* ─ 이번 주 할 일 ─ */
  function renderWeekTasks() {
    const { today, mon, sun } = weekRange();

    const tasks = getTasks()
      .filter(t => !t.done && (
        (t.isToday && today >= mon && today <= sun) ||
        (t.dueDate && new Date(t.dueDate) >= mon && new Date(t.dueDate) <= sun)
      ))
      .sort((a, b) => {
        if (!!b.starred !== !!a.starred) return b.starred ? 1 : -1;
        const aD = a.dueDate ? new Date(a.dueDate).getTime() : (a.isToday ? today.getTime() : Infinity);
        const bD = b.dueDate ? new Date(b.dueDate).getTime() : (b.isToday ? today.getTime() : Infinity);
        return aD - bD;
      });

    if (tasks.length === 0) {
      return `
        <div class="hello-section">
          <div class="hello-section-hd">
            <span>이번 주 할 일</span>
            <a class="hello-section-link" href="schedule.html">할 일 →</a>
          </div>
          <div class="hello-empty">이번 주에 잡힌 할 일이 없어요</div>
        </div>`;
    }

    const top = tasks.slice(0, 7);

    return `
      <div class="hello-section">
        <div class="hello-section-hd">
          <span>이번 주 할 일 <span class="hello-count">${tasks.length}</span></span>
          <a class="hello-section-link" href="schedule.html">할 일 →</a>
        </div>
        ${top.map(t => {
          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0);
          const isToday   = t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString());
          return `
            <div class="hello-task-row">
              <div class="hello-task-check" onclick="Hello.toggleTaskDone('${t.id}')" title="완료"></div>
              ${t.starred ? '<span class="hello-task-star">★</span>' : ''}
              <span class="hello-task-title">${escapeHtml(t.title)}</span>
              ${t.category ? `<span class="hello-task-cat cat-${t.category}">${t.category}</span>` : ''}
              ${t.dueDate
                ? `<span class="hello-task-date ${isOverdue ? 'overdue' : (isToday ? 'today' : '')}">${fmtShort(t.dueDate)}</span>`
                : (isToday ? '<span class="hello-task-date today">오늘</span>' : '')}
            </div>`;
        }).join('')}
        ${tasks.length > 7 ? `<div class="hello-more">+ ${tasks.length - 7}개 더</div>` : ''}
      </div>`;
  }

  /* ─ 공개 메서드 ─ */
  function toggleTaskDone(id) {
    const t = getTasks().find(x => x.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    Toast.show('완료했어요!', 'success');
    render();
  }

  function render() {
    document.getElementById('app').innerHTML = `
      ${renderMilestone()}
      ${renderProgress()}
      <div class="hello-grid">
        ${renderFeatures()}
        ${renderWeekTasks()}
      </div>
    `;
  }

  return { render, toggleTaskDone };
})();

document.addEventListener('DOMContentLoaded', () => Hello.render());
