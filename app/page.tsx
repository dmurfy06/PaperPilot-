'use client';

import React, { useEffect, useState } from 'react';
import { PDFUpload } from '@/components/PDFUpload';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  StudyObjectiveTab,
  SummaryTab,
  FindingsTab,
  MethodsTab,
  LimitationsTab,
  GlossaryTab,
} from '@/components/AnalysisTabs';
import { NotesTab } from '@/components/NotesTab';
import { useAppStore } from '@/lib/store';
import { extractTextFromPDF } from '@/lib/pdf-extractor';
import { savePaperToStorage, getPaperFromStorage, generateId } from '@/lib/storage';
import { Paper, PaperAnalysis } from '@/lib/types';
import { AlertCircle, Loader } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    currentPaper,
    notes,
    setCurrentPaper,
    addNote,
    updateNote,
    deleteNote,
    loadNotesForPaper,
    loadStoredData,
    saveToStorage,
  } = useAppStore();

  useEffect(() => {
    setIsMounted(true);
    loadStoredData();
    const storedPaper = getPaperFromStorage();
    if (storedPaper) {
      setCurrentPaper(storedPaper);
      loadNotesForPaper(storedPaper.id);
    }
  }, [loadStoredData, setCurrentPaper, loadNotesForPaper]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsAnalyzing(true);

    try {
      const extractionResult = await extractTextFromPDF(file);

      if (!extractionResult.success) {
        setError(extractionResult.error || 'Failed to extract PDF text');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperText: extractionResult.text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze paper');
      }

      const analysis: PaperAnalysis = await response.json();

      const newPaper: Paper = {
        id: generateId(),
        filename: file.name,
        analysis,
        uploadedAt: Date.now(),
      };

      setCurrentPaper(newPaper);
      savePaperToStorage(newPaper);
      loadNotesForPaper(newPaper.id);
      saveToStorage();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentPaper(null);
    setSelectedFile(null);
    setError(null);
    localStorage.removeItem('paperpilot_current_paper');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 m-0">PaperPilot</h1>
              <p className="text-xs text-slate-500 m-0">Understand research papers instantly</p>
            </div>
          </div>
          {currentPaper && (
            <button
              onClick={handleStartOver}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentPaper ? (
          <div className="space-y-8">
            {/* Landing Page */}
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold text-slate-900">
                Understand Research Papers Faster
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload a PDF and get AI-powered analysis with plain English summaries, key findings,
                methods, limitations, and a glossary of scientific terms.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200">
              <PDFUpload
                onFileSelect={handleFileSelect}
                isLoading={isAnalyzing}
                currentFile={selectedFile}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Loader className="animate-spin text-blue-600" size={24} />
                  <p className="text-lg font-semibold text-blue-900">Analyzing your paper...</p>
                </div>
                <p className="text-sm text-blue-700">
                  This may take a minute. We're extracting text and generating insights with AI.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3>📄 Upload</h3>
                <p className="text-sm text-slate-600 m-0">
                  Upload any PDF research paper in biology, chemistry, medicine, or related fields.
                </p>
              </div>
              <div className="card">
                <h3>🤖 Analyze</h3>
                <p className="text-sm text-slate-600 m-0">
                  Our AI analyzes the paper and creates student-friendly explanations.
                </p>
              </div>
              <div className="card">
                <h3>📝 Learn</h3>
                <p className="text-sm text-slate-600 m-0">
                  Take notes, save findings, and build your understanding with a glossary.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Paper Info */}
            <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {currentPaper.filename}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Analyzed on {new Date(currentPaper.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Analysis Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="objective">Objective</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
                <TabsTrigger value="limitations">Limitations</TabsTrigger>
                <TabsTrigger value="glossary">Glossary</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="objective" className="mt-4">
                <StudyObjectiveTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <SummaryTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="findings" className="mt-4">
                <FindingsTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="methods" className="mt-4">
                <MethodsTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="limitations" className="mt-4">
                <LimitationsTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="glossary" className="mt-4">
                <GlossaryTab analysis={currentPaper.analysis} />
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <NotesTab
                  paperId={currentPaper.id}
                  notes={notes}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>
            PaperPilot © 2026 • Built for students • Powered by OpenAI
          </p>
        </div>
      </footer>
    </main>
  );
}
