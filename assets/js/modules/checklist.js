/**
 * checklist.js — 출시 체크 리스트
 * 출시 준비에 필요한 항목을 템플릿으로 빠르게 만들고 관리한다.
 */

const Checklist = (() => {
  let showGuide  = true;

  /* ─ 카테고리 ─ */
  const CATS = {
    product:    { label: '제품',     cls: 'cat-product' },
    marketing:  { label: '마케팅',   cls: 'cat-marketing' },
    operations: { label: '운영',     cls: 'cat-operations' },
    technical:  { label: '기술/배포', cls: 'cat-technical' },
    etc:        { label: '기타',     cls: 'cat-etc' },
  };

  /* ─ 기본 템플릿 ─ */
  const TEMPLATES = {
    product: {
      label: '제품 출시', category: 'product',
      items: [
        '핵심 기능 QA 완료',
        '베타 테스트 및 피드백 반영',
        '성능 최적화 및 로딩 시간 개선',
        '주요 버그 정리 및 문서화',
        '개인정보 처리방침 작성 및 검토',
        '이용약관 작성',
        '앱 스토어/플레이스토어 개발자 계정 설정',
        '스토어 등록 정보 작성(설명, 스크린샷, 아이콘)',
        '온보딩/튜토리얼 UI 최종 점검',
        'FAQ 문서 작성',
        'crash 리포팅 도구(Firebase 등) 연동',
        '버전 관리 전략 수립',
        '출시 공지 초안 작성',
        '고객 지원 채널 준비(이메일, 채팅 등)',
      ],
    },
    marketing: {
      label: '마케팅 출시', category: 'marketing',
      items: [
        '출시 메시지·슬로건 확정',
        '브랜드 로고·가이드라인 확정',
        '출시 공개 페이지/랜딩 페이지 제작',
        '소셜 미디어 프로필 완성(프로필 사진, 소개, 링크)',
        'SNS 콘텐츠 달력 작성 및 예약 발행 준비',
        '보도자료/프레스 릴리즈 작성',
        '미디어 연락처 리스트 준비',
        '이메일·뉴스레터 발송 준비',
        '협업·인플루언서 컨택 목록 작성',
        '아이디어 얼리어댑터 모집 계획',
        '리뷰/평점 유도 전략 수립',
        '광고 캠페인 세팅(Google Ads, Facebook 등)',
        '분석 트래킹 설정(Google Analytics, 혼합 분석 등)',
        '출시 이벤트/웨비나 기획',
      ],
    },
    operations: {
      label: '운영 출시', category: 'operations',
      items: [
        '운영 매뉴얼 문서화',
        '긴급 연락처 및 에스컬레이션 매뉴얼 작성',
        '일일/주간 점검 체크리스트 준비',
        '고객 피드백 수집 및 분석 프로세스 정의',
        '버그 리포팅 시스템 구축',
        '성능 대시보드 구성',
        '모니터링·알림 설정(Slack, PagerDuty 등)',
        '데이터 백업 자동화 설정',
        '장애 대응(롤백) 계획 수립 및 테스트',
        '핵심 지표(KPI) 정의',
        'CS 응대 템플릿 및 FAQ 준비',
        '고객 온보딩 프로세스 정의',
      ],
    },
    technical: {
      label: '기술 점검', category: 'technical',
      items: [
        '최종 코드 리뷰 및 정리',
        '프로덕션 배포 체크리스트 확인',
        '데이터베이스 마이그레이션 테스트',
        '백업·복구 프로세스 테스트',
        '보안 취약점 스캔(OWASP, 등)',
        '보안 헤더 설정 완료(HTTPS, CSP 등)',
        'API 레이트 제한 설정',
        '도메인 설정 및 DNS 확인',
        'SSL/TLS 인증서 설치 및 확인',
        'CDN·캐시 정책 설정',
        '부하 테스트 진행 및 결과 분석',
        '에러 로깅·모니터링 연동',
        '로그 저장소 구성 및 보관 정책 수립',
        '알림 통합 설정(Slack, 이메일 등)',
        '버전 관리(Git 태그) 정책 확정',
        '롤백 프로세스 문서화 및 테스트',
      ],
    },
    empty: {
      label: '빈 체크 리스트', category: 'etc',
      items: [],
    },
  };

  /* ─ 데이터 ─ */
  function getLists() { return Store.get('launchChecklists') || []; }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function checkSvg() {
    return `<svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function chevronSvg() {
    return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  /* ─ 상단 바: 통계 + AI 입력 ─ */
  function renderTopBar(lists) {
    const totalLists = lists.length;
    const allItems   = lists.reduce((n, l) => n + (l.items || []).length, 0);
    const doneItems  = lists.reduce((n, l) => n + (l.items || []).filter(i => i.done).length, 0);
    const remain     = allItems - doneItems;
    const pct        = allItems ? Math.round(doneItems / allItems * 100) : 0;
    return `
      <div class="cl-topbar">
        <div class="cl-stats">
          <div class="cl-stat">
            <div class="cl-stat-value">${pct}<span>%</span></div>
            <div class="cl-stat-label">전체 진행률</div>
            <div class="cl-stat-bar"><div class="cl-stat-bar-fill ${pct === 100 ? 'done' : ''}" style="width:${pct}%"></div></div>
          </div>
          <div class="cl-stat-divider"></div>
          <div class="cl-stat">
            <div class="cl-stat-value">${remain}<span>개</span></div>
            <div class="cl-stat-label">남은 항목</div>
          </div>
          <div class="cl-stat">
            <div class="cl-stat-value">${doneItems}<span>개</span></div>
            <div class="cl-stat-label">완료 항목</div>
          </div>
          <div class="cl-stat">
            <div class="cl-stat-value">${totalLists}<span>개</span></div>
            <div class="cl-stat-label">체크 리스트</div>
          </div>
        </div>
        <div class="cl-ai-add">
          <div class="cl-ai-inner">
            <div class="cl-ai-add-row">
              <span class="cl-ai-icon">✦</span>
              <input id="cl-ai-input" class="cl-ai-input" type="text"
                placeholder="추가할 항목을 자유롭게 입력하면 AI가 분류해서 넣어줘요  (예: 앱스토어 스크린샷 5장 준비)">
              <span class="cl-ai-hint">Enter</span>
            </div>
            <div class="cl-ai-status" id="cl-ai-status"></div>
          </div>
        </div>
      </div>`;
  }

  /* ─ 카테고리별 항목 리스트 ─ */
  function renderCategorySection(lists, category) {
    const cat = CATS[category] || CATS.etc;
    const catLists = lists.filter(l => l.category === category);

    // 이 카테고리의 모든 항목 수집
    const allItems = [];
    catLists.forEach(list => {
      (list.items || []).forEach(item => {
        allItems.push({ ...item, listId: list.id, listTitle: list.title });
      });
    });

    const done = allItems.filter(i => i.done).length;
    const total = allItems.length;
    const pct = total ? Math.round(done / total * 100) : 0;

    const itemRows = allItems.map(it => `
      <div class="cl-item-row${it.done ? ' done' : ''}">
        <button class="cl-item-check${it.done ? ' checked' : ''}"
          onclick="Checklist.toggleItem('${it.listId}','${it.id}')" title="${it.done ? '완료 해제' : '완료'}">
          ${it.done ? checkSvg() : ''}
        </button>
        <span class="cl-item-text">${escapeHtml(it.text)}</span>
        <span class="cl-item-list-tag">${escapeHtml(it.listTitle)}</span>
        <button class="cl-item-del" onclick="Checklist.deleteItem('${it.listId}','${it.id}')" title="삭제">✕</button>
      </div>`).join('');

    return `
      <div class="cl-category-section">
        <div class="cl-category-header">
          <span class="cl-cat-badge ${cat.cls}">${cat.label}</span>
          <div class="cl-category-progress">
            <span class="cl-progress-text">${done} / ${total}</span>
            <div class="cl-progress-bar"><div class="cl-progress-fill" style="width:${pct}%"></div></div>
          </div>
        </div>
        <div class="cl-category-items">
          ${total === 0
            ? '<div class="cl-items-empty">항목이 없어요</div>'
            : itemRows}
        </div>
      </div>`;
  }

  /* ─ 관리 가이드 ─ */
  function renderGuide() {
    const rows = [
      ['✦', 'AI로 항목 추가', '상단 입력창에 떠오르는 일을 자유롭게 적고 Enter를 누르면, AI가 제품·마케팅·운영·기술 중 알맞은 곳에 알아서 분류해 넣어줘요.'],
      ['✓', '항목 체크하기', '항목 왼쪽의 체크박스를 클릭하면 완료/해제가 토글돼요. 상단 진행률이 실시간으로 갱신됩니다.'],
      ['✕', '항목 삭제', '항목에 마우스를 올리면 오른쪽에 나타나는 ✕ 버튼으로 삭제할 수 있어요.'],
      ['📊', '한눈에 보기', '제품·마케팅·운영·기술 카테고리별로 모든 항목이 펼쳐져 있어, 출시 준비 상태를 바로 확인할 수 있어요.'],
    ];
    return `
      <div class="cl-guide">
        <button class="cl-guide-toggle${showGuide ? ' open' : ''}" onclick="Checklist.toggleGuide()">
          ${chevronSvg()}<span>사용 방법 한눈에 보기</span>
        </button>
        ${showGuide ? `
          <div class="cl-guide-body">
            ${rows.map(([icon, t, d]) => `
              <div class="cl-guide-row">
                <div class="cl-guide-icon">${icon}</div>
                <div class="cl-guide-text">
                  <div class="cl-guide-t">${t}</div>
                  <div class="cl-guide-d">${d}</div>
                </div>
              </div>`).join('')}
          </div>` : ''}
      </div>`;
  }

  /* ─ 렌더 ─ */
  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    let lists = getLists();

    // 초기 로드 시 빈 체크리스트면 기본 템플릿 자동 생성
    if (lists.length === 0) {
      ['product', 'marketing', 'operations', 'technical'].forEach(key => {
        const tpl = TEMPLATES[key];
        const items = (tpl.items || []).map(text => ({ id: crypto.randomUUID(), text, done: false }));
        Store.push('launchChecklists', {
          title: tpl.label,
          category: tpl.category,
          dueDate: '',
          items,
        });
      });
      lists = getLists();
    }

    const hasItems = lists.some(l => (l.items || []).length > 0);

    app.innerHTML = `
      ${renderTopBar(lists)}
      <div class="cl-section-hd">
        <div class="section-title" style="margin:0">전체 체크 리스트</div>
      </div>
      <div class="cl-items-view">
        ${!hasItems
          ? `<div class="cl-empty">
               <div class="cl-empty-icon">🚀</div>
               <div class="cl-empty-title">아직 항목이 없어요</div>
               <div class="cl-empty-sub">상단 AI 입력으로 추가해보세요</div>
             </div>`
          : ['product', 'marketing', 'operations', 'technical'].map(cat => renderCategorySection(lists, cat)).join('')}
      </div>
      ${renderGuide()}`;

    bindAiInput();
  }

  /* ─ 상단 AI 입력: 자연어 → 카테고리 자동 분류 후 추가 ─ */
  function bindAiInput() {
    const input  = document.getElementById('cl-ai-input');
    const status = document.getElementById('cl-ai-status');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const text = input.value.trim();
      if (!text) return;

      // API 키 없으면 그냥 기타 카테고리에 원문 추가
      if (!AI.getApiKey()) {
        addItemToCategory('etc', text);
        input.value = '';
        return;
      }

      input.disabled = true;
      status.textContent = '✦ AI가 분류 중...';
      status.className = 'cl-ai-status loading';

      try {
        const result = await NLInput.parse('checklistItem', text);
        const cat   = ['product', 'marketing', 'operations', 'technical'].includes(result.category)
          ? result.category : 'product';
        const added = addItemToCategory(cat, result.text || text); // 내부에서 render() 호출

        // render() 로 입력 요소가 새로 생성되므로 새 요소에 결과 표시
        const newStatus = document.getElementById('cl-ai-status');
        const newInput  = document.getElementById('cl-ai-input');
        if (newStatus) {
          newStatus.textContent = `“${added.listTitle}”에 추가했어요`;
          newStatus.className = 'cl-ai-status success';
        }
        if (newInput) newInput.focus();
      } catch (err) {
        status.textContent = '⚠ ' + err.message;
        status.className = 'cl-ai-status error';
        input.disabled = false;
        input.focus();
      }
    });
  }

  // 카테고리에 맞는 리스트를 찾아 항목 추가 (없으면 자동 생성)
  function addItemToCategory(category, text) {
    let lists = getLists();
    let target = lists.find(l => l.category === category);

    if (!target) {
      const tplKey = ['product', 'marketing', 'operations', 'technical'].includes(category) ? category : null;
      const label  = tplKey ? TEMPLATES[tplKey].label : '기타';
      Store.push('launchChecklists', { title: label, category, dueDate: '', items: [] });
      target = getLists().find(l => l.category === category);
    }

    const items = [...(target.items || []), { id: crypto.randomUUID(), text: text.trim(), done: false }];
    Store.update('launchChecklists', target.id, { items });
    render();
    return { listTitle: target.title };
  }

  /* ─ 동작 ─ */
  function toggleItem(listId, itemId) {
    const list = getLists().find(l => l.id === listId);
    if (!list) return;
    const items = (list.items || []).map(it => it.id === itemId ? { ...it, done: !it.done } : it);
    Store.update('launchChecklists', listId, { items });
    render();
  }

  function deleteItem(listId, itemId) {
    const list = getLists().find(l => l.id === listId);
    if (!list) return;
    const items = (list.items || []).filter(it => it.id !== itemId);
    Store.update('launchChecklists', listId, { items });
    render();
  }

  function toggleGuide() {
    showGuide = !showGuide;
    render();
  }

  return {
    render, toggleItem, deleteItem, toggleGuide,
  };
})();

document.addEventListener('DOMContentLoaded', () => Checklist.render());
