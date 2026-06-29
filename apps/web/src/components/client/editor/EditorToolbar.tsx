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
  const chain = () => editor.chain().focus() as any;

  const setLink = () => {
    const prev = editor.getAttributes('link').href ?? '';
    const url  = window.prompt('URL', prev);
    if (url === null) return;
    if (!url) { chain().unsetLink().run(); return; }
    chain().setLink({ href: url, target: '_blank' }).run();
  };

  const sz = 'w-4 h-4';

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b bg-gray-50 select-none">
      {/* Undo / Redo */}
      <Btn title="Undo" onClick={() => chain().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className={sz} />
      </Btn>
      <Btn title="Redo" onClick={() => chain().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className={sz} />
      </Btn>

      <Sep />

      {/* Headings */}
      <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 className={sz} />
      </Btn>
      <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className={sz} />
      </Btn>
      <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className={sz} />
      </Btn>

      <Sep />

      {/* Inline marks */}
      <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')}
        onClick={() => chain().toggleBold().run()}>
        <Bold className={sz} />
      </Btn>
      <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')}
        onClick={() => chain().toggleItalic().run()}>
        <Italic className={sz} />
      </Btn>
      <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')}
        onClick={() => chain().toggleUnderline().run()}>
        <Underline className={sz} />
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive('strike')}
        onClick={() => chain().toggleStrike().run()}>
        <Strikethrough className={sz} />
      </Btn>
      <Btn title="Inline code" active={editor.isActive('code')}
        onClick={() => chain().toggleCode().run()}>
        <Code className={sz} />
      </Btn>
      <Btn title="Highlight" active={editor.isActive('highlight')}
        onClick={() => chain().toggleHighlight().run()}>
        <Highlighter className={sz} />
      </Btn>
      <Btn title="Link" active={editor.isActive('link')} onClick={setLink}>
        <Link className={sz} />
      </Btn>

      <Sep />

      {/* Alignment */}
      <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })}
        onClick={() => chain().setTextAlign('left').run()}>
        <AlignLeft className={sz} />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })}
        onClick={() => chain().setTextAlign('center').run()}>
        <AlignCenter className={sz} />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })}
        onClick={() => chain().setTextAlign('right').run()}>
        <AlignRight className={sz} />
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn title="Bullet list" active={editor.isActive('bulletList')}
        onClick={() => chain().toggleBulletList().run()}>
        <List className={sz} />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive('orderedList')}
        onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className={sz} />
      </Btn>
      <Btn title="Task list" active={editor.isActive('taskList')}
        onClick={() => chain().toggleTaskList().run()}>
        <CheckSquare className={sz} />
      </Btn>

      <Sep />

      {/* Blocks */}
      <Btn title="Blockquote" active={editor.isActive('blockquote')}
        onClick={() => chain().toggleBlockquote().run()}>
        <Quote className={sz} />
      </Btn>
      <Btn title="Code block" active={editor.isActive('codeBlock')}
        onClick={() => chain().toggleCodeBlock().run()}>
        <Code2 className={sz} />
      </Btn>
      <Btn title="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus className={sz} />
      </Btn>
    </div>
  );
}
