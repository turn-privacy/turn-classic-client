import { createAsyncThunk } from '@reduxjs/toolkit';
import { fromText } from "@lucid-evolution/lucid";
import { RootState } from '../store';

export const handlePreviewSignup = createAsyncThunk(
    'signup/handlePreviewSignup',
    async (targetRecipient: string, { getState }) => {
        const state = getState() as RootState;
        const { socket } = state.wallet;
        const { previewAddress, previewWallet, previewLucid } = state.network;

        if (!socket || !previewAddress || !previewWallet || !previewLucid) {
            throw new Error("Missing required data for signup");
        }

        try {
            // Create payload with recipient address
            const payload = fromText(JSON.stringify({
                recipient: targetRecipient,
                extraMsg: "this is another field"
            }));

            // Sign the payload using the connected wallet
            const signedMessage = await previewLucid.wallet().signMessage(previewAddress, payload);

            // Send signup request
            socket.send(JSON.stringify({
                type: "signup",
                address: previewAddress,
                signedMessage,
                payload
            }));

            return { success: true };
        } catch (error) {
            console.error("Error during signup:", error);
            throw error;
        }
    }
); 