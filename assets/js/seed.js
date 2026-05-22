/**
 * seed.js — 샘플 데이터 초기 주입
 * 로컬스토리지가 비어있을 때 한 번만 실행됨
 * 초기화: localStorage.removeItem('chloeassist:seeded') 후 새로고침
 */

(function seedSampleData() {
  const version = localStorage.getItem('chloeassist:seeded');

  /* v4 → v5: 사이트맵 데이터만 추가 */
  if (version === 'v4') {
    injectSitemapData();
    localStorage.setItem('chloeassist:seeded', 'v5');
    return;
  }

  if (version === 'v5') return;

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
  localStorage.setItem('chloeassist:seeded', 'v5');

  /* ── 사이트맵 샘플 데이터 ── */
  function injectSitemapData() {
    const t = Date.now();
    const a = (ms) => t - ms;

    /* 섹션 ID */
    const secOnboarding = crypto.randomUUID();
    const secMain       = crypto.randomUUID();
    const secMatching   = crypto.randomUUID();
    const secWalk       = crypto.randomUUID();

    /* 화면 ID — 온보딩 */
    const scrSplash  = crypto.randomUUID();
    const scrRole    = crypto.randomUUID();
    const scrDogReg  = crypto.randomUUID();
    const scrLogin   = crypto.randomUUID();

    /* 화면 ID — 메인 탭 */
    const scrHome      = crypto.randomUUID();
    const scrMatchTab  = crypto.randomUUID();
    const scrWalkTab   = crypto.randomUUID();
    const scrMyTab     = crypto.randomUUID();

    /* 화면 ID — 파트너 매칭 */
    const scrSearch   = crypto.randomUUID();
    const scrPartner  = crypto.randomUUID();
    const scrBook     = crypto.randomUUID();
    const scrBookDone = crypto.randomUUID();

    /* 화면 ID — 산책 기록 */
    const scrWalkReady  = crypto.randomUUID();
    const scrWalkActive = crypto.randomUUID();
    const scrWalkEnd    = crypto.randomUUID();
    const scrWalkDetail = crypto.randomUUID();

    const sections = [
      { id: secOnboarding, name: '온보딩 플로우',   createdAt: a(86400000 * 4) },
      { id: secMain,       name: '메인 탭',          createdAt: a(86400000 * 3) },
      { id: secMatching,   name: '파트너 매칭 플로우', createdAt: a(86400000 * 2) },
      { id: secWalk,       name: '산책 기록 플로우',  createdAt: a(86400000 * 1) },
    ];

    const screens = [
      /* 온보딩 */
      { id: scrSplash,  sectionId: secOnboarding, name: '스플래시',   status: '완료',    createdAt: a(86400000 * 4 + 4000) },
      { id: scrRole,    sectionId: secOnboarding, name: '역할 선택',   status: '완료',    createdAt: a(86400000 * 4 + 3000) },
      { id: scrDogReg,  sectionId: secOnboarding, name: '반려견 등록', status: '개발중',  createdAt: a(86400000 * 4 + 2000) },
      { id: scrLogin,   sectionId: secOnboarding, name: '소셜 로그인', status: '개발중',  createdAt: a(86400000 * 4 + 1000) },
      /* 메인 탭 */
      { id: scrHome,     sectionId: secMain, name: '홈',        status: '개발중',   createdAt: a(86400000 * 3 + 4000) },
      { id: scrMatchTab, sectionId: secMain, name: '매칭',       status: '디자인중', createdAt: a(86400000 * 3 + 3000) },
      { id: scrWalkTab,  sectionId: secMain, name: '산책',       status: '디자인중', createdAt: a(86400000 * 3 + 2000) },
      { id: scrMyTab,    sectionId: secMain, name: '마이페이지', status: '기획',     createdAt: a(86400000 * 3 + 1000) },
      /* 파트너 매칭 */
      { id: scrSearch,   sectionId: secMatching, name: '파트너 검색', status: '디자인중', createdAt: a(86400000 * 2 + 4000) },
      { id: scrPartner,  sectionId: secMatching, name: '파트너 상세', status: '디자인중', createdAt: a(86400000 * 2 + 3000) },
      { id: scrBook,     sectionId: secMatching, name: '예약 입력',   status: '기획',     createdAt: a(86400000 * 2 + 2000) },
      { id: scrBookDone, sectionId: secMatching, name: '예약 완료',   status: '기획',     createdAt: a(86400000 * 2 + 1000) },
      /* 산책 기록 */
      { id: scrWalkReady,  sectionId: secWalk, name: '산책 시작',   status: '기획',  createdAt: a(86400000 * 1 + 4000) },
      { id: scrWalkActive, sectionId: secWalk, name: '산책 중',     status: '기획',  createdAt: a(86400000 * 1 + 3000) },
      { id: scrWalkEnd,    sectionId: secWalk, name: '산책 완료',   status: '미정',  createdAt: a(86400000 * 1 + 2000) },
      { id: scrWalkDetail, sectionId: secWalk, name: '기록 상세',   status: '미정',  createdAt: a(86400000 * 1 + 1000) },
    ];

    let cAt = t - 86400000 * 5;
    const nc = (screenId, name) => ({ id: crypto.randomUUID(), screenId, name, createdAt: cAt += 100 });

    const components = [
      /* 스플래시 */
      nc(scrSplash, '앱 로고 & 슬로건'),
      nc(scrSplash, '로딩 인디케이터'),
      nc(scrSplash, '자동 전환 (2초)'),
      /* 역할 선택 */
      nc(scrRole, '헤드 카피'),
      nc(scrRole, '견주로 시작'),
      nc(scrRole, '파트너로 시작'),
      nc(scrRole, '이미 계정 있어요'),
      /* 반려견 등록 */
      nc(scrDogReg, '이름 / 견종 / 나이 입력'),
      nc(scrDogReg, '성격 태그 선택'),
      nc(scrDogReg, '프로필 사진 업로드'),
      nc(scrDogReg, '다음 단계 버튼'),
      /* 소셜 로그인 */
      nc(scrLogin, '카카오 로그인'),
      nc(scrLogin, '애플 로그인'),
      nc(scrLogin, '이용약관 동의'),
      nc(scrLogin, '건너뛰기'),
      /* 홈 */
      nc(scrHome, '내 주변 파트너 N명'),
      nc(scrHome, '오늘 예약 현황'),
      nc(scrHome, '최근 산책 기록'),
      nc(scrHome, '빠른 매칭 바로가기'),
      /* 매칭 탭 */
      nc(scrMatchTab, '날짜 / 시간 필터'),
      nc(scrMatchTab, '지역 선택'),
      nc(scrMatchTab, '파트너 카드 리스트'),
      nc(scrMatchTab, '무한 스크롤'),
      /* 산책 탭 */
      nc(scrWalkTab, '오늘 산책 현황'),
      nc(scrWalkTab, '누적 기록 요약'),
      nc(scrWalkTab, '기록 타임라인'),
      /* 마이페이지 */
      nc(scrMyTab, '프로필 카드'),
      nc(scrMyTab, '예약 내역'),
      nc(scrMyTab, '반려견 관리'),
      nc(scrMyTab, '앱 설정'),
      /* 파트너 검색 */
      nc(scrSearch, '날짜 & 지역 조건'),
      nc(scrSearch, '정렬 / 필터'),
      nc(scrSearch, '지도 / 리스트 토글'),
      /* 파트너 상세 */
      nc(scrPartner, '파트너 사진 & 이름'),
      nc(scrPartner, '자기소개 / 경력'),
      nc(scrPartner, '후기 & 별점'),
      nc(scrPartner, '예약하기 버튼'),
      /* 예약 입력 */
      nc(scrBook, '날짜 / 시간 선택'),
      nc(scrBook, '반려견 선택'),
      nc(scrBook, '요청 메시지'),
      nc(scrBook, '가격 확인 & 결제'),
      /* 예약 완료 */
      nc(scrBookDone, '예약 확인 카드'),
      nc(scrBookDone, '채팅 시작하기'),
      nc(scrBookDone, '홈으로 돌아가기'),
      /* 산책 시작 */
      nc(scrWalkReady, '지도 미리보기'),
      nc(scrWalkReady, '예상 루트 설정'),
      nc(scrWalkReady, '시작 버튼 (큰 CTA)'),
      /* 산책 중 */
      nc(scrWalkActive, '실시간 GPS 경로'),
      nc(scrWalkActive, '시간 / 거리 카운터'),
      nc(scrWalkActive, '사진 찍기'),
      nc(scrWalkActive, '일시정지 / 종료'),
      /* 산책 완료 */
      nc(scrWalkEnd, '경로 요약 지도'),
      nc(scrWalkEnd, '총 시간 / 거리'),
      nc(scrWalkEnd, '저장 & 공유'),
      /* 기록 상세 */
      nc(scrWalkDetail, '지도 확대 보기'),
      nc(scrWalkDetail, '사진 갤러리'),
      nc(scrWalkDetail, '날짜 / 날씨 정보'),
      nc(scrWalkDetail, 'SNS 공유'),
    ];

    localStorage.setItem('chloeassist:sitemapSections',   JSON.stringify(sections));
    localStorage.setItem('chloeassist:sitemapScreens',    JSON.stringify(screens));
    localStorage.setItem('chloeassist:sitemapComponents', JSON.stringify(components));
  }
})();
