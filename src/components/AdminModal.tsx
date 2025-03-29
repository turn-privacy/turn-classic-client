import { Modal } from './Modal';
import { useAppSelector } from '../store/hooks';
import { paymentCredentialOf } from '@lucid-evolution/lucid';
import { Button } from './Button';
import { useState, useEffect } from 'react';
import { fromText } from '@lucid-evolution/lucid';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlacklistEntry {
  address: string;
  reason: string;
}

interface CancelledCeremony {
  id: string;
  reason: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const walletAddress = useAppSelector(state => state.wallet.address);
  const lucid = useAppSelector(state => state.wallet.lucid);
  const spendingCredential = walletAddress ? paymentCredentialOf(walletAddress).hash : null;
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [cancelledCeremonies, setCancelledCeremonies] = useState<CancelledCeremony[]>([]);
  const [isBlacklistExpanded, setIsBlacklistExpanded] = useState(false);
  const [isCancelledExpanded, setIsCancelledExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const [blacklistResponse, cancelledResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/blacklist`),
          fetch(`${process.env.REACT_APP_BASE_SERVER_URL}/list_cancelled_ceremonies`)
        ]);

        if (!blacklistResponse.ok || !cancelledResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const blacklistData = await blacklistResponse.json();
        const cancelledData = await cancelledResponse.json();
        
        setBlacklist(blacklistData);
        setCancelledCeremonies(cancelledData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

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
            <div className="admin-section">
              <h3>Blacklist</h3>
              <Button 
                onClick={() => setIsBlacklistExpanded(!isBlacklistExpanded)}
                style={{ marginBottom: '10px' }}
              >
                {isBlacklistExpanded ? 'Hide Blacklist' : 'Show Blacklist'}
              </Button>
              {isBlacklistExpanded && (
                <div className="admin-list">
                  {isLoading ? (
                    <p>Loading blacklist...</p>
                  ) : blacklist.length === 0 ? (
                    <p>No blacklisted addresses</p>
                  ) : (
                    <ul>
                      {blacklist.map((entry, index) => (
                        <li key={index}>
                          <strong>Address:</strong> {entry.address}
                          <br />
                          <strong>Reason:</strong> {entry.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="admin-section">
              <h3>Cancelled Ceremonies</h3>
              <Button 
                onClick={() => setIsCancelledExpanded(!isCancelledExpanded)}
                style={{ marginBottom: '10px' }}
              >
                {isCancelledExpanded ? 'Hide Cancelled Ceremonies' : 'Show Cancelled Ceremonies'}
              </Button>
              {isCancelledExpanded && (
                <div className="admin-list">
                  {isLoading ? (
                    <p>Loading cancelled ceremonies...</p>
                  ) : cancelledCeremonies.length === 0 ? (
                    <p>No cancelled ceremonies</p>
                  ) : (
                    <ul>
                      {cancelledCeremonies.map((ceremony) => (
                        <li key={ceremony.id}>
                          <strong>Ceremony ID:</strong> {ceremony.id}
                          <br />
                          <strong>Reason:</strong> {ceremony.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <p>Please connect your wallet to view admin information.</p>
        )}
      </div>
    </Modal>
  );
}; 