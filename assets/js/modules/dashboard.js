/**
 * dashboard.js — 오늘 집중 뷰 (헬로아지 중심)
 */

const Dashboard = (() => {
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];
  const FOCUS_KEY = 'chloeassist:focusMode';
  const TAG_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' },
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
    { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    { bg: '#fae8ff', text: '#a21caf', border: '#f0abfc' },
  ];
  let showDone    = false;
  let focusMode   = localStorage.getItem(FOCUS_KEY) === 'true';
  let focusOffset = 0;

  function projectColor(name) {
    if (!name) return TAG_COLORS[0];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return TAG_COLORS[hash % TAG_COLORS.length];
  }

  function todayStr() { return new Date().toDateString(); }

  function getTodayTasks() {
    const all = Store.get('tasks') || [];
    return all.filter(t => t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === todayStr()));
  }

  function formatDate() {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
  }

  /* ─ 프로젝트 현황 계산 ─ */
  function nextMilestone() {
    const today = new Date().setHours(0, 0, 0, 0);
    return (Store.get('milestones') || [])
      .filter(m => !m.done && new Date(m.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
  }

  function ddayInfo(dateStr) {
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    const label = diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    const cls   = diff <= 7 ? 'soon' : diff <= 21 ? 'near' : 'far';
    return { label, cls };
  }

  function weekStats() {
    const today  = new Date();
    const day    = today.getDay();
    const mon    = new Date(today);
    mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const all   = Store.get('tasks') || [];
    const week  = all.filter(t =>
      (t.isToday && today >= mon && today <= sun) ||
      (t.dueDate && new Date(t.dueDate) >= mon && new Date(t.dueDate) <= sun)
    );
    const done  = week.filter(t => t.done).length;
    const total = week.length;
    return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function featStats() {
    const all  = Store.get('features') || [];
    const done = all.filter(f => f.status === '완료').length;
    return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 };
  }

  /* ─ 오늘 배너 ─ */
  function renderBanner(done, total, pct) {
    const ms = nextMilestone();
    const msRow = ms
      ? (() => {
          const dd = ddayInfo(ms.date);
          return `<div class="today-banner-ms">◈ 다음 마일스톤: ${escapeHtml(ms.title)} &nbsp; ${dd.label}</div>`;
        })()
      : '';

    return `
      <div class="today-banner">
        <div class="today-banner-main">
          <div class="today-banner-date">${formatDate()}</div>
          <div class="today-banner-progress-row">
            <div class="today-banner-bar">
              <div class="today-banner-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="today-banner-stat">${done} / ${total} 완료</span>
          </div>
          ${msRow}
        </div>
        <div class="today-banner-actions">
          ${focusToggleBtn()}
        </div>
      </div>`;
  }

  function addTask(title, category, dueDate) {
    if (!title.trim()) return;
    Store.push('tasks', { title: title.trim(), category, done: false, isToday: true, dueDate: dueDate || null });
    render();
  }

  function toggleDone(id) {
    const t = (Store.get('tasks') || []).find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    render();
  }

  function toggleStar(id) {
    const t = (Store.get('tasks') || []).find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { starred: !t.starred });
    render();
  }

  function deleteTask(id) {
    Store.remove('tasks', id);
    render();
  }

  function endOfDay() {
    const undone = getTodayTasks().filter(t => !t.done);
    if (undone.length === 0) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);

    undone.forEach(t => {
      Store.update('tasks', t.id, { isToday: false, dueDate: iso });
    });
    Toast.show(`${undone.length}개를 내일로 옮겼어요. 오늘도 수고했어요!`, 'success');
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderCatGroup(cat, tasks) {
    const active = tasks.filter(t => !t.done);
    const done   = tasks.filter(t =>  t.done);
    const toShow = (showDone ? tasks : active)
      .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
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
            <span class="today-task-text ${t.starred ? 'starred' : ''}">${escapeHtml(t.title)}</span>
            <button class="today-star ${t.starred ? 'on' : ''}"
              onclick="Dashboard.toggleStar('${t.id}')" title="${t.starred ? '별표 해제' : '별표 추가'}">
              ${t.starred ? '★' : '☆'}
            </button>
            <button class="today-task-del" onclick="Dashboard.deleteTask('${t.id}')">✕</button>
          </div>
        `).join('')}
      </div>`;
  }

  let selectedCat = '기획';

  /* ─ 집중 모드 ─ */
  function toggleFocusMode() {
    focusMode = !focusMode;
    focusOffset = 0;
    localStorage.setItem(FOCUS_KEY, focusMode);
    render();
  }

  function nextFocus() { focusOffset++; render(); }
  function prevFocus() { focusOffset = Math.max(0, focusOffset - 1); render(); }

  function focusList() {
    return getTodayTasks()
      .filter(t => !t.done)
      .sort((a, b) => {
        if (!!b.starred !== !!a.starred) return b.starred ? 1 : -1;
        const aD = a.dueDate ? new Date(a.dueDate) : null;
        const bD = b.dueDate ? new Date(b.dueDate) : null;
        if (aD && bD) return aD - bD;
        if (aD) return -1;
        if (bD) return 1;
        return a.createdAt - b.createdAt;
      });
  }

  function shortDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function renderFocusCard() {
    const list  = focusList();
    const tasks = getTodayTasks();
    const done  = tasks.filter(t => t.done).length;

    if (list.length === 0) {
      const allDone = tasks.length > 0;
      return `
        <div class="focus-empty">
          <div class="focus-empty-icon">${allDone ? '🎉' : '✦'}</div>
          <div class="focus-empty-title">${allDone ? '오늘 끝!' : '오늘 할 일이 없어요'}</div>
          <div class="focus-empty-sub">${allDone
            ? `${done}개 모두 완료했어요`
            : '전체 보기로 전환해서 추가해보세요'}</div>
        </div>`;
    }

    if (focusOffset >= list.length) focusOffset = 0;
    const t = list[focusOffset];
    const catCls = t.category && CATS.includes(t.category) ? t.category : 'cat-empty';
    const catLabel = t.category || '미분류';

    return `
      <div class="focus-card">
        <div class="focus-meta">
          <span class="focus-cat-badge ${catCls}">${catLabel}</span>
          ${t.starred ? '<span class="focus-star">★</span>' : ''}
          ${t.dueDate ? `<span class="focus-date">${shortDate(t.dueDate)}</span>` : ''}
        </div>
        <div class="focus-title">${escapeHtml(t.title)}</div>
        <button class="focus-done-btn" onclick="Dashboard.toggleDone('${t.id}')">✓ 완료</button>
        ${list.length > 1 ? `
          <div class="focus-nav">
            <button class="focus-nav-btn" onclick="Dashboard.prevFocus()"
              ${focusOffset === 0 ? 'disabled' : ''}>← 이전</button>
            <span class="focus-counter">${focusOffset + 1} / ${list.length}</span>
            <button class="focus-nav-btn" onclick="Dashboard.nextFocus()"
              ${focusOffset >= list.length - 1 ? 'disabled' : ''}>다음 →</button>
          </div>` : ''}
        <div class="focus-summary">
          남은 ${list.length}개 · 완료 ${done}개
          ${!t.starred ? '<br><span class="focus-hint">별표를 추가하면 가장 먼저 표시돼요</span>' : ''}
        </div>
      </div>`;
  }

  /* ─ 프로젝트 마감 임박 ─ */
  function getProjectDeadlineTasks() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(today.getDate() + 3);
    return (Store.get('projectTasks') || [])
      .filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') <= limit)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  function toggleProjectDone(id) {
    const t = (Store.get('projectTasks') || []).find(x => x.id === id);
    if (!t) return;
    Store.update('projectTasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
    Toast.show('프로젝트 할 일 완료!', 'success');
    render();
  }

  function renderProjectDeadlines() {
    const tasks = getProjectDeadlineTasks();
    if (tasks.length === 0) return '';

    const today = new Date(); today.setHours(0, 0, 0, 0);

    return `
      <div class="proj-deadline-section">
        <div class="proj-deadline-header">
          <span class="proj-deadline-title">◉ 프로젝트 마감 임박</span>
          <span class="proj-deadline-count">${tasks.length}개</span>
        </div>
        ${tasks.map(t => {
          const color = projectColor(t.project);
          const due   = new Date(t.dueDate + 'T00:00:00');
          const diff  = Math.round((due - today) / 86400000);
          let dcls = 'proj-due', dlabel;
          if (diff < 0)       { dcls += ' overdue'; dlabel = `${-diff}일 지남`; }
          else if (diff === 0){ dcls += ' today';   dlabel = '오늘'; }
          else if (diff === 1){ dlabel = '내일'; }
          else                { dlabel = `${due.getMonth() + 1}/${due.getDate()}`; }

          return `
            <div class="proj-deadline-item">
              <div class="today-checkbox" onclick="Dashboard.toggleProjectDone('${t.id}')"></div>
              <span class="proj-deadline-badge"
                style="background:${color.bg};color:${color.text};border-color:${color.border}">
                ${escapeHtml(t.project)}
              </span>
              <span class="proj-deadline-text">${escapeHtml(t.title)}</span>
              <span class="${dcls}">${dlabel}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  function selectCat(cat) {
    selectedCat = cat;
    document.querySelectorAll('#quick-cat-pills .cat-pill').forEach(el => {
      el.className = `cat-pill${el.dataset.cat === cat ? ' selected-' + cat : ''}`;
    });
  }

  function focusToggleBtn() {
    return `
      <button class="focus-toggle ${focusMode ? 'on' : ''}"
        onclick="Dashboard.toggleFocusMode()"
        title="${focusMode ? '전체 보기로 전환' : '한 가지에 집중'}">
        ◉ ${focusMode ? '전체 보기' : '집중 모드'}
      </button>`;
  }

  function render() {
    if (focusMode) {
      document.getElementById('app').innerHTML = `
        <div class="today-header focus-header">
          <div class="today-date">${formatDate()}</div>
          ${focusToggleBtn()}
        </div>
        ${renderFocusCard()}
      `;
      return;
    }

    const tasks = getTodayTasks();
    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;
    const pct   = total ? Math.round(done / total * 100) : 0;

    const byCat = {};
    CATS.forEach(c => { byCat[c] = tasks.filter(t => t.category === c); });
    const uncategorized = tasks.filter(t => !CATS.includes(t.category));
    const hasAny = tasks.filter(t => !t.done).length > 0 || (showDone && done > 0);

    document.getElementById('app').innerHTML = `
      ${renderBanner(done, total, pct)}

      <div class="quick-add-wrap">
        <div class="quick-add-inner">
          <div class="quick-add-top">
            <input id="quick-input" class="quick-add-input" type="text"
              placeholder="오늘 할 일을 입력하세요" autofocus>
            <span class="ai-badge">✦ AI</span>
          </div>
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
      </div>

      <div id="today-list">
        ${!hasAny && total === 0
          ? `<div class="empty-state">
               <div class="empty-state-icon">✦</div>
               <div class="empty-state-text">오늘 할 일을 추가해보세요</div>
             </div>`
          : CATS.map(c => renderCatGroup(c, byCat[c])).join('') + renderCatGroup('미분류', uncategorized)}
        ${done > 0 ? `
          <div class="done-section-toggle" onclick="Dashboard.toggleShowDone()">
            ${showDone ? '▴' : '▾'} 완료된 항목 ${done}개 ${showDone ? '숨기기' : '보기'}
          </div>` : ''}
        ${total - done > 0 ? `
          <button class="end-of-day-btn" onclick="Dashboard.endOfDay()"
            title="남은 ${total - done}개를 내일로 옮기고 오늘 마무리">
            🌙 오늘 끝! · 남은 ${total - done}개 내일로
          </button>` : ''}
      </div>

      ${renderProjectDeadlines()}
    `;

    const input = document.getElementById('quick-input');
    input?.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const text = input.value.trim();
      if (!text) return;

      if (!AI.getApiKey()) {
        addTask(text, selectedCat);
        input.value = '';
        input.focus();
        return;
      }

      input.disabled = true;
      input.placeholder = '✦ AI가 분석 중...';
      try {
        const result = await NLInput.parse('task', text);
        addTask(result.title || text, result.category || selectedCat, result.date || null);
        input.value = '';
      } catch {
        addTask(text, selectedCat);
        input.value = '';
      } finally {
        input.disabled = false;
        input.placeholder = '오늘 할 일을 입력하세요';
        input.focus();
      }
    });
  }

  function toggleShowDone() {
    showDone = !showDone;
    render();
  }

  return {
    render, toggleDone, toggleStar, deleteTask, toggleShowDone, selectCat,
    toggleFocusMode, nextFocus, prevFocus, endOfDay, toggleProjectDone,
  };
})();

document.addEventListener('DOMContentLoaded', () => Dashboard.render());
