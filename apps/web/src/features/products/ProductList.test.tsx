import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import ProductList from './ProductList';
import productsReducer from './productsSlice';
import { api } from '../../api/client';
import type { ProductDto, PageDto } from '../../types/api';

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
    reducer: { products: productsReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

describe('ProductList', () => {
  beforeEach((): void => {
    vi.resetAllMocks();
  });

  it('shows loading then table when fetch succeeds', async () => {
    const items: ProductDto[] = [
      { id: 1, code: 'A', name: 'Product A', price: 10 },
      { id: 2, code: 'B', name: 'Product B', price: 20 },
    ];
    const pageDto: PageDto<ProductDto> = {
      content: items,
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => Promise.resolve({ data: url === '/products' ? pageDto : [] }));
    renderWithProviders(<ProductList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Product A')).toBeInTheDocument());
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /code/i })).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => url === '/products' ? Promise.reject(new Error('Failed to load')) : Promise.resolve({ data: [] }));
    renderWithProviders(<ProductList />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });

  it('shows empty message when fetch returns empty', async () => {
    const pageDto: PageDto<ProductDto> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => Promise.resolve({ data: url === '/products' ? pageDto : [] }));
    renderWithProviders(<ProductList />);
    await waitFor(() => expect(screen.getByText(/no products/i)).toBeInTheDocument());
  });
});
