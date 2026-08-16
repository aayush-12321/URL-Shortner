import React, { useState, useEffect } from 'react';

function AuthModal({ isOpen, initialMode = 'login', onClose, onSubmit, loading, error }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    setMode(initialMode);
    setForm({ username: '', email: '', password: '' });
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(mode, form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-tabs">
            <button
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Sign Up
            </button>
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
              <label>Username</label>
              <input
                type="text"
                name="username"
                className="form-input form-input-simple"
                value={form.username}
                onChange={handleChange}
                placeholder="johndoe"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input form-input-simple"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-input form-input-simple"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                'Log In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
