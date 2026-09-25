import { useState } from 'react';
import { api } from '../../api/client';
type Preview = { total: number; newRecords: number; alreadyImported: number; errors: string[] };

export default function ImportPage() {
  const [bundle, setBundle] = useState<unknown>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function inspect(file?: File) {
    setPreview(null); setBundle(null); setError(''); setMessage('');
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Choose a bundle smaller than 5 MB.'); return; }
    setBusy(true);
    try {
      const value: unknown = JSON.parse(await file.text());
      const response = await api.post<Preview>('/imports/preview', value);
      setBundle(value); setPreview(response.data);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }
  async function apply() {
    if (!bundle || !preview || preview.errors.length) return;
    setBusy(true); setError('');
    try {
      const response = await api.post<Preview>('/imports/apply', bundle);
      setMessage(`Imported ${response.data.newRecords} records; ${response.data.alreadyImported} were already present.`);
      setPreview(null); setBundle(null);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="page-container"><div className="page-card"><h1>Import inventory</h1>
    <p>Use a reviewed version 1 bundle from a backed-up source. Import preserves source identities and never merges records by name. Keep the source backup for reconciliation.</p>
    <label htmlFor="import-file">Normalized JSON bundle</label><input id="import-file" type="file" accept="application/json,.json" disabled={busy}
      onChange={event => void inspect(event.target.files?.[0])} />
    {busy && <p role="status">Processing…</p>}{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {preview && <section><h2>Preview</h2><p>{preview.total} records: {preview.newRecords} new, {preview.alreadyImported} already imported.</p>
      <ul>{preview.errors.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
      <button type="button" disabled={busy || preview.errors.length > 0} onClick={() => void apply()}>Apply reviewed import</button>
    </section>}
  </div></div>;
}
