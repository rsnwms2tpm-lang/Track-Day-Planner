(() => {
  const EVENTS_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-events';
  const baseApi = api;

  api = async function(action, method = 'GET', body = null) {
    if (action !== 'events') return baseApi(action, method, body);

    const opts = { method: 'GET', cache: 'no-store', headers: {} };
    const r = await fetch(EVENTS_BASE, opts);
    let j = {};
    try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error(j.error || j.detail || `Request failed (${r.status})`);
    return j;
  };
})();
