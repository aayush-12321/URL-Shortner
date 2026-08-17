import React from 'react';

function Features({ onNavigate, onOpenAuth }) {
  const features = [
    {
      title: 'Custom Link Slugs',
      description: 'Replace random character strings with memorable, branded custom aliases like shortlink/my-brand for better brand recognition.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    },
    {
      title: 'Real-Time Click Analytics',
      description: 'Track exactly how many times your short links are clicked in real-time right from your personal dashboard.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      title: 'Link Expiration Control',
      description: 'Set temporary expiration dates or click limits on short links for time-sensitive campaigns and events.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      title: 'Fast & Secure Infrastructure',
      description: 'Powered by an optimized FastAPI backend with instant redirects, low latency, and secure password hashing.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      )
    }
  ];

  const useCases = [
    {
      target: 'Social Media Bios',
      detail: 'Clean up long affiliate links or portfolio URLs in Instagram, Twitter/X, and TikTok bios.'
    },
    {
      target: 'Marketing & Emails',
      detail: 'Keep promotional email copy concise and track click engagement across campaigns.'
    },
    {
      target: 'Developers & Apps',
      detail: 'Integrate automated link shortening directly into your backend software using our REST API.'
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Powerful Capabilities
        </div>
        <h1 className="page-title">Features & Use Cases</h1>
        <p className="page-subtitle">
          Everything built into Shortlink to help you shorten, organize, and track links effectively.
        </p>
      </header>

      {/* Feature Grid */}
      <section className="guide-steps-grid">
        {features.map((feat, idx) => (
          <div key={idx} className="step-card">
            <div className="step-card-header">
              <div className="step-icon-wrap">{feat.icon}</div>
            </div>
            <h3 className="step-title">{feat.title}</h3>
            <p className="step-description">{feat.description}</p>
          </div>
        ))}
      </section>

      {/* Use Cases Section */}
      <section className="legal-content-card">
        <h2>Popular Use Cases</h2>
        <div className="faq-list">
          {useCases.map((uc, idx) => (
            <div key={idx} className="faq-item" style={{ cursor: 'default' }}>
              <div className="faq-question">
                <span style={{ color: 'var(--accent-emerald)' }}>{uc.target}</span>
              </div>
              <p className="faq-answer" style={{ marginTop: '0.4rem', border: 'none', padding: 0 }}>
                {uc.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <div className="content-cta-card">
        <div className="cta-text">
          <h3>Try Shortlink Today</h3>
          <p>Create your first shortened link in seconds.</p>
        </div>
        <div className="cta-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('home')}>
            Shorten a Link Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Features;
