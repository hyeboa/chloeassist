/**
 * store.js — file-backed state management
 *
 * Browser data stays mirrored in localStorage for fast reads, but the canonical
 * copy is persisted through the local server at /api/store.
 */

const NAMESPACE = 'chloeassist';
const STORE_API = '/api/store';

const STORE_KEYS = [
  'tasks',
  'notes',
  'goals',
  'milestones',
  'projectTasks',
  'features',
  'issues',
  'routines',
  'routineLogs',
  'launchChecklists',
  'sitemapSections',
  'sitemapScreens',
  'sitemapComponents',
  'weeklyReviews',
  'monthlyReviews',
  'uiSettings',
];

const STORE_DEFAULTS = {
  tasks: [],
  notes: [],
  goals: [],
  milestones: [],
  projectTasks: [],
  features: [],
  issues: [],
  routines: [],
  routineLogs: {},
  launchChecklists: [],
  sitemapSections: [],
  sitemapScreens: [],
  sitemapComponents: [],
  weeklyReviews: {},
  monthlyReviews: {},
  uiSettings: {},
};

const Store = (() => {
  const key = (name) => `${NAMESPACE}:${name}`;
  const state = {};
  let readyPromise = null;
  let persistChain = Promise.resolve();
  let readyResolved = false;
  let lastSyncError = null;

  function clone(value) {
    if (value == null) return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function defaultValue(name) {
    return clone(STORE_DEFAULTS[name]);
  }

  function normalizeValue(name, value) {
    if (value == null) return defaultValue(name);
    if (name.endsWith('Reviews') || name === 'routineLogs' || name === 'uiSettings') {
      return typeof value === 'object' && !Array.isArray(value) ? value : defaultValue(name);
    }
    return Array.isArray(value) ? value : defaultValue(name);
  }

  function readLocalValue(name) {
    try {
      const raw = localStorage.getItem(key(name));
      if (!raw) return defaultValue(name);
      return normalizeValue(name, JSON.parse(raw));
    } catch {
      return defaultValue(name);
    }
  }

  function writeLocalValue(name, value) {
    try {
      localStorage.setItem(key(name), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Store] localStorage save failed:', error);
      return false;
    }
  }

  function removeLocalValue(name) {
    try {
      localStorage.removeItem(key(name));
      return true;
    } catch (error) {
      console.error('[Store] localStorage remove failed:', error);
      return false;
    }
  }

  function readLocalSnapshot() {
    const snapshot = {};
    STORE_KEYS.forEach((name) => {
      snapshot[name] = readLocalValue(name);
    });
    return snapshot;
  }

  function applySnapshot(snapshot, { writeLocal = true } = {}) {
    STORE_KEYS.forEach((name) => {
      state[name] = normalizeValue(name, snapshot?.[name]);
      if (writeLocal) writeLocalValue(name, state[name]);
    });
  }

  function snapshotHasData(snapshot) {
    return STORE_KEYS.some((name) => {
      const value = snapshot?.[name];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      return value != null && value !== '';
    });
  }

  function buildPayload() {
    const data = {};
    STORE_KEYS.forEach((name) => {
      data[name] = clone(state[name] ?? defaultValue(name));
    });
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      data,
    };
  }

  function applyRemotePayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data
      : payload;
    applySnapshot(data, { writeLocal: true });
    return true;
  }

  async function loadRemoteSnapshot() {
    const res = await fetch(STORE_API, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`store-fetch-${res.status}`);
    }
    return res.json();
  }

  async function persistSnapshot() {
    lastSyncError = null;
    const payload = buildPayload();
    const res = await fetch(STORE_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `store-save-${res.status}`);
    }
    return true;
  }

  function schedulePersist() {
    persistChain = persistChain
      .then(() => persistSnapshot())
      .catch((error) => {
        lastSyncError = error;
        console.error('[Store] server sync failed:', error);
      });
    return persistChain;
  }

  async function bootstrap() {
    const localSnapshot = readLocalSnapshot();
    applySnapshot(localSnapshot, { writeLocal: false });

    try {
      const remote = await loadRemoteSnapshot();
      if (applyRemotePayload(remote)) {
        return true;
      }
    } catch (error) {
      console.warn('[Store] remote snapshot unavailable, using local cache:', error?.message || error);
    }

    if (snapshotHasData(localSnapshot)) {
      schedulePersist();
    } else {
      schedulePersist();
    }

    return true;
  }

  function ensureReady() {
    if (!readyPromise) {
      readyPromise = bootstrap().finally(() => {
        readyResolved = true;
      });
    }
    return readyPromise;
  }

  ensureReady();

  function get(name) {
    if (Object.prototype.hasOwnProperty.call(state, name)) {
      return state[name];
    }
    const value = readLocalValue(name);
    state[name] = value;
    return value;
  }

  function set(name, value) {
    const next = normalizeValue(name, value);
    state[name] = next;
    const localOk = writeLocalValue(name, next);
    if (readyResolved) schedulePersist();
    else ensureReady().then(() => schedulePersist());
    return localOk || true;
  }

  function push(name, item) {
    const list = Array.isArray(get(name)) ? [...get(name)] : [];
    list.push({ ...item, id: item.id || crypto.randomUUID(), createdAt: item.createdAt || Date.now() });
    set(name, list);
    return list;
  }

  function remove(name, id) {
    const list = Array.isArray(get(name)) ? [...get(name)] : [];
    const next = list.filter((i) => i.id !== id);
    set(name, next);
    return next;
  }

  function update(name, id, changes) {
    const list = Array.isArray(get(name)) ? [...get(name)] : [];
    const next = list.map((i) => (i.id === id ? { ...i, ...changes, updatedAt: Date.now() } : i));
    set(name, next);
    return next;
  }

  function clear(name) {
    state[name] = defaultValue(name);
    removeLocalValue(name);
    if (readyResolved) schedulePersist();
    else ensureReady().then(() => schedulePersist());
    return true;
  }

  async function flush() {
    await ensureReady();
    await persistChain;
    if (lastSyncError) throw lastSyncError;
    return true;
  }

  async function resetAll() {
    STORE_KEYS.forEach((name) => {
      state[name] = defaultValue(name);
      removeLocalValue(name);
    });
    await schedulePersist();
    await persistChain;
    return true;
  }

  async function loadProjectTasks() { await ensureReady(); return get('projectTasks') || []; }
  async function pushProjectTask(item) { return push('projectTasks', item); }
  async function updateProjectTask(id, changes) { return update('projectTasks', id, changes); }
  async function removeProjectTask(id) { return remove('projectTasks', id); }

  async function loadTasks() { await ensureReady(); return get('tasks') || []; }
  async function pushTask(item) { return push('tasks', item); }
  async function updateTask(id, changes) { return update('tasks', id, changes); }
  async function removeTask(id) { return remove('tasks', id); }

  async function loadNotes() { await ensureReady(); return get('notes') || []; }
  async function pushNote(item) { return push('notes', item); }
  async function updateNote(id, changes) { return update('notes', id, changes); }
  async function removeNote(id) { return remove('notes', id); }

  async function loadGoals() { await ensureReady(); return get('goals') || []; }
  async function pushGoal(item) { return push('goals', item); }
  async function updateGoal(id, changes) { return update('goals', id, changes); }
  async function removeGoal(id) { return remove('goals', id); }

  async function loadMilestones() { await ensureReady(); return get('milestones') || []; }
  async function pushMilestone(item) { return push('milestones', item); }
  async function updateMilestone(id, changes) { return update('milestones', id, changes); }
  async function removeMilestone(id) { return remove('milestones', id); }

  async function loadFeatures() { await ensureReady(); return get('features') || []; }
  async function pushFeature(item) { return push('features', item); }
  async function updateFeature(id, changes) { return update('features', id, changes); }
  async function removeFeature(id) { return remove('features', id); }

  async function loadIssues() { await ensureReady(); return get('issues') || []; }
  async function pushIssue(item) { return push('issues', item); }
  async function updateIssue(id, changes) { return update('issues', id, changes); }
  async function removeIssue(id) { return remove('issues', id); }

  async function loadRoutines() { await ensureReady(); return get('routines') || []; }
  async function pushRoutine(item) { return push('routines', item); }
  async function removeRoutine(id) { return remove('routines', id); }

  async function loadRoutineLogs() {
    await ensureReady();
    const saved = get('routineLogs');
    if (saved) return saved;
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

  async function loadLaunchChecklists() { await ensureReady(); return get('launchChecklists') || []; }
  async function pushLaunchChecklist(item) { return push('launchChecklists', item); }
  async function updateLaunchChecklist(id, changes) { return update('launchChecklists', id, changes); }
  async function removeLaunchChecklist(id) { return remove('launchChecklists', id); }

  async function loadSitemapSections() { await ensureReady(); return get('sitemapSections') || []; }
  async function pushSitemapSection(item) { return push('sitemapSections', item); }
  async function updateSitemapSection(id, changes) { return update('sitemapSections', id, changes); }
  async function removeSitemapSection(id) { return remove('sitemapSections', id); }
  async function loadSitemapScreens() { await ensureReady(); return get('sitemapScreens') || []; }
  async function pushSitemapScreen(item) { return push('sitemapScreens', item); }
  async function updateSitemapScreen(id, changes) { return update('sitemapScreens', id, changes); }
  async function removeSitemapScreen(id) { return remove('sitemapScreens', id); }
  async function loadSitemapComponents() { await ensureReady(); return get('sitemapComponents') || []; }
  async function pushSitemapComponent(item) { return push('sitemapComponents', item); }
  async function updateSitemapComponent(id, changes) { return update('sitemapComponents', id, changes); }
  async function removeSitemapComponent(id) { return remove('sitemapComponents', id); }

  async function loadWeeklyReviews() { await ensureReady(); return get('weeklyReviews') || {}; }
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
  async function loadMonthlyReviews() { await ensureReady(); return get('monthlyReviews') || {}; }
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

  async function loadUiSettings() { await ensureReady(); return get('uiSettings') || {}; }
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
    ready: ensureReady(),
    get,
    set,
    push,
    remove,
    update,
    clear,
    flush,
    resetAll,
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
