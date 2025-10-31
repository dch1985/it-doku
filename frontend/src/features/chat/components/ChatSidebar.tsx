import { useEffect, useRef } from 'react'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useChatContext } from '@/contexts/ChatContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  const { isChatOpen, toggleChat } = useSidebarStore()
  const { messages, input, isLoading, setInput, sendMessage } = useChatContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  return (
    <>
      <Button
        onClick={toggleChat}
        className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50'
        size='icon'
        title='AI Chat öffnen'
      >
        <MessageCircle className='h-6 w-6' />
        {messages.length > 0 && (
          <span className='absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full' />
        )}
      </Button>

      <div
        className={cn(
          'fixed inset-y-0 right-0 w-96 bg-card border-l shadow-2xl z-50 flex flex-col transition-transform duration-200',
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className='flex items-center justify-between p-4 border-b'>
          <h3 className='text-lg font-semibold'>IT-Doku Assistent</h3>
          <Button variant='ghost' size='icon' onClick={toggleChat}>
            <X className='h-5 w-5' />
          </Button>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.length === 0 && (
            <div className='text-center text-muted-foreground mt-8 space-y-2'>
              <p className='text-2xl'>👋</p>
              <p>Hallo!</p>
              <p className='text-sm'>Ich bin dein IT-Dokumentations-Assistent.</p>
              <p className='text-sm'>Wie kann ich dir helfen?</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <Card
                className={cn(
                  'max-w-[80%] p-3',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
                <span className='text-xs opacity-70 mt-1 block'>
                  {new Date(msg.timestamp).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className='flex justify-start'>
              <Card className='bg-muted p-3'>
                <div className='flex space-x-2'>
                  <div className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce' />
                  <div className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]' />
                  <div className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]' />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className='p-4 border-t'>
          <div className='flex gap-2'>
            <Input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Nachricht eingeben...'
              disabled={isLoading}
              className='flex-1'
            />
            <Button type='submit' disabled={isLoading || !input.trim()} size='icon'>
              {isLoading ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <Send className='h-5 w-5' />
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}