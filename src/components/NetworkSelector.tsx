import { Card } from "./Card";
import { Button } from "./Button";

export interface NetworkSelectorProps {
  selectedNetwork: 'local' | 'preview' | null;
  setSelectedNetwork: (network: 'local' | 'preview' | null) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ selectedNetwork, setSelectedNetwork }) => (
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