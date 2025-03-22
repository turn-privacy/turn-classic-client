import { useEffect } from "react";
import "./styles/globals.css";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setWalletSelectList, setPreviewWallet, setPreviewAddress, setWalletBalance } from "./store/networkSlice";
import { setQueue, setQueueError } from "./store/queueSlice";
import {
  setCeremonies,
  setCeremonyError,
  updateCeremony,
  setPendingCeremony,
  setCeremonyStatus,
  setHasSignedCeremony,
  resetCeremonyStatus
} from "./store/ceremonySlice";
import {
  setSelectedWallet,
  setAddress,
  setBalance,
  setLucid,
} from "./store/walletSlice";
import {
  setSignupModalOpen,
  setQueueModalOpen,
  setCeremoniesModalOpen,
  setPendingCeremonyModalOpen,
} from "./store/modalSlice";
import {
  setRecipientAddress,
  setSignupError,
  resetSignupForm,
} from "./store/signupSlice";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import Footer from "./components/Footer";
import { Emulator, Lucid, fromText, paymentCredentialOf } from "@lucid-evolution/lucid";
import { HeadBox } from "./components/HeadBox";
import * as CML from "@anastasia-labs/cardano-multiplatform-lib-browser";
const POLLING_INTERVAL = 10000; // 30 seconds in milliseconds

// todo: check payment credential can't already be found in list of witnesses on a ceremony 

