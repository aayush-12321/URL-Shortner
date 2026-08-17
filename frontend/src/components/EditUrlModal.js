import React, { useState, useEffect } from 'react';

const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  let str = String(dateString).trim().replace(' ', 'T');
  if (!str.endsWith('Z') && !str.includes('+') && !str.includes('-')) {
    str += 'Z';
  }
  return new Date(str);
};

const toLocalDatetimeString = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function EditUrlModal({ isOpen, item, onClose, onSave, loading, error }) {
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (item) {
      setDescription(item.description || '');
      if (item.expires_at) {
        const d = parseUtcDate(item.expires_at);
        setExpiresAt(toLocalDatetimeString(d));
      } else {
        setExpiresAt('');
      }
    }
  }, [item]);


  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(item.short_code, {
      description: description.trim(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Link Details</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              SHORT CODE
            </span>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--accent-emerald)' }}>
              {item.short_code}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.original_url}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#F43F5E',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Description / Note</label>
              <input
                type="text"
                className="form-input form-input-simple"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Campaign name or note..."
              />
            </div>

            <div className="form-group">
              <label>Link Expiration Date & Time (Optional)</label>
              <input
                type="datetime-local"
                className="form-input form-input-simple"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditUrlModal;
