import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
    // Local network wallet states
    localWalletAddress: string | null;
    localWalletSeedPhrase: string | null;
    localRecipientAddress: string | null;
    localRecipientSeedPhrase: string | null;
    // Manual recipient address for preview network
    manualRecipientAddress: string | null;
    // WebSocket connection
    socket: WebSocket | null;
}

const initialState: WalletState = {
    localWalletAddress: null,
    localWalletSeedPhrase: null,
    localRecipientAddress: null,
    localRecipientSeedPhrase: null,
    manualRecipientAddress: null,
    socket: null
};

export const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        setLocalWalletAddress: (state, action: PayloadAction<string | null>) => {
            state.localWalletAddress = action.payload;
        },
        setLocalWalletSeedPhrase: (state, action: PayloadAction<string | null>) => {
            state.localWalletSeedPhrase = action.payload;
        },
        setLocalRecipientAddress: (state, action: PayloadAction<string | null>) => {
            state.localRecipientAddress = action.payload;
        },
        setLocalRecipientSeedPhrase: (state, action: PayloadAction<string | null>) => {
            state.localRecipientSeedPhrase = action.payload;
        },
        setManualRecipientAddress: (state, action: PayloadAction<string | null>) => {
            state.manualRecipientAddress = action.payload;
        },
        setSocket: (state, action: PayloadAction<WebSocket | null>) => {
            if (state.socket) {
                state.socket.close();
            }
            state.socket = action.payload;
        },
        // Convenience action to reset all wallet states
        resetWalletState: (state) => {
            if (state.socket) {
                state.socket.close();
            }
            return initialState;
        }
    }
});

export const {
    setLocalWalletAddress,
    setLocalWalletSeedPhrase,
    setLocalRecipientAddress,
    setLocalRecipientSeedPhrase,
    setManualRecipientAddress,
    setSocket,
    resetWalletState
} = walletSlice.actions;

export default walletSlice.reducer; 