function App() {
  const dispatch = useAppDispatch();
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);
  const queue = useAppSelector(state => state.queue.participants);
  const queueError = useAppSelector(state => state.queue.error);
  const ceremonies = useAppSelector(state => state.ceremony.ceremonies);
  const ceremoniesError = useAppSelector(state => state.ceremony.error);
  const pendingCeremony = useAppSelector(state => state.ceremony.pendingCeremony);
  const ceremonyStatus = useAppSelector(state => state.ceremony.ceremonyStatus);
  const hasSignedCeremony = useAppSelector(state => state.ceremony.hasSignedCeremony);
  const selectedWallet = useAppSelector(state => state.wallet.selectedWallet);
  const walletAddress = useAppSelector(state => state.wallet.address);
  const balance = useAppSelector(state => state.wallet.balance);
  const lucid = useAppSelector(state => state.wallet.lucid);
  const {
    isSignupModalOpen,
    isQueueModalOpen,
    isCeremoniesModalOpen,
    isPendingCeremonyModalOpen,
  } = useAppSelector(state => state.modal);
  const recipientAddress = useAppSelector(state => state.signup.recipientAddress);
  const signupError = useAppSelector(state => state.signup.error);

  // Effect to get available wallets
  useEffect(() => {
    if (typeof (window as any).cardano === 'undefined') {
      dispatch(setWalletError("No Cardano wallet found"));
      return;
    }

    const labels = Object.keys((window as any).cardano);
    dispatch(setWalletSelectList(labels));
    dispatch(clearWalletError());
  }, [dispatch]);

  const handleWalletSelect = async (walletName: string) => {
    try {
      const wallet = (window as any).cardano[walletName];
      const api = await wallet.enable();

      // Initialize Lucid
      const _lucid = await Lucid(
        // new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.REACT_APP_BLOCKFROST_API_KEY),
        new Emulator([]),
        "Preview"
      );

      _lucid.selectWallet.fromAPI(api);
      dispatch(setLucid(_lucid));
      const address = await _lucid.wallet().address();

      // Get wallet balance
      const utxos = await _lucid.wallet().getUtxos();
      const walletBalance = utxos.reduce(
        (acc, utxo) => acc + utxo.assets.lovelace,
        BigInt(0)
      );

      dispatch(setPreviewWallet(walletName));
      dispatch(setPreviewAddress(address));
      dispatch(setWalletBalance({ lovelace: walletBalance }));
      dispatch(setSelectedWallet(walletName));
      dispatch(setAddress(address));
      dispatch(setBalance(walletBalance));
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
      dispatch(setWalletError("Failed to connect to wallet"));
    }
  };

  const handleSignup = async () => {
    if (!walletAddress || !recipientAddress) {
      dispatch(setSignupError("Please provide both addresses"));
      return;
    }

    try {
      // Create the payload
      const payload = fromText(JSON.stringify({
        context: "By signing this message, you express your intention to participate in a Turn Mixing Ceremony. A transaction will be created, and you will be asked to sign it. Failure to do so will result in your wallet being blacklisted from the Turn service. By signing this message, you also confirm that you have backed up the private key of the receiving address.",
        address: walletAddress,
        recipient: recipientAddress,
        signupTimestamp: new Date()
      }));

      console.log("signing message");
      // Sign the payload
      const signedMessage = await lucid.wallet().signMessage(walletAddress, payload);
      console.log("signed message", signedMessage);

      // Send to API
      const response = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedMessage,
          payload
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Success! Close modal and reset state
      dispatch(setSignupModalOpen(false));
      dispatch(resetSignupForm());
    } catch (error) {
      console.error("Signup failed:", error);
      dispatch(setSignupError(error instanceof Error ? error.message : "Failed to sign up"));
    }
  };

  // Effect to poll for queue and ceremonies data
  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        // Fetch queue
        const queueResponse = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/queue`);
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          dispatch(setQueue(queueData));
          dispatch(setQueueError(null));
        }

        // Fetch ceremonies
        const ceremoniesResponse = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/list_active_ceremonies`);
        if (ceremoniesResponse.ok) {
          const ceremoniesData = await ceremoniesResponse.json();
          dispatch(setCeremonies(ceremoniesData));
          dispatch(setCeremonyError(null));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        if (error instanceof Error) {
          dispatch(setQueueError(error.message));
          dispatch(setCeremonyError(error.message));
        }
      }
    };

    // Fetch immediately
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array since we want this to run once on mount

  // Effect to check for ceremonies that need signing
  useEffect(() => {
    if (!walletAddress || ceremonies.length === 0) {
      // Only reset if we haven't signed yet
      if (!hasSignedCeremony) {
        dispatch(setPendingCeremony(null));
        dispatch(setPendingCeremonyModalOpen(false));
      }
      return;
    }

    // Find the first ceremony where the user is a participant
    const userCeremony = ceremonies.find(ceremony =>
      ceremony.participants.some((p: any) => p.address === walletAddress)
    );

    if (userCeremony) {
      // Check if user has already provided a witness
      const userPaymentCredentialHash = paymentCredentialOf(walletAddress).hash;
      const hasAlreadySigned = userCeremony.witnesses.some((witness: string) => {
        try {
          const txWitness = CML.TransactionWitnessSet.from_cbor_hex(witness).vkeywitnesses()?.get(0);
          if (!txWitness) return false;
          const publicKey = txWitness.vkey();
          const witnessPaymentCredentialHash = publicKey.hash().to_hex();
          return witnessPaymentCredentialHash === userPaymentCredentialHash;
        } catch (error) {
          console.error("Error checking witness:", error);
          return false;
        }
      });

      if (hasAlreadySigned) {
        // User has already signed, show status popup
        dispatch(setPendingCeremony(userCeremony));
        dispatch(setPendingCeremonyModalOpen(true));
        dispatch(setHasSignedCeremony(true));
      } else {
        // User needs to sign
        dispatch(setPendingCeremony(userCeremony));
        dispatch(setPendingCeremonyModalOpen(true));
        dispatch(setHasSignedCeremony(false));
      }
    } else if (!hasSignedCeremony) {
      // No ceremony found for user and they haven't signed anything
      dispatch(setPendingCeremony(null));
      dispatch(setPendingCeremonyModalOpen(false));
    }
  }, [ceremonies, walletAddress, hasSignedCeremony, dispatch]);

  // Effect to poll ceremony status after signing
  useEffect(() => {
    if (!hasSignedCeremony || !pendingCeremony) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/ceremony_status?id=${pendingCeremony.id}`);
        const status = await response.text();
        dispatch(setCeremonyStatus(status));

        // If the ceremony is on-chain, stop polling
        if (status === 'on-chain') {
          return true;
        }

        // If the ceremony is still pending, fetch latest witness count
        if (status === 'pending') {
          const ceremoniesResponse = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/list_active_ceremonies`);
          if (ceremoniesResponse.ok) {
            const ceremonies = await ceremoniesResponse.json();
            const updatedCeremony = ceremonies.find((c: any) => c.id === pendingCeremony.id);
            if (updatedCeremony) {
              dispatch(setPendingCeremony(updatedCeremony));
              dispatch(updateCeremony(updatedCeremony));
            }
          }
        }

        return false;
      } catch (error) {
        console.error("Failed to fetch ceremony status:", error);
        return false;
      }
    };

    // Poll immediately
    pollStatus();

    // Set up polling interval
    const intervalId = setInterval(async () => {
      const shouldStop = await pollStatus();
      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [hasSignedCeremony, pendingCeremony, dispatch]);

  const handleSignCeremony = async (ceremonyId: string) => {
    try {
      const ceremony = ceremonies.find((c: any) => c.id === ceremonyId);
      if (!ceremony) {
        console.error("Ceremony not found");
        return;
      }
      const witness = await lucid.fromTx(ceremony.transaction).partialSign.withWallet();
      console.log("witness", witness);
      const response = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/submit_signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: ceremonyId, witness })
      });
      if (!response.ok) {
        throw new Error('Failed to submit signature');
      }
      console.log("Signature submitted successfully");
      dispatch(setHasSignedCeremony(true));
    } catch (error) {
      console.error("Failed to sign ceremony:", error);
    }
  }

  return (
    <div className="container">
      <div className="main">
        <HeadBox />
        {!selectedWallet && (
          <Card className="wallet-selection-card">
            <h3>Available Wallets</h3>
            <div 
            className="animated-text"
            // className="animated-text-non-animated"
            >
              <p>
                Welcome to Turn Network, please connect your wallet to get started and begin protecting your financial data.
              </p>
            </div>
            {walletSelectList.length === 0 ? (
              <p>
                No wallets found. Please install a Cardano wallet.</p>
            ) : (
              <div className="wallet-list">
                {walletSelectList.map((wallet, index) => (
                  <button
                    key={index}
                    onClick={() => handleWalletSelect(wallet)}
                    className={`wallet-select-button ${selectedWallet === wallet ? 'selected' : ''}`}
                  >
                    {wallet}
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {walletAddress && (
          <Card>
            <h3>Connected Wallet</h3>
            <p>Address: {walletAddress}</p>
            <p>Balance: {balance ? Number(BigInt(balance)) / 1000000 : 0} ADA</p>
            <p>Current Queue Size: {queue.length} participant{queue.length !== 1 ? 's' : ''}</p>
            <div className="wallet-actions">
              <Button
                onClick={() => dispatch(setSignupModalOpen(true))}
                style={{ flex: 1 }}
              >
                Sign Up
              </Button>
              <Button
                onClick={() => dispatch(setQueueModalOpen(true))}
                style={{ flex: 1 }}
              >
                View Queue
              </Button>
              <Button
                onClick={() => dispatch(setCeremoniesModalOpen(true))}
                style={{ flex: 1 }}
              >
                View Ceremonies
              </Button>
            </div>
          </Card>
        )}

        <Modal isOpen={isSignupModalOpen} onClose={() => {
          dispatch(setSignupModalOpen(false));
          dispatch(resetSignupForm());
        }}>
          <h2>Sign Up</h2>
          <div className="explanation-text">
            <p>
              Enter a receiving address. Click "Sign Up". You will be prompted to sign a message expressing your intention to participate in a Turn Mixing Ceremony. Once signed you will be added to the queue. After enough participants have joined the queue a transaction will be created and you will be asked to sign it. Once all participants have signed the transaction it will be submitted to the chain.
            </p>
          </div>
          <div className="signup-form">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => dispatch(setRecipientAddress(e.target.value))}
              placeholder="Recipient Address"
              className="signup-input"
            />
            {signupError && (
              <p className="signup-error">{signupError}</p>
            )}
            <Button
              onClick={handleSignup}
              style={{ width: '100%' }}
            >
              Sign Up
            </Button>
          </div>
        </Modal>

        <Modal isOpen={isQueueModalOpen} onClose={() => dispatch(setQueueModalOpen(false))}>
          <h2>Current Queue</h2>
          <div className="signup-form">
            {queueError ? (
              <p className="signup-error">{queueError}</p>
            ) : queue.length === 0 ? (
              <p>No participants in queue</p>
            ) : (
              <div className="queue-list">
                {queue.map((participant, index) => (
                  <div key={index} className="queue-item">
                    <p><strong>Address:</strong> {participant.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isCeremoniesModalOpen} onClose={() => dispatch(setCeremoniesModalOpen(false))}>
          <h2>Active Ceremonies</h2>
          <div className="signup-form">
            {ceremoniesError ? (
              <p className="signup-error">{ceremoniesError}</p>
            ) : ceremonies.length === 0 ? (
              <p>No active ceremonies</p>
            ) : (
              <div className="ceremonies-list">
                {ceremonies.map((ceremony, index) => (
                  <div key={ceremony.id} className="ceremony-item">
                    {
                      ceremony.participants.map((participant: any) => participant.address).includes(walletAddress) && (
                        <Button onClick={() => handleSignCeremony(ceremony.id)}>Sign Ceremony</Button>
                      )
                    }

                    <p><strong>Ceremony ID:</strong> {ceremony.id}</p>
                    <p><strong>Participants:</strong> {ceremony.participants.length}</p>
                    <p><strong>Witnesses:</strong> {ceremony.witnesses.length}</p>
                    {ceremony.transactionHash && (
                      <p>
                        <strong>Transaction Hash:</strong>{' '}
                        <a
                          href={`https://preview.cardanoscan.io/transaction/${ceremony.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ceremony-transaction-link"
                        >
                          {ceremony.transactionHash}
                        </a>
                      </p>
                    )}
                    {/* <p><strong>Transaction:</strong> <span style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{ceremony.transaction}</span></p> */}
                    <p>
                      <strong>Transaction:</strong> 
                    {/* <span style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{ceremony.transaction}</span> */}
                    <code>
                      {ceremony.transaction}
                    </code>
                    </p>
                    <div className="ceremony-participants">
                      <p><strong>Participants:</strong></p>
                      {ceremony.participants.map((participant: any, pIndex: number) => (
                        <div key={pIndex} className="ceremony-participant">
                          <p>{participant.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isPendingCeremonyModalOpen} onClose={() => {
          dispatch(setPendingCeremonyModalOpen(false));
          dispatch(resetCeremonyStatus());
        }}>
          <h2>{hasSignedCeremony ? 'Ceremony Status' : 'Ceremony Requires Your Signature'}</h2>
          {pendingCeremony && (
            <div className="signup-form">
              <p><strong>Ceremony ID:</strong> {pendingCeremony.id}</p>
              <p><strong>Total Participants:</strong> {pendingCeremony.participants.length}</p>
              <p><strong>Signatures Collected:</strong> {pendingCeremony.witnesses.length}</p>
              {pendingCeremony.transactionHash && (
                <p>
                  <strong>Transaction:</strong>{' '}
                  <a
                    href={`https://preview.cardanoscan.io/transaction/${pendingCeremony.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ceremony-transaction-link"
                  >
                    {pendingCeremony.transactionHash}
                  </a>
                </p>
              )}
              {hasSignedCeremony ? (
                <div className={`ceremony-status ${ceremonyStatus === 'on-chain' ? 'ceremony-status-success' : ceremonyStatus === 'pending' ? 'ceremony-status-pending' : 'ceremony-status-error'}`}>
                  {ceremonyStatus === 'pending' && (
                    <>
                      <p>Waiting for other participants to sign...</p>
                      <p>Signatures collected: {pendingCeremony.witnesses.length} of {pendingCeremony.participants.length + 1}</p>
                    </>
                  )}
                  {ceremonyStatus === 'on-chain' && (
                    <p style={{ color: 'white' }}>Transaction successfully submitted to chain!</p>
                  )}
                  {ceremonyStatus === 'could not find' && (
                    <p className="ceremony-status-error">Error: Ceremony not found</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="ceremony-participants">
                    <p><strong>Participants:</strong></p>
                    {pendingCeremony.participants.map((participant: any, pIndex: number) => (
                      <div key={pIndex} className={`ceremony-participant ${participant.address === walletAddress ? 'ceremony-participant-current' : ''}`}>
                        <p>Address: {participant.address}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleSignCeremony(pendingCeremony.id)}
                    style={{ width: '100%', marginTop: '1rem', backgroundColor: '#4CAF50', color: 'white' }}
                  >
                    Sign Ceremony
                  </Button>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

export default App;