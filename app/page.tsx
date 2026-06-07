'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';
import { Sidebar } from '@/components/Sidebar';
import { PDFUpload } from '@/components/PDFUpload';
import { PDFViewer } from '@/components/PDFViewer';
import { ExportMenu } from '@/components/ExportMenu';
import { UpgradeModal } from '@/components/UpgradeModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  StudyObjectiveTab,
  SummaryTab,
  FindingsTab,
  MethodsTab,
  LimitationsTab,
  GlossaryTab,
  CitationTab,
} from '@/components/AnalysisTabs';
import { NotesTab } from '@/components/NotesTab';
import { AskTab } from '@/components/AskTab';
import { useAppStore } from '@/lib/store';
import { extractTextFromPDF } from '@/lib/pdf-extractor';
import { Paper, Folder } from '@/lib/types';
import { AlertCircle, Loader, PanelLeft, Menu, Sparkles } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';

type UpgradeReason = 'paper_limit' | 'upload_limit' | 'question_limit';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [pdfUrlLoading, setPdfUrlLoading] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [uploadLimit, setUploadLimit] = useState(5);
  const [questionLimit, setQuestionLimit] = useState(3);
  const [isPro, setIsPro] = useState(false);
  const [paperCount, setPaperCount] = useState(0);
  const [paperLimit, setPaperLimit] = useState<number | null>(10);
  const [upgradeModal, setUpgradeModal] = useState<UpgradeReason | null>(null);
  const [proSuccessBanner, setProSuccessBanner] = useState(false);

  const { currentPaper, setCurrentPaper, notes, addNote, updateNote, deleteNote, loadNotesForPaper } =
    useAppStore();

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show success banner when returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === '1') {
      setProSuccessBanner(true);
      window.history.replaceState({}, '', '/');
      setTimeout(() => setProSuccessBanner(false), 6000);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPapers([]);
      setCurrentPaper(null);
      return;
    }

    setPapersLoading(true);
    fetch('/api/usage').then((r) => r.json()).then((u) => {
      if (u.uploadCount !== undefined) setUploadCount(u.uploadCount);
      if (u.questionCount !== undefined) setQuestionCount(u.questionCount);
      if (u.uploadLimit !== undefined) setUploadLimit(u.uploadLimit);
      if (u.questionLimit !== undefined) setQuestionLimit(u.questionLimit);
      if (u.isPro !== undefined) setIsPro(u.isPro);
      if (u.paperCount !== undefined) setPaperCount(u.paperCount);
      if ('paperLimit' in u) setPaperLimit(u.paperLimit);
    }).catch(() => {});
    Promise.all([
      supabase.from('papers').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('folders').select('*').order('created_at', { ascending: true }),
    ]).then(([{ data: papersData }, { data: foldersData }]) => {
      if (foldersData) {
        setFolders(foldersData.map((row) => ({
          id: row.id,
          name: row.name,
          createdAt: new Date(row.created_at).getTime(),
        })));
      }
      if (papersData) {
        const mapped: Paper[] = papersData.map((row) => ({
          id: row.id,
          filename: row.filename,
          customName: row.custom_name ?? undefined,
          pdfPath: row.pdf_path ?? undefined,
          folderId: row.folder_id ?? undefined,
          analysis: row.analysis,
          uploadedAt: new Date(row.uploaded_at).getTime(),
        }));
        setPapers(mapped);
        if (mapped.length > 0) {
          setCurrentPaper(mapped[0]);
          loadNotesForPaper(mapped[0].id);
        } else {
          setShowUpload(true);
        }
      }
      setPapersLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentPaper(null);
    setPapers([]);
    setFolders([]);
    setShowUpload(false);
  };

  const handleSelectPaper = (paper: Paper) => {
    setCurrentPaper(paper);
    setShowUpload(false);
    setAnalyzeError(null);
    loadNotesForPaper(paper.id);
    setPdfPanelOpen(false);
    setSidebarMobileOpen(false);
  };

  const handleNewPaper = () => {
    setShowUpload(true);
    setCurrentPaper(null);
    setAnalyzeError(null);
    setSelectedFile(null);
    setPdfPanelOpen(false);
    setSidebarMobileOpen(false);
  };

  const handleRenamePaper = async (paperId: string, newName: string) => {
    await fetch(`/api/papers/${paperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customName: newName }),
    });
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, customName: newName } : p))
    );
    if (currentPaper?.id === paperId) {
      setCurrentPaper({ ...currentPaper, customName: newName });
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    await fetch(`/api/papers/${paperId}`, { method: 'DELETE' });
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    setPaperCount((c) => Math.max(0, c - 1));
    if (currentPaper?.id === paperId) {
      const remaining = papers.filter((p) => p.id !== paperId);
      if (remaining.length > 0) {
        setCurrentPaper(remaining[0]);
        loadNotesForPaper(remaining[0].id);
      } else {
        setCurrentPaper(null);
        setShowUpload(true);
      }
      setPdfPanelOpen(false);
    }
  };

  const handleCreateFolder = async (name: string): Promise<Folder | null> => {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;
    const row = await res.json();
    const folder: Folder = { id: row.id, name: row.name, createdAt: new Date(row.created_at).getTime() };
    setFolders((prev) => [...prev, folder]);
    return folder;
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    await fetch(`/api/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)));
  };

  const handleDeleteFolder = async (folderId: string) => {
    await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setPapers((prev) => prev.map((p) => (p.folderId === folderId ? { ...p, folderId: undefined } : p)));
    if (currentPaper?.folderId === folderId) {
      setCurrentPaper({ ...currentPaper, folderId: undefined });
    }
  };

  const handleMoveToFolder = async (paperId: string, folderId: string | null) => {
    await fetch(`/api/papers/${paperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    const updated = folderId ?? undefined;
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, folderId: updated } : p)));
    if (currentPaper?.id === paperId) {
      setCurrentPaper({ ...currentPaper, folderId: updated });
    }
  };

  const handleTogglePdfPanel = async () => {
    if (!currentPaper) return;

    if (pdfPanelOpen) {
      setPdfPanelOpen(false);
      return;
    }

    if (currentPaper.pdfUrl) {
      setPdfPanelOpen(true);
      return;
    }

    if (!currentPaper.pdfPath) {
      setPdfPanelOpen(true);
      return;
    }

    setPdfUrlLoading(true);
    setPdfPanelOpen(true);
    const { data } = await supabase.storage
      .from('paper-pdfs')
      .createSignedUrl(currentPaper.pdfPath, 3600);

    if (data?.signedUrl) {
      const updated = { ...currentPaper, pdfUrl: data.signedUrl };
      setCurrentPaper(updated);
      setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    setPdfUrlLoading(false);
  };

  const handleFileSelect = async (file: File) => {
    // Client-side paper limit guard
    if (paperLimit !== null && paperCount >= paperLimit) {
      setUpgradeModal('paper_limit');
      return;
    }

    setSelectedFile(file);
    setAnalyzeError(null);
    setIsAnalyzing(true);

    try {
      const extraction = await extractTextFromPDF(file);

      if (!extraction.success) {
        setAnalyzeError(extraction.error || 'Failed to extract PDF text');
        return;
      }

      let pdfPath: string | undefined;
      if (user) {
        const uuid = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = `${user.id}/${uuid}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('paper-pdfs')
          .upload(path, file, { contentType: 'application/pdf' });
        if (uploadError) {
          console.warn('PDF storage upload failed:', uploadError.message);
          setAnalyzeError(`PDF storage failed: ${uploadError.message} — analysis will still run but the PDF viewer won't work.`);
          setTimeout(() => setAnalyzeError(null), 8000);
        } else {
          pdfPath = path;
        }
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperText: extraction.text, filename: file.name, pdfPath }),
      });

      if (!res.ok) {
        const err = await res.json();
        // Surface limit errors as upgrade modals
        if (err.code === 'PAPER_LIMIT') { setUpgradeModal('paper_limit'); return; }
        if (err.code === 'UPLOAD_LIMIT') { setUpgradeModal('upload_limit'); return; }
        throw new Error(err.error || 'Analysis failed');
      }

      const paper: Paper = await res.json();
      setPapers((prev) => [paper, ...prev]);
      setPaperCount((c) => c + 1);
      setCurrentPaper(paper);
      setShowUpload(false);
      setSelectedFile(null);
      setUploadCount((c) => c + 1);
      loadNotesForPaper(paper.id);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpgrade = (reason?: UpgradeReason) => {
    setUpgradeModal(reason ?? 'paper_limit');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 select-none">
          <LogoIcon size={48} />
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
            <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const showingUpload = showUpload || (!currentPaper && !papersLoading);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden md:flex-row">
      {/* Upgrade modal */}
      {upgradeModal && (
        <UpgradeModal reason={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}

      {/* Pro success banner */}
      {proSuccessBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-medium rounded-2xl shadow-xl shadow-violet-500/30 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={16} />
          You&apos;re now on Pro — enjoy unlimited access!
        </div>
      )}

      <Sidebar
        user={user}
        papers={papers}
        folders={folders}
        currentPaperId={currentPaper?.id ?? null}
        loading={papersLoading}
        isPro={isPro}
        paperCount={paperCount}
        paperLimit={paperLimit}
        onSelectPaper={handleSelectPaper}
        onNewPaper={handleNewPaper}
        onSignOut={handleSignOut}
        onRenamePaper={handleRenamePaper}
        onDeletePaper={handleDeletePaper}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveToFolder={handleMoveToFolder}
        onUpgrade={() => handleUpgrade('paper_limit')}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {showingUpload ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Mobile top-bar */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu size={18} />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Scigestible</span>
            </div>
            <div className="max-w-xl mx-auto px-6 py-10 md:py-16 w-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  Upload a Research Paper
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  PDF must have selectable text — not a scanned image
                </p>
              </div>

              <div className="card">
                <PDFUpload
                  onFileSelect={handleFileSelect}
                  isLoading={isAnalyzing}
                  currentFile={selectedFile}
                  uploadsUsed={uploadCount}
                  uploadLimit={uploadLimit}
                  paperCount={paperCount}
                  paperLimit={paperLimit}
                  isPro={isPro}
                  onUpgrade={() => handleUpgrade('paper_limit')}
                />
              </div>

              {analyzeError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-800 dark:text-red-400">{analyzeError}</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-2.5 mb-1">
                    <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={16} />
                    <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">Analysing your paper…</p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Usually takes 15–30 seconds.</p>
                </div>
              )}
            </div>
          </div>
        ) : currentPaper ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Header */}
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setSidebarMobileOpen(true)}
                    className="md:hidden mt-0.5 p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  >
                    <Menu size={16} />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight mb-0">
                      {currentPaper.customName || currentPaper.filename.replace(/\.pdf$/i, '')}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Analysed{' '}
                      {new Date(currentPaper.uploadedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  <button
                    onClick={handleTogglePdfPanel}
                    title={pdfPanelOpen ? 'Close PDF' : 'View PDF'}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                      pdfPanelOpen
                        ? 'bg-gradient-to-r from-blue-500 to-violet-500 border-transparent text-white hover:from-blue-400 hover:to-violet-400 shadow-sm shadow-violet-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <PanelLeft size={12} />
                    PDF
                  </button>
                  <ExportMenu paper={currentPaper} />
                </div>
              </div>
            </div>

            {/* Content: optional split with PDF viewer */}
            <div className={`flex-1 overflow-hidden flex gap-3 md:gap-4 px-4 md:px-6 pb-4 md:pb-6 min-h-0 ${pdfPanelOpen ? 'flex-col md:flex-row' : ''}`}>
              {pdfPanelOpen && (
                <div className="h-[42vh] md:h-auto md:w-[42%] flex-shrink-0 flex flex-col min-h-0">
                  <PDFViewer
                    url={currentPaper.pdfUrl ?? null}
                    isLoading={pdfUrlLoading}
                    filename={currentPaper.customName || currentPaper.filename}
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto min-w-0 min-h-0">
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto scrollbar-none mb-1">
                    <TabsTrigger value="objective">Objective</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="methods">Methods</TabsTrigger>
                    <TabsTrigger value="limitations">Limitations</TabsTrigger>
                    <TabsTrigger value="glossary">Glossary</TabsTrigger>
                    <TabsTrigger value="references">References</TabsTrigger>
                    <TabsTrigger value="ask">Ask AI</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mb-4 px-0.5">
                    AI-generated — always verify with the original paper
                  </p>

                  <TabsContent value="objective">
                    <StudyObjectiveTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="summary">
                    <SummaryTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="findings">
                    <FindingsTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="methods">
                    <MethodsTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="limitations">
                    <LimitationsTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="glossary">
                    <GlossaryTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="references">
                    <CitationTab analysis={currentPaper.analysis} />
                  </TabsContent>
                  <TabsContent value="ask">
                    <AskTab
                      analysis={currentPaper.analysis}
                      dailyQuestionsUsed={questionCount}
                      dailyQuestionLimit={questionLimit}
                      isPro={isPro}
                      onQuestionSent={() => setQuestionCount((c) => c + 1)}
                      onUpgrade={() => handleUpgrade('question_limit')}
                    />
                  </TabsContent>
                  <TabsContent value="notes">
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
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
