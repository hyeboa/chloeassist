/**
 * help.js — 기능 가이드 (도움말 페이지)
 */

const Help = (() => {
  const GUIDES = {
    입력: [
      {
        title: 'AI 자연어 입력',
        desc: '마일스톤·목표 입력창에 자연어로 입력하면 AI가 자동으로 제목과 날짜를 파싱합니다.',
        example: '예: "베타 출시 6월 30일" → 제목: 베타 출시, 날짜: 2026-06-30'
      },
      {
        title: '빠른 항목 추가',
        desc: '마일스톤 아래의 세부 항목 추가 행에서 Enter로 빠르게 항목을 추가합니다.',
        example: '예: "스티치 러프시안" → 마일스톤에 할 일 추가'
      }
    ],
    조회: [
      {
        title: '마감 임박 배너',
        desc: '미완료 항목의 마감이 7일 이내면 상단에 색상별 경고 배너가 표시됩니다.',
        detail: '• 황색: 4~7일 남음\n• 주황색: 1~3일 남음\n• 빨강색: 마감 초과',
        action: '✕ 버튼으로 오늘 하루 숨길 수 있습니다.'
      },
      {
        title: 'D-day 계산',
        desc: '날짜가 있는 모든 항목에서 D-day가 자동으로 계산되어 시각적 우선순위를 표시합니다.',
        detail: '• D-Day: 오늘\n• D+: 마감 초과\n• D-3: 3일 남음'
      }
    ],
    추적: [
      {
        title: '마일스톤 연결',
        desc: '목표의 마일스톤 선택 드롭다운에서 마일스톤을 목표에 할당합니다.',
        detail: '목표의 세부 항목으로 함께 추적되며, 마일스톤 완료 시 자동으로 반영됩니다.'
      },
      {
        title: '진행도 추적',
        desc: '각 목표별로 완료된 항목 수에 따른 진행도 바가 표시됩니다.',
        detail: '세부 항목과 연결된 마일스톤이 함께 계산됩니다.'
      }
    ],
    데이터: [
      {
        title: '데이터 백업',
        desc: '설정(⚙) → 데이터 백업 → 내보내기로 모든 데이터를 JSON 파일로 다운로드합니다.',
        detail: '불러오기 버튼으로 이전 백업을 복원할 수 있습니다.'
      }
    ]
  };

  function renderGuide(section, guides) {
    return `
      <div class="help-section">
        <h2 class="help-section-title">${section}</h2>
        <div class="help-items">
          ${guides.map(g => `
            <div class="help-item">
              <div class="help-item-title">◆ ${g.title}</div>
              <div class="help-item-desc">${g.desc}</div>
              ${g.example ? `<div class="help-item-example">예시: ${g.example}</div>` : ''}
              ${g.detail ? `<div class="help-item-detail">${g.detail.split('\n').join('<br>')}</div>` : ''}
              ${g.action ? `<div class="help-item-action">→ ${g.action}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    const html = `
      <div class="help-page">
        <div class="help-intro">
          <p>헬로아지의 주요 기능과 사용 방법을 소개합니다.</p>
        </div>
        ${Object.entries(GUIDES).map(([section, guides]) => renderGuide(section, guides)).join('')}
      </div>`;

    app.innerHTML = html;
  }

  return { render };
})();

// 페이지 로드 시 렌더링
document.addEventListener('DOMContentLoaded', () => {
  if (location.pathname.split('/').pop() === 'help.html') {
    Help.render();
  }
});
