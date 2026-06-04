'use client';

import { useState } from 'react';
import { Search, Plus, LogOut, FileText } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Paper } from '@/lib/types';

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
  if (days < 7) return `${days} days ago`;
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

  const filtered = papers.filter((p) =>
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 flex-shrink-0 bg-slate-900 text-white flex flex-col h-screen overflow-hidden">
      {/* Top: logo + new paper button */}
      <div className="p-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="font-bold text-white tracking-tight">PaperPilot</span>
        </div>

        <button
          onClick={onNewPaper}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Paper
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-700/60">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 text-white text-sm pl-8 pr-3 py-2 rounded-lg placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Papers list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 animate-pulse">
                <div className="h-2.5 bg-slate-700 rounded w-4/5 mb-2" />
                <div className="h-2 bg-slate-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10 px-4 leading-relaxed">
            {search
              ? `No papers match "${search}"`
              : 'No papers yet.\nUpload your first paper!'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((paper) => {
              const active = paper.id === currentPaperId;
              return (
                <button
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className={`w-full text-left rounded-lg p-3 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText
                      size={13}
                      className={`mt-0.5 flex-shrink-0 ${active ? 'text-blue-200' : 'text-slate-500'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">
                        {paper.filename.replace(/\.pdf$/i, '')}
                      </p>
                      <p className={`text-xs mt-1 ${active ? 'text-blue-200' : 'text-slate-500'}`}>
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

      {/* User footer */}
      <div className="p-3 border-t border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-slate-300">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate flex-1 min-w-0">{user.email}</p>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex-shrink-0 p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
