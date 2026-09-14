(() => {
  const SESSION_KEY = 'tdp-session';
  const BACKUP_KEY = 'tdp-persistent-session';

  let invite = '';
  try {
    const params = new URLSearchParams(location.search);
    invite = (params.get('invite') || '').trim();
  } catch {}
  if (!invite) return;

  // An invite link is an explicit request to enter this crew. Browser contexts
  // (Messenger, Safari, installed PWA) do not reliably share localStorage, so
  // never trust a session inherited by this particular browser when an invite
  // has been supplied. Clear browser-local credentials and let the existing
  // crew picker reconnect the member to the server-side profile.
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {}

  function cleanInviteUrl() {
    try {
      const url = new URL(location.href);
      url.searchParams.delete('invite');
      url.searchParams.delete('fbclid');
      for (const key of [...url.searchParams.keys()]) {
        if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
      }
      const query = url.searchParams.toString();
      history.replaceState(null, '', `${url.pathname}${query ? '?' + query : ''}${url.hash || ''}`);
    } catch {}
  }

  // Once the picker reconnects the member, remove the invite/tracking query.
  // This means ordinary refreshes afterwards use the newly saved browser
  // session and do not force the picker again.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this !== localStorage || key !== SESSION_KEY) return;
    try {
      const parsed = JSON.parse(value);
      if (parsed?.groupId && parsed?.memberToken) cleanInviteUrl();
    } catch {}
  };
})();