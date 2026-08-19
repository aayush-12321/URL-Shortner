import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
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


const API = axios.create({ baseURL: '/api/v1' });

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
  const validPages = ['home', 'features', 'how-it-works', 'api-docs', 'terms'];
  return validPages.includes(hash) ? hash : 'home';
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(getPageFromHash); // 'home' | 'features' | 'how-it-works' | 'api-docs' | 'terms'
  const [expiredCode, setExpiredCode] = useState(null);

  // Modal States
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login', loading: false, error: '' });
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
    setAuthModal({ isOpen: true, mode, loading: false, error: '' });
  };

  const handleCloseAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, error: '' }));
  };

  const handleAuthSubmit = async (mode, formData) => {
    setAuthModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      if (mode === 'register') {
        await API.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        addToast('Account created successfully! Logging you in...', 'success');
        
        // Auto-login after registration
        const params = new URLSearchParams({
          username: formData.username,
          password: formData.password,
        });
        const loginRes = await API.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        localStorage.setItem('token', loginRes.data.access_token);
        setToken(loginRes.data.access_token);
        handleCloseAuth();
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
        addToast('Logged in successfully', 'success');
        handleCloseAuth();
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Authentication failed. Please check your inputs.');
      setAuthModal((prev) => ({ ...prev, loading: false, error: errorMsg }));
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
      addToast('Logged out', 'info');
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
        onLogout={handleLogout}
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
      </main>

      <Footer currentPage={currentPage} onNavigate={handleNavigate} />

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={handleCloseAuth}
        onSubmit={handleAuthSubmit}
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
    </div>
  );
}

export default App;
