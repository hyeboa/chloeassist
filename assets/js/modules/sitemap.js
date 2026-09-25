/**
 * sitemap.js — 헬로아지 앱 화면 구조 보드
 */

const Sitemap = (() => {
  const STATUSES  = ['미정', '기획', '디자인중', '개발중', '운영'];
  const STATUS_CLS = {
    '미정':    'st-none',
    '기획':    'st-plan',
    '디자인중': 'st-design',
    '개발중':  'st-dev',
    '운영':    'st-live',
  };

  const PLATFORM_OPTIONS = [
    { id: 'mobile', name: '모바일 앱', code: 'APP', desc: 'iOS · Android 사용자 화면', color: '#7c3aed', bg: '#f5f3ff', line: '#c4b5fd' },
    { id: 'web', name: 'PC 웹', code: 'WEB', desc: '데스크톱 공개 웹 화면', color: '#2563eb', bg: '#eff6ff', line: '#93c5fd' },
    { id: 'ops', name: '운영 콘솔', code: 'OPS', desc: '서비스 운영자용 화면', color: '#c2410c', bg: '#fff7ed', line: '#fdba74' },
    { id: 'internal', name: '내부 도구', code: 'TOOL', desc: '디자인 · 개발 관리 화면', color: '#be185d', bg: '#fdf2f8', line: '#f9a8d4' },
    { id: 'shared', name: '공통', code: 'SHARED', desc: '여러 플랫폼이 함께 쓰는 흐름', color: '#047857', bg: '#ecfdf5', line: '#6ee7b7' },
    { id: 'other', name: '기타 채널', code: 'ETC', desc: '추가 플랫폼과 실험 화면', color: '#475569', bg: '#f8fafc', line: '#cbd5e1' },
    { id: 'unassigned', name: '미분류', code: '—', desc: '플랫폼을 아직 지정하지 않은 흐름', color: '#64748b', bg: '#f8fafc', line: '#cbd5e1' },
  ];

  const MAX_DEPTH = 2;
  const WORKSPACE_PARAM = 'workspace';
  let viewMode = 'diagram';
  let pageTab  = 'screens';
  let linkPickerScreenId = null;
  let ignoreNextHashChange = false;
  const FOCUS_SCREEN_KEY = 'chloeassist:sitemap:focusScreen';

  /* ─ drag state ─ */
  let dragSectionId = null;
  let dragScreenId  = null;

  function getFeatures() { return Store.get('features') || []; }
  function normalizeWorkspaceUrl() {
    const url = new URL(location.href);
    if (!url.searchParams.has(WORKSPACE_PARAM)) return;
    url.searchParams.delete(WORKSPACE_PARAM);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  function loadAll() {
    return Promise.all([
      Store.loadFeatures(),
      Store.loadSitemapSections(),
      Store.loadSitemapScreens(),
      Store.loadSitemapComponents(),
    ]);
  }

  function routeToHash(tab, mode = '') {
    if (tab === 'features') return '#features';
    if (tab === 'screens' && mode === 'board') return '#screens-board';
    return '#screens-diagram';
  }

  function applyRouteFromHash() {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;
    if (hash === 'features') {
      pageTab = 'features';
      return;
    }
    if (hash === 'screens-board') {
      pageTab = 'screens';
      viewMode = 'board';
      return;
    }
    if (hash === 'screens-diagram') {
      pageTab = 'screens';
      viewMode = 'diagram';
    }
  }

  function syncHash(tab, mode = '') {
    const next = routeToHash(tab, mode);
    if (location.hash !== next) {
      ignoreNextHashChange = true;
      location.hash = next;
    }
  }

  function renderToolbar() {
    const isFeatures = pageTab === 'features';
    const isBoard = pageTab === 'screens' && viewMode === 'board';
    const isDiagram = pageTab === 'screens' && viewMode === 'diagram';
    return `
      <nav class="sitemap-toolbar" aria-label="제품 설계 보기">
        <a href="${routeToHash('features')}" class="sitemap-page-tab ${isFeatures ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openFeatures()">기능 목록</a>
        <a href="${routeToHash('screens', 'board')}" class="sitemap-page-tab ${isBoard ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openBoard()">화면 보드</a>
        <a href="${routeToHash('screens', 'diagram')}" class="sitemap-page-tab ${isDiagram ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openDiagram()">화면 구조도</a>
      </nav>`;
  }

  function getSections() {
    let sections = Store.get('sitemapSections') || [];
    if (sections.length && sections.every(s => s.order == null)) {
      sections.sort((a, b) => a.createdAt - b.createdAt);
      sections.forEach((s, i) => { s.order = i + 1; });
      Store.set('sitemapSections', sections);
    }
    return [...sections].sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.createdAt - b.createdAt);
  }

  function getScreens() {
    const screens = Store.get('sitemapScreens') || [];
    return [...screens]
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
  }

  function getComponents() {
    const components = Store.get('sitemapComponents') || [];
    return [...components].sort((a, b) => a.createdAt - b.createdAt);
  }

  function getPlatform(id) {
    return PLATFORM_OPTIONS.find(platform => platform.id === id)
      || PLATFORM_OPTIONS.find(platform => platform.id === 'other');
  }

  function getSectionPlatformId(section) {
    if (PLATFORM_OPTIONS.some(platform => platform.id === section.platform)) return section.platform;
    const name = String(section.name || '').trim();
    if (/^모바일|모바일\s*앱/.test(name)) return 'mobile';
    if (/^PC|PC\s*웹|웹/.test(name)) return 'web';
    if (/운영\s*콘솔|운영/.test(name)) return 'ops';
    if (/디자인\s*콘솔|내부\s*도구/.test(name)) return 'internal';
    return 'unassigned';
  }

  function groupSectionsByPlatform(sections) {
    const grouped = new Map(PLATFORM_OPTIONS.map(platform => [platform.id, []]));
    sections.forEach(section => {
      const platformId = getSectionPlatformId(section);
      (grouped.get(platformId) || grouped.get('other')).push(section);
    });
    return PLATFORM_OPTIONS
      .map(platform => ({ ...platform, sections: grouped.get(platform.id) || [] }))
      .filter(group => group.sections.length > 0);
  }

  function renderPlatformOptions(selectedId) {
    return PLATFORM_OPTIONS
      .filter(platform => platform.id !== 'unassigned')
      .map(platform => `<option value="${platform.id}" ${platform.id === selectedId ? 'selected' : ''}>${platform.name}</option>`)
      .join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

  function renderFeatureLinks(screen) {
    const allFeatures = getFeatures();
    const linked = (screen.featureIds || [])
      .map(id => allFeatures.find(f => f.id === id))
      .filter(Boolean);
    const isPickerOpen = linkPickerScreenId === screen.id;

    return `
      <div class="screen-links">
        ${linked.length ? `<div class="screen-links-row">
          ${linked.map(f => `
            <span class="screen-link-chip cat-${f.category || ''}"
              onclick="event.stopPropagation();Projects.goToFeature('${f.id}')" title="이 보드에서 이 기능 열기" style="cursor:pointer">
              <span class="screen-link-chip-name">${escapeHtml(f.name)}</span>
              <button class="screen-link-chip-x"
                onclick="event.preventDefault();event.stopPropagation();Sitemap.unlinkFeature('${screen.id}','${f.id}')"
                title="연결 해제">&#10005;</button>
            </span>
          `).join('')}
        </div>` : ''}
        <div class="screen-links-btn-row">
          <button class="screen-link-add ${isPickerOpen ? 'is-open' : ''}"
            onclick="event.stopPropagation();Sitemap.toggleLinkPicker('${screen.id}')">
            ${isPickerOpen ? '닫기' : '+ 기능 연결'}
          </button>
        </div>
        ${isPickerOpen ? `
          <div class="screen-link-picker" onclick="event.stopPropagation()">
            ${allFeatures.length === 0
              ? '<div class="screen-link-empty">기능을 먼저 추가해보세요 <button style="margin-left:6px;font-size:0.78rem;color:var(--color-primary);background:none;border:none;cursor:pointer" onclick="event.stopPropagation();Sitemap.openFeatures()">추가 위치로 이동 →</button></div>'
              : allFeatures.map(f => {
                  const on = (screen.featureIds || []).includes(f.id);
                  return `
                    <button class="screen-link-opt ${on ? 'on' : ''}"
                      onclick="event.stopPropagation();Sitemap.toggleLinkFeature('${screen.id}','${f.id}')">
                      <span class="screen-link-opt-mark">${on ? '✓' : ''}</span>
                      <span class="screen-link-opt-name">${escapeHtml(f.name)}</span>
                      <span class="screen-link-opt-status">${f.status}</span>
                    </button>`;
                }).join('')}
          </div>` : ''}
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
          ${screen.route ? `<span class="screen-route">${escapeHtml(screen.route)}</span>` : ''}
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
          <button class="comp-add-btn" onclick="Sitemap.addComponent('${screen.id}')">+ 요소 추가</button>
        </div>
        ${renderFeatureLinks(screen)}
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
    const statusLabel = '운영';
    const done  = sectionScreens.filter(s => s.status === statusLabel).length;
    const collapsed = !!section.collapsed;
    const order = section.order ?? '';

    const rows = collapsed ? [] : collectRows(null, sectionScreens, 1);

    const rowsHTML = rows.map(({ screens, parentId, depth }) => {
      const parentScreen = parentId ? sectionScreens.find(s => s.id === parentId) : null;
      const indent = (depth - 1) * 36;
      return `
        <div class="sitemap-tree-row depth-${depth}">
          <div class="tree-row-label" style="padding-left:${indent + 20}px">
            ${depth > 1 ? '<span class="tree-row-arrow">&#8627;</span>' : ''}
            <span class="tree-depth-badge">${depth}단계</span>
            ${parentScreen ? `<span class="tree-row-parent">${escapeHtml(parentScreen.name)}</span>` : ''}
          </div>
          <div class="sitemap-screens" style="${depth > 1 ? `padding-left:${indent + 20}px` : ''}">
            ${screens.map((s, i) => `
              ${i > 0 ? '<div class="screen-arrow"><div class="arrow-line"></div><div class="arrow-head">&#9658;</div></div>' : ''}
              ${renderCard(s, i, allComponents, depth < MAX_DEPTH)}`).join('')}
            ${depth < MAX_DEPTH ? `
              <button class="screen-add-card" onclick="Sitemap.addScreen('${section.id}',${parentId ? `'${parentId}'` : 'null'})">
                <span class="screen-add-plus">+</span>
                <span class="screen-add-label">하위 화면 추가</span>
              </button>` : ''}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="sitemap-section ${collapsed ? 'is-collapsed' : ''} ${section.isPlatformRoot ? 'is-platform-root' : ''}" data-section-id="${section.id}">
        <div class="sitemap-section-hd">
          <div class="section-name-wrap">
            <input type="number" class="section-order" min="1" value="${order}"
              onchange="Sitemap.setOrder('${section.id}', this.value)"
              onclick="event.stopPropagation()"
              title="표시 순서 (작을수록 위/앞)">
            <button class="section-toggle${collapsed ? ' collapsed' : ''}" onclick="Sitemap.toggleCollapse('${section.id}')" title="${collapsed ? '펼치기' : '접기'}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="section-name" data-id="${section.id}"
              contenteditable="true"
              title="${escapeHtml(section.name)}"
              onkeydown="if(event.key==='Enter'&&!event.isComposing){event.preventDefault();this.blur()}"
              >${escapeHtml(section.name)}</span>
          </div>
          <div class="section-meta">
            <select class="section-platform-select" aria-label="${escapeHtml(section.name)} 플랫폼"
              onchange="Sitemap.setSectionPlatform('${section.id}', this.value)">
              ${getSectionPlatformId(section) === 'unassigned' ? '<option value="unassigned" selected disabled>미분류</option>' : ''}
              ${renderPlatformOptions(getSectionPlatformId(section))}
            </select>
            ${total ? `<span class="section-count">${done}/${total} ${statusLabel}${collapsed ? ' · 접힘' : ''}</span>` : ''}
            <button class="section-del" onclick="Sitemap.deleteSection('${section.id}')">&#10005;</button>
          </div>
        </div>
        ${rowsHTML}
      </div>`;
  }

  function renderPlatformBoard(sections, screens, components) {
    return groupSectionsByPlatform(sections).map(group => {
      const sectionIds = new Set(group.sections.map(section => section.id));
      const platformScreens = screens.filter(screen => sectionIds.has(screen.sectionId));
      const primarySection = group.sections.find(section => section.isPlatformRoot) || group.sections[0];
      return `
        <section class="sitemap-platform-group" data-platform="${group.id}"
          style="--platform-color:${group.color};--platform-bg:${group.bg};--platform-line:${group.line}">
          <header class="sitemap-platform-header">
            <div class="sitemap-platform-title">
              <span class="sitemap-platform-code">${group.code}</span>
              <span class="sitemap-platform-name">${group.name}</span>
              <span class="sitemap-platform-desc">${group.desc}</span>
            </div>
            <div class="sitemap-platform-actions">
              <span class="sitemap-platform-count">${platformScreens.length}개 화면</span>
              ${!primarySection ? '' : `
                <button class="sitemap-platform-add" onclick="Sitemap.addScreen('${primarySection.id}', null)">+ 루트 화면</button>`}
            </div>
          </header>
          <div class="sitemap-platform-sections">
            ${group.sections.map(section => renderSection(section, screens, components)).join('')}
          </div>
        </section>`;
    }).join('');
  }

  function renderAddSectionControls() {
    return `
      <div class="sitemap-add-flow">
        <label class="sitemap-add-flow-label" for="new-section-platform">새 플랫폼</label>
        <select id="new-section-platform" class="sitemap-add-flow-select">
          ${renderPlatformOptions('mobile')}
        </select>
        <button class="sitemap-add-section" onclick="Sitemap.addSection(document.getElementById('new-section-platform').value)">
          + 플랫폼 추가
        </button>
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

  function renderHTNode(screen, allScreens, col, depth = 1) {
    const cls      = STATUS_CLS[screen.status || '미정'];
    const featureCount = Array.isArray(screen.featureIds) ? screen.featureIds.length : 0;
    const children = allScreens
      .filter(s => s.parentId === screen.id)
      .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
    const h = countLeaves(screen.id, allScreens) * HT_LEAF_H;

    return `
      <div class="ht-cw" style="height:${h}px">
        <div class="ht-inner">
          <button type="button" class="diag-scr-node ${cls}" data-screen-id="${screen.id}"
            onclick="Sitemap.goToScreen('${screen.id}')" title="이 보드에서 ${escapeHtml(screen.name)} 열기">
            <span class="diag-scr-main">
              <span class="diag-scr-name">${escapeHtml(screen.name)}</span>
              ${screen.route ? `<span class="diag-scr-route">${escapeHtml(screen.route)}</span>` : ''}
            </span>
            <span class="diag-scr-status">${screen.status || '미정'} · 기능 ${featureCount}</span>
          </button>
          ${children.length ? `
            <div class="ht-hline" style="background:${col.line}"></div>
            <div class="ht-kids" style="--vline:${col.line}">
              ${children.map(child => renderHTNode(child, allScreens, col, depth + 1)).join('')}
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderDiagramView(sections, screens) {
    if (sections.length === 0) return `
      <div class="sitemap-empty">
        <div class="sitemap-empty-icon">&#128241;</div>
        <div class="sitemap-empty-text">이 보드에서 플랫폼과 화면 흐름을 추가하면 여기에 구조도가 표시돼요.</div>
      </div>`;

    const platformGroups = groupSectionsByPlatform(sections);
    const platformsHTML = platformGroups.map(group => {
      const sectionIds = new Set(group.sections.map(section => section.id));
      const platformScreens = screens.filter(screen => sectionIds.has(screen.sectionId));
      const rootScreens = platformScreens
        .filter(screen => !screen.parentId)
        .sort((a, b) => (a.screenOrder ?? 9999) - (b.screenOrder ?? 9999) || a.createdAt - b.createdAt);
      const leaves = rootScreens.reduce((sum, screen) => sum + countLeaves(screen.id, platformScreens), 0) || 1;
      const height = leaves * HT_LEAF_H;
      const col = { border: group.color, bg: group.bg, text: group.color, line: group.line };

      return `
        <div class="ht-platform-cw" style="height:${height}px">
          <div class="ht-inner">
            <div class="ht-platform-node"
              style="--platform-color:${group.color};border-color:${group.color};background:${group.bg};color:${group.color}">
                <span class="ht-platform-code">${group.code}</span>
                <span class="ht-platform-copy">
                  <span class="ht-platform-name">${group.name}</span>
                  <span class="ht-platform-desc">루트 ${rootScreens.length}개 · 전체 ${platformScreens.length}개 화면</span>
                </span>
              </div>
            <div class="ht-hline" style="background:${group.line}"></div>
            <div class="ht-kids ht-platform-kids" style="--vline:${group.line}">
              ${rootScreens.map(screen => renderHTNode(screen, platformScreens, col, 1)).join('')}
            </div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="ht-wrap">
        <div class="ht-header">
          <div class="ht-header-node">
            전체 화면 구조
            <span class="ht-header-count">${platformGroups.length}개 플랫폼 · ${screens.length}개 화면</span>
          </div>
        </div>
        <div class="ht-tree">
          ${platformsHTML}
        </div>
      </div>`;
  }

  /* ════════════════════════════════
     렌더
  ════════════════════════════════ */

  function renderLegend() {
    if (viewMode === 'diagram') return '';
    return `
      <div class="diag-status-legend">
        ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
      </div>`;
  }

  async function render() {
    normalizeWorkspaceUrl();
    applyRouteFromHash();
    await loadAll();
    const sections   = getSections();
    const screens    = getScreens();
    const components = getComponents();
    if (pageTab === 'features') {
      document.getElementById('app').innerHTML = `
        ${renderToolbar()}
        ${Projects.buildHTML({
          statuses: ['아이디어', '기획중', '디자인중', '개발중', '운영'],
        })}`;
      Projects.bindFeatInput();
      return;
    }

    if (viewMode === 'board') {
      document.getElementById('app').innerHTML = `
        ${renderToolbar()}
        ${renderLegend()}
        <div class="sitemap-board">
          ${sections.length === 0
            ? `<div class="sitemap-empty">
                 <div class="sitemap-empty-icon">&#128241;</div>
                 <div class="sitemap-empty-text">구조를 불러오는 중이에요.</div>
               </div>`
            : renderPlatformBoard(sections, screens, components)}
        </div>
        ${renderAddSectionControls()}`;
      bindSectionNameBlur();
      setTimeout(focusQueuedScreen, 50);
      return;
    }

    document.getElementById('app').innerHTML = `
      ${renderToolbar()}
      <div class="diag-status-legend">
        ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
      </div>
      <div class="diag-scroll-wrap">
        ${renderDiagramView(sections, screens)}
      </div>`;
    sessionStorage.removeItem(FOCUS_SCREEN_KEY);
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
  function resetPageScroll() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function renderFromStart() {
    resetPageScroll();
    render();
    setTimeout(resetPageScroll, 80);
  }

  function openFeatures() {
    pageTab = 'features';
    syncHash('features');
    renderFromStart();
  }

  function openBoard() {
    pageTab = 'screens';
    viewMode = 'board';
    syncHash('screens', 'board');
    renderFromStart();
  }

  function openDiagram() {
    pageTab = 'screens';
    viewMode = 'diagram';
    syncHash('screens', 'diagram');
    renderFromStart();
  }

  function setView(mode) {
    pageTab = 'screens';
    viewMode = mode === 'board' ? 'board' : 'diagram';
    syncHash('screens', viewMode);
    renderFromStart();
  }

  function setPageTab(tab) {
    pageTab = tab === 'features' ? 'features' : 'screens';
    syncHash(pageTab, viewMode);
    renderFromStart();
  }
  function rerender()       { render(); }
  function handleHashChange() {
    if (ignoreNextHashChange) {
      ignoreNextHashChange = false;
      return;
    }
    applyRouteFromHash();
    renderFromStart();
  }

  function goToScreen(screenId) {
    sessionStorage.setItem(FOCUS_SCREEN_KEY, screenId);
    pageTab = 'screens';
    viewMode = 'board';
    syncHash('screens', 'board');
    renderFromStart();
  }

  function addSection(platform = 'mobile') {
    const sections = getSections();
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
    const platformId = PLATFORM_OPTIONS.some(option => option.id === platform && option.id !== 'unassigned')
      ? platform
      : 'other';
    const platformInfo = getPlatform(platformId);
    const existingPlatform = sections.find(section => section.isPlatformRoot && getSectionPlatformId(section) === platformId);
    if (existingPlatform) {
      Toast.show(`${platformInfo.name} 플랫폼이 이미 있습니다. 해당 플랫폼에 화면을 추가해 주세요.`, 'info');
      return;
    }
    const item = {
      id: crypto.randomUUID(),
      platform: platformId,
      name: platformInfo.name,
      isPlatformRoot: true,
      order: maxOrder + 1,
      createdAt: Date.now(),
    };
    Store.pushSitemapSection(item).catch(() => {});
    render();
    Toast.show(`${platformInfo.name} 플랫폼을 추가했습니다.`, 'success');
  }

  function setSectionPlatform(id, platform) {
    if (!PLATFORM_OPTIONS.some(option => option.id === platform && option.id !== 'unassigned')) return;
    const section = getSections().find(item => item.id === id);
    Store.update('sitemapSections', id, {
      platform,
      ...(section?.isPlatformRoot ? { name: getPlatform(platform).name } : {}),
    });
    render();
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
    const newId = crypto.randomUUID();
    const item = {
      id: newId,
      sectionId,
      parentId: parentId || null,
      name: '새 화면',
      status: '미정',
      note: '',
      featureIds: [],
    };
    Store.pushSitemapScreen(item).catch(() => {});
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
    const item = { id: crypto.randomUUID(), screenId, name: '새 항목' };
    Store.pushSitemapComponent(item).catch(() => {});
    render();
    window.scrollTo({ top: scrollY, behavior: 'instant' });
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

  function toggleLinkPicker(screenId) {
    linkPickerScreenId = linkPickerScreenId === screenId ? null : screenId;
    render();
  }

  function toggleLinkFeature(screenId, featureId) {
    const screen = getScreens().find(s => s.id === screenId);
    if (!screen) return;
    const ids = Array.isArray(screen.featureIds) ? [...screen.featureIds] : [];
    const idx = ids.indexOf(featureId);
    if (idx >= 0) ids.splice(idx, 1); else ids.push(featureId);
    Store.update('sitemapScreens', screenId, { featureIds: ids });
    render();
  }

  function unlinkFeature(screenId, featureId) {
    const screen = getScreens().find(s => s.id === screenId);
    if (!screen) return;
    const ids = (screen.featureIds || []).filter(id => id !== featureId);
    Store.update('sitemapScreens', screenId, { featureIds: ids });
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

  function focusQueuedScreen() {
    const screenId = sessionStorage.getItem(FOCUS_SCREEN_KEY);
    if (!screenId) return;
    sessionStorage.removeItem(FOCUS_SCREEN_KEY);

    const card = document.querySelector(`.screen-card[data-screen-id="${screenId}"]`);
    if (!card) return;

    card.classList.add('is-target');
    card.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    setTimeout(() => card.classList.remove('is-target'), 3200);
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
    render, setView, setPageTab, rerender, handleHashChange, resetPageScroll,
    openFeatures, openBoard, openDiagram,
    goToScreen,
    addSection, addScreen, addComponent, deleteComponent,
    cycleStatus, deleteScreen, deleteSection, focusName, focusComponent,
    setOrder, setSectionPlatform, toggleCollapse,
    toggleLinkPicker, toggleLinkFeature, unlinkFeature,
    sectionDragStart, sectionDragOver, sectionDragLeave, sectionDrop, sectionDragEnd,
    screenDragStart,  screenDragOver,  screenDragLeave,  screenDrop,  screenDragEnd,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Sitemap.resetPageScroll();
  Sitemap.render();
});
window.addEventListener('hashchange', () => Sitemap.handleHashChange());
