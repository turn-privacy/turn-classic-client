import { useEffect, useState } from "react";
import "./styles/globals.css";
import { Blockfrost, Lucid, WalletApi } from "@lucid-evolution/lucid";
import { styles } from "./styles";
import { 
  init_get_wallet_address,
 } from "./functions";
import { Card } from "./components/Card";
import { NetworkSelector } from "./components/NetworkSelector";
import { CeremonyStatus } from "./components/CeremonyStatus";
import { LocalNetwork } from "./components/LocalNetwork";
import { PreviewNetwork } from "./components/PreviewNetwork";
import { useAppDispatch } from "./store/hooks";
import { faucetSuccess } from "./store/faucetSlice";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setSignStatus, setIsSigning } from "./store/transactionSlice";
import {
    setParticipantQueue,
    ceremonyConcludedSuccess,
    ceremonyFailedReset,
    setCeremonyFailure
} from "./store/ceremonySlice";

function App() {
  const dispatch = useAppDispatch();
  const [selectedNetwork, setSelectedNetwork] = useState<'local' | 'preview' | null>(null);
  const [walletSeedPhrase, setWalletSeedPhrase] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [recipientSeedPhrase, setRecipientSeedPhrase] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<any | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [walletSelectList, setWalletSelectList] = useState<string[]>([]);
  const [previewWallet, setPreviewWallet] = useState<any>(null);
  const [previewWalletApi, setPreviewWalletApi] = useState<any>(null);
  const [previewLucid, setPreviewLucid] = useState<any>(null);
  const [previewAddress, setPreviewAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<{ lovelace: bigint } | null>(null);
  const [manualRecipientAddress, setManualRecipientAddress] = useState<string | null>(null);

  // Effect to get available wallets
  useEffect(() => {
    if (selectedNetwork !== 'preview') return;

    if (typeof (window as any).cardano === 'undefined') {
      dispatch(setWalletError("No Cardano wallet found"));
      return;
    }

    const labels = Object.keys((window as any).cardano);
    setWalletSelectList(labels);
    dispatch(clearWalletError());
  }, [selectedNetwork, dispatch]);

  // Function to select wallet
  const selectWallet = async (walletName: string) => {
    try {
      const choice = (window as any).cardano[walletName];
      setPreviewWallet(choice);
    } catch (error) {
      console.error("Error selecting wallet:", error);
      dispatch(setWalletError(`Failed to select ${walletName}`));
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
        dispatch(setWalletError("Failed to initialize wallet"));
      }
    };

    if (!previewWallet) return;
    loadLucid();
  }, [previewWallet, dispatch]);

  // Handler for websocket messages
  const handleWsMessage = async (event: MessageEvent) => {
    console.log("Message from server:", event.data);
    const socket = event.currentTarget as WebSocket;

    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case "Marco!":
        console.log("sending heartbeat (Polo!)");
        socket.send(JSON.stringify({ type: "Polo!" }));
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
        setPendingTransaction(msg.data);
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
          setPendingTransaction(null);
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
        setPendingTransaction(null);
        dispatch(setSignStatus(null));
        dispatch(setIsSigning(false));
        dispatch(ceremonyFailedReset(msg.data));
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
            walletSelectList={walletSelectList}
            previewWallet={previewWallet}
            previewAddress={previewAddress}
            walletBalance={walletBalance}
            recipientAddress={recipientAddress}
            recipientSeedPhrase={recipientSeedPhrase}
            pendingTransaction={pendingTransaction}
            socket={socket}
            previewLucid={previewLucid}
            previewWalletApi={previewWalletApi}
            onSelectWallet={selectWallet}
            setManualRecipientAddress={setManualRecipientAddress}
            manualRecipientAddress={manualRecipientAddress}
          />
        )}

        {selectedNetwork === 'local' && (
          <LocalNetwork
            walletAddress={walletAddress}
            walletSeedPhrase={walletSeedPhrase}
            recipientAddress={recipientAddress}
            recipientSeedPhrase={recipientSeedPhrase}
            pendingTransaction={pendingTransaction}
            socket={socket}
            previewLucid={previewLucid}
          />
        )}

        <CeremonyStatus />
      </main>
    </div>
  );
}

export default App;