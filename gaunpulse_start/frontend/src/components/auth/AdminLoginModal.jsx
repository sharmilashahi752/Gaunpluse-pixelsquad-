import { useState } from 'react';
import { Lock, LogIn, Mail, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import gaunpulseLogo from '../../assets/gaunpulse-logo.png';

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (result.success) {
        onSuccess?.(result.user);
        onClose?.();
      } else {
        setError(result.message || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 61, 48, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 12px 36px rgba(18, 61, 48, 0.2)',
          border: '1px solid #d9e3db',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#123D30',
            color: '#ffffff',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={gaunpulseLogo}
              alt="GaunPulse"
              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }}
            />
            <div>
              <strong style={{ fontSize: '15px', display: 'block', fontWeight: 700 }}>
                Municipal Staff Sign In
              </strong>
              <span style={{ fontSize: '11px', color: '#a3c2b4' }}>
                Secure workspace access for authorized officers
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div style={{ padding: '22px' }}>
          {(error || authError) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#fdf3f2',
                border: '1px solid #f2c7c4',
                borderRadius: '8px',
                color: '#a83228',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={16} />
              <span>{error || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#172e25',
                  marginBottom: '6px',
                }}
              >
                Official Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#66786d',
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@municipality.gov.np"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    border: '1px solid #d9e3db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#172e25',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#172e25',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#66786d',
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    border: '1px solid #d9e3db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#172e25',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                padding: '11px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#1a5443';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#123D30';
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
