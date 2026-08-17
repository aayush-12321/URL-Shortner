import React from 'react';

function Footer({ currentPage, onNavigate }) {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span className="brand-name">Shortlink</span>
          </div>
          <p className="footer-description">
            A fast, secure, and modern URL shortener designed to simplify links, custom aliases, and real-time click tracking.
          </p>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-heading">Navigation</h4>
          <ul className="footer-list">
            <li>
              <button
                className={`footer-link-btn ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => onNavigate('home')}
              >
                Link Shortener
              </button>
            </li>
            <li>
              <button
                className={`footer-link-btn ${currentPage === 'features' ? 'active' : ''}`}
                onClick={() => onNavigate('features')}
              >
                Features & Use Cases
              </button>
            </li>
            <li>
              <button
                className={`footer-link-btn ${currentPage === 'how-it-works' ? 'active' : ''}`}
                onClick={() => onNavigate('how-it-works')}
              >
                How It Works & Help
              </button>
            </li>
            <li>
              <button
                className={`footer-link-btn ${currentPage === 'api-docs' ? 'active' : ''}`}
                onClick={() => onNavigate('api-docs')}
              >
                Developer API Docs
              </button>
            </li>
            <li>
              <button
                className={`footer-link-btn ${currentPage === 'terms' ? 'active' : ''}`}
                onClick={() => onNavigate('terms')}
              >
                Terms & Conditions
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-heading">Product</h4>
          <ul className="footer-list">
            {/* <li><span className="footer-static-item">FastAPI + React Powered</span></li> */}
            <li><span className="footer-static-item">Real-Time Analytics</span></li>
            <li><span className="footer-static-item">Custom Slugs & Expiration</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Shortlink. All rights reserved.</p>
        <div className="footer-bottom-links">
          <button className="footer-link-btn" onClick={() => onNavigate('terms')}>Terms of Service</button>
          <button className="footer-link-btn" onClick={() => onNavigate('terms')}>Privacy Policy</button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
