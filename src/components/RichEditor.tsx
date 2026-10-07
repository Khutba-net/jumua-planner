"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useCallback } from "react";

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
      className={`w-7 h-7 grid place-items-center rounded transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-mute/60 hover:text-ink hover:bg-ink/[0.06]"
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
  );
}

export default function RichEditor({ content, onChange, placeholder, fontSize = 15, dir }: RichEditorProps) {
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
        class: "outline-none min-h-[300px] prose prose-sm max-w-none",
        dir: dir || "auto",
        style: `font-size: ${fontSize}px; line-height: 2.2;`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const setAlign = useCallback(
    (align: "left" | "center" | "right") => {
      editor?.chain().focus().setTextAlign(align).run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-1 py-1 border-b border-line/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex-wrap">
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

        <div className="w-px h-4 bg-line/60 mx-1" />

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

        <div className="w-px h-4 bg-line/60 mx-1" />

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

        <div className="w-px h-4 bg-line/60 mx-1" />

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

        <div className="w-px h-4 bg-line/60 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon="horizontal_rule"
          title="Divider"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pb-6 pt-2">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-line, #ccc);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { min-height: 300px; }
        .ProseMirror h2 { font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .ProseMirror h3 { font-size: 1.15em; font-weight: 600; margin: 0.6em 0 0.3em; }
        .ProseMirror p { margin: 0.3em 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0.4em 0; }
        .ProseMirror blockquote {
          border-left: 3px solid var(--color-primary, #00666d);
          padding-left: 1em;
          margin: 0.6em 0;
          color: #666;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--color-line, #e5e5e5);
          margin: 1em 0;
        }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  );
}
