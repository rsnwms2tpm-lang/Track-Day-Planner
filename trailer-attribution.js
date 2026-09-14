(() => {
  const ENDPOINT='https://uehmbzwnbariqebbxcst.supabase.co/functions/v1/trip-trailer';
  let key='';
  let who='';
  let booked=false;
  let loading=false;

  async function load(force=false){
    const k=`${session?.groupId||''}:${state?.confirmedEventId||''}`;
    if(!session?.groupId||!session?.memberToken||!state?.confirmedEventId)return;
    if(!force&&k===key)return;
    if(loading)return;
    key=k;loading=true;
    try{
      const q=new URLSearchParams({groupId:session.groupId,token:session.memberToken,eventId:state.confirmedEventId});
      const r=await fetch(`${ENDPOINT}?${q}`);
      const j=await r.json();
      if(r.ok){booked=!!j?.trailerBooking?.booked;who=String(j?.trailerBooking?.updated_by_name||'').trim()}
    }catch(e){console.warn('Trailer attribution load failed',e)}
    finally{loading=false;apply()}
  }

  function setText(el,value){
    if(el&&el.textContent!==value)el.textContent=value;
  }

  function apply(){
    if(!booked||!who)return;
    const checkText=`Trailer booking confirmed — sorted by ${who}`;
    const cardText=`Trailer booking confirmed ✓ — sorted by ${who}`;
    document.querySelectorAll('[data-trailer-booking-check]').forEach(row=>{
      const text=row.querySelector('span:last-child');
      if(text&&/Trailer booking confirmed/i.test(text.textContent||''))setText(text,checkText);
    });
    document.querySelectorAll('[data-trailer-booking-card] .trailer-booking-copy strong').forEach(el=>{
      if(/Trailer booking confirmed/i.test(el.textContent||''))setText(el,cardText);
    });
  }

  // Deliberately no MutationObserver here: the trip shell is rebuilt often and
  // mutating text from inside a document-wide observer can create a render loop.
  setInterval(()=>{load();apply()},900);
  load();
})();