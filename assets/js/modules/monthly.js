/**
 * monthly.js — 월간 리뷰
 */

const Monthly = (() => {
  const now = new Date();
  let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  /* ─ 날짜 유틸 ─ */
  function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthEnd(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function inMonth(val, month) {
    if (!val) return false;
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  }

  function inRange(val, start, end) {
    if (!val) return false;
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    return d >= start && d <= end;
  }

  function formatMonth(d) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  }

  function shortDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 이번 달 안의 주차 목록 (월요일 기준) ─ */
  function getWeeksOfMonth(month) {
    const start = new Date(month);
    const end   = monthEnd(month);
    const day   = start.getDay();
    const first = new Date(start);
    first.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    first.setHours(0, 0, 0, 0);

    const weeks = [];
    let ws = new Date(first);
    while (ws <= end) {
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      weeks.push({ start: new Date(ws), end: new Date(we) });
      ws.setDate(ws.getDate() + 7);
    }
    return weeks;
  }

  /* ─ 주차별 통계 ─ */
  function weekStats(tasks, ws, we) {
    const done = tasks.filter(t => {
      if (!t.done) return false;
      if (t.doneAt) return inRange(t.doneAt, ws, we);
      return inRange(t.dueDate, ws, we);
    });
    const pending = tasks.filter(t => !t.done && inRange(t.dueDate, ws, we));
    const total   = done.length + pending.length;
    const pct     = total ? Math.round(done.length / total * 100) : 0;
    return { done: done.length, total, pct };
  }

  /* ─ 메모 저장/불러오기 ─ */
  function getMemo(month) {
    const all = Store.get('monthlyReviews') || {};
    return all[monthKey(month)] || { memo: '', aiSummary: '', reflectGood: '', reflectBad: '', reflectNext: '' };
  }

  function saveMemo(month, patch) {
    const all = Store.get('monthlyReviews') || {};
    const k   = monthKey(month);
    all[k]    = { ...(all[k] || {}), ...patch };
    Store.set('monthlyReviews', all);
  }

  /* ─ 렌더 ─ */
  function buildHTML() {
    const today      = new Date();
    const isCurrent  = monthKey(currentMonth) === monthKey(today);
    const end        = monthEnd(currentMonth);

    const tasks      = Store.get('tasks')      || [];
    const milestones = Store.get('milestones') || [];
    const features   = Store.get('features')   || [];

    /* 이번 달 완료 / 미완료 할 일 */
    const doneTasks = tasks.filter(t => {
      if (!t.done) return false;
      if (t.doneAt) return inMonth(t.doneAt, currentMonth);
      return t.dueDate && inMonth(t.dueDate, currentMonth);
    });
    const missTasks = tasks.filter(t =>
      !t.done && t.dueDate && inMonth(t.dueDate, currentMonth)
    );

    /* 이번 달 마일스톤 */
    const monthMs   = milestones.filter(m => m.date && inMonth(m.date, currentMonth));

    /* 이번 달 완료된 기능 (doneAt 기록 있는 것만) */
    const doneFeat  = features.filter(f => f.status === '완료' && f.doneAt && inMonth(f.doneAt, currentMonth));

    /* 주차별 */
    const weeks     = getWeeksOfMonth(currentMonth);

    /* 통계 */
    const total     = doneTasks.length + missTasks.length;
    const pct       = total ? Math.round(doneTasks.length / total * 100) : 0;
    const doneMs    = monthMs.filter(m => m.done).length;

    const memo      = getMemo(currentMonth);

    return `
      <!-- 월 네비게이션 -->
      <div class="mo-nav">
        <button class="mo-nav-btn" onclick="Monthly.prevMonth()">← 이전 달</button>
        <div class="mo-title">
          <div class="mo-month">${formatMonth(currentMonth)}</div>
          ${isCurrent ? '<span class="mo-current-badge">이번 달</span>' : ''}
        </div>
        <button class="mo-nav-btn" onclick="Monthly.nextMonth()" ${isCurrent ? 'disabled' : ''}>다음 달 →</button>
      </div>

      <!-- 요약 카드 -->
      <div class="mo-summary">
        <div class="mo-stat-card">
          <div class="mo-stat-label">완료한 할 일</div>
          <div class="mo-stat-value">${doneTasks.length}<span> / ${total}</span></div>
          <div class="mo-stat-bar"><div class="mo-stat-bar-fill" style="width:${pct}%"></div></div>
          <div class="mo-stat-sub">달성률 ${pct}%</div>
        </div>
        <div class="mo-stat-card">
          <div class="mo-stat-label">완료된 기능</div>
          <div class="mo-stat-value">${doneFeat.length}<span class="mo-stat-unit">개</span></div>
          <div class="mo-stat-sub">
            ${doneFeat.length > 0
              ? doneFeat.slice(0, 2).map(f => f.name).join(', ') + (doneFeat.length > 2 ? ' 외' : '')
              : '기능 보드 완료 기준'}
          </div>
        </div>
        <div class="mo-stat-card">
          <div class="mo-stat-label">마일스톤 달성</div>
          <div class="mo-stat-value">${doneMs}<span> / ${monthMs.length}</span></div>
          <div class="mo-stat-sub">
            ${monthMs.length === 0 ? '이번 달 마일스톤 없음' : `${monthMs.length}개 예정`}
          </div>
        </div>
      </div>

      <!-- 주차별 달성률 바 차트 -->
      <div class="mo-section">
        <div class="mo-section-title">주차별 달성률</div>
        <div class="mo-weeks">
          ${weeks.map((w, i) => {
            const st     = weekStats(tasks, w.start, w.end);
            const isPast = w.end < today;
            const isCur  = w.start <= today && today <= w.end;
            const fillCls = st.total === 0 ? 'empty' : (isPast && st.pct < 50 ? 'low' : '');
            return `
              <div class="mo-week-col">
                <div class="mo-week-bar-wrap">
                  <div class="mo-week-pct">${st.total > 0 ? st.pct + '%' : ''}</div>
                  <div class="mo-week-bar-track">
                    <div class="mo-week-bar-fill ${fillCls}"
                      style="height:${st.pct}%"></div>
                  </div>
                </div>
                <div class="mo-week-label ${isCur ? 'current' : ''}">
                  ${i + 1}주차
                  <span class="mo-week-date">${w.start.getMonth() + 1}월 ${w.start.getDate()}일 ~ ${w.end.getDate()}일</span>
                </div>
                <div class="mo-week-sub">${st.total > 0 ? `${st.done}/${st.total}` : '-'}</div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- 본문 2컬럼 -->
      <div class="mo-body">
        <!-- 왼쪽: 할 일 + 마일스톤 -->
        <div class="mo-left">
          <div class="mo-section">
            <div class="mo-section-title">
              완료한 할 일
              <span class="mo-section-count">${doneTasks.length}개</span>
            </div>
            ${doneTasks.length === 0
              ? '<div class="mo-empty">완료 기록이 없어요</div>'
              : doneTasks.map(t => `
                  <div class="mo-task-row done">
                    <span class="mo-task-check">✓</span>
                    <span class="mo-task-title">${escapeHtml(t.title)}</span>
                    <span class="mo-cat-dot ${t.category || ''}"></span>
                  </div>`).join('')}

            ${missTasks.length > 0 ? `
              <div class="mo-miss-header">미완료 ${missTasks.length}개</div>
              ${missTasks.map(t => `
                <div class="mo-task-row miss">
                  <span class="mo-task-check">○</span>
                  <span class="mo-task-title">${escapeHtml(t.title)}</span>
                  <span class="mo-cat-dot ${t.category || ''}"></span>
                </div>`).join('')}
            ` : ''}
          </div>

          ${monthMs.length > 0 ? `
          <div class="mo-section">
            <div class="mo-section-title">이번 달 마일스톤</div>
            ${monthMs.map(m => `
              <div class="mo-ms-row ${m.done ? 'done' : 'pending'}">
                <span>${m.done ? '✓' : '◆'}</span>
                <span>${escapeHtml(m.title)}</span>
                <span class="mo-ms-date">${shortDate(m.date)}</span>
              </div>`).join('')}
          </div>` : ''}
        </div>

        <!-- 오른쪽: 완료 기능 + AI + 메모 -->
        <div class="mo-right">
          ${doneFeat.length > 0 ? `
          <div class="mo-section">
            <div class="mo-section-title">
              완료된 기능
              <span class="mo-section-count">${doneFeat.length}개</span>
            </div>
            ${doneFeat.map(f => `
              <div class="mo-feat-row">
                <span class="mo-feat-check">✓</span>
                <span class="mo-feat-name">${escapeHtml(f.name)}</span>
                <span class="mo-cat-dot ${f.category || ''}"></span>
              </div>`).join('')}
          </div>` : ''}

          <div class="mo-section">
            <div class="mo-section-title">AI 월간 요약</div>
            <div id="mo-ai-content">
              ${memo.aiSummary
                ? `<div class="mo-ai-result">${escapeHtml(memo.aiSummary).replace(/\n/g, '<br>')}</div>`
                : '<div class="mo-ai-empty">AI가 이번 달을 정리해드릴게요</div>'}
            </div>
            <button class="mo-ai-btn" id="mo-ai-btn" onclick="Monthly.generateSummary()">
              ✦ ${memo.aiSummary ? '다시 생성' : 'AI 요약 생성'}
            </button>
          </div>

          <div class="mo-section">
            <div class="mo-section-title">회고</div>
            <div class="mo-reflect-group">
              <label class="mo-reflect-label">✅ 이번 달 잘한 점</label>
              <textarea class="mo-reflect-input" id="mo-reflect-good"
                placeholder="이번 달 가장 뿌듯한 일">${escapeHtml(memo.reflectGood || '')}</textarea>
            </div>
            <div class="mo-reflect-group">
              <label class="mo-reflect-label">⚠️ 아쉬운 점 / 놓친 것</label>
              <textarea class="mo-reflect-input" id="mo-reflect-bad"
                placeholder="다음에 다르게 해볼 것">${escapeHtml(memo.reflectBad || '')}</textarea>
            </div>
            <div class="mo-reflect-group">
              <label class="mo-reflect-label">🎯 다음 달 집중할 것</label>
              <textarea class="mo-reflect-input" id="mo-reflect-next"
                placeholder="다음 달 1~3개 우선순위">${escapeHtml(memo.reflectNext || '')}</textarea>
            </div>
            ${memo.memo ? `
              <details class="mo-reflect-legacy">
                <summary>이전 메모 보기</summary>
                <div class="mo-reflect-legacy-body">${escapeHtml(memo.memo).replace(/\n/g, '<br>')}</div>
              </details>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    document.getElementById('app').innerHTML = buildHTML();
    bindMemo();
  }

  /* ─ 메모 자동 저장 ─ */
  function bindMemo() {
    const FIELDS = [
      ['mo-reflect-good', 'reflectGood'],
      ['mo-reflect-bad',  'reflectBad'],
      ['mo-reflect-next', 'reflectNext'],
    ];
    let timer;
    FIELDS.forEach(([id, key]) => {
      const ta = document.getElementById(id);
      if (!ta) return;
      ta.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => saveMemo(currentMonth, { [key]: ta.value }), 600);
      });
    });
  }

  /* ─ AI 월간 요약 ─ */
  async function generateSummary() {
    if (!AI.getApiKey()) {
      Toast.show('설정(⚙)에서 API 키를 먼저 입력해 주세요.', 'warning');
      return;
    }

    const btn     = document.getElementById('mo-ai-btn');
    const content = document.getElementById('mo-ai-content');
    if (!btn || !content) return;

    btn.disabled    = true;
    btn.textContent = '✦ 분석 중...';
    content.innerHTML = '<div class="mo-ai-streaming" id="mo-ai-stream">분석 중...</div>';

    const tasks      = Store.get('tasks')      || [];
    const milestones = Store.get('milestones') || [];
    const features   = Store.get('features')   || [];

    const doneTasks = tasks.filter(t => {
      if (!t.done) return false;
      if (t.doneAt) return inMonth(t.doneAt, currentMonth);
      return t.dueDate && inMonth(t.dueDate, currentMonth);
    });
    const missTasks  = tasks.filter(t => !t.done && t.dueDate && inMonth(t.dueDate, currentMonth));
    const monthMs    = milestones.filter(m => m.date && inMonth(m.date, currentMonth));
    const doneFeat   = features.filter(f => f.status === '완료' && f.doneAt && inMonth(f.doneAt, currentMonth));
    const totalFeat  = features.length;
    const totalDone  = features.filter(f => f.status === '완료').length;
    const reflect    = getMemo(currentMonth);

    const prompt = `나는 헬로아지(반려견 플랫폼 모바일 앱)를 1인으로 기획·디자인·운영하고 있어.

${formatMonth(currentMonth)} 현황:
- 완료한 할 일 ${doneTasks.length}개: ${doneTasks.slice(0, 6).map(t => t.title).join(', ')}${doneTasks.length > 6 ? ` 외 ${doneTasks.length - 6}개` : ''}
- 미완료 할 일 ${missTasks.length}개: ${missTasks.slice(0, 3).map(t => t.title).join(', ') || '없음'}
- 마일스톤: ${monthMs.map(m => m.title + (m.done ? ' ✓' : ' ✗')).join(', ') || '없음'}
- 이번 달 완료된 기능: ${doneFeat.map(f => f.name).join(', ') || '없음'}
- 전체 기능 개발: ${totalDone}/${totalFeat}개 완료
${reflect.reflectGood ? `\n내가 적은 잘한 점: ${reflect.reflectGood}` : ''}
${reflect.reflectBad  ? `\n내가 적은 아쉬운 점: ${reflect.reflectBad}` : ''}
${reflect.reflectNext ? `\n내가 적은 다음 달 집중: ${reflect.reflectNext}` : ''}

위 데이터를 바탕으로 ${formatMonth(currentMonth)} 월간 리뷰를 써줘. 마크다운 없이 일반 텍스트로.

형식:
✅ 이번 달 잘한 점
⚠️ 아쉬운 점 / 놓친 것
🎯 다음 달 집중할 것`;

    let full = '';
    try {
      await AI.chatStream(
        [{ role: 'user', content: prompt }],
        '',
        (chunk) => {
          full += chunk;
          const el = document.getElementById('mo-ai-stream');
          if (el) el.textContent = full;
        },
        () => {
          saveMemo(currentMonth, { aiSummary: full });
          content.innerHTML = `<div class="mo-ai-result">${escapeHtml(full).replace(/\n/g, '<br>')}</div>`;
          btn.disabled    = false;
          btn.textContent = '✦ 다시 생성';
        }
      );
    } catch {
      content.innerHTML = '<div class="mo-ai-empty">오류가 발생했어요. 다시 시도해주세요.</div>';
      btn.disabled    = false;
      btn.textContent = '✦ AI 요약 생성';
    }
  }

  /* ─ 월 이동 ─ */
  function prevMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    render();
  }

  function nextMonth() {
    const limit = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (currentMonth >= limit) return;
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    render();
  }

  return { render, prevMonth, nextMonth, generateSummary, renderHTML: buildHTML, bindMemo };
})();

document.addEventListener('DOMContentLoaded', () => Monthly.render());
