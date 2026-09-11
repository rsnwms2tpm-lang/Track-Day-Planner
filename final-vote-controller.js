(() => {
  let applying = false;

  const memberName = id => (state.members || []).find(m => m.id === id)?.name || 'Unknown';
  const eventForCard = card => {
    const track = card.querySelector('h3')?.textContent?.trim();
    const day = Number(card.querySelector('.datebox strong')?.textContent || 0);
    const label = card.querySelector('.datebox span')?.textContent?.trim() || '';
    return (events || []).find(e => {
      if (e.track !== track) return false;
      const d = new Date(e.date + 'T12:00:00');
      const expected = d.toLocaleString('en-GB',{month:'short'}).toUpperCase() + ' ' + d.getFullYear();
      return d.getDate() === day && expected === label;
    });
  };

  function summaryFor(e) {
    const votes = (state.votes || []).filter(v => v.event_id === e.id);
    const names = status => votes.filter(v => v.status === status).map(v => memberName(v.member_id));
    const yes = names('yes'), maybe = names('maybe'), no = names('no');
    const answered = new Set(votes.map(v => v.member_id));
    const waiting = (state.members || []).filter(m => !answered.has(m.id)).map(m => m.name);
    const date = new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const price = e.price != null ? `£${e.price}` : 'Price TBC';
    return `🏁 Track Day Heros — ${e.track}\n${date} · ${price}\n\n👍 Yes (${yes.length}): ${yes.join(', ') || 'Nobody'}\n🤔 Maybe (${maybe.length}): ${maybe.join(', ') || 'Nobody'}\n❌ Can’t do (${no.length}): ${no.join(', ') || 'Nobody'}${waiting.length ? `\n⏳ No response (${waiting.length}): ${waiting.join(', ')}` : ''}\n\nWhat do we reckon?`;
  }

  async function shareEvent(e, button) {
    const text = summaryFor(e);
    try {
      if (navigator.share) {
        await navigator.share({title:`${e.track} — Track Day Heros`,text});
        return;
      }
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = 'Copied — paste into group chat';
      setTimeout(() => button.textContent = old, 1800);
    } catch (err) {
      if (err?.name !== 'AbortError') alert('Could not share this choice: ' + err.message);
    }
  }

  async function confirmEvent(e, button) {
    const votes = (state.votes || []).filter(v => v.event_id === e.id);
    const no = votes.filter(v => v.status === 'no').map(v => memberName(v.member_id));
    const maybe = votes.filter(v => v.status === 'maybe').map(v => memberName(v.member_id));
    let warning = `Confirm ${e.track} as the group’s track day?`;
    if (maybe.length) warning += `\n\nMaybe: ${maybe.join(', ')}`;
    if (no.length) warning += `\nCan’t do: ${no.join(', ')}`;
    warning += '\n\nThis should be used after you’ve agreed it in the group chat.';
    if (!window.confirm(warning)) return;
    button.disabled = true;
    try {
      await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:e.id});
      state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
      renderTrip();
      progress();
      stage('trip');
    } catch (err) {
      alert('Could not confirm track day: ' + err.message);
      button.disabled = false;
    }
  }

  function enhanceDecision() {
    if (applying || !state?.me) return;
    const host = document.querySelector('#confirmationList');
    const bottom = document.querySelector('#finalConfirmBtn');
    if (!host) return;
    applying = true;
    try {
      document.querySelector('#finalVotePanel')?.remove();
      host.querySelectorAll('[data-final-choice]').forEach(b => b.closest('.vote-row')?.remove());
      host.querySelectorAll('.confirmation-choice').forEach(card => {
        if (card.querySelector('[data-discuss-actions]')) return;
        const e = eventForCard(card);
        if (!e) return;
        const target = card.children[1] || card;
        const actions = document.createElement('div');
        actions.dataset.discussActions = '1';
        actions.className = 'vote-row';
        actions.style.marginTop = '14px';
        actions.innerHTML = `<button type="button" data-share-choice>Share to group chat</button><button type="button" data-confirm-choice>Confirm this track day</button>`;
        target.appendChild(actions);
        actions.querySelector('[data-share-choice]').onclick = ev => shareEvent(e, ev.currentTarget);
        actions.querySelector('[data-confirm-choice]').onclick = ev => confirmEvent(e, ev.currentTarget);
      });
      if (bottom) {
        bottom.disabled = true;
        bottom.textContent = 'Discuss above, then confirm your choice';
        bottom.onclick = null;
      }
      const status = document.querySelector('#confirmationStatus');
      if (status && (state.votes || []).length) status.textContent = 'READY TO DISCUSS';
    } finally {
      applying = false;
    }
  }

  const baseStage = stage;
  stage = function(id) {
    baseStage(id);
    if (id === 'confirm') setTimeout(enhanceDecision, 0);
  };

  const baseRender = render;
  render = function() {
    baseRender();
    setTimeout(enhanceDecision, 0);
  };

  const host = document.querySelector('#confirmationList');
  if (host) new MutationObserver(() => {
    if (!applying) queueMicrotask(enhanceDecision);
  }).observe(host,{childList:true,subtree:true});

  setTimeout(enhanceDecision, 0);
})();