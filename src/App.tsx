import { useEffect, useState } from "react";
import "./styles/globals.css";
import { Blockfrost, Lucid, WalletApi } from "@lucid-evolution/lucid";
import { styles } from "./styles";
import { init_get_wallet_address } from "./functions";
import { Card } from "./components/Card";
import { NetworkSelector } from "./components/NetworkSelector";
import { CeremonyStatus } from "./components/CeremonyStatus";
import { LocalNetwork } from "./components/LocalNetwork";
import { PreviewNetwork } from "./components/PreviewNetwork";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { faucetSuccess } from "./store/faucetSlice";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setSignStatus, setPendingTransaction, resetTransactionState } from "./store/transactionSlice";
import {
    setParticipantQueue,
    ceremonyConcludedSuccess,
    ceremonyFailedReset,
    setCeremonyFailure
} from "./store/ceremonySlice";
import {
    setWalletSelectList,
    setPreviewWalletApi,
    setPreviewLucid,
    setPreviewAddress,
    setWalletBalance
} from "./store/networkSlice";
import {
    setLocalWalletAddress,
    setLocalWalletSeedPhrase,
    setLocalRecipientAddress,
    setLocalRecipientSeedPhrase,
    setManualRecipientAddress,
    setSocket
} from "./store/walletSlice";
import { Button } from "./components/Button";

