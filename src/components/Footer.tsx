import twitter from '../assets/twitter.svg';
import discord from '../assets/discord.svg';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Logo and Title Section */}
        <div className="logo-section">
          <img
            src="/logo-footer.png"
            alt="logo"
          />
          <h1>
            Turn 
          </h1>
        </div>

        {/* Quick Links Section */}
        <div className="quick-links">
          <h2>
            Quick Links
          </h2>
          <div>
            <a
              href="https://turn-network.gitbook.io/turn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="social-section">
          <h2>
            Follow us on
          </h2>
          <div className="social-icons">
            <a href="https://x.com/turnprotocol" target="_blank" rel="noopener noreferrer">
              <img
                src={twitter}
                alt="Twitter logo"
              />
            </a>
            <a href="https://discord.com/invite/4BTgMb9BBB" target="_blank" rel="noopener noreferrer">
              <img
                src={discord}
                alt="Discord logo"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="separator" />

      {/* Footer Text */}
      <div className="footer-text">
        © 2025 Turn. All rights reserved. Built on Cardano.
      </div>
    </footer>
  );
}

export default Footer;
