import React, { useState } from 'react';

function ApiDocs({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('curl');

  const curlExample = `curl -X POST "${process.env.REACT_APP_API_BASE_URL}/shorten" \\
  -H "Content-Type: application/json" \\
  -d '{
    "target_url": "https://example.com/very-long-article-url",
    "custom_slug": "my-custom-link"
  }'`;

  const jsExample = `fetch('${process.env.REACT_APP_API_BASE_URL}/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_url: 'https://example.com/very-long-article-url',
    custom_slug: 'my-custom-link'
  })
})
.then(res => res.json())
.then(data => console.log(data));`;

  const pythonExample = `import requests

response = requests.post(
    "${process.env.REACT_APP_API_BASE_URL}/shorten",
    json={
        "target_url": "https://example.com/very-long-article-url",
        "custom_slug": "my-custom-link"
    }
)
print(response.json())`;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Developer API Reference
        </div>
        <h1 className="page-title">Shortlink REST API</h1>
        <p className="page-subtitle">
          Integrate programmatic URL shortening and click tracking directly into your applications.
        </p>
      </header>

      <div className="legal-content-card">
        <section className="legal-section">
          <h2>Shorten URL Endpoint</h2>
          <p>Send a <code>POST</code> request to <code>/api/v1/shorten</code> to generate a short link.</p>
          
          <div className="modal-tabs" style={{ maxWidth: '320px', marginTop: '1rem' }}>
            <button className={`tab-btn ${activeTab === 'curl' ? 'active' : ''}`} onClick={() => setActiveTab('curl')}>
              cURL
            </button>
            <button className={`tab-btn ${activeTab === 'js' ? 'active' : ''}`} onClick={() => setActiveTab('js')}>
              JavaScript
            </button>
            <button className={`tab-btn ${activeTab === 'python' ? 'active' : ''}`} onClick={() => setActiveTab('python')}>
              Python
            </button>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            overflowX: 'auto',
            whiteSpace: 'pre'
          }}>
            {activeTab === 'curl' && curlExample}
            {activeTab === 'js' && jsExample}
            {activeTab === 'python' && pythonExample}
          </div>
        </section>

        <section className="legal-section">
          <h2>JSON Response Format</h2>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.85rem',
            color: 'var(--accent-emerald)',
            whiteSpace: 'pre'
          }}>
{`{
  "short_code": "my-custom-link",
  "short_url": "${process.env.REACT_APP_API_BASE_URL}/my-custom-link",
  "target_url": "https://example.com/very-long-article-url",
  "clicks_count": 0,
  "created_at": "2026-08-17T22:00:00Z"
}`}
          </div>
        </section>
      </div>

      <div className="page-footer-nav">
        <button className="btn btn-secondary" onClick={() => onNavigate('home')}>
          &larr; Back to Shortener
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('features')}>
          View Features
        </button>
      </div>
    </div>
  );
}

export default ApiDocs;
