import { configureStore } from '@reduxjs/toolkit';
import recipientReducer from './recipientSlice';

export const store = configureStore({
    reducer: {
        recipient: recipientReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 