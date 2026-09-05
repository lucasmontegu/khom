import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Store } from './core.js';
export function createServer(store, token) {
  if(!token || token.length<32)throw Error('KHOM_API_TOKEN must contain at least 32 characters');
  const expected=Buffer.from(`Bearer ${token}`);
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET' && url.pathname==='/') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(readFileSync(new URL('./web.html',import.meta.url)));return;}
    const supplied=Buffer.from(req.headers.authorization??'');
    if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)){res.writeHead(401);res.end('Unauthorized');return;}
    res.setHeader('Content-Type','application/json');
    try {
      let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000){res.writeHead(413);res.end('{}');return;}}
      const body=raw?JSON.parse(raw):{};const parts=url.pathname.split('/').filter(Boolean);let result;
      if(req.method==='GET' && url.pathname==='/api/runs')result=store.list();
      else if(req.method==='POST' && url.pathname==='/api/changes')result=store.put(body);
      else if(req.method==='GET' && parts[1]==='changes' && parts.length===3)result=store.change(parts[2]);
      else if(req.method==='POST' && parts[1]==='changes' && parts[3]==='approve')result=store.approve(parts[2],body.revision);
      else if(req.method==='POST' && parts[1]==='changes' && parts[3]==='run')result=store.start(parts[2],req.headers['idempotency-key'],body.parent??null);
      else if(req.method==='GET' && parts[1]==='runs' && parts.length===3)result=store.get(parts[2]);
      else if(req.method==='GET' && parts[1]==='runs' && parts[3]==='receipt')result=store.receipt(parts[2]);
      else if(req.method==='POST' && parts[1]==='runs' && parts[3]==='stop')result=store.stop(parts[2]);
      else {res.writeHead(404);res.end('{}');return;}
      res.end(JSON.stringify(result));
    } catch(error){res.writeHead(400);res.end(JSON.stringify({error:error.message}));}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  mkdirSync('.khom-runtime',{recursive:true,mode:0o700});
  const server=createServer(new Store('.khom-runtime/state.sqlite'),process.env.KHOM_API_TOKEN);
  server.listen(Number(process.env.PORT??4317),process.env.HOST??'127.0.0.1',()=>console.log('Khom control plane listening; execution dispatcher is not configured'));
}
