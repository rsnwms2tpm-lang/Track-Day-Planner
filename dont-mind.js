(() => {
  const key = () => `tdp-dont-mind:${state?.group?.id || session?.groupId || 'group'}:${state?.me?.id || session?.memberId || 'member'}`;
  const datesKey = () => `${key()}:saved-dates`;
  const active = () => {
    try { return localStorage.getItem(key()) === '1'; } catch { return false; }
  };
  const setActive = value => {
    try { localStorage.setItem(key(), value ? '1' : '0'); } catch {}
  };
  const saveDates = dates => {
    try { localStorage.setItem(datesKey(), JSON.stringify(dates || {})); } catch {}
  };
  const savedDates = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(datesKey()) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  };

  async function refreshAll() {
    state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
    myAvailability = {};
    (state.availability || []).filter(a => a.member_id === state.me.id).forEach(a => myAvailability[String(a.date).slice(0,10)] = a.status);
    renderCalendar();
    renderMembers();
    if (typeof renderMatches === 'function') renderMatches();
    if (typeof renderVotes === 'function') renderVotes();
    if (typeof renderConfirmation === 'function') renderConfirmation();
    if (typeof renderTrip === 'function') renderTrip();
    if (typeof progress === 'function') progress();
  }

  async function clearMyVotes() {
    const mine = (state.votes || []).filter(v => v.member_id === state.me?.id);
    await Promise.all(mine.map(v => api('vote','POST',{
      groupId: session.groupId,
      token: session.memberToken,
      eventId: v.event_id,
      clear: true
    })));
  }

  async function resetPathForModeChange(nextOn) {
    if (nextOn) {
      // Keep a private snapshot of the user's chosen dates so Don't mind can be
      // treated as a temporary mode rather than destroying their calendar work.
      saveDates({...myAvailability});
      myAvailability = {};
      await api('availability','POST',{
        groupId: session.groupId,
        token: session.memberToken,
        availability: {}
      });
    } else {
      // Leaving Don't mind restores the calendar exactly as it was when the
      // mode was entered. Flexible-mode votes are still cleared so downstream
      // Choices/Decide rebuild cleanly from the restored availability.
      const restore = savedDates();
      myAvailability = {...restore};
      await api('availability','POST',{
        groupId: session.groupId,
        token: session.memberToken,
        availability: restore
      });
    }
    await clearMyVotes();
    setActive(nextOn);
    await refreshAll();
  }

  window.tdpDontMindActive = active;
  window.tdpDontMindMatches = ranked => {
    if (!active()) return ranked.filter(e => ['yes', 'maybe'].includes(myAvailability[e.date]));
    const me = state.me?.id;
    const crewDates = new Set((state.availability || [])
      .filter(a => a.member_id !== me && ['yes', 'maybe'].includes(a.status))
      .map(a => String(a.date).slice(0, 10)));
    const discussed = new Set((state.votes || [])
      .filter(v => v.member_id !== me && ['yes', 'maybe'].includes(v.status))
      .map(v => v.event_id));
    return ranked.filter(e => crewDates.has(e.date) || discussed.has(e.id));
  };

  const baseRenderCalendar = renderCalendar;
  renderCalendar = function() {
    baseRenderCalendar();
    const calendar = document.querySelector('#calendar');
    if (!calendar) return;
    let box = document.querySelector('#dontMindBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'dontMindBox';
      box.style.cssText = 'margin:12px 0 14px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)';
      calendar.parentNode.insertBefore(box, calendar);
    }
    const on = active();
    box.innerHTML = `<button type="button" id="dontMindBtn" class="${on ? 'primary' : ''}" style="width:100%;text-align:left;padding:12px 14px;border-radius:12px"><strong>${on ? '✓ Don’t mind — I’m flexible' : '🤷 Don’t mind — show me what works for everyone'}</strong><span class="muted" style="display:block;margin-top:4px">${on ? 'Crew options will appear in Choices. Tap again and your saved dates will be restored.' : 'Not sure of your dates yet? Your current dates will be saved while you use Don’t mind.'}</span></button>`;
    const btn = document.querySelector('#dontMindBtn');
    btn.onclick = async () => {
      if (btn.dataset.saving === '1') return;
      btn.dataset.saving = '1';
      btn.disabled = true;
      const nextOn = !on;
      btn.querySelector('strong').textContent = nextOn ? 'Switching to Don’t mind…' : 'Restoring my dates…';
      try {
        await resetPathForModeChange(nextOn);
      } catch (err) {
        alert('Could not change availability mode: ' + err.message);
        btn.disabled = false;
        btn.dataset.saving = '';
      }
    };
  };

  const baseMemberReady = memberReady;
  memberReady = function(id) {
    if (id === state.me?.id && active()) return true;
    return baseMemberReady(id);
  };

  const baseRenderVotes = renderVotes;
  renderVotes = function() {
    if (!active()) return baseRenderVotes();
    const el = document.querySelector('#voteList');
    const next = document.querySelector('#confirmWinnerBtn');
    const status = document.querySelector('#voteStatus');
    if (!el || !next || !state.me) return;
    if (!events.length) {
      el.innerHTML = '<div class="card"><p class="muted">Live events are still loading.</p></div>';
      next.disabled = true;
      return;
    }
    const list = window.tdpDontMindMatches(rankedEvents());
    const mine = id => (state.votes || []).find(v => v.member_id === state.me?.id && v.event_id === id)?.status || '';
    const travelData = [
      ['castle combe','Wiltshire',150,'2h 35m'],['thruxton','Hampshire',160,'2h 45m'],['llandow','South Wales',190,'3h 20m'],['goodwood','West Sussex',200,'3h 30m'],['pembrey','Carmarthenshire',210,'3h 45m'],['silverstone','Northamptonshire',245,'4h 10m'],['mallory','Leicestershire',270,'4h 35m'],['brands hatch','Kent',270,'4h 40m'],['donington','Leicestershire',275,'4h 40m'],['bedford','Bedfordshire',290,'4h 50m'],['oulton','Cheshire',320,'5h 20m'],['blyton','Lincolnshire',330,'5h 20m'],['anglesey','Anglesey',350,'6h 10m'],['cadwell','Lincolnshire',365,'6h'],['snetterton','Norfolk',365,'6h 15m'],['croft','North Yorkshire',430,'7h'],['knockhill','Fife',520,'8h 30m']
    ];
    const travel = track => {
      const name = String(track || '').toLowerCase();
      const m = travelData.find(([k]) => name.includes(k));
      if (!m) return '';
      const [, region, miles, time] = m;
      const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(track)}`;
      return `<div class="meta" style="margin-top:6px"><a href="${maps}" target="_blank" rel="noopener">${region}</a> · ~${miles} miles · ~${time} from Cornwall Services</div>`;
    };
    const card = e => {
      const dt = new Date(e.date + 'T12:00:00');
      const selected = mine(e.id);
      const price = e.price != null ? `£${e.price}` : 'Price TBC';
      return `<article class="card event"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>${travel(e.track)}<div class="my-availability-badge unmarked">🤷 DON’T MIND MODE — DATE NOT SET</div><div class="vote-row vote-three"><button type="button" data-flex-vote="yes" data-event-id="${e.id}" class="${selected==='yes'?'selected':''}">Yes</button><button type="button" data-flex-vote="maybe" data-event-id="${e.id}" class="${selected==='maybe'?'selected':''}">Maybe</button><button type="button" data-flex-vote="no" data-event-id="${e.id}" class="${selected==='no'?'selected':''}">Can’t do</button></div></div><div class="score"><strong>${selected==='yes'?'Yes':selected==='maybe'?'Maybe':selected==='no'?"Can’t do":'—'}</strong><span class="meta">your choice</span></div></article>`;
    };
    if (!list.length) {
      el.innerHTML = '<div class="card"><h3>No crew options yet.</h3><p class="muted">Don’t mind is on. As soon as someone else adds dates or brings a track day into the discussion, it’ll appear here for you.</p></div>';
      next.disabled = true;
      if (status) status.textContent = 'WAITING FOR CREW';
      return;
    }
    el.innerHTML = `<div class="choice-section"><span class="eyebrow">CREW OPTIONS</span><p class="muted">Don’t mind is on — these are track days that fit the crew’s dates or are already being discussed.</p></div>${list.map(card).join('')}`;
    el.querySelectorAll('[data-flex-vote]').forEach(btn => btn.onclick = async () => {
      const row = btn.closest('.vote-row');
      if (row?.dataset.saving === '1') return;
      const eventId = btn.dataset.eventId;
      const choice = btn.dataset.flexVote;
      const clear = mine(eventId) === choice;
      row.dataset.saving = '1';
      try {
        await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,...(clear?{clear:true}:{status:choice})});
        await refreshAll();
      } catch (err) {
        alert('Could not update choice: ' + err.message);
        renderVotes();
      }
    });
    const answered = list.filter(e => mine(e.id)).length;
    if (status) status.textContent = `${answered}/${list.length} ANSWERED · DON’T MIND`;
    next.disabled = false;
    next.onclick = () => stage('confirm');
  };

  if (state?.me) {
    renderCalendar();
    renderMembers();
    renderVotes();
  }
})();