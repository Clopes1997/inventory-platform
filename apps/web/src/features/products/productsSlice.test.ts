import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer, {
  fetchProducts,
  createProduct,
  deleteProduct,
  clearError,
  type ProductsState,
} from './productsSlice';
import type { ProductDto, PageDto } from '../../types/api';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import('../../api/client');

type TestRootState = { products: ProductsState };

describe('productsSlice', () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({ reducer: { products: productsReducer } }) as ReturnType<typeof configureStore<TestRootState>>;
  });

  it('fetchProducts.fulfilled updates items and pagination from API PageDto', async () => {
    const content: ProductDto[] = [{ id: 1, code: 'P1', name: 'Product 1', price: 10 }];
    const pageDto: PageDto<ProductDto> = {
      content,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchProducts({ page: 0, size: 20 }) as any);
    const state = (store.getState() as TestRootState).products;
    expect(state.items).toEqual(content);
    expect(state.totalElements).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.page).toBe(0);
    expect(state.size).toBe(20);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchProducts.fulfilled with all=true sets totalPages=1, page=0, totalElements from content for "Load all" UX', async () => {
    const content: ProductDto[] = [{ id: 1, code: 'P1', name: 'Product 1', price: 10 }];
    const pageDto: PageDto<ProductDto> = {
      content,
      totalElements: 1,
      totalPages: 5,
      number: 2,
      size: 1,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchProducts({ all: true }) as any);
    const state = (store.getState() as TestRootState).products;
    expect(state.items).toEqual(content);
    expect(state.totalPages).toBe(1);
    expect(state.page).toBe(0);
    expect(state.totalElements).toBe(1);
    expect(state.size).toBe(1);
  });

  it('fetchProducts.rejected sets error', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await store.dispatch(fetchProducts({}) as any);
    expect((store.getState() as TestRootState).products.error).toBe('Network error');
    expect((store.getState() as TestRootState).products.loading).toBe(false);
  });

  it('createProduct.fulfilled sets current only (list refetched on list screen)', async () => {
    const created: ProductDto = { id: 1, code: 'X', name: 'X', price: 5 };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: created });
    await store.dispatch(createProduct({ code: 'X', name: 'X', price: 5 }) as any);
    expect((store.getState() as TestRootState).products.current).toEqual(created);
    expect((store.getState() as TestRootState).products.items).not.toContainEqual(created);
  });

  it('deleteProduct.fulfilled removes item from state', async () => {
    const pageDto: PageDto<ProductDto> = {
      content: [{ id: 1, code: 'P1', name: 'P1', price: 1 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchProducts({ page: 0, size: 20 }) as any);
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    await store.dispatch(deleteProduct(1) as any);
    expect((store.getState() as TestRootState).products.items).toHaveLength(0);
  });

  it('clearError resets error', () => {
    store = configureStore({
      reducer: { products: productsReducer },
      preloadedState: {
        products: {
          items: [],
          current: null,
          loading: false,
          error: 'Some error',
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 20,
        },
      },
    }) as ReturnType<typeof configureStore<TestRootState>>;
    store.dispatch(clearError());
    expect((store.getState() as TestRootState).products.error).toBeNull();
  });
});
