/**
 * help.js — 기능 가이드 (도움말 페이지)
 */

const Help = (() => {
  const GUIDES = {
    '매일 5분': [
      {
        title: '오늘은 3개만 고르기',
        desc: '‘오늘’ 화면에는 오늘 끝낼 항목만 두고, 나머지는 ‘할 일 목록’에서 날짜별로 관리하세요.',
        example: '헬로아지 2개 + 개인 프로젝트 1개'
      },
      {
        title: '생각은 일단 수집하기',
        desc: '즉시 실행할 수 없는 생각은 ‘브레인 덤프’에 적고 프로젝트 태그만 달아두세요.',
        action: '실행할 수 있을 때 할 일로 변환하면 됩니다.'
      }
    ],
    '프로젝트': [
      {
        title: '헬로아지와 사이드 프로젝트 분리',
        desc: '‘내 프로젝트’에서 프로젝트 이름을 다르게 만들고, 각 항목에는 다음 행동과 마감일만 적으세요.',
        example: '헬로아지 / 콘텐츠 도구 / 개인 자동화'
      },
      {
        title: '항목은 ‘다음 행동’ 크기로',
        desc: '프로젝트에는 모호한 목표보다 한 번에 끝낼 수 있는 행동을 넣으세요.',
        example: '‘마케팅하기’보다 ‘인스타 게시물 초안 1개 쓰기’'
      }
    ],
    '헬로아지': [
      {
        title: '제품 정보는 전용 메뉴에',
        desc: '화면·사용자 흐름은 ‘제품 설계’, 배포 전 확인은 ‘출시 점검’, 버그나 운영 문제는 ‘이슈 관리’에 두세요.'
      },
      {
        title: '목표와 마일스톤은 적게',
        desc: '목표는 현재 분기의 큰 방향에만 쓰고, 마일스톤은 완료 여부를 판단할 수 있는 날짜 기준으로 만드세요.'
      }
    ],
    '돌아보기와 데이터': [
      {
        title: '금요일 10분 리뷰',
        desc: '‘주간 리뷰’에서 완료한 일과 다음 주 예정을 보고, 계속할 것·멈출 것·다음 한 가지만 적으세요.'
      },
      {
        title: '입력창으로 바로 이동',
        desc: '입력 중이 아닐 때 / 키를 누르면 현재 화면의 빠른 입력창으로 바로 이동합니다.'
      },
      {
        title: '항상 같은 로컬 주소 사용',
        desc: '데이터는 현재 브라우저와 접속 주소에만 저장됩니다. 127.0.0.1과 localhost를 섞어 쓰면 다른 작업 공간처럼 보일 수 있어요.',
        action: '항상 http://127.0.0.1:8000 주소로 접속하세요.'
      },
      {
        title: '주 1회 백업',
        desc: '설정(⚙) → 데이터 백업 → 내보내기로 JSON 파일을 받아두세요.',
        detail: '이 앱은 로컬 저장소를 사용하므로 브라우저 데이터를 지우면 내용이 사라질 수 있습니다.'
      }
    ]
  };

  function renderGuide(section, guides) {
    const itemsHtml = guides.map(g => `
      <div class="help-item">
        <div class="help-item-title">◆ ${g.title}</div>
        <div class="help-item-desc">${g.desc}</div>
        ${g.example ? `<div class="help-item-example">예시: ${g.example}</div>` : ''}
        ${g.detail ? `<div class="help-item-detail">${g.detail.split('\n').join('<br>')}</div>` : ''}
        ${g.action ? `<div class="help-item-action">→ ${g.action}</div>` : ''}
      </div>`).join('');

    return `
      <div class="help-section">
        <h2 class="help-section-title">${section}</h2>
        <div class="help-items">${itemsHtml}</div>
      </div>`;
  }

  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    const sectionsHtml = Object.entries(GUIDES)
      .map(([section, guides]) => renderGuide(section, guides))
      .join('');

    const html = `
      <div class="help-page">
        <div class="help-intro"><p>이 도구는 <strong>생각 수집 → 프로젝트 정리 → 오늘 실행 → 주간 리뷰</strong> 순서로 쓰면 가장 단순합니다.</p></div>
        ${sectionsHtml}
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
