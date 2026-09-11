(() => {
  function ensureChangeCarButton() {
    if (!state?.me || !session) return;
    let btn = document.querySelector('#changeCarBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'changeCarBtn';
      btn.className = 'ghost';
      btn.type = 'button';
      btn.style.marginLeft = '8px';
      const reset = document.querySelector('#resetBtn');
      if (reset?.parentElement) reset.parentElement.appendChild(btn);
    }
    btn.textContent = 'Change car';
    btn.onclick = async () => {
      const next = prompt('Change your car', state.me.car || '');
      if (next === null) return;
      const car = next.trim();
      if (!car) { alert('Please enter a car.'); return; }
      btn.disabled = true;
      try {
        await api('update-profile','POST',{groupId:session.groupId,token:session.memberToken,car});
        state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
        render();
      } catch (err) {
        alert('Could not change car: ' + (err?.message || err));
      } finally {
        btn.disabled = false;
      }
    };
  }

  const baseRender = render;
  render = function() {
    baseRender();
    ensureChangeCarButton();
  };

  if (state?.me) ensureChangeCarButton();
})();