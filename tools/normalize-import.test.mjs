import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './normalize-import.mjs';

test('Laravel catalogs preserve lookup references and zero stock', () => {
  const result = normalize('arquivel', 'local-a', { marcas: [{ id: 8, nome: 'Brand', fabricante: 'Maker' }], cidades: [{ id: 9, nome: 'City' }], produtos: [{ id: 8, nome: 'Product', valor: '12.3400', estoque: '0.0', marca_id: 8, cidade_id: 9 }] });
  assert.equal(result.entries[2].price, '12.34'); assert.equal(result.entries[2].stock, 0);
  assert.equal(result.entries[2].brand, '8'); assert.equal(result.entries[2].city, '9');
});
test('Product List availability remains independent of stock', () => {
  const result = normalize('product-list', 'local-b', [{ id: 1, name: 'P', price: '1', quantity: 7, available: false, categoryPath: 'literal/path' }]);
  assert.equal(result.entries[0].available, false); assert.equal(result.entries[0].stock, 7);
  assert.equal(result.entries[0].categoryPath, 'literal/path');
});
test('fractional stock and excess precision are rejected, never rounded', () => {
  assert.throws(() => normalize('product-list', 'a', [{ id: 1, name: 'P', price: '1', quantity: 1.5, available: true }]), /precision/);
  assert.throws(() => normalize('product-list', 'a', [{ id: 1, name: 'P', price: '1.001', quantity: 1, available: true }]), /precision/);
});
test('naive source timestamps require an explicit data-owner timezone decision', () => {
  assert.throws(() => normalize('autoflex', 'a', { products: [{ id: 1, name: 'P', code: 'P', price: '1', deleted_at: '2025-01-01 12:00:00' }], materials: [], recipes: [] }), /timezone/);
});
