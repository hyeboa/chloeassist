/**
 * weekly.js — 주간 리뷰
 */

const Weekly = (() => {
  let currentWeekStart = getWeekStart(new Date());
  let reviewTab = 'weekly';

  /* ─ 날짜 유틸 ─ */
  function getWeekStart(date) {
    const d   = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 월요일 기준
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekEnd(weekStart) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function weekKey(weekStart) {
    return weekStart.toISOString().slice(0, 10);
  }

  function inWeek(dateStr, start, end) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  }

  function formatWeekLabel(start, end) {
    const sm = start.getMonth() + 1, sd = start.getDate();
    const em = end.getMonth() + 1,   ed = end.getDate();
    const base = `${start.getFullYear()}년 ${sm}월 ${sd}일`;
    return sm === em ? `${base} ~ ${ed}일` : `${base} ~ ${em}월 ${ed}일`;
  }

  function shortDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function ddayLabel(dateStr) {
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff < 0)  return `D+${Math.abs(diff)}`;
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 프로젝트별 진행 계산 ─ */
  function projectProgress(start, end) {
    const all = Store.get('projectTasks') || [];
    const names = [...new Set(all.map(t => t.project).filter(Boolean))];
    return names.map(name => {
      const ts       = all.filter(t => t.project === name);
      const total    = ts.length;
      const done     = ts.filter(t => t.done).length;
      const weekDone = ts.filter(t =>
        t.done && t.doneAt &&
        inWeek(new Date(t.doneAt).toISOString().slice(0, 10), start, end)
      ).length;
      return { name, total, done, weekDone, pct: total ? Math.round(done / total * 100) : 0 };
    }).sort((a, b) => b.weekDone - a.weekDone || b.pct - a.pct);
  }

  /* ─ 주간 메모 저장/불러오기 ─ */
  function getMemo(weekStart) {
    const all = Store.get('weeklyReviews') || {};
    return all[weekKey(weekStart)] || { memo: '', aiSummary: '', reflectGood: '', reflectBad: '', reflectNext: '' };
  }

  function saveMemo(weekStart, patch) {
    const all = Store.get('weeklyReviews') || {};
    const k   = weekKey(weekStart);
    all[k]    = { ...(all[k] || {}), ...patch };
    Store.set('weeklyReviews', all);
  }

  /* ─ 태스크 칩 ─ */
  function taskChip(t, type) {
    return `
      <div class="wk-task-chip wk-chip-${type}">
        <span class="wk-chip-check">${t.done ? '✓' : '○'}</span>
        <span class="wk-chip-title">${escapeHtml(t.title)}</span>
        <span class="cat-wk-dot ${t.category || ''}"></span>
        ${t.dueDate ? `<span class="wk-chip-date">${shortDate(t.dueDate)}</span>` : ''}
      </div>`;
  }

  /* ─ 탭 바 ─ */
  function renderTabBar() {
    return `
      <div class="review-tabs">
        <button class="review-tab ${reviewTab === 'weekly' ? 'active' : ''}"
          onclick="Weekly.setReviewTab('weekly')">주간</button>
        <button class="review-tab ${reviewTab === 'monthly' ? 'active' : ''}"
          onclick="Weekly.setReviewTab('monthly')">월간</button>
      </div>`;
  }

  function setReviewTab(tab) {
    reviewTab = tab;
    if (tab === 'monthly') {
      document.getElementById('app').innerHTML = renderTabBar() + Monthly.renderHTML();
      Monthly.bindMemo();
    } else {
      render();
    }
  }

  /* ─ 렌더 ─ */
  function render() {
    const weekEnd   = getWeekEnd(currentWeekStart);
    const today     = new Date();
    const thisWeek  = weekKey(getWeekStart(today));
    const isCurrent = weekKey(currentWeekStart) === thisWeek;

    const milestones = Store.get('milestones') || [];
    const tasks      = Store.get('tasks')      || [];
    const features   = Store.get('features')   || [];

    /* 이번 주 태스크:
       - 완료된 것 → doneAt이 이번 주에 찍힌 것 (없으면 dueDate 기준 fallback)
       - 미완료    → dueDate가 이번 주인 것 */
    const doneTasks = tasks.filter(t => {
      if (!t.done) return false;
      if (t.doneAt) return inWeek(new Date(t.doneAt).toISOString().slice(0,10), currentWeekStart, weekEnd);
      return (isCurrent && t.isToday) || inWeek(t.dueDate, currentWeekStart, weekEnd);
    });
    const missTasks = tasks.filter(t =>
      !t.done && ((isCurrent && t.isToday) || inWeek(t.dueDate, currentWeekStart, weekEnd))
    );
    const weekTasks = [...doneTasks, ...missTasks];

    /* 다음 주 태스크 (현재 주 뷰에서만) */
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    const nextWeekEnd = getWeekEnd(nextWeekStart);
    const nextTasks = isCurrent
      ? tasks.filter(t => !t.done && inWeek(t.dueDate, nextWeekStart, nextWeekEnd))
      : [];

    /* 프로젝트별 진행 (전체 누적 + 이번 주 완료 수) */
    const projStats = projectProgress(currentWeekStart, weekEnd);

    /* 이번 주 마일스톤 */
    const weekMs = milestones.filter(m => inWeek(m.date, currentWeekStart, weekEnd));

    /* 다음 마일스톤 */
    const nextMs = milestones
      .filter(m => !m.done && new Date(m.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

    /* 통계 */
    const totalWeek   = weekTasks.length;
    const completePct = totalWeek ? Math.round(doneTasks.length / totalWeek * 100) : 0;

    const memo = getMemo(currentWeekStart);

    document.getElementById('app').innerHTML = renderTabBar() + `
      <!-- 주 네비게이션 -->
      <div class="wk-nav">
        <button class="wk-nav-btn" onclick="Weekly.prevWeek()">← 이전 주</button>
        <div class="wk-title">
          <div class="wk-range">${formatWeekLabel(currentWeekStart, weekEnd)}</div>
          ${isCurrent ? '<span class="wk-current-badge">이번 주</span>' : ''}
        </div>
        <button class="wk-nav-btn" onclick="Weekly.nextWeek()" ${isCurrent ? 'disabled' : ''}>다음 주 →</button>
      </div>

      <!-- 요약 카드 -->
      <div class="wk-summary">
        <div class="wk-stat">
          <div class="wk-stat-label">이번 주 달성률</div>
          <div class="wk-stat-value">${completePct}<span>%</span></div>
          <div class="wk-stat-bar"><div class="wk-stat-bar-fill" style="width:${completePct}%"></div></div>
          <div class="wk-stat-sub">${doneTasks.length} / ${totalWeek}개 완료</div>
        </div>
        <div class="wk-stat">
          <div class="wk-stat-label">다음 마일스톤</div>
          ${nextMs
            ? `<div class="wk-ms-title">${escapeHtml(nextMs.title)}</div>
               <div class="wk-ms-dday">${ddayLabel(nextMs.date)}</div>`
            : `<div class="wk-ms-title" style="color:var(--color-text-3)">모두 완료!</div>`}
        </div>
      </div>

      <!-- 본문 2컬럼 -->
      <div class="wk-body">
        <!-- 왼쪽: 이번 주 실적 -->
        <div class="wk-left">
          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot done"></span>
              이번 주 완료
              <span class="wk-section-count">${doneTasks.length}개</span>
            </div>
            ${doneTasks.length
              ? doneTasks.map(t => taskChip(t, 'done')).join('')
              : '<div class="wk-empty">완료된 할 일이 없어요</div>'}
          </div>

          ${missTasks.length ? `
          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot miss"></span>
              미완료
              <span class="wk-section-count">${missTasks.length}개</span>
            </div>
            ${missTasks.map(t => taskChip(t, 'miss')).join('')}
          </div>` : ''}

          ${weekMs.length ? `
          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot ms"></span>
              이번 주 마일스톤
              <span class="wk-section-count">${weekMs.length}개</span>
            </div>
            ${weekMs.map(m => `
              <div class="wk-ms-chip ${m.done ? 'done' : 'pending'}">
                <span>${m.done ? '✓' : '◆'}</span>
                <span>${escapeHtml(m.title)}</span>
              </div>`).join('')}
          </div>` : ''}

          ${projStats.length ? `
          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot proj"></span>
              프로젝트 진행
              <span class="wk-section-count">${projStats.length}개</span>
            </div>
            ${projStats.map(p => `
              <div class="wk-proj-row">
                <div class="wk-proj-top">
                  <span class="wk-proj-name">${escapeHtml(p.name)}</span>
                  ${p.weekDone ? `<span class="wk-proj-week">이번 주 +${p.weekDone}</span>` : ''}
                </div>
                <div class="wk-proj-bar"><div class="wk-proj-bar-fill" style="width:${p.pct}%"></div></div>
                <div class="wk-proj-sub">${p.done} / ${p.total}개 완료 · ${p.pct}%</div>
              </div>`).join('')}
          </div>` : ''}

          ${!weekMs.length && !missTasks.length && !doneTasks.length && !projStats.length ? `
          <div class="wk-section">
            <div class="wk-empty" style="padding:20px 0">
              이번 주 기한이 설정된 할 일이 없어요.<br>
              <span style="font-size:0.72rem">할 일 목록에서 날짜를 추가해보세요.</span>
            </div>
          </div>` : ''}
        </div>

        <!-- 오른쪽: 다음 주 + AI + 메모 -->
        <div class="wk-right">
          ${isCurrent ? `
          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot next"></span>
              다음 주 예정
              <span class="wk-section-count">${nextTasks.length}개</span>
            </div>
            ${nextTasks.length
              ? nextTasks.map(t => taskChip(t, 'next')).join('')
              : '<div class="wk-empty">다음 주 일정이 없어요</div>'}
          </div>` : ''}

          <div class="wk-section">
            <div class="wk-section-header">
              <span class="wk-section-dot ai"></span>
              AI 주간 요약
            </div>
            <div id="wk-ai-content">
              ${memo.aiSummary
                ? `<div class="wk-ai-result">${escapeHtml(memo.aiSummary).replace(/\n/g, '<br>')}</div>`
                : '<div class="wk-ai-empty">AI가 이번 주를 분석해드릴게요</div>'}
            </div>
            <button class="wk-ai-btn" id="wk-ai-btn" onclick="Weekly.generateSummary()">
              ✦ ${memo.aiSummary ? '다시 생성' : 'AI 요약 생성'}
            </button>
          </div>

        </div>
      </div>
    `;

  }

  /* ─ AI 주간 요약 생성 ─ */
  async function generateSummary() {
    if (!AI.getApiKey()) {
      Toast.show('설정(⚙)에서 API 키를 먼저 입력해 주세요.', 'warning');
      return;
    }

    const btn     = document.getElementById('wk-ai-btn');
    const content = document.getElementById('wk-ai-content');
    if (!btn || !content) return;

    btn.disabled    = true;
    btn.textContent = '✦ 분석 중...';
    content.innerHTML = '<div class="wk-ai-streaming" id="wk-ai-stream">분석 중...</div>';

    const weekEnd   = getWeekEnd(currentWeekStart);
    const today     = new Date();
    const isCurrent = weekKey(currentWeekStart) === weekKey(getWeekStart(today));

    const tasks      = Store.get('tasks')      || [];
    const milestones = Store.get('milestones') || [];
    const features   = Store.get('features')   || [];

    const wEnd2   = getWeekEnd(currentWeekStart);
    const doneSummary = tasks.filter(t => {
      if (!t.done) return false;
      if (t.doneAt) return inWeek(new Date(t.doneAt).toISOString().slice(0,10), currentWeekStart, wEnd2);
      return (isCurrent && t.isToday) || inWeek(t.dueDate, currentWeekStart, wEnd2);
    });
    const missSummary = tasks.filter(t =>
      !t.done && ((isCurrent && t.isToday) || inWeek(t.dueDate, currentWeekStart, wEnd2))
    );
    const done = doneSummary.map(t => t.title);
    const miss = missSummary.map(t => t.title);
    const featDone = features.filter(f => f.status === '완료').length;
    const upcomingMs = milestones.filter(m => !m.done && new Date(m.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 2);
    const projSummary = projectProgress(currentWeekStart, wEnd2);
    const reflect = getMemo(currentWeekStart);

    const prompt = `나는 헬로아지(반려견 플랫폼 모바일 앱)를 1인으로 기획·디자인·운영하고 있어.

이번 주 현황:
- 완료한 일: ${done.length ? done.join(', ') : '없음'}
- 못 끝낸 일: ${miss.length ? miss.join(', ') : '없음'}
- 기능 개발 진행도: ${featDone}/${features.length}개 완료
${projSummary.map(p => `- 프로젝트 「${p.name}」: ${p.pct}% 진행 (이번 주 ${p.weekDone}개 완료)`).join('\n')}
${upcomingMs.map(m => `- 마일스톤 예정: ${m.title} (${m.date})`).join('\n')}
${reflect.reflectGood ? `\n내가 적은 잘한 점: ${reflect.reflectGood}` : ''}
${reflect.reflectBad  ? `\n내가 적은 아쉬운 점: ${reflect.reflectBad}` : ''}
${reflect.reflectNext ? `\n내가 적은 다음 주 집중: ${reflect.reflectNext}` : ''}

위 상황을 바탕으로 짧고 따뜻한 주간 리뷰를 써줘. 마크다운 없이 일반 텍스트로.

형식:
✅ 잘한 점
⚠️ 주의할 점
🎯 다음 주 포커스`;

    let full = '';
    try {
      await AI.chatStream(
        [{ role: 'user', content: prompt }],
        '',
        (chunk) => {
          full += chunk;
          const el = document.getElementById('wk-ai-stream');
          if (el) el.textContent = full;
        },
        () => {
          saveMemo(currentWeekStart, { aiSummary: full });
          content.innerHTML = `<div class="wk-ai-result">${escapeHtml(full).replace(/\n/g, '<br>')}</div>`;
          btn.disabled    = false;
          btn.textContent = '✦ 다시 생성';
        }
      );
    } catch {
      content.innerHTML = '<div class="wk-ai-empty">오류가 발생했어요. 다시 시도해주세요.</div>';
      btn.disabled    = false;
      btn.textContent = '✦ AI 요약 생성';
    }
  }

  /* ─ 주 이동 ─ */
  function prevWeek() {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    render();
  }

  function nextWeek() {
    const limit = getWeekStart(new Date());
    if (currentWeekStart >= limit) return;
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    render();
  }

  return { render, prevWeek, nextWeek, generateSummary, setReviewTab };
})();

document.addEventListener('DOMContentLoaded', () => Weekly.render());
