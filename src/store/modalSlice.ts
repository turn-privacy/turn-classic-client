import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
    isQueueModalOpen: boolean;
    isCeremoniesModalOpen: boolean;
    isPendingCeremonyModalOpen: boolean;
    activeView: 'signup' | 'info';
}

const initialState: ModalState = {
    isQueueModalOpen: false,
    isCeremoniesModalOpen: false,
    isPendingCeremonyModalOpen: false,
    activeView: 'signup',
};

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setQueueModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isQueueModalOpen = action.payload;
        },
        setCeremoniesModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isCeremoniesModalOpen = action.payload;
        },
        setPendingCeremonyModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isPendingCeremonyModalOpen = action.payload;
        },
        setActiveView: (state, action: PayloadAction<'signup' | 'info'>) => {
            state.activeView = action.payload;
        },
        closeAllModals: (state) => {
            state.isQueueModalOpen = false;
            state.isCeremoniesModalOpen = false;
            state.isPendingCeremonyModalOpen = false;
        },
    },
});

export const {
    setQueueModalOpen,
    setCeremoniesModalOpen,
    setPendingCeremonyModalOpen,
    setActiveView,
    closeAllModals,
} = modalSlice.actions;

export default modalSlice.reducer; 