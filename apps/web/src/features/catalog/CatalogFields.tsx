import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { CatalogLookup, ProductDto } from '../../types/api';

export default function CatalogFields({ value, onChange }: {
  value: Partial<ProductDto>; onChange: (value: Partial<ProductDto>) => void;
}) {
  const [brands, setBrands] = useState<CatalogLookup[]>([]);
  const [cities, setCities] = useState<CatalogLookup[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [brandResult, cityResult] = await Promise.all([
          api.get<CatalogLookup[]>('/catalog/brands'), api.get<CatalogLookup[]>('/catalog/cities'),
        ]);
        if (!Array.isArray(brandResult.data) || !Array.isArray(cityResult.data)) {
          throw new Error('Invalid catalog response');
        }
        if (active) { setBrands(brandResult.data); setCities(cityResult.data); }
      } catch { if (active) setError('Catalog options could not be loaded. Reload before changing brand or city.'); }
    }
    void load();
    return () => { active = false; };
  }, []);
  const update = (changes: Partial<ProductDto>) => onChange({ ...value, ...changes });
  return <fieldset className="catalog-fields">
    <legend>Catalog and finished stock</legend>
    {error && <p role="alert">{error}</p>}
    <div className="form-group"><label htmlFor="product-description">Description</label>
      <textarea id="product-description" maxLength={4000} value={value.description ?? ''}
        onChange={event => update({ description: event.target.value })} /></div>
    <div className="form-group"><label htmlFor="product-category">Category path</label>
      <input id="product-category" maxLength={1000} value={value.categoryPath ?? ''}
        onChange={event => update({ categoryPath: event.target.value })} /></div>
    <div className="form-group"><label htmlFor="product-stock">Finished stock (whole units)</label>
      <input id="product-stock" type="number" min="0" step="1" required value={value.finishedStock ?? 0}
        onChange={event => update({ finishedStock: event.target.value === '' ? NaN : Number(event.target.value) })} /></div>
    <div className="form-group"><label htmlFor="stock-reason">Stock adjustment reason</label>
      <input id="stock-reason" maxLength={500} value={value.adjustmentReason ?? ''}
        onChange={event => update({ adjustmentReason: event.target.value })} /></div>
    <div className="form-group"><label><input type="checkbox" checked={value.available ?? true}
      onChange={event => update({ available: event.target.checked })} /> Available in catalog</label></div>
    <div className="form-group"><label htmlFor="product-brand">Brand</label>
      <select id="product-brand" disabled={Boolean(error)} value={value.brandId ?? ''}
        onChange={event => update({ brandId: event.target.value ? Number(event.target.value) : null })}>
        <option value="">No brand</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select></div>
    <div className="form-group"><label htmlFor="product-city">City (geographic metadata)</label>
      <select id="product-city" disabled={Boolean(error)} value={value.cityId ?? ''}
        onChange={event => update({ cityId: event.target.value ? Number(event.target.value) : null })}>
        <option value="">No city</option>{cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
      </select></div>
    <Link to="/catalog">Manage brands and cities</Link>
  </fieldset>;
}
