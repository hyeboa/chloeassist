/**
 * seed.js — 샘플 데이터 초기 주입
 * 로컬스토리지가 비어있을 때 한 번만 실행됨
 * 초기화: localStorage.removeItem('chloeassist:seeded') 후 새로고침
 */

(function seedSampleData() {
  const version = localStorage.getItem('chloeassist:seeded');

  /* v4 → v14 */
  if (version === 'v4') {
    injectSitemapData();
    injectProjectTasks();
    injectGoals();
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v5 / v6 / v7 → v14 */
  if (version === 'v5' || version === 'v6' || version === 'v7') {
    localStorage.removeItem('chloeassist:sitemapSections');
    localStorage.removeItem('chloeassist:sitemapScreens');
    localStorage.removeItem('chloeassist:sitemapComponents');
    injectSitemapData();
    injectProjectTasks();
    injectGoals();
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v8 → v14 */
  if (version === 'v8') {
    injectProjectTasks();
    injectGoals();
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v9 → v14 */
  if (version === 'v9') {
    injectGoals();
    backfillGoalDates();
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v10 → v14 */
  if (version === 'v10') {
    backfillGoalDates();
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v11 → v14 */
  if (version === 'v11') {
    injectRoutines();
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v12 → v14 */
  if (version === 'v12') {
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  /* v13 → v14: 60일 히스토리로 확장 */
  if (version === 'v13') {
    injectRoutineLogs();
    localStorage.setItem('chloeassist:seeded', 'v14');
    return;
  }

  if (version === 'v14') return;

  const now = Date.now();
  const d   = (offset) => new Date(now + offset * 86400000).toISOString().slice(0, 10);
  const ago = (ms) => now - ms;

  /* ── 오늘 할 일 ── */
  const tasks = [
    { id: crypto.randomUUID(), title: '온보딩 플로우 와이어프레임 2차 수정',   category: '디자인', done: false, isToday: true,  createdAt: ago(1000 * 60 * 50) },
    { id: crypto.randomUUID(), title: '반려견 등록 화면 피그마 시안 완성',     category: '디자인', done: false, isToday: true,  createdAt: ago(1000 * 60 * 45) },
    { id: crypto.randomUUID(), title: '매칭 알고리즘 기획서 초안 작성',        category: '기획',   done: true,  isToday: true,  createdAt: ago(1000 * 60 * 40) },
    { id: crypto.randomUUID(), title: '개발팀에 피그마 링크 및 스펙 전달',     category: '개발',   done: false, isToday: true,  createdAt: ago(1000 * 60 * 35) },
    { id: crypto.randomUUID(), title: '인스타그램 론칭 예고 이미지 제작',      category: '마케팅', done: false, isToday: true,  createdAt: ago(1000 * 60 * 30) },
    { id: crypto.randomUUID(), title: '앱스토어 심사 피드백 확인 및 대응',     category: '운영',   done: true,  isToday: true,  createdAt: ago(1000 * 60 * 20) },

    { id: crypto.randomUUID(), title: '유저 인터뷰 5명 섭외 (견주 3 + 파트너 2)', category: '기획',   done: false, isToday: false, dueDate: d(4),  createdAt: ago(1000 * 3600 * 3) },
    { id: crypto.randomUUID(), title: '핵심 유저 플로우 재정의 (매칭 → 결제)',    category: '기획',   done: false, isToday: false, dueDate: d(9),  createdAt: ago(1000 * 3600 * 6) },
    { id: crypto.randomUUID(), title: '경쟁 앱 리서치 (펫프렌즈, 강아지야)',      category: '기획',   done: false, isToday: false, dueDate: d(14), createdAt: ago(1000 * 3600 * 24) },
    { id: crypto.randomUUID(), title: '푸시알림 시나리오 전체 정리',              category: '기획',   done: false, isToday: false, dueDate: d(20), createdAt: ago(1000 * 3600 * 30) },
    { id: crypto.randomUUID(), title: '산책 기록 화면 UI 디자인',                category: '디자인', done: false, isToday: false, dueDate: d(6),  createdAt: ago(1000 * 3600 * 5) },
    { id: crypto.randomUUID(), title: '디자인 시스템 컴포넌트 정리 (버튼, 폼)',   category: '디자인', done: false, isToday: false, dueDate: d(11), createdAt: ago(1000 * 3600 * 10) },
    { id: crypto.randomUUID(), title: '다크모드 컬러 변수 정의',                  category: '디자인', done: false, isToday: false, dueDate: d(17), createdAt: ago(1000 * 3600 * 48) },
    { id: crypto.randomUUID(), title: 'API 명세서 리뷰 및 피드백',               category: '개발',   done: false, isToday: false, dueDate: d(5),  createdAt: ago(1000 * 3600 * 8) },
    { id: crypto.randomUUID(), title: '소셜 로그인 (카카오, 애플) 연동 확인',    category: '개발',   done: false, isToday: false, dueDate: d(13), createdAt: ago(1000 * 3600 * 12) },
    { id: crypto.randomUUID(), title: '베타 테스터 100명 모집 공고 작성',        category: '마케팅', done: false, isToday: false, dueDate: d(7),  createdAt: ago(1000 * 3600 * 10) },
    { id: crypto.randomUUID(), title: '펫 커뮤니티 카페 홍보 글 초안',           category: '마케팅', done: false, isToday: false, dueDate: d(10), createdAt: ago(1000 * 86400 * 2) },
    { id: crypto.randomUUID(), title: '고객 문의 응대 FAQ 작성',                 category: '운영',   done: false, isToday: false, dueDate: d(8),  createdAt: ago(1000 * 3600 * 12) },
    { id: crypto.randomUUID(), title: '개인정보처리방침 최신화',                  category: '운영',   done: false, isToday: false, dueDate: d(22), createdAt: ago(1000 * 86400 * 3) },
  ];

  /* ── 브레인 덤프 ── */
  const notes = [
    { id: crypto.randomUUID(), text: '매칭 화면 UI → 틴더처럼 스와이프? 아니면 리스트형이 신뢰감 있을 것 같기도. 파트너 사진/후기 먼저 보여주는 게 맞는 듯.', createdAt: ago(1000 * 60 * 40) },
    { id: crypto.randomUUID(), text: '산책 기록할 때 GPS 경로 자동 저장 + 공유 기능. 견주들 SNS에 올리고 싶어할 것 같음 → 바이럴 포인트 될 수도.', createdAt: ago(1000 * 3600 * 2) },
    { id: crypto.randomUUID(), text: '온보딩에서 반려견 성격 태그 선택 넣기 → 활발함 / 조용함 / 친화적 / 낯가림 / 겁쟁이. 매칭 필터에도 활용 가능.', createdAt: ago(1000 * 3600 * 5) },
    { id: crypto.randomUUID(), text: '리뷰는 별점보다 키워드 태그로 → "친절해요" "시간 약속 잘 지켜요" "강아지가 좋아했어요" "재방문 의사 있어요"', createdAt: ago(1000 * 3600 * 8) },
    { id: crypto.randomUUID(), text: '앱 색상 톤 재검토 필요. 지금은 너무 차갑고 테크 느낌. 반려견 앱이니까 따뜻한 오렌지-베이지 계열 고려해볼 것.', createdAt: ago(1000 * 3600 * 26) },
    { id: crypto.randomUUID(), text: '파트너 등록 심사 프로세스 필요 → 신분증 + 반려동물 케어 경험 인증. 안전이 핵심 신뢰 요소.', createdAt: ago(1000 * 86400 * 2) },
    { id: crypto.randomUUID(), text: '첫 화면에 "지금 내 주변 파트너 N명" 보여주면 즉각적인 가치 전달 가능. 위치 권한 먼저 받아야 함.', createdAt: ago(1000 * 86400 * 3) },
    { id: crypto.randomUUID(), text: '베타 출시 전 100명 모집 목표. 네이버 카페 (강사모, 댕댕이 모임) + 인스타 강아지 계정 DM 협업 검토.', createdAt: ago(1000 * 86400 * 4) },
  ];

  /* ── 기능 보드 ── */
  const features = [
    { id: crypto.randomUUID(), name: '회원가입 / 로그인',        desc: '카카오·애플 소셜 로그인, 견주·파트너 역할 선택',  category: '개발',   status: '완료',    createdAt: ago(1000 * 86400 * 20) },
    { id: crypto.randomUUID(), name: '반려견 프로필 등록',        desc: '이름·종·나이·성격·사진 등록 및 편집',             category: '디자인', status: '개발중',  createdAt: ago(1000 * 86400 * 15) },
    { id: crypto.randomUUID(), name: '온보딩 플로우',            desc: '역할별 온보딩, 반려견 정보 입력 유도',             category: '디자인', status: '개발중',  createdAt: ago(1000 * 86400 * 14) },
    { id: crypto.randomUUID(), name: '돌봄 파트너 매칭',         desc: '위치 기반 파트너 추천, 필터 및 프로필 확인',       category: '기획',   status: '디자인중', createdAt: ago(1000 * 86400 * 10) },
    { id: crypto.randomUUID(), name: '실시간 채팅',              desc: '매칭 후 파트너·견주 간 1:1 채팅',                 category: '개발',   status: '기획중',  createdAt: ago(1000 * 86400 * 8) },
    { id: crypto.randomUUID(), name: '예약 & 일정 관리',         desc: '돌봄 일정 예약, 캘린더 연동, 알림',               category: '기획',   status: '기획중',  createdAt: ago(1000 * 86400 * 7) },
    { id: crypto.randomUUID(), name: '푸시 알림',                desc: '매칭 요청·채팅·일정 리마인더 알림',               category: '개발',   status: '기획중',  createdAt: ago(1000 * 86400 * 6) },
    { id: crypto.randomUUID(), name: '리뷰 & 후기',              desc: '키워드 태그 기반 후기, 파트너 신뢰 지수',          category: '기획',   status: '아이디어', createdAt: ago(1000 * 86400 * 5) },
    { id: crypto.randomUUID(), name: '결제 & 정산',              desc: '인앱 결제, 파트너 자동 정산',                     category: '개발',   status: '아이디어', createdAt: ago(1000 * 86400 * 4) },
    { id: crypto.randomUUID(), name: '산책 기록 & 지도',         desc: 'GPS 경로 자동 저장, 사진 첨부, 공유',             category: '디자인', status: '아이디어', createdAt: ago(1000 * 86400 * 3) },
    { id: crypto.randomUUID(), name: '파트너 인증 시스템',       desc: '신분증·경험 인증, 배지 부여',                     category: '운영',   status: '아이디어', createdAt: ago(1000 * 86400 * 2) },
  ];

  /* ── 마일스톤 ── */
  const milestones = [
    { id: crypto.randomUUID(), title: '내부 알파 테스트 완료',  date: d(-10), desc: '팀 내부 기능 점검 및 버그 수집 완료',    done: true,  createdAt: ago(1000 * 86400 * 25) },
    { id: crypto.randomUUID(), title: '외부 베타 출시',         date: d(12),  desc: '100명 베타 유저 대상 테스트 시작',       done: false, createdAt: ago(1000 * 86400 * 15) },
    { id: crypto.randomUUID(), title: '앱스토어 심사 제출',     date: d(30),  desc: 'iOS / Android 동시 제출',               done: false, createdAt: ago(1000 * 86400 * 10) },
    { id: crypto.randomUUID(), title: '정식 출시 (v1.0)',       date: d(55),  desc: '헬로아지 공식 서비스 오픈',              done: false, createdAt: ago(1000 * 86400 * 5)  },
    { id: crypto.randomUUID(), title: '누적 유저 1,000명',      date: d(90),  desc: 'SNS 바이럴 + 커뮤니티 홍보 집중',       done: false, createdAt: ago(1000 * 86400 * 3)  },
  ];

  localStorage.setItem('chloeassist:tasks',      JSON.stringify(tasks));
  localStorage.setItem('chloeassist:notes',      JSON.stringify(notes));
  localStorage.setItem('chloeassist:features',   JSON.stringify(features));
  localStorage.setItem('chloeassist:milestones', JSON.stringify(milestones));

  injectSitemapData();
  injectProjectTasks();
  injectGoals();
  injectRoutines();
  injectRoutineLogs();
  localStorage.setItem('chloeassist:seeded', 'v14');

  /* ══════════════════════════════════════════════
     사이트맵 샘플 데이터 — 댕찾아 (v8)
     잃어버린 강아지 찾기 앱 화면 구조
  ══════════════════════════════════════════════ */
  function injectSitemapData() {
    const t = Date.now();
    const a = (ms) => t - ms;

    /* ─ 섹션 ─ */
    const secEntry  = crypto.randomUUID(); // 진입 화면
    const secAuth   = crypto.randomUUID(); // 인증 화면
    const secMain   = crypto.randomUUID(); // 메인 앱
    const secShare  = crypto.randomUUID(); // 종료 / 공유 흐름

    /* ─ 진입 화면 — depth 2 ─ */
    const scrSplash    = crypto.randomUUID();
    const scrOnboarding= crypto.randomUUID();

    /* ─ 인증 화면 — depth 2 ─ */
    const scrLogin     = crypto.randomUUID();

    /* ─ 메인 앱 — depth 2 (컨테이너) ─ */
    const scrBottomNav = crypto.randomUUID(); // 하단 네비게이션
    const scrDetail    = crypto.randomUUID(); // 공통 상세 화면
    const scrSupport   = crypto.randomUUID(); // 보조 화면

    /* ─ 메인 앱 — depth 3 (하단 네비 탭) ─ */
    const scrHome      = crypto.randomUUID(); // 홈
    const scrRegister  = crypto.randomUUID(); // 등록
    const scrMyPage    = crypto.randomUUID(); // 마이페이지

    /* ─ 메인 앱 — depth 3 (상세 화면) ─ */
    const scrDogDetail = crypto.randomUUID(); // 실종 강아지 상세
    const scrSighting  = crypto.randomUUID(); // 목격 제보 작성

    /* ─ 메인 앱 — depth 3 (보조 화면) ─ */
    const scrLocation  = crypto.randomUUID(); // 위치 설정
    const scrFound     = crypto.randomUUID(); // 실종 종료 (찾음 처리)
    const scrNotif     = crypto.randomUUID(); // 알림 목록
    const scrEmpty     = crypto.randomUUID(); // 빈 상태 화면
    const scrError     = crypto.randomUUID(); // 에러 화면

    /* ─ 메인 앱 — depth 4 (홈 하위) ─ */
    const scrFeed      = crypto.randomUUID(); // 실종 강아지 피드
    const scrSearch    = crypto.randomUUID(); // 검색

    /* ─ 메인 앱 — depth 4 (등록 하위) ─ */
    const scrRegForm   = crypto.randomUUID(); // 강아지 등록 폼
    const scrRegDone   = crypto.randomUUID(); // 등록 완료 & 공유

    /* ─ 메인 앱 — depth 4 (마이페이지 하위) ─ */
    const scrMyList    = crypto.randomUUID(); // 내가 등록한 강아지 목록
    const scrMyReports = crypto.randomUUID(); // 받은 목격 제보 목록
    const scrMyProfile = crypto.randomUUID(); // 프로필 수정
    const scrSettings  = crypto.randomUUID(); // 설정

    /* ─ 메인 앱 — depth 4 (강아지 상세 하위) ─ */
    const scrDogInfo   = crypto.randomUUID(); // 강아지 정보 + 미니 지도
    const scrReportArea= crypto.randomUUID(); // 목격 제보 영역

    /* ─ 종료/공유 — depth 2 ─ */
    const scrShareSheet= crypto.randomUUID(); // 공유

    /* 섹션 순서: 중요도 기준 — 메인 앱이 최상단, 부수 화면(스플래시/온보딩)은 하단 */
    const sections = [
      { id: secMain,   name: '메인 앱',           createdAt: a(86400000 * 4) },
      { id: secShare,  name: '종료 / 공유 흐름',  createdAt: a(86400000 * 3) },
      { id: secAuth,   name: '인증 화면',         createdAt: a(86400000 * 2) },
      { id: secEntry,  name: '진입 화면',         createdAt: a(86400000 * 1) },
    ];

    const screens = [
      /* ── 진입 화면 ── */
      { id: scrSplash,     sectionId: secEntry, parentId: null, name: '스플래시',              status: '기획', createdAt: a(86400000 * 4 + 3000) },
      { id: scrOnboarding, sectionId: secEntry, parentId: null, name: '온보딩 (3페이지 스와이프)', status: '기획', createdAt: a(86400000 * 4 + 2000) },

      /* ── 인증 화면 ── */
      { id: scrLogin, sectionId: secAuth, parentId: null, name: '로그인 / 회원가입', status: '기획', createdAt: a(86400000 * 3 + 2000) },

      /* ── 메인 앱 — depth 2 컨테이너 ── */
      { id: scrBottomNav, sectionId: secMain, parentId: null, name: '하단 네비게이션 (3탭)', status: '기획', createdAt: a(86400000 * 2 + 9000) },
      { id: scrDetail,    sectionId: secMain, parentId: null, name: '공통 상세 화면',        status: '기획', createdAt: a(86400000 * 2 + 8000) },
      { id: scrSupport,   sectionId: secMain, parentId: null, name: '보조 화면',              status: '기획', createdAt: a(86400000 * 2 + 7000) },

      /* ── 메인 앱 — depth 3: 하단 네비 탭 ── */
      { id: scrHome,     sectionId: secMain, parentId: scrBottomNav, name: '홈',        status: '기획', createdAt: a(86400000 * 2 + 6500) },
      { id: scrRegister, sectionId: secMain, parentId: scrBottomNav, name: '등록',      status: '기획', createdAt: a(86400000 * 2 + 6000) },
      { id: scrMyPage,   sectionId: secMain, parentId: scrBottomNav, name: '마이페이지', status: '기획', createdAt: a(86400000 * 2 + 5500) },

      /* ── 메인 앱 — depth 3: 상세 화면 ── */
      { id: scrDogDetail, sectionId: secMain, parentId: scrDetail, name: '실종 강아지 상세 페이지', status: '기획', createdAt: a(86400000 * 2 + 5000) },
      { id: scrSighting,  sectionId: secMain, parentId: scrDetail, name: '목격 제보 작성',          status: '기획', createdAt: a(86400000 * 2 + 4800) },

      /* ── 메인 앱 — depth 3: 보조 화면 ── */
      { id: scrLocation, sectionId: secMain, parentId: scrSupport, name: '위치 설정',        status: '미정', createdAt: a(86400000 * 2 + 4500) },
      { id: scrFound,    sectionId: secMain, parentId: scrSupport, name: '실종 종료 (찾음 처리)', status: '미정', createdAt: a(86400000 * 2 + 4200) },
      { id: scrNotif,    sectionId: secMain, parentId: scrSupport, name: '알림 목록',         status: '미정', createdAt: a(86400000 * 2 + 4000) },
      { id: scrEmpty,    sectionId: secMain, parentId: scrSupport, name: '빈 상태 화면',      status: '미정', createdAt: a(86400000 * 2 + 3800) },
      { id: scrError,    sectionId: secMain, parentId: scrSupport, name: '에러 화면',         status: '미정', createdAt: a(86400000 * 2 + 3600) },

      /* ── 메인 앱 — depth 4: 홈 하위 ── */
      { id: scrFeed,   sectionId: secMain, parentId: scrHome, name: '실종 강아지 피드', status: '기획', createdAt: a(86400000 * 2 + 3400) },
      { id: scrSearch, sectionId: secMain, parentId: scrHome, name: '검색',             status: '미정', createdAt: a(86400000 * 2 + 3200) },

      /* ── 메인 앱 — depth 4: 등록 하위 ── */
      { id: scrRegForm, sectionId: secMain, parentId: scrRegister, name: '강아지 등록 폼',      status: '기획', createdAt: a(86400000 * 2 + 3000) },
      { id: scrRegDone, sectionId: secMain, parentId: scrRegister, name: '등록 완료 & 공유 화면', status: '기획', createdAt: a(86400000 * 2 + 2800) },

      /* ── 메인 앱 — depth 4: 마이페이지 하위 ── */
      { id: scrMyList,    sectionId: secMain, parentId: scrMyPage, name: '내가 등록한 강아지 목록', status: '기획', createdAt: a(86400000 * 2 + 2600) },
      { id: scrMyReports, sectionId: secMain, parentId: scrMyPage, name: '받은 목격 제보 목록',    status: '기획', createdAt: a(86400000 * 2 + 2400) },
      { id: scrMyProfile, sectionId: secMain, parentId: scrMyPage, name: '프로필 수정',            status: '미정', createdAt: a(86400000 * 2 + 2200) },
      { id: scrSettings,  sectionId: secMain, parentId: scrMyPage, name: '설정',                   status: '미정', createdAt: a(86400000 * 2 + 2000) },

      /* ── 메인 앱 — depth 4: 강아지 상세 하위 ── */
      { id: scrDogInfo,    sectionId: secMain, parentId: scrDogDetail, name: '강아지 정보 + 미니 지도', status: '기획', createdAt: a(86400000 * 2 + 1800) },
      { id: scrReportArea, sectionId: secMain, parentId: scrDogDetail, name: '목격 제보 영역',          status: '기획', createdAt: a(86400000 * 2 + 1600) },

      /* ── 종료 / 공유 흐름 ── */
      { id: scrShareSheet, sectionId: secShare, parentId: null, name: '공유 (카카오 · 인스타 · X · 링크복사)', status: '기획', createdAt: a(86400000 * 1 + 2000) },
    ];

    let cAt = t - 86400000 * 5;
    const nc = (screenId, name) => ({ id: crypto.randomUUID(), screenId, name, createdAt: cAt += 100 });

    const components = [
      /* 스플래시 */
      nc(scrSplash, '앱 아이콘 & 슬로건'),
      nc(scrSplash, '로딩 인디케이터'),
      nc(scrSplash, '자동 전환 로직'),

      /* 온보딩 */
      nc(scrOnboarding, '페이지 인디케이터 (3도트)'),
      nc(scrOnboarding, '스와이프 가능 슬라이드'),
      nc(scrOnboarding, '각 페이지 일러스트 + 설명'),
      nc(scrOnboarding, '건너뛰기 / 시작하기 버튼'),

      /* 로그인 */
      nc(scrLogin, '카카오 1클릭 로그인'),
      nc(scrLogin, '전화번호 입력 (백업)'),
      nc(scrLogin, '약관 동의 체크박스'),
      nc(scrLogin, '비로그인 둘러보기'),

      /* 하단 네비게이션 */
      nc(scrBottomNav, '홈 탭 아이콘 + 라벨'),
      nc(scrBottomNav, '등록 탭 (FAB 스타일)'),
      nc(scrBottomNav, '마이페이지 탭 아이콘 + 라벨'),
      nc(scrBottomNav, '알림 뱃지'),

      /* 홈 */
      nc(scrHome, '지역 필터 칩'),
      nc(scrHome, '알림 아이콘'),
      nc(scrHome, '검색 바 →'),
      nc(scrHome, '피드 리스트 →'),

      /* 실종 강아지 피드 */
      nc(scrFeed, '강아지 카드 (사진 + 이름 + 위치 + 날짜)'),
      nc(scrFeed, '무한 스크롤'),
      nc(scrFeed, '반경 필터 슬라이더'),
      nc(scrFeed, '새 제보 뱃지'),

      /* 검색 */
      nc(scrSearch, '검색창'),
      nc(scrSearch, '최근 검색어'),
      nc(scrSearch, '견종 / 색깔 필터'),
      nc(scrSearch, '검색 결과 리스트'),

      /* 등록 */
      nc(scrRegister, '사진 업로드 버튼'),
      nc(scrRegister, '등록 폼 →'),
      nc(scrRegister, '등록 완료 화면 →'),

      /* 강아지 등록 폼 */
      nc(scrRegForm, '사진 업로드 (최대 3장)'),
      nc(scrRegForm, '이름 입력'),
      nc(scrRegForm, '실종 날짜 & 위치 선택'),
      nc(scrRegForm, '견종 & 특징 입력'),
      nc(scrRegForm, '등록하기 버튼'),

      /* 등록 완료 & 공유 */
      nc(scrRegDone, '등록 완료 카드 미리보기'),
      nc(scrRegDone, '공유 버튼 (카카오/인스타/X/링크)'),
      nc(scrRegDone, '홈으로 돌아가기'),

      /* 마이페이지 */
      nc(scrMyPage, '프로필 요약 (사진 + 닉네임)'),
      nc(scrMyPage, '내 등록 강아지 섹션 →'),
      nc(scrMyPage, '받은 제보 섹션 →'),
      nc(scrMyPage, '설정 링크 →'),

      /* 내가 등록한 강아지 목록 */
      nc(scrMyList, '등록 카드 리스트'),
      nc(scrMyList, '상태 배지 (찾는 중 / 찾음)'),
      nc(scrMyList, '찾음 처리 버튼 →'),
      nc(scrMyList, '빈 상태 →'),

      /* 받은 목격 제보 목록 */
      nc(scrMyReports, '제보 카드 (사진 + 위치 + 메시지)'),
      nc(scrMyReports, '읽음 / 안읽음 표시'),
      nc(scrMyReports, '상세 보기'),

      /* 프로필 수정 */
      nc(scrMyProfile, '닉네임 수정'),
      nc(scrMyProfile, '프로필 사진 변경'),
      nc(scrMyProfile, '전화번호 수정'),
      nc(scrMyProfile, '저장 버튼'),

      /* 설정 */
      nc(scrSettings, '알림 설정'),
      nc(scrSettings, '위치 권한 설정'),
      nc(scrSettings, '로그아웃'),
      nc(scrSettings, '회원 탈퇴'),

      /* 실종 강아지 상세 */
      nc(scrDogDetail, '슬라이드 사진 뷰어'),
      nc(scrDogDetail, '강아지 정보 블록 →'),
      nc(scrDogDetail, '제보 영역 →'),
      nc(scrDogDetail, '등록자 연락하기'),

      /* 강아지 정보 + 미니 지도 */
      nc(scrDogInfo, '견종 / 나이 / 성별 태그'),
      nc(scrDogInfo, '실종 날짜 & 위치'),
      nc(scrDogInfo, '미니 지도 핀'),
      nc(scrDogInfo, '특이사항 메모'),

      /* 목격 제보 영역 */
      nc(scrReportArea, '제보 수 카운트'),
      nc(scrReportArea, '제보 카드 리스트'),
      nc(scrReportArea, '제보별 위치 핀 미니맵'),
      nc(scrReportArea, '제보 작성 CTA →'),

      /* 목격 제보 작성 */
      nc(scrSighting, '목격 위치 핀 설정'),
      nc(scrSighting, '사진 첨부 (선택)'),
      nc(scrSighting, '메모 텍스트 입력'),
      nc(scrSighting, '제출 버튼'),

      /* 위치 설정 */
      nc(scrLocation, '현재 위치 자동 감지'),
      nc(scrLocation, '동 단위 수동 입력'),
      nc(scrLocation, '반경 슬라이더 (1~10km)'),
      nc(scrLocation, '적용 버튼'),

      /* 실종 종료 */
      nc(scrFound, '"찾았어요!" 확인 모달'),
      nc(scrFound, '감사 메시지 & 일러스트'),
      nc(scrFound, '커뮤니티 공유 옵션 →'),
      nc(scrFound, '홈으로 버튼'),

      /* 알림 목록 */
      nc(scrNotif, '알림 타입 아이콘 (제보 / 댓글 / 시스템)'),
      nc(scrNotif, '읽음 처리'),
      nc(scrNotif, '전체 삭제'),

      /* 빈 상태 화면 */
      nc(scrEmpty, '빈 상태 일러스트'),
      nc(scrEmpty, '상황별 메시지'),
      nc(scrEmpty, '액션 CTA 버튼'),

      /* 에러 화면 */
      nc(scrError, '에러 아이콘'),
      nc(scrError, '에러 메시지 (네트워크 / 일반)'),
      nc(scrError, '재시도 버튼'),
      nc(scrError, '홈으로 버튼'),

      /* 공유 */
      nc(scrShareSheet, '카카오톡 공유'),
      nc(scrShareSheet, '인스타그램 스토리 공유'),
      nc(scrShareSheet, 'X (트위터) 공유'),
      nc(scrShareSheet, '링크 복사'),
      nc(scrShareSheet, '공유 카드 미리보기'),
    ];

    localStorage.setItem('chloeassist:sitemapSections',   JSON.stringify(sections));
    localStorage.setItem('chloeassist:sitemapScreens',    JSON.stringify(screens));
    localStorage.setItem('chloeassist:sitemapComponents', JSON.stringify(components));
  }

  /* ══════════════════════════════════════════════
     프로젝트 할 일 샘플 데이터 — v9
  ══════════════════════════════════════════════ */
  function injectProjectTasks() {
    if (localStorage.getItem('chloeassist:projectTasks')) return;

    const t  = Date.now();
    const d  = (offset) => new Date(t + offset * 86400000).toISOString().slice(0, 10);
    const a  = (ms) => t - ms;

    const projectTasks = [
      /* ── 헬로아지 앱 ── */
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '매칭 화면 와이어프레임 최종 확정',       done: true,  doneAt: a(86400000 * 2), priority: 'high',   dueDate: d(-3), memo: '',    createdAt: a(86400000 * 7) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '피그마 컴포넌트 라이브러리 정리',         done: true,  doneAt: a(86400000 * 1), priority: 'normal', dueDate: d(-1), memo: '',    createdAt: a(86400000 * 6) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: 'iOS 앱 심사 피드백 반영',                done: false, doneAt: null,            priority: 'high',   dueDate: d(0),  memo: '스크린샷 해상도 문제, 개인정보 문구 수정 필요', createdAt: a(86400000 * 5) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '파트너 프로필 화면 QA',                  done: false, doneAt: null,            priority: 'high',   dueDate: d(1),  memo: '',    createdAt: a(86400000 * 4) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '푸시 알림 권한 요청 타이밍 조정',         done: false, doneAt: null,            priority: 'normal', dueDate: d(3),  memo: '',    createdAt: a(86400000 * 4) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '산책 기록 화면 GPS 경로 표시 구현',       done: false, doneAt: null,            priority: 'normal', dueDate: d(7),  memo: '',    createdAt: a(86400000 * 3) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '카카오페이 결제 모듈 연동 테스트',        done: false, doneAt: null,            priority: 'high',   dueDate: d(10), memo: '',    createdAt: a(86400000 * 3) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '반려견 성격 태그 필터 UI 연결',           done: false, doneAt: null,            priority: 'normal', dueDate: d(14), memo: '',    createdAt: a(86400000 * 2) },
      { id: crypto.randomUUID(), project: '헬로아지 앱', title: '다크모드 컬러 토큰 적용 전체 검수',       done: false, doneAt: null,            priority: 'low',    dueDate: d(20), memo: '',    createdAt: a(86400000 * 1) },

      /* ── 베타 마케팅 ── */
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '네이버 강사모 카페 홍보 글 게시',         done: true,  doneAt: a(86400000 * 3), priority: 'high',   dueDate: d(-4), memo: '',    createdAt: a(86400000 * 8) },
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '인스타그램 론칭 예고 릴스 업로드',        done: false, doneAt: null,            priority: 'high',   dueDate: d(-1), memo: '촬영 완료, 편집만 남음', createdAt: a(86400000 * 5) },
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '베타 테스터 100명 신청폼 오픈',           done: false, doneAt: null,            priority: 'high',   dueDate: d(0),  memo: '',    createdAt: a(86400000 * 4) },
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '강아지 인플루언서 DM 협업 제안 발송',    done: false, doneAt: null,            priority: 'normal', dueDate: d(2),  memo: '팔로워 1만 이상 계정 10곳 리스트업 완료',    createdAt: a(86400000 * 3) },
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '카카오채널 개설 및 메시지 템플릿 작성',   done: false, doneAt: null,            priority: 'normal', dueDate: d(5),  memo: '',    createdAt: a(86400000 * 2) },
      { id: crypto.randomUUID(), project: '베타 마케팅', title: '베타 후기 이벤트 기획 (커피쿠폰 증정)',   done: false, doneAt: null,            priority: 'low',    dueDate: d(9),  memo: '',    createdAt: a(86400000 * 1) },

      /* ── 파트너 인증 ── */
      { id: crypto.randomUUID(), project: '파트너 인증', title: '신분증 인증 API 벤더사 선정',             done: true,  doneAt: a(86400000 * 1), priority: 'high',   dueDate: d(-2), memo: '',    createdAt: a(86400000 * 6) },
      { id: crypto.randomUUID(), project: '파트너 인증', title: '인증 단계 UX 플로우 확정',                done: false, doneAt: null,            priority: 'high',   dueDate: d(1),  memo: '신분증 → 경력 → 승인 3단계로 정리',          createdAt: a(86400000 * 4) },
      { id: crypto.randomUUID(), project: '파트너 인증', title: '인증 배지 디자인 (3단계: 기본·인증·전문)', done: false, doneAt: null,            priority: 'normal', dueDate: d(4),  memo: '',    createdAt: a(86400000 * 3) },
      { id: crypto.randomUUID(), project: '파트너 인증', title: '관리자 심사 대시보드 와이어프레임',        done: false, doneAt: null,            priority: 'normal', dueDate: d(8),  memo: '',    createdAt: a(86400000 * 2) },
      { id: crypto.randomUUID(), project: '파트너 인증', title: '인증 거절 알림 메시지 문구 작성',          done: false, doneAt: null,            priority: 'low',    dueDate: d(12), memo: '',    createdAt: a(86400000 * 1) },
    ];

    localStorage.setItem('chloeassist:projectTasks', JSON.stringify(projectTasks));
  }

  /* ══════════════════════════════════════════════
     단계별 목표 샘플 데이터 — v10
  ══════════════════════════════════════════════ */
  function injectGoals() {
    if (localStorage.getItem('chloeassist:goals')) return;

    const t    = Date.now();
    const item = (text, done = false) => ({ id: crypto.randomUUID(), text, done });

    const g1 = crypto.randomUUID();
    const g2 = crypto.randomUUID();
    const g3 = crypto.randomUUID();

    const goals = [
      { id: g1, title: 'MVP 완성', targetDate: '2026-05-31', createdAt: t - 3000, items: [
        item('핵심 매칭 플로우 구현', true),
        item('반려견 프로필 등록 화면', true),
        item('온보딩 플로우 완성'),
        item('내부 알파 테스트'),
      ] },
      { id: g2, title: '베타 출시', targetDate: '2026-06-15', createdAt: t - 2000, items: [
        item('베타 테스터 100명 모집'),
        item('푸시 알림 연동'),
        item('피드백 수집 채널 마련'),
      ] },
      { id: g3, title: '정식 출시', targetDate: '2026-08-01', createdAt: t - 1000, items: [
        item('앱스토어 심사 통과'),
        item('결제·정산 시스템 연동'),
        item('런칭 마케팅 캠페인'),
      ] },
    ];

    localStorage.setItem('chloeassist:goals', JSON.stringify(goals));

    /* 샘플 마일스톤을 제목으로 매칭해 목표에 연결 */
    const linkByTitle = {
      '내부 알파 테스트 완료': g1,
      '외부 베타 출시': g2,
      '앱스토어 심사 제출': g3,
      '정식 출시 (v1.0)': g3,
    };
    try {
      const milestones = JSON.parse(localStorage.getItem('chloeassist:milestones') || '[]');
      let changed = false;
      milestones.forEach(m => {
        if (linkByTitle[m.title] && !m.goalId) { m.goalId = linkByTitle[m.title]; changed = true; }
      });
      if (changed) localStorage.setItem('chloeassist:milestones', JSON.stringify(milestones));
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     하루 루틴 샘플 데이터 — v12 (6개 기본 루틴)
  ══════════════════════════════════════════════ */
  function injectRoutines() {
    if (localStorage.getItem('chloeassist:routines')) return;
    const t = Date.now();
    const routines = [
      { id: crypto.randomUUID(), name: '물 2잔 이상 마시기',   createdAt: t - 7000 },
      { id: crypto.randomUUID(), name: '오늘 핵심 할 일 확인', createdAt: t - 6000 },
      { id: crypto.randomUUID(), name: '10분 스트레칭',        createdAt: t - 5000 },
      { id: crypto.randomUUID(), name: '감사한 일 한 줄 적기', createdAt: t - 4000 },
      { id: crypto.randomUUID(), name: '소셜미디어 30분 제한', createdAt: t - 3000 },
      { id: crypto.randomUUID(), name: '취침 전 내일 준비',    createdAt: t - 2000 },
    ];
    localStorage.setItem('chloeassist:routines', JSON.stringify(routines));
  }

  /* ══════════════════════════════════════════════
     하루 루틴 히스토리 샘플 데이터 — v14 (60일)
  ══════════════════════════════════════════════ */
  function injectRoutineLogs() {
    try {
      const routines = JSON.parse(localStorage.getItem('chloeassist:routines') || '[]');
      if (routines.length === 0) return;
      const ids = routines.map(r => r.id);

      /* 60일 달성 패턴: 습관 형성 곡선 (주말 약간 낮음, 중반 peak, 소폭 기복) */
      const patterns = [
        /* 9주 전 ~ 8주 전: 초반 시작 */
        0.33, 0.5,  0.5,  0.33, 0.5,  0.5,  0.17,
        0.5,  0.67, 0.5,  0.67, 0.5,  0.5,  0.33,
        /* 7주 전 ~ 6주 전: 성장 */
        0.5,  0.67, 0.83, 0.67, 0.83, 0.67, 0.5,
        0.67, 0.83, 0.67, 1.0,  0.83, 0.67, 0.5,
        /* 5주 전 ~ 4주 전: 피크 */
        0.67, 1.0,  0.83, 1.0,  1.0,  0.83, 0.67,
        0.83, 0.83, 1.0,  0.83, 1.0,  0.83, 0.67,
        /* 3주 전 ~ 2주 전: 약간 피로 후 회복 */
        0.67, 0.5,  0.83, 0.67, 0.83, 0.5,  0.5,
        0.5,  0.83, 0.83, 0.83, 0.83, 0.67, 0.5,
        /* 1주 전 ~ 어제: 다시 상승 */
        0.67, 0.83, 1.0,  0.83, 1.0,  0.83, 0.83,
        /* 어제까지 포함해 총 60일 (마지막 4일) */
        0.67, 1.0,  0.83, 1.0,
      ]; /* 7*8 + 4 = 60 */

      patterns.forEach((ratio, i) => {
        const offset = i - 60; /* -60 ~ -1 */
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const dateKey = 'chloeassist:routine-log:' + d.toISOString().slice(0, 10);
        if (localStorage.getItem(dateKey)) return; /* 이미 있으면 skip */
        const count = Math.round(ids.length * ratio);
        const log = {};
        /* 날짜마다 다른 루틴이 완료되도록 순환 선택 */
        for (let j = 0; j < count; j++) {
          log[ids[(i + j) % ids.length]] = true;
        }
        localStorage.setItem(dateKey, JSON.stringify(log));
      });
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     v10 → v11: 기존 샘플 목표에 targetDate 백필
  ══════════════════════════════════════════════ */
  function backfillGoalDates() {
    try {
      const goals = JSON.parse(localStorage.getItem('chloeassist:goals') || '[]');
      const dateMap = { 'MVP 완성': '2026-05-31', '베타 출시': '2026-06-15', '정식 출시': '2026-08-01' };
      let changed = false;
      goals.forEach(g => {
        if (!g.targetDate && dateMap[g.title]) { g.targetDate = dateMap[g.title]; changed = true; }
      });
      if (changed) localStorage.setItem('chloeassist:goals', JSON.stringify(goals));
    } catch (e) {}
  }
})();
