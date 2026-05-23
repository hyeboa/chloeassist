/**
 * braindump.js — 브레인 덤프 (입력 후 Enter → 저장)
 */

const Braindump = (() => {
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];
  const DATE_OPTS = [
    { val: 'today',    label: '오늘' },
    { val: 'tomorrow', label: '내일' },
    { val: 'week',     label: '이번 주' },
    { val: 'none',     label: '날짜 없음' },
  ];

  let convertingId = null;
  let convertCat   = '기획';
  let convertDate  = 'none';
  let keyHandler   = null;

  function getNotes() { return Store.get('notes') || []; }

  function saveNote(text) {
    if (!text.trim()) return;
    Store.push('notes', { text: text.trim() });
    render();
  }

  function deleteNote(id) {
    Store.remove('notes', id);
    render();
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

    Store.push('tasks', {
      title: note.text, done: false, category: convertCat, dueDate, isToday,
    });
    Store.remove('notes', convertingId);
    convertingId = null;
    Toast.show('할 일로 추가됐어요!', 'success');
    render();
  }

  /* ─ 렌더 ─ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderConvertForm(n) {
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

  function render() {
    /* 이전 키 핸들러 제거 */
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }

    const notes = [...getNotes()].sort((a, b) => b.createdAt - a.createdAt);

    document.getElementById('app').innerHTML = `
      <div class="dump-input-wrap">
        <input id="dump-input" class="dump-input" type="text"
          placeholder="생각이 떠오르면 입력하고 Enter"
          ${convertingId ? '' : 'autofocus'}>
      </div>
      <div class="dump-list">
        ${notes.length === 0
          ? '<div class="empty-state"><div class="empty-state-text">아직 기록된 생각이 없어요</div></div>'
          : notes.map(n =>
              n.id === convertingId
                ? renderConvertForm(n)
                : `<div class="dump-item">
                     <span class="dump-text">${escapeHtml(n.text)}</span>
                     <span class="dump-meta">${formatDate(n.createdAt)}</span>
                     <button class="dump-action dump-convert"
                       onclick="Braindump.startConvert('${n.id}')" title="할 일로 변환">→ 할 일</button>
                     <button class="dump-action dump-delete"
                       onclick="Braindump.deleteNote('${n.id}')" title="삭제">✕</button>
                   </div>`
            ).join('')
        }
      </div>
    `;

    const input = document.getElementById('dump-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        if (convertingId) { confirmConvert(); return; }
        saveNote(input.value);
        input.value = '';
      }
    });
    if (!convertingId) input?.focus();

    /* 변환 폼 열려있을 때 Esc 키 처리 */
    if (convertingId) {
      keyHandler = (e) => {
        if (e.key === 'Escape') cancelConvert();
      };
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

  return { render, deleteNote, startConvert, cancelConvert, selectConvertCat, selectConvertDate, confirmConvert };
})();

document.addEventListener('DOMContentLoaded', () => Braindump.render());
