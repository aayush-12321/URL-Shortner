import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ShortenForm from './components/ShortenForm';
import UrlList from './components/UrlList';
import EditUrlModal from './components/EditUrlModal';
import Toast from './components/Toast';
import Footer from './components/Footer';
import HowItWorks from './components/HowItWorks';
import Terms from './components/Terms';
import Features from './components/Features';
import ApiDocs from './components/ApiDocs';
import ExpiredUrlModal from './components/ExpiredUrlModal';
import ProfilePage from './components/ProfilePage';
import { API_BASE_URL } from './config';


const API = axios.create({ baseURL: API_BASE_URL });

// Helper to safely extract error message from API response (e.g. FastAPI / Pydantic validation errors)
const getErrorMessage = (err, fallback = 'An unexpected error occurred.') => {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.msg) return item.msg;
        return JSON.stringify(item);
      })
      .join('; ');
  }
  if (typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }
  return String(detail);
};

const getPageFromHash = () => {
  const hash = window.location.hash.replace('#', '').trim();
  const validPages = ['home', 'features', 'how-it-works', 'api-docs', 'terms', 'profile'];
  return validPages.includes(hash) ? hash : 'home';
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [expiredCode, setExpiredCode] = useState(null);

  // Modal States
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
    loading: false,
    error: '',
    verificationEmail: '',
    resendAfterSeconds: 0,
  });
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, item: null, loading: false, error: '' });
  const [shortenLoading, setShortenLoading] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage === 'profile' && !token) {
      setCurrentPage('home');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentPage, token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'expired') {
      const code = params.get('code');
      setExpiredCode(code || 'link');
    }
  }, []);


  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchUser = useCallback(async (accessToken = token) => {
    if (!accessToken) return;
    try {
      const res = await API.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
    }
  }, [token]);

  const fetchUrls = useCallback(async (accessToken = token) => {
    if (!accessToken) {
      setUrls([]);
      return;
    }
    try {
      const res = await API.get('/list/all?skip=0&limit=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUrls(res.data || []);
    } catch (err) {
      addToast(getErrorMessage(err, 'Failed to load saved URLs'), 'error');
    }
  }, [token, addToast]);

  useEffect(() => {
    if (token) {
      fetchUser(token);
      fetchUrls(token);
    } else {
      setUser(null);
      setUrls([]);
    }
  }, [token, fetchUser, fetchUrls]);

  const handleOpenAuth = (mode = 'login') => {
    setPendingRegistration(null);
    setAuthModal((prev) => ({
      ...prev,
      isOpen: true,
      mode,
      loading: false,
      error: '',
      verificationEmail: '',
      resendAfterSeconds: 0,
    }));
  };

  const handleCloseAuth = () => {
    setPendingRegistration(null);
    setAuthModal((prev) => ({
      ...prev,
      isOpen: false,
      mode: 'login',
      error: '',
      verificationEmail: '',
      resendAfterSeconds: 0,
      loading: false,
    }));
  };

  const clearPendingEmailVerification = () => {
    setPendingRegistration(null);
    setAuthModal((prev) => ({
      ...prev,
      mode: 'login',
      verificationEmail: '',
      resendAfterSeconds: 0,
    }));
  };

  const handleAuthSubmit = async (mode, formData) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      if (mode === 'forgot-request') {
        await API.post('/auth/forgot-password', { email: formData.email });
        setAuthModal((prev) => ({ ...prev, loading: false, error: '' }));
        addToast('If this email belongs to a password account, a reset code has been sent.', 'info');
        return true;
      }
      if (mode === 'forgot-reset') {
        await API.post('/auth/reset-password', {
          email: formData.email,
          code: formData.verificationCode,
          new_password: formData.password,
          confirm_password: formData.confirmPassword,
        });
        addToast('Password reset. You can now sign in.', 'success');
        handleCloseAuth();
        return true;
      }
      if (mode === 'register') {
        const response = await API.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        });
        const email = response.data.email || formData.email;
        setPendingRegistration({ username: formData.username, password: formData.password });
        setAuthModal((prev) => ({
          ...prev,
          mode: 'verify',
          verificationEmail: email,
          resendAfterSeconds: response.data.resend_after_seconds ?? 60,
          loading: false,
          error: '',
        }));
        addToast('Verification email sent. Check your inbox for the code.', 'success');
        return email;
      } else {
        const params = new URLSearchParams({
          username: formData.username,
          password: formData.password,
        });
        const res = await API.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        localStorage.setItem('token', res.data.access_token);
        setToken(res.data.access_token);
        clearPendingEmailVerification();
        addToast('Logged in successfully', 'success');
        handleCloseAuth();
        return true;
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Authentication failed. Please check your inputs.');
      setAuthModal((prev) => ({ ...prev, loading: false, error: errorMsg }));
      return false;
    }
  };

  const handleVerifyEmail = async (email, code) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await API.post('/auth/verify-email', { email, code });
      const credentials = pendingRegistration;
      setPendingRegistration(null);
      if (credentials) {
        try {
          const params = new URLSearchParams(credentials);
          const loginResponse = await API.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          localStorage.setItem('token', loginResponse.data.access_token);
          setToken(loginResponse.data.access_token);
          clearPendingEmailVerification();
          handleCloseAuth();
          addToast('Email verified and you are now signed in.', 'success');
          return true;
        } catch (loginError) {
          setAuthModal((prev) => ({
            ...prev,
            mode: 'login',
            verificationEmail: '',
            loading: false,
            error: `Email verified, but automatic sign-in failed: ${getErrorMessage(loginError, 'Please log in.')}`,
          }));
          return true;
        }
      }
      setAuthModal((prev) => ({
        ...prev,
        mode: 'login',
        verificationEmail: '',
        resendAfterSeconds: 0,
        loading: false,
        error: '',
      }));
      addToast('Email verified. You can now log in.', 'success');
      return true;
    } catch (err) {
      setAuthModal((prev) => ({
        ...prev,
        loading: false,
        error: getErrorMessage(err, 'Could not verify your email. Please try again.'),
      }));
      return false;
    }
  };

  const handleResendVerification = async (email) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await API.post('/auth/resend-verification', { email });
      setAuthModal((prev) => ({
        ...prev,
        loading: false,
        error: '',
        resendAfterSeconds: response.data.resend_after_seconds ?? 60,
      }));
      addToast('A new verification code has been sent.', 'success');
      return response.data.resend_after_seconds ?? 60;
    } catch (err) {
      setAuthModal((prev) => ({
        ...prev,
        loading: false,
        error: getErrorMessage(err, 'Could not resend the verification code.'),
      }));
      return false;
    }
  };

  const handleChangePendingEmail = async (email, newEmail, password) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await API.post('/auth/change-pending-email', {
        email,
        new_email: newEmail,
        password,
      });
      setAuthModal((prev) => ({
        ...prev,
        mode: 'verify',
        verificationEmail: response.data.email,
        resendAfterSeconds: response.data.resend_after_seconds ?? 60,
        loading: false,
        error: '',
      }));
      addToast('Email updated. A new verification code was sent.', 'success');
      return response.data.resend_after_seconds ?? 60;
    } catch (err) {
      setAuthModal((prev) => ({
        ...prev,
        loading: false,
        error: getErrorMessage(err, 'Could not update the email address.'),
      }));
      return false;
    }
  };

  const handleGoogleCredential = async (credential) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await API.post('/auth/google/authenticate', { credential });
      localStorage.setItem('token', response.data.access_token);
      setToken(response.data.access_token);
      clearPendingEmailVerification();
      handleCloseAuth();
      addToast('Signed in with Google', 'success');
    } catch (err) {
      setAuthModal((prev) => ({
        ...prev,
        loading: false,
        error: getErrorMessage(err, 'Google sign-in failed. Please try again.'),
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout', null, { headers: authHeaders });
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setUrls([]);
      setLatestResult(null);
      clearPendingEmailVerification();
      addToast('Logged out', 'info');
    }
  };

  const handleChangePassword = async (payload) => {
    try {
      await API.post('/auth/change-password', payload, { headers: authHeaders });
      addToast('Password updated successfully.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not update your password.') };
    }
  };

  const handleRequestPasswordReset = async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not request a reset code.') };
    }
  };

  const handleResetPassword = async (payload) => {
    try {
      const response = await API.post('/auth/reset-password', payload);
      return { success: true, message: response.data.message };
    } catch (err) {
      return { success: false, error: getErrorMessage(err, 'Could not reset your password.') };
    }
  };

  const handleShorten = async (data) => {
    setShortenLoading(true);
    try {
      const res = await API.post('/shorten', data, { headers: authHeaders });
      setLatestResult(res.data);
      addToast('Short link created successfully!', 'success');
      if (token) {
        fetchUrls(token);
      }
      return true;
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Could not shorten URL. Please check the link.');
      addToast(errorMsg, 'error');
      return false;
    } finally {
      setShortenLoading(false);
    }
  };

  const handleCopyLink = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    addToast('Link copied to clipboard!', 'success');
  };

  // Edit Link Handler
  const handleOpenEdit = (item) => {
    setEditModal({ isOpen: true, item, loading: false, error: '' });
  };

  const handleCloseEdit = () => {
    setEditModal({ isOpen: false, item: null, loading: false, error: '' });
  };

  const handleSaveEdit = async (shortCode, updatedData) => {
    setEditModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await API.patch(`/stats/${shortCode}`, updatedData, { headers: authHeaders });
      addToast('Link details updated', 'success');
      handleCloseEdit();
      fetchUrls(token);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update link.');
      setEditModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  // Delete Link Handler
  const handleDeleteLink = async (shortCode) => {
    try {
      await API.delete(`/stats/${shortCode}`, { headers: authHeaders });
      addToast('Link deleted successfully', 'success');
      setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
      if (latestResult && latestResult.short_code === shortCode) {
        setLatestResult(null);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Could not delete link.');
      addToast(msg, 'error');
    }
  };

  const handleNavigate = (page) => {
    if (page === 'profile' && !user) {
      handleOpenAuth('login');
      return;
    }
    setCurrentPage(page);
    if (page === 'home') {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      window.location.hash = page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      <main className="main-content">
        {currentPage === 'home' && (
          <>
            <section className="hero">
              <div className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                URL Shortener Service
              </div>
              <h1 className="hero-title">Shorten, Share & Track Your Links</h1>
              <p className="hero-subtitle">
                Transform long, complex URLs into clean short links with instant click tracking and link management.
              </p>
            </section>

            <ShortenForm
              onShorten={handleShorten}
              loading={shortenLoading}
              latestResult={latestResult}
              onCopyLink={handleCopyLink}
            />

            {!user ? (
              <div className="guest-banner">
                <div className="guest-banner-text">
                  <strong>Want to save and manage your links?</strong>
                  <p>Sign in or create a free account to track click counts, edit notes, and delete short links anytime.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenAuth('register')}>
                  Create Account
                </button>
              </div>
            ) : (
              <UrlList
                urls={urls}
                user={user}
                onCopy={handleCopyLink}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteLink}
                onRefresh={() => fetchUrls(token)}
              />
            )}
          </>
        )}

        {currentPage === 'features' && (
          <Features onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentPage === 'how-it-works' && (
          <HowItWorks onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentPage === 'api-docs' && (
          <ApiDocs onNavigate={handleNavigate} />
        )}

        {currentPage === 'terms' && (
          <Terms onNavigate={handleNavigate} />
        )}

        {currentPage === 'profile' && user && (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onChangePassword={handleChangePassword}
            onRequestPasswordReset={handleRequestPasswordReset}
            onResetPassword={handleResetPassword}
          />
        )}
      </main>

      <Footer currentPage={currentPage} onNavigate={handleNavigate} />

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        verificationEmail={authModal.verificationEmail}
        resendAfterSeconds={authModal.resendAfterSeconds}
        onClose={handleCloseAuth}
        onSubmit={handleAuthSubmit}
        onVerifyEmail={handleVerifyEmail}
        onResendVerification={handleResendVerification}
        onChangePendingEmail={handleChangePendingEmail}
        onGoogleCredential={handleGoogleCredential}
        loading={authModal.loading}
        error={authModal.error}
      />

      <EditUrlModal
        isOpen={editModal.isOpen}
        item={editModal.item}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        loading={editModal.loading}
        error={editModal.error}
      />

      <ExpiredUrlModal
        isOpen={Boolean(expiredCode)}
        code={expiredCode}
        onClose={() => {
          setExpiredCode(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
        onCreateNew={() => {
          setExpiredCode(null);
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentPage('home');
          const inputEl = document.querySelector('.shorten-input');
          if (inputEl) inputEl.focus();
        }}
      />

      <Toast toasts={toasts} />
      <Analytics />
    </div>
  );
}

export default App;
