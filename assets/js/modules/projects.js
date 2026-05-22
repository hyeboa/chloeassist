/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중', '완료'];
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];

  function getFeatures() {
    return Store.get('features') || [];
  }

  function deleteFeature(id) {
    Store.remove('features', id);
    render();
  }

  function moveStatus(id, newStatus) {
    Store.update('features', id, {
      status: newStatus,
      doneAt: newStatus === '완료' ? Date.now() : null,
    });
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderCard(f) {
    const catClass = f.category || '';
    const nextStatus = STATUSES[STATUSES.indexOf(f.status) + 1];
    const prevStatus = STATUSES[STATUSES.indexOf(f.status) - 1];

    return `
      <div class="feature-card">
        <div class="feature-card-name">${escapeHtml(f.name)}</div>
        ${f.desc ? `<div class="feature-card-desc">${escapeHtml(f.desc)}</div>` : ''}
        <div class="feature-card-footer">
          <span class="feature-card-cat cat-badge ${catClass}">${f.category || ''}</span>
          <div class="feature-card-actions">
            ${prevStatus ? `<button class="feature-action-btn" onclick="Projects.moveStatus('${f.id}','${prevStatus}')">◀ ${prevStatus}</button>` : ''}
            ${nextStatus ? `<button class="feature-action-btn" onclick="Projects.moveStatus('${f.id}','${nextStatus}')" style="color:var(--color-primary)">${nextStatus} ▶</button>` : ''}
            <button class="feature-action-btn del" onclick="Projects.deleteFeature('${f.id}')">✕</button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const features = getFeatures();
    const total    = features.length;

    document.getElementById('app').innerHTML = `
      <div class="inline-nl-wrap">
        <input id="feat-input" class="inline-nl-input" type="text"
          placeholder="산책 기록 기능 디자인 GPS 경로 저장 및 공유...">
        <div class="inline-nl-footer">
          <span class="nl-rule-chip">기능명</span>
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">필수 · 분야·설명은 선택 · Enter로 추가</span>
        </div>
        <div class="inline-nl-status" id="feat-status"></div>
      </div>

      <div class="kanban-board">
        ${STATUSES.map(status => {
          const cols = features.filter(f => f.status === status);
          return `
            <div class="kanban-col" data-status="${status}">
              <div class="kanban-col-header">
                <span class="kanban-col-title">${status}</span>
                <span class="kanban-count">${cols.length}</span>
              </div>
              ${cols.map(f => renderCard(f)).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;

    bindFeatInput();
  }

  function bindFeatInput() {
    const input  = document.getElementById('feat-input');
    const status = document.getElementById('feat-status');
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const text = input.value.trim();
      if (!text) return;

      if (!AI.getApiKey()) {
        Toast.show('설정(⚙)에서 API 키를 먼저 입력해 주세요.', 'warning');
        return;
      }

      input.disabled = true;
      status.textContent = '✦ AI가 분석 중...';
      status.className = 'inline-nl-status';

      try {
        const result = await NLInput.parse('feature', text);
        Store.push('features', {
          name: result.name,
          desc: result.desc || '',
          category: result.category || '기획',
          status: '아이디어',
        });
        input.value = '';
        status.textContent = '';
        render();
      } catch (err) {
        status.textContent = '⚠ ' + err.message;
        status.className = 'inline-nl-status error';
        input.disabled = false;
        input.focus();
      }
    });
  }

  return { render, deleteFeature, moveStatus };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
