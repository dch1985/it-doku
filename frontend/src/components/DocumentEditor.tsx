import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import UnderlineExtension from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3,
  Code,
  Code2,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Underline as UnderlineIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createLowlight } from 'lowlight'
// Import common languages individually for better tree-shaking and compatibility
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import java from 'highlight.js/lib/languages/java'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'

// Initialize lowlight with common languages
const lowlight = createLowlight({
  javascript,
  typescript,
  json,
  bash,
  sh: bash, // alias
  sql,
  python,
  html,
  xml: html, // alias
  css,
  java,
  csharp,
  cs: csharp, // alias
  go,
  rust,
})

interface DocumentEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function DocumentEditor({ content, onChange, placeholder = 'Start writing your documentation...' }: DocumentEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        codeBlock: false, // We'll use CodeBlockLowlight instead
        strike: false, // We'll use Strike extension separately
        underline: false, // We'll use UnderlineExtension separately
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-muted p-4 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border px-4 py-2 font-semibold bg-muted',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border px-4 py-2',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      UnderlineExtension,
      Strike,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
  })

  if (!editor) {
    return (
      <div className='border rounded-lg p-6'>
        <div className='text-center text-muted-foreground'>Loading editor...</div>
      </div>
    )
  }

  const MenuButton = ({ 
    onClick, 
    isActive, 
    children, 
    title,
    disabled = false
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
    disabled?: boolean
  }) => (
    <Button
      variant='ghost'
      size='sm'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-accent'
      )}
      title={title}
      type='button'
    >
      {children}
    </Button>
  )

  const handleAddLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run()
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run()
      }
      setLinkUrl('')
      setLinkText('')
      setLinkDialogOpen(false)
    }
  }

  const handleAddImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || 'Image' }).run()
      setImageUrl('')
      setImageAlt('')
      setImageDialogOpen(false)
    }
  }

  const handleAddTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <>
      <div className='border rounded-lg overflow-hidden bg-background'>
        {/* Toolbar */}
        <div className='bg-muted/50 border-b p-2 flex flex-wrap gap-1 items-center'>
          {/* Text Formatting */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title='Bold (Ctrl+B)'
          >
            <Bold className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title='Italic (Ctrl+I)'
          >
            <Italic className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title='Strikethrough'
          >
            <Strikethrough className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title='Underline'
          >
            <UnderlineIcon className='h-4 w-4' />
          </MenuButton>

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* Headings */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title='Heading 1'
          >
            <Heading1 className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title='Heading 2'
          >
            <Heading2 className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title='Heading 3'
          >
            <Heading3 className='h-4 w-4' />
          </MenuButton>

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* Lists */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title='Bullet List'
          >
            <List className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title='Numbered List'
          >
            <ListOrdered className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title='Quote'
          >
            <Quote className='h-4 w-4' />
          </MenuButton>

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* Code */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title='Inline Code'
          >
            <Code className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title='Code Block'
          >
            <Code2 className='h-4 w-4' />
          </MenuButton>

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* Links & Media */}
          <MenuButton
            onClick={() => {
              const currentLink = editor.getAttributes('link')
              if (currentLink.href) {
                setLinkUrl(currentLink.href)
                setLinkText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))
              }
              setLinkDialogOpen(true)
            }}
            isActive={editor.isActive('link')}
            title='Add Link'
          >
            <LinkIcon className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => setImageDialogOpen(true)}
            title='Insert Image'
          >
            <ImageIcon className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={handleAddTable}
            title='Insert Table'
          >
            <TableIcon className='h-4 w-4' />
          </MenuButton>

          {editor.isActive('table') && (
            <>
              <Separator orientation='vertical' className='h-6 mx-1' />
              <MenuButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title='Delete Table'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title='Add Column Before'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title='Add Column After'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title='Delete Column'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title='Add Row Before'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title='Add Row After'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                title='Delete Row'
              >
                <TableIcon className='h-4 w-4' />
              </MenuButton>
            </>
          )}

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* Undo/Redo */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title='Undo (Ctrl+Z)'
          >
            <Undo className='h-4 w-4' />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title='Redo (Ctrl+Y)'
          >
            <Redo className='h-4 w-4' />
          </MenuButton>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} className='bg-background' />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Enter the URL and optional link text
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='link-url'>URL</Label>
              <Input
                id='link-url'
                type='url'
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder='https://example.com'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLink()
                  }
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='link-text'>Link Text (optional)</Label>
              <Input
                id='link-text'
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder='Click here'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink} disabled={!linkUrl}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Enter the image URL or upload an image
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='image-url'>Image URL</Label>
              <Input
                id='image-url'
                type='url'
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder='https://example.com/image.png'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddImage()
                  }
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='image-alt'>Alt Text (optional)</Label>
              <Input
                id='image-alt'
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder='Image description'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddImage()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddImage} disabled={!imageUrl}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
