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
  function getComponents() {
    return (Store.get('sitemapComponents') || []).sort((a, b) => a.createdAt - b.createdAt);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 와이어프레임 플레이스홀더 ─ */
  function renderWireframe() {
    return `
      <div class="screen-wf">
        <div class="wf-rect"></div>
        <div class="wf-row lg"></div>
        <div class="wf-row md"></div>
        <div class="wf-row sm"></div>
      </div>
    `;
  }

  /* ─ 화면 카드 ─ */
  function renderCard(screen, index, allComponents) {
    const cls   = STATUS_CLS[screen.status || '미정'];
    const comps = allComponents.filter(c => c.screenId === screen.id);

    return `
      <div class="screen-card ${cls}" data-screen-id="${screen.id}">
        <div class="screen-card-hd">
          <span class="screen-num">${index + 1}</span>
          <button class="screen-status-btn"
            onclick="Sitemap.cycleStatus('${screen.id}')">${screen.status || '미정'}</button>
          <button class="screen-del" onclick="Sitemap.deleteScreen('${screen.id}')">✕</button>
        </div>
        <div class="screen-name-area">
          <span class="screen-name" data-id="${screen.id}"
            ondblclick="Sitemap.focusName('${screen.id}')">${escapeHtml(screen.name)}</span>
        </div>
        ${renderWireframe()}
        <div class="screen-components">
          ${comps.map(c => `
            <div class="comp-item">
              <span class="comp-dash">—</span>
              <span class="comp-name" data-comp-id="${c.id}"
                ondblclick="Sitemap.focusComponent('${c.id}')">${escapeHtml(c.name)}</span>
              <button class="comp-del" onclick="Sitemap.deleteComponent('${c.id}')">✕</button>
            </div>
          `).join('')}
          <button class="comp-add-btn" onclick="Sitemap.addComponent('${screen.id}')">+ 항목 추가</button>
        </div>
      </div>
    `;
  }

  /* ─ 섹션 ─ */
  function renderSection(section, screens, allComponents) {
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
            <button class="section-del" onclick="Sitemap.deleteSection('${section.id}')">✕</button>
          </div>
        </div>

        <div class="sitemap-screens">
          ${sectionScreens.map((s, i) => `
            ${i > 0 ? '<div class="screen-arrow"><div class="arrow-line"></div><div class="arrow-head">&#9658;</div></div>' : ''}
            ${renderCard(s, i, allComponents)}
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
        <span class="legend-hint">이름 더블클릭 → 편집 &nbsp;·&nbsp; 뱃지 클릭 → 상태 변경</span>
      </div>
    `;
  }

  /* ─ 렌더 ─ */
  function render() {
    const sections   = getSections();
    const screens    = getScreens();
    const components = getComponents();

    document.getElementById('app').innerHTML = `
      ${renderLegend()}

      <div class="sitemap-board">
        ${sections.length === 0
          ? `<div class="sitemap-empty">
               <div class="sitemap-empty-icon">📱</div>
               <div class="sitemap-empty-text">섹션을 추가해서 화면 구조를 만들어보세요<br>
               <span style="font-size:0.75rem;opacity:0.6">예: 온보딩, 메인 탭, 산책 플로우...</span></div>
             </div>`
          : sections.map(s => renderSection(s, screens, components)).join('')
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

  /* ─ 화면 이름 포커스 ─ */
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

  /* ─ 컴포넌트 이름 포커스 ─ */
  function focusComponent(id) {
    const el = document.querySelector(`.comp-name[data-comp-id="${id}"]`);
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
      Store.update('sitemapComponents', id, { name });
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
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    const cards = section.querySelectorAll('.screen-name');
    const last  = cards[cards.length - 1];
    if (last) setTimeout(() => focusName(last.dataset.id), 50);
  }

  function addComponent(screenId) {
    Store.push('sitemapComponents', { screenId, name: '새 항목' });
    render();
    const card = document.querySelector(`[data-screen-id="${screenId}"]`);
    if (!card) return;
    const comps = card.querySelectorAll('.comp-name');
    const last  = comps[comps.length - 1];
    if (last) setTimeout(() => focusComponent(last.dataset.compId), 50);
  }

  function deleteComponent(id) {
    Store.remove('sitemapComponents', id);
    render();
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
    getComponents().filter(c => c.screenId === id)
      .forEach(c => Store.remove('sitemapComponents', c.id));
    Store.remove('sitemapScreens', id);
    render();
  }

  function deleteSection(id) {
    if (!confirm('섹션을 삭제하면 안의 화면도 모두 삭제돼요. 계속할까요?')) return;
    const screens = getScreens().filter(s => s.sectionId === id);
    screens.forEach(s => {
      getComponents().filter(c => c.screenId === s.id)
        .forEach(c => Store.remove('sitemapComponents', c.id));
      Store.remove('sitemapScreens', s.id);
    });
    Store.remove('sitemapSections', id);
    render();
  }

  return {
    render, addSection, addScreen, addComponent, deleteComponent,
    cycleStatus, deleteScreen, deleteSection, focusName, focusComponent,
  };
})();

document.addEventListener('DOMContentLoaded', () => Sitemap.render());
