(() => {
  // Planning v2 needs sold-out events to remain in the shared event pool so it can
  // show them as unavailable rather than making them look like missing listings.
  // Legacy planning screens continue to use their own shortlist behaviour; the
  // Planning v2 card renderer disables interest on sold-out events.
  cleanLiveEvents = function(raw){
    const map=new Map(),today=localToday();
    for(const item of raw||[]){
      if(!item.date||item.date<today)continue;
      const venue=venues.find(v=>String(item.track||'').toLowerCase().startsWith(v.toLowerCase()));
      if(!venue)continue;
      const e={...item,track:venue,id:`${item.provider||'live'}-${item.date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`};
      // Keep providers separate. Two organisers can legitimately run the same
      // circuit/date and can have different price/availability states.
      const key=`${e.provider||'live'}|${e.date}|${venue}`;
      const old=map.get(key);
      if(!old||(old.price==null&&e.price!=null))map.set(key,e);
    }
    return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)||String(a.track).localeCompare(String(b.track))||String(a.provider).localeCompare(String(b.provider)));
  };
})();
