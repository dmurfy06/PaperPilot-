'use client';

import React from 'react';
import { PaperAnalysis } from '@/lib/types';

export function StudyObjectiveTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Study Objective</h2>
      <ul className="space-y-3">
        {analysis.studyObjective.points.map((point, index) => (
          <li key={index} className="flex gap-3">
            <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
            <span className="text-slate-700">{point}</span>
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
      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
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
          <li key={index} className="flex gap-3">
            <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
            <span className="text-slate-700">{finding.text}</span>
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
      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
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
          <li key={index} className="flex gap-3">
            <span className="text-amber-600 font-semibold flex-shrink-0">⚠</span>
            <span className="text-slate-700">{limitation.text}</span>
          </li>
        ))}
      </ul>
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
        className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-900">{term.term}</h4>
              <p className="text-slate-700 text-sm mt-1">{term.definition}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-4">No terms found</p>
        )}
      </div>
    </div>
  );
}
