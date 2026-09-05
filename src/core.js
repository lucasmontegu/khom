import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
export const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const terminal = new Set(['succeeded','no_op','needs_decision','approval_required','blocked','exhausted','stagnated','failed','cancelled']);
export function validateContract(c) {
  if (!c || c.schemaVersion !== 1 || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(c.id ?? '') || !Number.isInteger(c.revision) || c.revision < 1) throw Error('Invalid contract identity');
  if (!['direct','guided','loop'].includes(c.mode) || !c.goal?.trim() || !c.repo?.trim() || !/^[a-f0-9]{40}$/.test(c.baseSha ?? '')) throw Error('Invalid contract scope');
  if (c.deliveryTarget !== 'ready_to_merge') throw Error('Unsupported delivery target');
  if (!Array.isArray(c.acceptance) || !c.acceptance.length || c.acceptance.some(a => !a.id || !a.condition || !a.kind) || new Set(c.acceptance.map(a=>a.id)).size !== c.acceptance.length) throw Error('Acceptance criteria required');
  for (const field of ['invariants','allowed','outOfScope']) if (!Array.isArray(c[field])) throw Error(`Missing ${field}`);
  for (const key of ['maxAttempts','maxRunMinutes','maxStagnation']) if (!Number.isInteger(c.budgets?.[key]) || c.budgets[key] < 1) throw Error(`Invalid budget ${key}`);
  return c;
}
export function compileContext(contract, {sha, capability='implement', skill, files=[], instructions='', failure=null, maxBytes=48000}) {
  validateContract(contract);
  if (skill && hash(skill.content) !== skill.hash) throw Error('Skill lock mismatch');
  const content = {schemaVersion:1, contract, sha, capability, instructions, skill:skill?.content ?? null, files, failure};
  const prompt=JSON.stringify(content); const bytes=Buffer.byteLength(prompt);
  if (bytes > maxBytes) throw Error('Essential context exceeds budget; split scope or authorize expansion');
  return {prompt, manifest:{hash:hash(content), bytes, estimatedTokens:Math.ceil(bytes/4), skill:skill ? {id:skill.id, hash:skill.hash}:null, files:files.map(f=>({path:f.path,hash:hash(f.content)})), reason:'Contract, applicable instructions and explicitly selected files'}};
}
export function gate(contract, snapshot, evidence, judgement) {
  const reasons=[];
  if (!snapshot?.sha || snapshot.repo !== contract.repo || snapshot.baseSha !== contract.baseSha || !snapshot.pr || snapshot.checks !== 'pass') reasons.push('Current PR, base and passing checks required');
  for (const ac of contract.acceptance) {
    const valid=evidence.some(e=>e.acceptanceId===ac.id && e.kind===ac.kind && e.status==='pass' && e.sha===snapshot?.sha && e.repo===contract.repo && e.revision===contract.revision && e.producer==='verifier' && e.artifact && e.observedAt && (e.kind!=='browser' || (e.deploymentId===snapshot.deploymentId && e.url===snapshot.url && e.viewport && e.scenario)));
    if (!valid) reasons.push(`Missing current evidence: ${ac.id}`);
  }
  if (contract.mode!=='direct' && (!judgement || judgement.verdict!=='pass' || judgement.sha!==snapshot?.sha || judgement.revision!==contract.revision || judgement.producer!=='judge' || judgement.findings?.some(f=>['critical','high'].includes(f.severity)))) reasons.push('Independent current judgement required');
  return {pass:reasons.length===0,reasons};
}
export class Store {
  constructor(path=':memory:') {
    this.db=new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS changes (id TEXT PRIMARY KEY, body TEXT NOT NULL, approved TEXT);
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, change_id TEXT NOT NULL, command_key TEXT UNIQUE NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (run_id TEXT PRIMARY KEY, body TEXT NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS active_change ON runs(change_id) WHERE json_extract(body,'$.state') IN ('queued','running','waiting_external','cancelling');`);
  }
  transaction(fn) {this.db.exec('BEGIN IMMEDIATE');try {const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  change(id) {const row=this.db.prepare('SELECT * FROM changes WHERE id=?').get(id);if(!row) throw Error('Unknown change');return {...JSON.parse(row.body),approved:row.approved};}
  put(c) { validateContract(c); return this.transaction(()=>{
    const old=this.db.prepare('SELECT body FROM changes WHERE id=?').get(c.id);
    if(old && c.revision<=JSON.parse(old.body).revision) throw Error('Revision must increase');
    this.db.prepare('INSERT INTO changes VALUES(?,?,NULL) ON CONFLICT(id) DO UPDATE SET body=excluded.body, approved=NULL').run(c.id,JSON.stringify(c));return c;
  });}
  approve(id, revision) {const c=this.change(id);if(c.revision!==revision)throw Error('Stale revision');delete c.approved;this.db.prepare('UPDATE changes SET approved=? WHERE id=?').run(hash(c),id);return c;}
  get(id) {const r=this.db.prepare('SELECT body FROM runs WHERE id=?').get(id);if(!r)throw Error('Unknown run');return JSON.parse(r.body);}
  list() {return this.db.prepare('SELECT body FROM runs ORDER BY rowid DESC').all().map(r=>JSON.parse(r.body));}
  save(r) {this.db.prepare('UPDATE runs SET body=? WHERE id=?').run(JSON.stringify(r),r.id);return r;}
  start(id,key,parent=null) {if(!key || key.length>200)throw Error('Idempotency key required');return this.transaction(()=>{
    const existing=this.db.prepare('SELECT body FROM runs WHERE command_key=?').get(key);
    if(existing) {const r=JSON.parse(existing.body);if(r.changeId!==id || r.parent!==parent)throw Error('Idempotency key conflict');return r;}
    const c=this.change(id);const approval=c.approved;delete c.approved;
    if(approval!==hash(c)) throw Error('Contract approval required');
    if(parent) {const p=this.get(parent);if(p.changeId!==id || !terminal.has(p.state))throw Error('Parent must be terminal and belong to change');}
    const r={id:randomUUID(),changeId:id,contract:c,parent,state:'queued',createdAt:Date.now(),attempts:[],evidence:[],fence:0,lease:null,reason:null};
    this.db.prepare('INSERT INTO runs VALUES(?,?,?,?)').run(r.id,id,key,JSON.stringify(r));return r;
  });}
  claim(id,owner,now=Date.now()) {return this.transaction(()=>{
    const r=this.get(id);if(terminal.has(r.state)||r.state==='cancelling')throw Error('Run is not dispatchable');
    if(r.lease) throw Error(r.lease.until>now ? 'Worker already owns lease':'Expired lease requires reconciliation; do not redispatch');
    const current=this.change(r.changeId);delete current.approved;
    if(hash(current)!==hash(r.contract))return this.finish(r,'needs_decision','Contract revision changed');
    if(now-r.createdAt>=r.contract.budgets.maxRunMinutes*60000 || r.attempts.length>=r.contract.budgets.maxAttempts)return this.finish(r,'exhausted','Execution budget exhausted');
    r.state='running';r.fence++;r.lease={owner,until:now+60000};r.attempts.push({id:randomUUID(),state:'intent',fence:r.fence,createdAt:now});return this.save(r);
  });}
  finish(r,state,reason) {if(!terminal.has(state))throw Error('Invalid terminal state');r.state=state;r.reason=reason;r.finishedAt=Date.now();r.lease=null;this.save(r);this.db.prepare('INSERT INTO receipts VALUES(?,?)').run(r.id,JSON.stringify({...r,schemaVersion:1,provider:'codex',cost:'unavailable',nextAction:['succeeded','no_op'].includes(state)?'Review PR before merge':'Inspect reason and authorize successor run'}));return r;}
  stop(id) {return this.transaction(()=>{const r=this.get(id);if(terminal.has(r.state))return r;if(!r.lease)return this.finish(r,'cancelled','Stopped before dispatch');r.state='cancelling';r.reason='Cancellation requested; provider confirmation pending';return this.save(r);});}
  reconcile(id,fence,{confirmedStopped=false}={}) {return this.transaction(()=>{const r=this.get(id);if(r.fence!==fence || !r.lease)throw Error('Stale fencing token');if(!confirmedStopped)throw Error('Provider termination must be confirmed');return this.finish(r,r.state==='cancelling'?'cancelled':'blocked','Provider stopped; inspect workspace before successor run');});}
  complete(id,fence,{snapshot,evidence=[],judgement=null,progress=false,contextManifest=null},now=Date.now()) {return this.transaction(()=>{
    const r=this.get(id);if(r.state!=='running'||r.fence!==fence||!r.lease||r.lease.until<=now)throw Error('Stale or cancelled worker');
    const current=this.change(r.changeId);delete current.approved;
    if(hash(current)!==hash(r.contract))return this.finish(r,'needs_decision','Contract changed during attempt');
    const attempt=r.attempts.at(-1);Object.assign(attempt,{state:'completed',snapshot,contextManifest});r.evidence=evidence;r.judgement=judgement;
    if(now-r.createdAt>=r.contract.budgets.maxRunMinutes*60000)return this.finish(r,'exhausted','Run deadline reached');
    const result=gate(r.contract,snapshot,evidence,judgement);
    if(result.pass)return this.finish(r,'succeeded','Current acceptance evidence and delivery gate passed');
    r.stagnation=progress?0:(r.stagnation??0)+1;r.reason=result.reasons.join('; ');r.lease=null;
    if(r.contract.mode!=='loop')return this.finish(r,'needs_decision',r.reason);
    if(r.attempts.length>=r.contract.budgets.maxAttempts)return this.finish(r,'exhausted',r.reason);
    if(r.stagnation>=r.contract.budgets.maxStagnation)return this.finish(r,'stagnated',r.reason);
    r.state='queued';return this.save(r);
  });}
  receipt(id) {const row=this.db.prepare('SELECT body FROM receipts WHERE run_id=?').get(id);if(!row)throw Error('Receipt not available');return JSON.parse(row.body);}
  close(){this.db.close();}
}
