'use client';

import { useState } from 'react';
import { Search, Plus, LogOut, FileText, Sun, Moon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Paper } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
  user: User;
  papers: Paper[];
  currentPaperId: string | null;
  loading: boolean;
  onSelectPaper: (paper: Paper) => void;
  onNewPaper: () => void;
  onSignOut: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function Sidebar({
  user,
  papers,
  currentPaperId,
  loading,
  onSelectPaper,
  onNewPaper,
  onSignOut,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const { theme, toggle } = useTheme();

  const filtered = papers.filter((p) =>
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-screen overflow-hidden bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-800/80">

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
          <span className="text-white font-bold text-xs tracking-wide">PP</span>
        </div>
        <span className="font-semibold text-white tracking-tight text-sm">PaperPilot</span>
      </div>

      {/* New Paper button */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewPaper}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors duration-150 shadow-sm shadow-blue-600/20"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Paper
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 dark:bg-slate-900 text-slate-200 text-sm pl-8 pr-3 py-2 rounded-lg placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Section label */}
      {papers.length > 0 && (
        <p className="px-4 text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
          Papers
        </p>
      )}

      {/* Papers list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-1 px-1 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-3 animate-pulse">
                <div className="h-2.5 bg-slate-700 rounded w-4/5 mb-2" />
                <div className="h-2 bg-slate-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-600 text-xs py-10 px-4 leading-relaxed">
            {search ? `No results for "${search}"` : 'No papers yet — upload your first!'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((paper) => {
              const active = paper.id === currentPaperId;
              return (
                <button
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors duration-100 group ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText
                      size={12}
                      className={`mt-0.5 flex-shrink-0 ${active ? 'text-blue-200' : 'text-slate-600 group-hover:text-slate-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">
                        {paper.filename.replace(/\.pdf$/i, '')}
                      </p>
                      <p className={`text-xs mt-0.5 ${active ? 'text-blue-200' : 'text-slate-600'}`}>
                        {timeAgo(paper.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: theme toggle + user + sign out */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150 text-xs font-medium"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} className="flex-shrink-0" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon size={14} className="flex-shrink-0" />
              <span>Dark mode</span>
            </>
          )}
        </button>

        {/* User row */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate flex-1 min-w-0">{user.email}</p>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex-shrink-0 p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
