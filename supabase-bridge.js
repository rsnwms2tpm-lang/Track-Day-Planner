(() => {
  const API_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-api';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    try {
      const raw = typeof input === 'string' ? input : input.url;
      if (raw.startsWith('/api?')) {
        return nativeFetch(API_BASE + raw.slice(4), init);
      }
      if (raw === '/vote-api' || raw.startsWith('/vote-api?')) {
        const suffix = raw.includes('?') ? '&' + raw.split('?')[1] : '';
        return nativeFetch(API_BASE + '?action=vote' + suffix, init);
      }
    } catch (e) {
      console.error('Supabase bridge error', e);
    }
    return nativeFetch(input, init);
  };
})();
