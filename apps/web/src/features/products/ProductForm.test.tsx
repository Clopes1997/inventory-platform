import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductForm from './ProductForm';
import productsReducer from './productsSlice';
import productMaterialsReducer from '../productMaterials/productMaterialsSlice';
import rawMaterialsReducer from '../rawMaterials/rawMaterialsSlice';
import { api } from '../../api/client';
import type { ProductDto } from '../../types/api';

vi.mock('../../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

interface RenderOptions {
  preloadedState?: object;
  route?: string;
}
const noOptions: RenderOptions = {};
function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = noOptions
) {
  const { preloadedState, route = '/products/new' } = options;
  const store = configureStore({
    reducer: {
      products: productsReducer,
      productMaterials: productMaterialsReducer,
      rawMaterials: rawMaterialsReducer,
    },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/products/new" element={ui} />
          <Route path="/products/:id/edit" element={ui} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ProductForm', () => {
  beforeEach((): void => {
    vi.resetAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
  });

  it('shows New Product and create form when route is /products/new', () => {
    renderWithProviders(<ProductForm />, { route: '/products/new' });
    expect(screen.getByRole('heading', { name: /new product/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('on create success calls createProduct and shows Back to list', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 99, code: 'X', name: 'X', price: 5 } as ProductDto,
    });
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    renderWithProviders(<ProductForm />, { route: '/products/new' });
    fireEvent.change(screen.getByLabelText(/code/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/products', expect.any(Object)));
    expect(screen.getByRole('link', { name: /back to list/i })).toBeInTheDocument();
  });

  it('shows Edit Product and filled fields when current product is loaded', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/catalog/')) return Promise.resolve({ data: [] });
      if (url === '/products/1')
        return Promise.resolve({ data: { id: 1, code: 'P1', name: 'Product 1', price: 10.5 } });
      if (url.includes('/materials')) return Promise.resolve({ data: [] });
      if (url === '/raw-materials' || url.startsWith('/raw-materials?')) return Promise.resolve({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 } });
      return Promise.resolve({ data: null });
    });
    renderWithProviders(<ProductForm />, { route: '/products/1/edit' });
    await waitFor(() => expect(screen.getByDisplayValue('P1')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /edit product/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Product 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10.5')).toBeInTheDocument();
  });

  it('shows error message when state has error', () => {
    renderWithProviders(<ProductForm />, {
      preloadedState: {
        products: {
          items: [],
          current: null,
          loading: false,
          error: 'Product code already exists',
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 20,
        },
      },
    });
    expect(screen.getAllByText(/product code already exists/i).length).toBeGreaterThanOrEqual(1);
  });

  it('on edit submit calls updateProduct with payload', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/catalog/')) return Promise.resolve({ data: [] });
      if (url === '/products/1')
        return Promise.resolve({ data: { id: 1, code: 'P1', name: 'Product 1', price: 10 } });
      if (url.includes('/materials')) return Promise.resolve({ data: [] });
      if (url === '/raw-materials' || url.startsWith('/raw-materials?')) return Promise.resolve({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 } });
      return Promise.resolve({ data: null });
    });
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, code: 'P1', name: 'Updated', price: 20 },
    });
    renderWithProviders(<ProductForm />, { route: '/products/1/edit' });
    await waitFor(() => expect(screen.getByDisplayValue('P1')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/products/1', expect.any(Object)));
  });
});
