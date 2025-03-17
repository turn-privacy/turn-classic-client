import twitter from '../assets/twitter.svg';
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
            Turn Network
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
          <img
            src={twitter}
            alt="Twitter logo"
          />
        </div>
      </div>

      {/* Separator Line */}
      <div className="separator" />

      {/* Footer Text */}
      <div className="footer-text">
        © 2025 Turn Network. All rights reserved. Built on Turn Network.
      </div>
    </footer>
  );
}

export default Footer;
