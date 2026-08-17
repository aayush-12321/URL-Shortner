import React from 'react';

function Navbar({ user, currentPage, onNavigate, onOpenAuth, onLogout }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <div className="brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span className="brand-name">Shortlink</span>
          </div>

          <nav className="nav-menu">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Shortener
            </button>
            <button 
              className={`nav-link ${currentPage === 'features' ? 'active' : ''}`}
              onClick={() => onNavigate('features')}
            >
              Features
            </button>
            <button 
              className={`nav-link ${currentPage === 'how-it-works' ? 'active' : ''}`}
              onClick={() => onNavigate('how-it-works')}
            >
              How It Works
            </button>
            <button 
              className={`nav-link ${currentPage === 'api-docs' ? 'active' : ''}`}
              onClick={() => onNavigate('api-docs')}
            >
              API
            </button>
            <button 
              className={`nav-link ${currentPage === 'terms' ? 'active' : ''}`}
              onClick={() => onNavigate('terms')}
            >
              Terms
            </button>
          </nav>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <span>{user.username}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onOpenAuth('login')}>
                Log In
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
