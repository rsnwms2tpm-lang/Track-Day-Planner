(() => {
  const style = document.createElement('style');
  style.textContent = `
    .tdh-search-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,12,16,.97);display:none;align-items:center;justify-content:center;padding:28px;text-align:center}
    .tdh-search-overlay.show{display:flex}
    .tdh-search-card{width:min(92vw,460px);background:#171b21;border:1px solid #303640;border-radius:26px;padding:34px 26px;box-shadow:0 20px 70px rgba(0,0,0,.45)}
    .tdh-search-spinner{width:58px;height:58px;margin:0 auto 24px;border:5px solid #2a313b;border-top-color:#f2f3f5;border-radius:50%;animation:tdhspin .8s linear infinite}
    @keyframes tdhspin{to{transform:rotate(360deg)}}
    .tdh-search-card h2{margin:0 0 10px;font-size:1.7rem}
    .tdh-search-card p{margin:0;color:#9da6b2;line-height:1.5}
    .tdh-search-providers{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:22px}
    .tdh-search-providers span{padding:8px 10px;border-radius:999px;background:#222832;color:#d7dce2;font-size:.85rem}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'tdh-search-overlay';
  overlay.innerHTML = `<div class="tdh-search-card"><div class="tdh-search-spinner"></div><h2>Searching track days… 🏁</h2><p>Checking the live calendars and matching them against your dates.</p><div class="tdh-search-providers"><span>Javelin</span><span>MSV Trackdays</span><span>OpenTrack</span><span>Gold Track</span></div></div>`;
  document.body.appendChild(overlay);

  const btn = document.querySelector('#findBtn');
  if (!btn) return;

  btn.onclick = async () => {
    const started = Date.now();
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    btn.disabled = true;
    try {
      if (typeof availabilityDirty !== 'undefined' && availabilityDirty) await flushAvailability();
      state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
      myAvailability = {};
      (state.availability || []).filter(a => a.member_id === state.me.id).forEach(a => myAvailability[String(a.date).slice(0,10)] = a.status);
      await loadEvents(true);
      const minimumDisplay = 1100;
      const remaining = minimumDisplay - (Date.now() - started);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
      render();
      stage('vote');
      renderVotes();
      renderTrip();
    } catch (e) {
      alert('Could not refresh choices: ' + (e?.message || e));
    } finally {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      btn.disabled = false;
    }
  };
})();
