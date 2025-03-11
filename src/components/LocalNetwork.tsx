import { Card } from "./Card";
import { Button } from "./Button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSignStatus, setIsSigning } from "../store/transactionSlice";
import { setWalletError } from "../store/errorSlice";
import { Lucid, fromText, Emulator } from "@lucid-evolution/lucid";

interface LocalNetworkProps {
  walletAddress: string | null;
  walletSeedPhrase: string | null;
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  socket: WebSocket | null;
  previewLucid: any;
}

export function LocalNetwork({
  walletAddress,
  walletSeedPhrase,
  recipientAddress,
  recipientSeedPhrase,
  socket,
  previewLucid,
}: LocalNetworkProps) {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const pendingTransaction = useAppSelector(state => state.transaction.pendingTransaction);
  const isSigning = useAppSelector(state => state.transaction.isSigning);
  const signStatus = useAppSelector(state => state.transaction.signStatus);

  const handleSignup = async () => {
    if (!socket || !walletAddress || !walletSeedPhrase || !recipientAddress) {
      console.error("Missing required data for signup");
      return;
    }

    try {
      // Create payload with recipient address
      const payload = fromText(JSON.stringify({
        recipient: recipientAddress,
        extraMsg: "this is another field"
      }));

      // Initialize Lucid for signing
      const lucid = await Lucid(new Emulator([]), "Preview");
      lucid.selectWallet.fromSeed(walletSeedPhrase);

      // Sign the payload
      const signedMessage = await lucid.wallet().signMessage(walletAddress, payload);

      // Send signup request
      socket.send(JSON.stringify({
        type: "signup",
        address: walletAddress,
        signedMessage,
        payload
      }));
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  const onSign = async () => {
    if (!socket || !pendingTransaction || !previewLucid) {
      dispatch(setWalletError("Missing required data for signing"));
      return;
    }

    dispatch(setIsSigning(true));
    dispatch(setSignStatus("Signing transaction..."));

    try {
      const tx = await previewLucid.fromTx(pendingTransaction);
      const signedTx = await tx.sign().complete();
      const txComplete = await signedTx.toString();

      socket.send(JSON.stringify({
        type: "sign_tx",
        data: txComplete
      }));
    } catch (error) {
      console.error("Error signing transaction:", error);
      dispatch(setSignStatus("Failed to sign transaction"));
      dispatch(setIsSigning(false));
    }
  };

  return (
    <>
      {walletAddress && walletSeedPhrase && recipientAddress && (
        <Card>
          <h3>Your Wallet</h3>
          <p>Address: {walletAddress}</p>
          <p>Seed Phrase: {walletSeedPhrase}</p>
          <Button onClick={handleSignup}>
            Sign Up
          </Button>
        </Card>
      )}

      {recipientAddress && recipientSeedPhrase && (
        <Card>
          <h3>Recipient Wallet</h3>
          <p>Address: {recipientAddress}</p>
          <p>Seed Phrase: {recipientSeedPhrase}</p>
        </Card>
      )}

      {pendingTransaction && (
        <Card>
          <h3>Pending Transaction</h3>
          <p>Transaction ready to sign!</p>
          <Button onClick={onSign} disabled={isSigning}>
            {isSigning ? "Signing..." : "Sign Transaction"}
          </Button>
          {signStatus && <p>{signStatus}</p>}
        </Card>
      )}
    </>
  );
}
