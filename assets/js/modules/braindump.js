/**
 * braindump.js — 브레인 덤프 (빠른 메모 + 태그 필터)
 */

const Braindump = (() => {
  let activeTag = null;
  const DEFAULT_TAGS = ['아이디어', '업무', '개인', '참고', '긴급'];

  function getNotes() {
    return Store.get('notes') || [];
  }

  function getAllTags() {
    const notes = getNotes();
    const tagMap = {};
    notes.forEach(n => (n.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
    return tagMap;
  }

  function filtered() {
    const notes = getNotes();
    if (!activeTag) return [...notes].sort((a, b) => b.createdAt - a.createdAt);
    return [...notes].filter(n => (n.tags || []).includes(activeTag)).sort((a, b) => b.createdAt - a.createdAt);
  }

  function saveNote(text, tags) {
    if (!text.trim()) return;
    Store.push('notes', { text: text.trim(), tags });
    render();
    Toast.show('저장되었습니다.', 'success');
  }

  function deleteNote(id) {
    if (!confirm('이 노트를 삭제할까요?')) return;
    Store.remove('notes', id);
    render();
  }

  function setTag(tag) {
    activeTag = activeTag === tag ? null : tag;
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render() {
    const notes   = filtered();
    const tagMap  = getAllTags();
    const allTags = Object.keys(tagMap);
    let selectedTags = [];

    document.getElementById('app').innerHTML = `
      <div class="braindump-layout">
        <div>
          <div class="capture-box">
            <textarea id="capture-input" class="capture-textarea" placeholder="지금 떠오르는 생각을 자유롭게 적어보세요..."></textarea>
            <div class="capture-footer">
              <div class="capture-tags" id="tag-picker">
                ${DEFAULT_TAGS.map(t => `
                  <span class="tag-chip" data-tag="${t}" onclick="Braindump.toggleTagPick('${t}', this)">${t}</span>
                `).join('')}
              </div>
              <button class="btn btn-primary" onclick="Braindump.captureNote()">저장</button>
            </div>
          </div>

          <div style="margin-bottom:14px">
            <span style="font-size:0.78rem;color:var(--color-text-3)">${notes.length}개의 노트${activeTag ? ` · "${activeTag}" 필터 중` : ''}</span>
          </div>

          <div class="notes-grid">
            ${notes.length === 0
              ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">◈</div><div class="empty-state-text">아직 작성된 노트가 없어요</div></div>'
              : notes.map(n => `
                <div class="note-card">
                  <div class="note-card-top">
                    <div></div>
                    <div class="note-card-actions">
                      <button class="icon-btn danger" onclick="Braindump.deleteNote('${n.id}')" title="삭제">✕</button>
                    </div>
                  </div>
                  <div class="note-card-text">${escapeHtml(n.text)}</div>
                  <div class="note-card-footer">
                    <span class="note-card-date">${new Date(n.createdAt).toLocaleDateString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    <div class="note-card-tags">
                      ${(n.tags || []).map(t => `<span class="tag-chip" style="font-size:0.7rem;padding:2px 7px">${t}</span>`).join('')}
                    </div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <aside class="braindump-sidebar">
          <div class="sidebar-filter-section">
            <div class="section-title" style="margin-bottom:10px">태그 필터</div>
            <div class="filter-tag-list">
              <div class="filter-tag-item ${!activeTag ? 'active' : ''}" onclick="Braindump.setTag(null)">
                <span>전체</span>
                <span class="filter-tag-count">${getNotes().length}</span>
              </div>
              ${allTags.map(t => `
                <div class="filter-tag-item ${activeTag === t ? 'active' : ''}" onclick="Braindump.setTag('${t}')">
                  <span>${t}</span>
                  <span class="filter-tag-count">${tagMap[t]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  function captureNote() {
    const text = document.getElementById('capture-input')?.value || '';
    const tags = [...document.querySelectorAll('.tag-chip.selected')].map(el => el.dataset.tag);
    saveNote(text, tags);
  }

  function toggleTagPick(tag, el) {
    el.classList.toggle('selected');
  }

  return { render, setTag, deleteNote, captureNote, toggleTagPick };
})();

document.addEventListener('DOMContentLoaded', () => Braindump.render());
