'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Sparkles, Loader2, X, Copy, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type Action = 'summarise' | 'improve' | 'fix_grammar' | 'continue' | 'make_shorter' | 'make_longer';

const ACTIONS: { id: Action; label: string; needsSelection: boolean; description: string }[] = [
  { id: 'summarise',    label: 'Summarise note',    needsSelection: false, description: 'Generate bullet-point summary of the whole note' },
  { id: 'continue',     label: 'Continue writing',  needsSelection: false, description: 'AI continues writing from where you left off' },
  { id: 'improve',      label: 'Improve writing',   needsSelection: true,  description: 'Rewrite selected text to be clearer' },
  { id: 'fix_grammar',  label: 'Fix grammar',       needsSelection: true,  description: 'Fix spelling and grammar in selection' },
  { id: 'make_shorter', label: 'Make shorter',      needsSelection: true,  description: 'Condense selected text' },
  { id: 'make_longer',  label: 'Make longer',       needsSelection: true,  description: 'Expand selected text with more detail' },
];

interface Props {
  editor:    Editor;
  noteTitle: string;
}

export function AiPanel({ editor, noteTitle }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<Action | null>(null);
  const [result,  setResult]  = useState<{ action: Action; text: string } | null>(null);
  const [copied,  setCopied]  = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const getSelection = () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return '';
    return editor.state.doc.textBetween(from, to, ' ');
  };

  const run = async (action: Action) => {
    setOpen(false);
    setResult(null);

    const needsSel = ACTIONS.find(a => a.id === action)?.needsSelection;
    const selection = getSelection();

    if (needsSel && !selection.trim()) {
      toast.error('Select some text first for this action');
      return;
    }

    setLoading(action);
    try {
      const res = await fetch('/api/ai/document', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action,
          content:   editor.getHTML(),
          selection,
          title:     noteTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'AI request failed'); return; }

      setResult({ action, text: data.result });
    } catch {
      toast.error('AI service unreachable');
    } finally {
      setLoading(null);
    }
  };

  const insertResult = () => {
    if (!result) return;
    if (result.action === 'summarise') {
      editor.chain().focus().insertContentAt(editor.state.doc.content.size, `\n${result.text}`).run();
    } else if (result.action === 'continue') {
      editor.chain().focus().insertContentAt(editor.state.doc.content.size, ` ${result.text}`).run();
    } else {
      // Replace selection
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result.text).run();
    }
    setResult(null);
    toast.success('Inserted into note');
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={!!loading}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:opacity-90 transition disabled:opacity-50 shadow-sm"
        title="AI Writing Assistant"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span>{loading ? 'Thinking…' : 'AI'}</span>
        {!loading && <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {/* Action dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gradient-to-r from-emerald-50 to-sky-50">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              AI Writing Assistant
            </p>
          </div>
          <div className="py-1">
            {ACTIONS.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => run(a.id)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition group"
              >
                <p className="text-sm font-medium text-gray-800">{a.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>
                {a.needsSelection && (
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 inline-block">
                    Requires selection
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-emerald-50 to-sky-50">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              {ACTIONS.find(a => a.id === result.action)?.label}
            </p>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-3 py-3 max-h-56 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.text}</p>
          </div>
          <div className="flex gap-2 px-3 py-2.5 border-t bg-gray-50">
            <button
              onClick={insertResult}
              className="flex-1 text-xs font-medium py-1.5 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Insert into note
            </button>
            <button
              onClick={copyResult}
              className="flex items-center gap-1 text-xs font-medium py-1.5 px-3 border rounded-lg hover:bg-gray-100 transition text-gray-600"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
