import type { AxiosAdapter } from 'axios';
import type { ProductDto, RawMaterialDto } from '../types/api';

const products: ProductDto[] = [
  { id: 1, code: 'DEMO-01', name: 'Workshop desk', price: 450, description: 'Fictional finished product', categoryPath: 'Furniture / Desks', available: true, finishedStock: 8, brandId: 1, cityId: 1, version: 1 },
  { id: 2, code: 'DEMO-02', name: 'Storage shelf', price: 180, description: 'Fictional finished product', categoryPath: 'Furniture / Storage', available: false, finishedStock: 0, brandId: 1, cityId: 1, version: 1 },
];
const materials: RawMaterialDto[] = [{ id: 1, code: 'WOOD', name: 'Wood panels', stockQuantity: 40 }];
const recipe = [{ id: 1, rawMaterialId: 1, rawMaterialCode: 'WOOD', rawMaterialName: 'Wood panels', requiredQuantity: 2 }];
const user = { id: 1, username: 'demo-viewer', role: 'VIEWER' };

// No network fallback: unsupported reads and every write fail explicitly.
export const demoAdapter: AxiosAdapter = async config => {
  if (config.method !== 'get') throw new Error('Read-only demo. Changes require the backend.');
  const p = config.params ?? {};
  const url = config.url ?? '';
  const filtered = products.filter(row =>
    (!p.name || row.name.toLowerCase().includes(String(p.name).toLowerCase())) &&
    (!p.brandId || String(row.brandId) === String(p.brandId)) &&
    (!p.cityId || String(row.cityId) === String(p.cityId)) &&
    (p.minPrice == null || row.price >= Number(p.minPrice)) &&
    (p.maxPrice == null || row.price <= Number(p.maxPrice)) &&
    (p.available == null || String(row.available) === String(p.available)));
  function page<T>(rows: T[]) {
    const number = p.all ? 0 : Math.max(0, Number(p.page) || 0);
    const size = p.all ? Math.max(1, rows.length) : Math.max(1, Number(p.size) || 20);
    return { content: rows.slice(number * size, (number + 1) * size), number, size, totalElements: rows.length, totalPages: Math.ceil(rows.length / size) };
  }
  let data: unknown;
  if ((url === '/users/me' || url === '/users/1')) data = user;
  else if (url === '/catalog/brands') data = [{ id: 1, name: 'Example Workshop', manufacturer: 'Demo Manufacturer' }];
  else if (url === '/catalog/cities') data = [{ id: 1, name: 'São Paulo' }];
  else if (url === '/products' || url === '/catalog/products') data = page(filtered);
  else if (url === '/raw-materials') data = page(materials);
  else if (/^\/products\/[12]\/materials$/.test(url)) data = recipe;
  else if (/^\/products\/[12]$/.test(url)) data = products.find(row => row.id === Number(url.split('/')[2]));
  else if (url === '/raw-materials/1') data = materials[0];
  else if (url === '/dashboard/stats' || url === '/catalog/stats') {
    const rows = url === '/dashboard/stats' ? products : filtered;
    data = { productCount: rows.length, rawMaterialCount: materials.length, finishedStockUnits: rows.reduce((sum, row) => sum + (row.finishedStock ?? 0), 0), finishedStockValue: rows.reduce((sum, row) => sum + (row.finishedStock ?? 0) * row.price, 0) };
  } else if (url === '/production/suggestion') {
    const items = products.map(row => ({ productId: row.id, productCode: row.code, productName: row.name, maxProducibleQuantity: 20, unitPrice: row.price, lineValue: 20 * row.price }));
    data = { calculationMode: 'PER_PRODUCT_FEASIBILITY', items, totalCount: items.length, totalProductionValue: items.reduce((sum, row) => sum + row.lineValue, 0) };
  } else throw new Error('This feature requires the backend.');
  return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config };
};
