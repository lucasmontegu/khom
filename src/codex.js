import { spawn } from 'node:child_process';
// Runs on the provisioned worker host. This is not a Codex Cloud API.
export function executeCodex({cwd, prompt, signal, timeoutMs=300000, judge=false, binary='codex'}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,['exec','--ignore-user-config','--ephemeral','--sandbox',judge?'read-only':'workspace-write','--json','-C',cwd,'-'],{stdio:['pipe','pipe','pipe'],signal,timeout:timeoutMs,killSignal:'SIGTERM'});
    const events=[];let pending='',stderr='';let bytes=0;
    child.stdout.on('data',chunk=>{
      bytes+=chunk.length;if(bytes>10_000_000){child.kill();return;}
      pending+=chunk;let index;
      while((index=pending.indexOf('\n'))>=0){const line=pending.slice(0,index);pending=pending.slice(index+1);try{events.push(JSON.parse(line));}catch{events.push({type:'unparsed_output'});}}
    });
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-4000);});
    child.on('error',reject);
    child.on('close',(code,signal)=>resolve({code,signal,events,diagnostic:code===0?null:'Codex failed; inspect protected worker logs',outputTruncated:bytes>10_000_000}));
    child.stdin.on('error',()=>{});child.stdin.end(prompt);
  });
}
