'use client';

import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import type { Editor } from '@tiptap/react';
import { X, Eye, RotateCcw, Clock, User } from 'lucide-react';

interface Version {
  id:            string;
  label:         string | null;
  createdAt:     string;
  createdByName: string;
}

interface VersionHistoryProps {
  noteId:     string;
  editor:     Editor | null;
  refreshKey?: number;
}

function SnapshotModal({ html, label, createdByName, createdAt, onClose }: {
  html:          string;
  label:         string | null;
  createdByName: string;
  createdAt:     string;
  onClose:       () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <p className="font-semibold text-gray-900">{label ?? 'Untitled snapshot'}</p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {createdByName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div
            className="prose prose-sm sm:prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

export function VersionHistory({ noteId, editor, refreshKey }: VersionHistoryProps) {
  const [versions,  setVersions]  = useState<Version[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [preview,   setPreview]   = useState<{ id: string; html: string; v: Version } | null>(null);
  const [loading,   setLoading]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/notes/versions?noteId=${noteId}`)
      .then(r => r.json())
      .then(data => setVersions(data.versions ?? []));
  }, [noteId, refreshKey]);

  async function fetchHtml(versionId: string): Promise<string | null> {
    const res = await fetch(`/api/notes/versions/${versionId}/snapshot`);
    if (!res.ok) return null;
    const { snapshot } = await res.json();
    const buf     = new Uint8Array(Buffer.from(snapshot, 'base64'));
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, buf);
    const html = tempDoc.getXmlFragment('default').toJSON();
    tempDoc.destroy();
    return html;
  }

  const openPreview = async (v: Version) => {
    setLoading(v.id);
    const html = await fetchHtml(v.id);
    setLoading(null);
    if (html !== null) setPreview({ id: v.id, html, v });
  };

  const restore = async (v: Version) => {
    if (!editor) return;
    setRestoring(v.id);
    const html = await fetchHtml(v.id);
    if (html !== null) editor.commands.setContent(html, true);
    setRestoring(null);
    setPreview(null);
  };

  return (
    <>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Version history</h3>

        {versions.length === 0 && (
          <p className="text-sm text-gray-400">No saved versions yet.</p>
        )}

        <div className="space-y-2">
          {versions.map(v => (
            <div key={v.id} className="p-3 border rounded-xl bg-white text-sm shadow-sm">
              <p className="font-medium text-gray-900 truncate">{v.label ?? 'Untitled snapshot'}</p>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{v.createdByName}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{new Date(v.createdAt).toLocaleString()}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openPreview(v)}
                  disabled={loading === v.id}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {loading === v.id ? 'Loading…' : 'View'}
                </button>

                {editor && (
                  <button
                    onClick={() => restore(v)}
                    disabled={restoring === v.id}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-brand-50 text-brand-700 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {restoring === v.id ? 'Restoring…' : 'Restore'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <SnapshotModal
          html={preview.html}
          label={preview.v.label}
          createdByName={preview.v.createdByName}
          createdAt={preview.v.createdAt}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
