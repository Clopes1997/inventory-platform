import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const cypress=require('cypress');
const result=await cypress.run({project:fileURLToPath(new URL('../../apps/web',import.meta.url)),configFile:process.argv.includes('--workflows')?'cypress.config.js':'cypress.retirement.config.cjs',config:{baseUrl:process.env.MIGRATION_BASE_URL},browser:'electron',quiet:true});
for(const run of result.runs??[])for(const test of run.tests??[])if(test.state==='failed'){
 const error=test.attempts?.at(-1)?.error;
 // Only static test identities and source locations leave the browser process; no request bodies/tokens.
 console.log('WORKFLOW_FAILURE:'+JSON.stringify({title:test.title,name:error?.name,location:error?.codeFrame?.originalFile,line:error?.codeFrame?.line}));
}
const expected=process.argv.includes('--workflows')?10:1;
process.exitCode=result.totalFailed===0&&result.totalPassed===expected&&result.totalSkipped===0&&result.totalPending===0?0:1;
