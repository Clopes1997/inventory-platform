import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { DashboardStatsDto } from '../../types/api';
import type { ProductionSuggestionItemDto } from '../../types/api';

const PRODUCTION_PREVIEW_LIMIT = 5;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [productionPreview, setProductionPreview] = useState<ProductionSuggestionItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<DashboardStatsDto>('/dashboard/stats'),
      api.get<{ items: ProductionSuggestionItemDto[] }>('/production/suggestion', {
        params: { limit: PRODUCTION_PREVIEW_LIMIT },
      }),
    ])
      .then(([statsRes, prodRes]) => {
        if (!cancelled) {
          setStats(statsRes.data);
          setProductionPreview(prodRes.data.items ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>
        <div className="loading-spinner-wrap" aria-busy="true" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-title">Dashboard</h1>
          <p className="error" role="alert">
            Error: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="subtitle">Overview of your inventory and production</p>
        </header>
        <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card-label">Total Products</span>
          <span className="stat-card-value">{stats ? formatNumber(stats.productCount) : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total Raw Materials</span>
          <span className="stat-card-value">
            {stats ? formatNumber(stats.rawMaterialCount) : '—'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Finished Stock Units</span>
          <span className="stat-card-value">
            {stats ? formatNumber(Number(stats.finishedStockUnits)) : '—'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Finished Stock Value</span>
          <span className="stat-card-value">
            {stats ? formatCurrency(Number(stats.finishedStockValue)) : '—'}
          </span>
        </div>
        </div>
        <section className="dashboard-section">
          <h2 className="section-title dashboard-section-title">Production Potential by Product</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Possible Qty</th>
                  <th>Unit Value</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {productionPreview.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">No producible products with current stock.</div>
                    </td>
                  </tr>
                ) : (
                productionPreview.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.productName}</td>
                    <td>{formatNumber(Number(row.maxProducibleQuantity))}</td>
                    <td>{formatCurrency(Number(row.unitPrice))}</td>
                    <td>{formatCurrency(Number(row.lineValue))}</td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
          <p className="page-header-actions">
            <Link to="/production" className="btn btn-primary">
              View full production suggestion
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
