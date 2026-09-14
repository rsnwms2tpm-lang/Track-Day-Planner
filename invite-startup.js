(() => {
  const SESSION_KEY = 'tdp-session';
  const BACKUP_KEY = 'tdp-persistent-session';

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }

  function validSession(value) {
    return !!(value && value.groupId && value.memberToken);
  }

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

  let invite = '';
  try {
    const params = new URLSearchParams(location.search);
    invite = (params.get('invite') || '').trim();
  } catch {}
  if (!invite) return;

  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
  const current = readSession();

  // Once the installed app has a valid member session, never throw it back
  // through the picker just because an old install/start URL still contains
  // the invite code. Strip the invite and keep the saved login.
  if (standalone && validSession(current)) {
    cleanInviteUrl();
    return;
  }

  // Browser invite links are used as the clean hand-off from Messenger/Safari.
  // Clear that browser's local credentials so the crew picker can reconnect the
  // person to the existing server-side profile.
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {}

  // After the picker reconnects successfully, clean the invite/tracking query
  // so normal refreshes use the newly saved session.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this !== localStorage || key !== SESSION_KEY) return;
    try {
      const parsed = JSON.parse(value);
      if (validSession(parsed)) cleanInviteUrl();
    } catch {}
  };
})();
