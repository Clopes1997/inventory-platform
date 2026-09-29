import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { CatalogLookup } from '../../types/api';

function LookupEditor({ kind }: { kind: 'brands' | 'cities' }) {
  const [items, setItems] = useState<CatalogLookup[]>([]);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    api.get<CatalogLookup[]>(`/catalog/${kind}`).then(response => { if (active) setItems(response.data); })
      .catch(() => { if (active) setError('Could not load catalog entries.'); });
    return () => { active = false; };
  }, [kind]);
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await api.post<CatalogLookup>(`/catalog/${kind}`, { name: name.trim(), manufacturer: kind === 'brands' ? manufacturer : undefined });
      setItems(previous => [...previous, response.data]); setName(''); setManufacturer('');
    } catch (failure) { setError((failure as Error).message); }
    finally { setSaving(false); }
  }
  return <section><h2 className="section-title">{kind === 'brands' ? 'Brands' : 'Cities'}</h2>
    {error && <p role="alert">{error}</p>}
    <ul>{items.map(item => <li key={item.id}>{item.name}{item.manufacturer ? ` — ${item.manufacturer}` : ''}</li>)}</ul>
    <form onSubmit={save}>
      <label htmlFor={`${kind}-name`}>Name</label><input id={`${kind}-name`} required maxLength={255} value={name} onChange={event => setName(event.target.value)} />
      {kind === 'brands' && <><label htmlFor="manufacturer">Manufacturer</label><input id="manufacturer" maxLength={255} value={manufacturer} onChange={event => setManufacturer(event.target.value)} /></>}
      <button disabled={saving} type="submit">{saving ? 'Saving…' : 'Add'}</button>
    </form>
  </section>;
}

export default function CatalogPage() {
  return <div className="page-container catalog-workspace"><div className="page-card"><h1 className="page-title">Catalog reference data</h1>
    <Link to="/products">Back to products</Link><LookupEditor kind="brands" /><LookupEditor kind="cities" />
  </div></div>;
}
