(() => {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('fresh') !== '1') return;
    localStorage.removeItem('tdp-session');
    localStorage.removeItem('tdp-persistent-session');
    sessionStorage.clear();
  } catch {}
})();