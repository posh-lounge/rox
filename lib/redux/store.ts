import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import dataReducer from './slices/dataSlice';

const store = configureStore({
  reducer: {
    data: dataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export default store;
