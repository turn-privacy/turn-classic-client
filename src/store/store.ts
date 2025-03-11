import { configureStore } from '@reduxjs/toolkit';
import networkReducer from './networkSlice';
import walletReducer from './walletSlice';
import transactionReducer from './transactionSlice';
import errorReducer from './errorSlice';
import faucetReducer from './faucetSlice';
import ceremonyReducer from './ceremonySlice';
import recipientReducer from './recipientSlice';
import signupReducer from './signupSlice';

export const store = configureStore({
    reducer: {
        network: networkReducer,
        wallet: walletReducer,
        transaction: transactionReducer,
        error: errorReducer,
        faucet: faucetReducer,
        ceremony: ceremonyReducer,
        recipient: recipientReducer,
        signup: signupReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 