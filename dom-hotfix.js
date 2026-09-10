// DOM-level voting/confirmation fix. Loaded last.
(() => {
  let patching = false;
  let busy = false;

  function currentVote(eventId) {
    return (state.votes || []).find(v => v.member_id === state.me?.id && v.event_id === eventId)?.status || '';
  }

  async function refreshStateOnly() {
    state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability = {};
    (state.availability || []).filter(a => a.member_id === state.me.id).forEach(a => {
      myAvailability[String(a.date).slice(0,10)] = a.status;
    });
  }

  async function setVote(eventId, status, row) {
    if (busy) return;
    busy = true;
    const buttons = [...row.querySelectorAll('button')];
    buttons.forEach(b => b.disabled = true);
    try {
      await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,status});
      await refreshStateOnly();
      patchVoteCards();
      if (typeof renderConfirmation === 'function') renderConfirmation();
      patchFinalChoiceButtons();
    } catch (e) {
      alert('Could not update choice: ' + e.message);
    } finally {
      busy = false;
      buttons.forEach(b => b.disabled = false);
    }
  }

  function makeButton(label, status, eventId, selected, row) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.voteStatus = status;
    b.dataset.eventId = eventId;
    if (selected) b.classList.add('selected');
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setVote(eventId, status, row);
    });
    return b;
  }

  function patchVoteCards() {
    if (patching) return;
    patching = true;
    try {
      const root = document.querySelector('#voteList');
      if (!root) return;

      // Replace every legacy/new vote control with one canonical 3-button control.
      const candidates = root.querySelectorAll('[data-vote], [data-three], [data-v4-choice], [data-vote-status]');
      const rows = new Set();
      candidates.forEach(btn => {
        const row = btn.closest('.vote-row');
        if (row) rows.add(row);
      });

      rows.forEach(row => {
        const any = row.querySelector('[data-event-id], [data-event], [data-vote]');
        const eventId = any?.dataset.eventId || any?.dataset.event || any?.dataset.vote;
        if (!eventId) return;
        const mine = currentVote(eventId);
        row.replaceChildren();
        row.classList.add('vote-three');
        row.append(
          makeButton('Yes','yes',eventId,mine === 'yes',row),
          makeButton('Maybe','maybe',eventId,mine === 'maybe',row),
          makeButton("Can’t do",'no',eventId,mine === 'no',row)
        );
      });
    } finally {
      patching = false;
    }
  }

  function patchFinalChoiceButtons() {
    document.querySelectorAll('#confirmationList [data-pick-confirm], #confirmationList [data-v4-final], #confirmationList [data-final], #confirmationList [data-toggle-final]').forEach(btn => {
      const id = btn.dataset.pickConfirm || btn.dataset.v4Final || btn.dataset.final || btn.dataset.toggleFinal;
      if (!id || btn.dataset.finalBound === '1') return;
      btn.dataset.finalBound = '1';
      btn.onclick = null;
      const repaint = () => {
        const selected = typeof finalConfirmationChoice !== 'undefined' && finalConfirmationChoice === id;
        btn.textContent = selected ? 'Deselect final choice' : 'Select this track day';
        btn.classList.toggle('selected', selected);
      };
      repaint();
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof finalConfirmationChoice === 'undefined') return;
        finalConfirmationChoice = finalConfirmationChoice === id ? '' : id;
        if (typeof renderConfirmation === 'function') renderConfirmation();
        setTimeout(patchFinalChoiceButtons,0);
      });
    });
  }

  const observer = new MutationObserver(() => {
    patchVoteCards();
    patchFinalChoiceButtons();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click', e => {
    const tab = e.target.closest?.('[data-stage="vote"], [data-stage="confirm"]');
    if (!tab) return;
    setTimeout(() => { patchVoteCards(); patchFinalChoiceButtons(); }, 0);
  });

  patchVoteCards();
  patchFinalChoiceButtons();
})();