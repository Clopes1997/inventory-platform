import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductionSuggestion from './ProductionSuggestion';
import productionReducer from './productionSlice';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({ api: { get: vi.fn() } }));

interface RenderOptions {
  preloadedState?: object;
}
const noOptions: RenderOptions = {};
function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = noOptions
) {
  const { preloadedState } = options;
  const store = configureStore({
    reducer: { production: productionReducer },
    preloadedState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('ProductionSuggestion', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('shows error and Retry button when fetch fails; retry dispatches fetch again', async () => {
    const mockGet = api.get as ReturnType<typeof vi.fn>;
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    mockGet.mockResolvedValueOnce({
      data: {
        items: [{ productId: 1, productCode: 'P1', productName: 'Product 1', maxProducibleQuantity: 1, unitPrice: 10, lineValue: 10 }],
        totalProductionValue: 10,
        totalCount: 1,
      },
    });

    renderWithProviders(<ProductionSuggestion />);
    await waitFor(() => expect(screen.getByText(/error: network error/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry loading suggestion/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry loading suggestion/i }));
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('shows loading then table and total when fetch succeeds', async () => {
    const items = [
      { productId: 1, productCode: 'P1', productName: 'Product 1', maxProducibleQuantity: 5, unitPrice: 10, lineValue: 50 },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { items, totalProductionValue: 50, totalCount: 1 },
    });
    renderWithProviders(<ProductionSuggestion />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
    expect(screen.getByTestId('production-total-value')).toHaveTextContent('50.00');
    expect(screen.getByTestId('production-total-value')).not.toHaveTextContent('$');
    expect(screen.getByRole('button', { name: /generate suggestion/i })).toBeInTheDocument();
  });

  it('shows empty state when fetch returns no items', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { items: [], totalProductionValue: 0, totalCount: 0 },
    });
    renderWithProviders(<ProductionSuggestion />);
    await waitFor(() => expect(screen.getByText(/no producible products/i)).toBeInTheDocument());
  });
});
