import { useEffect, useState } from "react";
import "./styles/globals.css";
import { styles } from "./styles";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setWalletError, clearWalletError } from "./store/errorSlice";
import { setWalletSelectList, setPreviewWallet, setPreviewAddress, setWalletBalance } from "./store/networkSlice";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { Blockfrost, Lucid } from "@lucid-evolution/lucid";

function App() {
  const dispatch = useAppDispatch();
  const walletSelectList = useAppSelector(state => state.network.walletSelectList);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

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
      const lucid = await Lucid(
        new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.REACT_APP_BLOCKFROST_API_KEY),
        "Preprod"
      );
      
      lucid.selectWallet.fromAPI(api);
      const address = await lucid.wallet().address();
      
      // Get wallet balance
      const utxos = await lucid.wallet().getUtxos();
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
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;