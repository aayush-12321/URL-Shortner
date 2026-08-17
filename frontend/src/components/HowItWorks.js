import React, { useState } from 'react';

function HowItWorks({ onNavigate, onOpenAuth }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      number: '01',
      title: 'Paste Your Long Link',
      description: 'Copy any valid web address (HTTP or HTTPS) into the shorten input box on the homepage.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )
    },
    {
      number: '02',
      title: 'Customize (Optional)',
      description: 'Set a custom slug alias (e.g. shortlink/my-link) or specify an optional link expiration period.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    },
    {
      number: '03',
      title: 'Share & Track Analytics',
      description: 'Copy your generated short link and share it anywhere. Monitor real-time click stats from your dashboard.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ];

  const faqs = [
    {
      q: 'What is a URL Shortener?',
      a: 'A URL shortener converts long, complex web links into compact, shareable URLs that automatically redirect users to the original web address.'
    },
    {
      q: 'Do I need an account to shorten URLs?',
      a: 'No! You can shorten links immediately as a guest. Creating a free account allows you to edit custom aliases, track click counts, and delete links anytime.'
    },
    {
      q: 'How do custom link aliases work?',
      a: 'When shortening a link, you can provide a custom keyword (like /my-portfolio). If the alias is available, your link will use that exact path instead of a random string.'
    },
    {
      q: 'What happens when a link expires?',
      a: 'If an expiration date or click limit was configured for a link, attempting to visit it after expiration will result in a clear notification that the link is no longer active.'
    },
    {
      q: 'Are custom short links free?',
      a: 'Yes, shortening links and managing them from your dashboard is completely free.'
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Help & Guide
        </div>
        <h1 className="page-title">How Shortlink Works</h1>
        <p className="page-subtitle">
          Everything you need to know about shortening URLs, creating custom aliases, and managing your links.
        </p>
      </header>

      {/* Step Guide */}
      <section className="guide-steps-grid">
        {steps.map((step) => (
          <div key={step.number} className="step-card">
            <div className="step-card-header">
              <span className="step-number">{step.number}</span>
              <div className="step-icon-wrap">{step.icon}</div>
            </div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openFaq === index ? 'open' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === index && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <div className="content-cta-card">
        <div className="cta-text">
          <h3>Ready to start shortening links?</h3>
          <p>Create clean links in seconds or sign up for account link tracking.</p>
        </div>
        <div className="cta-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('home')}>
            Shorten a Link
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenAuth('register')}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
