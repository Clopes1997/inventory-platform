import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { UserDto } from '../../types/api';

export const fetchMe = createAsyncThunk<
  UserDto,
  void,
  { rejectValue: string }
>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<UserDto>('/users/me');
      return data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export interface AuthState {
  currentUser: UserDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentUser = payload;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, { payload }) => {
        state.loading = false;
        state.currentUser = null;
        state.error = payload as string;
      });
  },
});

export const { clearCurrentUser } = authSlice.actions;
export default authSlice.reducer;
