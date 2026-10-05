// Retire only the former member-response cache; keep image and app caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete('supabase-cache').catch(() => undefined));
});
