(() => {
"use strict";
const names={
 driver:["Clean Cut","Bearded","Stubble","Shades","Cap","Balaclava","Glasses","Older Pro","Bald Stubble","Bald Beard","Long Hair","Moustache","Headphones","Bucket Hat","Wild Card","Track Rat"],
 helmet:["Classic White","Stealth","Red Rocket","Blue Thunder","High Viz","Matte Black","Retro","Orange Fury","Purple Haze","M Power","British Bulldog","Skull","Pink Speed","Camo","Chicken","Rainbow"]
};
const all=["driver","helmet"].flatMap(type=>names[type].map((name,i)=>({id:type+"-"+String(i+1).padStart(2,"0"),name,type,index:i})));
const palettes={
 skin:["#E9B18C","#D39168","#AC6D4F","#F3C09A","#BE8062","#DFA481","#905C49","#ECC19F"],
 hair:["#382821","#5E3425","#161D23","#714A2B","#392923","#A26E42"],
 shirt:["#F28C28","#3D7B9F","#7B87A4","#B15D45","#4D806E","#7761A3"],
 helmet:["#ECE9E3","#252B34","#CC4240","#3168B2","#D9EA38","#292B2F","#D2BBA1","#FB892D","#844BA8","#DCE0E7","#F3F0DF","#313138","#E37FAC","#5F7B49","#EDBD3D","#6BC2C0"]
};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function driverSVG(i){
 const skin=palettes.skin[i%8],hair=palettes.hair[i%6],shirt=palettes.shirt[i%6];
 const beard=[1,7,9,14].includes(i),stubble=[2,8,15].includes(i),bald=[8,9].includes(i);
 const glasses=[3,6].includes(i),cap=[4,13].includes(i),mask=i===5,phones=i===12,long=i===10;
 const facial=mask?'<path d="M23 33 Q50 8 77 33 L75 73 Q50 96 25 73Z" fill="#292F37"/><path d="M29 45H71" stroke="#505C68" stroke-width="8"/>':
 '<ellipse cx="32" cy="51" rx="5" ry="8" fill="'+skin+'"/><ellipse cx="68" cy="51" rx="5" ry="8" fill="'+skin+'"/><ellipse cx="50" cy="49" rx="22" ry="29" fill="'+skin+'"/>'+
 (bald?'':'<path d="M28 44 Q23 18 44 21 Q58 11 73 30 L73 43 Q65 30 52 30 Q37 36 28 44Z" fill="'+hair+'"/>')+
 (long?'<path d="M28 37 Q16 65 26 76L31 76L33 39M72 37Q83 62 74 76L69 76L68 39" fill="'+hair+'"/>':'')+
 (beard?'<path d="M29 57Q29 78 50 81Q71 78 71 57Q63 70 50 71Q37 70 29 57Z" fill="'+hair+'" opacity=".92"/>':'')+
 (stubble?'<path d="M31 60Q50 81 69 60Q67 78 50 80Q33 77 31 60" fill="'+hair+'" opacity=".43"/>':'')+
 (glasses?'<rect x="29" y="44" width="18" height="13" rx="5" fill="'+(i===3?'#1D2833':'#D5E4F0')+'" stroke="#20252B" stroke-width="3"/><rect x="53" y="44" width="18" height="13" rx="5" fill="'+(i===3?'#1D2833':'#D5E4F0')+'" stroke="#20252B" stroke-width="3"/><path d="M47 48H53" stroke="#20252B" stroke-width="3"/>':'<path d="M37 47h6M57 47h6" stroke="#302924" stroke-width="2.5" stroke-linecap="round"/>')+
 '<path d="M48 50L46 61H53" fill="none" stroke="#9D624E" stroke-width="2"/><path d="M43 68Q50 72 57 68" fill="none" stroke="#753E33" stroke-width="2" stroke-linecap="round"/>';
 const accessories=(cap?'<path d="M23 39Q25 17 48 16Q70 16 76 37L72 41Q50 35 28 43Z" fill="#242D35"/><path d="M24 40Q48 35 80 40Q62 47 32 45Z" fill="#F28C28"/>':'')+
 (phones?'<path d="M21 54V43Q21 17 50 17Q79 17 79 43V55" fill="none" stroke="#131920" stroke-width="9"/><rect x="17" y="43" width="12" height="22" rx="5" fill="#F28C28"/><rect x="71" y="43" width="12" height="22" rx="5" fill="#F28C28"/>':'');
 return '<path d="M4 100Q7 77 32 77L42 72H58L68 77Q93 77 96 100Z" fill="'+shirt+'"/><path d="M42 71V82Q50 93 58 82V71" fill="'+skin+'"/>'+facial+accessories;
}
function helmetSVG(i){
 const base=palettes.helmet[i%16],white=[0,6,9,10].includes(i);
 const stripeColor=white?"#E66E30":i===1||i===5?"#F28C28":"#F5F0E7";
 return '<path d="M9 100Q13 82 31 77H70Q86 83 91 100Z" fill="#404A56"/>'+
 '<path d="M20 59Q13 22 41 15Q58 10 73 26Q84 39 81 63L73 76Q52 84 28 71Z" fill="'+base+'" stroke="#151B23" stroke-width="3"/>'+
 '<path d="M37 18Q51 12 57 16L64 27Q52 26 42 28Z" fill="'+stripeColor+'" opacity=".9"/>'+
 '<path d="M20 41Q50 32 81 41L77 60Q50 66 25 60Z" fill="#15232B" stroke="#485B67" stroke-width="3"/>'+
 '<path d="M26 45Q51 37 77 45" fill="none" stroke="#B9D8E8" stroke-width="3" opacity=".54"/>'+
 '<path d="M28 65Q50 72 71 66" fill="none" stroke="#20242A" stroke-width="3"/>'+
 '<path d="M42 76H65" stroke="'+stripeColor+'" stroke-width="3" opacity=".6"/>';
}
function makeSVG(id){
 const item=all.find(x=>x.id===id);if(!item)return null;
 const i=item.index;
 const bg1=["#45545D","#4E3D39","#3E4E56","#4E4D4A"][i%4];
 const subject=item.type==="helmet"?helmetSVG(i):driverSVG(i);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="'+bg1+'"/><stop offset="1" stop-color="#222A32"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="47" r="42" fill="#FFFFFF" opacity=".055"/>'+subject+'</svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
window.TDHAvatars={all,avatarImage(id,size=44){const src=makeSVG(id);return src?{src,width:size,height:size,left:0,top:0}:null}};
})();