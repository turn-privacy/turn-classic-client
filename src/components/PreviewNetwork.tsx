import { useEffect } from "react";
import { Card } from "./Card";
import { styles } from "../styles";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSignStatus, setIsSigning } from "../store/transactionSlice";
import { setWalletError } from "../store/errorSlice";
import { setPreviewWallet } from "../store/networkSlice";
import { setRecipientType } from "../store/recipientSlice";
import { Button } from "./Button";

// Add missing styles
const componentStyles = {
  ...styles,
  walletButtonContainer: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
    border: "1px solid #646cff",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "#fff",
  },
};

interface PreviewNetworkProps {
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  socket: WebSocket | null;
  setManualRecipientAddress: (address: string | null) => void;
  manualRecipientAddress: string | null;
}

export function PreviewNetwork({
  recipientAddress,
  recipientSeedPhrase,
  socket,
  setManualRecipientAddress,
  manualRecipientAddress,
}: PreviewNetworkProps) {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);
  const previewWallet = useAppSelector(state => state.network.previewWallet);
  const previewAddress = useAppSelector(state => state.network.previewAddress);
  const walletBalance = useAppSelector(state => state.network.walletBalance);
  const pendingTransaction = useAppSelector(state => state.transaction.pendingTransaction);
  const isSigning = useAppSelector(state => state.transaction.isSigning);
  const signStatus = useAppSelector(state => state.transaction.signStatus);
  const previewLucid = useAppSelector(state => state.network.previewLucid);
  const previewWalletApi = useAppSelector(state => state.network.previewWalletApi);
  const recipientType = useAppSelector(state => state.recipient.recipientType);

  const selectWallet = async (walletName: string) => {
    try {
      const choice = (window as any).cardano[walletName];
      dispatch(setPreviewWallet(choice));
    } catch (error) {
      console.error("Error selecting wallet:", error);
      dispatch(setWalletError(`Failed to select ${walletName}`));
    }
  };

  const onSign = async () => {
    if (!socket || !pendingTransaction || !previewLucid || !previewWalletApi) {
      dispatch(setWalletError("Missing required data for signing"));
      return;
    }

    dispatch(setIsSigning(true));
    dispatch(setSignStatus("Signing transaction..."));

    try {
      const signedTx = await previewWalletApi.signTx(pendingTransaction);
      socket.send(JSON.stringify({
        type: "sign_tx",
        data: signedTx
      }));
    } catch (error) {
      console.error("Error signing transaction:", error);
      dispatch(setSignStatus("Failed to sign transaction"));
      dispatch(setIsSigning(false));
    }
  };

  return (
    <>
      <Card>
        <h3>Select Wallet</h3>
        <div style={componentStyles.walletButtonContainer}>
          {walletSelectList.map((label) => (
            <Button
              key={label}
              onClick={() => selectWallet(label)}
              style={{
                backgroundColor: previewWallet?.name === label ? "#00aaff" : "transparent"
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {previewWallet && (
        <>
          <Card>
            <h3>Wallet Connected</h3>
            <p>Address: {previewAddress}</p>
            <p>Balance: {walletBalance ? Number(walletBalance.lovelace) / 1000000 : 0} ADA</p>
          </Card>

          {!recipientType && (
            <Card>
              <h3>Choose How You Want To Create Your Recipient Wallet</h3>
              <div style={componentStyles.walletButtonContainer}>
                <Button onClick={() => dispatch(setRecipientType("random"))}>
                  Random Throw-Away Wallet
                </Button>
                <Button onClick={() => dispatch(setRecipientType("fresh"))}>
                  Enter A Fresh Wallet Address
                </Button>
              </div>
            </Card>
          )}

          {recipientType === "random" && recipientAddress && recipientSeedPhrase && (
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

          {recipientType === "fresh" && (
            <Card>
              <h3>Manual Recipient Address</h3>
              <input
                type="text"
                value={manualRecipientAddress || ""}
                onChange={(e) => setManualRecipientAddress(e.target.value)}
                placeholder="Enter recipient address"
                style={componentStyles.input}
              />
              <Button
                onClick={() => {
                  if (socket && manualRecipientAddress) {
                    socket.send(JSON.stringify({
                      type: "signup",
                      data: {
                        address: manualRecipientAddress,
                      },
                    }));
                  }
                }}
                disabled={!manualRecipientAddress}
              >
                Sign Up Manual Address
              </Button>
            </Card>
          )}
        </>
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