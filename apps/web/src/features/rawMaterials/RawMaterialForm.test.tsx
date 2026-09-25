import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RawMaterialForm from './RawMaterialForm';
import rawMaterialsReducer from './rawMaterialsSlice';
import { api } from '../../api/client';
import type { RawMaterialDto } from '../../types/api';

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
  const { preloadedState, route = '/raw-materials/new' } = options;
  const store = configureStore({
    reducer: { rawMaterials: rawMaterialsReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/raw-materials/new" element={ui} />
          <Route path="/raw-materials/:id/edit" element={ui} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('RawMaterialForm', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('shows New Raw Material and form when route is /raw-materials/new', () => {
    renderWithProviders(<RawMaterialForm />, { route: '/raw-materials/new' });
    expect(screen.getByRole('heading', { name: /new raw material/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('on create success calls create API', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, code: 'RM1', name: 'Raw 1', stockQuantity: 100 } as RawMaterialDto,
    });
    renderWithProviders(<RawMaterialForm />, { route: '/raw-materials/new' });
    fireEvent.change(screen.getByLabelText(/code/i), { target: { value: 'RM1' } });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Raw 1' } });
    fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/raw-materials', expect.any(Object))
    );
    expect(screen.getByRole('link', { name: /back to list/i })).toBeInTheDocument();
  });

  it('shows Edit Raw Material and filled fields when data is loaded', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, code: 'RM1', name: 'Steel', stockQuantity: 50 },
    });
    renderWithProviders(<RawMaterialForm />, { route: '/raw-materials/1/edit' });
    await waitFor(() => expect(screen.getByDisplayValue('RM1')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /edit raw material/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Steel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('shows error message when state has error', () => {
    renderWithProviders(<RawMaterialForm />, {
      preloadedState: {
        rawMaterials: {
          items: [],
          current: null,
          loading: false,
          error: 'Raw material code already exists',
          selectionList: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 20,
        },
      },
    });
    expect(screen.getAllByText(/raw material code already exists/i).length).toBeGreaterThanOrEqual(1);
  });

  it('on edit submit calls updateRawMaterial', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, code: 'RM1', name: 'Raw 1', stockQuantity: 100 },
    });
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 1, code: 'RM1', name: 'Updated', stockQuantity: 200 },
    });
    renderWithProviders(<RawMaterialForm />, { route: '/raw-materials/1/edit' });
    await waitFor(() => expect(screen.getByDisplayValue('RM1')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/stock quantity/i), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /update/i }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/raw-materials/1', expect.any(Object))
    );
  });
});
