(() => {
  const SESSION_KEY = 'tdp-session';
  const BACKUP_KEY = 'tdp-persistent-session';
  const INVITE_KEY = 'tdp-last-invite';
  let recovering = false;

  function currentInvite() {
    try {
      return (new URLSearchParams(location.search).get('invite') || '').trim();
    } catch {
      return '';
    }
  }

  function rememberInvite() {
    const code = state?.group?.invite_code;
    if (code) localStorage.setItem(INVITE_KEY, code);
  }

  function showRecoveryMessage() {
    if (document.querySelector('#staleSessionRecovery')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'staleSessionRecovery';
    dialog.innerHTML = `
      <form method="dialog" style="max-width:420px">
        <span class="eyebrow">THIS BROWSER NEEDS RECONNECTING</span>
        <h2>Old login found</h2>
        <p class="muted">This browser has an old Track Day Heros login. Open the latest group invite link here, then choose your existing name to reconnect.</p>
        <button class="primary wide" value="close">Got it</button>
      </form>`;
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function recover() {
    if (recovering) return;
    recovering = true;

    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(BACKUP_KEY);
    session = null;

    const invite = currentInvite() || localStorage.getItem(INVITE_KEY) || '';
    if (invite) {
      const target = `${location.origin}${location.pathname}?invite=${encodeURIComponent(invite)}`;
      if (location.href !== target) {
        location.replace(target);
        return;
      }
      setTimeout(() => {
        recovering = false;
        onboarding();
      }, 0);
      return;
    }

    setTimeout(() => {
      recovering = false;
      showRecoveryMessage();
    }, 0);
  }

  const baseApi = api;
  api = async function(action, method = 'GET', body = null) {
    try {
      const result = await baseApi(action, method, body);
      if (action === 'group') rememberInvite();
      return result;
    } catch (error) {
      const message = String(error?.message || error || '');
      if (action === 'group' && /invalid group credentials/i.test(message)) {
        recover();
      }
      throw error;
    }
  };

  const baseRender = render;
  render = function() {
    baseRender();
    rememberInvite();
  };

  if (state?.group) rememberInvite();
})();