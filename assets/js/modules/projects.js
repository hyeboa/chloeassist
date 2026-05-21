/**
 * projects.js — 헬로아지 기능 보드 (칸반)
 * 상태: 아이디어 → 기획중 → 디자인중 → 개발중 → 완료
 */

const Projects = (() => {
  const STATUSES = ['아이디어', '기획중', '디자인중', '개발중'];
  const CATS = ['기획', '디자인', '개발', '마케팅', '운영'];

  function getFeatures() {
    return Store.get('features') || [];
  }

  function deleteFeature(id) {
    Store.remove('features', id);
    render();
  }

  function moveStatus(id, newStatus) {
    Store.update('features', id, { status: newStatus });
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
      <div class="features-toolbar">
        <div style="font-size:0.82rem;color:var(--color-text-3)">헬로아지 기능 ${total}개 트래킹 중</div>
        <button class="btn btn-primary" onclick="Projects.showAddModal()">+ 기능 추가</button>
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
              <button class="kanban-add-btn" onclick="Projects.showAddModal('${status}')">+ 추가</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function showAddModal(defaultStatus = '아이디어') {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:28px;width:400px;box-shadow:var(--shadow-lg)">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:20px">기능 추가</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">기능명 *</label>
            <input id="m-name" type="text" placeholder="예: 반려견 프로필 등록"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div>
            <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">설명</label>
            <input id="m-desc" type="text" placeholder="간략한 설명"
              style="width:100%;padding:9px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.9rem;outline:none">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">카테고리</label>
              <select id="m-cat" style="width:100%;padding:9px 10px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.87rem;outline:none;background:var(--color-surface)">
                ${CATS.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem;color:var(--color-text-2);display:block;margin-bottom:5px">상태</label>
              <select id="m-status" style="width:100%;padding:9px 10px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:0.87rem;outline:none;background:var(--color-surface)">
                ${STATUSES.map(s => `<option value="${s}" ${s===defaultStatus?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:22px">
          <button id="m-cancel" class="btn btn-ghost">취소</button>
          <button id="m-save" class="btn btn-primary">추가</button>
        </div>
      </div>
    `;

    overlay.querySelector('#m-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#m-save').addEventListener('click', () => {
      const name = overlay.querySelector('#m-name').value.trim();
      if (!name) { Toast.show('기능명을 입력해 주세요.', 'warning'); return; }
      Store.push('features', {
        name,
        desc: overlay.querySelector('#m-desc').value.trim(),
        category: overlay.querySelector('#m-cat').value,
        status: overlay.querySelector('#m-status').value,
      });
      render();
      Toast.show('기능이 추가됐어요.', 'success');
      overlay.remove();
    });

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    overlay.querySelector('#m-name').focus();
  }

  return { render, deleteFeature, moveStatus, showAddModal };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
