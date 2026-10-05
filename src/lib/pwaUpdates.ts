import { registerSW } from 'virtual:pwa-register';

type UpdateState = 'idle' | 'available' | 'updating' | 'failed';
let state: UpdateState = 'idle';
let started = false;
let accepted = false;
let registration: ServiceWorkerRegistration | undefined;
let updateWorker: (() => Promise<void>) | undefined;
const listeners = new Set<() => void>();

function publish(next: UpdateState) {
  state = next;
  listeners.forEach(listener => listener());
}

export const getPwaUpdateState = () => state;
export function subscribePwaUpdates(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function startPwaUpdateMonitor() {
  if (started) return;
  started = true;
  updateWorker = registerSW({
    immediate: true,
    onRegisteredSW: (_url, nextRegistration) => { registration = nextRegistration; },
    onNeedRefresh: () => { if (!accepted) publish('available'); },
    // Another tab can activate a worker. Never reload this tab without consent.
    onNeedReload: () => {
      if (!accepted) publish('available');
    },
  });
}

export async function acceptPwaUpdate() {
  if (!updateWorker || state === 'updating') return;
  accepted = true;
  publish('updating');
  try {
    const target = registration?.waiting || registration?.installing || registration?.active;
    if (!target) throw new Error('UPDATE_UNAVAILABLE');
    await waitForActivation(target, updateWorker);
    window.location.reload();
  } catch {
    accepted = false;
    publish('failed');
  }
}

function waitForActivation(worker: ServiceWorker, activate: () => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let activationRequested = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.removeEventListener('statechange', check);
      if (error) reject(error); else resolve();
    };
    const check = () => {
      if (worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('UPDATE_REPLACED'));
      else if (worker.state === 'installed' && !activationRequested) {
        activationRequested = true;
        void activate().catch(error => finish(error instanceof Error ? error : new Error('UPDATE_FAILED')));
      }
    };
    const timeout = setTimeout(() => finish(new Error('UPDATE_TIMEOUT')), 15_000);
    worker.addEventListener('statechange', check);
    check();
  });
}
