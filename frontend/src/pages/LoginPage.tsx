import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../api/client';
import { FileText, Eye, EyeOff, Shield, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const { login, loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'admin') => {
    setIsLoading(true);
    setError('');
    try {
      if (role === 'admin') {
        await loginAsAdmin();
      } else {
        await login('student@demo.docuvault.app', 'demo-password');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Brand Logo Header */}
        <div
          className="auth-logo"
          onClick={() => window.dispatchEvent(new CustomEvent('docuvault:replay-intro'))}
          title="Click to replay startup animation"
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="auth-logo-icon">
            <FileText size={24} color="#181818" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              DocuVault
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              College Document Vault
            </div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access your verified student academic credentials</p>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="alert alert-lime" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
            <Zap size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.84rem' }}>Demo Fallback Active</strong>
              <div style={{ fontSize: '0.76rem', marginTop: '2px' }}>
                Zero AWS setup required. Use one-click instant sign-in buttons below.
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Student or Faculty Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="student@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            id="btn-login"
            style={{ width: '100%', marginTop: '0.4rem' }}
          >
            {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo One-Click Sign In */}
        {isDemoMode && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instant Demo Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('student')}
                disabled={isLoading}
                id="btn-demo-student"
              >
                🎓 Demo Student
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                id="btn-demo-admin"
              >
                <Shield size={13} /> Demo Admin
              </button>
            </div>
          </div>
        )}

        {!isDemoMode && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.25rem' }}>
            Direct Cognito User Pool authentication in ap-southeast-2
          </p>
        )}
      </motion.div>
    </div>
  );
}
