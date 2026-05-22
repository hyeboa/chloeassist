/**
 * seed.js — 샘플 데이터 초기 주입
 * 로컬스토리지가 비어있을 때 한 번만 실행됨
 * 초기화: localStorage.removeItem('chloeassist:seeded') 후 새로고침
 */

(function seedSampleData() {
  if (localStorage.getItem('chloeassist:seeded') === 'v4') return;

  const now = Date.now();
  const d   = (offset) => new Date(now + offset * 86400000).toISOString().slice(0, 10);
  const ago = (ms) => now - ms;

  /* ── 오늘 할 일 ── */
  const tasks = [
    // 오늘 (isToday: true)
    { id: crypto.randomUUID(), title: '온보딩 플로우 와이어프레임 2차 수정',   category: '디자인', done: false, isToday: true,  createdAt: ago(1000 * 60 * 50) },
    { id: crypto.randomUUID(), title: '반려견 등록 화면 피그마 시안 완성',     category: '디자인', done: false, isToday: true,  createdAt: ago(1000 * 60 * 45) },
    { id: crypto.randomUUID(), title: '매칭 알고리즘 기획서 초안 작성',        category: '기획',   done: true,  isToday: true,  createdAt: ago(1000 * 60 * 40) },
    { id: crypto.randomUUID(), title: '개발팀에 피그마 링크 및 스펙 전달',     category: '개발',   done: false, isToday: true,  createdAt: ago(1000 * 60 * 35) },
    { id: crypto.randomUUID(), title: '인스타그램 론칭 예고 이미지 제작',      category: '마케팅', done: false, isToday: true,  createdAt: ago(1000 * 60 * 30) },
    { id: crypto.randomUUID(), title: '앱스토어 심사 피드백 확인 및 대응',     category: '운영',   done: true,  isToday: true,  createdAt: ago(1000 * 60 * 20) },

    // 예정 할 일 (isToday: false) — 기획
    { id: crypto.randomUUID(), title: '유저 인터뷰 5명 섭외 (견주 3 + 파트너 2)', category: '기획',   done: false, isToday: false, dueDate: d(4),  createdAt: ago(1000 * 3600 * 3) },
    { id: crypto.randomUUID(), title: '핵심 유저 플로우 재정의 (매칭 → 결제)',    category: '기획',   done: false, isToday: false, dueDate: d(9),  createdAt: ago(1000 * 3600 * 6) },
    { id: crypto.randomUUID(), title: '경쟁 앱 리서치 (펫프렌즈, 강아지야)',      category: '기획',   done: false, isToday: false, dueDate: d(14), createdAt: ago(1000 * 3600 * 24) },
    { id: crypto.randomUUID(), title: '푸시알림 시나리오 전체 정리',              category: '기획',   done: false, isToday: false, dueDate: d(20), createdAt: ago(1000 * 3600 * 30) },

    // 예정 할 일 — 디자인
    { id: crypto.randomUUID(), title: '산책 기록 화면 UI 디자인',                category: '디자인', done: false, isToday: false, dueDate: d(6),  createdAt: ago(1000 * 3600 * 5) },
    { id: crypto.randomUUID(), title: '디자인 시스템 컴포넌트 정리 (버튼, 폼)',   category: '디자인', done: false, isToday: false, dueDate: d(11), createdAt: ago(1000 * 3600 * 10) },
    { id: crypto.randomUUID(), title: '다크모드 컬러 변수 정의',                  category: '디자인', done: false, isToday: false, dueDate: d(17), createdAt: ago(1000 * 3600 * 48) },

    // 예정 할 일 — 개발
    { id: crypto.randomUUID(), title: 'API 명세서 리뷰 및 피드백',               category: '개발',   done: false, isToday: false, dueDate: d(5),  createdAt: ago(1000 * 3600 * 8) },
    { id: crypto.randomUUID(), title: '소셜 로그인 (카카오, 애플) 연동 확인',    category: '개발',   done: false, isToday: false, dueDate: d(13), createdAt: ago(1000 * 3600 * 12) },

    // 예정 할 일 — 마케팅
    { id: crypto.randomUUID(), title: '베타 테스터 100명 모집 공고 작성',        category: '마케팅', done: false, isToday: false, dueDate: d(7),  createdAt: ago(1000 * 3600 * 10) },
    { id: crypto.randomUUID(), title: '펫 커뮤니티 카페 홍보 글 초안',           category: '마케팅', done: false, isToday: false, dueDate: d(10), createdAt: ago(1000 * 86400 * 2) },

    // 예정 할 일 — 운영
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
  localStorage.setItem('chloeassist:seeded',     'v4');
})();
