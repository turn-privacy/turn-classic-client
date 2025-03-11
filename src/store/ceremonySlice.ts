import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CeremonyFailure {
    reason: string;
    msg: string;
}

interface CeremonyState {
    ceremonyConcluded: boolean;
    ceremonyTxId: string | null;
    ceremonyFailure: CeremonyFailure | null;
    participantQueue: any[];
}

const initialState: CeremonyState = {
    ceremonyConcluded: false,
    ceremonyTxId: null,
    ceremonyFailure: null,
    participantQueue: []
};

export const ceremonySlice = createSlice({
    name: 'ceremony',
    initialState,
    reducers: {
        setCeremonyConcluded: (state, action: PayloadAction<boolean>) => {
            state.ceremonyConcluded = action.payload;
        },
        setCeremonyTxId: (state, action: PayloadAction<string | null>) => {
            state.ceremonyTxId = action.payload;
        },
        setCeremonyFailure: (state, action: PayloadAction<CeremonyFailure | null>) => {
            state.ceremonyFailure = action.payload;
        },
        setParticipantQueue: (state, action: PayloadAction<any[]>) => {
            state.participantQueue = action.payload;
        },
        // Convenience action for ceremony success
        ceremonyConcludedSuccess: (state, action: PayloadAction<{ tx: string }>) => {
            state.ceremonyConcluded = true;
            state.ceremonyTxId = action.payload.tx;
            state.participantQueue = [];
            state.ceremonyFailure = null;
        },
        // Convenience action for ceremony failure
        ceremonyFailedReset: (state, action: PayloadAction<CeremonyFailure>) => {
            state.ceremonyConcluded = false;
            state.ceremonyTxId = null;
            state.ceremonyFailure = action.payload;
        }
    }
});

export const {
    setCeremonyConcluded,
    setCeremonyTxId,
    setCeremonyFailure,
    setParticipantQueue,
    ceremonyConcludedSuccess,
    ceremonyFailedReset
} = ceremonySlice.actions;

export default ceremonySlice.reducer; 