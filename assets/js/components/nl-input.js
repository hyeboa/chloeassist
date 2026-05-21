/**
 * nl-input.js — 자연어 입력 → AI 파싱 공용 컴포넌트
 *
 * 사용:
 *   NLInput.show({
 *     heading: '마일스톤 추가',
 *     placeholder: '베타 출시 6월 30일 유저 100명 테스트',
 *     type: 'milestone' | 'feature' | 'task',
 *     onSave: (parsed) => { ... }
 *   });
 */

const NLInput = (() => {
  const RULES = {
    milestone: { required: ['이름', '날짜'], hint: '필수 · 나머지는 메모로 저장' },
    feature:   { required: ['기능명'],       hint: '필수 · 분야·설명은 선택' },
    task:      { required: ['할 일'],        hint: '필수 · 날짜·분야는 선택' },
  };

  const PROMPTS = {
    milestone: (text, today) => `
오늘 날짜: ${today}.
아래 텍스트에서 마일스톤 정보를 추출해 JSON만 반환하세요. 설명 없이 JSON만.

규칙:
- title: 마일스톤 이름 (필수)
- date: YYYY-MM-DD 형식 (필수. "6월 말"→해당 월 말일, "3주 후"→오늘+21일 등 자연어 변환)
- desc: 나머지 내용 (선택, 없으면 "")
- title 또는 date를 찾을 수 없으면 {"error": "안내 메시지"} 반환

텍스트: "${text}"
`.trim(),

    feature: (text) => `
아래 텍스트에서 앱 기능 정보를 추출해 JSON만 반환하세요. 설명 없이 JSON만.

규칙:
- name: 기능명 (필수)
- desc: 설명 (선택, 없으면 "")
- category: 기획 / 디자인 / 개발 / 마케팅 / 운영 중 하나 (불명확하면 "기획")
- name을 찾을 수 없으면 {"error": "안내 메시지"} 반환

텍스트: "${text}"
`.trim(),

    task: (text, today) => `
오늘 날짜: ${today}.
아래 텍스트에서 할 일 정보를 추출해 JSON만 반환하세요. 설명 없이 JSON만.

규칙:
- title: 할 일 이름 (필수)
- date: YYYY-MM-DD 형식 (없으면 null. 자연어 날짜 변환)
- category: 기획 / 디자인 / 개발 / 마케팅 / 운영 중 하나 (불명확하면 "기획")
- title을 찾을 수 없으면 {"error": "안내 메시지"} 반환

텍스트: "${text}"
`.trim(),
  };

  async function parse(type, text) {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = PROMPTS[type](text, today);

    const raw = await AI.chat(
      [{ role: 'user', content: prompt }],
      '',
      'claude-haiku-4-5-20251001'
    );

    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const json = JSON.parse(cleaned);
    if (json.error) throw new Error(json.error);
    return json;
  }

  function show({ heading, placeholder, type, onSave }) {
    const rules = RULES[type];

    const overlay = document.createElement('div');
    overlay.className = 'nl-overlay';
    overlay.innerHTML = `
      <div class="nl-box">
        <div class="nl-heading">${heading}</div>
        <textarea class="nl-textarea" id="nl-textarea" rows="2"
          placeholder="${placeholder}"></textarea>
        <div class="nl-rules">
          ${rules.required.map(r => `<span class="nl-rule-chip">${r}</span>`).join('')}
          <span class="nl-rule-sep">·</span>
          <span class="nl-rule-hint">${rules.hint}</span>
        </div>
        <div class="nl-status" id="nl-status"></div>
        <div class="nl-actions">
          <button class="btn btn-ghost" id="nl-cancel">취소</button>
          <button class="btn btn-primary" id="nl-submit">추가</button>
        </div>
      </div>
    `;

    const textarea   = overlay.querySelector('#nl-textarea');
    const submitBtn  = overlay.querySelector('#nl-submit');
    const statusEl   = overlay.querySelector('#nl-status');
    const cancelBtn  = overlay.querySelector('#nl-cancel');

    async function submit() {
      const text = textarea.value.trim();
      if (!text) return;

      if (!AI.getApiKey()) {
        Toast.show('설정(⚙)에서 Claude API 키를 먼저 입력해 주세요.', 'warning');
        return;
      }

      statusEl.innerHTML = '<div class="nl-loading">✦ AI가 분석 중...</div>';
      submitBtn.disabled = true;
      cancelBtn.disabled = true;

      try {
        const result = await parse(type, text);
        overlay.remove();
        onSave(result);
      } catch (err) {
        statusEl.innerHTML = `<div class="nl-error">⚠ ${err.message}</div>`;
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
        textarea.focus();
      }
    }

    cancelBtn.addEventListener('click', () => overlay.remove());
    submitBtn.addEventListener('click', submit);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      if (e.key === 'Escape') overlay.remove();
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);
    textarea.focus();
  }

  return { show, parse };
})();
