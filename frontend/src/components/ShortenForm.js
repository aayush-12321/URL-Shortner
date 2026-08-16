import React, { useState } from 'react';

function ShortenForm({ onShorten, loading, latestResult, onCopyLink }) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    const success = await onShorten({ original_url: url.trim(), description: description.trim() || undefined });
    if (success) {
      setUrl('');
      setDescription('');
    }
  };

  const handleCopy = () => {
    if (!latestResult) return;
    const fullShortUrl = `http://localhost:8000/api/v1/${latestResult.short_code}`;
    onCopyLink(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shortener-card">
      <form onSubmit={handleSubmit} className="shortener-form">
        <div className="input-row">
          <div className="input-wrapper">
            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input
              type="url"
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a long URL here (e.g. https://example.com/very-long-link)..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              'Shortening...'
            ) : (
              <>
                Shorten URL
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>

        <div>
          <button
            type="button"
            className="optional-fields-toggle"
            onClick={() => setShowOptional(!showOptional)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showOptional ? (
                <line x1="5" y1="12" x2="19" y2="12" />
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </>
              )}
            </svg>
            {showOptional ? 'Hide optional note' : 'Add custom note or description'}
          </button>

          {showOptional && (
            <div style={{ marginTop: '0.65rem' }}>
              <input
                type="text"
                className="form-input form-input-simple"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description/note (e.g. Marketing Campaign 2026)"
              />
            </div>
          )}
        </div>
      </form>

      {latestResult && (
        <div className="result-box">
          <div className="result-info">
            <span className="result-label">✨ Link Ready!</span>
            <a
              href={`http://localhost:8000/api/v1/${latestResult.short_code}`}
              target="_blank"
              rel="noreferrer"
              className="result-url"
            >
              http://localhost:8000/api/v1/{latestResult.short_code}
            </a>
          </div>
          <div className="result-actions">
            <button
              className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleCopy}
              style={{
                background: copied ? 'var(--accent-emerald)' : undefined,
                borderColor: copied ? 'var(--accent-emerald)' : undefined,
                color: copied ? '#ffffff' : undefined,
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <a
              href={`http://localhost:8000/api/v1/${latestResult.short_code}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShortenForm;
