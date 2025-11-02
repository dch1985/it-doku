import { useEffect, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { FileText, MessageSquare, Settings, Home, BarChart3, Search, Server, Lock, Radio, Globe, Video, FileSignature } from 'lucide-react'
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
      }, 300) // Debounce search
      return () => clearTimeout(timer)
    }
  }, [searchQuery, open])

  const pages = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Documentation', icon: FileText, href: '/docs' },
    { name: 'Passwords', icon: Lock, href: '/passwords' },
    { name: 'Assets', icon: Server, href: '/assets' },
    { name: 'Contracts', icon: FileSignature, href: '/contracts' },
    { name: 'Network Devices', icon: Radio, href: '/network-devices' },
    { name: 'Customer Portals', icon: Globe, href: '/customer-portals' },
    { name: 'Process Recordings', icon: Video, href: '/process-recordings' },
    { name: 'AI Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]

  const handleSearchResultClick = (type: string, id: string) => {
    setOpen(false)
    // Navigate to the item based on type
    const hrefs: Record<string, string> = {
      document: '/document',
      asset: '/asset',
      password: '/password',
      contract: '/contract',
      networkDevice: '/network-device',
    }
    const baseHref = hrefs[type] || '#'
    window.location.hash = `${baseHref}/${id}`
  }

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
        <CommandInput 
          placeholder='Type a command or search...' 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.length > 2 ? (
            // Show search results
            loading ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                Searching...
              </div>
            ) : searchResults && searchResults.total > 0 ? (
              <>
                {searchResults.documents.length > 0 && (
                  <CommandGroup heading={`Documents (${searchResults.documents.length})`}>
                    {searchResults.documents.map((doc) => (
                      <CommandItem
                        key={doc.id}
                        onSelect={() => handleSearchResultClick('document', doc.id)}
                      >
                        <FileText className='mr-2 h-4 w-4' />
                        <span>{doc.title}</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{doc.category}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchResults.assets.length > 0 && (
                  <CommandGroup heading={`Assets (${searchResults.assets.length})`}>
                    {searchResults.assets.map((asset) => (
                      <CommandItem
                        key={asset.id}
                        onSelect={() => handleSearchResultClick('asset', asset.id)}
                      >
                        <Server className='mr-2 h-4 w-4' />
                        <span>{asset.name}</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{asset.type}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchResults.passwords.length > 0 && (
                  <CommandGroup heading={`Passwords (${searchResults.passwords.length})`}>
                    {searchResults.passwords.map((password) => (
                      <CommandItem
                        key={password.id}
                        onSelect={() => handleSearchResultClick('password', password.id)}
                      >
                        <Lock className='mr-2 h-4 w-4' />
                        <span>{password.name}</span>
                        {password.username && (
                          <span className='ml-auto text-xs text-muted-foreground'>{password.username}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchResults.contracts.length > 0 && (
                  <CommandGroup heading={`Contracts (${searchResults.contracts.length})`}>
                    {searchResults.contracts.map((contract) => (
                      <CommandItem
                        key={contract.id}
                        onSelect={() => handleSearchResultClick('contract', contract.id)}
                      >
                        <FileSignature className='mr-2 h-4 w-4' />
                        <span>{contract.name}</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{contract.vendor}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchResults.networkDevices.length > 0 && (
                  <CommandGroup heading={`Network Devices (${searchResults.networkDevices.length})`}>
                    {searchResults.networkDevices.map((device) => (
                      <CommandItem
                        key={device.id}
                        onSelect={() => handleSearchResultClick('networkDevice', device.id)}
                      >
                        <Radio className='mr-2 h-4 w-4' />
                        <span>{device.name}</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{device.ipAddress}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )
          ) : (
            // Show default navigation
            <>
              <CommandGroup heading='Pages'>
                {pages.map((page) => (
                  <CommandItem
                    key={page.href}
                    onSelect={() => {
                      setOpen(false)
                      window.location.hash = page.href === '/' ? '' : page.href.slice(1)
                    }}
                  >
                    <page.icon className='mr-2 h-4 w-4' />
                    <span>{page.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}