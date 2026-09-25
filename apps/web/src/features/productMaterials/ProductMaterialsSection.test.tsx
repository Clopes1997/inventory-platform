import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductMaterialsSection from './ProductMaterialsSection';
import productMaterialsReducer from './productMaterialsSlice';
import rawMaterialsReducer from '../rawMaterials/rawMaterialsSlice';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

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
    reducer: {
      productMaterials: productMaterialsReducer,
      rawMaterials: rawMaterialsReducer,
    },
    preloadedState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('ProductMaterialsSection', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('renders nothing when productId is missing', () => {
    renderWithProviders(<ProductMaterialsSection productId="" />);
    expect(screen.queryByText(/raw materials \(recipe\)/i)).not.toBeInTheDocument();
  });

  it('shows Raw materials (recipe) and fetches materials when productId is set', async () => {
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }] });
    renderWithProviders(<ProductMaterialsSection productId="1" />);
    expect(screen.getByText(/raw materials \(recipe\)/i)).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/products/1/materials'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/raw-materials', expect.objectContaining({ params: { all: true } })));
  });

  it('shows empty message when no materials', async () => {
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }] });
    renderWithProviders(<ProductMaterialsSection productId="1" />);
    await waitFor(() => expect(screen.getByText(/no materials/i)).toBeInTheDocument());
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('shows materials table when items are loaded', async () => {
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            rawMaterialId: 1,
            rawMaterialCode: 'RM1',
            rawMaterialName: 'Steel',
            requiredQuantity: 5,
          },
        ],
      })
      .mockResolvedValueOnce({ data: [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }] });
    renderWithProviders(<ProductMaterialsSection productId="1" />);
    await waitFor(() => expect(screen.getByText(/RM1.*Steel/)).toBeInTheDocument());
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('on add success appends row and clears add form', async () => {
    const rawMaterialsPayload = { content: [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }] };
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: rawMaterialsPayload });
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        id: 10,
        rawMaterialId: 1,
        rawMaterialCode: 'RM1',
        rawMaterialName: 'Steel',
        requiredQuantity: 10,
      },
    });
    renderWithProviders(<ProductMaterialsSection productId="1" />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/products/1/materials', expect.any(Object))
    );
  });

  it('shows error and Dismiss when add fails', async () => {
    const rawMaterialsPayload = { content: [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }] };
    (api.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: rawMaterialsPayload });
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Product already has this raw material'));
    renderWithProviders(<ProductMaterialsSection productId="1" />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    );
  });
});
