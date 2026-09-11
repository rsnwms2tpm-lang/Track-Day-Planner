(() => {
  let applying = false;

  const finalVoteRows = () => state.finalVotes || [];

  function favouriteRows() {
    const members = state.members || [];
    const votes = state.votes || [];
    const ids = [...new Set(votes.filter(v => ['yes','maybe'].includes(v.status)).map(v => v.event_id))];
    return ids.map(id => {
      const rows = votes.filter(v => v.event_id === id);
      return {
        id,
        yes: rows.filter(v => v.status === 'yes').length,
        maybe: rows.filter(v => v.status === 'maybe').length,
        no: rows.filter(v => v.status === 'no').length,
        answered: new Set(rows.map(v => v.member_id)).size
      };
    }).filter(x => members.length > 0 && x.answered === members.length && x.no === 0);
  }

  function renderFinalVote() {
    if (applying) return;
    const host = document.querySelector('#confirmationList');
    const btn = document.querySelector('#finalConfirmBtn');
    if (!host || !btn || !state?.me) return;

    const members = state.members || [];
    const favs = favouriteRows();

    // One or zero favourites uses the normal direct-confirm flow.
    if (favs.length < 2) {
      document.querySelector('#finalVotePanel')?.remove();
      return;
    }

    applying = true;
    try {
      document.querySelector('#finalVotePanel')?.remove();

      const name = id => members.find(m => m.id === id)?.name || 'Unknown';
      const eventsById = new Map((events || []).map(e => [e.id, e]));
      const validIds = new Set(favs.map(f => f.id));
      const final = finalVoteRows().filter(v => validIds.has(v.event_id));
      const mine = final.find(v => v.member_id === state.me.id)?.event_id || '';
      const counts = {};
      final.forEach(v => counts[v.event_id] = (counts[v.event_id] || 0) + 1);
      const max = Math.max(0, ...favs.map(f => counts[f.id] || 0));
      const leaders = favs.filter(f => (counts[f.id] || 0) === max && max > 0);
      const voters = new Set(final.map(v => v.member_id));
      const everyone = members.length > 0 && voters.size === members.length;
      const winner = everyone && leaders.length === 1 ? leaders[0].id : '';
      const tied = everyone && leaders.length > 1;
      const availabilityFor = (memberId,date) => (state.availability || []).find(a => a.member_id === memberId && String(a.date).slice(0,10) === date)?.status || '';
      const availabilityLabel = status => status === 'yes' ? 'Available' : status === 'maybe' ? 'Maybe' : 'Not marked';

      const section = document.createElement('div');
      section.id = 'finalVotePanel';
      section.innerHTML = `<div style="margin:30px 0 10px"><span class="eyebrow">FINAL VOTE</span><h2>Choose the one you want</h2><p class="muted">Everyone gets one vote from the Group Favourites. You can change yours until everybody has voted.</p></div>${favs.map(f => {
        const e = eventsById.get(f.id);
        const votersFor = final.filter(v => v.event_id === f.id).map(v => name(v.member_id));
        const track = e?.track || f.id.replace(/^Javelin-\d{4}-\d{2}-\d{2}-/i,'').replace(/-/g,' ');
        const eventDate = e?.date || '';
        const date = eventDate ? new Date(eventDate + 'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : '';
        const price = e?.price != null ? ' · £' + e.price : '';
        const myAvailability = eventDate ? availabilityFor(state.me.id,eventDate) : '';
        const availabilityRows = eventDate ? members.map(m => `${m.name}: ${availabilityLabel(availabilityFor(m.id,eventDate))}`).join(' · ') : '';
        return `<article class="card"><h3>${track}</h3><div class="meta">${date}${price}</div><p style="margin:12px 0 4px"><strong>Your availability:</strong> ${availabilityLabel(myAvailability)}</p>${availabilityRows ? `<p class="muted" style="margin-top:0">Crew availability · ${availabilityRows}</p>` : ''}<div class="vote-row"><button type="button" data-final-vote="${f.id}" class="${mine === f.id ? 'selected' : ''}">${mine === f.id ? 'Your final vote ✓' : 'Vote for this'}</button></div><p><strong>Final votes (${counts[f.id] || 0})</strong> · ${votersFor.length ? votersFor.join(', ') : 'Nobody yet'}</p></article>`;
      }).join('')}<div class="card"><span class="eyebrow">FINAL VOTE STATUS</span><h3>${voters.size}/${members.length} voted</h3><p class="muted">${!everyone ? 'Waiting for ' + members.filter(m => !voters.has(m.id)).map(m => m.name).join(', ') : tied ? 'Tied — change votes or agree which option wins.' : winner ? 'Winner: ' + (eventsById.get(winner)?.track || 'Selected track day') : ''}</p></div>`;

      host.prepend(section);

      // When there are multiple favourites, the democratic final vote replaces
      // the old direct "Select as our track day" controls.
      host.querySelectorAll('[data-final-choice]').forEach(b => b.closest('.vote-row')?.remove());

      section.querySelectorAll('[data-final-vote]').forEach(b => b.onclick = async () => {
        b.disabled = true;
        try {
          await api('final-vote','POST',{groupId:session.groupId,token:session.memberToken,eventId:b.dataset.finalVote});
          state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
          renderFinalVote();
        } catch (e) {
          alert('Could not save final vote: ' + e.message);
          b.disabled = false;
        }
      });

      btn.disabled = !winner;
      btn.textContent = winner ? `Confirm ${eventsById.get(winner)?.track || 'winning track day'} →` : tied ? 'Final vote tied' : 'Waiting for final votes';
      btn.onclick = winner ? async () => {
        btn.disabled = true;
        try {
          await api('confirm','POST',{groupId:session.groupId,token:session.memberToken,eventId:winner});
          state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
          renderTrip();
          progress();
          stage('trip');
        } catch (e) {
          alert('Could not confirm winner: ' + e.message);
          renderFinalVote();
        }
      } : null;
    } finally {
      applying = false;
    }
  }

  // vote-controller-v6 keeps its confirmation renderer private inside an IIFE,
  // so hook the public stage/render flow and watch the confirmation DOM instead.
  const baseStage = stage;
  stage = function(id) {
    baseStage(id);
    if (id === 'confirm') setTimeout(renderFinalVote, 0);
  };

  const baseRender = render;
  render = function() {
    baseRender();
    setTimeout(renderFinalVote, 0);
  };

  const host = document.querySelector('#confirmationList');
  if (host) {
    new MutationObserver(() => {
      if (!applying && !document.querySelector('#finalVotePanel') && favouriteRows().length >= 2) {
        queueMicrotask(renderFinalVote);
      }
    }).observe(host,{childList:true,subtree:true});
  }

  setTimeout(renderFinalVote, 0);
})();