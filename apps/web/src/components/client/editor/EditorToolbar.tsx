'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2,
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  Quote, Link, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Minus,
} from 'lucide-react';

interface Props { editor: Editor }

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />;
}

export function EditorToolbar({ editor }: Props) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href ?? '';
    const url  = window.prompt('URL', prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
  };

  const sz = 'w-4 h-4';

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b bg-gray-50 select-none">
      {/* Undo / Redo */}
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className={sz} />
      </Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className={sz} />
      </Btn>

      <Sep />

      {/* Headings */}
      <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className={sz} />
      </Btn>
      <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className={sz} />
      </Btn>
      <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className={sz} />
      </Btn>

      <Sep />

      {/* Inline marks */}
      <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className={sz} />
      </Btn>
      <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className={sz} />
      </Btn>
      <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className={sz} />
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className={sz} />
      </Btn>
      <Btn title="Inline code" active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className={sz} />
      </Btn>
      <Btn title="Highlight" active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <Highlighter className={sz} />
      </Btn>
      <Btn title="Link" active={editor.isActive('link')} onClick={setLink}>
        <Link className={sz} />
      </Btn>

      <Sep />

      {/* Alignment */}
      <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className={sz} />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className={sz} />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className={sz} />
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn title="Bullet list" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className={sz} />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className={sz} />
      </Btn>
      <Btn title="Task list" active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className={sz} />
      </Btn>

      <Sep />

      {/* Blocks */}
      <Btn title="Blockquote" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className={sz} />
      </Btn>
      <Btn title="Code block" active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className={sz} />
      </Btn>
      <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className={sz} />
      </Btn>
    </div>
  );
}
