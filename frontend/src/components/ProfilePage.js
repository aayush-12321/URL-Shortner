import React, { useState } from 'react';

function PasswordField({ id, label, value, onChange, autoComplete = 'new-password', minLength = 8 }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input id={id} type={visible ? 'text' : 'password'} className="form-input form-input-simple" autoComplete={autoComplete} minLength={minLength} maxLength={72} value={value} onChange={onChange} required />
        <button type="button" className="password-visibility-toggle" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {visible ? (
              <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a11.8 11.8 0 0 1-3.1 4.2" /><path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.8 9.8 0 0 0 3.1-.5" /></>
            ) : (
              <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" /></>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

function ProfilePage({ user, onLogout, onChangePassword, onRequestPasswordReset, onResetPassword, onDeleteAccount }) {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetForm, setResetForm] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetStarted, setResetStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [resetNotice, setResetNotice] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  const isGoogleAccount = user.auth_provider === 'google';
  const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordNotice(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setBusy(true);
    const result = await onChangePassword({
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword,
      confirm_password: passwordForm.confirmPassword,
    });
    setBusy(false);
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordNotice({ type: 'success', text: 'Your password has been changed.' });
    } else {
      setPasswordNotice({ type: 'error', text: result.error });
    }
  };

  const requestResetCode = async () => {
    setBusy(true);
    setResetNotice(null);
    const result = await onRequestPasswordReset(user.email);
    setBusy(false);
    if (result.success) {
      setResetStarted(true);
      setResetNotice({ type: 'success', text: result.message });
    } else {
      setResetNotice({ type: 'error', text: result.error });
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setResetNotice(null);
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setBusy(true);
    const result = await onResetPassword({
      email: user.email,
      code: resetForm.code,
      new_password: resetForm.newPassword,
      confirm_password: resetForm.confirmPassword,
    });
    setBusy(false);
    if (result.success) {
      setResetForm({ code: '', newPassword: '', confirmPassword: '' });
      setResetStarted(false);
      setResetNotice({ type: 'success', text: result.message });
    } else {
      setResetNotice({ type: 'error', text: result.error });
    }
  };

  const submitAccountDeletion = async (event) => {
    event.preventDefault();
    setDeleteNotice(null);
    if (deleteConfirmation !== 'DELETE') {
      setDeleteNotice({ type: 'error', text: 'Type DELETE exactly to confirm account deletion.' });
      return;
    }
    setBusy(true);
    const result = await onDeleteAccount(deleteConfirmation);
    setBusy(false);
    if (!result.success) {
      setDeleteNotice({ type: 'error', text: result.error });
    }
  };

  const closeDeleteModal = () => {
    if (busy) return;
    setDeleteModalOpen(false);
    setDeleteConfirmation('');
    setDeleteNotice(null);
  };

  return (
    <section className="profile-page">
      <header className="profile-page-heading">
        <div>
          <span className="profile-eyebrow">ACCOUNT</span>
          <h1 className="page-title">Your profile</h1>
          <p className="page-subtitle">Manage your account details and security settings.</p>
        </div>
      </header>

      <div className="profile-layout">
        <section className="profile-card profile-summary-card" aria-labelledby="profile-details-title">
          <div className="profile-summary">
            <div className="profile-large-avatar">
              {user.username.charAt(0).toUpperCase()}
              {user.image_url && (
                <img
                  src={user.image_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="profile-summary-copy">
              <h2>{user.username}</h2>
              <span className="profile-account-badge">{isGoogleAccount ? 'Google account' : 'Password account'}</span>
            </div>
          </div>

          <div className="profile-card-divider" />
          <h2 id="profile-details-title" className="profile-section-title">Profile details</h2>
          <dl className="profile-details-list">
            <div><dt>Username</dt><dd>{user.username}</dd></div>
            <div><dt>Email address</dt><dd>{user.email}</dd></div>
            <div><dt>Sign-in method</dt><dd>{isGoogleAccount ? 'Google' : 'Email and password'}</dd></div>
            <div><dt>Member since</dt><dd>{joinedDate}</dd></div>
          </dl>
        </section>

        <section className="profile-card profile-security-card" aria-labelledby="security-title">
          <div className="profile-security-heading">
            <div>
              <span className="profile-eyebrow">SECURITY</span>
              <h2 id="security-title" className="profile-section-title">Password</h2>
            </div>
            <span className="profile-security-icon" aria-hidden="true">⌑</span>
          </div>

          {isGoogleAccount ? (
            <div className="profile-google-note">
              <strong>Password managed by Google</strong>
              <p>This account signs in with Google and does not have a ShortLink password to change or reset. Manage your Google password through your Google account.</p>
            </div>
          ) : (
            <>
              <p className="profile-card-description">Update your password using your current password, or reset it with a one-time code sent to your email.</p>
              <form className="profile-form" onSubmit={submitPasswordChange}>
                {passwordNotice && <div className={`profile-notice profile-notice-${passwordNotice.type}`} role={passwordNotice.type === 'error' ? 'alert' : 'status'}>{passwordNotice.text}</div>}
                <PasswordField id="current-password" label="Current password" autoComplete="current-password" minLength={1} value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, currentPassword: event.target.value }))} />
                <PasswordField id="new-password" label="New password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))} />
                <PasswordField id="confirm-new-password" label="Confirm new password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((form) => ({ ...form, confirmPassword: event.target.value }))} />
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
              </form>

              <div className="profile-reset-divider"><span>OR</span></div>
              {!resetStarted ? (
                <div className="profile-reset-request">
                  {resetNotice && <div className={`profile-notice profile-notice-${resetNotice.type}`} role={resetNotice.type === 'error' ? 'alert' : 'status'}>{resetNotice.text}</div>}
                  <button type="button" className="btn btn-secondary profile-reset-start" onClick={requestResetCode} disabled={busy}>
                    {busy ? 'Sending…' : 'Forgot your current password?'}
                  </button>
                </div>
              ) : (
                <form className="profile-form profile-reset-form" onSubmit={submitPasswordReset}>
                  {resetNotice && <div className={`profile-notice profile-notice-${resetNotice.type}`} role={resetNotice.type === 'error' ? 'alert' : 'status'}>{resetNotice.text}</div>}
                  <p className="profile-card-description">Enter the six-digit code sent to {user.email} and choose a new password.</p>
                  <div className="form-group">
                    <label htmlFor="profile-reset-code">Email verification code</label>
                    <input id="profile-reset-code" type="text" className="form-input form-input-simple" value={resetForm.code} onChange={(event) => setResetForm((form) => ({ ...form, code: event.target.value.replace(/\D/g, '').slice(0, 6) }))} autoComplete="one-time-code" inputMode="numeric" maxLength={6} required />
                  </div>
                  <PasswordField id="profile-reset-new-password" label="New password" value={resetForm.newPassword} onChange={(event) => setResetForm((form) => ({ ...form, newPassword: event.target.value }))} />
                  <PasswordField id="profile-reset-confirm-password" label="Confirm new password" value={resetForm.confirmPassword} onChange={(event) => setResetForm((form) => ({ ...form, confirmPassword: event.target.value }))} />
                  <div className="profile-reset-actions">
                    <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => { setResetStarted(false); setResetNotice(null); }}>Cancel</button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      <div className="profile-logout-row">
        <div>
          <strong>Ready to leave?</strong>
          <p>Sign out of your ShortLink account on this device.</p>
        </div>
        <button type="button" className="btn btn-danger" onClick={onLogout}>Log out</button>
      </div>

      <section className="profile-delete-row" aria-labelledby="delete-account-title">
        <div>
          <strong id="delete-account-title">Delete account</strong>
          <p>Permanently delete your account, saved links, and related data. This cannot be undone.</p>
          <button type="button" className="btn btn-danger profile-delete-trigger" onClick={() => setDeleteModalOpen(true)}>
            Delete account
          </button>
        </div>
      </section>

      {deleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="delete-account-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 id="delete-account-modal-title" className="modal-title">Confirm account deletion</h2>
              <button type="button" className="modal-close" onClick={closeDeleteModal} disabled={busy} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="profile-card-description">Permanently delete your account, saved links, and related data. This cannot be undone.</p>
              <form className="profile-delete-modal-form" onSubmit={submitAccountDeletion}>
                {deleteNotice && <div className={`profile-notice profile-notice-${deleteNotice.type}`} role="alert">{deleteNotice.text}</div>}
                <div className="form-group">
                  <label htmlFor="delete-account-confirmation">Type DELETE to confirm</label>
                  <input
                    id="delete-account-confirmation"
                    type="text"
                    className="form-input form-input-simple"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="profile-delete-actions">
                  <button type="button" className="btn btn-ghost" onClick={closeDeleteModal} disabled={busy}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={busy || deleteConfirmation !== 'DELETE'}>
                    {busy ? 'Deleting…' : 'Delete account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProfilePage;
