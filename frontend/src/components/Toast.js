import React from 'react';

function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
          {toast.type === 'success' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toast;
