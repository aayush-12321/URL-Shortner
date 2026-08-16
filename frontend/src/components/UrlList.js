import React, { useState } from 'react';

function UrlList({ urls, onCopy, onEdit, onDelete, onRefresh, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);

  const handleCopyClick = (shortCode) => {
    const fullUrl = `http://localhost:8000/api/v1/${shortCode}`;
    onCopy(fullUrl);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteConfirm = (shortCode) => {
    if (deletingCode === shortCode) {
      onDelete(shortCode);
      setDeletingCode(null);
    } else {
      setDeletingCode(shortCode);
    }
  };

  const filteredUrls = urls.filter((url) => {
    const term = searchTerm.toLowerCase();
    return (
      url.short_code.toLowerCase().includes(term) ||
      url.original_url.toLowerCase().includes(term) ||
      (url.description && url.description.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section>
      <div className="section-header">
        <div className="section-title">
          <span>My Shortened Links</span>
          <span className="badge-count">{urls.length}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {urls.length > 0 && (
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                className="form-input form-input-simple"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh links">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <h4>No shortened links yet</h4>
          <p>Paste a long URL in the shortener above to create your first trackable link.</p>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="empty-state">
          <h4>No links match "{searchTerm}"</h4>
          <p>Try searching for a different keyword or clear your search term.</p>
        </div>
      ) : (
        <div className="url-list-grid">
          {filteredUrls.map((item) => {
            const isCopied = copiedCode === item.short_code;
            const isDeleting = deletingCode === item.short_code;
            const fullShortUrl = `http://localhost:8000/api/v1/${item.short_code}`;

            return (
              <div className="url-card" key={item.short_code}>
                <div className="url-card-main">
                  <div className="url-details">
                    <div className="short-url-line">
                      <a
                        href={fullShortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="short-link"
                      >
                        http://localhost:8000/api/v1/{item.short_code}
                      </a>
                      <span className="click-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        {item.click_count || 0} {item.click_count === 1 ? 'click' : 'clicks'}
                      </span>
                    </div>

                    <p className="original-url-text" title={item.original_url}>
                      {item.original_url}
                    </p>

                    <div className="url-meta">
                      {item.description && (
                        <span className="url-description">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {item.description}
                        </span>
                      )}
                      {item.created_at && <span>Created {formatDate(item.created_at)}</span>}
                    </div>
                  </div>

                  <div className="url-card-actions">
                    {/* Copy Button */}
                    <button
                      className={`btn btn-sm ${isCopied ? 'btn-secondary' : 'btn-secondary'}`}
                      onClick={() => handleCopyClick(item.short_code)}
                      style={{
                        background: isCopied ? 'var(--accent-emerald)' : undefined,
                        color: isCopied ? '#ffffff' : undefined,
                        borderColor: isCopied ? 'var(--accent-emerald)' : undefined,
                      }}
                      title="Copy Short URL"
                    >
                      {isCopied ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copied
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

                    {/* Open Button */}
                    <a
                      href={fullShortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Open Short URL"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Open
                    </a>

                    {/* Edit Button */}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onEdit(item)}
                      title="Edit link description"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      className={`btn btn-sm ${isDeleting ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => handleDeleteConfirm(item.short_code)}
                      onMouseLeave={() => setDeletingCode(null)}
                      title="Delete shortened link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {isDeleting ? 'Confirm Delete?' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default UrlList;
