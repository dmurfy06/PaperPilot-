'use client';

import { useState } from 'react';
import {
  X, AlertTriangle, Loader, Sun, Moon, Check, Sparkles, ExternalLink,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

type Tab = 'account' | 'appearance';

interface SettingsModalProps {
  user: User;
  isPro: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onUpgrade: () => void;
  onAccountDeleted: () => void;
}

export function SettingsModal({
  user, isPro, onClose, onSignOut, onUpgrade, onAccountDeleted,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('account');
  const { theme, toggle } = useTheme();
  const supabase = createClient();

  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleResetPassword = async () => {
    setPwStatus('loading');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
    setPwStatus(error ? 'error' : 'sent');
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    const res = await fetch('/api/account/delete', { method: 'DELETE' });
    if (res.ok) {
      onAccountDeleted();
    } else {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error || 'Something went wrong. Please try again.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-3 pb-1">
          {(['account', 'appearance'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize ${
                tab === t
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Account tab ── */}
          {tab === 'account' && (
            <>
              {/* Email */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Email address</p>
                <div className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl text-sm text-slate-300 truncate">
                  {user.email}
                </div>
              </div>

              {/* Plan */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Plan</p>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
                    isPro
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                      : 'bg-white/[0.04] border-white/[0.07] text-slate-300'
                  }`}>
                    {isPro && <Sparkles size={13} />}
                    {isPro ? 'Pro' : 'Free'}
                  </div>
                  {isPro ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      {portalLoading
                        ? <Loader size={11} className="animate-spin" />
                        : <ExternalLink size={11} />}
                      Manage subscription
                    </button>
                  ) : (
                    <button
                      onClick={() => { onClose(); onUpgrade(); }}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      <Sparkles size={11} />
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>

              {/* Password reset */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1.5">Password</p>
                {pwStatus === 'sent' ? (
                  <p className="flex items-center gap-1.5 text-xs text-green-400">
                    <Check size={13} /> Reset email sent — check your inbox.
                  </p>
                ) : pwStatus === 'error' ? (
                  <p className="text-xs text-red-400">Could not send reset email. Try again.</p>
                ) : (
                  <button
                    onClick={handleResetPassword}
                    disabled={pwStatus === 'loading'}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    {pwStatus === 'loading' && <Loader size={11} className="animate-spin" />}
                    Send password reset email
                  </button>
                )}
              </div>

              {/* Sign out */}
              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  onClick={() => { onClose(); onSignOut(); }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t border-red-900/30">
                <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  Danger zone
                </p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Permanently delete your account and all papers. This cannot be undone.
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full bg-white/[0.04] border border-red-900/40 text-slate-300 text-xs px-3 py-2 rounded-xl placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 mb-2 transition-all duration-150"
                />
                {deleteError && (
                  <p className="text-xs text-red-400 mb-2">{deleteError}</p>
                )}
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                  className="flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {deleteLoading && <Loader size={11} className="animate-spin" />}
                  Delete my account
                </button>
              </div>
            </>
          )}

          {/* ── Appearance tab ── */}
          {tab === 'appearance' && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-3">Theme</p>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { if (theme !== t) toggle(); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      theme === t
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                    <span className="capitalize">{t}</span>
                    {theme === t && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
