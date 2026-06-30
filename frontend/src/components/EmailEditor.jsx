import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextHOne,
  TextHTwo,
  ListBullets,
  ListNumbers,
  Link as LinkIcon,
} from '@phosphor-icons/react';

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md transition-colors duration-100 ${
        active
          ? 'bg-[#202020] dark:bg-[#edeae4] text-white dark:text-[#141412]'
          : 'text-[#505050] dark:text-[#a8a49f] hover:bg-[rgba(32,32,32,0.07)] dark:hover:bg-[rgba(255,250,240,0.07)] hover:text-[#202020] dark:hover:text-[#edeae4]'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[rgba(32,32,32,0.12)] dark:bg-[rgba(255,250,240,0.10)] mx-0.5" />;
}

export default function EmailEditor({ onChange, initialHtml = '' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({
        placeholder: 'Write your email here. Use {{Name}} and {{Email}} for personalization.',
      }),
    ],
    content: initialHtml,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'true',
      },
    },
  });

  function addLink() {
    const url = window.prompt('Enter URL');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="border border-[rgba(32,32,32,0.12)] dark:border-[rgba(255,250,240,0.10)] rounded-xl overflow-hidden bg-white dark:bg-[#1c1b19]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[rgba(32,32,32,0.08)] dark:border-[rgba(255,250,240,0.07)] bg-[#f3f0e8] dark:bg-[#252320]">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <TextB size={16} weight="bold" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <TextItalic size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <TextUnderline size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <TextHOne size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <TextHTwo size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <ListBullets size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListNumbers size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          title="Add link"
        >
          <LinkIcon size={16} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
