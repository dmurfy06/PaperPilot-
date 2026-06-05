'use client';

import { useState } from 'react';
import { Loader, AlertCircle, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  url: string | null;
  isLoading: boolean;
  filename: string;
}

export function PDFViewer({ url, isLoading, filename }: PDFViewerProps) {
  const [iframeError, setIframeError] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/50">
        <div className="text-center">
          <Loader className="animate-spin text-blue-400 mx-auto mb-2" size={20} />
          <p className="text-xs text-slate-500">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/40">
        <div className="text-center px-6">
          <AlertCircle className="text-slate-600 mx-auto mb-2" size={20} />
          <p className="text-xs text-slate-500 leading-relaxed">
            PDF not stored for this paper.
            <br />Re-upload to enable the viewer.
          </p>
        </div>
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/40">
        <div className="text-center px-6">
          <p className="text-xs text-slate-400 mb-3">Browser blocked inline PDF.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Open {filename} <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-700/50 min-h-0">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 flex-shrink-0">
        <p className="text-xs text-slate-400 truncate">{filename}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 ml-2"
          title="Open in new tab"
        >
          <ExternalLink size={12} />
        </a>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full bg-white"
        title={filename}
        onError={() => setIframeError(true)}
      />
    </div>
  );
}
