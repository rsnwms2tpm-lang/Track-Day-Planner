import { getDatabase } from '@netlify/database';
import type { Config } from '@netlify/functions';

const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

export default async (req:Request)=>{
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  const db=getDatabase();
  try{
    const b=await req.json();
    const [me]=await db.sql`SELECT id FROM members WHERE member_token=${b.token} AND group_id=${b.groupId}`;
    if(!me)return json({error:'Not authorised'},401);
    if(!b.eventId)return json({error:'eventId required'},400);
    const existing=await db.sql`SELECT 1 FROM votes WHERE member_id=${me.id} AND event_id=${b.eventId}`;
    if(existing.length){
      await db.sql`DELETE FROM votes WHERE member_id=${me.id} AND event_id=${b.eventId}`;
      return json({ok:true,selected:false});
    }
    await db.sql`INSERT INTO votes(member_id,event_id) VALUES(${me.id},${b.eventId}) ON CONFLICT(member_id,event_id) DO NOTHING`;
    return json({ok:true,selected:true});
  }catch(e:any){console.error(e);return json({error:'Server error',detail:e?.message||String(e)},500)}
};

export const config:Config={path:'/vote-api'};
