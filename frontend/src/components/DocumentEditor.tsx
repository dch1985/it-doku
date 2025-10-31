import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Heading1, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function DocumentEditor({ content, onChange, placeholder = 'Start writing your documentation...' }: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
  StarterKit.configure({
    link: false,
  }),
  Placeholder.configure({
    placeholder,
  }),
  Link.configure({
    openOnClick: false,
  }),
],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  if (!editor) {
    return null
  }

  const MenuButton = ({ 
    onClick, 
    isActive, 
    children, 
    title 
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <Button
      variant='ghost'
      size='sm'
      onClick={onClick}
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

  return (
    <div className='border rounded-lg overflow-hidden'>
      <div className='bg-muted/50 border-b p-2 flex flex-wrap gap-1'>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title='Bold'
        >
          <Bold className='h-4 w-4' />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title='Italic'
        >
          <Italic className='h-4 w-4' />
        </MenuButton>

        <div className='w-px h-8 bg-border' />

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

        <div className='w-px h-8 bg-border' />

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

        <div className='w-px h-8 bg-border' />

        <MenuButton
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          isActive={editor.isActive('link')}
          title='Add Link'
        >
          <LinkIcon className='h-4 w-4' />
        </MenuButton>

        <div className='w-px h-8 bg-border' />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title='Undo'
        >
          <Undo className='h-4 w-4' />
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title='Redo'
        >
          <Redo className='h-4 w-4' />
        </MenuButton>
      </div>

      <EditorContent editor={editor} className='bg-background' />
    </div>
  )
}