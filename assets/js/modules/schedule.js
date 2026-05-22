/**
 * schedule.js — 할 일 목록 (날짜 기반 일정 관리)
 */

const Schedule = (() => {
  const CATS = ['전체', '기획', '디자인', '개발', '마케팅', '운영'];

  let activeFilter  = '전체';
  let selectedCat   = '기획';
  let editingDateId = null;
  let searchQuery   = '';
  let hideDone      = false;

  function getTasks() { return Store.get('tasks') || []; }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 그룹 분류 ─ */
  const GROUP_ORDER = ['기한 지남', '오늘', '이번 주', '다음 주', '그 이후', '날짜 없음'];
  const GROUP_CLS   = {
    '기한 지남': 'overdue',
    '오늘':     'today',
    '이번 주':  'week',
    '다음 주':  'next',
    '그 이후':  'later',
    '날짜 없음': 'none',
  };

  function getGroup(t) {
    const todayMs  = new Date().setHours(0, 0, 0, 0);
    const todayStr = new Date(todayMs).toDateString();
    if (t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === todayStr)) return '오늘';
    if (!t.dueDate) return '날짜 없음';
    const diff = Math.ceil((new Date(t.dueDate) - todayMs) / 86400000);
    if (diff < 0)   return '기한 지남';
    if (diff <= 7)  return '이번 주';
    if (diff <= 14) return '다음 주';
    return '그 이후';
  }

  function groupTasks(tasks) {
    const g = {};
    GROUP_ORDER.forEach(k => { g[k] = []; });
    tasks.forEach(t => g[getGroup(t)].push(t));
    return g;
  }

  /* ─ 날짜 포맷 ─ */
  function shortDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function dateBadgeCls(t) {
    const g = getGroup(t);
    if (g === '기한 지남') return 'date-overdue';
    if (g === '오늘')      return 'date-today';
    if (g === '이번 주')   return 'date-week';
    return 'date-later';
  }

  /* ─ 태스크 행 ─ */
  function taskRow(t) {
    let dateEl;
    if (editingDateId === t.id) {
      dateEl = `<input class="task-date-edit" id="date-edit-${t.id}"
        placeholder="다음주 금요일" autocomplete="off">`;
    } else if (t.dueDate) {
      dateEl = `<span class="task-date-badge ${dateBadgeCls(t)}"
        onclick="Schedule.startDateEdit('${t.id}')">${shortDate(t.dueDate)}</span>`;
    } else {
      dateEl = `<span class="task-date-add" onclick="Schedule.startDateEdit('${t.id}')">+ 날짜</span>`;
    }

    return `
      <div class="bl-task ${t.done ? 'done' : ''}">
        <div class="bl-checkbox ${t.done ? 'checked' : ''}"
          onclick="Schedule.toggleDone('${t.id}')">${t.done ? '✓' : ''}</div>
        <span class="bl-title">${escapeHtml(t.title)}</span>
        ${dateEl}
        <span class="cat-badge ${t.category || ''}">${t.category || ''}</span>
        <div class="bl-actions">
          <button class="bl-btn bl-btn-del" onclick="Schedule.deleteTask('${t.id}')">삭제</button>
        </div>
      </div>`;
  }

  /* ─ 그룹 헤더 ─ */
  function groupHeader(name, tasks) {
    const left = tasks.filter(t => !t.done).length;
    return `
      <div class="bl-section-header bl-section-${GROUP_CLS[name]}">
        <div class="bl-section-dot"></div>
        <span class="bl-section-label">${name}</span>
        <span class="bl-section-count">${left}개 남음</span>
      </div>`;
  }

  /* ─ 필터링된 리스트 ─ */
  function filteredTasks() {
    const q = searchQuery.trim().toLowerCase();
    return getTasks()
      .filter(t => {
        if (activeFilter !== '전체' && t.category !== activeFilter) return false;
        if (hideDone && t.done) return false;
        if (q && !t.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.done !== b.done) return (a.done ? 1 : 0) - (b.done ? 1 : 0);
        const aD = a.dueDate ? new Date(a.dueDate) : null;
        const bD = b.dueDate ? new Date(b.dueDate) : null;
        if (aD && bD) return aD - bD;
        if (aD) return -1;
        if (bD) return 1;
        return b.createdAt - a.createdAt;
      });
  }

  function buildListHTML() {
    const list   = filteredTasks();
    const groups = groupTasks(list);

    if (list.length === 0) {
      const msg = searchQuery
        ? `"${escapeHtml(searchQuery)}"에 일치하는 할 일이 없어요`
        : '할 일이 없어요';
      return `<div class="empty-state"><div class="empty-state-text">${msg}</div></div>`;
    }

    let html  = '';
    let first = true;
    GROUP_ORDER.forEach(name => {
      const g = groups[name];
      if (!g.length) return;
      if (!first) html += '<div style="height:18px"></div>';
      first = false;
      html += groupHeader(name, g) + g.map(taskRow).join('');
    });
    return html;
  }

  function renderList() {
    const el = document.getElementById('bl-list');
    if (el) el.innerHTML = buildListHTML();
    bindDateEdit();
  }

  /* ─ 렌더 ─ */
  function render() {
    document.getElementById('app').innerHTML = `
      <div class="backlog-toolbar">
        <div class="cat-filter-group">
          ${CATS.map(c => `
            <button class="cat-filter-btn ${activeFilter === c ? 'active-' + c : ''}"
              onclick="Schedule.setFilter('${c}')">${c}</button>
          `).join('')}
        </div>
        <div class="bl-search-group">
          <input id="bl-search" class="bl-search-input" type="text"
            placeholder="🔍 할 일 검색..." value="${escapeHtml(searchQuery)}">
          <button class="bl-done-toggle ${hideDone ? 'active' : ''}"
            onclick="Schedule.toggleHideDone()">
            ${hideDone ? '완료 보기' : '완료 숨기기'}
          </button>
        </div>
      </div>

      <div class="inline-nl-wrap">
        <input id="bl-input" class="inline-nl-input" type="text"
          placeholder="유저 인터뷰 섭외 다음주 화요일 기획...">
        <div class="inline-nl-footer">
          <div class="cat-pills" id="bl-cat-pills">
            ${CATS.slice(1).map(c => `
              <button class="cat-pill${selectedCat === c ? ' selected-' + c : ''}"
                data-cat="${c}" onclick="Schedule.selectCat('${c}')">${c}</button>
            `).join('')}
          </div>
          <span class="nl-rule-hint">기본 분야 선택 · 날짜 포함 시 AI 자동 추출 · Enter</span>
        </div>
        <div class="inline-nl-status" id="bl-status"></div>
      </div>

      <div id="bl-list">${buildListHTML()}</div>
    `;

    bindInput();
    bindSearch();
    bindDateEdit();
  }

  /* ─ 검색바 바인딩 ─ */
  function bindSearch() {
    const input = document.getElementById('bl-search');
    if (!input) return;
    input.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderList();
    });
  }

  /* ─ 새 할 일 입력 (NL 파싱) ─ */
  function bindInput() {
    const input  = document.getElementById('bl-input');
    const status = document.getElementById('bl-status');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const text = input.value.trim();
      if (!text) return;

      if (!AI.getApiKey()) {
        Store.push('tasks', { title: text, category: selectedCat, done: false, isToday: false });
        input.value = '';
        render();
        return;
      }

      input.disabled = true;
      status.textContent = '✦ AI가 분석 중...';
      status.className = 'inline-nl-status';

      try {
        const result = await NLInput.parse('task', text);
        Store.push('tasks', {
          title:    result.title,
          category: result.category || selectedCat,
          done:     false,
          isToday:  false,
          dueDate:  result.date || null,
        });
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

    input.focus();
  }

  /* ─ 날짜 인라인 수정 ─ */
  function bindDateEdit() {
    if (!editingDateId) return;
    const input = document.getElementById(`date-edit-${editingDateId}`);
    if (!input) return;
    input.focus();

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape') { editingDateId = null; render(); return; }
      if (e.key !== 'Enter') return;

      const text = input.value.trim();
      if (!text) { editingDateId = null; render(); return; }

      if (!AI.getApiKey()) {
        Toast.show('설정(⚙)에서 API 키를 먼저 입력해 주세요.', 'warning');
        return;
      }

      input.disabled = true;
      const today = new Date().toISOString().slice(0, 10);
      try {
        const raw = await AI.chat(
          [{ role: 'user', content: `오늘은 ${today}. "${text}"를 YYYY-MM-DD 날짜로 변환해줘. 날짜만 답해.` }],
          '', 'claude-haiku-4-5-20251001'
        );
        const match = raw.trim().match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
          Store.update('tasks', editingDateId, { dueDate: match[0], isToday: match[0] === today });
          Toast.show('날짜가 설정됐어요.', 'success');
        } else {
          Toast.show('날짜를 인식하지 못했어요.', 'error');
        }
      } catch {
        Toast.show('오류가 발생했어요. 다시 시도해주세요.', 'error');
      }
      editingDateId = null;
      render();
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { if (editingDateId) { editingDateId = null; render(); } }, 200);
    });
  }

  /* ─ 공개 메서드 ─ */
  function toggleDone(id) {
    const t = getTasks().find(t => t.id === id);
    if (!t) return;
    Store.update('tasks', id, { done: !t.done, doneAt: !t.done ? Date.now() : null });
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

  function selectCat(cat) {
    selectedCat = cat;
    document.querySelectorAll('#bl-cat-pills .cat-pill').forEach(el => {
      el.className = `cat-pill${el.dataset.cat === cat ? ' selected-' + cat : ''}`;
    });
  }

  function startDateEdit(id) {
    editingDateId = id;
    render();
  }

  function toggleHideDone() {
    hideDone = !hideDone;
    render();
  }

  return { render, setFilter, toggleDone, moveToToday, deleteTask, selectCat, startDateEdit, toggleHideDone };
})();

document.addEventListener('DOMContentLoaded', () => Schedule.render());
