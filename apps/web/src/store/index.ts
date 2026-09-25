import { configureStore } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import productsReducer from '../features/products/productsSlice';
import rawMaterialsReducer from '../features/rawMaterials/rawMaterialsSlice';
import productMaterialsReducer from '../features/productMaterials/productMaterialsSlice';
import productionReducer from '../features/production/productionSlice';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    rawMaterials: rawMaterialsReducer,
    productMaterials: productMaterialsReducer,
    production: productionReducer,
    auth: authReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed hooks — use these instead of plain useDispatch/useSelector for full type safety. */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
