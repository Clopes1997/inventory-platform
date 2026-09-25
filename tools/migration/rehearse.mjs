import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {newReport,setGate,writeReports,fingerprint} from './report.mjs';
import {preflight,reconcile} from './inventory.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2)options[args[i]]=args[i+1];
let report,stage='preflight',substage='initialization',started=false,compose,env,project;
function docker(args,input){
 const r=spawnSync('docker',args,{cwd:root,env,encoding:'utf8',input,maxBuffer:64*1024*1024,timeout:900000});
 if(r.error||r.status!==0){
  if(report)report.warnings.push('Container failure: '+substage+'; exit '+r.status+'; MySQL codes '+((r.stderr??'').match(/ERROR [0-9]+/g)??[]).join(','));
  throw new Error('Container command failed at '+stage);
 }
 return r.stdout;
}
const dc=(args,input)=>docker(['compose','--project-name',project,'--file',compose,...args],input);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 if(!options['--snapshot']||!options['--policy']||!options['--out']||!['real','synthetic'].includes(options['--kind']))throw new Error('Required options missing');
 const output=resolve(options['--out']);await mkdir(dirname(output),{recursive:true});await mkdir(output,{recursive:false});
 const bytes=await readFile(resolve(options['--snapshot']));
 const data=JSON.parse(bytes),policy=JSON.parse(await readFile(resolve(options['--policy']),'utf8'));
 const source=options['--application']??data.source,installation=options['--installation']??data.installation;
 report=newReport({project:'inventory-platform',source:{application:source,installation,kind:options['--kind']},snapshot:bytes,
 commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()});
 report.mappingPolicy={currency:policy.currency,finishedStockUnit:policy.finishedStockUnit,materialUnits:policy.materialUnits,historyPolicy:policy.historyPolicy,sourceTimezone:policy.sourceTimezone};
 report.mappingPolicy.timestampInterpretation='Explicit source offsets only; naive values require reviewed normalization';
 await writeFile(resolve(output,'source-snapshot.json'),bytes,{flag:'wx',mode:0o600});
 if(fingerprint(await readFile(resolve(output,'source-snapshot.json')))!==report.snapshot.sha256)throw new Error('Source copy integrity mismatch');
 const prepared=preflight(source,installation,data,policy);
 report.discrepancies=prepared.issues;report.warnings=prepared.warnings;
 report.manualReviews.push({id:'runtime-lifecycle',status:'REQUIRES_REVIEW',evidence:'Quarkus 3.8.4 is unsupported; see QUARKUS-LIFECYCLE.md'});
 setGate(report,'source_snapshot','PASS',['Read-only JSON source; SHA-256 recorded']);
 if(options['--kind']==='real')setGate(report,'real_source','PASS',['Operator identified snapshot as real; ownership still requires review']);
 if(prepared.issues.length){setGate(report,'preflight',prepared.issues.some(i=>i.status==='FAIL')?'FAIL':'REQUIRES_REVIEW',['Mapping or source correction required']);}
 else{
 setGate(report,'preflight','PASS',['Identity, references, numeric, archive and explicit mapping checks']);
 project='migration-inventory-'+randomUUID().slice(0,8);
 const password=randomBytes(24).toString('hex');
 env={...process.env,MYSQL_PASSWORD:password,MYSQL_ROOT_PASSWORD:password,INVENTORY_DB_PASSWORD:password,
 INVENTORY_AUTH_SECRET:randomBytes(40).toString('hex'),INVENTORY_AUTH_PASSWORD:password,
 INVENTORY_DB_URL:'jdbc:mysql://db:3306/rehearsal'};
 compose=resolve(output,'disposable-compose.json');
 const db={image:'mysql:8.4',environment:['MYSQL_DATABASE=rehearsal','MYSQL_USER=rehearsal','MYSQL_PASSWORD','MYSQL_ROOT_PASSWORD'],
 healthcheck:{test:['CMD-SHELL','MYSQL_PWD="$MYSQL_PASSWORD" mysql --protocol=TCP -h 127.0.0.1 -u rehearsal rehearsal -e "SELECT 1"'],interval:'3s',timeout:'5s',retries:60}};
 const spec={services:{
 db:{...db,volumes:['source-db:/var/lib/mysql']},restore:{...db,volumes:['restore-db:/var/lib/mysql']},
 backend:{build:{context:resolve(root,'apps/api')},environment:['INVENTORY_DB_URL','INVENTORY_DB_USER=rehearsal','INVENTORY_DB_PASSWORD',
 'INVENTORY_AUTH_SECRET','INVENTORY_BOOTSTRAP_ADMIN=true','INVENTORY_AUTH_USER=rehearsal','INVENTORY_AUTH_PASSWORD'],
 depends_on:{db:{condition:'service_healthy'},restore:{condition:'service_healthy'}}},
 web:{build:{context:resolve(root,'apps/web')},ports:['127.0.0.1::80'],depends_on:['backend']}
 },volumes:{'source-db':{},'restore-db':{}}};
 await writeFile(compose,JSON.stringify(spec,null,2),{flag:'wx',mode:0o600});
 stage='isolated_target';substage='container-start';started=true;dc(['up','--build','--detach']);
 const currentBase=()=> 'http://127.0.0.1:'+dc(['port','web','80']).trim().split(':').pop();
 let base=currentBase();
 let token;
 async function login(){
  for(let i=0;i<90;i++){
   try{const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'rehearsal',password}),signal:AbortSignal.timeout(3000)});
   if(r.ok){token=(await r.json()).token;return;}}catch{}
   await sleep(1000);
  }throw new Error('Disposable API startup failed');
 }
 async function api(path,body,expected=200){
  const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if(r.status!==expected)throw new Error('Acceptance HTTP status failed');
  return r.json();
 }
 const snapshot=()=>api('/api/imports/snapshot?source='+encodeURIComponent(source)+'&installation='+encodeURIComponent(installation));
 substage='initial-backend-login';await login();setGate(report,'isolated_target','PASS',['Unique disposable Compose project; new MySQL 8.4 volumes; production Dockerfiles']);
 stage='import';const preview=await api('/api/imports/preview',prepared.bundle);if(preview.errors.length)throw new Error('Import preflight rejected');
 const applied=await api('/api/imports/apply',prepared.bundle),repeated=await api('/api/imports/apply',prepared.bundle);
 if(applied.newRecords!==prepared.bundle.entries.length||repeated.newRecords!==0)throw new Error('Idempotence failed');
 setGate(report,'import','PASS',['Administrator HTTP import; repeated import creates zero additional records']);
 const before=await snapshot();stage='reconciliation';
 const rec=reconcile(prepared.bundle,before,policy);report.counts=rec.counts;report.totals=rec.totals;report.identities=rec.identities;
 report.mappingPolicy.materialQuantityScale=rec.materialQuantityScale;
 report.discrepancies=rec.differences;report.integrityChecks=[{status:rec.status,check:'Observed fields, IDs, references, totals and opening adjustments'}];
 setGate(report,'reconciliation',rec.status,['Target export compared to immutable normalized source']);
 if(rec.status!=='PASS')throw new Error('Reconciliation failed');
 stage='acceptance';
 const unauth=await fetch(base+'/api/imports/snapshot?source='+source+'&installation='+installation);
 if(unauth.status!==401)throw new Error('Authentication bypass');
 if(!(await fetch(base)).ok)throw new Error('Frontend unavailable');
 await api('/api/catalog/products');
 report.automatedTests.push({name:'HTTP import, authentication, visibility and idempotence',status:'PASS'});
 const product=prepared.bundle.entries.find(e=>e.type==='product'&&!e.deletedAt);
 if(!product)throw new Error('Acceptance requires a visible imported product');
 const browser=spawnSync(process.execPath,['tools/migration/browser.mjs'],{cwd:root,env:{...env,MIGRATION_BASE_URL:base,MIGRATION_PRODUCT_NAME:product.name},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 if(browser.status!==0)throw new Error('Browser acceptance failed');
 report.automatedTests.push({name:'Retirement browser login and migrated catalog visibility',status:'PASS'});
 setGate(report,'acceptance','PASS',['HTTP authentication and actual migrated-data browser visibility passed']);
 stage='restart_persistence';dc(['restart','backend']);await login();
 if(JSON.stringify(await snapshot())!==JSON.stringify(before))throw new Error('Restart persistence mismatch');
 setGate(report,'restart_persistence','PASS',['Backend restarted; observed imported state unchanged']);
 stage='backup_restore';
 const sql=dc(['exec','-T','db','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --skip-comments --no-tablespaces rehearsal']);
 await writeFile(resolve(output,'target-backup.sql'),sql,{flag:'wx',mode:0o600});
 report.restore={status:'NOT_RUN',backupSha256:fingerprint(Buffer.from(sql)),scope:'Disposable target DB; includes test user hashes, keep private'};
 substage='restore-sql';dc(['exec','-T','restore','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot rehearsal'],sql);
 substage='restored-backend-start';env.INVENTORY_DB_URL='jdbc:mysql://restore:3306/rehearsal';dc(['up','--detach','--force-recreate','backend']);dc(['restart','web']);
 base=currentBase();substage='restored-backend-login';await login();
 substage='restored-state-comparison';
 if(JSON.stringify(await snapshot())!==JSON.stringify(before))throw new Error('Restored state mismatch');
 report.restore.status='PASS';setGate(report,'backup_restore','PASS',['mysqldump restored into separate empty MySQL; API comparison passed']);
 stage='rollback';env.INVENTORY_DB_URL='jdbc:mysql://db:3306/rehearsal';dc(['up','--detach','--force-recreate','backend']);dc(['restart','web']);base=currentBase();await login();
 if(JSON.stringify(await snapshot())!==JSON.stringify(before))throw new Error('Rollback state mismatch');
 report.rollback={status:'REQUIRES_REVIEW',routingRestoration:'PASS',applicationVersion:report.target.commit,reason:'Same-version disposable rollback passed; actual legacy version and post-cutover writes require review'};
 setGate(report,'rollback','REQUIRES_REVIEW',['Same-version rollback verified; previous production version unavailable']);
 if(fingerprint(await readFile(resolve(options['--snapshot'])))!==report.snapshot.sha256)throw new Error('Source changed during rehearsal');
 }
}catch{
 if(report){setGate(report,stage,'FAIL',['Execution failed at '+substage+'; source contents and credentials omitted']);report.blockers.push('Rehearsal incomplete: '+stage);}
 else console.error('Cannot start rehearsal: valid inputs/options and a new output directory required.');
}finally{
 if(started){try{dc(['down','--volumes','--remove-orphans']);}catch{if(report)report.blockers.push('Disposable cleanup failed; inspect generated Compose file');}}
 if(report){await writeReports(report,resolve(options['--out']));console.log(report.readiness);process.exitCode=Object.values(report.gates).some(g=>g.status==='FAIL')?1:2;}
 else process.exitCode=1;
}
