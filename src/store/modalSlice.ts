import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
    isSignupModalOpen: boolean;
    isQueueModalOpen: boolean;
    isCeremoniesModalOpen: boolean;
    isPendingCeremonyModalOpen: boolean;
}

const initialState: ModalState = {
    isSignupModalOpen: false,
    isQueueModalOpen: false,
    isCeremoniesModalOpen: false,
    isPendingCeremonyModalOpen: false,
};

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setSignupModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isSignupModalOpen = action.payload;
        },
        setQueueModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isQueueModalOpen = action.payload;
        },
        setCeremoniesModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isCeremoniesModalOpen = action.payload;
        },
        setPendingCeremonyModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isPendingCeremonyModalOpen = action.payload;
        },
        closeAllModals: (state) => {
            state.isSignupModalOpen = false;
            state.isQueueModalOpen = false;
            state.isCeremoniesModalOpen = false;
            state.isPendingCeremonyModalOpen = false;
        },
    },
});

export const {
    setSignupModalOpen,
    setQueueModalOpen,
    setCeremoniesModalOpen,
    setPendingCeremonyModalOpen,
    closeAllModals,
} = modalSlice.actions;

export default modalSlice.reducer; 