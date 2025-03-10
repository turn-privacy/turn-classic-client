import { theme } from "./config/theme";
import { useEffect, useState } from "react";
import "./styles/globals.css";
import { Blockfrost, Emulator, fromText, generateSeedPhrase, Lucid, SignedMessage, WalletApi } from "@lucid-evolution/lucid";
import React from "react";

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
    <div
      style={{
        minHeight: "100vh",
        background: theme.gradients.background,
      }}
    >
      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Network Selection */}
        <div style={{
          color: "white",
          border: "1px solid white",
          padding: "1rem",
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          <h2 style={{ marginBottom: "1rem" }}>Select Network</h2>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: selectedNetwork === 'local' ? "#00aaff" : "transparent",
                color: "white",
                border: "1px solid white",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedNetwork('local')}
            >
              Local Testnet
            </button>
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: selectedNetwork === 'preview' ? "#00aaff" : "transparent",
                color: "white",
                border: "1px solid white",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={() => setSelectedNetwork('preview')}
            >
              Preview
            </button>
          </div>
        </div>

        {!selectedNetwork && (
          <div style={{
            color: "white",
            textAlign: "center",
            marginTop: "2rem"
          }}>
            <h3>Please select a network to continue</h3>
          </div>
        )}

        {selectedNetwork === 'preview' && (
          <div style={{ color: "white", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{
              border: "2px solid #ffaa00",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: "rgba(255, 170, 0, 0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#ffaa00" }}>Preview Network</h3>
              <p>Select a wallet to connect</p>
            </div>

            {walletError ? (
              <div style={{
                border: "2px solid #ff4444",
                borderRadius: "8px",
                padding: "1.5rem",
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                textAlign: "center"
              }}>
                <p style={{ color: "#ff4444" }}>{walletError}</p>
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                padding: "1rem"
              }}>
                {walletSelectList.map(wallet => (
                  <button
                    key={wallet}
                    onClick={() => selectWallet(wallet)}
                    style={{
                      padding: "1rem",
                      backgroundColor: previewWallet && (window as any).cardano[wallet] === previewWallet ? "#00aaff" : "transparent",
                      color: "white",
                      border: "1px solid white",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {wallet}
                  </button>
                ))}
              </div>
            )}

            {previewAddress && (
              <>
                <div style={{
                  border: "2px solid #00aaff",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  backgroundColor: "rgba(0, 170, 255, 0.1)",
                  marginBottom: "1rem"
                }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>Wallet Info</h4>
                  <p>Address: {previewAddress}</p>
                  {walletBalance && (
                    <p>Balance: {Number(walletBalance.lovelace) / 1_000_000} ₳</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#00aaff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        if (socket && previewAddress) {
                          socket.send(JSON.stringify({ type: "faucet", address: previewAddress }));
                        } else {
                          console.log("No socket or wallet address");
                          console.log(socket);
                          console.log(previewAddress);
                        }
                      }}
                    >
                      Request Funds
                    </button>

                    <button
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#00aaff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => {
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
                        } else {
                          console.log("Missing required data for signup");
                          console.log({ socket, previewAddress, recipientAddress, previewLucid });
                        }
                      }}
                    >
                      Signup for Ceremony
                    </button>
                  </div>

                  {/* Transaction signing section */}
                  {pendingTransaction && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "rgba(0, 170, 255, 0.05)",
                      borderRadius: "4px",
                      border: "1px solid #00aaff"
                    }}>
                      <h4 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>Transaction Ready</h4>
                      <button
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: isSigning ? "#666" : "#00aaff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isSigning ? "not-allowed" : "pointer",
                          opacity: isSigning ? 0.7 : 1
                        }}
                        onClick={async () => {
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
                        disabled={isSigning}
                      >
                        {isSigning ? "Signing..." : "Sign Transaction"}
                      </button>
                      {signStatus && (
                        <p style={{ 
                          marginTop: "0.5rem",
                          color: signStatus.includes("Failed") ? "#ff4444" : "#00ff00"
                        }}>
                          {signStatus}
                        </p>
                      )}
                    </div>
                  )}

                  {faucetSent && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "0.75rem",
                      backgroundColor: "rgba(0, 255, 0, 0.1)",
                      borderRadius: "4px",
                      border: "1px solid #00ff00"
                    }}>
                      <p style={{ margin: 0, color: "#00ff00" }}>
                        Funds sent! Transaction: {faucetTxHash}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recipient Wallet Info */}
                <div style={{
                  border: "2px solid #00aaff",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  backgroundColor: "rgba(0, 170, 255, 0.1)"
                }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>
                    <span role="img" aria-label="recipient" style={{ marginRight: "0.5rem" }}>🌆</span>
                    Recipient Wallet Info
                  </h4>
                  <p>Address: {recipientAddress}</p>
                  <p>Seed Phrase: {recipientSeedPhrase}</p>
                </div>
              </>
            )}
          </div>
        )}

        {selectedNetwork === 'local' && (
          <>
            <div style={{ color: "white", border: "1px solid white", padding: "1rem", marginBottom: "1rem" }}>
              {/* emoji to indicate home */}
              <span role="img" aria-label="home">🏠</span>
              <p>Address: {walletAddress}</p>
              <p>Seed Phrase: {walletSeedPhrase}</p>
            </div>

            {/* show recipient details in new style with border */}
            <div style={{ color: "white", border: "1px solid white", padding: "1rem", marginBottom: "1rem" }}>
              <span role="img" aria-label="recipient">
                🌆
              </span>
              <p>Recipient Address: {recipientAddress}</p>
              <p>Recipient Seed Phrase: {recipientSeedPhrase}</p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <button
                style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
                onClick={() => {
                  if (socket && walletAddress) {
                    socket.send(JSON.stringify({ type: "faucet", address: walletAddress }));
                  } else {
                    console.log("No socket or wallet address");
                    console.log(socket);
                    console.log(walletAddress);
                  }
                }}
              >
                Request Funds
              </button>

              <button
                style={{ padding: "0.5rem 1rem" }}
                onClick={() => {
                  if (socket && walletAddress && walletSeedPhrase && recipientAddress && recipientSeedPhrase) {
                    signup(recipientAddress, walletSeedPhrase, socket);
                  } else {
                    console.log("No socket or wallet address");
                    console.log(socket);
                    console.log(walletAddress);
                  }
                }}
              >
                Signup for Ceremony
              </button>
            </div>

            {/* Transaction signing UI - only shown when a transaction is ready */}
            {pendingTransaction && (
              <div style={{
                color: "white",
                border: "2px solid #00aaff",
                borderRadius: "8px",
                padding: "1.5rem",
                marginTop: "1.5rem",
                backgroundColor: "rgba(0, 0, 0, 0.3)"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>Transaction Ready to Sign</h3>

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

                <button
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#00aaff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isSigning ? "not-allowed" : "pointer",
                    opacity: isSigning ? 0.7 : 1
                  }}
                  onClick={() => {
                    if (socket && walletSeedPhrase && pendingTransaction) {
                      signTransaction(pendingTransaction, walletSeedPhrase, socket, previewLucid);
                    } else {
                      console.error("Missing required data for signing");
                    }
                  }}
                  disabled={isSigning}
                >
                  {isSigning ? "Signing..." : "Sign Transaction"}
                </button>

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
              </div>
            )}

            {/* when we receive indication that the ceremony is concluded, show a message */}
            {ceremonyConcluded && (
              <div style={{ color: "white", border: "2px solid #00aaff", borderRadius: "8px", padding: "1.5rem", marginTop: "1.5rem", backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>🎉🎉🎉 Ceremony Concluded 🎉🎉🎉</h3>
                <p>The ceremony has concluded with the transaction {ceremonyTxId}.</p>
              </div>
            )}

            { /* when receive funds from faucet show something (including tx hash) to the user */
              faucetSent && (
                <div style={{ color: "white", border: "2px solid #00aaff", borderRadius: "8px", padding: "1.5rem", marginTop: "1.5rem", backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
                  <h3 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>Faucet Sent</h3>
                  <p>The faucet has sent funds to the address {walletAddress}.</p>
                  <p>Transaction Hash: {faucetTxHash}</p>
                </div>
              )
            }

            {/* show ceremony failure message */}
            {ceremonyFailure && (
              <div style={{
                color: "white",
                border: "2px solid #ff4444",
                borderRadius: "8px",
                padding: "1.5rem",
                marginTop: "1.5rem",
                backgroundColor: "rgba(255, 0, 0, 0.1)"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#ff4444" }}>⚠️ Ceremony Failed</h3>
                <p><strong>Reason:</strong> {ceremonyFailure.reason}</p>
                <p>{ceremonyFailure.msg}</p>
              </div>
            )}

            {/* show participant queue */}
            {participantQueue.length > 0 && (
              <div style={{ color: "white", border: "2px solid #00aaff", borderRadius: "8px", padding: "1.5rem", marginTop: "1.5rem", backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#00aaff" }}>Participant Queue</h3>
                <p>The participant queue is {participantQueue.length} participants long.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;