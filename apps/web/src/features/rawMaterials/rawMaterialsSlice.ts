import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { RawMaterialDto, PageDto } from '../../types/api';

export const fetchRawMaterials = createAsyncThunk<
  PageDto<RawMaterialDto>,
  { page?: number; size?: number; all?: boolean },
  { rejectValue: string }
>(
  'rawMaterials/fetchAll',
  async ({ page = 0, size = 20, all } = {}, { rejectWithValue }) => {
    try {
      const params: { page?: number; size?: number; all?: boolean } = all ? { all: true } : { page, size };
      const { data } = await api.get<PageDto<RawMaterialDto>>('/raw-materials', { params });
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

/** Uses GET /raw-materials?all=true which returns PageDto; we extract content for selection list. */
export const fetchRawMaterialsForSelection = createAsyncThunk<
  RawMaterialDto[],
  void,
  { rejectValue: string }
>(
  'rawMaterials/fetchForSelection',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<PageDto<RawMaterialDto>>('/raw-materials', {
        params: { all: true },
      });
      return (data && 'content' in data && Array.isArray(data.content)) ? data.content : [];
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const fetchRawMaterialById = createAsyncThunk<
  RawMaterialDto,
  number | string,
  { rejectValue: string }
>(
  'rawMaterials/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<RawMaterialDto>(`/raw-materials/${id}`);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const createRawMaterial = createAsyncThunk<
  RawMaterialDto,
  Omit<RawMaterialDto, 'id'>,
  { rejectValue: string }
>(
  'rawMaterials/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<RawMaterialDto>('/raw-materials', payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const updateRawMaterial = createAsyncThunk<
  RawMaterialDto,
  { id: number } & Partial<Omit<RawMaterialDto, 'id'>>,
  { rejectValue: string }
>(
  'rawMaterials/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<RawMaterialDto>(`/raw-materials/${id}`, payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const deleteRawMaterial = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'rawMaterials/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/raw-materials/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface RawMaterialsState {
  items: RawMaterialDto[];
  selectionList: RawMaterialDto[];
  current: RawMaterialDto | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

const initialState: RawMaterialsState = {
  items: [],
  selectionList: [],
  current: null,
  loading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 20,
};

const rawMaterialsSlice = createSlice({
  name: 'rawMaterials',
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
      .addCase(fetchRawMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRawMaterials.fulfilled, (state, { payload, meta }) => {
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
      .addCase(fetchRawMaterials.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(fetchRawMaterialById.fulfilled, (state, { payload }) => {
        state.current = payload;
      })
      .addCase(fetchRawMaterialById.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(createRawMaterial.fulfilled, (state, { payload }) => {
        state.current = payload;
      })
      .addCase(updateRawMaterial.fulfilled, (state, { payload }) => {
        const i = state.items.findIndex((r) => r.id === payload.id);
        if (i >= 0) state.items[i] = payload;
        state.current = payload;
      })
      .addCase(deleteRawMaterial.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((r) => r.id !== payload);
        if (state.current?.id === payload) state.current = null;
      })
      .addCase(fetchRawMaterialsForSelection.fulfilled, (state, { payload }) => {
        state.selectionList = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchRawMaterialsForSelection.rejected, (state) => {
        state.selectionList = [];
      });
  },
});

export const { clearCurrent, clearError } = rawMaterialsSlice.actions;
export default rawMaterialsSlice.reducer;
