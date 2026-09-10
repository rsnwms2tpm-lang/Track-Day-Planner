// DOM-level hotfix: guarantees three-way voting even if a legacy renderer repaints the cards.
(() => {
  const labels = { yes: 'Yes', maybe: 'Maybe', no: "Can’t do" };
  let patching = false;

  function currentVote(eventId) {
    return (state.votes || []).find(v => v.member_id === state.me?.id && v.event_id === eventId)?.status || '';
  }

  function patchVoteCards() {
    if (patching) return;
    patching = true;
    try {
      const root = document.querySelector('#voteList');
      if (!root) return;
      root.querySelectorAll('[data-vote]').forEach(oldBtn => {
        const eventId = oldBtn.dataset.vote;
        const row = oldBtn.closest('.vote-row') || oldBtn.parentElement;
        if (!row || !eventId) return;
        const mine = currentVote(eventId);
        row.innerHTML = `
          <button type="button" data-vote-status="yes" data-event-id="${eventId}" class="${mine === 'yes' ? 'selected' : ''}">Yes</button>
          <button type="button" data-vote-status="maybe" data-event-id="${eventId}" class="${mine === 'maybe' ? 'selected' : ''}">Maybe</button>
          <button type="button" data-vote-status="no" data-event-id="${eventId}" class="${mine === 'no' ? 'selected' : ''}">Can’t do</button>`;
        row.classList.add('vote-three');
      });
    } finally {
      patching = false;
    }
  }

  async function setVote(eventId, status, btn) {
    const all = btn.closest('.vote-row')?.querySelectorAll('button') || [];
    all.forEach(b => b.disabled = true);
    try {
      await api('vote', 'POST', { groupId: session.groupId, token: session.memberToken, eventId, status });
      await loadGroup();
      patchVoteCards();
    } catch (e) {
      alert('Could not update choice: ' + e.message);
      all.forEach(b => b.disabled = false);
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-vote-status]');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setVote(btn.dataset.eventId, btn.dataset.voteStatus, btn);
  }, true);

  function patchFinalChoiceButtons() {
    document.querySelectorAll('#confirmationList [data-pick-confirm], #confirmationList [data-v4-final], #confirmationList [data-final]').forEach(btn => {
      const id = btn.dataset.pickConfirm || btn.dataset.v4Final || btn.dataset.final;
      if (!id) return;
      btn.onclick = null;
      btn.dataset.toggleFinal = id;
      const selected = (typeof finalConfirmationChoice !== 'undefined' && finalConfirmationChoice === id);
      btn.textContent = selected ? 'Deselect final choice' : 'Select this track day';
    });
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-toggle-final]');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (typeof finalConfirmationChoice !== 'undefined') {
      finalConfirmationChoice = finalConfirmationChoice === btn.dataset.toggleFinal ? '' : btn.dataset.toggleFinal;
      if (typeof renderConfirmation === 'function') renderConfirmation();
      setTimeout(patchFinalChoiceButtons, 0);
    }
  }, true);

  const observer = new MutationObserver(() => {
    patchVoteCards();
    patchFinalChoiceButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  patchVoteCards();
  patchFinalChoiceButtons();
})();