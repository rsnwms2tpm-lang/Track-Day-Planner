(() => {
  const key = () => `tdp-dont-mind:${state?.group?.id || session?.groupId || 'group'}:${state?.me?.id || session?.memberId || 'member'}`;
  const active = () => {
    try { return localStorage.getItem(key()) === '1'; } catch { return false; }
  };
  const setActive = value => {
    try { localStorage.setItem(key(), value ? '1' : '0'); } catch {}
  };

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
    return ranked.filter(e => ['yes', 'maybe'].includes(myAvailability[e.date]) || crewDates.has(e.date) || discussed.has(e.id));
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
    box.innerHTML = `<button type="button" id="dontMindBtn" class="${on ? 'primary' : ''}" style="width:100%;text-align:left;padding:12px 14px;border-radius:12px"><strong>${on ? '✓ Don’t mind — I’m flexible' : '🤷 Don’t mind — show me what works for everyone'}</strong><span class="muted" style="display:block;margin-top:4px">${on ? 'Crew options will appear in Choices. Your own dates still work normally.' : 'Not sure of your dates yet? See the crew’s viable options and still vote Yes, Maybe or Can’t do.'}</span></button>`;
    document.querySelector('#dontMindBtn').onclick = () => {
      setActive(!on);
      renderCalendar();
      renderMembers();
      if (typeof renderVotes === 'function') renderVotes();
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
      const av = myAvailability[e.date] || '';
      const price = e.price != null ? `£${e.price}` : 'Price TBC';
      const badge = av === 'yes' ? '✓ YOU MARKED THIS DATE AVAILABLE' : av === 'maybe' ? '? YOU MARKED THIS DATE MAYBE' : '🤷 DON’T MIND MODE — DATE NOT SET';
      return `<article class="card event"><div class="datebox"><strong>${dt.getDate()}</strong><span>${dt.toLocaleString('en-GB',{month:'short'}).toUpperCase()} ${dt.getFullYear()}</span></div><div><h3>${e.track}</h3><div class="meta">${e.provider} · ${e.format} · ${price}</div>${travel(e.track)}<div class="my-availability-badge ${av || 'unmarked'}">${badge}</div><div class="vote-row vote-three"><button type="button" data-flex-vote="yes" data-event-id="${e.id}" class="${selected==='yes'?'selected':''}">Yes</button><button type="button" data-flex-vote="maybe" data-event-id="${e.id}" class="${selected==='maybe'?'selected':''}">Maybe</button><button type="button" data-flex-vote="no" data-event-id="${e.id}" class="${selected==='no'?'selected':''}">Can’t do</button></div></div><div class="score"><strong>${selected==='yes'?'Yes':selected==='maybe'?'Maybe':selected==='no'?"Can’t do":'—'}</strong><span class="meta">your choice</span></div></article>`;
    };
    if (!list.length) {
      el.innerHTML = '<div class="card"><h3>No crew options yet.</h3><p class="muted">Don’t mind is on. As soon as someone else adds dates or brings a track day into the discussion, it’ll appear here for you.</p></div>';
      next.disabled = true;
      if (status) status.textContent = 'WAITING FOR CREW';
      return;
    }
    el.innerHTML = `<div class="choice-section"><span class="eyebrow">CREW OPTIONS</span><p class="muted">Don’t mind is on — these are track days that fit the crew’s dates or are already being discussed. Your own Available/Maybe dates are included too.</p></div>${list.map(card).join('')}`;
    el.querySelectorAll('[data-flex-vote]').forEach(btn => btn.onclick = async () => {
      const row = btn.closest('.vote-row');
      if (row?.dataset.saving === '1') return;
      const eventId = btn.dataset.eventId;
      const choice = btn.dataset.flexVote;
      const clear = mine(eventId) === choice;
      row.dataset.saving = '1';
      try {
        await api('vote','POST',{groupId:session.groupId,token:session.memberToken,eventId,...(clear?{clear:true}:{status:choice})});
        state = await api('group','GET',{groupId:session.groupId,token:session.memberToken});
        myAvailability = {};
        (state.availability || []).filter(a => a.member_id === state.me.id).forEach(a => myAvailability[String(a.date).slice(0,10)] = a.status);
        renderVotes();
        if (typeof renderConfirmation === 'function') renderConfirmation();
        progress();
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