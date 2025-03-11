import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TransactionState {
    isSigning: boolean;
    signStatus: string | null;
}

const initialState: TransactionState = {
    isSigning: false,
    signStatus: null
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
        }
    }
});

export const { setIsSigning, setSignStatus } = transactionSlice.actions;
export default transactionSlice.reducer; 