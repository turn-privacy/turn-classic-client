import { useEffect, useState } from "react";
import "./styles/globals.css";
import { styles } from "./styles";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setWalletSelectList, setPreviewWallet, setPreviewAddress, setWalletBalance } from "./store/networkSlice";
import { setQueue, setQueueError } from "./store/queueSlice";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import { Blockfrost, Lucid, fromText } from "@lucid-evolution/lucid";

const POLLING_INTERVAL = 10000; // 30 seconds in milliseconds

function App() {
  const dispatch = useAppDispatch();
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);
  const queue = useAppSelector(state => state.queue.participants);
  const queueError = useAppSelector(state => state.queue.error);
  
  // group 1
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  // group 2
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [signupError, setSignupError] = useState<string | null>(null);
  // group 3
  const [lucid, setLucid] = useState<any | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  // group 4
  const [isCeremoniesModalOpen, setIsCeremoniesModalOpen] = useState(false);
  const [ceremonies, setCeremonies] = useState<any[]>([]);
  // group 5
  const [ceremoniesError, setCeremoniesError] = useState<string | null>(null);
  const [pendingCeremony, setPendingCeremony] = useState<any | null>(null);
  const [isPendingCeremonyModalOpen, setIsPendingCeremonyModalOpen] = useState(false);
  // group 6
  const [hasSignedCeremony, setHasSignedCeremony] = useState(false);
  const [ceremonyStatus, setCeremonyStatus] = useState<string | null>(null);

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
        new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.REACT_APP_BLOCKFROST_API_KEY),
        "Preprod"
      );
      
      _lucid.selectWallet.fromAPI(api);
      setLucid(_lucid);
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
      setSelectedWallet(walletName);
      setWalletAddress(address);
      setBalance(walletBalance);
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
      dispatch(setWalletError("Failed to connect to wallet"));
    }
  };

  const handleSignup = async () => {
    if (!walletAddress || !recipientAddress) {
      setSignupError("Please provide both addresses");
      return;
    }

    try {
      // Create the payload
      const payload = fromText(JSON.stringify({
        address: walletAddress,
        recipient: recipientAddress
      }));

      console.log("signing message");
      // Sign the payload
      const signedMessage = await lucid.wallet().signMessage(walletAddress, payload);
      console.log("signed message", signedMessage);

      // Send to API
      const response = await fetch('http://localhost:8000/signup', {
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
      setIsSignupModalOpen(false);
      setRecipientAddress("");
      setSignupError(null);
    } catch (error) {
      console.error("Signup failed:", error);
      setSignupError(error instanceof Error ? error.message : "Failed to sign up");
    }
  };

  // Effect to poll for queue and ceremonies data
  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        // Fetch queue
        const queueResponse = await fetch('http://localhost:8000/queue');
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          dispatch(setQueue(queueData));
          dispatch(setQueueError(null));
        }

        // Fetch ceremonies
        const ceremoniesResponse = await fetch('http://localhost:8000/list_active_ceremonies');
        if (ceremoniesResponse.ok) {
          const ceremoniesData = await ceremoniesResponse.json();
          setCeremonies(ceremoniesData);
          setCeremoniesError(null);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        if (error instanceof Error) {
          dispatch(setQueueError(error.message));
          setCeremoniesError(error.message);
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
        setPendingCeremony(null);
        setIsPendingCeremonyModalOpen(false);
      }
      return;
    }

    // Find the first ceremony where the user is a participant and hasn't signed yet
    const ceremonyNeedingSigning = ceremonies.find(ceremony => {
      const isParticipant = ceremony.participants.some((p: any) => p.address === walletAddress);
      const hasNotSigned = !ceremony.witnesses.includes(walletAddress);
      return isParticipant && hasNotSigned;
    });

    if (ceremonyNeedingSigning) {
      setPendingCeremony(ceremonyNeedingSigning);
      setIsPendingCeremonyModalOpen(true);
    } else if (!hasSignedCeremony) {
      // Only close the modal if we haven't signed yet
      setPendingCeremony(null);
      setIsPendingCeremonyModalOpen(false);
    }
  }, [ceremonies, walletAddress, hasSignedCeremony]); // Added hasSignedCeremony to dependencies

  // Effect to poll ceremony status after signing
  useEffect(() => {
    if (!hasSignedCeremony || !pendingCeremony) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/ceremony_status?id=${pendingCeremony.id}`);
        const status = await response.text();
        setCeremonyStatus(status);

        // If the ceremony is on-chain, stop polling
        if (status === 'on-chain') {
          return true;
        }

        // If the ceremony is still pending, fetch latest witness count
        if (status === 'pending') {
          const ceremoniesResponse = await fetch('http://localhost:8000/list_active_ceremonies');
          if (ceremoniesResponse.ok) {
            const ceremonies = await ceremoniesResponse.json();
            const updatedCeremony = ceremonies.find((c: any) => c.id === pendingCeremony.id);
            if (updatedCeremony) {
              setPendingCeremony(updatedCeremony);
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
  }, [hasSignedCeremony, pendingCeremony]);

  const handleSignCeremony = async (ceremonyId: string) => {
    try {
      const ceremony = ceremonies.find((c: any) => c.id === ceremonyId);
      const witness = await lucid.fromTx(ceremony.transaction).partialSign.withWallet();
      console.log("witness", witness);
      const response = await fetch('http://localhost:8000/submit_signature', {
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
      setHasSignedCeremony(true);
    } catch (error) {
      console.error("Failed to sign ceremony:", error);
    }
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <h1>Turn Classic</h1>
        {!selectedWallet && (
          <Card>
            <h3>Available Wallets</h3>
            {walletSelectList.length === 0 ? (
              <p>No wallets found. Please install a Cardano wallet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {walletSelectList.map((wallet, index) => (
                  <Button
                    key={index}
                    onClick={() => handleWalletSelect(wallet)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: selectedWallet === wallet ? '#00aaff' : 'transparent',
                      color: selectedWallet === wallet ? 'white' : 'inherit'
                    }}
                  >
                    {wallet}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        )}

        {walletAddress && (
          <Card>
            <h3>Connected Wallet</h3>
            <p>Address: {walletAddress}</p>
            <p>Balance: {balance ? Number(balance) / 1000000 : 0} ADA</p>
            <p>Current Queue Size: {queue.length} participant{queue.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setIsSignupModalOpen(true)}
                style={{ flex: 1 }}
              >
                Sign Up
              </Button>
              <Button
                onClick={() => {
                  setIsQueueModalOpen(true);
                }}
                style={{ flex: 1 }}
              >
                View Queue
              </Button>
              <Button
                onClick={() => {
                  setIsCeremoniesModalOpen(true);
                }}
                style={{ flex: 1 }}
              >
                View Ceremonies
              </Button>
            </div>
          </Card>
        )}

        <Modal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)}>
          <h2>Sign Up</h2>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Recipient Address"
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            {signupError && (
              <p style={{ color: 'red', marginBottom: '0.5rem' }}>{signupError}</p>
            )}
            <Button 
              onClick={handleSignup}
              style={{ width: '100%' }}
            >
              Sign Up
            </Button>
          </div>
        </Modal>

        <Modal isOpen={isQueueModalOpen} onClose={() => setIsQueueModalOpen(false)}>
          <h2>Current Queue</h2>
          <div style={{ marginBottom: '1rem' }}>
            {queueError ? (
              <p style={{ color: 'red' }}>{queueError}</p>
            ) : queue.length === 0 ? (
              <p>No participants in queue</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {queue.map((participant, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#f5f5f5',
                    marginBottom: '0.5rem',
                    borderRadius: '4px'
                  }}>
                    <p><strong>Address:</strong> {participant.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isCeremoniesModalOpen} onClose={() => setIsCeremoniesModalOpen(false)}>
          <h2>Active Ceremonies</h2>
          <div style={{ marginBottom: '1rem' }}>
            {ceremoniesError ? (
              <p style={{ color: 'red' }}>{ceremoniesError}</p>
            ) : ceremonies.length === 0 ? (
              <p>No active ceremonies</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {ceremonies.map((ceremony, index) => (
                  <div key={ceremony.id} style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#f5f5f5',
                    marginBottom: '0.5rem',
                    borderRadius: '4px'
                  }}>
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
                        <strong>Transaction:</strong>{' '}
                        <a 
                          href={`https://preview.cardanoscan.io/transaction/${ceremony.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#00aaff', textDecoration: 'underline' }}
                        >
                          {ceremony.transactionHash}
                        </a>
                      </p>
                    )}
                    <p><strong>Transaction:</strong> {ceremony.transaction}</p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <p><strong>Participants:</strong></p>
                      {ceremony.participants.map((participant: any, pIndex: number) => (
                        <div key={pIndex} style={{ 
                          marginLeft: '1rem',
                          padding: '0.5rem',
                          borderLeft: '2px solid #ccc'
                        }}>
                          <p>Address: {participant.address}</p>
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
          setIsPendingCeremonyModalOpen(false);
          setHasSignedCeremony(false);
          setCeremonyStatus(null);
        }}>
          <h2>{hasSignedCeremony ? 'Ceremony Status' : 'Ceremony Requires Your Signature'}</h2>
          {pendingCeremony && (
            <div style={{ marginBottom: '1rem' }}>
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
                    style={{ color: '#00aaff', textDecoration: 'underline' }}
                  >
                    {pendingCeremony.transactionHash}
                  </a>
                </p>
              )}
              {hasSignedCeremony ? (
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: ceremonyStatus === 'on-chain' ? '#e8f5e9' : '#fff3e0',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  {ceremonyStatus === 'pending' && (
                    <>
                      <p>Waiting for other participants to sign...</p>
                      <p>Signatures collected: {pendingCeremony.witnesses.length} of {pendingCeremony.participants.length + 1}</p>
                    </>
                  )}
                  {ceremonyStatus === 'on-chain' && (
                    <p style={{ color: '#2e7d32' }}>Transaction successfully submitted to chain!</p>
                  )}
                  {ceremonyStatus === 'could not find' && (
                    <p style={{ color: '#d32f2f' }}>Error: Ceremony not found</p>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ marginTop: '1rem' }}>
                    <p><strong>Participants:</strong></p>
                    {pendingCeremony.participants.map((participant: any, pIndex: number) => (
                      <div key={pIndex} style={{ 
                        marginLeft: '1rem',
                        padding: '0.5rem',
                        borderLeft: '2px solid #ccc',
                        backgroundColor: participant.address === walletAddress ? '#f0f8ff' : 'transparent'
                      }}>
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
      </main>
    </div>
  );
}

export default App;