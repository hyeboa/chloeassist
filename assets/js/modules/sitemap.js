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
  let viewMode = 'diagram';
  let pageTab  = 'screens';
  let linkPickerScreenId = null;
  const FOCUS_SCREEN_KEY = 'chloeassist:sitemap:focusScreen';

  /* ─ drag state ─ */
  let dragSectionId = null;
  let dragScreenId  = null;

  let featuresCache = [];
  let sectionsCache = [];
  let screensCache = [];
  let componentsCache = [];
  function getFeatures() { return featuresCache.length ? featuresCache : (Store.get('features') || []); }
  function loadAll() { return Promise.all([Store.loadFeatures().then(v=>featuresCache=v), Store.loadSitemapSections().then(v=>sectionsCache=v), Store.loadSitemapScreens().then(v=>screensCache=v), Store.loadSitemapComponents().then(v=>componentsCache=v)]); }

  function routeToHash(tab, mode = '') {
    if (tab === 'features') return '#features';
    if (tab === 'userflow') return '#userflow';
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
    if (hash === 'userflow') {
      pageTab = 'userflow';
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
    if (location.hash !== next) location.hash = next;
  }

  function sampleGraph() {
    const now = Date.now();
    return {
      features: [
        { id: crypto.randomUUID(), name: '오늘 정리', category: '기획', status: '완료', desc: '하루 계획과 실행 기록' },
        { id: crypto.randomUUID(), name: '프로젝트 연결', category: '개발', status: '개발중', desc: '내 프로젝트와 화면 연결' },
        { id: crypto.randomUUID(), name: '리뷰 보기', category: '운영', status: '기획중', desc: '주간 / 월간 리뷰 확인' },
      ],
      sections: [
        { id: crypto.randomUUID(), name: '매일', order: 1, createdAt: now - 3000 },
        { id: crypto.randomUUID(), name: '설계', order: 2, createdAt: now - 2000 },
        { id: crypto.randomUUID(), name: '돌아보기', order: 3, createdAt: now - 1000 },
      ],
    };
  }

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

  /* ─ 통합 탭 (기능 목록 / 사용자 흐름 / 화면 보드 / 화면 구조도) ─ */
  function renderToolbar() {
    const isFeatures = pageTab === 'features';
    const isFlow     = pageTab === 'userflow';
    const isScreens  = pageTab === 'screens';
    const isBoard    = isScreens && viewMode === 'board';
    const isDiagram  = isScreens && viewMode === 'diagram';
    return `
      <div class="sitemap-toolbar">
        <a href="${routeToHash('features')}" class="sitemap-page-tab ${isFeatures ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openFeatures()">&#10022; 기능 목록</a>
        <a href="${routeToHash('userflow')}" class="sitemap-page-tab ${isFlow ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openUserFlow()">&#8627; 사용자 흐름</a>
        <a href="${routeToHash('screens', 'board')}" class="sitemap-page-tab ${isBoard ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openBoard()">&#9776; 화면 보드</a>
        <a href="${routeToHash('screens', 'diagram')}" class="sitemap-page-tab ${isDiagram ? 'active' : ''}"
          onclick="event.preventDefault();Sitemap.openDiagram()">&#9671; 화면 구조도</a>
      </div>`;
  }

  function renderPageTabs() { return renderToolbar(); }
  function renderViewTabs()  { return ''; }

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
              onclick="event.stopPropagation();Sitemap.openFeatures()" title="기능 목록으로 이동" style="cursor:pointer">
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
              ? '<div class="screen-link-empty">기능 목록에서 먼저 기능을 추가해보세요 <button style="margin-left:6px;font-size:0.78rem;color:var(--color-primary);background:none;border:none;cursor:pointer" onclick="event.stopPropagation();Sitemap.openFeatures()">기능 목록 열기 →</button></div>'
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
    const done  = sectionScreens.filter(s => s.status === '완료').length;
    const collapsed = !!section.collapsed;
    const order = section.order ?? '';

    const rows = collapsed ? [] : collectRows(null, sectionScreens, 2);

    const rowsHTML = rows.map(({ screens, parentId, depth }) => {
      const parentScreen = parentId ? sectionScreens.find(s => s.id === parentId) : null;
      const indent = (depth - 2) * 36;
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
      <div class="sitemap-section ${collapsed ? 'is-collapsed' : ''}" data-section-id="${section.id}">
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
            ${total ? `<span class="section-count">${done}/${total} 완료${collapsed ? ' · 접힘' : ''}</span>` : ''}
            <button class="section-del" onclick="Sitemap.deleteSection('${section.id}')">&#10005;</button>
          </div>
        </div>
        ${rowsHTML}
      </div>`;
  }

  function renderUserFlowSteps(section, rows) {
    return rows.map(({ screens, parentId, depth }) => {
      const parentLabel = parentId ? section ? (getScreens().find(s => s.id === parentId)?.name || '') : '' : '';
      const indent = (depth - 2) * 28;
      return `
        <div class="userflow-row" style="padding-left:${indent}px">
          <div class="userflow-track">
            ${depth > 2 ? `
              <div class="userflow-branch-label">
                <span class="userflow-branch-arrow">&#8627;</span>
                <span class="userflow-branch-parent">${escapeHtml(parentLabel)}</span>
                <span class="userflow-branch-sub">하위 흐름</span>
              </div>` : ''}
            <div class="userflow-flowline">
              ${screens.map((screen, i) => {
                const linkedCount = Array.isArray(screen.featureIds) ? screen.featureIds.length : 0;
                const status = screen.status || '미정';
                const ordinal = String(i + 1).padStart(2, '0');
              return `
                  ${i > 0 ? '<div class="userflow-flow-connector"><span></span><i></i><span></span></div>' : ''}
                  <button class="userflow-node st-${(STATUS_CLS[status] || STATUS_CLS['미정']).replace('st-', '') || 'none'}"
                    onclick="Sitemap.goToScreen('${screen.id}')">
                    <span class="userflow-node-pin"></span>
                    <span class="userflow-node-head">
                      <span class="userflow-node-step">${ordinal}</span>
                      <span class="userflow-node-status">${status}</span>
                    </span>
                    <span class="userflow-node-name">${escapeHtml(screen.name)}</span>
                    <span class="userflow-node-meta">${linkedCount ? `기능 ${linkedCount}개 연결` : '기능 연결 없음'}</span>
                  </button>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderUserFlowView(sections, screens) {
    if (sections.length === 0 || screens.length === 0) {
      return `
        <div class="sitemap-empty">
          <div class="sitemap-empty-icon">&#8627;</div>
          <div class="sitemap-empty-text">
            화면을 추가하면 사용자 흐름이 이곳에 표시돼요.<br>
            <span style="font-size:0.75rem;opacity:0.6">화면 보드에서 화면을 만들고 순서를 잡아보세요.</span>
          </div>
        </div>`;
    }

    const blocks = sections.map((section) => {
      const sectionScreens = screens.filter(s => s.sectionId === section.id);
      if (!sectionScreens.length) return '';
      const rows = collectRows(null, sectionScreens, 2);
      const total = sectionScreens.length;
      const done = sectionScreens.filter(s => s.status === '완료').length;

      return `
        <section class="userflow-section">
          <div class="userflow-section-hd">
            <div class="userflow-section-title">
              <span class="userflow-section-name">${escapeHtml(section.name)}</span>
              <span class="userflow-section-count">${done}/${total} 완료</span>
            </div>
            <div class="userflow-section-desc">진입부터 하위 흐름까지 순서대로 확인</div>
          </div>
          ${renderUserFlowSteps(section, rows)}
        </section>`;
    }).filter(Boolean).join('');

    return `
      <div class="userflow-wrap">
        <div class="userflow-hero">
          <div class="userflow-hero-badge">제품 설계 · 사용자 흐름</div>
          <h2 class="userflow-hero-title">사용자 이동 순서를 따라가는 흐름도입니다.</h2>
          <p class="userflow-hero-desc">보드처럼 카드 목록으로 보지 않고, 시작점과 다음 단계가 한 줄 흐름으로 읽히도록 구성했습니다.</p>
        </div>
        <div class="userflow-points">
          <div class="userflow-point"><span>1</span><strong>진입</strong><em>어디서 시작하는지 봅니다.</em></div>
          <div class="userflow-point"><span>2</span><strong>이동</strong><em>다음에 어디로 가는지 연결합니다.</em></div>
          <div class="userflow-point"><span>3</span><strong>분기</strong><em>하위 흐름이 갈라지는 지점을 봅니다.</em></div>
          <div class="userflow-point"><span>4</span><strong>완료</strong><em>끝까지 자연스럽게 닿는지 확인합니다.</em></div>
        </div>
        <div class="userflow-list">
          ${blocks}
        </div>
      </div>`;
  }

  async function addSampleData(skipRender = false) {
    const sections = getSections();
    const screens = getScreens();
    const features = getFeatures();
    if ((sections.length || screens.length || features.length) && !confirm('이미 데이터가 있습니다. 샘플 데이터를 추가할까요?')) {
      return;
    }

    const sample = sampleGraph();
    for (const feature of sample.features) {
      await Store.pushFeature(feature).catch(() => {});
    }
    for (const section of sample.sections) {
      await Store.pushSitemapSection(section).catch(() => {});
    }

    const createdFeatures = sample.features;
    const sectionIds = sample.sections.map((section) => section.id);
    const screensToCreate = [
      { id: crypto.randomUUID(), sectionId: sectionIds[0], parentId: null, name: '시작 화면', status: '완료', note: '', featureIds: [createdFeatures[0].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[0], parentId: null, name: '로그인', status: '개발중', note: '', featureIds: [createdFeatures[0].id, createdFeatures[1].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[1], parentId: null, name: '대시보드', status: '개발중', note: '', featureIds: [createdFeatures[1].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[1], parentId: null, name: '상세 화면', status: '기획중', note: '', featureIds: [createdFeatures[1].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[1], parentId: null, name: '등록 화면', status: '기획중', note: '', featureIds: [createdFeatures[1].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[2], parentId: null, name: '주간 리뷰', status: '아이디어', note: '', featureIds: [createdFeatures[2].id] },
      { id: crypto.randomUUID(), sectionId: sectionIds[2], parentId: null, name: '월간 리뷰', status: '아이디어', note: '', featureIds: [createdFeatures[2].id] },
    ];

    for (const screen of screensToCreate) {
      await Store.pushSitemapScreen(screen).catch(() => {});
    }

    if (!skipRender) render();
  }

  async function ensureSampleGraph() {
    const sections = getSections();
    const screens = getScreens();
    const features = getFeatures();
    if (sections.length || screens.length || features.length) return false;
    await addSampleData(true);
    return true;
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
      <div class="diag-status-legend">
        ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
      </div>`;
  }

  async function render() {
    applyRouteFromHash();
    await loadAll();
    await ensureSampleGraph();
    const sections   = getSections();
    const screens    = getScreens();
    const components = getComponents();
    if (pageTab === 'features') {
      document.getElementById('app').innerHTML = renderPageTabs() + Projects.buildHTML();
      Projects.bindFeatInput();
      return;
    }

    if (viewMode === 'board') {
      document.getElementById('app').innerHTML = `
        ${renderPageTabs()}
        ${renderViewTabs()}
        ${renderLegend()}
        <div class="sitemap-board">
          ${sections.length === 0
            ? `<div class="sitemap-empty">
                 <div class="sitemap-empty-icon">&#128241;</div>
                 <div class="sitemap-empty-text">섹션을 추가해서 화면 구조를 만들어보세요<br>
                 <span style="font-size:0.75rem;opacity:0.6">예: 진입, 핵심 사용, 리뷰 흐름...</span></div>
               </div>`
            : sections.map(s => renderSection(s, screens, components)).join('')}
        </div>
        ${sections.length === 0 && screens.length === 0
          ? `<button class="sitemap-add-section" onclick="Sitemap.addSampleData()">샘플 데이터 넣기</button>
             <button class="sitemap-add-section" style="margin-top:10px" onclick="Sitemap.addSection()">+ 섹션 추가</button>`
          : `<button class="sitemap-add-section" onclick="Sitemap.addSection()">+ 섹션 추가</button>`}`;
      bindSectionNameBlur();
      setTimeout(focusQueuedScreen, 50);
    } else if (pageTab === 'userflow') {
      document.getElementById('app').innerHTML = `
        ${renderPageTabs()}
        ${renderUserFlowView(sections, screens)}
      `;
    } else {
      document.getElementById('app').innerHTML = `
        ${renderPageTabs()}
        ${renderViewTabs()}
        <div class="diag-status-legend">
          ${STATUSES.map(s => `<span class="legend-item"><span class="legend-dot ${STATUS_CLS[s]}"></span>${s}</span>`).join('')}
        </div>
        <div class="diag-scroll-wrap">
          ${renderDiagramView(sections, screens)}
        </div>`;
      sessionStorage.removeItem(FOCUS_SCREEN_KEY);
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
  function openFeatures() {
    pageTab = 'features';
    syncHash('features');
    render();
  }

  function openUserFlow() {
    pageTab = 'userflow';
    syncHash('userflow');
    render();
  }

  function openBoard() {
    pageTab = 'screens';
    viewMode = 'board';
    syncHash('screens', 'board');
    render();
  }

  function openDiagram() {
    pageTab = 'screens';
    viewMode = 'diagram';
    syncHash('screens', 'diagram');
    render();
  }

  function setView(mode) {
    viewMode = mode;
    syncHash('screens', mode);
    render();
  }

  function setPageTab(tab) {
    pageTab = tab;
    if (tab === 'userflow') viewMode = 'diagram';
    syncHash(tab, viewMode);
    render();
  }
  function rerender()       { render(); }

  function goToScreen(screenId) {
    sessionStorage.setItem(FOCUS_SCREEN_KEY, screenId);
    pageTab = 'screens';
    viewMode = 'board';
    syncHash('screens', 'board');
    render();
  }

  function addSection() {
    const sections = getSections();
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
    const item = { id: crypto.randomUUID(), name: '새 플로우', order: maxOrder + 1, createdAt: Date.now() };
    Store.pushSitemapSection(item).catch(() => {});
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
    setTimeout(() => card.classList.remove('is-target'), 1800);
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
    render, setView, setPageTab, rerender,
    openFeatures, openUserFlow, openBoard, openDiagram,
    goToScreen,
    addSampleData,
    addSection, addScreen, addComponent, deleteComponent,
    cycleStatus, deleteScreen, deleteSection, focusName, focusComponent,
    setOrder, toggleCollapse,
    toggleLinkPicker, toggleLinkFeature, unlinkFeature,
    sectionDragStart, sectionDragOver, sectionDragLeave, sectionDrop, sectionDragEnd,
    screenDragStart,  screenDragOver,  screenDragLeave,  screenDrop,  screenDragEnd,
  };
})();

document.addEventListener('DOMContentLoaded', () => Sitemap.render());
