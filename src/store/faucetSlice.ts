import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FaucetState {
    faucetSent: boolean;
    faucetTxHash: string | null;
}

const initialState: FaucetState = {
    faucetSent: false,
    faucetTxHash: null
};

export const faucetSlice = createSlice({
    name: 'faucet',
    initialState,
    reducers: {
        setFaucetSent: (state, action: PayloadAction<boolean>) => {
            state.faucetSent = action.payload;
        },
        setFaucetTxHash: (state, action: PayloadAction<string | null>) => {
            state.faucetTxHash = action.payload;
        },
        // Convenience action to set both at once when faucet is sent
        faucetSuccess: (state, action: PayloadAction<string>) => {
            state.faucetSent = true;
            state.faucetTxHash = action.payload;
        }
    }
});

export const { setFaucetSent, setFaucetTxHash, faucetSuccess } = faucetSlice.actions;
export default faucetSlice.reducer; 