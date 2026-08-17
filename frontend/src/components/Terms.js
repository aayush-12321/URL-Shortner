import React from 'react';

function Terms({ onNavigate }) {
  return (
    <div className="page-container">
      <header className="page-header">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Legal & Policies
        </div>
        <h1 className="page-title">Terms of Service & Privacy</h1>
        <p className="page-subtitle">
          Please review the terms of service, acceptable link usage guidelines, and data policies for Shortlink.
        </p>
      </header>

      <div className="legal-content-card">
        <section className="legal-section">
          <h2>1. Acceptable Use Policy</h2>
          <p>
            Shortlink is designed for shortening legitimate web URLs for clean sharing and tracking. You agree not to use the service to shorten or distribute:
          </p>
          <ul>
            <li>URLs leading to malware, viruses, phishing sites, or deceptive software.</li>
            <li>Spam links or unauthorized commercial broadcasts.</li>
            <li>Links promoting illegal activities, hate speech, or explicit unauthorized content.</li>
          </ul>
          <p>
            We reserve the right to disable or delete any short link that violates this policy without prior notice.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Link Availability & Expiration</h2>
          <p>
            While we strive to ensure high availability for generated short links, links created without an account or specified expiration date may be subject to maintenance cleanups. 
          </p>
          <p>
            Registered users retain control over their active links and can edit or remove them directly from their account dashboard.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Privacy & Click Analytics</h2>
          <p>
            We respect user privacy. When a user clicks a shortened link, we process basic metadata (such as timestamps and total click counts) required to deliver click statistics to the link owner. We do not sell or monetize personal browsing history.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. User Accounts & Security</h2>
          <p>
            When registering an account, you are responsible for maintaining the confidentiality of your authentication credentials. Notify us immediately if you suspect unauthorized access to your account.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Limitation of Liability</h2>
          <p>
            The Shortlink service is provided "as is" without warranties of any kind. We are not liable for external third-party destination content linked via short URLs.
          </p>
        </section>
      </div>

      <div className="page-footer-nav">
        <button className="btn btn-secondary" onClick={() => onNavigate('home')}>
          &larr; Back to Shortener
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('how-it-works')}>
          View How It Works & Help
        </button>
      </div>
    </div>
  );
}

export default Terms;
