/**
 * roadmap.js — 마일스톤 + 헬로아지 전체 수행도
 */

const Roadmap = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];

  /* ─ 데이터 ─ */
  function getMilestones() { return Store.get('milestones') || []; }
  function getFeatures()   { return Store.get('features')   || []; }
  function getTasks()      { return Store.get('tasks')      || []; }

  /* ─ 계산 ─ */
  function featureStats() {
    const list = getFeatures();
    const total = list.length;
    const done  = list.filter(f => f.status === '완료').length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    const bySt  = {};
    STATUSES.forEach(s => { bySt[s] = list.filter(f => f.status === s).length; });
    return { total, done, pct, bySt };
  }

  function todayStats() {
    const all   = getTasks();
    const today = new Date().toDateString();
    const list  = all.filter(t => t.isToday || (t.dueDate && new Date(t.dueDate).toDateString() === today));
    const done  = list.filter(t => t.done).length;
    return { total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  function nextMilestone() {
    const ms = getMilestones().filter(m => !m.done).sort((a, b) => new Date(a.date) - new Date(b.date));
    return ms[0] || null;
  }

  /* ─ D-day 계산 ─ */
  function dday(dateStr, done) {
    if (done) return { label: '완료', cls: 'dday-done' };
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff === 0)  return { label: 'D-Day', cls: 'dday-today' };
    if (diff < 0)    return { label: `D+${Math.abs(diff)}`, cls: 'dday-overdue' };
    if (diff <= 14)  return { label: `D-${diff}`, cls: 'dday-soon' };
    return { label: `D-${diff}`, cls: 'dday-future' };
  }

  function milestoneClass(m) {
    if (m.done) return 'done';
    const diff = Math.ceil((new Date(m.date) - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff < 0) return 'overdue';
    return 'upcoming';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─ 렌더 ─ */
  function render() {
    const feat   = featureStats();
    const today  = todayStats();
    const next   = nextMilestone();
    const dd     = next ? dday(next.date, next.done) : null;
    const milestones = [...getMilestones()].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxSt  = Math.max(...STATUSES.map(s => feat.bySt[s]), 1);

    document.getElementById('app').innerHTML = `
      <!-- 수행도 요약 -->
      <div class="roadmap-summary">
        <div class="summary-card">
          <div class="summary-label">기능 개발 수행도</div>
          <div class="summary-value">${feat.pct}<span>%</span></div>
          <div class="summary-sub">${feat.done} / ${feat.total}개 완료</div>
          <div class="summary-bar"><div class="summary-bar-fill green" style="width:${feat.pct}%"></div></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">오늘 달성률</div>
          <div class="summary-value">${today.pct}<span>%</span></div>
          <div class="summary-sub">${today.done} / ${today.total}개 완료</div>
          <div class="summary-bar"><div class="summary-bar-fill orange" style="width:${today.pct}%"></div></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">다음 마일스톤</div>
          ${next
            ? `<div class="summary-value" style="font-size:1.3rem">${escapeHtml(next.title)}</div>
               <div class="summary-sub">${formatDate(next.date)}</div>
               <div style="margin-top:10px"><span class="milestone-dday ${dd.cls}">${dd.label}</span></div>`
            : `<div class="summary-value" style="font-size:1rem;color:var(--color-text-3)">없음</div>
               <div class="summary-sub">마일스톤을 추가해보세요</div>`
          }
        </div>
      </div>

      <!-- 기능 개발 현황 -->
      <div class="feature-status-section">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="section-title" style="margin:0">기능 개발 현황</div>
          <span style="font-size:0.78rem;color:var(--color-text-3)">전체 ${feat.total}개</span>
        </div>
        <div class="feature-status-bars">
          ${STATUSES.map(s => `
            <div class="status-bar-row">
              <span class="status-bar-label">${s}</span>
              <div class="status-bar-track">
                <div class="status-bar-fill ${s}"
                  style="width:${feat.total ? Math.round(feat.bySt[s] / feat.total * 100) : 0}%"></div>
              </div>
              <span class="status-bar-count">${feat.bySt[s]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 마일스톤 -->
      <div class="milestone-section">
        <div class="milestone-section-header">
          <div class="section-title" style="margin:0">마일스톤</div>
          <button class="btn btn-primary" onclick="Roadmap.showAddModal()">+ 마일스톤 추가</button>
        </div>
        <div class="milestone-list">
          ${milestones.length === 0
            ? `<div class="empty-state"><div class="empty-state-text">마일스톤을 추가해보세요</div></div>`
            : milestones.map(m => {
                const dd = dday(m.date, m.done);
                return `
                  <div class="milestone-item ${milestoneClass(m)}">
                    <div class="milestone-check ${m.done ? 'checked' : ''}"
                      onclick="Roadmap.toggleDone('${m.id}')">${m.done ? '✓' : ''}</div>
                    <div class="milestone-body">
                      <div class="milestone-title">${escapeHtml(m.title)}</div>
                      ${m.desc ? `<div class="milestone-desc">${escapeHtml(m.desc)}</div>` : ''}
                    </div>
                    <span class="milestone-date">${formatDate(m.date)}</span>
                    <span class="milestone-dday ${dd.cls}">${dd.label}</span>
                    <div class="milestone-actions">
                      <button class="ms-del-btn" onclick="Roadmap.deleteMilestone('${m.id}')">삭제</button>
                    </div>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
    `;
  }

  function toggleDone(id) {
    const ms = getMilestones().find(m => m.id === id);
    if (!ms) return;
    Store.update('milestones', id, { done: !ms.done });
    render();
  }

  function deleteMilestone(id) {
    Store.remove('milestones', id);
    render();
  }

  function showAddModal() {
    NLInput.show({
      heading: '마일스톤 추가 — 한 줄로 입력하세요',
      placeholder: '예) 베타 출시 6월 30일 유저 100명 테스트 시작',
      type: 'milestone',
      onSave: ({ title, date, desc }) => {
        Store.push('milestones', { title, date, desc: desc || '', done: false });
        render();
        Toast.show('마일스톤이 추가됐어요.', 'success');
      },
    });
  }

  return { render, toggleDone, deleteMilestone, showAddModal };
})();

document.addEventListener('DOMContentLoaded', () => Roadmap.render());
