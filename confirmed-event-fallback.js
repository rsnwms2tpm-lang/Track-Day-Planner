(() => {
  const fallbackFromId = (id) => {
    const m = String(id || '').match(/^(.*)-(\d{4}-\d{2}-\d{2})-(.+)$/);
    if (!m) return null;
    const track = m[3].split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { id, provider: m[1], date: m[2], track };
  };

  let restoredId = '';
  const restore = () => {
    try {
      const id = state?.confirmedEventId;
      if (!id || !Array.isArray(events)) return;
      if (!events.some(e => e?.id === id)) {
        const fallback = fallbackFromId(id);
        if (!fallback) return;
        events.push(fallback);
      }
      if (restoredId !== id && state?.me) {
        restoredId = id;
        if (typeof window.render === 'function') window.render();
      }
    } catch (_) {}
  };

  window.addEventListener('focus', restore);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) restore(); });
  setInterval(restore, 500);
  restore();
})();