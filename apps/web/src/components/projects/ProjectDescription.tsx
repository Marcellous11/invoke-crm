'use client'

import { useState, useTransition, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { updateProjectDescriptionAction } from '@/app/actions/projects'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered,
  Heading2, Heading3, Link2, Code, Quote, Minus,
} from 'lucide-react'

interface ProjectDescriptionProps {
  projectId: string
  initialDescription: string | null
}

function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function ProjectDescription({ projectId, initialDescription }: ProjectDescriptionProps) {
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Add a description...' }),
    ],
    content: initialDescription ?? '',
    editable: editing,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
      },
    },
  })

  const save = useCallback(() => {
    if (!editor) return
    setEditing(false)
    editor.setEditable(false)
    const html = editor.isEmpty ? '' : editor.getHTML()
    startTransition(async () => { await updateProjectDescriptionAction(projectId, html) })
  }, [editor, projectId])

  const cancel = useCallback(() => {
    if (!editor) return
    setEditing(false)
    editor.setEditable(false)
    editor.commands.setContent(initialDescription ?? '')
  }, [editor, initialDescription])

  function startEditing() {
    setEditing(true)
    editor?.setEditable(true)
    setTimeout(() => editor?.commands.focus('end'), 0)
  }

  const isEmpty = !initialDescription || initialDescription === '' || initialDescription === '<p></p>'

  if (!editing) {
    return (
      <div
        onClick={startEditing}
        className="mt-2 cursor-text rounded-md px-1 -mx-1 py-1 hover:bg-muted/40 transition-colors group max-w-2xl"
      >
        {isEmpty ? (
          <p className="text-sm text-muted-foreground/40 italic">Add a description...</p>
        ) : (
          <div
            className="prose prose-sm max-w-none text-muted-foreground [&_p]:my-0.5 [&_h2]:text-base [&_h3]:text-sm [&_ul]:my-1 [&_ol]:my-1"
            dangerouslySetInnerHTML={{ __html: initialDescription! }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 max-w-2xl border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={cancel}
            className="px-2.5 py-1 text-xs rounded text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="px-2.5 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      <p className="text-xs text-muted-foreground px-3 pb-2">⌘B bold · ⌘I italic · ⌘⇧U underline</p>
    </div>
  )
}
