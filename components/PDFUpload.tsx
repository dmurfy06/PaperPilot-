'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  currentFile?: File | null;
}

export function PDFUpload({ onFileSelect, isLoading = false, currentFile }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25 MB limit');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) onFileSelect(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file && validateFile(file)) onFileSelect(file);
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-2xl px-8 py-12 text-center transition-all duration-200 cursor-pointer select-none',
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
          isLoading ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <Upload
              size={24}
              className={isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}
            />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {isDragOver ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              or{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">browse files</span>
            </p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            PDF with selectable text · up to 25 MB
          </p>
        </div>
      </div>

      {currentFile && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 truncate">{currentFile.name}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Uploading…</p>
          </div>
        </div>
      )}
    </div>
  );
}
