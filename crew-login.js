(() => {
  const params = new URLSearchParams(location.search);
  const inviteCode = (params.get('invite') || '').trim();
  if (!inviteCode) return;

  const API_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-api';
  let crew = [];
  let autoFilledCar = '';

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function findExact(name) {
    const key = String(name || '').trim().toLowerCase();
    return crew.find(member => String(member.name || '').trim().toLowerCase() === key) || null;
  }

  function enhance() {
    const dialog = document.querySelector('#onboard');
    const nameInput = document.querySelector('#yourName');
    const carInput = document.querySelector('#yourCar');
    const form = document.querySelector('#onboardForm');
    if (!dialog || !nameInput || !carInput || !form || dialog.dataset.crewLoginReady === '1') return false;

    dialog.dataset.crewLoginReady = '1';
    nameInput.autocomplete = 'off';

    const hint = document.createElement('p');
    hint.className = 'muted';
    hint.style.margin = '-4px 0 8px';
    hint.textContent = 'Already joined? Start typing and pick your name.';

    const matches = document.createElement('div');
    matches.id = 'crewLoginMatches';
    matches.style.display = 'none';
    matches.style.gap = '6px';
    matches.style.margin = '0 0 10px';

    const nameLabel = nameInput.closest('label');
    nameLabel?.insertAdjacentElement('afterend', hint);
    hint.insertAdjacentElement('afterend', matches);

    function renderMatches() {
      const query = nameInput.value.trim().toLowerCase();
      const visible = crew
        .filter(member => !query || String(member.name || '').toLowerCase().includes(query))
        .slice(0, 6);

      if (!visible.length) {
        matches.style.display = 'none';
        matches.innerHTML = '';
        return;
      }

      matches.innerHTML = visible.map(member => {
        const car = member.car ? `<span class="muted" style="display:block;font-size:.86em">${escapeHtml(member.car)}</span>` : '';
        return `<button type="button" data-crew-name="${escapeHtml(member.name)}" style="text-align:left;width:100%;padding:9px 10px">${escapeHtml(member.name)}${car}</button>`;
      }).join('');
      matches.style.display = 'grid';

      matches.querySelectorAll('[data-crew-name]').forEach(button => {
        button.addEventListener('click', () => {
          const member = findExact(button.dataset.crewName);
          if (!member) return;
          nameInput.value = member.name;
          if (member.car) {
            carInput.value = member.car;
            autoFilledCar = member.car;
          }
          matches.style.display = 'none';
          const submit = form.querySelector('button[type="submit"]');
          if (submit) submit.textContent = `Continue as ${member.name} →`;
        });
      });
    }

    nameInput.addEventListener('focus', renderMatches);
    nameInput.addEventListener('input', () => {
      const exact = findExact(nameInput.value);
      const submit = form.querySelector('button[type="submit"]');
      if (exact) {
        if (exact.car && (!carInput.value || carInput.value === autoFilledCar)) {
          carInput.value = exact.car;
          autoFilledCar = exact.car;
        }
        if (submit) submit.textContent = `Continue as ${exact.name} →`;
      } else {
        if (autoFilledCar && carInput.value === autoFilledCar) carInput.value = '';
        autoFilledCar = '';
        if (submit) submit.textContent = 'Join group →';
      }
      renderMatches();
    });

    carInput.addEventListener('input', () => { autoFilledCar = ''; });
    document.addEventListener('click', event => {
      if (!matches.contains(event.target) && event.target !== nameInput) matches.style.display = 'none';
    });

    fetch(`${API_BASE}?action=crew-members&inviteCode=${encodeURIComponent(inviteCode)}`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Crew lookup failed')))
      .then(data => {
        crew = Array.isArray(data.members) ? data.members : [];
        if (document.activeElement === nameInput) renderMatches();
      })
      .catch(error => console.error('Crew lookup unavailable', error));

    return true;
  }

  if (enhance()) return;
  const observer = new MutationObserver(() => {
    if (enhance()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();