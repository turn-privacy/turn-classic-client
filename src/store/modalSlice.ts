import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
    isQueueModalOpen: boolean;
    activeView: 'signup' | 'info';
}

const initialState: ModalState = {
    isQueueModalOpen: false,
    activeView: 'signup',
};

export const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setQueueModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isQueueModalOpen = action.payload;
        },
        setActiveView: (state, action: PayloadAction<'signup' | 'info'>) => {
            state.activeView = action.payload;
        },
        closeAllModals: (state) => {
            state.isQueueModalOpen = false;
        },
    },
});

export const {
    setQueueModalOpen,
    setActiveView,
    closeAllModals,
} = modalSlice.actions;

export default modalSlice.reducer; 