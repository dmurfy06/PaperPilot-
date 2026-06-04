'use client';

import React, { useState } from 'react';
import { Note } from '@/lib/types';
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react';

interface NotesTabProps {
  paperId: string;
  notes: Note[];
  onAddNote: (note: Note) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesTab({
  paperId,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: NotesTabProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const paperNotes = notes.filter((note) => note.paperId === paperId);

  const handleAddNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        paperId,
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onAddNote(newNote);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim() && editContent.trim()) {
      onUpdateNote(id, { title: editTitle, content: editContent });
      setEditingNoteId(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2>My Notes</h2>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            New Note
          </button>
        )}
      </div>

      {isAddingNote && (
        <div className="mb-6 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
          <input
            type="text"
            placeholder="Note title..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Note content..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNote}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Check size={16} />
              Save Note
            </button>
            <button
              onClick={() => setIsAddingNote(false)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {paperNotes.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          No notes yet. Create one to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {paperNotes.map((note) =>
            editingNoteId === note.id ? (
              <div
                key={note.id}
                className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(note.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNoteId(null)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={note.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{note.title}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Edit note"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
