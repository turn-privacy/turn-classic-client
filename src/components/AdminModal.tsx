import { Modal } from './Modal';
import { useAppSelector } from '../store/hooks';
import { paymentCredentialOf } from '@lucid-evolution/lucid';
import { Button } from './Button';
import { useState } from 'react';
import { fromText } from '@lucid-evolution/lucid';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const walletAddress = useAppSelector(state => state.wallet.address);
  const lucid = useAppSelector(state => state.wallet.lucid);
  const spendingCredential = walletAddress ? paymentCredentialOf(walletAddress).hash : null;
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!walletAddress || !lucid) return;
    
    try {
      setIsResetting(true);
      setResetError(null);

      // Create the message to sign
      const message = fromText(JSON.stringify({
        context: "By signing this message, you confirm that you are the admin and intend to reset the database. This action cannot be undone.",
        address: walletAddress,
        timestamp: new Date().toISOString(),
        action: "reset_database"
      }));

      // Get the signed message from the wallet
      const signedMessage = await lucid.wallet().signMessage(walletAddress, message);

      // Send to API
      const response = await fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/admin/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedMessage,
          message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Success! Close modal
      onClose();
    } catch (error) {
      console.error("Reset failed:", error);
      setResetError(error instanceof Error ? error.message : "Failed to reset database");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Admin Portal</h2>
      <div className="admin-content">
        {walletAddress ? (
          <>
            <div className="admin-section">
              <h3>Wallet Information</h3>
              <div className="admin-info">
                <p><strong>Address:</strong> {walletAddress}</p>
                <p><strong>Spending Credential:</strong> {spendingCredential}</p>
              </div>
            </div>
            <div className="admin-section">
              <h3>Database Management</h3>
              <div className="admin-actions">
                <a
                  href={`${process.env.REACT_APP_BASE_SERVER_URL}/ceremony_history`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{ marginRight: '10px' }}
                >
                  View History
                </a>
                <Button 
                  onClick={handleReset}
                  disabled={isResetting}
                  style={{ backgroundColor: '#d32f2f' }}
                >
                  {isResetting ? 'Resetting...' : 'Reset Database'}
                </Button>
                {resetError && (
                  <p className="admin-error">{resetError}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p>Please connect your wallet to view admin information.</p>
        )}
      </div>
    </Modal>
  );
}; 