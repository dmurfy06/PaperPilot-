'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PaperAnalysis, CitationData } from '@/lib/types';

export function StudyObjectiveTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Study Objective</h2>
      <ul className="space-y-3">
        {analysis.studyObjective.points.map((point, index) => (
          <li key={index} className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Plain English Summary</h2>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
        {analysis.plainEnglishSummary.text}
      </p>
    </div>
  );
}

export function FindingsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Key Findings</h2>
      <ul className="space-y-3">
        {analysis.keyFindings.map((finding, index) => (
          <li key={index} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{finding.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MethodsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Methods Overview</h2>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
        {analysis.methodsOverview.text}
      </p>
    </div>
  );
}

export function LimitationsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Limitations</h2>
      <ul className="space-y-3">
        {analysis.limitations.map((limitation, index) => (
          <li key={index} className="flex gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <span className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 text-base leading-none">⚠</span>
            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{limitation.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Citation helpers ──────────────────────────────────────────────────────────

function parseAuthor(raw: string): { last: string; initials: string; firstFull: string } {
  let last = '', first = '';
  if (raw.includes(',')) {
    [last, first] = raw.split(',').map((s) => s.trim());
  } else {
    const parts = raw.trim().split(' ');
    last = parts.pop() ?? '';
    first = parts.join(' ');
  }
  const initials = first
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + '.')
    .join(' ');
  return { last, initials, firstFull: first };
}

function harvardAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    return initials ? `${last}, ${initials}` : last;
  });
  if (fmt.length === 1) return fmt[0];
  if (fmt.length <= 3) return fmt.slice(0, -1).join(', ') + ' and ' + fmt[fmt.length - 1];
  return fmt[0] + ' et al.';
}

function apaAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    return initials ? `${last}, ${initials}` : last;
  });
  if (fmt.length === 1) return fmt[0];
  if (fmt.length <= 20) return fmt.slice(0, -1).join(', ') + ', & ' + fmt[fmt.length - 1];
  return fmt.slice(0, 19).join(', ') + ', … ' + fmt[fmt.length - 1];
}

function vancouverAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    const initNoPoints = initials.replace(/\.\s*/g, '');
    return `${last} ${initNoPoints}`.trim();
  });
  if (fmt.length <= 6) return fmt.join(', ');
  return fmt.slice(0, 6).join(', ') + ', et al.';
}

function buildHarvard(c: CitationData): string {
  const authors = harvardAuthors(c.authors);
  let ref = `${authors} (${c.year}) `;
  ref += `'${c.title}'`;
  if (c.journal) ref += `, ${c.journal}`;
  if (c.volume) ref += `, ${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `, pp. ${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` doi: ${c.doi}.`;
  return ref;
}

function buildAPA(c: CitationData): string {
  const authors = apaAuthors(c.authors);
  let ref = `${authors} (${c.year}). `;
  ref += `${c.title}. `;
  if (c.journal) ref += `${c.journal}`;
  if (c.volume) ref += `, ${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `, ${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` https://doi.org/${c.doi}`;
  return ref;
}

function buildVancouver(c: CitationData): string {
  const authors = vancouverAuthors(c.authors);
  let ref = `${authors}. `;
  ref += `${c.title}. `;
  if (c.journal) ref += `${c.journal}. `;
  ref += `${c.year}`;
  if (c.volume) ref += `;${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `:${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` doi: ${c.doi}.`;
  return ref;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CitationTab({ analysis }: { analysis: PaperAnalysis }) {
  const c = analysis.citationData;

  if (!c || !c.authors?.length || !c.title) {
    return (
      <div className="card">
        <h2>References</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Citation data is not available for this paper. Re-upload it to generate references.
        </p>
      </div>
    );
  }

  const styles = [
    {
      name: 'Harvard',
      description: 'Author–date · UK universities',
      text: buildHarvard(c),
    },
    {
      name: 'APA (7th edition)',
      description: 'Social & behavioural sciences',
      text: buildAPA(c),
    },
    {
      name: 'Vancouver',
      description: 'Medicine & health sciences',
      text: buildVancouver(c),
    },
  ];

  return (
    <div className="card">
      <h2>References</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Auto-generated from the paper&apos;s metadata. Always verify against the original before submitting work.
      </p>

      <div className="space-y-4">
        {styles.map(({ name, description, text }) => (
          <div key={name} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">{description}</span>
              </div>
              <CopyButton text={text} />
            </div>
            <div className="px-4 py-3.5 bg-white dark:bg-slate-800/40">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {c.doi && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            DOI:{' '}
            <a
              href={`https://doi.org/${c.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              {c.doi}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export function GlossaryTab({ analysis }: { analysis: PaperAnalysis }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const filteredTerms = analysis.glossary.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <h2>Scientific Glossary</h2>
      <input
        type="text"
        placeholder="Search terms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input mb-5"
      />
      <div className="space-y-3">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term, index) => (
            <div key={index} className="p-3 rounded-xl border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{term.term}</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5 leading-relaxed">{term.definition}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-center text-sm py-6">No terms match your search</p>
        )}
      </div>
    </div>
  );
}
