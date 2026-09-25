/**
 * ai.js — local AI helper
 *
 * External dependency has been removed.
 * The app now uses local heuristics and data-driven summaries.
 */

const AI = (() => {
  function init() {
    return Promise.resolve(true);
  }

  function hasApiKey() {
    return true;
  }

  function getApiKey() {
    return '';
  }

  async function saveApiKey() {
    return true;
  }

  async function deleteApiKey() {
    return true;
  }

  function setApiKey() {
    return true;
  }

  function currentDateKey() {
    return LocalDate.today();
  }

  function normalizeText(text) {
    return String(text || '').trim();
  }

  function toIso(date) {
    return LocalDate.toKey(date);
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function monthEndDate(monthIndex, year = new Date().getFullYear()) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth(year, monthIndex)).padStart(2, '0')}`;
  }

  function parseDateExpression(text, base = currentDateKey()) {
    const value = normalizeText(text);
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const direct = value.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (direct) {
      return `${direct[1]}-${direct[2].padStart(2, '0')}-${direct[3].padStart(2, '0')}`;
    }

    const md = value.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (md) {
      const year = new Date().getFullYear();
      return `${year}-${md[1].padStart(2, '0')}-${md[2].padStart(2, '0')}`;
    }

    const slash = value.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (slash) {
      const year = new Date().getFullYear();
      return `${year}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
    }

    const today = LocalDate.fromKey(base);
    const weekDays = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

    if (/오늘/.test(value)) return toIso(today);
    if (/내일/.test(value)) return LocalDate.addDays(base, 1);
    if (/모레/.test(value)) return LocalDate.addDays(base, 2);
    if (/어제/.test(value)) return LocalDate.addDays(base, -1);

    const nextWeekDay = value.match(/(?:다음주|다음 주)\s*([일월화수목금토])/);
    if (nextWeekDay) {
      const target = weekDays[nextWeekDay[1]];
      const diff = (target - today.getDay() + 7) % 7 || 7;
      return LocalDate.addDays(base, diff + 7);
    }

    const thisWeekDay = value.match(/(?:이번주|이번 주)\s*([일월화수목금토])/);
    if (thisWeekDay) {
      const target = weekDays[thisWeekDay[1]];
      const diff = (target - today.getDay() + 7) % 7;
      return LocalDate.addDays(base, diff);
    }

    const daysLater = value.match(/(\d+)\s*일\s*후/);
    if (daysLater) return LocalDate.addDays(base, Number(daysLater[1]));

    const weeksLater = value.match(/(\d+)\s*주\s*후/);
    if (weeksLater) return LocalDate.addDays(base, Number(weeksLater[1]) * 7);

    const monthsLater = value.match(/(\d+)\s*(?:달|개월)\s*후/);
    if (monthsLater) {
      const date = new Date(today);
      date.setMonth(date.getMonth() + Number(monthsLater[1]));
      return LocalDate.toKey(date);
    }

    if (/(이번\s*달\s*말|이번달\s*말|월말)/.test(value)) {
      return monthEndDate(today.getMonth(), today.getFullYear());
    }

    const monthEnd = value.match(/(\d{1,2})월(?:\s*말|\s*까지)/);
    if (monthEnd) {
      const month = Number(monthEnd[1]);
      const year = month < today.getMonth() + 1 ? today.getFullYear() + 1 : today.getFullYear();
      return monthEndDate(month - 1, year);
    }

    return null;
  }

  function stripDateFragments(text) {
    return normalizeText(text)
      .replace(/\d{4}[./-]\d{1,2}[./-]\d{1,2}/g, ' ')
      .replace(/\d{1,2}월\s*\d{1,2}일/g, ' ')
      .replace(/\d{1,2}\s*\/\s*\d{1,2}/g, ' ')
      .replace(/(?:다음주|다음 주|이번주|이번 주)\s*[일월화수목금토]/g, ' ')
      .replace(/\d+\s*일\s*후/g, ' ')
      .replace(/\d+\s*(?:달|개월)\s*후/g, ' ')
      .replace(/(?:오늘|내일|모레|어제|이번\s*달\s*말|이번달\s*말|월말)/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[,.-\s]+|[,.-\s]+$/g, '')
      .trim();
  }

  function extractQuotedText(prompt) {
    const match = String(prompt || '').match(/텍스트:\s*"([\s\S]*)"\s*$/);
    return match ? match[1] : '';
  }

  function categoryFromText(text) {
    const value = normalizeText(text);
    if (/(스토어|qa|테스트|버그|배포|서버|api|도메인|ssl|인프라|로그|보안|부하)/i.test(value)) return 'technical';
    if (/(광고|홍보|마케팅|sns|인스타|페이스북|보도자료|캠페인|뉴스레터|브랜딩)/i.test(value)) return 'marketing';
    if (/(디자인|ui|ux|화면|와이어프레임|배치|색상|아이콘|레이아웃)/i.test(value)) return 'design';
    if (/(운영|cs|고객센터|문의|매뉴얼|알림|모니터링|kpi|정산|관리)/i.test(value)) return 'operations';
    return 'product';
  }

  function taskCategoryLabel(category) {
    const map = {
      product: '기획',
      design: '디자인',
      marketing: '마케팅',
      operations: '운영',
      technical: '개발',
    };
    return map[category] || '기획';
  }

  function extractTitle(text) {
    const stripped = stripDateFragments(text)
      .replace(/\b(추가|정리|해줘|해주세요|해보자|해주세요|만들기|작성|설정)\b/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return stripped || normalizeText(text);
  }

  function parseChecklistItem(text) {
    const clean = extractTitle(text);
    const category = categoryFromText(text);
    return {
      text: clean,
      category: ['product', 'marketing', 'operations', 'technical'].includes(category) ? category : 'product',
    };
  }

  function parseTask(text) {
    return {
      title: extractTitle(text),
      category: taskCategoryLabel(categoryFromText(text)),
      date: parseDateExpression(text),
    };
  }

  function parseMilestone(text) {
    return {
      title: extractTitle(text),
      date: parseDateExpression(text),
      desc: stripDateFragments(text) === extractTitle(text) ? '' : stripDateFragments(text),
    };
  }

  function parseGoal(text) {
    return {
      title: extractTitle(text),
      targetDate: parseDateExpression(text),
    };
  }

  function parseBrainDump(notesText) {
    const lines = String(notesText || '')
      .split('\n')
      .map((line) => line.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean);

    return lines.slice(0, 10).map((line) => ({
      title: extractTitle(line),
      category: categoryFromText(line),
      date: parseDateExpression(line),
    }));
  }

  function parseStructuredPrompt(prompt) {
    const text = extractQuotedText(prompt);
    const lower = String(prompt || '');

    if (/체크리스트 항목/.test(lower)) return parseChecklistItem(text);
    if (/마일스톤 정보를 추출/.test(lower)) return parseMilestone(text);
    if (/할 일 정보를 추출/.test(lower)) return parseTask(text);
    if (/목표 정보를 추출/.test(lower)) return parseGoal(text);
    if (/날짜만 답해/.test(lower)) return parseDateExpression(text) || '';
    return null;
  }

  function summarizeTaskList(items, limit = 3) {
    return items.slice(0, limit).map((item) => `- ${item}`).join('\n');
  }

  function weeklySummary() {
    const tasks = Store.get('tasks') || [];
    const milestones = Store.get('milestones') || [];
    const features = Store.get('features') || [];
    const projectTasks = Store.get('projectTasks') || [];

    const today = LocalDate.today();
    const weekStart = (() => {
      const d = LocalDate.fromKey(today);
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
      return LocalDate.toKey(d);
    })();

    const inWeek = (dateStr) => {
      if (!dateStr) return false;
      const d = LocalDate.fromKey(dateStr);
      const start = LocalDate.fromKey(weekStart);
      const end = LocalDate.fromKey(LocalDate.addDays(weekStart, 6));
      return d >= start && d <= end;
    };

    const doneTasks = tasks.filter((t) => t.done && ((t.doneAt && inWeek(LocalDate.toKey(new Date(t.doneAt)))) || inWeek(t.dueDate) || t.isToday));
    const missedTasks = tasks.filter((t) => !t.done && (inWeek(t.dueDate) || t.isToday));
    const completedProjects = projectTasks.filter((t) => t.done).length;
    const nextMilestones = milestones.filter((m) => !m.done && m.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
    const doneFeatures = features.filter((f) => f.status === '완료').length;

    return [
      '✅ 잘한 점',
      doneTasks.length ? `- 이번 주 완료한 일 ${doneTasks.length}개` : '- 완료한 일이 아직 없어요',
      completedProjects ? `- 프로젝트 할 일도 ${completedProjects}개 완료했어요` : '- 프로젝트 완료 항목은 더 쌓을 수 있어요',
      '',
      '⚠️ 주의할 점',
      missedTasks.length ? `- 이번 주 미완료 항목 ${missedTasks.length}개를 먼저 정리하세요` : '- 이번 주 미완료 항목은 없어요',
      doneFeatures ? `- 완료 기능 ${doneFeatures}개를 기준으로 다음 배포 범위를 좁히세요` : '- 기능 완료 상태를 한 번 더 점검하세요',
      '',
      '🎯 다음 주 포커스',
      nextMilestones.length ? summarizeTaskList(nextMilestones.map((m) => `${m.title} (${m.date})`), 2) : '- 가장 가까운 마일스톤부터 잡으세요',
      '- 오늘 할 일과 프로젝트 다음 행동을 먼저 비우세요',
    ].join('\n');
  }

  function monthlySummary() {
    const tasks = Store.get('tasks') || [];
    const milestones = Store.get('milestones') || [];
    const features = Store.get('features') || [];
    const projectTasks = Store.get('projectTasks') || [];
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const inMonth = (value) => String(value || '').startsWith(monthKey);
    const doneTasks = tasks.filter((t) => t.done && (inMonth(LocalDate.toKey(new Date(t.doneAt || t.createdAt || Date.now()))) || inMonth(t.dueDate)));
    const missTasks = tasks.filter((t) => !t.done && inMonth(t.dueDate));
    const monthMs = milestones.filter((m) => inMonth(m.date));
    const doneFeatures = features.filter((f) => f.status === '완료');
    const activeProjects = [...new Set(projectTasks.map((t) => t.project).filter(Boolean))];

    return [
      '✅ 이번 달 잘한 점',
      doneTasks.length ? `- 완료한 할 일 ${doneTasks.length}개를 처리했어요` : '- 완료한 할 일이 적더라도 작업 흐름은 유지됐어요',
      doneFeatures.length ? `- 기능 ${doneFeatures.length}개가 완료 상태예요` : '- 기능은 아직 더 쌓을 수 있어요',
      activeProjects.length ? `- ${activeProjects.length}개 프로젝트를 병행 관리하고 있어요` : '- 진행 중인 프로젝트가 아직 적어요',
      '',
      '⚠️ 아쉬운 점 / 놓친 것',
      missTasks.length ? `- 이번 달 미완료 할 일 ${missTasks.length}개가 남아 있어요` : '- 월간 미완료 항목은 거의 없어요',
      monthMs.length ? `- 월간 마일스톤 ${monthMs.length}개를 함께 점검하세요` : '- 마일스톤 수를 조금 더 분명히 잡아도 좋아요',
      '',
      '🎯 다음 달 집중할 것',
      monthMs.slice(0, 2).length ? summarizeTaskList(monthMs.slice(0, 2).map((m) => `${m.title} (${m.date})`), 2) : '- 가장 가까운 마일스톤부터 확정',
      '- 매일 해야 할 일과 프로젝트 다음 행동을 한 줄씩만 명확하게 적기',
    ].join('\n');
  }

  function assistantReply(messages, systemPrompt = '') {
    const latest = String(messages?.[messages.length - 1]?.content || '').trim();
    const tasks = Store.get('tasks') || [];
    const projectTasks = Store.get('projectTasks') || [];
    const milestones = Store.get('milestones') || [];
    const openIssues = (Store.get('issues') || []).filter((issue) => issue.status !== 'resolved');

    const todayItems = tasks.filter((task) => !task.done && (task.isToday || task.dueDate === LocalDate.today()));
    const projectNext = projectTasks.filter((task) => !task.done).slice(0, 3);
    const nextMilestone = milestones.filter((m) => !m.done && m.date >= LocalDate.today()).sort((a, b) => a.date.localeCompare(b.date))[0];

    if (/오늘|지금|우선|먼저|정리/.test(latest)) {
      return [
        `지금은 ${todayItems.length ? `오늘 할 일 ${todayItems.length}개` : '당장 처리할 오늘 할 일이 많지 않아요'}를 먼저 보면 됩니다.`,
        projectNext.length ? `프로젝트 다음 행동은 ${projectNext[0].project}의 "${projectNext[0].title}"부터 잡는 게 좋습니다.` : '프로젝트 다음 행동은 아직 비어 있어요.',
        nextMilestone ? `가까운 마일스톤은 "${nextMilestone.title}" (${nextMilestone.date}) 입니다.` : '가까운 마일스톤은 없습니다.',
      ].join(' ');
    }

    if (/이슈|문제|버그/.test(latest)) {
      return openIssues.length
        ? `현재 열린 이슈는 ${openIssues.length}개입니다. 우선순위가 높은 것부터 처리하는 게 좋습니다.`
        : '열린 이슈는 없습니다.';
    }

    if (/프로젝트|진행|다음/.test(latest)) {
      return projectNext.length
        ? `현재 먼저 볼 프로젝트는 ${projectNext.map((t) => `${t.project} / ${t.title}`).join(', ')} 입니다.`
        : '지금 바로 잡을 프로젝트 할 일은 보이지 않습니다.';
    }

    if (/목표|마일스톤|로드맵/.test(latest)) {
      const top = milestones.filter((m) => !m.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
      return top.length
        ? `가까운 마일스톤은 ${top.map((m) => `${m.title} (${m.date})`).join(', ')} 입니다.`
        : '진행 중인 마일스톤은 아직 없습니다.';
    }

    return [
      systemPrompt ? '로컬 보조 모드로 응답합니다.' : '로컬 보조 모드입니다.',
      `현재 미완료 할 일 ${todayItems.length}개, 프로젝트 다음 행동 ${projectNext.length}개, 열린 이슈 ${openIssues.length}개가 보입니다.`,
      nextMilestone ? `다음 마일스톤은 ${nextMilestone.title} (${nextMilestone.date})입니다.` : '가까운 마일스톤은 없습니다.',
    ].join(' ');
  }

  async function parse(type, text) {
    const normalized = normalizeText(text);
    switch (type) {
      case 'milestone':
        return parseMilestone(normalized);
      case 'feature':
        return {
          name: extractTitle(normalized),
          desc: '',
          category: taskCategoryLabel(categoryFromText(normalized)),
        };
      case 'task':
        return parseTask(normalized);
      case 'goal':
        return parseGoal(normalized);
      case 'checklistItem':
        return parseChecklistItem(normalized);
      default:
        return { text: extractTitle(normalized) };
    }
  }

  async function chat(messages, systemPrompt = '', model = '') { // model kept for compatibility
    const latest = String(messages?.[messages.length - 1]?.content || '');
    const structured = parseStructuredPrompt(latest);
    if (structured !== null) {
      return typeof structured === 'string' ? structured : JSON.stringify(structured);
    }

    if (/브레인 덤프 메모들/.test(latest)) {
      return JSON.stringify(parseBrainDump(latest), null, 2);
    }

    if (/주간 리뷰/.test(latest) || /이번 주 현황/.test(latest)) {
      return weeklySummary();
    }

    if (/월간 리뷰/.test(latest) || /이번 달/.test(latest)) {
      return monthlySummary();
    }

    return assistantReply(messages, systemPrompt);
  }

  async function chatStream(messages, systemPrompt = '', onChunk, onDone) {
    const full = await chat(messages, systemPrompt);
    const chunks = full.split(/(\n)/);
    for (const chunk of chunks) {
      if (!chunk) continue;
      onChunk?.(chunk);
    }
    onDone?.();
  }

  return {
    init,
    chat,
    chatStream,
    parse,
    parseDateExpression,
    saveApiKey,
    deleteApiKey,
    getApiKey,
    hasApiKey,
    setApiKey,
  };
})();
