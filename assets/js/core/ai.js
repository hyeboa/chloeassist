/**
 * ai.js — Claude API 연동
 *
 * 설정: config.json에 apiKey 저장 또는 초기 설정 화면에서 입력
 */

const AI = (() => {
  const CONFIG_KEY = 'chloeassist:config';

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    } catch {
      return {};
    }
  }

  function setApiKey(key) {
    const cfg = getConfig();
    cfg.apiKey = key;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function getApiKey() {
    return getConfig().apiKey || '';
  }

  /**
   * Claude API에 메시지 전송 (스트리밍 없는 단순 호출)
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @returns {Promise<string>}
   */
  async function chat(messages, systemPrompt = '', model = 'claude-sonnet-4-6') {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

    const payload = {
      model,
      max_tokens: 1024,
      system: systemPrompt || '당신은 사용자의 전담 AI 비서 Chloe입니다. 업무 일정, 프로젝트, 아이디어 정리를 도와줍니다. 항상 한국어로 답변하세요.',
      messages,
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 오류 (${res.status})`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * 스트리밍 응답 (onChunk 콜백으로 토큰 수신)
   * @param {Array} messages
   * @param {string} systemPrompt
   * @param {function} onChunk - (text: string) => void
   * @param {function} onDone - () => void
   */
  async function chatStream(messages, systemPrompt = '', onChunk, onDone) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

    const payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt || '당신은 사용자의 전담 AI 비서 Chloe입니다. 업무 일정, 프로젝트, 아이디어 정리를 도와줍니다. 항상 한국어로 답변하세요.',
      messages,
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 오류 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const evt = JSON.parse(json);
          if (evt.type === 'content_block_delta' && evt.delta?.text) {
            onChunk(evt.delta.text);
          }
        } catch { /* 파싱 오류 무시 */ }
      }
    }

    if (onDone) onDone();
  }

  return { chat, chatStream, setApiKey, getApiKey };
})();
