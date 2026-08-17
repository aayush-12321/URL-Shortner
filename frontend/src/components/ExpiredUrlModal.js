import React from 'react';

function ExpiredUrlModal({ isOpen, code, onClose, onCreateNew }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px', textAlign: 'center', padding: '2.25rem 2rem' }}
      >
        <button className="modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#F43F5E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Link Expired or Not Found
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.55', marginBottom: '1.75rem' }}>
          The short URL {code && code !== 'link' ? <strong style={{ color: '#FAFAFA' }}>/{code}</strong> : 'you visited'} has reached its set expiration date or no longer exists.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="btn btn-emerald" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
            onClick={onCreateNew}
          >
            Create Your Own Short Link
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem 1rem' }}
            onClick={onClose}
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpiredUrlModal;
