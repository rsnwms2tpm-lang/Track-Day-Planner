(() => {
  let loading=false;
  let attempts=0;

  const hasSession=()=>{
    try{return !!(session?.groupId&&session?.memberToken)}catch(_){return false}
  };
  const hydrated=()=>{
    try{return !!(state?.me&&state?.group&&Array.isArray(state?.members)&&state.members.length)}catch(_){return false}
  };

  async function recover(){
    if(hydrated()||loading||!hasSession()||typeof loadGroup!=='function') return;
    loading=true;
    attempts++;
    try{
      await loadGroup();
      if(hydrated()){
        try{if(typeof render==='function')render()}catch(_){}
        window.dispatchEvent(new Event('focus'));
      }
    }catch(e){console.error('Session hydration retry failed',e)}
    finally{loading=false}
  }

  // Joining/rejoining writes tdp-session before loadGroup. Observe that write so a
  // successful crew selection cannot fall back to the empty initial shell.
  window.addEventListener('storage',recover);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)recover()});
  window.addEventListener('focus',recover);
  setTimeout(recover,0);
  setTimeout(recover,350);
  setTimeout(recover,900);
  setTimeout(recover,1800);
  const timer=setInterval(()=>{
    if(hydrated()||attempts>=8){clearInterval(timer);return}
    recover();
  },1200);
})();