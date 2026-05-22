/**
 * braindump.js — 브레인 덤프 (입력 후 Enter → 저장)
 */

const Braindump = (() => {
  function getNotes() {
    return Store.get('notes') || [];
  }

  function saveNote(text) {
    if (!text.trim()) return;
    Store.push('notes', { text: text.trim() });
    render();
  }

  function deleteNote(id) {
    Store.remove('notes', id);
    render();
  }

  function convertToTask(id) {
    const note = getNotes().find(n => n.id === id);
    if (!note) return;
    Store.push('tasks', {
      title: note.text,
      done: false,
      category: '',
      dueDate: null,
      isToday: false,
    });
    Store.remove('notes', id);
    Toast.show('할 일로 변환되었어요.', 'success');
    render();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    const notes = [...getNotes()].sort((a, b) => b.createdAt - a.createdAt);

    document.getElementById('app').innerHTML = `
      <div class="dump-input-wrap">
        <input
          id="dump-input"
          class="dump-input"
          type="text"
          placeholder="생각이 떠오르면 입력하고 Enter"
          autofocus
        />
      </div>

      <div class="dump-list">
        ${notes.length === 0
          ? '<div class="empty-state"><div class="empty-state-text">아직 기록된 생각이 없어요</div></div>'
          : notes.map(n => `
            <div class="dump-item">
              <span class="dump-text">${escapeHtml(n.text)}</span>
              <span class="dump-meta">${formatDate(n.createdAt)}</span>
              <button class="dump-action dump-convert" onclick="Braindump.convertToTask('${n.id}')" title="할 일로 변환">→ 할 일</button>
              <button class="dump-action dump-delete" onclick="Braindump.deleteNote('${n.id}')" title="삭제">✕</button>
            </div>
          `).join('')
        }
      </div>
    `;

    const input = document.getElementById('dump-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveNote(input.value);
        input.value = '';
      }
    });
    input?.focus();
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  return { render, deleteNote, convertToTask };
})();

document.addEventListener('DOMContentLoaded', () => Braindump.render());
