import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type {
  ProductionSuggestionResponseDto,
  ProductionSuggestionItemDto,
} from '../../types/api';

export const fetchSuggestion = createAsyncThunk<
  ProductionSuggestionResponseDto,
  { limit?: number },
  { rejectValue: string }
>(
  'production/fetchSuggestion',
  async ({ limit } = {}, { rejectWithValue }) => {
    try {
      const params = limit != null ? { limit } : {};
      const { data } = await api.get<ProductionSuggestionResponseDto>('/production/suggestion', {
        params,
      });
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface ProductionState {
  items: ProductionSuggestionItemDto[];
  totalProductionValue: number;
  totalCount: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductionState = {
  items: [],
  totalProductionValue: 0,
  totalCount: null,
  loading: false,
  error: null,
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuggestion.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.items ?? [];
        state.totalProductionValue = payload.totalProductionValue ?? 0;
        state.totalCount = payload.totalCount ?? (payload.items?.length ?? null);
      })
      .addCase(fetchSuggestion.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      });
  },
});

export default productionSlice.reducer;
