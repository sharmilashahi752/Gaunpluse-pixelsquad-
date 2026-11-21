import React, { useEffect } from 'react';
import { X, Lock } from 'lucide-react';

/**
 * Informational Authentication Placeholder Dialog
 * Explains that municipal authentication is part of the future production roadmap,
 * while keeping all current prototype features publicly accessible without accounts.
 */
export function AuthModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-10 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#42866A] block">
              Municipal Governance Portal
            </span>
            <h2
              id="auth-modal-title"
              className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight"
            >
              Authentication Coming Soon
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-[#111111] hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
            aria-label="Close authentication information dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Body */}
        <div className="space-y-3.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <p>
            GaunPulse is currently operating as an open-access CivicTech product showcase and research prototype. All interactive village maps, failure simulations, community issues, and data insights are <strong>publicly accessible without an account</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#111111]">
              <Lock className="w-4 h-4 text-[#42866A]" />
              <span>Production Municipal Architecture</span>
            </div>
            <p className="text-stone-500 leading-normal">
              In future municipal deployments, role-based authentication powered by a secure Laravel & MySQL backend will be provided for verified ward technical assistants, municipal engineers, and disaster triage focal persons.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-[0.06em] bg-[#111111] hover:bg-black text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111111] cursor-pointer"
          >
            Explore Public Prototype
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
