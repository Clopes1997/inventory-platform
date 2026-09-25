import {normalize} from '../normalize-import.mjs';
export function decimal(value,scale) {
 const s=String(value);
 if(!/^\d+(\.\d+)?$/.test(s))throw new Error('Invalid nonnegative decimal');
 const [whole,fraction='']=s.split('.');
 if(whole.replace(/^0+/,'').length>19-scale)throw new Error('Decimal exceeds target precision');
 if(fraction.length>scale && /[1-9]/.test(fraction.slice(scale)))throw new Error('Precision requires review; no rounding');
 return BigInt(whole)*10n**BigInt(scale)+BigInt(fraction.slice(0,scale).padEnd(scale,'0'));
}
const key=e=>e.type+':'+e.legacyId;
export function preflight(source,installation,data,policy) {
 const issues=[],warnings=[];
 const review=code=>issues.push({code,status:'REQUIRES_REVIEW'});
 if(!policy||!/^[A-Z]{3}$/.test(policy.currency??''))review('CURRENCY_REQUIRED');
 if(policy?.finishedStockUnit!=='count')review('FINISHED_STOCK_UNIT_MUST_BE_EXPLICIT_COUNT');
 if(policy?.historyPolicy!=='opening-balance-only')review('LEGACY_STOCK_HISTORY_REVIEW_REQUIRED');
 const inspect=(v)=>{
  if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v))review('NAIVE_TIMESTAMP_REQUIRES_EXPLICIT_OFFSET_AND_SOURCE_TIMEZONE');
  else if(v&&typeof v==='object')Object.values(v).forEach(inspect);
 };inspect(data);
 let bundle;
 try{
  bundle=data.schemaVersion===1&&Array.isArray(data.entries)?structuredClone(data):normalize(source,installation,data);
  if(bundle.source!==source||bundle.installation!==installation)throw new Error('Source identity mismatch');
  if(!bundle.entries.length||bundle.entries.length>2000)throw new Error('Invalid bundle size');
  for(const e of bundle.entries){
   if(!['brand','city','product','material','recipe'].includes(e.type)||!e.legacyId)throw new Error('Invalid identity');
   if(e.type==='product'){
    if(typeof e.price!=='string'||!Number.isSafeInteger(e.stock))throw new Error('Exact price string and safe integer stock required');
    decimal(e.price,2);decimal(e.stock,0);if(typeof e.available!=='boolean')throw new Error('Missing availability');
   }
   if(e.type==='material'||e.type==='recipe'){if(typeof e.quantity!=='string')throw new Error('Exact quantity string required');decimal(e.quantity,4);}
  }
 }catch{issues.push({code:'SOURCE_NORMALIZATION_FAILED',status:'FAIL'});return {bundle:null,issues,warnings};}
 const entries=new Map(),codes=new Set(),pairs=new Set();
 for(const e of bundle.entries){
  if(entries.has(key(e)))issues.push({code:'DUPLICATE_ID',record:key(e),status:'FAIL'});
  entries.set(key(e),e);
  if(e.code){const k=e.type+':'+e.code;if(codes.has(k))issues.push({code:'DUPLICATE_CODE',record:key(e),status:'REQUIRES_REVIEW'});codes.add(k);}
  if(e.type==='material'&&!policy?.materialUnits?.[e.legacyId])review('MATERIAL_UNIT_REQUIRED:'+e.legacyId);
  if(e.type==='product'&&e.deletedAt&&e.stock!==0)issues.push({code:'ARCHIVED_PRODUCT_WITH_STOCK',record:key(e),status:'REQUIRES_REVIEW'});
 }
 for(const e of bundle.entries){
  const refs=e.type==='recipe'?[['product',e.product],['material',e.material]]:e.type==='product'?[['brand',e.brand],['city',e.city]]:[];
  for(const [type,id] of refs){
   if(id==null&&e.type!=='recipe')continue;
   const ref=entries.get(type+':'+id);
   if(!ref)issues.push({code:'ORPHAN_REFERENCE',record:key(e),reference:type+':'+id,status:'FAIL'});
   else if(!e.deletedAt&&ref.deletedAt)issues.push({code:'ACTIVE_REFERENCE_TO_ARCHIVED',record:key(e),reference:type+':'+id,status:'REQUIRES_REVIEW'});
  }
  if(e.type==='recipe'){
   const pair=e.product+':'+e.material;
   if(pairs.has(pair))issues.push({code:'DUPLICATE_BOM_PAIR',record:key(e),status:'FAIL'});
   pairs.add(pair);
   if(decimal(e.quantity,4)===0n)issues.push({code:'ZERO_BOM_QUANTITY',record:key(e),status:'FAIL'});
  }
 }
 warnings.push('Manufacturers and category paths are preserved as catalog attributes, not independent entity IDs.');
 warnings.push('Only opening stock adjustments are representable; no historical movements are invented.');
 return {bundle,issues,warnings};
}
export function reconcile(bundle,target,policy) {
 const differences=[],identities=[],sourceCounts={},targetCounts={};
 if(target.source!==bundle.source||target.installation!==bundle.installation)differences.push({code:'SOURCE_IDENTITY_MISMATCH'});
 const actual=new Map(),targetIds=new Set();
 for(const e of target.entries??[]){
  if(actual.has(key(e)))differences.push({code:'DUPLICATE_TARGET_MAPPING',record:key(e)});
  if(targetIds.has(e.type+':'+e.targetId))differences.push({code:'COLLIDING_TARGET_ID',record:key(e)});
  targetIds.add(e.type+':'+e.targetId);actual.set(key(e),e);targetCounts[e.type]=(targetCounts[e.type]??0)+1;
  if(e.deletedAt)targetCounts[e.type+'Archived']=(targetCounts[e.type+'Archived']??0)+1;
 }
 const totals={source:{finishedStock:'0',stockValueMinor:'0',materials:{}},target:{finishedStock:'0',stockValueMinor:'0',materials:{}}};
 function total(e,side){
  if(e.type==='product'){const stock=decimal(e.stock,0);totals[side].finishedStock=(BigInt(totals[side].finishedStock)+stock).toString();totals[side].stockValueMinor=(BigInt(totals[side].stockValueMinor)+stock*decimal(e.price,2)).toString();}
  if(e.type==='material'){const unit=policy.materialUnits?.[e.legacyId];if(!unit)throw new Error('Unmapped unit');totals[side].materials[unit]=(BigInt(totals[side].materials[unit]??'0')+decimal(e.quantity,4)).toString();}
 }
 for(const e of bundle.entries){
  sourceCounts[e.type]=(sourceCounts[e.type]??0)+1;
  if(e.deletedAt)sourceCounts[e.type+'Archived']=(sourceCounts[e.type+'Archived']??0)+1;
  const a=actual.get(key(e));
  try{total(e,'source');}catch{differences.push({code:'INVALID_SOURCE_TOTAL',record:key(e)});}
  if(!a||a.missing){differences.push({code:'MISSING_TARGET',record:key(e)});continue;}
  identities.push({type:e.type,legacyId:e.legacyId,targetId:a.targetId,installation:bundle.installation});
  try{total(a,'target');}catch{differences.push({code:'INVALID_TARGET_TOTAL',record:key(e)});}
  for(const field of ['name','manufacturer','description','categoryPath','available','brand','city','product','material']){
   if((e[field]??null)!==(a[field]??null))differences.push({code:'FIELD_MISMATCH',record:key(e),field});
  }
  for(const [field,scale]of [['price',2],['stock',0],['quantity',4]]){
   if(e[field]==null)continue;
   try{if(decimal(e[field],scale)!==decimal(a[field],scale))differences.push({code:'DECIMAL_MISMATCH',record:key(e),field});}
   catch{differences.push({code:'INVALID_DECIMAL',record:key(e),field});}
  }
  if((e.deletedAt?Date.parse(e.deletedAt):null)!==(a.deletedAt?Date.parse(a.deletedAt):null))differences.push({code:'ARCHIVE_TIMESTAMP_MISMATCH',record:key(e)});
  if(['product','material'].includes(e.type)){
   const code=e.code||bundle.source+':'+bundle.installation+':'+e.legacyId;
   if(code!==a.code)differences.push({code:'CODE_MISMATCH',record:key(e)});
  }
  if(e.type==='product'&&String(a.adjustmentCount)!=='1')differences.push({code:'OPENING_ADJUSTMENT_COUNT_MISMATCH',record:key(e)});
 }
 for(const k of actual.keys())if(!bundle.entries.some(e=>key(e)===k))differences.push({code:'UNEXPECTED_TARGET_RECORD',record:k});
 return {status:differences.length?'FAIL':'PASS',differences,identities,counts:{source:sourceCounts,target:targetCounts},totals,currency:policy.currency,materialQuantityScale:4};
}
