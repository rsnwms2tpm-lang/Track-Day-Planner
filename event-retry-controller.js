(() => {
  let retrying = false;

  function showRetry(message = 'Live event search took too long.') {
    const el = document.querySelector('#voteList');
    if (!el || (events || []).length) return;
    el.innerHTML = `<div class="card"><h3>${message}</h3><p class="muted">Javelin did not answer in time. Your group data is safe.</p><button type="button" id="retryEventsBtn" class="primary wide">Retry live search</button></div>`;
    const btn = document.querySelector('#retryEventsBtn');
    if (btn) btn.onclick = async () => {
      if (retrying) return;
      retrying = true;
      btn.disabled = true;
      btn.textContent = 'Searching…';
      try {
        await loadEvents(true);
        renderMatches();
        renderVotes();
        renderTrip();
      } catch (e) {
        showRetry('Still can’t reach live events.');
      } finally {
        retrying = false;
      }
    };
  }

  setTimeout(() => {
    if (!(events || []).length) showRetry();
  }, 11000);

  const baseStage = stage;
  stage = function(id) {
    baseStage(id);
    if (id === 'vote' && !(events || []).length) {
      setTimeout(() => showRetry(), 11000);
    }
  };
})();