import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import rawMaterialsReducer, {
  fetchRawMaterials,
  fetchRawMaterialsForSelection,
  createRawMaterial,
  deleteRawMaterial,
  clearError,
  type RawMaterialsState,
} from './rawMaterialsSlice';
import type { RawMaterialDto, PageDto } from '../../types/api';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import('../../api/client');

type TestRootState = { rawMaterials: RawMaterialsState };

describe('rawMaterialsSlice', () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({ reducer: { rawMaterials: rawMaterialsReducer } }) as ReturnType<typeof configureStore<TestRootState>>;
  });

  it('fetchRawMaterials.fulfilled updates items and pagination from API PageDto', async () => {
    const content: RawMaterialDto[] = [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }];
    const pageDto: PageDto<RawMaterialDto> = {
      content,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchRawMaterials({ page: 0, size: 20 }) as any);
    const state = (store.getState() as TestRootState).rawMaterials;
    expect(state.items).toEqual(content);
    expect(state.totalElements).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.page).toBe(0);
    expect(state.size).toBe(20);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchRawMaterials.fulfilled with all=true sets totalPages=1, page=0, totalElements from content for "Load all" UX', async () => {
    const content: RawMaterialDto[] = [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 100 }];
    const pageDto: PageDto<RawMaterialDto> = {
      content,
      totalElements: 1,
      totalPages: 3,
      number: 1,
      size: 1,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchRawMaterials({ all: true }) as any);
    const state = (store.getState() as TestRootState).rawMaterials;
    expect(state.items).toEqual(content);
    expect(state.totalPages).toBe(1);
    expect(state.page).toBe(0);
    expect(state.totalElements).toBe(1);
    expect(state.size).toBe(1);
  });

  it('fetchRawMaterials.rejected sets error', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await store.dispatch(fetchRawMaterials({}) as any);
    expect((store.getState() as TestRootState).rawMaterials.error).toBe('Network error');
    expect((store.getState() as TestRootState).rawMaterials.loading).toBe(false);
  });

  it('fetchRawMaterialsForSelection.fulfilled sets selectionList from PageDto', async () => {
    const list: RawMaterialDto[] = [{ id: 1, code: 'RM1', name: 'Steel', stockQuantity: 50 }];
    const pageDto: PageDto<RawMaterialDto> = { content: list, totalElements: 1, totalPages: 1, number: 0, size: 1 };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchRawMaterialsForSelection() as any);
    expect((store.getState() as TestRootState).rawMaterials.selectionList).toEqual(list);
  });

  it('createRawMaterial.fulfilled sets current only (list refetched on list screen)', async () => {
    const created: RawMaterialDto = { id: 1, code: 'X', name: 'X', stockQuantity: 10 };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: created });
    await store.dispatch(createRawMaterial({ code: 'X', name: 'X', stockQuantity: 10 }) as any);
    expect((store.getState() as TestRootState).rawMaterials.current).toEqual(created);
    expect((store.getState() as TestRootState).rawMaterials.items).not.toContainEqual(created);
  });

  it('deleteRawMaterial.fulfilled removes item from state', async () => {
    const pageDto: PageDto<RawMaterialDto> = {
      content: [{ id: 1, code: 'RM1', name: 'Raw 1', stockQuantity: 100 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pageDto });
    await store.dispatch(fetchRawMaterials({ page: 0, size: 20 }) as any);
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    await store.dispatch(deleteRawMaterial(1) as any);
    expect((store.getState() as TestRootState).rawMaterials.items).toHaveLength(0);
  });

  it('clearError resets error', () => {
    store = configureStore({
      reducer: { rawMaterials: rawMaterialsReducer },
      preloadedState: {
        rawMaterials: {
          items: [],
          selectionList: [],
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
    expect((store.getState() as TestRootState).rawMaterials.error).toBeNull();
  });
});
