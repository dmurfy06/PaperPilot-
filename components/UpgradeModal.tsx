'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Loader } from 'lucide-react';

interface UpgradeModalProps {
  reason: 'paper_limit' | 'upload_limit' | 'question_limit';
  onClose: () => void;
}

const REASONS = {
  paper_limit: {
    title: 'Paper limit reached',
    description: "You've reached the 10-paper limit on the free plan. Delete a paper to free up space, or upgrade to Pro for unlimited storage.",
  },
  upload_limit: {
    title: 'Daily upload limit reached',
    description: "You've used all your uploads for today on the free plan. Your limit resets at midnight, or upgrade to Pro for 50 uploads per day.",
  },
  question_limit: {
    title: 'Daily question limit reached',
    description: "You've used all your Ask AI questions for today on the free plan. Your limit resets at midnight, or upgrade to Pro for 50 questions per day.",
  },
};

const PRO_FEATURES = [
  'Unlimited paper storage',
  '50 PDF uploads per day',
  '50 Ask AI questions per day',
  'Priority support',
];

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = REASONS[reason];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-violet-500 px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Scigestible Pro</span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">{info.description}</p>
        </div>

        <div className="px-6 py-5">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">£5</span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
          </div>

          {/* Features */}
          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 mb-3">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 active:from-blue-600 active:to-violet-600 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
          >
            {loading ? (
              <><Loader size={16} className="animate-spin" /> Redirecting to Stripe…</>
            ) : (
              <><Sparkles size={16} /> Upgrade to Pro — £5/month</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
            Cancel anytime · Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
