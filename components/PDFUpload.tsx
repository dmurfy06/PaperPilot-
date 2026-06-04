'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
        />
        <Upload className="mx-auto mb-3 text-slate-500" size={32} />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Upload a research paper
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Drag and drop your PDF here, or click to browse
        </p>
        <p className="text-xs text-slate-500">PDF • Up to 25 MB</p>

        {currentFile && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900">{currentFile.name}</p>
              <p className="text-xs text-blue-700">
                Click to replace or upload a different file
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
