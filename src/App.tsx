import { theme } from "./config/theme";
import { useEffect, useState } from "react";
import "./styles/globals.css";
import { Blockfrost, Emulator, fromText, generateSeedPhrase, Lucid, SignedMessage, UTxO, WalletApi } from "@lucid-evolution/lucid";
import React, { ReactNode } from "react";

// Common styles
const styles = {
  container: {
    minHeight: "100vh",
    background: theme.gradients.background,
  },
  main: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  card: {
    color: "white",
    border: "2px solid #00aaff",
    borderRadius: "8px",
    padding: "1.5rem",
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    marginBottom: "1rem"
  },
  errorCard: {
    border: "2px solid #ff4444",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#00aaff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  disabledButton: {
    backgroundColor: "#666",
    cursor: "not-allowed",
    opacity: 0.7
  }
};

// Component interfaces
interface CardProps {
  title?: string;
  children: ReactNode;
  error?: boolean;
  style?: React.CSSProperties;
}

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

interface WalletInfoProps {
  address: string;
  seedPhrase: string;
  emoji: string;
  onRequestFunds?: () => void;
  onSignup?: () => void;
  socket?: WebSocket | null;
  balance?: { lovelace: bigint } | null;
  faucetInfo?: {
    sent: boolean;
    txHash: string | null;
  };
  onRecycleTada?: () => void;
  showRecycle?: boolean;
}

interface TransactionSigningUIProps {
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  onSign: () => void;
}

async function init_get_wallet_address(): Promise<[string, string]> {
  const emulator = new Emulator([]);
  const offlineLucid = await Lucid(emulator, "Preview");
  const seedPhrase = generateSeedPhrase();
  offlineLucid.selectWallet.fromSeed(seedPhrase);
  const address = await offlineLucid.wallet().address();
  return [address, seedPhrase];
}

const signup = async (recipientAddress: string, senderSeed: string, ws: WebSocket) => {
  const payload = fromText(JSON.stringify({
    recipient: recipientAddress,
    extraMsg: "this is another field"
  }));

  const lucid = await Lucid(new Emulator([]), "Preview");
  lucid.selectWallet.fromSeed(senderSeed);
  const address = await lucid.wallet().address();

  const signedMessage: SignedMessage = await lucid.wallet().signMessage(address, payload);
  ws.send(JSON.stringify({
    type: "signup",
    address,
    signedMessage,
    payload
  }));
}

// Modify the signTransaction function to work with both Preview and Local networks
const signTransaction = async (txData: any, senderSeed: string | null, ws: WebSocket, previewLucid: any = null) => {
  console.log("Signing transaction:", txData);
  try {
    let witness;
    if (previewLucid) {
      // For Preview network, use the connected wallet
      witness = await previewLucid.fromTx(txData.tx).partialSign.withWallet();
    } else {
      // For Local network, use the seed phrase
      const lucid = await Lucid(new Emulator([]), "Preview");
      lucid.selectWallet.fromSeed(senderSeed!);
      witness = await lucid.fromTx(txData.tx).partialSign.withWallet();
    }

    // Send the witness back to the server
    ws.send(JSON.stringify({
      type: "submit_signature",
      data: {
        witness,
        address: previewLucid ? await previewLucid.wallet().address() : null
      }
    }));

    return true;
  } catch (error) {
    console.error("Error signing transaction:", error);
    return false;
  }
}

// Add these two new components just before the App component:

interface LocalNetworkProps {
  walletAddress: string | null;
  walletSeedPhrase: string | null;
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  socket: WebSocket | null;
  faucetSent: boolean;
  faucetTxHash: string | null;
  previewLucid: any;
}

