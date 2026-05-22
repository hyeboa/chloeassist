/**
 * sitemap.js — 헬로아지 앱 화면 구조 보드
 */

const Sitemap = (() => {
  const STATUSES  = ['미정', '기획', '디자인중', '개발중', '완료'];
  const STATUS_CLS = {
    '미정':    'st-none',
    '기획':    'st-plan',
    '디자인중': 'st-design',
    '개발중':  'st-dev',
    '완료':    'st-done',
  };

  function getSections() {
    return (Store.get('sitemapSections') || []).sort((a, b) => a.createdAt - b.createdAt);
  }
  function getScreens() {
    return (Store.get('sitemapScreens') || []).sort((a, b) => a.createdAt - b.createdAt);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 화면 카드 ─ */
  function renderCard(screen) {
    const cls = STATUS_CLS[screen.status || '미정'];
    return `
      <div class="screen-card ${cls}">
        <div class="screen-notch"></div>
        <div class="screen-name" data-id="${screen.id}"
          ondblclick="event.stopPropagation();Sitemap.focusName('${screen.id}')">${escapeHtml(screen.name)}</div>
        <button class="screen-status-btn"
          onclick="Sitemap.cycleStatus('${screen.id}')">${screen.status || '미정'}</button>
        <button class="screen-del" onclick="Sitemap.deleteScreen('${screen.id}')" title="삭제">✕</button>
      </div>
    `;
  }

  /* ─ 섹션 ─ */
  function renderSection(section, screens) {
    const sectionScreens = screens.filter(s => s.sectionId === section.id);
    const total = sectionScreens.length;
    const done  = sectionScreens.filter(s => s.status === '완료').length;

    return `
      <div class="sitemap-section" data-section-id="${section.id}">
        <div class="sitemap-section-hd">
          <div class="section-name-wrap">
            <span class="section-icon">◧</span>
            <span class="section-name" data-id="${section.id}"
              contenteditable="true"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
              >${escapeHtml(section.name)}</span>
          </div>
          <div class="section-meta">
            ${total ? `<span class="section-count">${done}/${total} 완료</span>` : ''}
            <button class="section-del" onclick="Sitemap.deleteSection('${section.id}')" title="섹션 삭제">✕</button>
          </div>
        </div>

        <div class="sitemap-screens">
          ${sectionScreens.map((s, i) => `
            ${i > 0 ? '<div class="screen-arrow"><div class="arrow-line"></div><div class="arrow-head">▶</div></div>' : ''}
            ${renderCard(s)}
          `).join('')}
          <button class="screen-add-card" onclick="Sitemap.addScreen('${section.id}')">
            <span class="screen-add-plus">+</span>
            <span class="screen-add-label">화면 추가</span>
          </button>
        </div>
      </div>
    `;
  }

  /* ─ 범례 ─ */
  function renderLegend() {
    return `
      <div class="sitemap-legend">
        ${STATUSES.map(s => `
          <span class="legend-item">
            <span class="legend-dot ${STATUS_CLS[s]}"></span>${s}
          </span>
        `).join('')}
        <span class="legend-hint">화면 클릭 → 상태 변경 &nbsp;·&nbsp; 이름 더블클릭 → 편집</span>
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    const sections = getSections();
    const screens  = getScreens();

    document.getElementById('app').innerHTML = `
      ${renderLegend()}

      <div class="sitemap-board">
        ${sections.length === 0
          ? `<div class="sitemap-empty">
               <div class="sitemap-empty-icon">📱</div>
               <div class="sitemap-empty-text">섹션을 추가해서 화면 구조를 만들어보세요<br>
               <span style="font-size:0.75rem;opacity:0.6">예: 온보딩, 메인 탭, 산책 플로우...</span></div>
             </div>`
          : sections.map(s => renderSection(s, screens)).join('')
        }
      </div>

      <button class="sitemap-add-section" onclick="Sitemap.addSection()">
        + 섹션 추가
      </button>
    `;

    bindSectionNameBlur();
  }

  /* ─ 섹션 이름 blur 저장 ─ */
  function bindSectionNameBlur() {
    document.querySelectorAll('.section-name[contenteditable]').forEach(el => {
      el.addEventListener('blur', () => {
        const id   = el.dataset.id;
        const name = el.textContent.trim();
        if (name) Store.update('sitemapSections', id, { name });
      });
    });
  }

  /* ─ 화면 이름 포커스 (더블클릭 시) ─ */
  function focusName(id) {
    const el = document.querySelector(`.screen-name[data-id="${id}"]`);
    if (!el) return;

    const original = el.textContent;
    el.contentEditable = 'true';
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const save = () => {
      el.contentEditable = 'false';
      const name = el.textContent.trim() || original;
      el.textContent = name;
      Store.update('sitemapScreens', id, { name });
      el.removeEventListener('blur', save);
      el.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { el.textContent = original; el.blur(); }
    };
    el.addEventListener('blur', save);
    el.addEventListener('keydown', onKey);
  }

  /* ─ 공개 메서드 ─ */
  function addSection() {
    Store.push('sitemapSections', { name: '새 플로우' });
    render();
    // 새 섹션 이름 자동 포커스
    const els = document.querySelectorAll('.section-name');
    const last = els[els.length - 1];
    if (last) {
      last.focus();
      const range = document.createRange();
      range.selectNodeContents(last);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function addScreen(sectionId) {
    Store.push('sitemapScreens', { sectionId, name: '새 화면', status: '미정', note: '' });
    render();
    // 새 화면 이름 자동 포커스
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    const cards = section.querySelectorAll('.screen-name');
    const last  = cards[cards.length - 1];
    if (last) setTimeout(() => focusName(last.dataset.id), 50);
  }

  function cycleStatus(id) {
    const screen = getScreens().find(s => s.id === id);
    if (!screen) return;
    const idx  = STATUSES.indexOf(screen.status || '미정');
    const next = STATUSES[(idx + 1) % STATUSES.length];
    Store.update('sitemapScreens', id, { status: next });
    render();
  }

  function deleteScreen(id) {
    Store.remove('sitemapScreens', id);
    render();
  }

  function deleteSection(id) {
    if (!confirm('섹션을 삭제하면 안의 화면도 모두 삭제돼요. 계속할까요?')) return;
    getScreens().filter(s => s.sectionId === id)
      .forEach(s => Store.remove('sitemapScreens', s.id));
    Store.remove('sitemapSections', id);
    render();
  }

  return { render, addSection, addScreen, cycleStatus, deleteScreen, deleteSection, focusName };
})();

document.addEventListener('DOMContentLoaded', () => Sitemap.render());
