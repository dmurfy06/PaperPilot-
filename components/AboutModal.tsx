'use client';

import { X, Brain, Upload, BookOpen, MessageSquare, Zap } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

const FEATURES = [
  { icon: <Zap size={13} />, title: 'Instant analysis', body: 'Full structured breakdown in 15–30 seconds after upload.' },
  { icon: <Brain size={13} />, title: 'AI summary', body: 'Objectives, key findings, methods, and limitations in plain English.' },
  { icon: <BookOpen size={13} />, title: 'Glossary & references', body: 'Technical terms defined, citations formatted automatically.' },
  { icon: <MessageSquare size={13} />, title: 'Ask questions', body: "Chat with the paper to dig deeper into anything you don't understand." },
  { icon: <Upload size={13} />, title: 'Works with any PDF', body: 'Google Scholar, PubMed, arXiv, or your university library — just needs selectable text.' },
];

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-7 pt-7 pb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">About Scigestible</span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Scigestible is an AI-powered research paper companion. Upload any academic PDF and get a
            structured, plain-English breakdown in seconds — no more struggling through dense jargon.
          </p>

          <div className="space-y-3 mb-6">
            {FEATURES.map(({ icon, title, body }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400 flex items-center justify-center mt-0.5">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Free plan includes</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">10 saved papers · 5 uploads per day · 3 questions per day</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upgrade to Pro for unlimited access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
