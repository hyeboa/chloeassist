/**
 * seed.js — 로컬 샘플 데이터 초기 주입
 * non-https 환경에서만 실행된다.
 */

(function seedSampleData() {
  if (location.protocol === 'https:') return;

  const CURRENT_VERSION = 'v17';
  const version = localStorage.getItem('chloeassist:seeded');
  if (version === CURRENT_VERSION) return;

  const now = Date.now();
  const uid = () => crypto.randomUUID();
  const day = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const weekStart = (date = new Date(now)) => {
    const d = new Date(date);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const weekKey = (date) => weekStart(date).toISOString().slice(0, 10);
  const monthKey = (date = new Date(now)) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const at = (ms) => now - ms;

  function clearData() {
    const keys = [
      'chloeassist:tasks',
      'chloeassist:notes',
      'chloeassist:features',
      'chloeassist:milestones',
      'chloeassist:projectTasks',
      'chloeassist:goals',
      'chloeassist:routines',
      'chloeassist:launchChecklists',
      'chloeassist:sitemapSections',
      'chloeassist:sitemapScreens',
      'chloeassist:sitemapComponents',
      'chloeassist:weeklyReviews',
      'chloeassist:monthlyReviews',
      'chloeassist:uiSettings',
      'chloeassist:issues',
      'chloeassist:seeded',
    ];
    keys.forEach((key) => localStorage.removeItem(key));

    const extraKeys = [];
    for (let i = 0; i < localStorage.length; i++) extraKeys.push(localStorage.key(i));
    extraKeys.forEach((key) => {
      if (!key) return;
      if (key.startsWith('chloeassist:routine-log:')) localStorage.removeItem(key);
      if (key.startsWith('chloeassist:banner-dismissed:')) localStorage.removeItem(key);
    });
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  clearData();

  /* ─ 기능 보드 샘플 ─ */
  const featureDefs = [
    { key: 'today',     name: '오늘 화면 카드',        desc: '오늘 할 일과 마감 임박 항목을 한 번에 보여줌', category: '기획',   status: '완료',    doneAt: day(-3) },
    { key: 'tasks',     name: '할 일 목록 정리',       desc: '오늘/예정/완료를 빠르게 나눠 관리',       category: '개발',   status: '개발중' },
    { key: 'brain',     name: '브레인 덤프 수집',      desc: '떠오른 생각을 적고 바로 작업으로 연결',     category: '기획',   status: '디자인중' },
    { key: 'projects',  name: '내 프로젝트 보드',      desc: '프로젝트별 작업과 마감일을 한눈에 확인',   category: '개발',   status: '개발중' },
    { key: 'planning',  name: '목표 / 마일스톤 연결',   desc: '목표와 마일스톤을 묶어 진행률을 확인',     category: '운영',   status: '기획중' },
    { key: 'sitemap',   name: '제품 설계 탭',          desc: '기능 목록, 사용자 흐름, 화면 보드, 구조도', category: '디자인', status: '디자인중' },
    { key: 'issues',    name: '이슈 관리',             desc: '버그와 개선 포인트를 상태별로 추적',       category: '운영',   status: '기획중' },
    { key: 'routine',   name: '하루 루틴',             desc: '반복 습관과 로그를 남기고 추적',           category: '운영',   status: '완료',    doneAt: day(-2) },
    { key: 'reviews',   name: '주간 / 월간 리뷰',      desc: '회고와 AI 요약을 주간·월간 단위로 정리',   category: '기획',   status: '기획중' },
    { key: 'checklist', name: '출시 체크 리스트',      desc: '출시 전 점검 항목을 빠르게 확인',           category: '운영',   status: '개발중' },
  ];

  const featureMap = {};
  const features = featureDefs.map((item, idx) => {
    const id = uid();
    featureMap[item.key] = id;
    return {
      id,
      name: item.name,
      desc: item.desc,
      category: item.category,
      status: item.status,
      createdAt: at(86400000 * (20 - idx)),
      doneAt: item.doneAt ? new Date(item.doneAt).getTime() : null,
    };
  });
  setJson('chloeassist:features', features);

  /* ─ 오늘 / 할 일 목록 샘플 ─ */
  const tasks = [
    { id: uid(), title: '오늘 화면 상단 요약 카드 정리', category: '기획', done: false, isToday: true,  dueDate: day(0),  starred: true,  featureId: featureMap.today,    createdAt: at(1000 * 60 * 45) },
    { id: uid(), title: '할 일 목록 완료 토글 QA',       category: '개발', done: false, isToday: true,  dueDate: day(1),  starred: false, featureId: featureMap.tasks,    createdAt: at(1000 * 60 * 40) },
    { id: uid(), title: '브레인 덤프 변환 흐름 점검',    category: '기획', done: true,  isToday: true,  dueDate: day(-1), doneAt: at(1000 * 60 * 60 * 8), featureId: featureMap.brain,     createdAt: at(1000 * 60 * 35) },
    { id: uid(), title: '프로젝트 카드 접힘 상태 확인',  category: '개발', done: false, isToday: false, dueDate: day(2),  starred: false, featureId: featureMap.projects, createdAt: at(1000 * 60 * 30) },
    { id: uid(), title: '마일스톤 배너 문구 확인',       category: '운영', done: false, isToday: false, dueDate: day(4),  starred: true,  featureId: featureMap.planning, createdAt: at(1000 * 60 * 25) },
    { id: uid(), title: '주간 리뷰 초안 작성',          category: '기획', done: false, isToday: false, dueDate: day(7),  starred: false, featureId: featureMap.reviews,  createdAt: at(1000 * 60 * 20) },
    { id: uid(), title: '월간 리뷰 샘플 데이터 확인',    category: '운영', done: false, isToday: false, dueDate: day(12), starred: false, featureId: featureMap.reviews,  createdAt: at(1000 * 60 * 18) },
    { id: uid(), title: '제품 설계 userflow 강조 상태 수정', category: '개발', done: true, isToday: false, dueDate: day(-2), doneAt: at(1000 * 60 * 60 * 28), featureId: featureMap.sitemap, createdAt: at(1000 * 60 * 15) },
    { id: uid(), title: '출시 체크리스트 항목 정리',    category: '운영', done: false, isToday: false, dueDate: day(6),  starred: false, featureId: featureMap.checklist, createdAt: at(1000 * 60 * 12) },
    { id: uid(), title: '이슈 카드 상태 색상 확인',      category: '디자인', done: false, isToday: false, dueDate: day(3),  starred: false, featureId: featureMap.issues, createdAt: at(1000 * 60 * 10) },
    { id: uid(), title: '루틴 로그 입력 흐름 점검',      category: '운영', done: false, isToday: false, dueDate: day(5),  starred: false, featureId: featureMap.routine, createdAt: at(1000 * 60 * 8) },
    { id: uid(), title: '할 일 목록 필터 문구 정리',      category: '디자인', done: false, isToday: false, dueDate: day(8),  starred: false, featureId: featureMap.tasks, createdAt: at(1000 * 60 * 6) },
    { id: uid(), title: '오늘 화면 빈 상태 문구 줄이기',  category: '기획', done: false, isToday: false, dueDate: day(2),  starred: false, featureId: featureMap.today, createdAt: at(1000 * 60 * 5) },
    { id: uid(), title: '프로젝트 마감 임박 칩 강조 확인', category: '개발', done: false, isToday: false, dueDate: day(4),  starred: true,  featureId: featureMap.projects, createdAt: at(1000 * 60 * 4) },
    { id: uid(), title: '목표 / 마일스톤 연결 칩 테스트', category: '운영', done: false, isToday: false, dueDate: day(6),  starred: false, featureId: featureMap.planning, createdAt: at(1000 * 60 * 3) },
    { id: uid(), title: '출시 체크리스트 카테고리 확인', category: '운영', done: false, isToday: false, dueDate: day(9),  starred: false, featureId: featureMap.checklist, createdAt: at(1000 * 60 * 2) },
    { id: uid(), title: '주간 리뷰 표기 통일',          category: '기획', done: false, isToday: false, dueDate: day(10), starred: false, featureId: featureMap.reviews, createdAt: at(1000 * 60 * 1) },
  ];
  setJson('chloeassist:tasks', tasks);

  /* ─ 브레인 덤프 샘플 ─ */
  const notes = [
    { id: uid(), text: '오늘 화면은 "지금 해야 할 일"만 보여주고, 나머지는 바로 아래로 넘기자.', project: '오늘', done: false, createdAt: at(1000 * 60 * 48) },
    { id: uid(), text: '할 일 목록은 오늘 / 예정 / 완료가 헷갈리지 않게 카드 간격을 더 단순하게.', project: '할 일 목록', done: false, createdAt: at(1000 * 60 * 44) },
    { id: uid(), text: '브레인 덤프는 생각 수집용, 프로젝트는 실행용으로 역할을 분리해야 한다.', project: '브레인 덤프', done: false, createdAt: at(1000 * 60 * 40) },
    { id: uid(), text: '제품 설계의 사용자 흐름은 보드와 다르게 세로로 읽히는 편이 이해하기 쉽다.', project: '제품 설계', done: false, createdAt: at(1000 * 60 * 36) },
    { id: uid(), text: '리뷰는 한 번에 길게 쓰기보다 이번 주에 바꾼 것만 짧게 적는 방식이 좋다.', project: '리뷰', done: false, createdAt: at(1000 * 60 * 30) },
    { id: uid(), text: '월간 리뷰에는 다음 달에 미뤄도 되는 일과 절대 미루면 안 되는 일을 나눠 적자.', project: '월간 리뷰', done: false, createdAt: at(1000 * 60 * 26) },
    { id: uid(), text: '출시 체크리스트는 점검 순서가 중요하니 제품/마케팅/운영/기술로 나눈다.', project: '출시 체크리스트', done: false, createdAt: at(1000 * 60 * 22) },
    { id: uid(), text: '루틴은 하루를 시작하는 작은 시작점으로 쓰고, 체크하기 쉬운 문장으로 유지한다.', project: '하루 루틴', done: false, createdAt: at(1000 * 60 * 18) },
    { id: uid(), text: '제품 설계에서는 샘플이 너무 적으면 구조가 안 보이니 섹션을 넉넉하게 넣어야 한다.', project: '제품 설계', done: false, createdAt: at(1000 * 60 * 14) },
    { id: uid(), text: '이슈 관리에는 열림 / 진행중 / 해결이 각각 최소 하나씩 보이도록 유지하자.', project: '이슈 관리', done: false, createdAt: at(1000 * 60 * 12) },
    { id: uid(), text: '목표에는 항목 체크리스트가 있어야 진행 상태가 바로 보인다.', project: '목표', done: false, createdAt: at(1000 * 60 * 10) },
    { id: uid(), text: '월간 리뷰는 이번 달에 실제로 바뀐 것만 적는 편이 더 읽기 쉽다.', project: '월간 리뷰', done: false, createdAt: at(1000 * 60 * 8) },
  ];
  setJson('chloeassist:notes', notes);

  /* ─ 프로젝트 할 일 샘플 ─ */
  const projectTasks = [
    { id: uid(), project: '화면 정리', title: '오늘 / 할 일 목록 / 브레인 덤프 첫 화면 정리', done: true,  doneAt: at(86400000 * 2), priority: 'high',   dueDate: day(-2), memo: '메뉴가 더 짧고 읽기 쉽게 보이도록 정리', createdAt: at(86400000 * 8) },
    { id: uid(), project: '화면 정리', title: '리뷰와 월간 리뷰의 차이 문구 정리',            done: false, doneAt: null,       priority: 'normal', dueDate: day(2),  memo: '', createdAt: at(86400000 * 7) },
    { id: uid(), project: '화면 정리', title: '제품 설계 탭 이름 정리',                      done: false, doneAt: null,       priority: 'normal', dueDate: day(5),  memo: '기능 목록 / 사용자 흐름 / 화면 보드 / 화면 구조도', createdAt: at(86400000 * 6) },
    { id: uid(), project: '데이터 안정화', title: 'seed.js v16 샘플 데이터 교체',             done: true,  doneAt: at(86400000 * 1), priority: 'high',   dueDate: day(-1), memo: '로컬 샘플을 앱 메뉴 기준으로 재구성', createdAt: at(86400000 * 5) },
    { id: uid(), project: '데이터 안정화', title: '중복 등록 경로 점검',                       done: false, doneAt: null,       priority: 'critical', dueDate: day(1),  memo: '작업 저장을 한 번만 타도록 정리', createdAt: at(86400000 * 4) },
    { id: uid(), project: '데이터 안정화', title: '브라우저 저장소 초기화 확인',                 done: false, doneAt: null,       priority: 'normal', dueDate: day(4),  memo: '', createdAt: at(86400000 * 3) },
    { id: uid(), project: '운영 준비', title: '주간 리뷰 샘플 문구 정리',                       done: false, doneAt: null,       priority: 'normal', dueDate: day(6),  memo: '', createdAt: at(86400000 * 2) },
    { id: uid(), project: '운영 준비', title: '월간 리뷰 샘플 문구 정리',                       done: false, doneAt: null,       priority: 'normal', dueDate: day(11), memo: '', createdAt: at(86400000 * 1) },
    { id: uid(), project: 'AI 연결', title: 'API 키 저장 경로 확인',                           done: true,  doneAt: at(86400000 * 3), priority: 'high',   dueDate: day(-3), memo: '기기별 입력 대신 로컬 저장으로 전환', createdAt: at(86400000 * 9) },
    { id: uid(), project: 'AI 연결', title: 'AI 응답 실패 시 안내 문구 정리',                  done: false, doneAt: null,       priority: 'normal', dueDate: day(7),  memo: '', createdAt: at(86400000 * 2) },
    { id: uid(), project: '화면 정리', title: '메뉴별 샘플 데이터 설명 추가',                    done: false, doneAt: null,       priority: 'normal', dueDate: day(3),  memo: '샘플이 각 메뉴에 대응되게 보이도록 정리', createdAt: at(86400000 * 1) },
    { id: uid(), project: '운영 준비', title: '주간 리뷰와 월간 리뷰 구분 확인',                 done: false, doneAt: null,       priority: 'low',    dueDate: day(8),  memo: '', createdAt: at(86400000 * 1) },
    { id: uid(), project: '데이터 안정화', title: 'seed.js 버전 올리고 재주입 확인',             done: false, doneAt: null,       priority: 'high',   dueDate: day(2),  memo: '', createdAt: at(86400000 * 1) },
  ];
  setJson('chloeassist:projectTasks', projectTasks);

  /* ─ 목표 샘플 ─ */
  const g1 = uid();
  const g2 = uid();
  const g3 = uid();
  const g4 = uid();
  const item = (text, done = false) => ({ id: uid(), text, done });
  const goals = [
    {
      id: g1,
      title: '하루 작업 흐름 안정화',
      targetDate: day(12),
      createdAt: at(86400000 * 9),
      items: [
        item('오늘 화면 정리'),
        item('할 일 목록과 브레인 덤프 구분'),
        item('하루 루틴 샘플 확인', true),
      ],
    },
    {
      id: g2,
      title: '제품 설계 흐름 정리',
      targetDate: day(28),
      createdAt: at(86400000 * 8),
      items: [
        item('기능 목록 정리', true),
        item('사용자 흐름 정리'),
        item('화면 보드와 구조도 분리'),
      ],
    },
    {
      id: g3,
      title: '반복 작업 안정화',
      targetDate: day(45),
      createdAt: at(86400000 * 7),
      items: [
        item('주간 리뷰 예시 작성'),
        item('월간 리뷰 예시 작성'),
        item('출시 체크리스트 초안 정리'),
      ],
    },
    {
      id: g4,
      title: '메뉴 샘플 완성',
      targetDate: day(60),
      createdAt: at(86400000 * 6),
      items: [
        item('오늘 / 할 일 목록 샘플 확인'),
        item('브레인 덤프 샘플 확인'),
        item('제품 설계 샘플 확인'),
        item('리뷰 / 월간 리뷰 샘플 확인'),
      ],
    },
  ];
  setJson('chloeassist:goals', goals);

  /* ─ 마일스톤 샘플 ─ */
  const milestones = [
    { id: uid(), title: '오늘 화면 샘플 정리 완료',        date: day(-2), done: true,  goalId: g1, desc: '오늘/할 일 목록/브레인 덤프 시작점 정리', createdAt: at(86400000 * 7) },
    { id: uid(), title: '제품 설계 userflow 연결',         date: day(5),  done: false, goalId: g2, desc: '사용자 흐름을 세로로 읽히는 형태로 점검', createdAt: at(86400000 * 6) },
    { id: uid(), title: '주간 리뷰 템플릿 확정',           date: day(9),  done: false, goalId: g3, desc: '이번 주 회고 문구를 짧게 고정', createdAt: at(86400000 * 5) },
    { id: uid(), title: '월간 리뷰 예시 작성',             date: day(16), done: false, goalId: g3, desc: '월 단위 정리 기준 확정', createdAt: at(86400000 * 4) },
    { id: uid(), title: '출시 체크리스트 초안 완료',       date: day(24), done: false, goalId: g3, desc: '제품/마케팅/운영/기술 항목 구분', createdAt: at(86400000 * 3) },
    { id: uid(), title: '메뉴 샘플 검토 완료',             date: day(34), done: false, goalId: g4, desc: '샘플이 충분히 들어갔는지 확인', createdAt: at(86400000 * 2) },
  ];
  setJson('chloeassist:milestones', milestones);

  /* ─ 하루 루틴 샘플 ─ */
  const routines = [
    { id: uid(), name: '오늘 할 일 3개 고르기', createdAt: at(7000) },
    { id: uid(), name: '브레인 덤프 5줄 적기', createdAt: at(6000) },
    { id: uid(), name: '제품 설계 탭 한 번 확인', createdAt: at(5000) },
    { id: uid(), name: '주간 리뷰 열기', createdAt: at(4000) },
    { id: uid(), name: '운동 / 스트레칭 10분', createdAt: at(3000) },
    { id: uid(), name: '내일 일정 한 줄 메모', createdAt: at(2000) },
    { id: uid(), name: '월간 리뷰 한 줄 쓰기', createdAt: at(1500) },
    { id: uid(), name: '출시 체크리스트 한 항목 보기', createdAt: at(1000) },
  ];
  setJson('chloeassist:routines', routines);

  const routineLogs = {};
  const routineIds = routines.map((r) => r.id);
  function routineRatio(index) {
    if (index < 12) return [0.33, 0.5, 0.33, 0.5, 0.5, 0.67, 0.33][index % 7];
    if (index < 24) return [0.5, 0.67, 0.67, 0.83, 0.67, 0.83, 0.5][index % 7];
    if (index < 36) return [0.83, 1.0, 0.83, 1.0, 1.0, 0.83, 0.67][index % 7];
    if (index < 48) return [0.67, 0.5, 0.83, 0.67, 0.83, 0.5, 0.5][index % 7];
    return [0.67, 0.83, 1.0, 0.83, 1.0, 0.83, 0.83][index % 7];
  }
  for (let i = 0; i < 60; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (i - 59));
    const key = d.toISOString().slice(0, 10);
    const count = Math.max(1, Math.min(routineIds.length, Math.round(routineIds.length * routineRatio(i))));
    const log = {};
    for (let j = 0; j < count; j++) {
      log[routineIds[(i + j) % routineIds.length]] = true;
    }
    routineLogs[key] = log;
  }
  setJson('chloeassist:routineLogs', routineLogs);

  /* ─ 출시 체크리스트 샘플 ─ */
  const makeItem = (text, done = false) => ({ id: uid(), text, done });
  const launchChecklists = [
    {
      id: uid(),
      title: '제품 점검',
      category: 'product',
      dueDate: day(7),
      createdAt: now,
      items: [
        makeItem('오늘 / 할 일 / 브레인 덤프의 역할 구분 확인'),
        makeItem('제품 설계 userflow와 화면 보드가 헷갈리지 않는지 확인'),
        makeItem('마일스톤과 목표 연결 상태 확인'),
        makeItem('주간 리뷰 / 월간 리뷰 제목 구분 확인'),
      ],
    },
    {
      id: uid(),
      title: '마케팅 점검',
      category: 'marketing',
      dueDate: day(10),
      createdAt: now,
      items: [
        makeItem('메인 접속 주소를 안내 문구에 넣기'),
        makeItem('공유용 소개 문장 한 줄 만들기'),
        makeItem('주요 화면 캡처 정리'),
        makeItem('공유 시나리오 문구 정리'),
      ],
    },
    {
      id: uid(),
      title: '운영 점검',
      category: 'operations',
      dueDate: day(14),
      createdAt: now,
      items: [
        makeItem('로컬 샘플 데이터 초기화 경로 확인'),
        makeItem('백업 / 복원 흐름 점검'),
        makeItem('중복 등록 방지 확인'),
        makeItem('이슈 관리 기준 정리'),
      ],
    },
    {
      id: uid(),
      title: '기술 점검',
      category: 'technical',
      dueDate: day(18),
      createdAt: now,
      items: [
        makeItem('seed.js v16가 로컬에서만 실행되는지 확인'),
        makeItem('페이지 캐시 버전이 맞는지 확인'),
        makeItem('AI 키는 로컬에 저장되는지 확인'),
        makeItem('주요 메뉴 렌더러가 오류 없이 뜨는지 확인'),
      ],
    },
  ];
  setJson('chloeassist:launchChecklists', launchChecklists);

  /* ─ 이슈 샘플 ─ */
  const issues = [
    { id: uid(), title: '브레인 덤프 저장 후 목록이 바로 갱신되지 않음', status: 'open',     priority: 'critical', createdAt: at(86400000 * 3) },
    { id: uid(), title: '사용자 흐름과 화면 보드 역할이 아직 조금 헷갈림',   status: 'progress', priority: 'high',     createdAt: at(86400000 * 2) },
    { id: uid(), title: '할 일 목록에서 완료된 항목이 길 때 줄 간격 확인 필요', status: 'progress', priority: 'normal',   createdAt: at(86400000 * 2) },
    { id: uid(), title: '월간 리뷰 AI 요약 문구가 너무 길 수 있음',            status: 'open',     priority: 'normal',   createdAt: at(86400000 * 1) },
    { id: uid(), title: '사이드바 하단 메뉴 스크롤 확인',                    status: 'resolved', priority: 'low',      createdAt: at(86400000 * 4) },
    { id: uid(), title: '중복 등록 문제 확인 완료',                           status: 'resolved', priority: 'high',     createdAt: at(86400000 * 5) },
    { id: uid(), title: '샘플 데이터 개수 부족 이슈',                         status: 'open',     priority: 'normal',   createdAt: at(86400000 * 1) },
    { id: uid(), title: '브레인 덤프와 프로젝트 태그 연결 점검',               status: 'progress', priority: 'high',     createdAt: at(86400000 * 1) },
  ];
  setJson('chloeassist:issues', issues);

  /* ─ 주간 / 월간 리뷰 샘플 ─ */
  const thisWeekKey = weekKey(new Date(now));
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekKey = weekKey(lastWeekDate);
  const thisMonthKey = monthKey(new Date(now));
  const lastMonthDate = new Date(now);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = monthKey(lastMonthDate);

  const weeklyReviews = {
    [thisWeekKey]: {
      memo: '이번 주는 오늘 화면, 할 일 목록, 브레인 덤프의 역할을 다시 나누는 데 집중했다. 제품 설계 탭은 userflow와 보드가 확실히 다르게 보이도록 정리하는 중이다.',
      aiSummary: '핵심 화면의 구분이 분명해지고 있습니다. 다음에는 중복 등록과 남은 문구만 더 다듬으면 됩니다.',
    },
    [lastWeekKey]: {
      memo: '지난 주에는 프로젝트, 목표, 마일스톤 연결 구조를 정리했다. 데이터보다는 화면 구조를 먼저 단순화하는 방향으로 정리했다.',
      aiSummary: '요약하면, 작업을 어디서 시작하고 어디로 확인할지 흐름이 좋아졌습니다.',
    },
    [weekKey(new Date(now - 14 * 86400000))]: {
      memo: '샘플 데이터를 먼저 채우는 작업을 했고, 각 메뉴가 비어 보이지 않게 맞췄다.',
      aiSummary: '샘플 구성이 충분해져서 메뉴별 역할을 확인하기 쉬워졌습니다.',
    },
  };
  setJson('chloeassist:weeklyReviews', weeklyReviews);

  const monthlyReviews = {
    [thisMonthKey]: {
      memo: '이번 달은 로컬에서 빠르게 수정하고, 확인할 메뉴를 샘플 데이터로 먼저 채우는 흐름을 만든다. 기기마다 같은 샘플을 보는 게 목표다.',
      aiSummary: '메뉴별 샘플 데이터가 준비되어 실제 화면 점검이 쉬워졌습니다. 다음 단계는 불편한 표현만 줄이는 것입니다.',
    },
    [lastMonthKey]: {
      memo: '지난 달에는 연결과 데이터 구조를 먼저 맞췄다. 그 결과 지금은 로컬에서 다시 빠르게 검토할 수 있다.',
      aiSummary: '기반 구조가 안정화되었습니다. 이제는 작은 수정만 반복하면 됩니다.',
    },
    [monthKey(new Date(now - 2 * 30 * 86400000))]: {
      memo: '메뉴별 샘플을 충분히 넣는 것이 이번 리팩터의 핵심이다.',
      aiSummary: '데이터가 더 많아져서 화면 점검이 실제 사용처럼 보입니다.',
    },
  };
  setJson('chloeassist:monthlyReviews', monthlyReviews);

  /* ─ UI 설정 샘플 ─ */
  setJson('chloeassist:uiSettings', {
    focusMode: false,
  });

  /* ─ 사이트맵 샘플 ─ */
  const sections = [
    { id: uid(), name: '매일', order: 1, createdAt: at(3000) },
    { id: uid(), name: '설계', order: 2, createdAt: at(2000) },
    { id: uid(), name: '돌아보기', order: 3, createdAt: at(1000) },
  ];

  const sectionIds = sections.map((s) => s.id);
  const screens = [
    { id: uid(), sectionId: sectionIds[0], parentId: null, name: '오늘',          status: '완료',   note: '', featureIds: [featureMap.today, featureMap.tasks],   screenOrder: 1, createdAt: at(2500) },
    { id: uid(), sectionId: sectionIds[0], parentId: null, name: '할 일 목록',     status: '개발중', note: '', featureIds: [featureMap.tasks],               screenOrder: 2, createdAt: at(2400) },
    { id: uid(), sectionId: sectionIds[0], parentId: null, name: '브레인 덤프',    status: '디자인중', note: '', featureIds: [featureMap.brain],              screenOrder: 3, createdAt: at(2300) },
    { id: uid(), sectionId: sectionIds[0], parentId: null, name: '하루 루틴',     status: '개발중', note: '', featureIds: [featureMap.routine],             screenOrder: 4, createdAt: at(2200) },
    { id: uid(), sectionId: sectionIds[0], parentId: null, name: '내 프로젝트',    status: '기획중', note: '', featureIds: [featureMap.projects],            screenOrder: 5, createdAt: at(2100) },

    { id: uid(), sectionId: sectionIds[1], parentId: null, name: '목표',          status: '기획중', note: '', featureIds: [featureMap.planning],            screenOrder: 1, createdAt: at(2000) },
    { id: uid(), sectionId: sectionIds[1], parentId: null, name: '마일스톤',       status: '기획중', note: '', featureIds: [featureMap.planning],            screenOrder: 2, createdAt: at(1900) },
    { id: uid(), sectionId: sectionIds[1], parentId: null, name: '제품 설계',      status: '디자인중', note: '', featureIds: [featureMap.sitemap],             screenOrder: 3, createdAt: at(1800) },
    { id: uid(), sectionId: sectionIds[1], parentId: null, name: '이슈 관리',      status: '기획중', note: '', featureIds: [featureMap.issues],              screenOrder: 4, createdAt: at(1700) },
    { id: uid(), sectionId: sectionIds[1], parentId: null, name: '출시 체크 리스트', status: '개발중', note: '', featureIds: [featureMap.checklist],         screenOrder: 5, createdAt: at(1600) },

    { id: uid(), sectionId: sectionIds[2], parentId: null, name: '리뷰',          status: '기획중', note: '', featureIds: [featureMap.reviews],             screenOrder: 1, createdAt: at(1500) },
    { id: uid(), sectionId: sectionIds[2], parentId: null, name: '주간 리뷰',     status: '아이디어', note: '', featureIds: [featureMap.reviews],            screenOrder: 2, createdAt: at(1400) },
    { id: uid(), sectionId: sectionIds[2], parentId: null, name: '월간 리뷰',     status: '아이디어', note: '', featureIds: [featureMap.reviews],            screenOrder: 3, createdAt: at(1300) },
  ];

  const productScreenId = uid();
  screens.push(
    { id: productScreenId, sectionId: sectionIds[1], parentId: null, name: '화면 보드', status: '개발중', note: '', featureIds: [featureMap.sitemap], screenOrder: 6, createdAt: at(1200) },
    { id: uid(), sectionId: sectionIds[1], parentId: productScreenId, name: '기능 목록',   status: '아이디어', note: '', featureIds: [featureMap.sitemap], screenOrder: 1, createdAt: at(1100) },
    { id: uid(), sectionId: sectionIds[1], parentId: productScreenId, name: '사용자 흐름', status: '아이디어', note: '', featureIds: [featureMap.sitemap], screenOrder: 2, createdAt: at(1000) },
    { id: uid(), sectionId: sectionIds[1], parentId: productScreenId, name: '화면 구조도', status: '아이디어', note: '', featureIds: [featureMap.sitemap], screenOrder: 3, createdAt: at(900) },
  );

  const components = [];
  const addComponents = (screenName, names) => {
    const screen = screens.find((s) => s.name === screenName);
    if (!screen) return;
    names.forEach((name, idx) => {
      components.push({ id: uid(), screenId: screen.id, name, createdAt: at(800 - idx * 50) });
    });
  };

  addComponents('오늘', ['오늘 요약 카드', '마감 임박 배너', '빠른 이동 버튼', '완료 수치', '집중 모드 버튼']);
  addComponents('할 일 목록', ['완료 토글', '카테고리 그룹', '기한 칩', '완료/미완료 구분']);
  addComponents('브레인 덤프', ['빠른 입력창', '프로젝트 태그', '할 일 변환 버튼', '완료 숨기기']);
  addComponents('하루 루틴', ['날짜 선택기', '루틴 카드', '달성 히트맵', '연속 달성 표시']);
  addComponents('내 프로젝트', ['프로젝트 그룹', '할 일 목록', '마감 칩', '접기/펼치기']);
  addComponents('목표', ['목표 카드', '진행률 바', '항목 체크리스트', '목표 날짜']);
  addComponents('마일스톤', ['D-Day 배지', '목표 연결', '정렬 버튼', '캘린더 분포']);
  addComponents('제품 설계', ['섹션 목록', '화면 보드', '탭 전환 버튼', '샘플 데이터 버튼']);
  addComponents('이슈 관리', ['상태 필터', '우선도 버튼', '제목 입력', '해결 상태 표시']);
  addComponents('출시 체크 리스트', ['카테고리 섹션', '항목 체크박스', 'AI 빠른 입력', '진행률']);
  addComponents('리뷰', ['주간 내비게이션', '메모 영역', 'AI 요약', '이번 주 항목']);
  addComponents('월간 리뷰', ['월간 내비게이션', '주차 차트', '메모 영역', '달성 현황']);
  addComponents('화면 보드', ['기능 칩', '화면 카드', '구조 탐색', '관련 화면 연결']);
  addComponents('사용자 흐름', ['시작 단계', '탐색 단계', '완료 단계', '화면 이동 버튼']);
  addComponents('화면 구조도', ['세로 트리', '상위/하위 연결', '오른쪽 상세', '깊이 표시']);

  setJson('chloeassist:sitemapSections', sections);
  setJson('chloeassist:sitemapScreens', screens);
  setJson('chloeassist:sitemapComponents', components);

  localStorage.setItem('chloeassist:seeded', CURRENT_VERSION);
})();
