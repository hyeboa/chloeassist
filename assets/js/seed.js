/**
 * seed.js — 샘플 데이터 초기 주입
 * 로컬스토리지가 비어있을 때 한 번만 실행됨
 * 초기화: localStorage.removeItem('chloeassist:seeded') 후 새로고침
 */

(function seedSampleData() {
  const seeded = localStorage.getItem('chloeassist:seeded');
  if (seeded === 'v2') return;

  const now = Date.now();
  const d = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

  /* ── 오늘 할 일 ── */
  const tasks = [
    { id: crypto.randomUUID(), title: '온보딩 플로우 와이어프레임 수정', category: '디자인',  done: false, isToday: true,  createdAt: now - 1000 * 60 * 30 },
    { id: crypto.randomUUID(), title: '반려견 등록 화면 피그마 시안 완성',  category: '디자인',  done: false, isToday: true,  createdAt: now - 1000 * 60 * 25 },
    { id: crypto.randomUUID(), title: '매칭 알고리즘 기획서 초안 작성',     category: '기획',    done: true,  isToday: true,  createdAt: now - 1000 * 60 * 20 },
    { id: crypto.randomUUID(), title: '개발팀 피그마 링크 전달',             category: '개발',    done: false, isToday: true,  createdAt: now - 1000 * 60 * 15 },
    { id: crypto.randomUUID(), title: '인스타그램 홍보 이미지 제작',         category: '마케팅',  done: false, isToday: true,  createdAt: now - 1000 * 60 * 10 },
    { id: crypto.randomUUID(), title: '앱스토어 심사 결과 확인',             category: '운영',    done: true,  isToday: true,  createdAt: now - 1000 * 60 * 5  },

    /* 할 일 목록 (오늘 아님) */
    { id: crypto.randomUUID(), title: '유저 인터뷰 5명 섭외',               category: '기획',   done: false, isToday: false, createdAt: now - 1000 * 3600 * 3 },
    { id: crypto.randomUUID(), title: '산책 기록 화면 디자인',               category: '디자인', done: false, isToday: false, createdAt: now - 1000 * 3600 * 5 },
    { id: crypto.randomUUID(), title: '푸시알림 시나리오 정리',              category: '기획',   done: false, isToday: false, createdAt: now - 1000 * 3600 * 6 },
    { id: crypto.randomUUID(), title: 'API 명세서 리뷰',                     category: '개발',   done: false, isToday: false, createdAt: now - 1000 * 3600 * 8 },
    { id: crypto.randomUUID(), title: '베타 테스터 모집 공고 작성',          category: '마케팅', done: false, isToday: false, createdAt: now - 1000 * 3600 * 10 },
    { id: crypto.randomUUID(), title: '고객 문의 응대 매뉴얼 작성',          category: '운영',   done: false, isToday: false, createdAt: now - 1000 * 3600 * 12 },
    { id: crypto.randomUUID(), title: '경쟁 앱 리서치 (펫프렌즈, 강아지야)', category: '기획',   done: false, isToday: false, createdAt: now - 1000 * 3600 * 24 },
  ];

  /* ── 브레인 덤프 ── */
  const notes = [
    { id: crypto.randomUUID(), text: '매칭 화면에서 강아지 사진을 카드 형태로 넘기는 UI → 틴더처럼 스와이프? 아니면 리스트형이 신뢰감 있을 것 같기도', createdAt: now - 1000 * 60 * 40 },
    { id: crypto.randomUUID(), text: '산책 기록할 때 자동으로 지도에 경로 표시되면 좋겠다. 공유도 되고.', createdAt: now - 1000 * 3600 * 2 },
    { id: crypto.randomUUID(), text: '온보딩에서 반려견 성격 태그 선택 기능 넣기 - 활발함, 조용함, 친화적, 겁쟁이 등', createdAt: now - 1000 * 3600 * 5 },
    { id: crypto.randomUUID(), text: '리뷰 시스템 → 별점보다 키워드 태그로 (친절해요, 시간 잘 지켜요, 강아지가 좋아했어요)', createdAt: now - 1000 * 3600 * 8 },
    { id: crypto.randomUUID(), text: '색상 톤 재검토 필요. 지금 너무 차가운 느낌. 반려견 앱이니까 따뜻하고 부드럽게.', createdAt: now - 1000 * 3600 * 26 },
    { id: crypto.randomUUID(), text: '출시 전 100명 베타 유저 목표. 펫 커뮤니티 카페에 홍보 먼저.', createdAt: now - 1000 * 86400 * 2 },
  ];

  /* ── 기능 보드 ── */
  const features = [
    { id: crypto.randomUUID(), name: '반려견 프로필 등록',     desc: '이름, 종, 나이, 성격, 사진 등록',              category: '기획',    status: '개발중',  createdAt: now - 1000 * 86400 * 10 },
    { id: crypto.randomUUID(), name: '돌봄 파트너 매칭',       desc: '위치 기반으로 주변 파트너 추천 및 매칭',        category: '기획',    status: '디자인중', createdAt: now - 1000 * 86400 * 9 },
    { id: crypto.randomUUID(), name: '실시간 채팅',            desc: '매칭 후 파트너와 1:1 채팅',                     category: '개발',    status: '기획중',  createdAt: now - 1000 * 86400 * 8 },
    { id: crypto.randomUUID(), name: '산책 기록 & 지도',       desc: 'GPS 기반 산책 경로 기록 및 공유',               category: '디자인',  status: '아이디어', createdAt: now - 1000 * 86400 * 7 },
    { id: crypto.randomUUID(), name: '리뷰 & 평점',            desc: '키워드 태그 기반 후기 시스템',                  category: '기획',    status: '아이디어', createdAt: now - 1000 * 86400 * 6 },
    { id: crypto.randomUUID(), name: '결제 & 정산',            desc: '인앱 결제, 파트너 정산 자동화',                 category: '개발',    status: '아이디어', createdAt: now - 1000 * 86400 * 5 },
    { id: crypto.randomUUID(), name: '푸시 알림',              desc: '매칭 요청, 채팅, 일정 알림',                    category: '개발',    status: '기획중',  createdAt: now - 1000 * 86400 * 4 },
    { id: crypto.randomUUID(), name: '온보딩 플로우',          desc: '회원가입 + 반려견/파트너 구분 온보딩',          category: '디자인',  status: '개발중',  createdAt: now - 1000 * 86400 * 3 },
  ];

  /* ── 마일스톤 ── */
  const milestones = [
    { id: crypto.randomUUID(), title: '내부 알파 테스트',   date: d(-10), desc: '팀 내부 기능 점검 및 버그 수집',        done: true,  createdAt: now - 1000 * 86400 * 20 },
    { id: crypto.randomUUID(), title: '외부 베타 출시',     date: d(12),  desc: '100명 베타 유저 대상 테스트 시작',      done: false, createdAt: now - 1000 * 86400 * 15 },
    { id: crypto.randomUUID(), title: '앱스토어 심사 제출', date: d(30),  desc: 'iOS / Android 동시 제출',              done: false, createdAt: now - 1000 * 86400 * 10 },
    { id: crypto.randomUUID(), title: '정식 출시 (v1.0)',   date: d(55),  desc: '헬로아지 공식 서비스 오픈',             done: false, createdAt: now - 1000 * 86400 * 5  },
    { id: crypto.randomUUID(), title: '유저 1,000명 달성',  date: d(90),  desc: '마케팅 집중 기간, SNS 바이럴 목표',     done: false, createdAt: now - 1000 * 86400 * 3  },
  ];

  localStorage.setItem('chloeassist:tasks',      JSON.stringify(tasks));
  localStorage.setItem('chloeassist:notes',      JSON.stringify(notes));
  localStorage.setItem('chloeassist:features',   JSON.stringify(features));
  localStorage.setItem('chloeassist:milestones', JSON.stringify(milestones));
  localStorage.setItem('chloeassist:seeded',     'v2');
})();
