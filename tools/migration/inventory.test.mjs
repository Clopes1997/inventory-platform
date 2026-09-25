import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preflight,reconcile,decimal} from './inventory.mjs';
const source={marcas:[{id:1,nome:'Brand',fabricante:'Manufacturer'}],cidades:[{id:2,nome:'City'}],produtos:[{id:3,nome:'Product',valor:'0.29',estoque:3,marca_id:1,cidade_id:2}]};
const policy={currency:'BRL',finishedStockUnit:'count',historyPolicy:'opening-balance-only',materialUnits:{}};
const prepare=()=>preflight('product-manager','fixture',structuredClone(source),policy);
test('exact stock valuation and observed target mismatches',()=>{
 const {bundle,issues}=prepare();assert.equal(issues.length,0);
 const target={source:bundle.source,installation:bundle.installation,entries:bundle.entries.map((e,i)=>({...e,targetId:String(i+1),code:e.type==='product'?'product-manager:fixture:3':undefined,adjustmentCount:e.type==='product'?'1':undefined}))};
 const result=reconcile(bundle,target,policy);assert.equal(result.status,'PASS');assert.equal(result.totals.source.stockValueMinor,'87');
 target.entries[2].stock=2;assert.equal(reconcile(bundle,target,policy).status,'FAIL');
});
test('duplicate IDs, orphans and ambiguous money are never accepted',()=>{
 const data=structuredClone(source);data.produtos.push({...data.produtos[0]});data.produtos[0].marca_id=999;
 const result=preflight('product-manager','fixture',data,{});
 assert.ok(result.issues.some(i=>i.code==='DUPLICATE_ID'));assert.ok(result.issues.some(i=>i.code==='ORPHAN_REFERENCE'));assert.ok(result.issues.some(i=>i.code==='CURRENCY_REQUIRED'));
 assert.throws(()=>decimal('12.345',2));
});
test('naive timestamps and archived stock require explicit review',()=>{
 const data=structuredClone(source);data.produtos[0].deleted_at='2026-11-01T01:30:00';
 assert.ok(preflight('product-manager','fixture',data,policy).issues.some(i=>i.status==='REQUIRES_REVIEW'));
 data.produtos[0].deleted_at='2026-11-01T01:30:00-03:00';
 assert.ok(preflight('product-manager','fixture',data,policy).issues.some(i=>i.code==='ARCHIVED_PRODUCT_WITH_STOCK'));
});
test('active BOM references to archived materials require review and unit mapping',()=>{
 const data={schemaVersion:1,source:'autoflex',installation:'fixture',entries:[
  {type:'product',legacyId:'p',name:'P',price:'1.00',stock:0,available:true},
  {type:'material',legacyId:'m',name:'M',quantity:'1.0000',deletedAt:'2024-01-01T00:00:00Z'},
  {type:'recipe',legacyId:'r',product:'p',material:'m',quantity:'0.0001'},
 ]};
 const r=preflight('autoflex','fixture',data,policy);
 assert.ok(r.issues.some(i=>i.code==='ACTIVE_REFERENCE_TO_ARCHIVED'));
 assert.ok(r.issues.some(i=>i.code==='ARCHIVED_MATERIAL_WITH_STOCK'));
 assert.ok(r.issues.some(i=>i.code==='MATERIAL_UNIT_REQUIRED:m'));
});
