// Clear legacy private responses without touching login or local game records.
export async function retireLegacyMemberCache() {
  if (typeof caches === 'undefined') return;
  try { await caches.delete('supabase-cache'); } catch { /* Storage may be unavailable. */ }
}

export function startMemberCacheCleanup() {
  void retireLegacyMemberCache();
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      void retireLegacyMemberCache();
    });
  }
}