const LocalNetwork: React.FC<LocalNetworkProps> = ({
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

interface PreviewNetworkProps {
  walletError: string | null;
  walletSelectList: string[];
  previewWallet: any;
  previewAddress: string | null;
  walletBalance: { lovelace: bigint } | null;
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  socket: WebSocket | null;
  faucetSent: boolean;
  faucetTxHash: string | null;
  previewLucid: any;
  previewWalletApi: any;
  onSelectWallet: (walletName: string) => void;
  setError: (error: string | null) => void;
  setIsSigning: (signing: boolean) => void;
  setSignStatus: (status: string | null) => void;
}

const PreviewNetwork: React.FC<PreviewNetworkProps> = ({
  walletError,
  walletSelectList,
  previewWallet,
  previewAddress,
  walletBalance,
  recipientAddress,
  recipientSeedPhrase,
  pendingTransaction,
  isSigning,
  signStatus,
  socket,
  faucetSent,
  faucetTxHash,
  previewLucid,
  previewWalletApi,
  onSelectWallet,
  setError,
  setIsSigning,
  setSignStatus
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {walletError ? (
        <Card title="Error" error>
          <p>{walletError}</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
          {walletSelectList.map(wallet => (
            <Button
              key={wallet}
              onClick={() => onSelectWallet(wallet)}
              style={{
                backgroundColor: previewWallet && (window as any).cardano[wallet] === previewWallet ? "#00aaff" : "transparent"
              }}
            >
              {wallet}
            </Button>
          ))}
        </div>
      )}

      {previewAddress && (
        <>
          <WalletInfo
            address={previewAddress}
            seedPhrase=""
            emoji="💳"
            balance={walletBalance}
            faucetInfo={{
              sent: faucetSent,
              txHash: faucetTxHash
            }}
            onRequestFunds={() => {
              if (socket && previewAddress) {
                socket.send(JSON.stringify({ type: "faucet", address: previewAddress }));
              }
            }}
            onSignup={() => {
              if (socket && previewAddress && recipientAddress && previewLucid) {
                const payload = fromText(JSON.stringify({
                  recipient: recipientAddress,
                  extraMsg: "this is another field"
                }));
                
                previewLucid.wallet().signMessage(previewAddress, payload)
                  .then((signedMessage: SignedMessage) => {
                    socket.send(JSON.stringify({
                      type: "signup",
                      address: previewAddress,
                      signedMessage,
                      payload
                    }));
                  })
                  .catch((error: Error) => {
                    console.error("Error signing signup message:", error);
                    setError("Failed to sign signup message");
                  });
              }
            }}
            socket={socket}
          />

          <TransactionSigningUI
            pendingTransaction={pendingTransaction}
            isSigning={isSigning}
            signStatus={signStatus}
            onSign={async () => {
              if (socket && previewLucid && !isSigning) {
                setIsSigning(true);
                try {
                  const success = await signTransaction(pendingTransaction, null, socket, previewLucid);
                  if (success) {
                    setSignStatus("Sending signature to server...");
                  } else {
                    setSignStatus("Failed to sign transaction. Please try again.");
                  }
                } catch (error) {
                  console.error("Error in signing process:", error);
                  setSignStatus("An error occurred during signing.");
                } finally {
                  setIsSigning(false);
                }
              }
            }}
          />

          <WalletInfo
            address={recipientAddress || ""}
            seedPhrase={recipientSeedPhrase || ""}
            emoji="🌆"
            showRecycle={true}
            onRecycleTada={async () => {
              if (recipientSeedPhrase && previewLucid) {
                // Switch to recipient wallet
                previewLucid.selectWallet.fromSeed(recipientSeedPhrase);
                try {
                  const tx = await previewLucid
                    .newTx()
                    .pay.ToAddress(
                      "addr_test1qryvgass5dsrf2kxl3vgfz76uhp83kv5lagzcp29tcana68ca5aqa6swlq6llfamln09tal7n5kvt4275ckwedpt4v7q48uhex",
                      { lovelace: (await previewLucid.wallet().getUtxos().then((utxos: UTxO[]) => 
                        utxos.reduce((acc: bigint, utxo: UTxO) => acc + utxo.assets.lovelace, BigInt(0)))) - BigInt(2_000_000)
                      }
                    )
                    .complete();
                  const signedTx = await tx.sign.withWallet().complete();
                  const txHash = await signedTx.submit();
                  console.log("Sent all ADA from recipient wallet. Tx:", txHash);
                } catch (error) {
                  console.error("Failed to send ADA:", error);
                } finally {
                  // Switch back to original wallet
                  previewLucid.selectWallet.fromAPI(previewWalletApi);
                }
              }
            }}
          />
        </>
      )}
    </div>
  );
};

// Reusable Components
const Card: React.FC<CardProps> = ({ title, children, error, style = {} }) => (
  <div style={{ ...styles.card, ...(error ? styles.errorCard : {}), ...style }}>
    {title && <h4 style={{ margin: "0 0 1rem 0", color: error ? "#ff4444" : "#00aaff" }}>{title}</h4>}
    {children}
  </div>
);

const Button: React.FC<ButtonProps> = ({ onClick, disabled, children, style = {} }) => (
  <button
    style={{
      ...styles.button,
      ...(disabled ? styles.disabledButton : {}),
      ...style
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const WalletInfo: React.FC<WalletInfoProps> = ({ 
  address, 
  seedPhrase, 
  emoji, 
  onRequestFunds, 
  onSignup, 
  socket,
  balance,
  faucetInfo,
  onRecycleTada,
  showRecycle
}) => (
  <Card>
    <span role="img" aria-label="wallet">{emoji}</span>
    <p>Address: {address}</p>
    <p>Seed Phrase: {seedPhrase}</p>
    {balance && (
      <p>Balance: {Number(balance.lovelace) / 1_000_000} ₳</p>
    )}
    {onRequestFunds && onSignup && (
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button
          onClick={onRequestFunds}
        >
          Request Funds
        </Button>
        <Button onClick={onSignup}>Signup for Ceremony</Button>
      </div>
    )}
    {showRecycle && onRecycleTada && (
      <Button
        onClick={onRecycleTada}
        style={{ marginTop: '1rem' }}
      >
        Recycle tADA
      </Button>
    )}
    {faucetInfo?.sent && (
      <div style={{
        marginTop: "1rem",
        padding: "0.75rem",
        backgroundColor: "rgba(0, 255, 0, 0.1)",
        borderRadius: "4px",
        border: "1px solid #00ff00"
      }}>
        <p style={{ margin: 0, color: "#00ff00" }}>
          Funds sent! Transaction: {faucetInfo.txHash}
        </p>
      </div>
    )}
  </Card>
);

const TransactionSigningUI: React.FC<TransactionSigningUIProps> = ({ pendingTransaction, isSigning, signStatus, onSign }) => (
  pendingTransaction && (
    <Card title="Transaction Ready to Sign">
      <div style={{ marginBottom: "1rem" }}>
        <p><strong>Transaction Details:</strong></p>
        <pre style={{
          overflowX: "auto",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "0.5rem",
          borderRadius: "4px"
        }}>
          {JSON.stringify(pendingTransaction, null, 2)}
        </pre>
      </div>

      <Button
        onClick={onSign}
        disabled={isSigning}
      >
        {isSigning ? "Signing..." : "Sign Transaction"}
      </Button>

      {signStatus && (
        <div style={{
          marginTop: "1rem",
          padding: "0.5rem",
          backgroundColor: signStatus.includes("success") ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 0, 0, 0.2)",
          borderRadius: "4px"
        }}>
          {signStatus}
        </div>
      )}
    </Card>
  )
);

// Add these components after the TransactionSigningUI component and before the App component:

interface NetworkSelectorProps {
  selectedNetwork: 'local' | 'preview' | null;
  setSelectedNetwork: (network: 'local' | 'preview' | null) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ selectedNetwork, setSelectedNetwork }) => (
  <Card title="Select Network" style={{ textAlign: "center" }}>
    <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
      <Button
        onClick={() => setSelectedNetwork('local')}
        style={{ backgroundColor: selectedNetwork === 'local' ? "#00aaff" : "transparent" }}
      >
        Local Testnet
      </Button>
      <Button
        onClick={() => setSelectedNetwork('preview')}
        style={{ backgroundColor: selectedNetwork === 'preview' ? "#00aaff" : "transparent" }}
      >
        Preview
      </Button>
    </div>
  </Card>
);

interface CeremonyStatusProps {
  ceremonyConcluded: boolean;
  ceremonyTxId: string | null;
  ceremonyFailure: { reason: string, msg: string } | null;
  participantQueue: any[];
}

const CeremonyStatus: React.FC<CeremonyStatusProps> = ({
  ceremonyConcluded,
  ceremonyTxId,
  ceremonyFailure,
  participantQueue
}) => (
  <>
    {ceremonyConcluded && (
      <Card title="🎉🎉🎉 Ceremony Concluded 🎉🎉🎉">
        <p>The ceremony has concluded with the transaction {ceremonyTxId}.</p>
      </Card>
    )}

    {ceremonyFailure && (
      <Card title="⚠️ Ceremony Failed" error>
        <p><strong>Reason:</strong> {ceremonyFailure.reason}</p>
        <p>{ceremonyFailure.msg}</p>
      </Card>
    )}

    {participantQueue.length > 0 && (
      <Card title="Participant Queue">
        <p>The participant queue is {participantQueue.length} participants long.</p>
      </Card>
    )}
  </>
);

function App() {
  const [selectedNetwork, setSelectedNetwork] = useState<'local' | 'preview' | null>(null);
  const [walletSeedPhrase, setWalletSeedPhrase] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [recipientSeedPhrase, setRecipientSeedPhrase] = useState<string | null>(null);

  // New state for transaction data
  const [pendingTransaction, setPendingTransaction] = useState<any | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signStatus, setSignStatus] = useState<string | null>(null);

  const [ceremonyConcluded, setCeremonyConcluded] = useState<boolean>(false);
  const [ceremonyTxId, setCeremonyTxId] = useState<string | null>(null);
  const [ceremonyFailure, setCeremonyFailure] = useState<{ reason: string, msg: string } | null>(null);

  const [faucetSent, setFaucetSent] = useState<boolean>(false);
  const [faucetTxHash, setFaucetTxHash] = useState<string | null>(null);

  // Connect to local server with websocket
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [participantQueue, setParticipantQueue] = useState<any[]>([]);

  // Add state for wallet list
  const [walletSelectList, setWalletSelectList] = useState<string[]>([]);
  const [walletError, setError] = useState<string | null>(null);

  // Add new state for preview network wallet
  const [previewWallet, setPreviewWallet] = useState<any>(null);
  const [previewWalletApi, setPreviewWalletApi] = useState<any>(null);
  const [previewLucid, setPreviewLucid] = useState<any>(null);
  const [previewAddress, setPreviewAddress] = useState<string | null>(null);

  // Add new state for wallet balance
  const [walletBalance, setWalletBalance] = useState<{ lovelace: bigint } | null>(null);

  // Effect to get available wallets
  useEffect(() => {
    if (selectedNetwork !== 'preview') return;

    if (typeof (window as any).cardano === 'undefined') {
      return setError("No Cardano wallet found");
    }

    const labels = Object.keys((window as any).cardano);
    setWalletSelectList(labels);
    setError(null);
  }, [selectedNetwork]);

  // Function to select wallet
  const selectWallet = async (walletName: string) => {
    try {
      const choice = (window as any).cardano[walletName];
      setPreviewWallet(choice);
    } catch (error) {
      console.error("Error selecting wallet:", error);
      setError(`Failed to select ${walletName}`);
    }
  };

  // Effect to initialize Lucid with selected wallet
  useEffect(() => {
    const loadLucid = async () => {
      try {
        const _lucid = await Lucid(
          new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.REACT_APP_BLOCKFROST_API_KEY,),
          "Preprod");
        const api: WalletApi = await previewWallet.enable();
        setPreviewWalletApi(api);
        _lucid.selectWallet.fromAPI(api);
        setPreviewLucid(_lucid);

        // Get wallet address
        const address = await _lucid.wallet().address();
        setPreviewAddress(address);

        // Get wallet balance
        const utxos = await _lucid.wallet().getUtxos();
        const balance = utxos.reduce(
          (acc, utxo) => ({
            lovelace: acc.lovelace + utxo.assets.lovelace
          }),
          { lovelace: BigInt(0) }
        );
        setWalletBalance(balance);

        // Generate recipient wallet
        const [recAddress, recSeedPhrase] = await init_get_wallet_address();
        setRecipientAddress(recAddress);
        setRecipientSeedPhrase(recSeedPhrase);

        // Connect to WebSocket when wallet is connected
        const ws = new WebSocket("ws://localhost:8081");
        ws.onopen = () => {
          console.log("Connected to server");
        };
        ws.onmessage = handleWsMessage;
        setSocket(ws);

        return () => {
          ws.close();
        };
      } catch (error) {
        console.error("Error loading Lucid:", error);
        setError("Failed to initialize wallet");
      }
    };

    if (!previewWallet) return;
    loadLucid();
  }, [previewWallet]);

  // Handler for websocket messages
  const handleWsMessage = async (event: MessageEvent) => {
    console.log("Message from server:", event.data);
    const socket = event.currentTarget as WebSocket;

    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case "Marco!":
        console.log("sending heartbeat (Polo!)");
        socket.send(JSON.stringify({ type: "Polo!" })); // heart beat
        break;
      case "failed_signup":
        console.log("%cFailed to sign up:", "color: red", msg.data);
        break;
      case "signup_ack":
        console.log("%cSigned up successfully:", "color: green", msg.data);
        break;
      case "show_participant_queue":
        console.log("%cParticipant queue:", "color: teal", msg.data);
        setParticipantQueue(msg.data);
        break;
      case "transactionReady":
        console.log("Transaction ready:", msg.data);
        // Store the transaction data in state to show in UI
        setPendingTransaction(msg.data);
        setSignStatus(null);
        // Clear any previous ceremony failure
        setCeremonyFailure(null);
        break;
      case "faucet_sent":
        console.log("%cYour account has been funded:", "color: lime", msg.data);
        setFaucetSent(true);
        setFaucetTxHash(msg.data);
        break;
      case "signature_ack":
        console.log("%cSignature acknowledged:", "color: hotpink", msg.data);
        setSignStatus("Transaction signed successfully!");
        // Clear the pending transaction after successful signing
        setTimeout(() => {
          setPendingTransaction(null);
          setSignStatus(null);
        }, 3000);
        break;
      case "ceremonyConcluded":
        console.log(`%cCeremony concluded with transaction ${msg.data.tx}`, "color: purple", msg.data.msg);
        setCeremonyConcluded(true);
        setCeremonyTxId(msg.data.tx);
        setParticipantQueue([]);
        // Clear any previous ceremony failure
        setCeremonyFailure(null);
        break;
      case "ceremonyFailed":
        console.log("%cCeremony failed:", "color: red", msg.data.reason);
        console.log("%c" + msg.data.msg, "color: yellow");
        // Reset transaction state since it's no longer valid
        setPendingTransaction(null);
        setSignStatus(null);
        setIsSigning(false);
        // Reset ceremony state
        setCeremonyConcluded(false);
        setCeremonyTxId(null);
        // Set ceremony failure details
        setCeremonyFailure(msg.data);
        break;
      default:
        console.log("Unknown server message:", msg);
        break;
    }
  };

  useEffect(() => {
    if (selectedNetwork !== 'local') return;

    const ws = new WebSocket("ws://localhost:8081");
    ws.onopen = () => {
      console.log("Connected to server");
    };
    ws.onmessage = handleWsMessage;

    init_get_wallet_address().then(([address, seedPhrase]) => {
      console.log("Wallet Address:", address);
      console.log("Seed Phrase:", seedPhrase);
      setWalletAddress(address);
      setWalletSeedPhrase(seedPhrase);
    });

    init_get_wallet_address().then(([recipientAddress, recipientSeedPhrase]) => {
      console.log("Recipient Address:", recipientAddress);
      console.log("Recipient Seed Phrase:", recipientSeedPhrase);
      setRecipientAddress(recipientAddress);
      setRecipientSeedPhrase(recipientSeedPhrase);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [selectedNetwork]);

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
        />

        {!selectedNetwork && (
          <Card style={{ textAlign: "center" }}>
            <h3>Please select a network to continue</h3>
          </Card>
        )}

        {selectedNetwork === 'preview' && (
          <PreviewNetwork
            walletError={walletError}
            walletSelectList={walletSelectList}
            previewWallet={previewWallet}
            previewAddress={previewAddress}
            walletBalance={walletBalance}
            recipientAddress={recipientAddress}
            recipientSeedPhrase={recipientSeedPhrase}
            pendingTransaction={pendingTransaction}
            isSigning={isSigning}
            signStatus={signStatus}
            socket={socket}
            faucetSent={faucetSent}
            faucetTxHash={faucetTxHash}
            previewLucid={previewLucid}
            previewWalletApi={previewWalletApi}
            onSelectWallet={selectWallet}
            setError={setError}
            setIsSigning={setIsSigning}
            setSignStatus={setSignStatus}
          />
        )}

        {selectedNetwork === 'local' && (
          <LocalNetwork
            walletAddress={walletAddress}
            walletSeedPhrase={walletSeedPhrase}
            recipientAddress={recipientAddress}
            recipientSeedPhrase={recipientSeedPhrase}
            pendingTransaction={pendingTransaction}
            isSigning={isSigning}
            signStatus={signStatus}
            socket={socket}
            faucetSent={faucetSent}
            faucetTxHash={faucetTxHash}
            previewLucid={previewLucid}
          />
        )}

        <CeremonyStatus
          ceremonyConcluded={ceremonyConcluded}
          ceremonyTxId={ceremonyTxId}
          ceremonyFailure={ceremonyFailure}
          participantQueue={participantQueue}
        />
      </main>
    </div>
  );
}

export default App;