import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchRawMaterials, deleteRawMaterial } from './rawMaterialsSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import type { RawMaterialDto } from '../../types/api';
import { getErrorMessage } from '../../utils/errorMessage';
import { showConfirm } from '../../utils/alerts';

const PAGE_SIZE = 20;

export default function RawMaterialList() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const { items, loading, error, page, totalPages, totalElements } = useAppSelector(
    (state) => state.rawMaterials
  );

  useEffect(() => {
    dispatch(fetchRawMaterials({ page: pageFromUrl, size: PAGE_SIZE }));
  }, [dispatch, pageFromUrl]);

  const loadPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      });
      dispatch(fetchRawMaterials({ page: newPage, size: PAGE_SIZE }));
    }
  };

  const loadAll = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    });
    dispatch(fetchRawMaterials({ all: true }));
  };

  const handleDelete = async (id: number, code: string) => {
    const confirmed = await showConfirm(`Soft-delete raw material "${code}"?`);
    if (!confirmed) return;

    dispatch(deleteRawMaterial(id))
      .unwrap()
      .then(() => toast.success('Raw material deleted.'))
      .catch((err: unknown) => toast.error(getErrorMessage(err)));
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Raw Materials</h1>
        <div className="loading-spinner-wrap" aria-busy="true" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading raw materials…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-title">Raw Materials</h1>
          <p className="error" role="alert">Error: {error}</p>
          <button type="button" className="btn btn-primary" onClick={() => dispatch(fetchRawMaterials({ page: pageFromUrl, size: PAGE_SIZE }))} aria-label="Retry loading raw materials">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <header className="page-header">
          <h1 className="page-title">Raw Materials</h1>
          <p className="subtitle">Manage raw material stock</p>
          <div className="page-header-actions">
            <Link to="/raw-materials/new" className="btn btn-primary" data-testid="link-new-raw-material">
              Add Raw Material
            </Link>
          </div>
        </header>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Stock quantity</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">No raw materials found.</div>
                  </td>
                </tr>
              ) : (
              items.map((r: RawMaterialDto) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{Number(r.stockQuantity)}</td>
                  <td className="action-cell">
                    <Link to={`/raw-materials/${r.id}/edit`} className="btn btn-secondary btn-sm" data-testid="raw-material-edit-link">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(r.id, r.code)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
        <nav className="pagination" aria-label="Raw materials pagination">
        {totalPages > 1 ? (
          <>
            <button type="button" className="btn btn-secondary" disabled={page <= 0} onClick={() => loadPage(page - 1)} aria-label="Previous page">
              Previous
            </button>
            <span aria-live="polite">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} raw materials
            </span>
            <button type="button" className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => loadPage(page + 1)} aria-label="Next page">
              Next
            </button>
          </>
        ) : totalElements > 0 ? (
          <span aria-live="polite" className="pagination-summary">Showing {totalElements} of {totalElements} raw materials</span>
        ) : null}
        <button type="button" className="btn btn-secondary btn-gap-left" onClick={loadAll} aria-label="Load all raw materials">
          Load all
        </button>
        </nav>
      </div>
    </div>
  );
}
