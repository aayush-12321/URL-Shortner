import React, { useState } from 'react';

function Terms({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('all');

  const prohibitedCategories = [
    {
      title: "Copyright & IP Infringement",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
        </svg>
      ),
      items: [
        "Protected media, video, audio, books, or games without explicit permission",
        "Unauthorized streaming of movies, TV shows, or live broadcasts",
        "Infringing on intellectual property or third-party proprietary rights"
      ]
    },
    {
      title: "Security & Malware Threats",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      items: [
        "Phishing scams, deceptive forms, or credential stealing",
        "Malware, viruses, ransomware, spyware, or executable downloads",
        "Pop-ups, drive-by downloads, malicious scripts, or exploit payloads"
      ]
    },
    {
      title: "Illegal & Abusive Content",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      items: [
        "Violent, prejudiced, or hate speech content",
        "Pornographic, adult, or sexually explicit content",
        "Unlawful promotion of drugs, weapons, or illegal activities"
      ]
    },
    {
      title: "Deceptive & Invalid Redirects",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
      items: [
        "Redirecting to another URL shortener or multi-redirect chains",
        "Not found, blank, or broken destination pages",
        "Misleading landing pages designed to trick visitors"
      ]
    }
  ];

  return (
    <div className="page-container legal-page">
      <header className="page-header">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Terms & Usage Policies
        </div>
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-subtitle">
          These Terms of Service govern your access to and use of ShortURL. By using our site as a guest or registered user, you agree to these rules and guidelines.
        </p>
        <div className="legal-last-updated">
          <span>Last Updated: August 2026</span>
          <span className="bullet-dot">•</span>
          <span>Applies to Guests & Registered Users</span>
        </div>
      </header>

      {/* Quick Jump Navigation */}
      <nav className="legal-nav-bar" aria-label="Legal Sections Navigation">
        <button
          className={`legal-nav-item ${activeSection === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSection('all')}
        >
          All Terms
        </button>
        <button
          className={`legal-nav-item ${activeSection === 'lifecycle' ? 'active' : ''}`}
          onClick={() => setActiveSection('lifecycle')}
        >
          Link Expiry & Management
        </button>
        <button
          className={`legal-nav-item ${activeSection === 'prohibited' ? 'active' : ''}`}
          onClick={() => setActiveSection('prohibited')}
        >
          Prohibited Content
        </button>
        <button
          className={`legal-nav-item ${activeSection === 'liability' ? 'active' : ''}`}
          onClick={() => setActiveSection('liability')}
        >
          Disclaimers & Liability
        </button>
      </nav>

      <div className="legal-content-card">
        {/* Section 1: Overview */}
        {(activeSection === 'all' || activeSection === 'lifecycle') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">01</span>
              <h2>Terms of Service Overview</h2>
            </div>
            <p>
              ShortURL is a web service that transforms links from websites, blogs, forums, and social networks into clean, shortened URLs that can be easily shared.
            </p>
            <p>
              Please read these Terms of Service carefully. Access to and use of ShortURL—whether as a guest visitor or registered user—is strictly conditioned on your acceptance of and compliance with these terms.
            </p>
          </section>
        )}

        {/* Section 2: Link Expiration & Account Features */}
        {(activeSection === 'all' || activeSection === 'lifecycle') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">02</span>
              <h2>Link Expiration & Account Capabilities</h2>
            </div>
            <p>
              Every shortened link generated on ShortURL has an assigned expiration timeframe set by the creator, with a standard default duration of <strong>30 days</strong>.
            </p>

            <div className="policy-callout-grid">
              <div className="policy-callout-card">
                <div className="callout-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h4>Expiration & Deactivation</h4>
                  <p>When a link reaches its set expiration date, it automatically becomes inactive and will no longer redirect to the original destination page.</p>
                </div>
              </div>

              <div className="policy-callout-card">
                <div className="callout-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h4>Registered User Dashboard Controls</h4>
                  <p>Registered users can log in to view click stats, update link notes, modify expiration dates, or delete their shortened URLs anytime.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Prohibited Content */}
        {(activeSection === 'all' || activeSection === 'prohibited') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">03</span>
              <h2>Prohibited Content & Acceptable Use</h2>
            </div>
            <p>
              To keep the platform safe, users are not allowed to create shortened URLs that redirect to any of the following categories:
            </p>

            <div className="prohibited-grid">
              {prohibitedCategories.map((cat, idx) => (
                <div className="prohibited-card" key={idx}>
                  <div className="prohibited-card-head">
                    <div className="prohibited-icon-wrap">{cat.icon}</div>
                    <h4>{cat.title}</h4>
                  </div>
                  <ul className="prohibited-list">
                    {cat.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="enforcement-warning-box">
              <div className="warning-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="warning-text">
                <strong>Monitoring & Instant Removal</strong>
                <p>
                  If we receive spam reports or detect abusive behavior violating our terms, the shortened URL will be deleted without prior notice.
                </p>
              </div>
            </div>

            {/* <div className="link-correction-note">
              <h4>Requesting Link Updates or Corrections</h4>
              <p>
                If you need to request an update or correction for a shortened URL you created, please contact us with the original long URL and short link details so our team can check if a modification is possible.
              </p>
            </div> */}
          </section>
        )}

        {/* Section 4: Disclaimers & Accuracy */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">04</span>
              <h2>Service Disclaimer</h2>
            </div>
            <p>
              ShortURL is provided on an <strong>"AS IS"</strong> basis. While we endeavor to maintain consistent performance, we cannot guarantee that the site or link redirection services will be uninterrupted, completely secure, or error-free.
            </p>
            <p>
              Neither ShortURL nor its owners or developers shall be held responsible for errors or omissions on this site or for any damage you may suffer while using the service.
            </p>
          </section>
        )}

        {/* Section 5: User Responsibility */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">05</span>
              <h2>User's Responsibility</h2>
            </div>
            <p>
              By using this site, you assume personal responsibility for the results of your actions. You agree to assume full responsibility for any damages or injuries resulting from your use of the service or external links accessed through this site.
            </p>
            <p>
              You agree to exercise sound judgment and conduct due diligence before accessing third-party destination links or acting on content recommended on this site.
            </p>
          </section>
        )}

        {/* Section 6: Errors & Omissions */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">06</span>
              <h2>Errors, Omissions & No Guarantees</h2>
            </div>
            <p>
              Although we take appropriate steps to ensure the accuracy of information presented on ShortURL, the site is not guaranteed to be error-free or fully up to date. By using the site, you acknowledge that information may contain inaccuracies and agree to verify information before taking action.
            </p>
            <p>
              ShortURL makes no guarantees regarding performance, operation, or specific outcomes. To the fullest extent permitted by law, ShortURL disclaims all warranties, express or implied, including implied warranties of merchantability and fitness for a particular purpose.
            </p>
          </section>
        )}

        {/* Section 7: Limitation of Liability */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">07</span>
              <h2>Limitation of Liability</h2>
            </div>
            <p>
              You agree to absolve ShortURL and its developers of any and all liability or loss that you or any associated party may incur as a result of using this site or its services. ShortURL shall not be liable for any direct, indirect, special, incidental, equitable, or consequential damages.
            </p>
            <p>
              All software, tools, and redirection features are provided "as is". Developers shall not be liable for damages resulting from loss of use, data, or profits, delayed access, or inability to use the site.
            </p>
          </section>
        )}

        {/* Section 8: Terms Updates */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <section className="legal-section">
            <div className="legal-section-header">
              <span className="legal-section-num">08</span>
              <h2>Terms Updates</h2>
            </div>
            <p>
              ShortURL reserves the right to update or change these Terms of Service at any time. The most current version will always be published on this page.
            </p>
          </section>
        )}
      </div>

      <div className="page-footer-nav">
        <button className="btn btn-secondary" onClick={() => onNavigate('home')}>
          &larr; Return to Shortener
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('how-it-works')}>
          View How It Works & Help
        </button>
      </div>
    </div>
  );
}

export default Terms;
