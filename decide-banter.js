(function(){
  const lines=[
    "Who’s the awkward one then?",
    "There’s always one… 🙄",
    "Right, who’s ruined it? 😂",
    "Let’s see the damage…",
    "Who’s made this difficult then? 😂",
    "How badly have we stitched this up?"
  ];
  let last='';
  function pick(){
    const choices=lines.filter(line=>line!==last);
    last=choices[Math.floor(Math.random()*choices.length)]||lines[0];
    return last;
  }
  function apply(){
    const title=document.querySelector('#heroTitle');
    const text=document.querySelector('#heroText');
    if(title)title.textContent=pick();
    if(text){text.textContent="See everyone’s picks, check your availability and work out the best fit.";text.hidden=false;}
  }
  const baseStage=stage;
  stage=function(id){
    baseStage(id);
    if(id==='confirm')apply();
  };
  document.querySelectorAll('[data-stage]').forEach(btn=>btn.onclick=()=>stage(btn.dataset.stage));
  if(document.querySelector('#confirm')?.classList.contains('active'))apply();
})();
