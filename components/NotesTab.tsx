'use client';

import React, { useState } from 'react';
import { Note } from '@/lib/types';
import { Trash2, Plus, Edit2, X, Check, StickyNote } from 'lucide-react';

interface NotesTabProps {
  paperId: string;
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

const inputCls =
  'w-full px-3 py-2 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

export function NotesTab({ paperId, notes, onAddNote, onUpdateNote, onDeleteNote }: NotesTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const paperNotes = notes.filter((n) => n.paperId === paperId);

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      paperId,
      title: newTitle.trim(),
      content: newContent.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    onUpdateNote(id, { title: editTitle.trim(), content: editContent.trim() });
    setEditingId(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="mb-0">My Notes</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Note
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-3">
          <input
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={inputCls}
            autoFocus
          />
          <textarea
            placeholder="Write your note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary text-xs py-1.5 px-3">
              <Check size={13} /> Save
            </button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary text-xs py-1.5 px-3">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {paperNotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <StickyNote size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No notes yet — create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paperNotes.map((note) =>
            editingId === note.id ? (
              <div
                key={note.id}
                className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-3"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputCls}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(note.id)} className="btn-primary text-xs py-1.5 px-3">
                    <Check size={13} /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-3">
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={note.id}
                className="p-4 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{note.title}</h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
