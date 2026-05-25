/**
 * banner.js — 마감 임박 알림 배너 (전 페이지 공통)
 */

const Banner = (() => {
  const DISMISS_PREFIX = 'chloeassist:banner-dismissed:';
  const WARN_DAYS = 7;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function diffDays(dateStr) {
    return Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  }

  function isDismissed(key) {
    return localStorage.getItem(DISMISS_PREFIX + key) === today();
  }

  function dismiss(key) {
    localStorage.setItem(DISMISS_PREFIX + key, today());
    const el = document.getElementById('deadline-banner-' + key.replace(/[^a-z0-9]/gi, '_'));
    if (el) el.remove();
    cleanEmptyContainer();
  }

  function cleanEmptyContainer() {
    const wrap = document.getElementById('deadline-banners');
    if (wrap && wrap.children.length === 0) wrap.remove();
  }

  function urgencyLabel(diff) {
    if (diff <= 0) return { text: 'D-Day', cls: 'banner-overdue' };
    if (diff <= 3) return { text: `D-${diff}`, cls: 'banner-critical' };
    return { text: `D-${diff}`, cls: 'banner-warn' };
  }

  function getItems() {
    const goals      = (Store.get('goals')      || []);
    const milestones = (Store.get('milestones') || []);
    const items = [];

    goals.forEach(g => {
      if (!g.targetDate) return;
      const { pct } = goalProgress(g);
      if (pct === 100) return;
      const diff = diffDays(g.targetDate);
      if (diff > WARN_DAYS) return;
      const key = 'goal-' + g.id;
      if (isDismissed(key)) return;
      items.push({ key, label: `목표: ${g.title}`, diff });
    });

    milestones.forEach(m => {
      if (!m.date || m.done) return;
      const diff = diffDays(m.date);
      if (diff > WARN_DAYS) return;
      const key = 'ms-' + m.id;
      if (isDismissed(key)) return;
      items.push({ key, label: `마일스톤: ${m.title}`, diff });
    });

    items.sort((a, b) => a.diff - b.diff);
    return items;
  }

  function goalProgress(goal) {
    const milestones = Store.get('milestones') || [];
    const items  = goal.items || [];
    const linked = milestones.filter(m => m.goalId === goal.id);
    const total  = items.length + linked.length;
    const done   = items.filter(i => i.done).length + linked.filter(m => m.done).length;
    return { pct: total ? Math.round(done / total * 100) : 0 };
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render() {
    const items = getItems();
    if (items.length === 0) return;

    const wrap = document.createElement('div');
    wrap.id = 'deadline-banners';

    items.forEach(({ key, label, diff }) => {
      const { text, cls } = urgencyLabel(diff);
      const safeId = key.replace(/[^a-z0-9]/gi, '_');
      const el = document.createElement('div');
      el.id = 'deadline-banner-' + safeId;
      el.className = `deadline-banner ${cls}`;
      el.innerHTML = `
        <span class="deadline-banner-dday">${escapeHtml(text)}</span>
        <span class="deadline-banner-label">${escapeHtml(label)}</span>
        <button class="deadline-banner-dismiss" data-key="${escapeHtml(key)}" title="오늘 하루 숨기기">✕</button>
      `;
      el.querySelector('.deadline-banner-dismiss').addEventListener('click', (e) => {
        dismiss(key);
      });
      wrap.appendChild(el);
    });

    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) mainWrapper.prepend(wrap);
  }

  return { render, dismiss };
})();
