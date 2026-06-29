'use client';

import { useEffect, useState, useCallback, useRef, useTransition } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import * as Y from 'yjs';
import { useSession } from 'next-auth/react';
import { createYjsProviders, type YjsProviders } from '@/lib/yjs/provider';
import { OfflineBanner } from '../sync/OfflineBanner';
import { VersionHistory } from './VersionHistory';
import { ConnectionStatus } from './ConnectionStatus';
import { EditorToolbar } from './EditorToolbar';
import { AiPanel } from './AiPanel';
import { userColor } from '@careercopliot/utils';

const lowlight = createLowlight(common);

interface SyncdocEditorProps {
  noteId:    string;
  groupId:   string;
  userRole:  'admin' | 'editor' | 'viewer';
  noteTitle: string;
}

export function SyncdocEditor({ noteId, groupId, userRole, noteTitle }: SyncdocEditorProps) {
  const { data: session }               = useSession();
  const [status, setStatus]             = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showVersions, setShowVersions] = useState(false);
  const [title, setTitle]               = useState(noteTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [versionKey, setVersionKey]     = useState(0);
  const [, startTransition]             = useTransition();
  const providersRef                    = useRef<YjsProviders | null>(null);
  const isEditable                      = userRole === 'admin' || userRole === 'editor';

  const saveTitle = useCallback(async (newTitle: string) => {
    const trimmed = newTitle.trim() || 'Untitled note';
    setTitle(trimmed);
    setEditingTitle(false);
    startTransition(async () => {
      await fetch(`/api/notes/${noteId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: trimmed }),
      });
    });
  }, [noteId]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const providers = createYjsProviders(noteId, session.accessToken);
    providersRef.current = providers;

    providers.wsProvider.on('status', ({ status: s }: { status: string }) => {
      setStatus(s === 'connected' ? 'connected' : 'disconnected');
    });

    return () => {
      providers.destroy();
      providersRef.current = null;
    };
  }, [noteId, session?.accessToken]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false, codeBlock: false }),
      Collaboration.configure({ document: providersRef.current?.ydoc ?? new Y.Doc() }),
      ...(isEditable && providersRef.current ? [
        CollaborationCursor.configure({
          provider: providersRef.current.wsProvider,
          user: {
            name:  session?.user?.name ?? 'Anonymous',
            color: userColor(session?.user?.id ?? ''),
          },
        }),
      ] : []),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-600 underline cursor-pointer' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editable: isEditable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  }, [providersRef.current?.ydoc]);

  const saveVersion = useCallback(async () => {
    if (!providersRef.current?.ydoc) return;
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(providersRef.current.ydoc)).toString('base64');
    const html     = editor?.getHTML() ?? '';
    const res = await fetch('/api/notes/versions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        noteId,
        snapshot,
        label:   `Snapshot ${new Date().toLocaleString()}`,
        html,
        noteTitle: title,
      }),
    });
    if (res.ok) setVersionKey(k => k + 1);
  }, [noteId, editor, title]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
        {isEditable && editingTitle ? (
          <input
            autoFocus
            defaultValue={title}
            onBlur={e => saveTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle((e.target as HTMLInputElement).value);
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-brand-500 outline-none flex-1 mr-4"
          />
        ) : (
          <h1
            className={`text-lg font-semibold text-gray-900 truncate ${isEditable ? 'cursor-pointer hover:text-brand-600' : ''}`}
            onClick={() => isEditable && setEditingTitle(true)}
            title={isEditable ? 'Click to rename' : undefined}
          >
            {title}
          </h1>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ConnectionStatus status={status} />
          {userRole === 'viewer' && (
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">View only</span>
          )}
          {/* AI panel — available to all roles for reading; insert requires editable */}
          {editor && <AiPanel editor={editor} noteTitle={title} />}
          {isEditable && (
            <button
              onClick={saveVersion}
              className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50 text-gray-600"
            >
              Save version
            </button>
          )}
          <button
            onClick={() => setShowVersions(v => !v)}
            className={`text-sm px-3 py-1.5 border rounded-md transition ${
              showVersions ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            History
          </button>
        </div>
      </div>

      <OfflineBanner />

      {/* Toolbar — only for editable users */}
      {isEditable && editor && <EditorToolbar editor={editor} />}

      {/* Editor + version panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>

        {showVersions && (
          <div className="w-72 border-l overflow-y-auto flex-shrink-0 bg-gray-50">
            <VersionHistory noteId={noteId} editor={editor ?? null} refreshKey={versionKey} />
          </div>
        )}
      </div>
    </div>
  );
}
