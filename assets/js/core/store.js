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

  async function loadProjectTasks() { return get('projectTasks') || []; }
  async function pushProjectTask(item) { return push('projectTasks', item); }
  async function updateProjectTask(id, changes) { return update('projectTasks', id, changes); }
  async function removeProjectTask(id) { return remove('projectTasks', id); }

  async function loadTasks() { return get('tasks') || []; }
  async function pushTask(item) { return push('tasks', item); }
  async function updateTask(id, changes) { return update('tasks', id, changes); }
  async function removeTask(id) { return remove('tasks', id); }

  async function loadNotes() { return get('notes') || []; }
  async function pushNote(item) { return push('notes', item); }
  async function updateNote(id, changes) { return update('notes', id, changes); }
  async function removeNote(id) { return remove('notes', id); }

  async function loadGoals() { return get('goals') || []; }
  async function pushGoal(item) { return push('goals', item); }
  async function updateGoal(id, changes) { return update('goals', id, changes); }
  async function removeGoal(id) { return remove('goals', id); }

  async function loadMilestones() { return get('milestones') || []; }
  async function pushMilestone(item) { return push('milestones', item); }
  async function updateMilestone(id, changes) { return update('milestones', id, changes); }
  async function removeMilestone(id) { return remove('milestones', id); }

  async function loadFeatures() { return get('features') || []; }
  async function pushFeature(item) { return push('features', item); }
  async function updateFeature(id, changes) { return update('features', id, changes); }
  async function removeFeature(id) { return remove('features', id); }

  async function loadIssues() { return get('issues') || []; }
  async function pushIssue(item) { return push('issues', item); }
  async function updateIssue(id, changes) { return update('issues', id, changes); }
  async function removeIssue(id) { return remove('issues', id); }

  async function loadRoutines() { return get('routines') || []; }
  async function pushRoutine(item) { return push('routines', item); }
  async function removeRoutine(id) { return remove('routines', id); }

  function readLegacyRoutineLogs() {
    const logs = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`${NAMESPACE}:routine-log:`)) {
          const date = k.replace(`${NAMESPACE}:routine-log:`, '');
          try {
            logs[date] = JSON.parse(localStorage.getItem(k) || '{}');
          } catch {
            logs[date] = {};
          }
        }
      }
    } catch {
      return {};
    }
    return logs;
  }

  async function loadRoutineLogs() {
    const saved = get('routineLogs');
    if (saved) return saved;
    const legacy = readLegacyRoutineLogs();
    if (Object.keys(legacy).length > 0) {
      set('routineLogs', legacy);
      return legacy;
    }
    return {};
  }
  function getRoutineLog(date, fallback = {}) {
    const all = get('routineLogs') || {};
    return all[date] || fallback;
  }
  async function saveRoutineLog(date, log) {
    const all = get('routineLogs') || {};
    all[date] = log;
    set('routineLogs', all);
    return all;
  }
  async function deleteRoutineLog(date) {
    const all = get('routineLogs') || {};
    delete all[date];
    set('routineLogs', all);
    return all;
  }

  async function loadLaunchChecklists() { return get('launchChecklists') || []; }
  async function pushLaunchChecklist(item) { return push('launchChecklists', item); }
  async function updateLaunchChecklist(id, changes) { return update('launchChecklists', id, changes); }
  async function removeLaunchChecklist(id) { return remove('launchChecklists', id); }

  async function loadSitemapSections() { return get('sitemapSections') || []; }
  async function pushSitemapSection(item) { return push('sitemapSections', item); }
  async function updateSitemapSection(id, changes) { return update('sitemapSections', id, changes); }
  async function removeSitemapSection(id) { return remove('sitemapSections', id); }
  async function loadSitemapScreens() { return get('sitemapScreens') || []; }
  async function pushSitemapScreen(item) { return push('sitemapScreens', item); }
  async function updateSitemapScreen(id, changes) { return update('sitemapScreens', id, changes); }
  async function removeSitemapScreen(id) { return remove('sitemapScreens', id); }
  async function loadSitemapComponents() { return get('sitemapComponents') || []; }
  async function pushSitemapComponent(item) { return push('sitemapComponents', item); }
  async function updateSitemapComponent(id, changes) { return update('sitemapComponents', id, changes); }
  async function removeSitemapComponent(id) { return remove('sitemapComponents', id); }

  async function loadWeeklyReviews() { return get('weeklyReviews') || {}; }
  async function saveWeeklyReview(key, patch) {
    const all = get('weeklyReviews') || {};
    all[key] = { ...(all[key] || {}), ...patch };
    set('weeklyReviews', all);
    return all;
  }
  async function deleteWeeklyReview(key) {
    const all = get('weeklyReviews') || {};
    delete all[key];
    set('weeklyReviews', all);
    return all;
  }
  async function loadMonthlyReviews() { return get('monthlyReviews') || {}; }
  async function saveMonthlyReview(key, patch) {
    const all = get('monthlyReviews') || {};
    all[key] = { ...(all[key] || {}), ...patch };
    set('monthlyReviews', all);
    return all;
  }
  async function deleteMonthlyReview(key) {
    const all = get('monthlyReviews') || {};
    delete all[key];
    set('monthlyReviews', all);
    return all;
  }

  async function loadUiSettings() { return get('uiSettings') || {}; }
  function getUiSetting(key, fallback = null) {
    const all = get('uiSettings') || {};
    return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : fallback;
  }
  async function saveUiSetting(key, value) {
    const all = get('uiSettings') || {};
    all[key] = value;
    set('uiSettings', all);
    return all;
  }
  async function removeUiSetting(key) {
    const all = get('uiSettings') || {};
    delete all[key];
    set('uiSettings', all);
    return all;
  }

  return {
    get,
    set,
    push,
    remove,
    update,
    clear,
    loadProjectTasks,
    pushProjectTask,
    updateProjectTask,
    removeProjectTask,
    loadTasks,
    pushTask,
    updateTask,
    removeTask,
    loadNotes,
    pushNote,
    updateNote,
    removeNote,
    loadGoals,
    pushGoal,
    updateGoal,
    removeGoal,
    loadMilestones,
    pushMilestone,
    updateMilestone,
    removeMilestone,
    loadFeatures,
    pushFeature,
    updateFeature,
    removeFeature,
    loadIssues,
    pushIssue,
    updateIssue,
    removeIssue,
    loadRoutines,
    pushRoutine,
    removeRoutine,
    loadRoutineLogs,
    getRoutineLog,
    saveRoutineLog,
    deleteRoutineLog,
    loadLaunchChecklists,
    pushLaunchChecklist,
    updateLaunchChecklist,
    removeLaunchChecklist,
    loadSitemapSections,
    loadSitemapScreens,
    loadSitemapComponents,
    pushSitemapSection,
    updateSitemapSection,
    removeSitemapSection,
    pushSitemapScreen,
    updateSitemapScreen,
    removeSitemapScreen,
    pushSitemapComponent,
    updateSitemapComponent,
    removeSitemapComponent,
    loadWeeklyReviews,
    saveWeeklyReview,
    deleteWeeklyReview,
    loadMonthlyReviews,
    saveMonthlyReview,
    deleteMonthlyReview,
    loadUiSettings,
    getUiSetting,
    saveUiSetting,
    removeUiSetting,
  };
})();
