import { configureStore } from '@reduxjs/toolkit';
import recipientReducer from './recipientSlice';
import transactionReducer from './transactionSlice';
import faucetReducer from './faucetSlice';
import errorReducer from './errorSlice';
import ceremonyReducer from './ceremonySlice';
import networkReducer from './networkSlice';
import walletReducer from './walletSlice';

export const store = configureStore({
    reducer: {
        recipient: recipientReducer,
        transaction: transactionReducer,
        faucet: faucetReducer,
        error: errorReducer,
        ceremony: ceremonyReducer,
        network: networkReducer,
        wallet: walletReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 