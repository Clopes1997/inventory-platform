import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import RawMaterialList from './RawMaterialList';
import rawMaterialsReducer from './rawMaterialsSlice';
import { api } from '../../api/client';
import type { RawMaterialDto, PageDto } from '../../types/api';

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
    reducer: { rawMaterials: rawMaterialsReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}

describe('RawMaterialList', () => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('shows loading then table when fetch succeeds', async () => {
    const items: RawMaterialDto[] = [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }];
    const pageDto: PageDto<RawMaterialDto> = {
      content: items,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    renderWithProviders(<RawMaterialList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Steel')).toBeInTheDocument());
    expect(screen.getByText('RM1')).toBeInTheDocument();
  });
});
