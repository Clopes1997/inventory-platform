import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { ProductMaterialDto } from '../../types/api';

export const fetchProductMaterials = createAsyncThunk<
  { productId: number | string; data: ProductMaterialDto[] },
  number | string,
  { rejectValue: string }
>(
  'productMaterials/fetchByProductId',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ProductMaterialDto[]>(
        `/products/${productId}/materials`
      );
      return { productId, data };
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const addProductMaterial = createAsyncThunk<
  ProductMaterialDto,
  { productId: number; rawMaterialId: number; requiredQuantity: number },
  { rejectValue: string }
>(
  'productMaterials/add',
  async ({ productId, rawMaterialId, requiredQuantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ProductMaterialDto>(
        `/products/${productId}/materials`,
        { rawMaterialId, requiredQuantity }
      );
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const updateProductMaterial = createAsyncThunk<
  ProductMaterialDto,
  {
    productId: number;
    id: number;
    rawMaterialId: number;
    requiredQuantity: number;
  },
  { rejectValue: string }
>(
  'productMaterials/update',
  async ({ productId, id, rawMaterialId, requiredQuantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<ProductMaterialDto>(
        `/products/${productId}/materials/${id}`,
        { rawMaterialId, requiredQuantity }
      );
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const deleteProductMaterial = createAsyncThunk<
  number,
  { productId: number; id: number },
  { rejectValue: string }
>(
  'productMaterials/delete',
  async ({ productId, id }, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${productId}/materials/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface ProductMaterialsState {
  items: ProductMaterialDto[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductMaterialsState = {
  items: [],
  loading: false,
  error: null,
};

const productMaterialsSlice = createSlice({
  name: 'productMaterials',
  initialState,
  reducers: {
    clearMaterials: (state) => {
      state.items = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductMaterials.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data;
      })
      .addCase(fetchProductMaterials.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(addProductMaterial.fulfilled, (state, { payload }) => {
        state.items.push(payload);
      })
      .addCase(addProductMaterial.rejected, (state, { payload }) => {
        state.error = (payload as string) ?? 'Failed to add material';
      })
      .addCase(updateProductMaterial.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((m) => m.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      .addCase(updateProductMaterial.rejected, (state, { payload }) => {
        state.error = (payload as string) ?? 'Failed to update material';
      })
      .addCase(deleteProductMaterial.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((m) => m.id !== payload);
      })
      .addCase(deleteProductMaterial.rejected, (state, { payload }) => {
        state.error = (payload as string) ?? 'Failed to remove material';
      });
  },
});

export const { clearMaterials, clearError } = productMaterialsSlice.actions;
export default productMaterialsSlice.reducer;
