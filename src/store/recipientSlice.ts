import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type RecipientType = 'random' | 'fresh' | null;

interface RecipientState {
    recipientType: RecipientType;
}

const initialState: RecipientState = {
    recipientType: null
};

export const recipientSlice = createSlice({
    name: 'recipient',
    initialState,
    reducers: {
        setRecipientType: (state, action: PayloadAction<RecipientType>) => {
            state.recipientType = action.payload;
        }
    }
});

export const { setRecipientType } = recipientSlice.actions;
export default recipientSlice.reducer; 