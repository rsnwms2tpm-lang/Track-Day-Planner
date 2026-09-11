(() => {
  const SESSION_KEY = 'tdp-session';
  const BACKUP_KEY = 'tdp-persistent-session';

  function valid(value) {
    return value && value.groupId && value.memberToken;
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
  }

  // Restore the normal session before app.js starts.
  const normal = read(SESSION_KEY);
  const backup = read(BACKUP_KEY);
  if (!valid(normal) && valid(backup)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(backup));
  }

  // Keep a second persistent copy whenever the app saves credentials.
  window.addEventListener('DOMContentLoaded', () => {
    const current = read(SESSION_KEY);
    if (valid(current)) localStorage.setItem(BACKUP_KEY, JSON.stringify(current));
  });

  // Catch credentials written after joining/creating a group.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === SESSION_KEY) {
      try {
        const parsed = JSON.parse(value);
        if (valid(parsed)) originalSetItem.call(localStorage, BACKUP_KEY, value);
      } catch {}
    }
  };
})();