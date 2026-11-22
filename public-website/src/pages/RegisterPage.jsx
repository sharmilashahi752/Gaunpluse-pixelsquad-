import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthPageLayout from '../components/auth/AuthPageLayout';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function RegisterPage() {
  useDocumentTitle('Create an Account — GaunPulse');

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [ward, setWard] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/citizen/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          password_confirmation: confirmPassword,
          ward_number: ward ? Number(ward) : 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : (data.message || 'Registration failed. Please check your information.');
        setErrorMsg(message);
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('gaunpulse_auth_token', data.token);
        localStorage.setItem('gaunpulse_auth_user', JSON.stringify(data.user));
        localStorage.setItem('gaunpulse_citizen_token', data.token);
        localStorage.setItem('gaunpulse_citizen_user', JSON.stringify(data.user));
      }

      setRegisteredUser(data.user);
      setIsSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Network error connecting to registration service.');
    } finally {
      setLoading(false);
    }
  };

  const submittedContent = (
    <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
      <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
      <h3 className="font-bold text-base text-[#173D32]">
        Registration Completed
      </h3>
      <p className="text-xs text-[#64748B]">
        Your community profile has been registered. You can now submit verified reports and track municipal response.
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
        <a
          href={`${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174'}/#/auth-callback?token=${encodeURIComponent(localStorage.getItem('gaunpulse_auth_token') || '')}&target=citizen`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#173D32] text-white text-xs font-semibold hover:bg-[#122F26] transition-colors"
        >
          <span>Open Citizen Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <Link
          to="/issues"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300 text-[#173D32] text-xs font-semibold hover:bg-stone-50 transition-colors"
        >
          <span>Browse Community Issues</span>
        </Link>
      </div>
    </div>
  );

  return (
    <AuthPageLayout
      imageSrc="/images/auth/login2.avif"
      imageAlt="Pashupatinath heritage site in Nepal (login2)"
      overlayHeading="Be Part of a Better Tomorrow."
      overlaySubtext="Share your voice, report local challenges, and help strengthen your community."
      title="Create an account"
      subtitle="Join the civic community to report infrastructure issues and track local repairs."
      isSubmitted={isSubmitted}
      submittedContent={submittedContent}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label
            htmlFor="full-name"
            className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="full-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] placeholder:text-[#94A3B8] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-email"
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

        {/* Municipality / Ward Location */}
        <div>
          <label
            htmlFor="ward"
            className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
          >
            Community / Ward Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="ward"
              required
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
            >
              <option value="" disabled>Select your community or ward</option>
              <option value="Sundar Gaun, Ward No. 1">Sundar Gaun, Ward No. 1</option>
              <option value="Sundar Gaun, Ward No. 2">Sundar Gaun, Ward No. 2</option>
              <option value="Sundar Gaun, Ward No. 3">Sundar Gaun, Ward No. 3 (Bridge Corridor)</option>
              <option value="Sundar Gaun, Ward No. 4">Sundar Gaun, Ward No. 4 (Health Center Zone)</option>
              <option value="Sundar Gaun, Ward No. 5">Sundar Gaun, Ward No. 5 (School Corridor)</option>
            </select>
          </div>
        </div>

        {/* Password Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] placeholder:text-[#94A3B8] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3B8] hover:text-[#173D32] hover:bg-stone-100 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#173D32]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-bold uppercase tracking-wider text-[#173D32] mb-1.5"
            >
              Confirm
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1B2923] placeholder:text-[#94A3B8] focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] outline-hidden transition-all"
              />
            </div>
          </div>
        </div>

        {/* Agree Terms Checkbox (Unchecked by default and required) */}
        <div className="pt-0.5">
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#173D32] border-[#E5E7EB] focus:ring-[#173D32]"
            />
            <span className="text-xs text-[#64748B] leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-[#173D32] underline hover:text-[#42866A]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#173D32] underline hover:text-[#42866A]">
                Privacy Policy
              </Link>.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 py-3 px-4 rounded-xl bg-[#173D32] hover:bg-[#122F26] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#173D32] focus-visible:outline-offset-2 flex items-center justify-center select-none disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Switch to Login */}
        <p className="text-center text-xs text-[#64748B] pt-3 border-t border-[#E5E7EB]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#173D32] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}

export default RegisterPage;
