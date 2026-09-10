import { getDatabase } from '@netlify/database';
import type { Config } from '@netlify/functions';
import crypto from 'node:crypto';

const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const uid=()=>crypto.randomUUID();
const code=()=>crypto.randomBytes(4).toString('hex');
const months:any={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const clean=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function getJavelinEvents(){
  const sourceUrl='https://javelintrackdays.co.uk/trackdays/Upcoming-Events';
  const r=await fetch(sourceUrl,{headers:{'user-agent':'TrackDayPlanner/0.1 (+https://track-day-planner.netlify.app)','accept':'text/html'}});
  if(!r.ok)throw new Error(`Javelin returned ${r.status}`);
  const html=await r.text();
  const re=/(\d{1,2})(?:st|nd|rd|th)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*-\s*([^<\r\n]+)/gi;
  const hits=[...html.matchAll(re)];
  const now=new Date();
  const currentMonth=now.getUTCMonth();
  const currentYear=now.getUTCFullYear();
  const out:any[]=[];
  for(let i=0;i<hits.length;i++){
    const h=hits[i];
    const day=Number(h[1]);
    const mon=h[2][0].toUpperCase()+h[2].slice(1,3).toLowerCase();
    const mi=months[mon];
    if(mi===undefined)continue;
    let track=clean(h[3]).replace(/\s+(AM\/PM Only)$/i,'').trim();
    if(!track||/JTSS|Sprint Series/i.test(track))continue;
    const year=mi<currentMonth-1?currentYear+1:currentYear;
    const date=`${year}-${String(mi+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(date<now.toISOString().slice(0,10))continue;
    const start=h.index||0;
    const end=i+1<hits.length?(hits[i+1].index||start+1800):Math.min(html.length,start+1800);
    const segment=html.slice(start,Math.min(end,start+1800));
    const text=clean(segment);
    const priceMatch=text.match(/£\s*([0-9]{2,4}(?:\.\d{2})?)/);
    const noiseMatch=text.match(/(\d+(?:\/\d+)?(?:\.\d+)?\s*dba(?:\s+(?:Static|Drive-by))?)/i);
    const circuitMatch=text.match(/(?:Static|Drive-by)\s*\|\s*([^£]{3,40})/i);
    const status=/Sold Out/i.test(text)?'Sold out':/Low Stock/i.test(text)?'Low stock':(/\d+ Places? Left/i.test(text)?(text.match(/\d+ Places? Left/i)||[])[0]:'Available');
    out.push({
      id:`javelin-${date}-${slug(track)}`,
      date,track,provider:'Javelin',
      price:priceMatch?Number(priceMatch[1]):null,
      format:[noiseMatch?.[1],circuitMatch?.[1]?.trim()].filter(Boolean).join(' · ')||'Track day',
      availability:status,sourceUrl,live:true
    });
  }
  const dedup=new Map(out.map(e=>[e.id,e]));
  return [...dedup.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export default async (req:Request)=>{
  const db=getDatabase();
  const url=new URL(req.url);
  const action=url.searchParams.get('action');
  try{
    if(req.method==='GET'&&action==='events'){
      const events=await getJavelinEvents();
      return json({events,source:'Javelin Trackdays',fetchedAt:new Date().toISOString()});
    }
    if(req.method==='POST'&&action==='create-group'){
      const b=await req.json(); const gid=uid(), mid=uid(), token=code()+code(), invite=code();
      await db.sql`INSERT INTO groups(id,name,invite_code) VALUES(${gid},${b.groupName||'Track Day Crew'},${invite})`;
      await db.sql`INSERT INTO members(id,group_id,name,car,member_token) VALUES(${mid},${gid},${b.name||'Dave'},${b.car||''},${token})`;
      return json({groupId:gid,memberId:mid,memberToken:token,inviteCode:invite});
    }
    if(req.method==='POST'&&action==='join-group'){
      const b=await req.json(); const [g]=await db.sql`SELECT id,name FROM groups WHERE invite_code=${b.inviteCode}`;
      if(!g)return json({error:'Invite not found'},404);
      const mid=uid(), token=code()+code();
      await db.sql`INSERT INTO members(id,group_id,name,car,member_token) VALUES(${mid},${g.id},${b.name},${b.car||''},${token})`;
      return json({groupId:g.id,groupName:g.name,memberId:mid,memberToken:token});
    }
    if(req.method==='GET'&&action==='group'){
      const gid=url.searchParams.get('groupId'); const token=url.searchParams.get('token');
      const [me]=await db.sql`SELECT id,name,car,group_id FROM members WHERE member_token=${token||''} AND group_id=${gid||''}`;
      if(!me)return json({error:'Not authorised'},401);
      const [group]=await db.sql`SELECT id,name,invite_code FROM groups WHERE id=${gid||''}`;
      const members=await db.sql`SELECT id,name,car FROM members WHERE group_id=${gid||''} ORDER BY created_at`;
      const av=await db.sql`SELECT a.member_id,a.date,a.status FROM availability a JOIN members m ON m.id=a.member_id WHERE m.group_id=${gid||''}`;
      const votes=await db.sql`SELECT v.member_id,v.event_id FROM votes v JOIN members m ON m.id=v.member_id WHERE m.group_id=${gid||''}`;
      const [confirmed]=await db.sql`SELECT event_id FROM confirmed_events WHERE group_id=${gid||''}`;
      return json({group,me,members,availability:av,votes,confirmedEventId:confirmed?.event_id||null});
    }
    if(req.method==='POST'&&action==='availability'){
      const b=await req.json(); const [me]=await db.sql`SELECT id FROM members WHERE member_token=${b.token} AND group_id=${b.groupId}`;
      if(!me)return json({error:'Not authorised'},401);
      await db.sql`DELETE FROM availability WHERE member_id=${me.id}`;
      for(const [date,status] of Object.entries(b.availability||{})){ if(status==='yes'||status==='maybe') await db.sql`INSERT INTO availability(member_id,date,status) VALUES(${me.id},${date},${status})`; }
      return json({ok:true});
    }
    if(req.method==='POST'&&action==='vote'){
      const b=await req.json(); const [me]=await db.sql`SELECT id FROM members WHERE member_token=${b.token} AND group_id=${b.groupId}`;
      if(!me)return json({error:'Not authorised'},401);
      if(!b.eventId){await db.sql`DELETE FROM votes WHERE member_id=${me.id}`;}
      else{await db.sql`INSERT INTO votes(member_id,event_id) VALUES(${me.id},${b.eventId}) ON CONFLICT(member_id) DO UPDATE SET event_id=EXCLUDED.event_id,updated_at=NOW()`;}
      return json({ok:true});
    }
    if(req.method==='POST'&&action==='confirm'){
      const b=await req.json(); const [me]=await db.sql`SELECT id FROM members WHERE member_token=${b.token} AND group_id=${b.groupId}`;
      if(!me)return json({error:'Not authorised'},401);
      await db.sql`INSERT INTO confirmed_events(group_id,event_id) VALUES(${b.groupId},${b.eventId}) ON CONFLICT(group_id) DO UPDATE SET event_id=EXCLUDED.event_id,confirmed_at=NOW()`;
      return json({ok:true});
    }
    return json({error:'Unknown action'},404);
  }catch(e:any){console.error(e);return json({error:'Server error',detail:e?.message||String(e)},500)}
}

export const config:Config={path:'/api'};
