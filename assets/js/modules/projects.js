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
    NLInput.show({
      heading: '기능 추가 — 한 줄로 입력하세요',
      placeholder: '예) 산책 기록 기능 디자인 GPS 경로 저장 및 공유',
      type: 'feature',
      onSave: ({ name, desc, category }) => {
        Store.push('features', {
          name,
          desc: desc || '',
          category: category || '기획',
          status: defaultStatus,
        });
        render();
        Toast.show('기능이 추가됐어요.', 'success');
      },
    });
  }

  return { render, deleteFeature, moveStatus, showAddModal };
})();

document.addEventListener('DOMContentLoaded', () => Projects.render());
