import { Card } from "./Card";
import { Button } from "./Button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSignStatus, setIsSigning } from "../store/transactionSlice";
import { setWalletError } from "../store/errorSlice";

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
      {walletAddress && walletSeedPhrase && (
        <Card>
          <h3>Your Wallet</h3>
          <p>Address: {walletAddress}</p>
          <p>Seed Phrase: {walletSeedPhrase}</p>
          <Button
            onClick={() => {
              if (socket) {
                socket.send(JSON.stringify({
                  type: "signup",
                  data: {
                    address: walletAddress,
                  },
                }));
              }
            }}
          >
            Sign Up
          </Button>
        </Card>
      )}

      {recipientAddress && recipientSeedPhrase && (
        <Card>
          <h3>Recipient Wallet</h3>
          <p>Address: {recipientAddress}</p>
          <p>Seed Phrase: {recipientSeedPhrase}</p>
          <Button
            onClick={() => {
              if (socket) {
                socket.send(JSON.stringify({
                  type: "signup",
                  data: {
                    address: recipientAddress,
                  },
                }));
              }
            }}
          >
            Sign Up
          </Button>
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
