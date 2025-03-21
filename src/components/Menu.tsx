import { useState } from 'react';
import './Menu.css';

export const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
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
        </div>
      )}
    </div>
  );
}; 