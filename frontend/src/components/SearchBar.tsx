import { useEffect, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { FileText, Settings, Home, Search, Bot, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { searchResults, loading, search } = useGlobalSearch()

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

  useEffect(() => {
    if (open && searchQuery.length > 2) {
      const timer = setTimeout(() => {
        search(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, open, search])

  const pages = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Documents', icon: FileText, href: '/docs' },
    { name: 'Agents', icon: Bot, href: '/agents' },
    { name: 'Infrastructure', icon: Server, href: '/infrastructure' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]

  const handleSearchResultClick = (type: 'document' | 'knowledge', id: string, documentId?: string | null) => {
    setOpen(false)
    if (type === 'document') {
      window.location.hash = `document/${id}`
    } else if (type === 'knowledge' && documentId) {
      window.location.hash = `document/${documentId}`
    }
  }

  return (
    <>
      <Button
        variant='outline'
        className='relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 rounded-xl'
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
        <CommandInput
          placeholder='Search documents or navigate...'
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.length > 2 ? (
            loading ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>Searching...</div>
            ) : searchResults.length > 0 ? (
              <CommandGroup heading='Results'>
                {searchResults.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSearchResultClick(result.type, result.id, result.documentId)}
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    <span>{result.title}</span>
                    <span className='ml-auto text-xs text-muted-foreground'>{result.type}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )
          ) : (
            <CommandGroup heading='Navigation'>
              {pages.map((page) => {
                const Icon = page.icon
                return (
                  <CommandItem
                    key={page.name}
                    onSelect={() => {
                      setOpen(false)
                      window.location.hash = page.href === '/' ? '' : page.href.slice(1)
                    }}
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    <span>{page.name}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
