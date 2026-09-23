(() => {
  const POLL_MS = 4000;
  let lastSignature = '';
  let polling = false;
  let pendingRefresh = false;

  function stableSignature(groupState) {
    if (!groupState) return '';
    try {
      return JSON.stringify({
        members: groupState.members || [],
        availability: groupState.availability || [],
        votes: groupState.votes || [],
        voteSubmissions: groupState.vote_submissions || [],
        finalVotes: groupState.final_votes || [],
        confirmedEventId: groupState.confirmedEventId || groupState.confirmed_event_id || null,
        bookings: groupState.bookings || groupState.confirmed_event_bookings || [],
        tripDetails: groupState.tripDetails || groupState.tripMemberDetails || groupState.trip_member_details || [],
        accommodation: groupState.accommodation || groupState.trip_accommodation || null,
        bingoState: groupState.bingoState || groupState.trip_bingo_state || null,
        bingoPredictions: groupState.bingoPredictions || groupState.trip_bingo_predictions || []
      });
    } catch {
      return '';
    }
  }

  function userIsEditing() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (active.isContentEditable) return true;
    return false;
  }

  function safeToRefresh() {
    if (document.visibilityState !== 'visible') return false;
    if (window.__tdhStayEditing === true) return false;
    if (window.__tdhTripEditing === true) return false;
    if (typeof availabilitySaving !== 'undefined' && availabilitySaving) return false;
    if (typeof availabilityDirty !== 'undefined' && availabilityDirty) return false;
    if (userIsEditing()) return false;
    return true;
  }

  async function applyRemote(remote) {
    if (!remote || !remote.me) return;
    state = remote;
    myAvailability = {};
    (state.availability || [])
      .filter(a => a.member_id === state.me.id)
      .forEach(a => { myAvailability[String(a.date).slice(0, 10)] = a.status; });
    render();
    try {
      window.dispatchEvent(new CustomEvent('tdh-remote-state-applied', { detail: { state: remote } }));
      await loadEvents();
      renderMatches();
      renderVotes();
      renderTrip();
    } catch (error) {
      console.error('Live sync event refresh unavailable', error);
    }
  }

  async function poll() {
    if (polling || !session || document.visibilityState !== 'visible') return;
    polling = true;
    try {
      const remote = await api('group', 'GET', { groupId: session.groupId, token: session.memberToken });
      const signature = stableSignature(remote);
      if (!lastSignature) {
        lastSignature = stableSignature(state) || signature;
      }
      if (signature && signature !== lastSignature) {
        if (safeToRefresh()) {
          lastSignature = signature;
          pendingRefresh = false;
          await applyRemote(remote);
        } else {
          pendingRefresh = true;
        }
      } else if (pendingRefresh && safeToRefresh()) {
        pendingRefresh = false;
        lastSignature = signature;
        await applyRemote(remote);
      }
    } catch (error) {
      if (!/invalid group credentials/i.test(String(error?.message || error))) {
        console.error('Live sync unavailable', error);
      }
    } finally {
      polling = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(poll, 150);
  });
  window.addEventListener('focus', () => setTimeout(poll, 150));
  window.addEventListener('pageshow', () => setTimeout(poll, 150));

  setInterval(poll, POLL_MS);
  setTimeout(poll, 1200);
})();