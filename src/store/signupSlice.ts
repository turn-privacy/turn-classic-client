import { createSlice } from '@reduxjs/toolkit';
import { handlePreviewSignup } from './thunks/signupThunks';

interface SignupState {
    isSigningUp: boolean;
    error: string | null;
}

const initialState: SignupState = {
    isSigningUp: false,
    error: null,
};

const signupSlice = createSlice({
    name: 'signup',
    initialState,
    reducers: {
        clearSignupError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(handlePreviewSignup.pending, (state) => {
                state.isSigningUp = true;
                state.error = null;
            })
            .addCase(handlePreviewSignup.fulfilled, (state) => {
                state.isSigningUp = false;
                state.error = null;
            })
            .addCase(handlePreviewSignup.rejected, (state, action) => {
                state.isSigningUp = false;
                state.error = action.error.message || 'Failed to sign up';
            });
    },
});

export const { clearSignupError } = signupSlice.actions;
export default signupSlice.reducer; 