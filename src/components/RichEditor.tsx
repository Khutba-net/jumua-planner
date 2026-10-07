"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useCallback, useRef } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  fontSize?: number;
  dir?: string;
}

function ToolbarButton({
  active,
  onClick,
  icon,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  icon: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`w-8 h-8 sm:w-7 sm:h-7 grid place-items-center rounded transition-colors shrink-0 ${
        active
          ? "bg-primary/15 text-primary"
          : "text-mute/60 hover:text-ink hover:bg-ink/[0.06]"
      }`}
    >
      <span className="material-symbols-outlined text-[18px] sm:text-[16px]">{icon}</span>
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-line/60 mx-0.5 sm:mx-1 shrink-0 hidden sm:block" />;
}

export default function RichEditor({ content, onChange, placeholder, fontSize = 15, dir }: RichEditorProps) {
  const initialized = useRef(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        dir: dir || "auto",
      },
    },
    onCreate: () => {
      setTimeout(() => { initialized.current = true; }, 100);
    },
    onUpdate: ({ editor }) => {
      if (initialized.current) {
        onChange(editor.getHTML());
      }
    },
  });

  const setAlign = useCallback(
    (align: "left" | "center" | "right") => {
      editor?.chain().focus().setTextAlign(align).run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-1 border-b border-line/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10 overflow-x-auto scrollbar-none">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon="format_bold"
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon="format_italic"
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon="format_underlined"
          title="Underline (Ctrl+U)"
        />
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon="strikethrough_s"
          title="Strikethrough"
        />

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon="title"
          title="Heading"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon="format_h3"
          title="Subheading"
        />

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => setAlign("left")}
          icon="format_align_left"
          title="Align left"
        />
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => setAlign("center")}
          icon="format_align_center"
          title="Align center"
        />
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => setAlign("right")}
          icon="format_align_right"
          title="Align right"
        />

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon="format_list_bulleted"
          title="Bullet list"
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon="format_list_numbered"
          title="Numbered list"
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon="format_quote"
          title="Quote"
        />

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon="horizontal_rule"
          title="Divider"
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 sm:px-8 pb-6 pt-3 max-w-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style>{`
        .rich-editor-content {
          font-size: ${fontSize}px;
          line-height: 2;
          min-height: 300px;
          outline: none;
          unicode-bidi: plaintext;
        }

        /* Word wrapping — works for Arabic, English, any language */
        .ProseMirror,
        .ProseMirror * {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
          max-width: 100%;
        }

        .ProseMirror {
          min-height: 300px;
          width: 100%;
          box-sizing: border-box;
        }

        .ProseMirror:focus {
          outline: none;
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-line, #ccc);
          pointer-events: none;
          height: 0;
        }

        /* RTL placeholder float fix */
        [dir="rtl"] .ProseMirror p.is-editor-empty:first-child::before,
        .ProseMirror[dir="rtl"] p.is-editor-empty:first-child::before {
          float: right;
        }

        /* Typography */
        .ProseMirror h2 {
          font-size: 1.4em;
          font-weight: 700;
          margin: 0.8em 0 0.4em;
          line-height: 1.4;
        }
        .ProseMirror h3 {
          font-size: 1.15em;
          font-weight: 600;
          margin: 0.6em 0 0.3em;
          line-height: 1.4;
        }
        .ProseMirror p {
          margin: 0.3em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-inline-start: 1.5em;
          margin: 0.4em 0;
        }
        .ProseMirror li {
          margin: 0.15em 0;
        }
        .ProseMirror blockquote {
          border-inline-start: 3px solid var(--color-primary, #00666d);
          padding-inline-start: 1em;
          margin: 0.6em 0;
          color: #666;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--color-line, #e5e5e5);
          margin: 1em 0;
        }
        .ProseMirror strong {
          font-weight: 700;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror u {
          text-decoration: underline;
        }

        /* Hide scrollbar on toolbar */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        /* Tiptap wrapper should not overflow */
        .tiptap {
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
