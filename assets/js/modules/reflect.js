/**
 * reflect.js — 회고 모음 (주간·월간 누적 타임라인)
 */

const Reflect = (() => {
  let filter = 'all'; // all | weekly | monthly

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function nl2br(s) {
    return escapeHtml(s).replace(/\n/g, '<br>');
  }

  function hasContent(r) {
    return !!(r.reflectGood || r.reflectBad || r.reflectNext || r.memo || r.aiSummary);
  }

  function weekLabel(keyISO) {
    const start = new Date(keyISO);
    const end   = new Date(start);
    end.setDate(start.getDate() + 6);
    const sm = start.getMonth() + 1, sd = start.getDate();
    const em = end.getMonth() + 1,   ed = end.getDate();
    const head = `${start.getFullYear()}년 ${sm}월 ${sd}일`;
    return sm === em ? `${head} ~ ${ed}일` : `${head} ~ ${em}월 ${ed}일`;
  }

  function monthLabel(key) {
    const [y, m] = key.split('-');
    return `${y}년 ${parseInt(m, 10)}월`;
  }

  function collect() {
    const weekly  = Store.get('weeklyReviews')  || {};
    const monthly = Store.get('monthlyReviews') || {};
    const items = [];

    Object.entries(weekly).forEach(([key, r]) => {
      if (!hasContent(r)) return;
      items.push({ type: 'weekly', key, sortTs: new Date(key).getTime(), data: r });
    });
    Object.entries(monthly).forEach(([key, r]) => {
      if (!hasContent(r)) return;
      const [y, m] = key.split('-').map(Number);
      items.push({ type: 'monthly', key, sortTs: new Date(y, m - 1, 1).getTime(), data: r });
    });

    return items.sort((a, b) => b.sortTs - a.sortTs);
  }

  function renderField(emoji, label, val) {
    if (!val) return '';
    return `
      <div class="ref-field">
        <div class="ref-field-label">${emoji} ${label}</div>
        <div class="ref-field-body">${nl2br(val)}</div>
      </div>`;
  }

  function renderCard(item) {
    const isWeek = item.type === 'weekly';
    const title  = isWeek ? weekLabel(item.key) : monthLabel(item.key);
    const href   = isWeek ? 'weekly.html' : 'monthly.html';
    const r      = item.data;

    return `
      <article class="ref-card ${isWeek ? 'is-weekly' : 'is-monthly'}">
        <header class="ref-card-hd">
          <span class="ref-card-tag">${isWeek ? '주간' : '월간'}</span>
          <span class="ref-card-title">${title}</span>
          <a class="ref-card-link" href="${href}" title="해당 리뷰로 이동">상세 →</a>
        </header>
        <div class="ref-card-body">
          ${renderField('✅', '잘한 점',          r.reflectGood)}
          ${renderField('⚠️', '아쉬운 점',        r.reflectBad)}
          ${renderField('🎯', isWeek ? '다음 주 집중' : '다음 달 집중', r.reflectNext)}
          ${r.aiSummary ? `
            <details class="ref-ai">
              <summary>✦ AI 요약 보기</summary>
              <div class="ref-ai-body">${nl2br(r.aiSummary)}</div>
            </details>` : ''}
          ${r.memo && !r.reflectGood && !r.reflectBad && !r.reflectNext ? `
            <div class="ref-field">
              <div class="ref-field-label">📝 메모</div>
              <div class="ref-field-body">${nl2br(r.memo)}</div>
            </div>` : ''}
        </div>
      </article>`;
  }

  function renderFilter(counts) {
    const tabs = [
      { val: 'all',     label: '전체',  n: counts.all },
      { val: 'weekly',  label: '주간',  n: counts.weekly },
      { val: 'monthly', label: '월간',  n: counts.monthly },
    ];
    return `
      <div class="ref-filter">
        ${tabs.map(t => `
          <button class="ref-filter-btn ${filter === t.val ? 'active' : ''}"
            onclick="Reflect.setFilter('${t.val}')">
            ${t.label} <span class="ref-filter-count">${t.n}</span>
          </button>`).join('')}
      </div>`;
  }

  function render() {
    const all      = collect();
    const counts   = {
      all:     all.length,
      weekly:  all.filter(i => i.type === 'weekly').length,
      monthly: all.filter(i => i.type === 'monthly').length,
    };
    const visible  = filter === 'all' ? all : all.filter(i => i.type === filter);

    document.getElementById('app').innerHTML = `
      ${renderFilter(counts)}
      ${visible.length === 0
        ? `<div class="ref-empty">
             <div class="ref-empty-icon">✦</div>
             <div class="ref-empty-title">${all.length === 0 ? '아직 쌓인 회고가 없어요' : '이 분류엔 회고가 없어요'}</div>
             <div class="ref-empty-sub">
               <a href="weekly.html">주간 리뷰</a> · <a href="monthly.html">월간 리뷰</a>에서 작성하면 여기에 모여요
             </div>
           </div>`
        : `<div class="ref-list">${visible.map(renderCard).join('')}</div>`}
    `;
  }

  function setFilter(v) { filter = v; render(); }

  return { render, setFilter };
})();

document.addEventListener('DOMContentLoaded', () => Reflect.render());
