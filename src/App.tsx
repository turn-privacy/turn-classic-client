import { useEffect, useState } from "react";
import "./styles/globals.css";
import { styles } from "./styles";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setWalletSelectList, setPreviewWallet, setPreviewAddress, setWalletBalance } from "./store/networkSlice";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import { Blockfrost, Lucid, fromText } from "@lucid-evolution/lucid";

function App() {
  const dispatch = useAppDispatch();
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [lucid, setLucid] = useState<any | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isCeremoniesModalOpen, setIsCeremoniesModalOpen] = useState(false);
  const [ceremonies, setCeremonies] = useState<any[]>([]);
  const [ceremoniesError, setCeremoniesError] = useState<string | null>(null);

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
      setIsModalOpen(false);
      setRecipientAddress("");
      setSignupError(null);
    } catch (error) {
      console.error("Signup failed:", error);
      setSignupError(error instanceof Error ? error.message : "Failed to sign up");
    }
  };

  const handleViewQueue = async () => {
    try {
      const response = await fetch('http://localhost:8000/queue');
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      const data = await response.json();
      setQueue(data);
      setQueueError(null);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      setQueueError(error instanceof Error ? error.message : "Failed to fetch queue");
    }
  };

  const handleViewCeremonies = async () => {
    try {
      const response = await fetch('http://localhost:8000/list_active_ceremonies');
      if (!response.ok) {
        throw new Error('Failed to fetch ceremonies');
      }
      const data = await response.json();
      setCeremonies(data);
      setCeremoniesError(null);
    } catch (error) {
      console.error("Failed to fetch ceremonies:", error);
      setCeremoniesError(error instanceof Error ? error.message : "Failed to fetch ceremonies");
    }
  };

  const handleSignCeremony = async (ceremonyId: string) => {
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setIsModalOpen(true)}
                style={{ flex: 1 }}
              >
                Sign Up
              </Button>
              <Button
                onClick={() => {
                  setIsQueueModalOpen(true);
                  handleViewQueue();
                }}
                style={{ flex: 1 }}
              >
                View Queue
              </Button>
              <Button
                onClick={() => {
                  setIsCeremoniesModalOpen(true);
                  handleViewCeremonies();
                }}
                style={{ flex: 1 }}
              >
                View Ceremonies
              </Button>
            </div>
          </Card>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
                    <p><strong>Recipient:</strong> {participant.recipient}</p>
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
                          <p>Recipient: {participant.recipient}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}

export default App;