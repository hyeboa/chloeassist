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

  const BRANCH_COLORS = [
    { border: '#a78bfa', bg: '#faf5ff', text: '#5b21b6', line: '#c4b5fd' },
    { border: '#60a5fa', bg: '#eff6ff', text: '#1d4ed8', line: '#93c5fd' },
    { border: '#fb923c', bg: '#fff7ed', text: '#c2410c', line: '#fdba74' },
    { border: '#34d399', bg: '#f0fdf4', text: '#065f46', line: '#6ee7b7' },
    { border: '#f472b6', bg: '#fdf2f8', text: '#9d174d', line: '#f9a8d4' },
    { border: '#fbbf24', bg: '#fefce8', text: '#92400e', line: '#fde68a' },
  ];

  const MAX_DEPTH = 4;
  let viewMode = 'board';

  /* ─ drag state ─ */
  let dragSectionId = null;
  let dragScreenId  = null;

  function getSections() {
    let sections = Store.get('sitemapSections') || [];
    if (sections.length && sections.every(s => s.order == null)) {
      sections.sort((a, b) => a.createdAt - b.createdAt);
      sections.forEach((s, i) => { s.order = i + 1; });
      Store.set('sitemapSections', sections);
    }
    return sections.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.createdAt - b.createdAt);
  }

  function getScreens() {
    return (Store.get('sitemapScreens') || [])
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
  }

  function getComponents() {
    return (Store.get('sitemapComponents') || []).sort((a, b) => a.createdAt - b.createdAt);
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 화면 깊이 계산 ─ */
  function getDepth(screenId, allScreens) {
    let depth = 2, s = allScreens.find(x => x.id === screenId);
    while (s && s.parentId) { depth++; s = allScreens.find(x => x.id === s.parentId); }
    return depth;
  }

  /* ─ 뷰 탭 ─ */
  function renderViewTabs() {
    return `
      <div class="sitemap-view-tabs">
        <button class="sitemap-view-tab ${viewMode === 'board'   ? 'active' : ''}" onclick="Sitemap.setView('board')">&#9776; 보드</button>
        <button class="sitemap-view-tab ${viewMode === 'diagram' ? 'active' : ''}" onclick="Sitemap.setView('diagram')">&#9671; 구조도</button>
      </div>`;
  }

  /* ════════════════════════════════
     보드 뷰
  ════════════════════════════════ */

  function renderWireframe() {
    return `
      <div class="screen-wf">
        <div class="wf-rect"></div>
        <div class="wf-row lg"></div>
        <div class="wf-row md"></div>
        <div class="wf-row sm"></div>
      </div>`;
  }

  function renderCard(screen, index, allComponents, canAddChild) {
    const cls   = STATUS_CLS[screen.status || '미정'];
    const comps = allComponents.filter(c => c.screenId === screen.id);
    return `
      <div class="screen-card ${cls}" data-screen-id="${screen.id}"
        draggable="true"
        ondragstart="Sitemap.screenDragStart(event,'${screen.id}')"
        ondragover="Sitemap.screenDragOver(event)"
        ondragleave="Sitemap.screenDragLeave(event)"
        ondrop="Sitemap.screenDrop(event,'${screen.id}')"
        ondragend="Sitemap.screenDragEnd(event)">
        <div class="screen-card-hd">
          <span class="screen-num">${index + 1}</span>
          <button class="screen-status-btn" onclick="Sitemap.cycleStatus('${screen.id}')">${screen.status || '미정'}</button>
          <button class="screen-del" onclick="Sitemap.deleteScreen('${screen.id}')">&#10005;</button>
        </div>
        <div class="screen-name-area">
          <span class="screen-name" data-id="${screen.id}"
            ondblclick="Sitemap.focusName('${screen.id}')">${escapeHtml(screen.name)}</span>
        </div>
        ${renderWireframe()}
        <div class="screen-components">
          ${comps.map(c => `
            <div class="comp-item">
              <span class="comp-dash">&#8212;</span>
              <span class="comp-name" data-comp-id="${c.id}"
                ondblclick="Sitemap.focusComponent('${c.id}')">${escapeHtml(c.name)}</span>
              <button class="comp-del" onclick="Sitemap.deleteComponent('${c.id}')">&#10005;</button>
            </div>`).join('')}
          <button class="comp-add-btn" onclick="Sitemap.addComponent('${screen.id}')">+ 항목 추가</button>
        </div>
        ${canAddChild ? `
          <button class="screen-add-sub"
            onclick="event.stopPropagation();Sitemap.addScreen('${screen.sectionId}','${screen.id}')">
            &#8595; 하위 화면 추가
          </button>` : ''}
      </div>`;
  }

  /* 섹션 내 모든 행을 DFS 순서로 수집 */
  function collectRows(parentId, allSectionScreens, depth) {
    if (depth > MAX_DEPTH) return [];
    const screens = allSectionScreens
      .filter(s => (s.parentId || null) === parentId)
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);

    const rows = [{ screens, parentId, depth }];
    screens.forEach(s => {
      const hasKids = allSectionScreens.some(c => c.parentId === s.id);
      if (hasKids) rows.push(...collectRows(s.id, allSectionScreens, depth + 1));
    });
    return rows;
  }

  function renderSection(section, allScreens, allComponents) {
    const sectionScreens = allScreens.filter(s => s.sectionId === section.id);
    const total = sectionScreens.length;
    const done  = sectionScreens.filter(s => s.status === '완료').length;
    const collapsed = !!section.collapsed;
    const order = section.order ?? '';

    const rows = collapsed ? [] : collectRows(null, sectionScreens, 2);

    const rowsHTML = rows.map(({ screens, parentId, depth }) => {
      const parentScreen = parentId ? sectionScreens.find(s => s.id === parentId) : null;
      const indent = (depth - 2) * 20;
      return `
        <div class="sitemap-tree-row depth-${depth}">
          ${depth > 2 ? `
            <div class="tree-row-label" style="padding-left:${indent + 20}px">
              <span class="tree-row-arrow">&#8627;</span>
              <span class="tree-row-parent">${parentScreen ? escapeHtml(parentScreen.name) : ''}</span>
              <span class="tree-row-sub">하위 화면</span>
            </div>` : ''}
          <div class="sitemap-screens" style="${depth > 2 ? `padding-left:${indent + 20}px` : ''}">
            ${screens.map((s, i) => `
              ${i > 0 ? '<div class="screen-arrow"><div class="arrow-line"></div><div class="arrow-head">&#9658;</div></div>' : ''}
              ${renderCard(s, i, allComponents, depth < MAX_DEPTH)}`).join('')}
            ${depth < MAX_DEPTH ? `
              <button class="screen-add-card" onclick="Sitemap.addScreen('${section.id}',${parentId ? `'${parentId}'` : 'null'})">
                <span class="screen-add-plus">+</span>
                <span class="screen-add-label">${depth === 2 ? '화면 추가' : '하위 추가'}</span>
              </button>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="sitemap-section ${collapsed ? 'is-collapsed' : ''}" data-section-id="${section.id}"
        draggable="true"
        ondragstart="Sitemap.sectionDragStart(event,'${section.id}')"
        ondragover="Sitemap.sectionDragOver(event)"
        ondragleave="Sitemap.sectionDragLeave(event)"
        ondrop="Sitemap.sectionDrop(event,'${section.id}')"
        ondragend="Sitemap.sectionDragEnd(event)">
        <div class="sitemap-section-hd">
          <div class="section-name-wrap">
            <button class="section-drag-handle" title="드래그로 순서 변경">&#8942;</button>
            <input type="number" class="section-order" min="1" value="${order}"
              onchange="Sitemap.setOrder('${section.id}', this.value)"
              onclick="event.stopPropagation()"
              title="표시 순서 (작을수록 위/앞)">
            <button class="section-toggle" onclick="Sitemap.toggleCollapse('${section.id}')"
              title="${collapsed ? '펼치기' : '접기'}">${collapsed ? '&#9656;' : '&#9662;'}</button>
            <span class="section-icon">&#9703;</span>
            <span class="section-name" data-id="${section.id}"
              contenteditable="true"
              title="${escapeHtml(section.name)}"
              onkeydown="if(event.key==='Enter'&&!event.isComposing){event.preventDefault();this.blur()}"
              >${escapeHtml(section.name)}</span>
          </div>
          <div class="section-meta">
            ${total ? `<span class="section-count">${done}/${total} 완료${collapsed ? ' · 접힘' : ''}</span>` : ''}
            <button class="section-del" onclick="Sitemap.deleteSection('${section.id}')">&#10005;</button>
          </div>
        </div>
        ${rowsHTML}
      </div>`;
  }

  /* ════════════════════════════════
     구조도 뷰 — 좌→우 수평 트리
  ════════════════════════════════ */

  const HT_LEAF_H = 44;

  function countLeaves(screenId, allScreens) {
    const children = allScreens.filter(s => s.parentId === screenId);
    if (!children.length) return 1;
    return children.reduce((sum, c) => sum + countLeaves(c.id, allScreens), 0);
  }

  function renderHTNode(screen, allScreens, col) {
    const cls      = STATUS_CLS[screen.status || '미정'];
    const children = allScreens
      .filter(s => s.parentId === screen.id)
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
    const h = countLeaves(screen.id, allScreens) * HT_LEAF_H;

    return `
      <div class="ht-cw" style="height:${h}px">
        <div class="ht-inner">
          <div class="diag-scr-node ${cls}">
            <span class="diag-scr-name">${escapeHtml(screen.name)}</span>
            <span class="diag-scr-status">${screen.status || '미정'}</span>
          </div>
          ${children.length ? `
            <div class="ht-hline" style="background:${col.line}"></div>
            <div class="ht-kids" style="--vline:${col.line}">
              ${children.map(c => renderHTNode(c, allScreens, col)).join('')}
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderDiagramView(sections, screens) {
    if (sections.length === 0) return `
      <div class="sitemap-empty">
        <div class="sitemap-empty-icon">&#128241;</div>
        <div class="sitemap-empty-text">보드 뷰에서 화면을 추가하면 여기에 구조도가 표시돼요.</div>
      </div>`;

    const sectionsHTML = sections.map((section, si) => {
      const level2   = screens
        .filter(s => s.sectionId === section.id && !s.parentId)
        .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
      const col       = BRANCH_COLORS[si % BRANCH_COLORS.length];
      const collapsed = !!section.collapsed;
      const secLeaves = collapsed ? 1 : (level2.reduce((sum, s) => sum + countLeaves(s.id, screens), 0) || 1);
      const secH      = secLeaves * HT_LEAF_H;

      return `
        <div class="ht-sec-cw" style="height:${secH}px">
          <div class="ht-inner">
            <div class="ht-sec-node ${collapsed ? 'is-collapsed' : ''}"
              style="border-color:${col.border};background:${col.bg};color:${col.text}"
              onclick="Sitemap.toggleCollapse('${section.id}')"
              title="${escapeHtml(section.name)}">
              ${collapsed ? '<span class="ht-sec-toggle">&#9656;</span>' : ''}
              <span class="ht-sec-name">${escapeHtml(section.name)}</span>
              <span class="ht-sec-count">${level2.length}</span>
            </div>
            ${(level2.length && !collapsed) ? `
              <div class="ht-hline" style="background:${col.line}"></div>
              <div class="ht-kids" style="--vline:${col.line}">
                ${level2.map(s => renderHTNode(s, screens, col)).join('')}
              </div>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="ht-wrap">
        <div class="ht-header">
          <div class="ht-header-node">
            전체 화면 구조
            <span class="ht-header-count">${screens.length}개 화면</span>
          </div>
        </div>
        <div class="ht-tree">
          ${sectionsHTML}
        </div>
      </div>`;
  }

  /* ════════════════════════════════
     렌더
  ════════════════════════════════ */

  function renderLegend() {
    if (viewMode === 'diagram') return '';
    return `
      <div class="sitemap-legend">
        ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
        <span class="legend-hint">이름 더블클릭 &#8594; 편집 &nbsp;&#183;&nbsp; 뱃지 클릭 &#8594; 상태 변경</span>
      </div>`;
  }

  function render() {
    const sections   = getSections();
    const screens    = getScreens();
    const components = getComponents();

    if (viewMode === 'board') {
      document.getElementById('app').innerHTML = `
        ${renderViewTabs()}
        ${renderLegend()}
        <div class="sitemap-board">
          ${sections.length === 0
            ? `<div class="sitemap-empty">
                 <div class="sitemap-empty-icon">&#128241;</div>
                 <div class="sitemap-empty-text">섹션을 추가해서 화면 구조를 만들어보세요<br>
                 <span style="font-size:0.75rem;opacity:0.6">예: 온보딩, 메인 탭, 산책 플로우...</span></div>
               </div>`
            : sections.map(s => renderSection(s, screens, components)).join('')}
        </div>
        <button class="sitemap-add-section" onclick="Sitemap.addSection()">+ 섹션 추가</button>`;
      bindSectionNameBlur();
    } else {
      document.getElementById('app').innerHTML = `
        ${renderViewTabs()}
        <div class="diag-status-legend">
          ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
        </div>
        <div class="diag-scroll-wrap">
          ${renderDiagramView(sections, screens)}
        </div>`;
    }
  }

  function bindSectionNameBlur() {
    document.querySelectorAll('.section-name[contenteditable]').forEach(el => {
      el.addEventListener('blur', () => {
        const id = el.dataset.id, name = el.textContent.trim();
        if (name) {
          Store.update('sitemapSections', id, { name });
          el.title = name;
        }
      });
    });
  }

  function focusName(id) {
    const el = document.querySelector(`.screen-name[data-id="${id}"]`);
    if (!el) return;
    const original = el.textContent;
    el.contentEditable = 'true';
    el.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const save = () => {
      el.contentEditable = 'false';
      const name = el.textContent.trim() || original;
      el.textContent = name;
      Store.update('sitemapScreens', id, { name });
      el.removeEventListener('blur', save); el.removeEventListener('keydown', onKey);
      /* 부모 카드 이름이 바뀌면 하위 행 레이블도 같이 갱신되도록 재렌더 */
      if (name !== original) render();
    };
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape' && !e.isComposing) { el.textContent = original; el.blur(); }
    };
    el.addEventListener('blur', save); el.addEventListener('keydown', onKey);
  }

  function focusComponent(id) {
    const el = document.querySelector(`.comp-name[data-comp-id="${id}"]`);
    if (!el) return;
    const original = el.textContent;
    el.contentEditable = 'true';
    el.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    const save = () => {
      el.contentEditable = 'false';
      const name = el.textContent.trim() || original;
      el.textContent = name;
      Store.update('sitemapComponents', id, { name });
      el.removeEventListener('blur', save); el.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape' && !e.isComposing) { el.textContent = original; el.blur(); }
    };
    el.addEventListener('blur', save); el.addEventListener('keydown', onKey);
  }

  /* ─ 공개 메서드 ─ */
  function setView(mode) { viewMode = mode; render(); }

  function addSection() {
    const sections = getSections();
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
    Store.push('sitemapSections', { name: '새 플로우', order: maxOrder + 1 });
    render();
    const els = document.querySelectorAll('.section-name');
    const last = els[els.length - 1];
    if (last) {
      last.focus();
      const r = document.createRange(); r.selectNodeContents(last);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
  }

  function setOrder(id, value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return;
    Store.update('sitemapSections', id, { order: n });
    render();
  }

  function toggleCollapse(id) {
    const sec = (Store.get('sitemapSections') || []).find(s => s.id === id);
    if (!sec) return;
    Store.update('sitemapSections', id, { collapsed: !sec.collapsed });
    render();
  }

  function addScreen(sectionId, parentId = null) {
    /* 스크롤 위치 보존 → render 직후 복구 → 새 카드만 최소 스크롤로 가시화 */
    const scrollY = window.scrollY;
    const pushed = Store.push('sitemapScreens', {
      sectionId,
      parentId: parentId || null,
      name: '새 화면', status: '미정', note: '',
    });
    const newId = pushed[pushed.length - 1].id;
    render();
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    setTimeout(() => {
      const card = document.querySelector(`.screen-card[data-screen-id="${newId}"]`);
      if (card) card.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      const nameEl = card?.querySelector('.screen-name');
      if (nameEl) focusName(nameEl.dataset.id);
    }, 50);
  }

  function addComponent(screenId) {
    const scrollY = window.scrollY;
    Store.push('sitemapComponents', { screenId, name: '새 항목' });
    render();
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    const card = document.querySelector(`[data-screen-id="${screenId}"]`);
    if (!card) return;
    const comps = card.querySelectorAll('.comp-name');
    const last  = comps[comps.length - 1];
    if (last) setTimeout(() => focusComponent(last.dataset.compId), 50);
  }

  function deleteComponent(id) { Store.remove('sitemapComponents', id); render(); }

  function cycleStatus(id) {
    const screen = getScreens().find(s => s.id === id);
    if (!screen) return;
    const idx = STATUSES.indexOf(screen.status || '미정');
    Store.update('sitemapScreens', id, { status: STATUSES[(idx + 1) % STATUSES.length] });
    render();
  }

  function deleteScreen(id) {
    function removeRecursive(screenId) {
      getScreens().filter(s => s.parentId === screenId).forEach(s => removeRecursive(s.id));
      getComponents().filter(c => c.screenId === screenId).forEach(c => Store.remove('sitemapComponents', c.id));
      Store.remove('sitemapScreens', screenId);
    }
    removeRecursive(id);
    render();
  }

  function deleteSection(id) {
    if (!confirm('섹션을 삭제하면 안의 화면도 모두 삭제돼요. 계속할까요?')) return;
    getScreens().filter(s => s.sectionId === id).forEach(s => {
      getComponents().filter(c => c.screenId === s.id).forEach(c => Store.remove('sitemapComponents', c.id));
      Store.remove('sitemapScreens', s.id);
    });
    Store.remove('sitemapSections', id);
    render();
  }

  /* ══════════════════════════════
     섹션 드래그앤드롭 (보드)
  ══════════════════════════════ */

  function sectionDragStart(e, id) {
    if (!e.target.closest('.section-drag-handle')) { e.preventDefault(); return; }
    dragSectionId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('is-dragging');
  }

  function sectionDragOver(e) {
    if (!dragSectionId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const section = e.currentTarget;
    if (section.dataset.sectionId !== dragSectionId) {
      section.classList.add('drag-over');
    }
  }

  function sectionDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-over');
    }
  }

  function sectionDrop(e, targetId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (!dragSectionId || dragSectionId === targetId) { dragSectionId = null; return; }

    let sections = getSections();
    const fromIdx = sections.findIndex(s => s.id === dragSectionId);
    const toIdx   = sections.findIndex(s => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { dragSectionId = null; return; }

    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    sections.forEach((s, i) => { s.order = i + 1; });
    Store.set('sitemapSections', sections);
    dragSectionId = null;
    render();
  }

  function sectionDragEnd(e) {
    document.querySelectorAll('.sitemap-section').forEach(el => el.classList.remove('is-dragging', 'drag-over'));
    dragSectionId = null;
  }

  /* ══════════════════════════════
     화면 카드 드래그앤드롭 (보드)
  ══════════════════════════════ */

  function screenDragStart(e, id) {
    e.stopPropagation();
    dragScreenId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('is-dragging');
  }

  function screenDragOver(e) {
    if (!dragScreenId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (e.currentTarget.dataset.screenId !== dragScreenId) {
      e.currentTarget.classList.add('drag-over');
    }
  }

  function screenDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-over');
    }
  }

  function screenDrop(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    if (!dragScreenId || dragScreenId === targetId) { dragScreenId = null; return; }

    const allScreens = Store.get('sitemapScreens') || [];
    const fromScreen = allScreens.find(s => s.id === dragScreenId);
    const toScreen   = allScreens.find(s => s.id === targetId);
    if (!fromScreen || !toScreen) { dragScreenId = null; return; }

    /* 같은 부모 그룹 내에서만 재정렬 허용 */
    if (fromScreen.sectionId !== toScreen.sectionId ||
        (fromScreen.parentId || null) !== (toScreen.parentId || null)) {
      dragScreenId = null; return;
    }

    const siblings = allScreens
      .filter(s => s.sectionId === fromScreen.sectionId &&
                   (s.parentId || null) === (fromScreen.parentId || null))
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);

    const fromIdx = siblings.findIndex(s => s.id === dragScreenId);
    const toIdx   = siblings.findIndex(s => s.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { dragScreenId = null; return; }

    const [moved] = siblings.splice(fromIdx, 1);
    siblings.splice(toIdx, 0, moved);
    siblings.forEach((s, i) => {
      const item = allScreens.find(x => x.id === s.id);
      if (item) item.screenOrder = i + 1;
    });
    Store.set('sitemapScreens', allScreens);
    dragScreenId = null;
    render();
  }

  function screenDragEnd(e) {
    document.querySelectorAll('.screen-card').forEach(el => el.classList.remove('is-dragging', 'drag-over'));
    dragScreenId = null;
  }

  return {
    render, setView, addSection, addScreen, addComponent, deleteComponent,
    cycleStatus, deleteScreen, deleteSection, focusName, focusComponent,
    setOrder, toggleCollapse,
    sectionDragStart, sectionDragOver, sectionDragLeave, sectionDrop, sectionDragEnd,
    screenDragStart,  screenDragOver,  screenDragLeave,  screenDrop,  screenDragEnd,
  };
})();

document.addEventListener('DOMContentLoaded', () => Sitemap.render());
