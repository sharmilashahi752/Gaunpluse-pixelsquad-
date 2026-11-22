import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AuthPageLayout from '../components/auth/AuthPageLayout';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Sign In — GaunPulse');

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userData, setUserData] = useState(null);
  const [redirectTarget, setRedirectTarget] = useState('dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : (data.message || 'The provided credentials do not match our records.');
        setErrorMsg(message);
        setLoading(false);
        return;
      }

      // Verified authentication data from server
      const token = data.token;
      const user = data.user;
      const serverRole = user?.role || data.role;

      // Secure storage in localStorage
      localStorage.setItem('gaunpulse_auth_token', token);
      localStorage.setItem('gaunpulse_auth_user', JSON.stringify(user));
      localStorage.setItem('gaunpulse_citizen_token', token);
      localStorage.setItem('gaunpulse_citizen_user', JSON.stringify(user));

      // Derive destination strictly from server-verified role
      let target = 'dashboard';
      if (serverRole === 'citizen') {
        target = 'citizen';
      } else if (serverRole === 'ward_officer') {
        target = 'dashboard';
      } else if (
        serverRole === 'system_admin' ||
        serverRole === 'municipality_admin' ||
        serverRole === 'admin'
      ) {
        target = 'dashboard';
      } else {
        target = data.redirect_route || 'dashboard';
      }

      setUserData(user);
      setRedirectTarget(target);
      setIsSubmitted(true);

      const dashboardBase = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174';
      const redirectUrl = `${dashboardBase}/#/auth-callback?token=${encodeURIComponent(token)}&target=${target}`;

      // Smooth transition to authorized workspace
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to the authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dashboardBase = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174';
  const savedToken = userData ? localStorage.getItem('gaunpulse_auth_token') : '';
  const directRedirectUrl = `${dashboardBase}/#/auth-callback?token=${encodeURIComponent(savedToken || '')}&target=${redirectTarget}`;

  const submittedContent = (
    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
      <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
      <h3 className="font-bold text-base text-[#173D32]">
        Authentication Verified
      </h3>
      <p className="text-xs text-[#64748B]">
        {userData ? (
          <>
            Welcome back, <strong>{userData.name}</strong> ({userData.role?.replace('_', ' ').toUpperCase()}).
            Redirecting to your {redirectTarget === 'citizen' ? 'Citizen Portal' : 'Official Workspace'}...
          </>
        ) : (
          'Session initialized for your civic profile. All civic modules and maps are currently active.'
        )}
      </p>
      <a
        href={directRedirectUrl}
        className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-2.5 rounded-lg bg-[#173D32] text-white text-xs font-semibold hover:bg-[#122F26] transition-colors"
      >
        <span>Continue to {redirectTarget === 'citizen' ? 'Citizen Portal' : 'Official Workspace'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );

  return (
    <AuthPageLayout
      imageSrc="/images/auth/login1.webp"
      imageAlt="Boudhanath Stupa in rural Kathmandu valley (login1)"
      overlayHeading="Every Village Deserves to Be Heard."
      overlaySubtext="Connecting communities, improving infrastructure, and building a better rural Nepal."
      title="Sign in to your account"
      subtitle="Welcome back. Enter your credentials to access the civic monitoring portal."
      isSubmitted={isSubmitted}
      submittedContent={submittedContent}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] placeholder:text-[#94A3B8] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] placeholder:text-[#94A3B8] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3B8] hover:text-[#173D32] hover:bg-stone-100 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173D32]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox (Unchecked by default) */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#123D30] border-[#E5E7EB] focus:ring-[#123D30]"
            />
            <span className="text-xs text-[#64748B]">Remember this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 py-3 px-4 rounded-xl bg-[#123D30] hover:bg-[#236A50] active:bg-[#0C2E24] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#123D30] focus-visible:outline-offset-2 flex items-center justify-center select-none disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </span>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Switch to Registration */}
        <p className="text-center text-xs text-[#64748B] pt-4 border-t border-[#E5E7EB]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#123D30] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}

export default LoginPage;
