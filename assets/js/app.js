/**
 * app.js — 공통 초기화
 * 모든 HTML 페이지의 마지막 <script>로 로드
 */

document.addEventListener('DOMContentLoaded', () => {
  Nav.render();
  Assistant.render();
});
