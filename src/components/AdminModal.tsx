import { Modal } from './Modal';
import { useAppSelector } from '../store/hooks';
import { paymentCredentialOf } from '@lucid-evolution/lucid';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const walletAddress = useAppSelector(state => state.wallet.address);
  const spendingCredential = walletAddress ? paymentCredentialOf(walletAddress).hash : null;

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
          </>
        ) : (
          <p>Please connect your wallet to view admin information.</p>
        )}
      </div>
    </Modal>
  );
}; 