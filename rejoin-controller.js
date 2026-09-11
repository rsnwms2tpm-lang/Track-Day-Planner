(() => {
  function wireRejoin() {
    const reset = document.querySelector('#resetBtn');
    if (!reset || !state?.group?.invite_code || !session) return;
    reset.textContent = 'Leave group';
    reset.onclick = async () => {
      if (!confirm('Leave this group? This removes you and your responses from the group.')) return;
      const code = state.group.invite_code;
      reset.disabled = true;
      try {
        await api('leave-group','POST',{groupId:session.groupId,token:session.memberToken});
        localStorage.removeItem('tdp-session');
        localStorage.removeItem('tdp-persistent-session');
        session = null;
        location.href = `${location.origin}${location.pathname}?invite=${encodeURIComponent(code)}`;
      } catch (err) {
        reset.disabled = false;
        alert('Could not leave group: ' + (err?.message || err));
      }
    };
  }

  const baseRender = render;
  render = function() {
    baseRender();
    wireRejoin();
  };

  if (state?.me) wireRejoin();
})();