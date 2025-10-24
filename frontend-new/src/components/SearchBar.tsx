import { useEffect, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { FileText, MessageSquare, Settings, Home, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchBar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const pages = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Documentation', icon: FileText, href: '/docs' },
    { name: 'AI Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]

  const recentDocuments = [
    { name: 'Server Configuration Guide', category: 'Infrastructure' },
    { name: 'Network Topology', category: 'Network' },
    { name: 'Backup Strategy', category: 'Operations' },
    { name: 'Security Policy', category: 'Security' },
  ]

  return (
    <>
      <Button
        variant='outline'
        className='relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64'
        onClick={() => setOpen(true)}
      >
        <Search className='mr-2 h-4 w-4' />
        <span className='hidden lg:inline-flex'>Search documentation...</span>
        <span className='inline-flex lg:hidden'>Search...</span>
        <kbd className='pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Type a command or search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading='Pages'>
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => {
                  setOpen(false)
                  // Navigation würde hier passieren
                  console.log(`Navigate to ${page.href}`)
                }}
              >
                <page.icon className='mr-2 h-4 w-4' />
                <span>{page.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading='Recent Documents'>
            {recentDocuments.map((doc) => (
              <CommandItem
                key={doc.name}
                onSelect={() => {
                  setOpen(false)
                  console.log(`Open document: ${doc.name}`)
                }}
              >
                <FileText className='mr-2 h-4 w-4' />
                <span>{doc.name}</span>
                <span className='ml-auto text-xs text-muted-foreground'>{doc.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}