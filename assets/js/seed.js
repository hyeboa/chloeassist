/**
 * seed.js — 로컬 실사용 시작 데이터
 *
 * - HTTPS에서는 실행하지 않는다.
 * - 기존 데이터가 하나라도 있으면 절대 덮어쓰지 않는다.
 * - 완전히 빈 작업공간에만 최소 시작 항목을 넣는다.
 */

(function seedStarterWorkspace() {
  if (location.protocol === 'https:') return;

  const CURRENT_VERSION = 'v18';
  const SEEDED_KEY = 'chloeassist:seeded';
  if (localStorage.getItem(SEEDED_KEY) === CURRENT_VERSION) return;

  const DATA_KEYS = [
    'tasks',
    'notes',
    'features',
    'milestones',
    'projectTasks',
    'goals',
    'routines',
    'routineLogs',
    'launchChecklists',
    'sitemapSections',
    'sitemapScreens',
    'sitemapComponents',
    'weeklyReviews',
    'monthlyReviews',
    'uiSettings',
    'issues',
  ];

  function hasMeaningfulValue(name) {
    const raw = localStorage.getItem(`chloeassist:${name}`);
    return raw && raw !== '[]' && raw !== '{}' && raw !== 'null';
  }

  if (DATA_KEYS.some(hasMeaningfulValue)) {
    localStorage.setItem(SEEDED_KEY, CURRENT_VERSION);
    return;
  }

  const now = Date.now();
  const uid = () => crypto.randomUUID();
  const localDate = (offset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const setJson = (name, value) => {
    localStorage.setItem(`chloeassist:${name}`, JSON.stringify(value));
  };

  setJson('tasks', [
    {
      id: uid(),
      title: '오늘 끝낼 일 3개 고르기',
      category: '운영',
      done: false,
      isToday: true,
      dueDate: localDate(0),
      starred: true,
      createdAt: now,
    },
  ]);

  setJson('projectTasks', [
    {
      id: uid(),
      project: '헬로아지',
      title: '이번 주 최우선 결과 1개 정하기',
      done: false,
      priority: 'high',
      dueDate: localDate(0),
      memo: '완료 여부를 한눈에 판단할 수 있는 결과로 적기',
      createdAt: now - 4000,
    },
    {
      id: uid(),
      project: '헬로아지',
      title: '현재 막힌 일과 운영 이슈 확인',
      done: false,
      priority: 'normal',
      dueDate: localDate(1),
      memo: '해결할 것과 보류할 것을 나누기',
      createdAt: now - 3000,
    },
    {
      id: uid(),
      project: '개인 사이드 프로젝트',
      title: '진행할 프로젝트 이름 정하기',
      done: false,
      priority: 'high',
      dueDate: localDate(0),
      memo: '실제 이름으로 새 프로젝트를 만든 뒤 이 안내 항목은 완료 처리',
      createdAt: now - 2000,
    },
    {
      id: uid(),
      project: '개인 사이드 프로젝트',
      title: '다음 행동 1개 적기',
      done: false,
      priority: 'normal',
      dueDate: localDate(1),
      memo: '30분 안에 시작할 수 있는 크기로 적기',
      createdAt: now - 1000,
    },
  ]);

  setJson('notes', []);
  setJson('features', []);
  setJson('milestones', []);
  setJson('goals', []);
  setJson('issues', []);
  setJson('launchChecklists', []);
  setJson('sitemapSections', []);
  setJson('sitemapScreens', []);
  setJson('sitemapComponents', []);
  setJson('weeklyReviews', {});
  setJson('monthlyReviews', {});
  setJson('routineLogs', {});
  setJson('uiSettings', { focusMode: false });

  setJson('routines', [
    { id: uid(), name: '오늘 끝낼 일 3개 고르기', createdAt: now - 3000 },
    { id: uid(), name: '헬로아지 운영 이슈 확인', createdAt: now - 2000 },
    { id: uid(), name: '하루 마무리 5분', createdAt: now - 1000 },
  ]);

  localStorage.setItem(SEEDED_KEY, CURRENT_VERSION);
})();
