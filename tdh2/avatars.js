(() => {
"use strict";
// Original TDH portraits recovered from Neon Track Day Avatar Atlas.png.
// Each ID points to its own image file in the GitHub repository.
const names={
  driver:["Clean Cut","Bearded","Stubble","Shades","Cap","Balaclava","Glasses","Older Pro","Bald Stubble","Bald Beard","Long Hair","Moustache","Headphones","Bucket Hat","Wild Card","Track Rat"],
  helmet:["Classic White","Stealth","Red Rocket","Blue Thunder","High Viz","Matte Black","Retro","Orange Fury","Purple Haze","M Power","British Bulldog","Skull","Pink Speed","Camo","Chicken","Rainbow"]
};
const all=["driver","helmet"].flatMap(type=>names[type].map((name,i)=>({id:type+"-"+String(i+1).padStart(2,"0"),name,type,index:i})));
const imagePath=id=>all.some(a=>a.id===id)?"./assets/avatars/"+id+".webp":null;
window.TDHAvatars={
  all,
  avatarImage(id,size=44){
    const src=imagePath(id);
    return src?{src,width:size,height:size,left:0,top:0}:null;
  },
  imagePath
};
})();