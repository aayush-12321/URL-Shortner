import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

function AuthModal({ isOpen, initialMode = 'login', onClose, onSubmit, onGoogleCredential, loading, error }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const googleCredentialHandler = useRef(onGoogleCredential);

  googleCredentialHandler.current = onGoogleCredential;

  useEffect(() => {
    setMode(initialMode);
    setForm({ username: '', email: '', password: '', confirmPassword: '' });
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    setFormError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setGoogleError('');
    setGoogleLoading(true);

    const loadGoogleButton = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google/client-id`);
        if (!response.ok) throw new Error('Could not load Google sign-in.');
        const { client_id: clientId } = await response.json();

        if (!window.google?.accounts?.id) {
          let script = document.getElementById('google-identity-services');
          if (!script) {
            script = document.createElement('script');
            script.id = 'google-identity-services';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }
          await new Promise((resolve, reject) => {
            if (window.google?.accounts?.id) return resolve();
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', reject, { once: true });
          });
        }

        if (cancelled || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) googleCredentialHandler.current(credential);
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(240, Math.floor(googleButtonRef.current.clientWidth))),
        });
        setGoogleLoading(false);
      } catch (loadError) {
        if (!cancelled) {
          setGoogleError(loadError.message || 'Google sign-in could not be loaded.');
          setGoogleLoading(false);
        }
      }
    };

    loadGoogleButton();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setFormError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    setFormError('');
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
              onClick={() => { setMode('login'); setFormError(''); }}
            >
              Log In
            </button>
            <button
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setFormError(''); }}
            >
              Sign Up
            </button>
          </div>

          <div style={{ margin: '0.25rem 0 1.25rem', textAlign: 'center' }}>
            <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }} />
            {googleLoading && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Loading Google sign-in…</span>}
            {googleError && <div role="alert" style={{ color: '#F43F5E', fontSize: '0.8rem', marginTop: '0.5rem' }}>{googleError}</div>}
          </div>

          {(formError || error) && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#F43F5E',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              {formError || (typeof error === 'string' ? error : JSON.stringify(error))}
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
              <div className="password-input-wrap">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  name="password"
                  className="form-input form-input-simple"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-visibility-toggle"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {passwordVisible ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 0 1-3.1 4.2" />
                        <path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.8 9.8 0 0 0 3.1-.5" />
                      </>
                    ) : (
                      <>
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    name="confirmPassword"
                    className="form-input form-input-simple"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-visibility-toggle"
                    onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                    aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'}
                    aria-pressed={confirmPasswordVisible}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      {confirmPasswordVisible ? (
                        <>
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 0 1-3.1 4.2" />
                          <path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.8 9.8 0 0 0 3.1-.5" />
                        </>
                      ) : (
                        <>
                          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            )}

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
