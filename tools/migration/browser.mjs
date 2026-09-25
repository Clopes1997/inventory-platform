import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const cypress=require('cypress');
const result=await cypress.run({project:fileURLToPath(new URL('../../apps/web',import.meta.url)),configFile:'cypress.retirement.config.cjs',config:{baseUrl:process.env.MIGRATION_BASE_URL},browser:'electron',quiet:true});
process.exitCode=result.totalFailed===0&&result.totalPassed>0?0:1;
