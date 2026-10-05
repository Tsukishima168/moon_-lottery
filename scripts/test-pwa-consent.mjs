import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(fs.readFileSync('src/lib/pwaUpdates.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness() {
  const exports = {};
  let options, registrations = 0, reloads = 0, updates = 0;
  let update = async () => {};
  const timers = new Map();
  vm.runInNewContext(source, {
    exports, Error,
    require: () => ({ registerSW(next) { options = next; registrations++; return async () => { updates++; await update(); }; } }),
    window: { location: { reload() { reloads++; } } },
    setTimeout(fn) { const id = {}; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  exports.startPwaUpdateMonitor();
  return { api: exports, options, timers, rejectUpdate() { update = async () => { throw new Error('offline'); }; }, counts: () => ({ registrations, reloads, updates }) };
}
function worker(state) {
  const target = new EventTarget();
  target.state = state;
  target.change = state => { target.state = state; target.dispatchEvent(new Event('statechange')); };
  return target;
}
{
  const h = harness(); h.api.startPwaUpdateMonitor(); h.options.onNeedRefresh(); h.options.onNeedReload();
  assert.deepEqual(h.counts(), { registrations: 1, reloads: 0, updates: 0 });
  assert.equal(h.api.getPwaUpdateState(), 'available');
}
for (const state of ['installed', 'installing', 'activating']) {
  const h = harness(), w = worker(state);
  h.options.onRegisteredSW('/sw.js', { [state === 'installed' ? 'waiting' : state === 'installing' ? 'installing' : 'active']: w });
  const pending = h.api.acceptPwaUpdate(); await h.api.acceptPwaUpdate();
  assert.equal(h.counts().reloads, 0);
  if (state === 'installing') { assert.equal(h.counts().updates, 0); w.change('installed'); }
  assert.equal(h.counts().updates, state === 'activating' ? 0 : 1);
  w.change('activated'); await pending;
  assert.equal(h.counts().reloads, 1); assert.equal(h.timers.size, 0);
}
{
  const h = harness(); h.options.onRegisteredSW('/sw.js', { active: worker('activated') }); h.options.onNeedReload();
  assert.equal(h.counts().reloads, 0); await h.api.acceptPwaUpdate(); assert.equal(h.counts().reloads, 1);
}
{
  const h = harness(), w = worker('installed'); h.options.onRegisteredSW('/sw.js', { waiting: w });
  const pending = h.api.acceptPwaUpdate(); for (const fn of h.timers.values()) fn(); await pending;
  assert.equal(h.api.getPwaUpdateState(), 'failed'); w.change('activated'); h.options.onNeedReload();
  assert.equal(h.counts().reloads, 0);
}
{
  const h = harness(); h.rejectUpdate(); h.options.onRegisteredSW('/sw.js', { waiting: worker('installed') });
  await h.api.acceptPwaUpdate(); assert.equal(h.api.getPwaUpdateState(), 'failed'); assert.equal(h.counts().reloads, 0);
}
{
  const h = harness(); h.options.onRegisteredSW('/sw.js', { waiting: worker('redundant') });
  await h.api.acceptPwaUpdate(); assert.equal(h.api.getPwaUpdateState(), 'failed');
  h.options.onRegisteredSW('/sw.js', { active: worker('activated') }); await h.api.acceptPwaUpdate();
  assert.equal(h.counts().reloads, 1);
}
{
  const h = harness(); await h.api.acceptPwaUpdate();
  assert.equal(h.api.getPwaUpdateState(), 'failed'); assert.equal(h.counts().reloads, 0);
}
const cleanupSource = ts.transpileModule(fs.readFileSync('src/lib/memberCache.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
{
  const exports = {}, deleted = []; let changed;
  vm.runInNewContext(cleanupSource, { exports, caches: { delete: async name => { deleted.push(name); } }, navigator: { serviceWorker: { addEventListener: (_, fn) => { changed = fn; } } } });
  exports.startMemberCacheCleanup(); await Promise.resolve(); changed(); await Promise.resolve();
  assert.deepEqual(deleted, ['supabase-cache', 'supabase-cache']);
}
{
  const exports = {};
  vm.runInNewContext(cleanupSource, { exports, caches: { delete: async () => { throw new Error('blocked'); } } });
  await exports.retireLegacyMemberCache();
  const unavailable = {}; vm.runInNewContext(cleanupSource, { exports: unavailable }); await unavailable.retireLegacyMemberCache();
}
{
  let activate, pending; const deleted = [];
  vm.runInNewContext(fs.readFileSync('public/pwa-retire-member-cache.js', 'utf8'), {
    self: { addEventListener: (event, fn) => { assert.equal(event, 'activate'); activate = fn; } },
    caches: { delete: async name => { deleted.push(name); } },
  });
  activate({ waitUntil(value) { pending = value; } }); await pending;
  assert.deepEqual(deleted, ['supabase-cache']);
}
console.log('PWA consent: 9 controller and 4 legacy-cache scenarios passed; no browser data or network accessed.');
