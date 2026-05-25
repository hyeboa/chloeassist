/**
 * checklist.js — 출시 체크 리스트
 * 출시 준비에 필요한 항목을 템플릿으로 빠르게 만들고 관리한다.
 */

const Checklist = (() => {
  let showGuide  = false;

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

  function progress(list) {
    const items = list.items || [];
    const done  = items.filter(i => i.done).length;
    const pct   = items.length ? Math.round(done / items.length * 100) : 0;
    return { done, total: items.length, pct };
  }

  function dday(dateStr, allDone) {
    if (allDone) return { label: '완료', cls: 'dday-done' };
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff === 0)  return { label: 'D-Day', cls: 'dday-today' };
    if (diff < 0)    return { label: `D+${Math.abs(diff)}`, cls: 'dday-overdue' };
    if (diff <= 14)  return { label: `D-${diff}`, cls: 'dday-soon' };
    return { label: `D-${diff}`, cls: 'dday-future' };
  }

  function checkSvg() {
    return `<svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function chevronSvg() {
    return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  /* ─ 상단 요약 ─ */
  function renderSummary(lists) {
    const totalLists = lists.length;
    const allItems   = lists.reduce((n, l) => n + (l.items || []).length, 0);
    const doneItems  = lists.reduce((n, l) => n + (l.items || []).filter(i => i.done).length, 0);
    const pct        = allItems ? Math.round(doneItems / allItems * 100) : 0;
    return `
      <div class="cl-summary">
        <div class="summary-card">
          <div class="summary-label">체크 리스트</div>
          <div class="summary-value">${totalLists}<span>개</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">전체 진행률</div>
          <div class="summary-value">${pct}<span>%</span></div>
          <div class="summary-bar"><div class="summary-bar-fill ${pct === 100 ? 'green' : ''}" style="width:${pct}%"></div></div>
          <div class="summary-sub">${doneItems} / ${allItems} 항목 완료</div>
        </div>
      </div>`;
  }

  /* ─ 체크 리스트 카드 ─ */
  function renderCard(list) {
    const { done, total, pct } = progress(list);
    const allDone    = total > 0 && done === total;
    const cat        = CATS[list.category] || CATS.etc;
    const dd         = list.dueDate ? dday(list.dueDate, allDone) : null;
    const urgent     = dd && (dd.cls === 'dday-today' || dd.cls === 'dday-overdue' || dd.cls === 'dday-soon');
    const fillCls    = allDone ? 'goal-fill-done' : urgent ? 'goal-fill-urgent' : 'goal-fill-normal';
    const cardState  = allDone ? ' done' : urgent ? ' urgent' : '';

    const itemRows = (list.items || []).map(it => `
      <div class="mp-task-item${it.done ? ' done' : ''}">
        <div class="mp-task-main">
          <button class="mp-check${it.done ? ' checked' : ''}"
            onclick="Checklist.toggleItem('${list.id}','${it.id}')" title="${it.done ? '완료 해제' : '완료'}">
            ${it.done ? checkSvg() : ''}
          </button>
          <span class="mp-task-title">${escapeHtml(it.text)}</span>
          <button class="mp-delete" onclick="Checklist.deleteItem('${list.id}','${it.id}')" title="삭제">✕</button>
        </div>
      </div>`).join('');

    return `
      <div class="goal-card cl-card${cardState} expanded">
        <div class="goal-card-head">
          <span class="cl-cat-badge ${cat.cls}">${cat.label}</span>
          <input class="goal-title-edit" value="${escapeHtml(list.title)}"
            onblur="Checklist.editTitle('${list.id}', this.value)"
            onkeydown="if(event.key==='Enter')this.blur()">
          ${dd ? `<span class="goal-dday ${dd.cls}">${dd.label}</span>` : ''}
          <span class="goal-progress-compact">${done}/${total}</span>
          <button class="goal-del-btn" onclick="Checklist.deleteList('${list.id}')" title="체크 리스트 삭제">✕</button>
        </div>
        <div class="goal-bar-wrap">
          <div class="summary-bar goal-bar"><div class="summary-bar-fill ${fillCls}" style="width:${pct}%"></div></div>
          <span class="goal-bar-pct">${pct}%</span>
        </div>
        <div class="goal-detail">
          <div class="goal-date-row">
            <label class="goal-date-label">목표일</label>
            <input type="date" class="goal-date-input" value="${list.dueDate || ''}"
              onchange="Checklist.setDueDate('${list.id}', this.value)">
            ${list.dueDate ? `<button class="goal-date-clear" onclick="Checklist.setDueDate('${list.id}', '')">지우기</button>` : ''}
          </div>
          ${total === 0
            ? '<div class="goal-checklist-empty">항목이 없어요. 아래에서 추가해보세요.</div>'
            : `<div class="goal-checklist">${itemRows}</div>`}
          <div class="mp-add-row goal-item-add-row">
            <input class="mp-add-input cl-item-add-input" type="text" data-list="${list.id}" placeholder="항목 추가">
            <span class="mp-add-hint">Enter</span>
          </div>
        </div>
      </div>`;
  }

  /* ─ 관리 가이드 ─ */
  function renderGuide() {
    const rows = [
      ['새 체크 리스트 만들기', '상단 “+ 새 체크 리스트” 버튼을 눌러 템플릿(제품·마케팅·운영·기술)을 고르거나 빈 리스트로 시작하세요. 템플릿을 고르면 기본 항목이 자동으로 채워집니다.'],
      ['항목 완료 표시', '카드를 펼친 뒤 항목 왼쪽의 원을 클릭하면 완료/해제가 토글됩니다. 진행률 바가 자동으로 갱신돼요.'],
      ['항목 추가·삭제', '카드 맨 아래 입력창에 항목을 적고 Enter로 추가합니다. 항목에 마우스를 올리면 나타나는 ✕로 삭제할 수 있어요.'],
      ['목표일 설정', '카드를 펼치면 목표일을 지정할 수 있고, D-day 배지로 남은 기간이 표시됩니다.'],
      ['진행 상황 추적', '상단 요약 카드에서 전체 체크 리스트 수와 완료율을 한눈에 확인하세요.'],
    ];
    return `
      <div class="cl-guide">
        <button class="cl-guide-toggle${showGuide ? ' open' : ''}" onclick="Checklist.toggleGuide()">
          ${chevronSvg()}<span>체크 리스트 관리 방법</span>
        </button>
        ${showGuide ? `
          <div class="cl-guide-body">
            ${rows.map(([t, d]) => `
              <div class="cl-guide-row">
                <div class="cl-guide-t">${t}</div>
                <div class="cl-guide-d">${d}</div>
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

    app.innerHTML = `
      ${renderSummary(lists)}
      <div class="cl-section-hd">
        <div class="section-title" style="margin:0">출시 체크 리스트</div>
        <button class="btn btn-primary cl-new-btn" onclick="Checklist.openCreate()">+ 새 체크 리스트</button>
      </div>
      <div class="cl-list">
        ${lists.length === 0
          ? `<div class="cl-empty">
               <div class="cl-empty-icon">🚀</div>
               <div class="cl-empty-title">아직 체크 리스트가 없어요</div>
               <div class="cl-empty-sub">“+ 새 체크 리스트”로 출시 준비를 시작해보세요</div>
             </div>`
          : lists.map(renderCard).join('')}
      </div>
      ${renderGuide()}`;

    bindItemInputs();
  }

  function bindItemInputs() {
    document.querySelectorAll('.cl-item-add-input').forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        const v = inp.value.trim();
        if (!v) return;
        addItem(inp.dataset.list, v);
      });
    });
  }

  /* ─ 생성 모달 ─ */
  function openCreate() {
    const existing = document.getElementById('cl-modal');
    if (existing) { existing.remove(); return; }

    const tplOptions = Object.entries(TEMPLATES).map(([key, t]) =>
      `<option value="${key}">${t.label}${t.items.length ? ` (${t.items.length}개 항목)` : ''}</option>`
    ).join('');
    const catOptions = Object.entries(CATS).map(([key, c]) =>
      `<option value="${key}">${c.label}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'cl-modal';
    modal.className = 'cl-modal-overlay';
    modal.innerHTML = `
      <div class="cl-modal">
        <h3 class="cl-modal-title">새 체크 리스트</h3>
        <label class="cl-field-label">템플릿</label>
        <select id="cl-tpl" class="cl-field-input">${tplOptions}</select>
        <label class="cl-field-label">제목</label>
        <input id="cl-title" class="cl-field-input" type="text" placeholder="예: 헬로아지 v1.0 출시">
        <label class="cl-field-label">카테고리</label>
        <select id="cl-cat" class="cl-field-input">${catOptions}</select>
        <label class="cl-field-label">목표일 (선택)</label>
        <input id="cl-due" class="cl-field-input" type="date">
        <div class="cl-modal-actions">
          <button class="btn btn-ghost" id="cl-cancel">취소</button>
          <button class="btn btn-primary" id="cl-create">만들기</button>
        </div>
      </div>`;

    const tplSel   = modal.querySelector('#cl-tpl');
    const titleInp = modal.querySelector('#cl-title');
    const catSel   = modal.querySelector('#cl-cat');

    function syncFromTemplate() {
      const tpl = TEMPLATES[tplSel.value];
      if (!tpl) return;
      catSel.value = tpl.category;
      if (!titleInp.value.trim() && tpl.label && tplSel.value !== 'empty') {
        titleInp.placeholder = `예: ${tpl.label}`;
      }
    }
    tplSel.addEventListener('change', syncFromTemplate);
    syncFromTemplate();

    modal.querySelector('#cl-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#cl-create').addEventListener('click', () => {
      const tplKey = tplSel.value;
      const tpl    = TEMPLATES[tplKey];
      const title  = titleInp.value.trim() || (tplKey !== 'empty' ? tpl.label : '새 체크 리스트');
      createList(title, catSel.value, modal.querySelector('#cl-due').value || '', tplKey);
      modal.remove();
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.body.appendChild(modal);
    titleInp.focus();
  }

  /* ─ 동작 ─ */
  function createList(title, category, dueDate, templateKey) {
    const tpl   = TEMPLATES[templateKey] || TEMPLATES.empty;
    const items = (tpl.items || []).map(text => ({ id: crypto.randomUUID(), text, done: false }));
    const pushed = Store.push('launchChecklists', {
      title: title.trim(),
      category: category || 'etc',
      dueDate: dueDate || '',
      items,
    });
    render();
    Toast.show('체크 리스트를 만들었어요.', 'success');
  }

  function editTitle(id, text) {
    const t = text.trim();
    if (!t) { render(); return; }
    Store.update('launchChecklists', id, { title: t });
  }

  function deleteList(id) {
    if (!confirm('이 체크 리스트를 삭제할까요?')) return;
    Store.remove('launchChecklists', id);
    render();
  }

  function addItem(listId, text) {
    const list = getLists().find(l => l.id === listId);
    if (!list) return;
    const items = [...(list.items || []), { id: crypto.randomUUID(), text: text.trim(), done: false }];
    Store.update('launchChecklists', listId, { items });
    render();
  }

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

  function setDueDate(id, date) {
    Store.update('launchChecklists', id, { dueDate: date || '' });
    render();
  }


  function toggleGuide() {
    showGuide = !showGuide;
    render();
  }

  return {
    render, openCreate, createList, editTitle, deleteList,
    addItem, toggleItem, deleteItem, setDueDate, toggleGuide,
  };
})();

document.addEventListener('DOMContentLoaded', () => Checklist.render());
