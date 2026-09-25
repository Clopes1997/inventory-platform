import { useEffect, useState } from 'react';
import { fetchSuggestion } from './productionSlice';
import { useAppDispatch, useAppSelector } from '../../store';

const LIMIT_OPTIONS = [50, 100, 250, 500, 1000] as const;

export default function ProductionSuggestion() {
  const dispatch = useAppDispatch();
  const { items, totalProductionValue, totalCount, loading, error } =
    useAppSelector((state) => state.production);
  const [limit, setLimit] = useState<number>(500);

  useEffect(() => {
    dispatch(fetchSuggestion({ limit }));
  }, [dispatch, limit]);

  const handleRefresh = () => dispatch(fetchSuggestion({ limit }));

  if (loading) {
    return (
      <div className="page-container" data-testid="production-suggestion-page">
        <h1 className="page-title">Production Suggestions</h1>
        <div className="loading-spinner-wrap" aria-busy="true" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading production suggestion…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-title">Production Suggestions</h1>
          <p className="error" role="alert">Error: {error}</p>
          <button type="button" className="btn btn-primary" onClick={handleRefresh} aria-label="Retry loading suggestion">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayTotal = totalCount ?? items?.length ?? 0;
  const showingLimit = displayTotal > 0 && items.length < displayTotal;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  /* Top 3 by line value get high-value row styling */
  const sortedByValue = [...items].sort((a, b) => Number(b.lineValue) - Number(a.lineValue));
  const topProductIds = new Set(sortedByValue.slice(0, 3).map((r) => r.productId));

  return (
    <div className="page-container" data-testid="production-suggestion-page">
      <div className="page-card">
        <header className="page-header">
          <h1 className="page-title">Production Suggestions</h1>
          <p className="subtitle">Independent production possibilities based on available stock</p>
        </header>
        <p className="info-note" role="note">
          Calculation is performed per product independently. Raw materials are not globally allocated across products.
          Summed values describe independent possibilities, not a simultaneous production plan.
        </p>
        {totalCount === null && <p role="note">Results are limited; the full catalog count has not been calculated.</p>}
        <div className="form-inline">
          <div className="form-group form-group-inline">
            <label htmlFor="production-limit">Max items</label>
            <select
              id="production-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="Maximum number of products to show"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleRefresh}>
            Generate Suggestion
          </button>
        </div>
        {showingLimit && (
          <p className="loading production-limit-msg">
            Showing top {items.length} of {displayTotal} producible products (by value).
          </p>
        )}
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">No producible products with current stock.</div>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.productId}
                    className={topProductIds.has(row.productId) ? 'production-row-high-value' : undefined}
                  >
                    <td>{row.productName}</td>
                    <td>{Number(row.maxProducibleQuantity)}</td>
                    <td>{formatCurrency(Number(row.unitPrice))}</td>
                    <td>{formatCurrency(Number(row.lineValue))}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="table-foot-label">
                  Total Estimated Revenue
                </td>
                <td data-testid="production-total-value">{formatCurrency(Number(totalProductionValue))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {items.length > 0 && (
          <div className="production-total-value" aria-live="polite">
            <span className="production-total-value-label">Total estimated revenue</span>
            <span data-testid="production-total-value-display">{formatCurrency(Number(totalProductionValue))}</span>
          </div>
        )}
      </div>
    </div>
  );
}
