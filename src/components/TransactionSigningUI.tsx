import { Button } from "./Button";
import { Card } from "./Card";
import { TransactionSigningUIProps } from "../types/props"; 

export const TransactionSigningUI: React.FC<TransactionSigningUIProps> = ({ pendingTransaction, isSigning, signStatus, onSign }) => (
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