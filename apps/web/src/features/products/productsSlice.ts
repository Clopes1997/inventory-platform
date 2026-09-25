import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { ProductDto, PageDto } from '../../types/api';

export type ProductFilters = Partial<Record<'name' | 'brandId' | 'cityId' | 'minPrice' | 'maxPrice' | 'available', string>>;

export const fetchProducts = createAsyncThunk<
  PageDto<ProductDto>,
  { page?: number; size?: number; all?: boolean; filters?: ProductFilters },
  { rejectValue: string }
>(
  'products/fetchAll',
  async ({ page = 0, size = 20, all, filters } = {}, { rejectWithValue }) => {
    try {
      const params: { page?: number; size?: number; all?: boolean } = all ? { all: true } : { page, size };
      const { data } = await api.get<PageDto<ProductDto>>(filters ? '/catalog/products' : '/products', { params: filters ? { page, size, ...filters } : params });
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const fetchProductById = createAsyncThunk<
  ProductDto,
  number | string,
  { rejectValue: string }
>(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ProductDto>(`/products/${id}`);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const createProduct = createAsyncThunk<
  ProductDto,
  Omit<ProductDto, 'id'>,
  { rejectValue: string }
>(
  'products/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ProductDto>('/products', payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const updateProduct = createAsyncThunk<
  ProductDto,
  { id: number } & Partial<Omit<ProductDto, 'id'>>,
  { rejectValue: string }
>(
  'products/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<ProductDto>(`/products/${id}`, payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const deleteProduct = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface ProductsState {
  items: ProductDto[];
  current: ProductDto | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

const initialState: ProductsState = {
  items: [],
  current: null,
  loading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 20,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, { payload, meta }) => {
        state.loading = false;
        // Backend always returns PageDto (both paginated and ?all=true).
        const content = Array.isArray(payload.content) ? payload.content : [];
        state.items = content;
        const isAllLoaded = (meta.arg as { all?: boolean })?.all === true;
        if (isAllLoaded) {
          state.totalElements = content.length;
          state.totalPages = 1;
          state.page = 0;
          state.size = content.length || 20;
        } else {
          state.totalElements = payload.totalElements ?? content.length;
          state.totalPages = payload.totalPages ?? 1;
          state.page = payload.number ?? 0;
          state.size = payload.size ?? 20;
        }
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(fetchProductById.fulfilled, (state, { payload }) => {
        state.current = payload;
      })
      .addCase(fetchProductById.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.current = payload;
      })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((p) => p.id === payload.id);
        if (i >= 0) state.items[i] = payload;
        state.current = payload;
      })
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((p) => p.id !== payload);
        if (state.current?.id === payload) state.current = null;
      });
  },
});

export const { clearCurrent, clearError } = productsSlice.actions;
export default productsSlice.reducer;
