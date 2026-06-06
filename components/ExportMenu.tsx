'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';
import { Paper } from '@/lib/types';

function buildExportText(paper: Paper): string {
  const name = paper.customName || paper.filename.replace(/\.pdf$/i, '');
  const date = new Date(paper.uploadedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const { analysis } = paper;
  const divider = '─'.repeat(50);

  const lines: string[] = [
    name.toUpperCase(),
    `Analysed: ${date}`,
    '',
    divider,
    'OBJECTIVES',
    divider,
    ...analysis.studyObjective.points.map((p) => `• ${p}`),
    '',
    divider,
    'SUMMARY',
    divider,
    analysis.plainEnglishSummary.text,
    '',
    divider,
    'KEY FINDINGS',
    divider,
    ...analysis.keyFindings.map((f, i) => `${i + 1}. ${f.text}`),
    '',
    divider,
    'METHODS',
    divider,
    analysis.methodsOverview.text,
    '',
    divider,
    'LIMITATIONS',
    divider,
    ...analysis.limitations.map((l) => `• ${l.text}`),
  ];

  if (analysis.glossary.length > 0) {
    lines.push('', divider, 'GLOSSARY', divider);
    analysis.glossary.forEach((g) => lines.push(`${g.term}: ${g.definition}`));
  }

  if (analysis.citationData) {
    const c = analysis.citationData;
    lines.push('', divider, 'CITATION', divider);
    if (c.authors.length > 0) lines.push(`Authors: ${c.authors.join('; ')}`);
    if (c.year) lines.push(`Year: ${c.year}`);
    if (c.journal) lines.push(`Journal: ${c.journal}`);
    if (c.volume) lines.push(`Volume: ${c.volume}${c.issue ? `, Issue ${c.issue}` : ''}`);
    if (c.pages) lines.push(`Pages: ${c.pages}`);
    if (c.doi) lines.push(`DOI: ${c.doi}`);
  }

  lines.push('', `Exported from Scigestible`);
  return lines.join('\n');
}

interface ExportMenuProps {
  paper: Paper;
}

export function ExportMenu({ paper }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDownload = () => {
    const text = buildExportText(paper);
    const name = (paper.customName || paper.filename.replace(/\.pdf$/i, '')).replace(/\s+/g, '_');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleCopy = async () => {
    const text = buildExportText(paper);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <Download size={12} />
        Export
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-900/10 dark:shadow-black/30 overflow-hidden z-20">
          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            <Download size={12} className="flex-shrink-0 text-slate-400" />
            Download .txt
          </button>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            {copied
              ? <Check size={12} className="flex-shrink-0 text-green-500" />
              : <Copy size={12} className="flex-shrink-0 text-slate-400" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      )}
    </div>
  );
}
