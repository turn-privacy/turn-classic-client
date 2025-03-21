import { useState } from 'react';
import './Menu.css';
import { AdminModal } from './AdminModal';
import { useAppSelector } from '../store/hooks';
import { paymentCredentialOf } from '@lucid-evolution/lucid';

const ADMIN_CREDENTIAL = 'f773436b65daf2dd60a937330c8da08514f3f3c4bc08ea966d3e89f0';

export const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const walletAddress = useAppSelector(state => state.wallet.address);
  const spendingCredential = walletAddress ? paymentCredentialOf(walletAddress).hash : null;
  const isAdmin = spendingCredential === ADMIN_CREDENTIAL;

  const handleAdminClick = () => {
    setIsOpen(false);
    setIsAdminModalOpen(true);
  };

  return (
    <>
      <div className="menu-container">
        <button 
          className="menu-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          Menu
        </button>
        {isOpen && (
          <div className="menu-dropdown">
            <a
              href="https://turn-network.gitbook.io/turn"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              Docs
            </a>
            <a
              href={`${process.env.REACT_APP_BASE_SERVER_URL}/ceremony_history`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              History
            </a>
            <a
              href="https://x.com/turnprotocol"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              Twitter
            </a>
            <a
              href="https://discord.com/invite/4BTgMb9BBB"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              Discord
            </a>
            {isAdmin && (
              <button 
                className="menu-item-button"
                onClick={handleAdminClick}
              >
                Admin Portal
              </button>
            )}
          </div>
        )}
      </div>
      <AdminModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />
    </>
  );
}; 