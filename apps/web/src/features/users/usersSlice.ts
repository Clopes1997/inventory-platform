import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { UserDto } from '../../types/api';

export const fetchUsers = createAsyncThunk<
  UserDto[],
  void,
  { rejectValue: string }
>(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<UserDto[]>('/users');
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const fetchUserById = createAsyncThunk<
  UserDto,
  number | string,
  { rejectValue: string }
>(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<UserDto>(`/users/${id}`);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const createUser = createAsyncThunk<
  UserDto,
  { username: string; password: string; role: string },
  { rejectValue: string }
>(
  'users/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<UserDto>('/users', payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const updateUser = createAsyncThunk<
  UserDto,
  { id: number } & Partial<Pick<UserDto, 'username' | 'role'>> & { password?: string },
  { rejectValue: string }
>(
  'users/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<UserDto>(`/users/${id}`, payload);
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface UsersState {
  items: UserDto[];
  current: UserDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
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
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = Array.isArray(payload) ? payload : [];
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(fetchUserById.fulfilled, (state, { payload }) => {
        state.current = payload;
      })
      .addCase(fetchUserById.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.current = payload;
        state.items = state.items.filter((u) => u.id !== payload.id);
        state.items.push(payload);
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.current = payload;
        const i = state.items.findIndex((u) => u.id === payload.id);
        if (i >= 0) state.items[i] = payload;
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.error = payload as string;
      });
  },
});

export const { clearCurrent, clearError } = usersSlice.actions;
export default usersSlice.reducer;
