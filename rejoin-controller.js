(() => {
  function wireRejoin() {
    const reset = document.querySelector('#resetBtn');
    if (!reset || !state?.group?.invite_code) return;
    reset.textContent = 'Leave group';
    reset.onclick = () => {
      if (!confirm('Leave this group on this phone? You can rejoin with the same name and car.')) return;
      const code = state.group.invite_code;
      localStorage.removeItem('tdp-session');
      location.href = `${location.origin}${location.pathname}?invite=${encodeURIComponent(code)}`;
    };
  }

  const baseRender = render;
  render = function() {
    baseRender();
    wireRejoin();
  };

  if (state?.me) wireRejoin();
})();