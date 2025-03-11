import { signTransaction, signup } from "../functions";
import { LocalNetworkProps } from "../types/props";
import { TransactionSigningUI } from "./TransactionSigningUI";
import { WalletInfo } from "./WalletInfo";



export const LocalNetwork: React.FC<LocalNetworkProps> = ({
  walletAddress,
  walletSeedPhrase,
  recipientAddress,
  recipientSeedPhrase,
  pendingTransaction,
  isSigning,
  signStatus,
  socket,
  faucetSent,
  faucetTxHash,
  previewLucid
}) => {
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
        onSign={() => {
          if (socket && walletSeedPhrase && pendingTransaction) {
            signTransaction(pendingTransaction, walletSeedPhrase, socket, previewLucid);
          }
        }}
      />
    </>
  );
};