function App() {
  const dispatch = useAppDispatch();
  
  // Network selectors
  const selectedNetwork = useAppSelector(state => state.network.selectedNetwork);
  const previewWallet = useAppSelector(state => state.network.previewWallet);
  const previewLucid = useAppSelector(state => state.network.previewLucid);
  const previewWalletApi = useAppSelector(state => state.network.previewWalletApi);
  const previewAddress = useAppSelector(state => state.network.previewAddress);
  const walletBalance = useAppSelector(state => state.network.walletBalance);
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);

  // Wallet selectors
  const localWalletAddress = useAppSelector(state => state.wallet.localWalletAddress);
  const localWalletSeedPhrase = useAppSelector(state => state.wallet.localWalletSeedPhrase);
  const localRecipientAddress = useAppSelector(state => state.wallet.localRecipientAddress);
  const localRecipientSeedPhrase = useAppSelector(state => state.wallet.localRecipientSeedPhrase);
  const manualRecipientAddress = useAppSelector(state => state.wallet.manualRecipientAddress);
  const socket = useAppSelector(state => state.wallet.socket);

  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistData, setBlacklistData] = useState<any>(null);

  // Effect to get available wallets
  useEffect(() => {
    if (selectedNetwork !== 'preview') return;

    if (typeof (window as any).cardano === 'undefined') {
      dispatch(setWalletError("No Cardano wallet found"));
      return;
    }

    const labels = Object.keys((window as any).cardano);
    dispatch(setWalletSelectList(labels));
    dispatch(clearWalletError());
  }, [selectedNetwork, dispatch]);

  // Effect to initialize Lucid with selected wallet
  useEffect(() => {
    const loadLucid = async () => {
      try {
        const _lucid = await Lucid(
          new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.REACT_APP_BLOCKFROST_API_KEY,),
          "Preprod");
        const api: WalletApi = await previewWallet.enable();
        dispatch(setPreviewWalletApi(api));
        _lucid.selectWallet.fromAPI(api);
        dispatch(setPreviewLucid(_lucid));

        // Get wallet address
        const address = await _lucid.wallet().address();
        dispatch(setPreviewAddress(address));

        // Get wallet balance
        const utxos = await _lucid.wallet().getUtxos();
        const balance = utxos.reduce(
          (acc, utxo) => ({
            lovelace: acc.lovelace + utxo.assets.lovelace
          }),
          { lovelace: BigInt(0) }
        );
        dispatch(setWalletBalance(balance));

        // Generate recipient wallet
        const [recAddress, recSeedPhrase] = await init_get_wallet_address();
        dispatch(setLocalRecipientAddress(recAddress));
        dispatch(setLocalRecipientSeedPhrase(recSeedPhrase));

        // Connect to WebSocket when wallet is connected
        const ws = new WebSocket("ws://localhost:8081");
        ws.onopen = () => {
          console.log("Connected to server");
        };
        ws.onmessage = handleWsMessage;
        dispatch(setSocket(ws));

        return () => {
          dispatch(setSocket(null));
        };
      } catch (error) {
        console.error("Error loading Lucid:", error);
        dispatch(setWalletError("Failed to initialize wallet"));
      }
    };

    if (!previewWallet) return;
    loadLucid();
  }, [previewWallet, dispatch]);

  // Handler for websocket messages
  const handleWsMessage = async (event: MessageEvent) => {
    console.log("Message from server:", event.data);
    const ws = event.currentTarget as WebSocket;

    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case "Marco!":
        console.log("sending heartbeat (Polo!)");
        ws.send(JSON.stringify({ type: "Polo!" }));
        break;
      case "failed_signup":
        console.log("%cFailed to sign up:", "color: red", msg.data);
        break;
      case "signup_ack":
        console.log("%cSigned up successfully:", "color: green", msg.data);
        break;
      case "show_participant_queue":
        console.log("%cParticipant queue:", "color: teal", msg.data);
        dispatch(setParticipantQueue(msg.data));
        break;
      case "transactionReady":
        console.log("Transaction ready:", msg.data);
        dispatch(setPendingTransaction(msg.data.tx));
        dispatch(setCeremonyFailure(null));
        break;
      case "faucet_sent":
        console.log("%cYour account has been funded:", "color: lime", msg.data);
        dispatch(faucetSuccess(msg.data));
        break;
      case "signature_ack":
        console.log("%cSignature acknowledged:", "color: hotpink", msg.data);
        dispatch(setSignStatus("Transaction signed successfully!"));
        setTimeout(() => {
          dispatch(setPendingTransaction(null));
          dispatch(setSignStatus(null));
        }, 3000);
        break;
      case "ceremonyConcluded":
        console.log(`%cCeremony concluded with transaction ${msg.data.tx}`, "color: purple", msg.data.msg);
        dispatch(ceremonyConcludedSuccess(msg.data));
        break;
      case "ceremonyFailed":
        console.log("%cCeremony failed:", "color: red", msg.data.reason);
        console.log("%c" + msg.data.msg, "color: yellow");
        dispatch(resetTransactionState());
        dispatch(ceremonyFailedReset(msg.data));
        break;
      case "blacklist_contents":
        setBlacklistData(msg);
        setShowBlacklistModal(true);
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
    dispatch(setSocket(ws));

    init_get_wallet_address().then(([address, seedPhrase]) => {
      console.log("Wallet Address:", address);
      console.log("Seed Phrase:", seedPhrase);
      dispatch(setLocalWalletAddress(address));
      dispatch(setLocalWalletSeedPhrase(seedPhrase));
    });

    init_get_wallet_address().then(([recipientAddress, recipientSeedPhrase]) => {
      console.log("Recipient Address:", recipientAddress);
      console.log("Recipient Seed Phrase:", recipientSeedPhrase);
      dispatch(setLocalRecipientAddress(recipientAddress));
      dispatch(setLocalRecipientSeedPhrase(recipientSeedPhrase));
    });

    return () => {
      dispatch(setSocket(null));
    };
  }, [selectedNetwork, dispatch]);

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <NetworkSelector />

        {!selectedNetwork && (
          <Card style={{ textAlign: "center" }}>
            <h3>Please select a network to continue</h3>
          </Card>
        )}

        {selectedNetwork === 'preview' && (
          <PreviewNetwork
            recipientAddress={localRecipientAddress}
            recipientSeedPhrase={localRecipientSeedPhrase}
            socket={socket}
            setManualRecipientAddress={(address) => dispatch(setManualRecipientAddress(address))}
            manualRecipientAddress={manualRecipientAddress}
          />
        )}

        {selectedNetwork === 'local' && (
          <LocalNetwork
            walletAddress={localWalletAddress}
            walletSeedPhrase={localWalletSeedPhrase}
            recipientAddress={localRecipientAddress}
            recipientSeedPhrase={localRecipientSeedPhrase}
            socket={socket}
            previewLucid={previewLucid}
          />
        )}

        <CeremonyStatus />

        <div style={{ margin: '20px' }}>
          <Button onClick={() => socket?.send(JSON.stringify({ type: "show_blacklist" }))}>
            Show Blacklist
          </Button>
        </div>

        {showBlacklistModal && blacklistData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '80%',
              maxHeight: '80%',
              overflow: 'auto'
            }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(blacklistData, null, 2)}
              </pre>
              <button 
                onClick={() => setShowBlacklistModal(false)}
                style={{ marginTop: '10px' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;