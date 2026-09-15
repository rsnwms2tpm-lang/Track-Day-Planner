(() => {
  const EVENTS_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/track-day-events';
  const MOTORSPORT_EVENTS_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/motorsport-events-feed';
  const JAVELIN_CAPACITY_BASE = 'https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/javelin-capacity';
  const baseApi = api;

  api = async function(action, method = 'GET', body = null) {
    if (action !== 'events') return baseApi(action, method, body);
    const opts = { method: 'GET', cache: 'no-store', headers: {} };
    const [mainResult, meResult, capacityResult] = await Promise.allSettled([
      fetch(EVENTS_BASE, opts).then(async r => { const j=await r.json(); if(!r.ok) throw new Error(j.error||j.detail||`Request failed (${r.status})`); return j; }),
      fetch(MOTORSPORT_EVENTS_BASE, opts).then(async r => { const j=await r.json(); if(!r.ok) throw new Error(j.error||`Motorsport Events request failed (${r.status})`); return j; }),
      fetch(JAVELIN_CAPACITY_BASE, opts).then(async r => { const j=await r.json(); if(!r.ok) throw new Error(j.error||`Capacity request failed (${r.status})`); return j; })
    ]);
    if(mainResult.status==='rejected' && meResult.status==='rejected') throw mainResult.reason;
    const main=mainResult.status==='fulfilled'?mainResult.value:{events:[],sources:[]};
    const me=meResult.status==='fulfilled'?meResult.value:{events:[]};
    const caps=capacityResult.status==='fulfilled'?(capacityResult.value.events||[]):[];
    const capMap=new Map(caps.map(c=>[`${c.provider}|${c.date}|${String(c.track||'').toLowerCase()}`,c]));
    const combined=[...(main.events||[]),...(me.events||[])].map(e=>{
      const c=capMap.get(`${e.provider}|${e.date}|${String(e.track||'').toLowerCase()}`);
      return c?{...e,availability:c.availability,spacesAvailable:c.spacesAvailable,availabilityCheckedAt:c.availabilityCheckedAt}:e;
    });
    const seen=new Set();
    const events=combined.filter(e=>{const key=`${e.provider}|${e.date}|${String(e.track||'').toLowerCase()}`;if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.track).localeCompare(String(b.track)));
    return {...main,events,sources:[...(main.sources||[]),{provider:'Motorsport Events',ok:meResult.status==='fulfilled',count:me.events?.length||0},{provider:'Javelin live capacity',ok:capacityResult.status==='fulfilled',count:caps.length}],source:'Multi-provider live search'};
  };
})();
