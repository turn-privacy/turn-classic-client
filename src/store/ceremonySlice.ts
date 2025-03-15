import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Participant {
    address: string;
}

interface Ceremony {
    id: string;
    participants: Participant[];
    witnesses: string[];
    transaction: string;
    transactionHash?: string;
}

interface CeremonyState {
    ceremonies: Ceremony[];
    error: string | null;
}

const initialState: CeremonyState = {
    ceremonies: [],
    error: null,
};

export const ceremonySlice = createSlice({
    name: 'ceremony',
    initialState,
    reducers: {
        setCeremonies: (state, action: PayloadAction<Ceremony[]>) => {
            state.ceremonies = action.payload;
            state.error = null;
        },
        setCeremonyError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearCeremonies: (state) => {
            state.ceremonies = [];
            state.error = null;
        },
        updateCeremony: (state, action: PayloadAction<Ceremony>) => {
            const index = state.ceremonies.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.ceremonies[index] = action.payload;
            }
        },
    }
});

export const {
    setCeremonies,
    setCeremonyError,
    clearCeremonies,
    updateCeremony,
} = ceremonySlice.actions;

export default ceremonySlice.reducer; 