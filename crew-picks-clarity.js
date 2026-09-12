(() => {
  const baseRenderVotes = renderVotes;

  renderVotes = function() {
    baseRenderVotes();

    const list = document.querySelector('#voteList');
    if (!list || !state?.me) return;

    const crewSection = list.querySelector('.choice-section.crew');
    if (crewSection) {
      const copy = crewSection.querySelector('p.muted');
      if (copy) copy.textContent = 'The lads are interested in these too — let them know if you can make them, even if you didn’t mark the date.';
      return;
    }

    // If normal choice sections are visible but there are no extra crew picks yet,
    // keep the section visible so the feature is obvious during testing.
    if (!list.querySelector('.choice-section')) return;

    list.insertAdjacentHTML('beforeend', `
      <div class="choice-section crew">
        <span class="eyebrow">CREW PICKS</span>
        <p class="muted">Track days the lads are interested in outside your own dates will appear here. You can still answer Yes, Maybe or Can’t do.</p>
      </div>
      <div class="card">
        <p class="muted">No extra Crew Picks for you yet — they’ll appear automatically as the group responds.</p>
      </div>
    `);
  };

  if (state?.me) renderVotes();
})();