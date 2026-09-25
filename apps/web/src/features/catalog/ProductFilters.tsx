import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CatalogLookup } from '../../types/api';
import type { ProductFilters as Filters } from '../products/productsSlice';

export default function ProductFilters({ values, onApply }: { values: Filters; onApply: (filters: Filters) => void }) {
  const [brands, setBrands] = useState<CatalogLookup[]>([]);
  const [cities, setCities] = useState<CatalogLookup[]>([]);
  const [brandId, setBrandId] = useState(values.brandId ?? '');
  const [cityId, setCityId] = useState(values.cityId ?? '');
  const [lookupError, setLookupError] = useState('');
  useEffect(() => { setBrandId(values.brandId ?? ''); setCityId(values.cityId ?? ''); }, [values.brandId, values.cityId]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [brandResponse, cityResponse] = await Promise.all([api.get('/catalog/brands'), api.get('/catalog/cities')]);
        if (active) { setBrands(Array.isArray(brandResponse.data) ? brandResponse.data : []); setCities(Array.isArray(cityResponse.data) ? cityResponse.data : []); }
      } catch { if (active) setLookupError('Lookup options could not be loaded. Existing IDs remain selected.'); }
    }
    void load(); return () => { active = false; };
  }, []);
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const filters: Filters = {};
    for (const key of ['name', 'brandId', 'cityId', 'minPrice', 'maxPrice', 'available'] as const) {
      const value = String(form.get(key) ?? '').trim(); if (value) filters[key] = value;
    }
    onApply(filters);
  }
  return <form onSubmit={apply} aria-label="Filter products" key={JSON.stringify(values)}>
    {lookupError && <p role="alert">{lookupError}</p>}
    <label htmlFor="filter-name">Product name</label><input id="filter-name" name="name" maxLength={255} defaultValue={values.name} />
    <label htmlFor="filter-min">Minimum price</label><input id="filter-min" name="minPrice" type="number" step="0.01" min="0" defaultValue={values.minPrice} />
    <label htmlFor="filter-max">Maximum price</label><input id="filter-max" name="maxPrice" type="number" step="0.01" min="0" defaultValue={values.maxPrice} />
    <label htmlFor="filter-brand">Brand</label><select id="filter-brand" name="brandId" value={brandId} onChange={e=>setBrandId(e.target.value)}>
      {brandId && !brands.some(b=>String(b.id)===brandId) && <option value={brandId}>Selected brand #{brandId}</option>}
      <option value="">All brands</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
    <label htmlFor="filter-city">City</label><select id="filter-city" name="cityId" value={cityId} onChange={e=>setCityId(e.target.value)}>
      {cityId && !cities.some(c=>String(c.id)===cityId) && <option value={cityId}>Selected city #{cityId}</option>}
      <option value="">All cities</option>{cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select>
    <label htmlFor="filter-available">Availability</label><select id="filter-available" name="available" defaultValue={values.available ?? ''}>
      <option value="">All</option><option value="true">Available</option><option value="false">Unavailable</option></select>
    <button type="submit">Apply filters</button><button type="button" onClick={() => onApply({})}>Clear filters</button>
  </form>;
}
