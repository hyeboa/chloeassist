/**
 * store.js — LocalStorage 기반 상태관리
 *
 * 사용법:
 *   Store.get('tasks')          → 배열/객체 반환 (없으면 null)
 *   Store.set('tasks', [...])   → 저장
 *   Store.push('tasks', item)   → 배열에 항목 추가
 *   Store.remove('tasks', id)   → id 일치 항목 제거
 *   Store.update('tasks', id, changes) → id 일치 항목 병합 업데이트
 */

const NAMESPACE = 'chloeassist';

const Store = (() => {
  const key = (name) => `${NAMESPACE}:${name}`;

  function get(name) {
    try {
      const raw = localStorage.getItem(key(name));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(name, value) {
    try {
      localStorage.setItem(key(name), JSON.stringify(value));
    } catch (e) {
      console.error('[Store] 저장 실패:', e);
    }
  }

  function push(name, item) {
    const list = get(name) || [];
    list.push({ ...item, id: item.id || crypto.randomUUID(), createdAt: item.createdAt || Date.now() });
    set(name, list);
    return list;
  }

  function remove(name, id) {
    const list = get(name) || [];
    const next = list.filter((i) => i.id !== id);
    set(name, next);
    return next;
  }

  function update(name, id, changes) {
    const list = get(name) || [];
    const next = list.map((i) => (i.id === id ? { ...i, ...changes, updatedAt: Date.now() } : i));
    set(name, next);
    return next;
  }

  function clear(name) {
    localStorage.removeItem(key(name));
  }

  return { get, set, push, remove, update, clear };
})();
