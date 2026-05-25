/**
 * braindump.js — 브레인 덤프 (프로젝트 태그 + 완료 관리)
 */

const Braindump = (() => {
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];
  const DATE_OPTS = [
    { val: 'today',    label: '오늘' },
    { val: 'tomorrow', label: '내일' },
    { val: 'week',     label: '이번 주' },
    { val: 'none',     label: '날짜 없음' },
  ];
  const TAG_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }, // 바이올렛
    { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' }, // 인디고
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' }, // 블루
    { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' }, // 시안
    { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' }, // 틸
    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }, // 에메랄드
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // 그린
    { bg: '#fef9c3', text: '#a16207', border: '#fde047' }, // 옐로
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }, // 오렌지
    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }, // 레드
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // 핑크
    { bg: '#fae8ff', text: '#a21caf', border: '#f0abfc' }, // 푸시아
  ];

  let convertingId  = null;
  let convertCat    = '기획';
  let convertDate   = 'none';
  let keyHandler    = null;
  let activeProject = '전체';
  let hideDone      = false;
  let lastProject   = '';

  function getNotes() { return Store.get('notes') || []; }

  function projectColor(name) {
    if (!name) return null;
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return TAG_COLORS[hash % TAG_COLORS.length];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─ 저장 ─ */
  function saveNote(text, project) {
    if (!text.trim()) return;
    const proj = project.trim() || null;
    if (proj) lastProject = proj;
    Store.push('notes', { text: text.trim(), project: proj, done: false });
    render();
  }

  function deleteNote(id) {
    Store.remove('notes', id);
    render();
  }

  /* ─ 완료 토글 ─ */
  function toggleDone(id) {
    const n = getNotes().find(x => x.id === id);
    if (!n) return;
    Store.update('notes', id, { done: !n.done, doneAt: !n.done ? Date.now() : null });
    renderList();
  }

  /* ─ 필터 ─ */
  function setProjectFilter(proj) {
    activeProject = proj;
    document.querySelectorAll('.dump-filter-btn').forEach(el => {
      el.className = `dump-filter-btn${el.dataset.proj === proj ? ' active' : ''}`;
    });
    renderList();
  }

  function toggleHideDone() {
    hideDone = !hideDone;
    const btn = document.getElementById('dump-hide-done');
    if (btn) btn.textContent = hideDone ? '완료 보기' : '완료 숨기기';
    renderList();
  }

  /* ─ 변환 플로우 ─ */
  function startConvert(id) {
    convertingId = id;
    convertCat   = '기획';
    convertDate  = 'none';
    render();
  }

  function cancelConvert() {
    convertingId = null;
    render();
  }

  function selectConvertCat(cat) {
    convertCat = cat;
    document.querySelectorAll('.convert-cat-pill').forEach(el => {
      el.className = `convert-cat-pill${el.dataset.cat === cat ? ' selected-' + cat : ''}`;
    });
  }

  function selectConvertDate(val) {
    convertDate = val;
    document.querySelectorAll('.convert-date-chip').forEach(el => {
      el.className = `convert-date-chip${el.dataset.val === val ? ' selected' : ''}`;
    });
  }

  function confirmConvert() {
    const note = getNotes().find(n => n.id === convertingId);
    if (!note) { convertingId = null; render(); return; }

    const today = new Date();
    let dueDate = null, isToday = false;

    if (convertDate === 'today') {
      dueDate = today.toISOString().slice(0, 10);
      isToday = true;
    } else if (convertDate === 'tomorrow') {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().slice(0, 10);
    } else if (convertDate === 'week') {
      const d = new Date(today);
      const toSun = today.getDay() === 0 ? 0 : 7 - today.getDay();
      d.setDate(d.getDate() + toSun);
      dueDate = d.toISOString().slice(0, 10);
    }

    if (note.project) {
      Store.push('projectTasks', { project: note.project, title: note.text, done: false });
      Toast.show(`${note.project} 할 일로 추가됐어요!`, 'success');
    } else {
      Store.push('tasks', {
        title: note.text, done: false, category: convertCat, dueDate, isToday,
      });
      Toast.show('할 일로 추가됐어요!', 'success');
    }
    Store.remove('notes', convertingId);
    convertingId = null;
    render();
  }

  /* ─ 변환 폼 렌더 ─ */
  function renderConvertForm(n) {
    if (n.project) {
      const color = projectColor(n.project);
      return `
        <div class="dump-item converting">
          <div class="dump-convert-top">
            <span class="dump-text">${escapeHtml(n.text)}</span>
            <button class="dump-action dump-delete" style="opacity:1"
              onclick="Braindump.cancelConvert()" title="취소">✕</button>
          </div>
          <div class="dump-convert-form">
            <div class="convert-row">
              <span class="dump-project-badge"
                style="background:${color.bg};color:${color.text};border-color:${color.border}">
                ${escapeHtml(n.project)}
              </span>
              <span style="font-size:0.82rem;color:var(--color-text-3)">프로젝트 할 일로 추가돼요</span>
              <button class="convert-confirm-btn" onclick="Braindump.confirmConvert()">추가 →</button>
            </div>
            <div class="convert-hint">Enter 확인 · Esc 취소</div>
          </div>
        </div>`;
    }

    return `
      <div class="dump-item converting">
        <div class="dump-convert-top">
          <span class="dump-text">${escapeHtml(n.text)}</span>
          <button class="dump-action dump-delete" style="opacity:1"
            onclick="Braindump.cancelConvert()" title="취소">✕</button>
        </div>
        <div class="dump-convert-form">
          <div class="convert-row">
            <div class="convert-group">
              ${CATS.map(c => `
                <button class="convert-cat-pill${convertCat === c ? ' selected-' + c : ''}"
                  data-cat="${c}" onclick="Braindump.selectConvertCat('${c}')">${c}</button>
              `).join('')}
            </div>
            <div class="convert-sep">·</div>
            <div class="convert-group">
              ${DATE_OPTS.map(d => `
                <button class="convert-date-chip${convertDate === d.val ? ' selected' : ''}"
                  data-val="${d.val}" onclick="Braindump.selectConvertDate('${d.val}')">${d.label}</button>
              `).join('')}
            </div>
            <button class="convert-confirm-btn" onclick="Braindump.confirmConvert()">추가 →</button>
          </div>
          <div class="convert-hint">Enter 확인 · Esc 취소</div>
        </div>
      </div>`;
  }

  /* ─ 아이템 렌더 ─ */
  function renderItem(n) {
    if (n.id === convertingId) return renderConvertForm(n);

    const color = projectColor(n.project);
    const badge = n.project && color
      ? `<span class="dump-project-badge"
           style="background:${color.bg};color:${color.text};border-color:${color.border}"
         >${escapeHtml(n.project)}</span>`
      : '';

    return `
      <div class="dump-item${n.done ? ' done' : ''}">
        <button class="dump-check${n.done ? ' checked' : ''}"
          onclick="Braindump.toggleDone('${n.id}')" title="${n.done ? '완료 해제' : '완료'}">
          ${n.done ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </button>
        <span class="dump-text">${escapeHtml(n.text)}</span>
        ${badge}
        <button class="dump-action dump-convert"
          onclick="Braindump.startConvert('${n.id}')" title="할 일로 변환">→ 할 일</button>
        <span class="dump-meta">${formatDate(n.createdAt)}</span>
        <button class="dump-action dump-delete"
          onclick="Braindump.deleteNote('${n.id}')" title="삭제">✕</button>
      </div>`;
  }

  /* ─ 리스트만 재렌더 ─ */
  function renderList() {
    const listEl = document.getElementById('dump-list');
    if (!listEl) return;

    let notes = [...getNotes()].sort((a, b) => b.createdAt - a.createdAt);

    if (activeProject === '태그없음') {
      notes = notes.filter(n => !n.project);
    } else if (activeProject !== '전체') {
      notes = notes.filter(n => n.project === activeProject);
    }

    if (hideDone) notes = notes.filter(n => !n.done);

    listEl.innerHTML = notes.length === 0
      ? '<div class="empty-state"><div class="empty-state-text">기록이 없어요</div></div>'
      : notes.map(n => renderItem(n)).join('');
  }

  /* ─ 전체 렌더 ─ */
  function render() {
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }

    const allNotes = [...getNotes()].sort((a, b) => b.createdAt - a.createdAt);
    const projects = [...new Set(allNotes.map(n => n.project).filter(Boolean))];
    const hasUntagged = allNotes.some(n => !n.project);
    const doneCount = allNotes.filter(n => n.done).length;

    const filterBtns = ['전체', ...projects, ...(hasUntagged ? ['태그없음'] : '')]
      .map(p => `<button class="dump-filter-btn${activeProject === p ? ' active' : ''}"
          data-proj="${p}" onclick="Braindump.setProjectFilter('${p}')">${p}</button>`)
      .join('');

    document.getElementById('app').innerHTML = `
      <div class="quick-add-wrap">
        <div class="quick-add-inner">
          <div class="quick-add-top">
            <input id="dump-input" class="quick-add-input" type="text"
              placeholder="생각이 떠오르면 입력하고 Enter"
              ${convertingId ? '' : 'autofocus'}>
          </div>
          <div class="quick-add-footer">
            <input id="dump-tag-input" class="dump-tag-input" type="text"
              placeholder="프로젝트 태그 (선택)"
              value="${escapeHtml(lastProject)}">
            <span class="quick-add-hint">Enter로 추가</span>
          </div>
        </div>
      </div>
      <div class="dump-tag-hint">프로젝트 태그를 입력하면 새 프로젝트가 만들어져요. <a href="myprojects.html">내 프로젝트</a>에서 확인할 수 있어요.</div>

      <div class="dump-list-header">
        <div class="dump-filter-bar">${filterBtns}</div>
        <div class="dump-toolbar-right">
          ${doneCount > 0 ? `<button id="dump-hide-done" class="dump-hide-done-btn"
            onclick="Braindump.toggleHideDone()">${hideDone ? '완료 보기' : '완료 숨기기'}</button>` : ''}
          <button id="dump-ai-btn" class="dump-ai-btn" onclick="Braindump.aiOrganize()">✦ AI 정리</button>
        </div>
      </div>

      <div class="dump-list" id="dump-list"></div>
    `;

    renderList();
    bindInputs();
  }

  /* ─ 입력 바인딩 ─ */
  function bindInputs() {
    const input    = document.getElementById('dump-input');
    const tagInput = document.getElementById('dump-tag-input');
    if (!input) return;

    // 텍스트 입력창 Enter → 저장
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      if (convertingId) { confirmConvert(); return; }
      const text = input.value.trim();
      if (!text) return;
      const proj = tagInput ? tagInput.value.trim() : '';
      saveNote(text, proj);
      input.value = '';
      if (tagInput) tagInput.value = proj; // 마지막 태그 유지
    });

    // 태그 입력창 Enter → 텍스트 입력창으로 포커스 이동
    tagInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        input.focus();
      }
    });

    if (!convertingId) input.focus();

    if (convertingId) {
      keyHandler = (e) => { if (e.key === 'Escape') cancelConvert(); };
      document.addEventListener('keydown', keyHandler);
    }
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  async function aiOrganize() {
    if (!AI.getApiKey()) {
      Toast.show('설정(⚙)에서 Claude API 키를 먼저 입력해 주세요.', 'warning');
      return;
    }

    const notes = (Store.get('notes') || []).filter(n => !n.done);
    if (notes.length === 0) {
      Toast.show('정리할 덤프 항목이 없어요.', 'warning');
      return;
    }

    const btn = document.getElementById('dump-ai-btn');
    if (btn) { btn.disabled = true; btn.textContent = '✦ 분석 중...'; }

    const today = new Date().toISOString().slice(0, 10);
    const noteList = notes.map((n, i) => `${i + 1}. ${n.text}`).join('\n');

    const prompt = `오늘 날짜: ${today}.
아래는 브레인 덤프 메모들입니다. 실행 가능한 할 일(task)로 정리해 JSON 배열만 반환하세요. 설명 없이 JSON만.

규칙:
- 각 항목: { "title": "할 일 제목", "category": "기획|디자인|개발|마케팅|운영 중 하나", "date": "YYYY-MM-DD 또는 null" }
- 중복 의미는 하나로 합치고, 실행 불가능한 메모는 제외
- 최대 10개

메모:
${noteList}`;

    try {
      const raw = await AI.chat([{ role: 'user', content: prompt }], '', 'claude-haiku-4-5-20251001');
      const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      const tasks = JSON.parse(cleaned);
      if (!Array.isArray(tasks)) throw new Error();

      tasks.forEach(t => {
        if (!t.title) return;
        Store.push('tasks', { title: t.title, category: t.category || '', done: false, isToday: false, dueDate: t.date || null });
      });

      Toast.show(`✦ ${tasks.length}개 할 일로 정리했어요. 할 일 목록에서 확인하세요.`, 'success');
    } catch {
      Toast.show('AI 정리에 실패했어요. 다시 시도해 주세요.', 'error');
    } finally {
      const b = document.getElementById('dump-ai-btn');
      if (b) { b.disabled = false; b.textContent = '✦ AI 정리'; }
    }
  }

  return {
    render, deleteNote,
    startConvert, cancelConvert, selectConvertCat, selectConvertDate, confirmConvert,
    toggleDone, setProjectFilter, toggleHideDone, aiOrganize,
  };
})();

document.addEventListener('DOMContentLoaded', () => Braindump.render());
