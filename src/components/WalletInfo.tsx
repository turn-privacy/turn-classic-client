import { WalletInfoProps } from "../types/props";
import { Card } from "./Card";
import { Button } from "./Button";

export const WalletInfo: React.FC<WalletInfoProps> = ({ 
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