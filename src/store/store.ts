import { configureStore } from '@reduxjs/toolkit';
import recipientReducer from './recipientSlice';
import transactionReducer from './transactionSlice';
import faucetReducer from './faucetSlice';
import errorReducer from './errorSlice';

export const store = configureStore({
    reducer: {
        recipient: recipientReducer,
        transaction: transactionReducer,
        faucet: faucetReducer,
        error: errorReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 