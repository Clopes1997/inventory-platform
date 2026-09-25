import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function decimal(value, scale, label) {
  if (value === null || value === undefined || !/^\d+(\.\d+)?$/.test(String(value))) throw new Error(`${label}: expected a nonnegative plain decimal`);
  const [integer, fractional = ''] = String(value).split('.');
  const fraction = fractional.replace(/0+$/, '');
  if (fraction.length > scale || integer.replace(/^0+/, '').length > 19 - scale) throw new Error(`${label}: precision exceeds target; review instead of rounding`);
  return `${integer.replace(/^0+(?=\d)/, '')}${fraction ? `.${fraction}` : ''}`;
}
function stock(value) {
  const text = decimal(value, 0, 'stock');
  if (BigInt(text) > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('stock: exceeds supported integer range');
  return Number(text);
}
function id(value, label = 'id') {
  if (value === null || value === undefined || String(value).length === 0 || String(value).length > 64) throw new Error(`${label}: missing or too long`);
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error(`${label}: supply large identifiers as strings`);
  return String(value);
}
function deleted(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value)))
    throw new Error('deletedAt: supply an ISO timestamp with an explicit timezone; source timezone must be reviewed');
  return new Date(value).toISOString();
}
function rows(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label}: expected an explicitly exported array`);
  return value;
}

export function normalize(source, installation, data) {
  if (!['arquivel', 'product-manager', 'product-list', 'autoflex'].includes(source)) throw new Error('Unsupported source');
  if (!installation || installation.length > 64) throw new Error('Provide a stable installation identifier of at most 64 characters');
  const entries = [];
  if (source === 'arquivel' || source === 'product-manager') {
    for (const row of rows(data.marcas, 'marcas')) entries.push({ type: 'brand', legacyId: id(row.id), name: row.nome, manufacturer: row.fabricante ?? null });
    for (const row of rows(data.cidades, 'cidades')) entries.push({ type: 'city', legacyId: id(row.id), name: row.nome });
    for (const row of rows(data.produtos, 'produtos')) entries.push({ type: 'product', legacyId: id(row.id), name: row.nome,
      price: decimal(row.valor, 2, 'valor'), stock: stock(row.estoque), available: true,
      brand: row.marca_id == null ? null : id(row.marca_id), city: row.cidade_id == null ? null : id(row.cidade_id), deletedAt: deleted(row.deleted_at) });
  } else if (source === 'product-list') {
    for (const row of rows(Array.isArray(data) ? data : data.products, 'products')) {
      if (typeof row.available !== 'boolean') throw new Error('available must be an explicit boolean');
      entries.push({ type: 'product', legacyId: id(row.id), name: row.name, description: row.description ?? null,
        categoryPath: row.categoryPath ?? null, price: decimal(row.price, 2, 'price'), stock: stock(row.quantity), available: row.available });
    }
  } else {
    for (const row of rows(data.products, 'products')) entries.push({ type: 'product', legacyId: id(row.id), code: row.code, name: row.name,
      price: decimal(row.price, 2, 'price'), stock: 0, available: true, deletedAt: deleted(row.deleted_at ?? row.deletedAt) });
    for (const row of rows(data.materials, 'materials')) entries.push({ type: 'material', legacyId: id(row.id), code: row.code, name: row.name,
      quantity: decimal(row.stock_quantity ?? row.stockQuantity, 4, 'stock_quantity'), deletedAt: deleted(row.deleted_at ?? row.deletedAt) });
    for (const row of rows(data.recipes, 'recipes')) entries.push({ type: 'recipe', legacyId: id(row.id), product: id(row.product_id ?? row.productId),
      material: id(row.raw_material_id ?? row.rawMaterialId), quantity: decimal(row.required_quantity ?? row.requiredQuantity, 4, 'required_quantity'), deletedAt: deleted(row.deleted_at ?? row.deletedAt) });
  }
  if (!entries.length || entries.length > 2000) throw new Error('Bundle must contain 1–2000 entries. Split larger exports with lookups before dependent records.');
  return { schemaVersion: 1, source, installation, entries };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, installation, input, output] = process.argv.slice(2);
  if (!source || !installation || !input || !output) {
    console.error('Usage: node tools/normalize-import.mjs SOURCE INSTALLATION INPUT.json OUTPUT.json'); process.exitCode = 1;
  } else {
    try {
      const data = JSON.parse(await readFile(input, 'utf8'));
      const bundle = normalize(source, installation, data);
      await writeFile(output, JSON.stringify(bundle, null, 2) + '\n', { flag: 'wx' });
      console.log(`Prepared ${bundle.entries.length} records. Review the source backup and import preview; no database was modified.`);
      if (source === 'autoflex') console.log('Users are not transferred by this converter. Provision/reconcile user identities separately before retirement.');
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
