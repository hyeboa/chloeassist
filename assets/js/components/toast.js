/**
 * toast.js — 알림 토스트
 * 사용: Toast.show('메시지', 'success' | 'error' | 'info')
 */

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  const COLORS = {
    success: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
    info:    { bg: '#ebe9ff', color: '#5348d4', border: '#c4b5fd' },
    warning: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  };

  function show(message, type = 'info', duration = 3000) {
    const c = getContainer();
    const { bg, color, border } = COLORS[type] || COLORS.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${bg};
      color: ${color};
      border: 1px solid ${border};
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      pointer-events: all;
      opacity: 0;
      transform: translateX(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      max-width: 320px;
      line-height: 1.4;
    `;
    toast.textContent = message;
    c.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(8px)';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  return { show };
})();
