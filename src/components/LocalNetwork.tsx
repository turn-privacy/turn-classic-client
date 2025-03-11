import { signTransaction, signup } from "../functions";
import { LocalNetworkProps } from "../types/props";
import { TransactionSigningUI } from "./TransactionSigningUI";
import { WalletInfo } from "./WalletInfo";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setIsSigning, setSignStatus } from "../store/transactionSlice";

export const LocalNetwork: React.FC<LocalNetworkProps> = ({
  walletAddress,
  walletSeedPhrase,
  recipientAddress,
  recipientSeedPhrase,
  pendingTransaction,
  socket,
  previewLucid
}) => {
  const dispatch = useAppDispatch();
  const isSigning = useAppSelector(state => state.transaction.isSigning);
  const signStatus = useAppSelector(state => state.transaction.signStatus);
  const { faucetSent, faucetTxHash } = useAppSelector(state => state.faucet);

  return (
    <>
      <WalletInfo
        address={walletAddress || ""}
        seedPhrase={walletSeedPhrase || ""}
        emoji="🏠"
        faucetInfo={{
          sent: faucetSent,
          txHash: faucetTxHash
        }}
        onRequestFunds={() => {
          if (socket && walletAddress) {
            socket.send(JSON.stringify({ type: "faucet", address: walletAddress }));
          }
        }}
        onSignup={() => {
          if (socket && walletAddress && walletSeedPhrase && recipientAddress && recipientSeedPhrase) {
            signup(recipientAddress, walletSeedPhrase, socket);
          }
        }}
        socket={socket}
      />

      <WalletInfo
        address={recipientAddress || ""}
        seedPhrase={recipientSeedPhrase || ""}
        emoji="🌆"
      />

      <TransactionSigningUI
        pendingTransaction={pendingTransaction}
        isSigning={isSigning}
        signStatus={signStatus}
        onSign={async () => {
          if (socket && walletSeedPhrase && pendingTransaction && !isSigning) {
            dispatch(setIsSigning(true));
            try {
              const success = await signTransaction(pendingTransaction, walletSeedPhrase, socket, previewLucid);
              if (success) {
                dispatch(setSignStatus("Sending signature to server..."));
              } else {
                dispatch(setSignStatus("Failed to sign transaction. Please try again."));
              }
            } catch (error) {
              console.error("Error in signing process:", error);
              dispatch(setSignStatus("An error occurred during signing."));
            } finally {
              dispatch(setIsSigning(false));
            }
          }
        }}
      />
    </>
  );
};
