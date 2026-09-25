/**
 * date.js — 브라우저의 현재 지역 시간을 기준으로 YYYY-MM-DD를 다루는 공통 유틸
 *
 * Date#toISOString()은 UTC 기준이라 한국 시간의 자정~오전 9시에 날짜가
 * 전날로 바뀔 수 있다. 화면과 저장 데이터의 날짜 키는 항상 지역 날짜를 쓴다.
 */

const LocalDate = (() => {
  const DAY_MS = 86400000;

  function fromKey(key) {
    if (key instanceof Date) return new Date(key);
    const match = String(key || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return new Date(key);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function toKey(value = new Date()) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function today() {
    return toKey(new Date());
  }

  function addDays(value, amount) {
    const date = fromKey(value);
    date.setDate(date.getDate() + amount);
    return toKey(date);
  }

  function startOfDay(value = new Date()) {
    const date = value instanceof Date ? new Date(value) : fromKey(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function diffDays(dateKey, base = new Date()) {
    return Math.round((fromKey(dateKey) - startOfDay(base)) / DAY_MS);
  }

  return { fromKey, toKey, today, addDays, startOfDay, diffDays };
})();
