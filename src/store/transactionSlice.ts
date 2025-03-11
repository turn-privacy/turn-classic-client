import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TransactionState {
    isSigning: boolean;
    signStatus: string | null;
    pendingTransaction: any | null;
}

const initialState: TransactionState = {
    isSigning: false,
    signStatus: null,
    pendingTransaction: null
};

export const transactionSlice = createSlice({
    name: 'transaction',
    initialState,
    reducers: {
        setIsSigning: (state, action: PayloadAction<boolean>) => {
            state.isSigning = action.payload;
        },
        setSignStatus: (state, action: PayloadAction<string | null>) => {
            state.signStatus = action.payload;
        },
        setPendingTransaction: (state, action: PayloadAction<any | null>) => {
            state.pendingTransaction = action.payload;
        },
        // Convenience action to reset transaction state
        resetTransactionState: (state) => {
            state.pendingTransaction = null;
            state.signStatus = null;
            state.isSigning = false;
        }
    }
});

export const {
    setIsSigning,
    setSignStatus,
    setPendingTransaction,
    resetTransactionState
} = transactionSlice.actions;

export default transactionSlice.reducer; 