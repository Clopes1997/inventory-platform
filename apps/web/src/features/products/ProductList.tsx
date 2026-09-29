import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchProducts, deleteProduct } from './productsSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import type { ProductDto } from '../../types/api';
import { getErrorMessage } from '../../utils/errorMessage';
import { showConfirm } from '../../utils/alerts';
import ProductFiltersForm from '../catalog/ProductFilters';
import type { ProductFilters } from './productsSlice';
import { api } from '../../api/client';

const PAGE_SIZE = 20;

export default function ProductList() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const filters = useMemo<ProductFilters>(() => {
    const result: ProductFilters = {};
    for (const key of ['name', 'brandId', 'cityId', 'minPrice', 'maxPrice', 'available'] as const) {
      const value = searchParams.get(key); if (value) result[key] = value;
    }
    return result;
  }, [searchParams]);
  const filtered = Object.keys(filters).length > 0;
  const [stats, setStats] = useState<{ productCount: number; finishedStockUnits: number; finishedStockValue: number } | null>(null);
  useEffect(() => {
    let active = true; setStats(null);
    api.get('/catalog/stats', { params: filters }).then(response => {
      if (active && typeof response?.data?.productCount === 'number') setStats(response.data);
    }).catch(() => {});
    return () => { active = false; };
  }, [filters]);
  const { items, loading, error, page, totalPages, totalElements } = useAppSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts({ page: pageFromUrl, size: PAGE_SIZE, ...(filtered ? { filters } : {}) }));
  }, [dispatch, pageFromUrl, filtered, filters]);

  const loadPage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      });
    }
  };

  const loadAll = () => {
    if (filtered) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    });
    dispatch(fetchProducts({ all: true }));
  };

  const handleDelete = async (id: number, code: string) => {
    const confirmed = await showConfirm(`Soft-delete product "${code}"?`);
    if (!confirmed) return;

    dispatch(deleteProduct(id))
      .unwrap()
      .then(() => toast.success('Product deleted.'))
      .catch((err: unknown) => toast.error(getErrorMessage(err)));
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Products</h1>
        <div className="loading-spinner-wrap" aria-busy="true" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading products…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-title">Products</h1>
          <p className="error" role="alert">Error: {error}</p>
          <ProductFiltersForm values={filters} onApply={next => setSearchParams(new URLSearchParams(next))} />
          <button type="button" className="btn btn-primary" onClick={() => dispatch(fetchProducts({ page: pageFromUrl, size: PAGE_SIZE, ...(filtered ? { filters } : {}) }))} aria-label="Retry loading products">
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
          <div><h1 className="page-title">Products</h1>
          <p className="subtitle">Manage your product catalog</p></div>
          <div className="page-header-actions">
            <Link to="/products/new" className="btn btn-primary" data-testid="link-new-product">
              Add Product
            </Link>
          </div>
        </header>
        <ProductFiltersForm values={filters} onApply={next => setSearchParams(new URLSearchParams(next))} />
        <Link to="/catalog">Manage brands and cities</Link>
        {stats && <p aria-live="polite">{stats.productCount} products · {stats.finishedStockUnits} finished units · Stock value: {stats.finishedStockValue}</p>}
        {filtered && <p>Filtered results are paginated; clear filters to use Show all.</p>}
        <div className="table-wrapper product-table" role="region" aria-label="Products table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Value</th>
                <th>Finished stock</th>
                <th>Availability</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No products found.</div>
                  </td>
                </tr>
              ) : (
              items.map((p: ProductDto) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>{p.name}</td>
                  <td>{Number(p.price)}</td>
                  <td>{p.finishedStock ?? 0}</td>
                  <td>{p.available === false ? 'Unavailable' : 'Available'}</td>
                  <td className="action-cell">
                    <Link to={`/products/${p.id}/edit`} className="btn btn-secondary btn-sm" data-testid="product-edit-link">
                      Edit
                    </Link>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.code)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
        <nav className="pagination" aria-label="Products pagination">
        {totalPages > 1 ? (
          <>
            <button type="button" className="btn btn-secondary" disabled={page <= 0} onClick={() => loadPage(page - 1)} aria-label="Previous page">
              Previous
            </button>
            <span aria-live="polite">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} products
            </span>
            <button type="button" className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => loadPage(page + 1)} aria-label="Next page">
              Next
            </button>
          </>
        ) : totalElements > 0 ? (
          <span aria-live="polite" className="pagination-summary">Showing {totalElements} of {totalElements} products</span>
        ) : null}
        <button type="button" className="btn btn-secondary btn-gap-left" disabled={filtered} onClick={loadAll} aria-label="Load all products">
          Load all
        </button>
        </nav>
      </div>
    </div>
  );
}
