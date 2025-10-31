import { describe, it, expect, beforeEach } from 'vitest'
import { useConversationStore } from '@/stores/useConversationStore'

describe('useConversationStore', () => {
  beforeEach(() => {
    // Reset store
    useConversationStore.setState({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,
      isLoading: false,
      error: null,
    })
  })

  describe('Conversation Management', () => {
    it('should create a new conversation', () => {
      const { createConversation } = useConversationStore.getState()
      
      const id = createConversation('Test Chat')
      
      const { conversations, activeConversationId } = useConversationStore.getState()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].title).toBe('Test Chat')
      expect(conversations[0].messages).toEqual([])
      expect(activeConversationId).toBe(id)
    })

    it('should delete a conversation', () => {
      const { createConversation, deleteConversation } = useConversationStore.getState()
      
      const id1 = createConversation('Chat 1')
      const id2 = createConversation('Chat 2')
      
      expect(useConversationStore.getState().conversations).toHaveLength(2)
      
      deleteConversation(id1)
      
      const { conversations } = useConversationStore.getState()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].id).toBe(id2)
    })

    it('should set active conversation to null after deleting active one', () => {
      const { createConversation, deleteConversation } = useConversationStore.getState()
      
      const id1 = createConversation('Chat 1')
      const id2 = createConversation('Chat 2')
      
      deleteConversation(id2) // Delete active conversation
      
      const { activeConversationId, conversations } = useConversationStore.getState()
      expect(activeConversationId).toBe(id1) // Should fallback to first conversation
    })

    it('should rename a conversation', () => {
      const { createConversation, renameConversation } = useConversationStore.getState()
      
      const id = createConversation('Original Title')
      renameConversation(id, 'New Title')
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].title).toBe('New Title')
    })

    it('should clear conversation messages', () => {
      const { createConversation, addMessage, clearConversation } = useConversationStore.getState()
      
      const id = createConversation('Test')
      addMessage(id, { role: 'user', content: 'Hello' })
      addMessage(id, { role: 'assistant', content: 'Hi!' })
      
      expect(useConversationStore.getState().conversations[0].messages).toHaveLength(2)
      
      clearConversation(id)
      
      expect(useConversationStore.getState().conversations[0].messages).toHaveLength(0)
    })
  })

  describe('Message Management', () => {
    it('should add a message to conversation', () => {
      const { createConversation, addMessage } = useConversationStore.getState()
      
      const id = createConversation('Test')
      addMessage(id, { role: 'user', content: 'Hello' })
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].messages).toHaveLength(1)
      expect(conversations[0].messages[0].content).toBe('Hello')
      expect(conversations[0].messages[0].role).toBe('user')
    })

    it('should auto-generate title from first user message', () => {
      const { createConversation, addMessage } = useConversationStore.getState()
      
      const id = createConversation()
      addMessage(id, { 
        role: 'user', 
        content: 'This is a very long message that should be truncated in the title' 
      })
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].title).toContain('This is a very long message')
    })

    it('should update a message', () => {
      const { createConversation, addMessage, updateMessage } = useConversationStore.getState()
      
      const convId = createConversation('Test')
      addMessage(convId, { role: 'user', content: 'Original' })
      
      const messageId = useConversationStore.getState().conversations[0].messages[0].id
      
      updateMessage(convId, messageId, { content: 'Updated' })
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].messages[0].content).toBe('Updated')
    })

    it('should delete a message', () => {
      const { createConversation, addMessage, deleteMessage } = useConversationStore.getState()
      
      const convId = createConversation('Test')
      addMessage(convId, { role: 'user', content: 'Message 1' })
      addMessage(convId, { role: 'assistant', content: 'Message 2' })
      
      expect(useConversationStore.getState().conversations[0].messages).toHaveLength(2)
      
      const messageId = useConversationStore.getState().conversations[0].messages[0].id
      deleteMessage(convId, messageId)
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].messages).toHaveLength(1)
      expect(conversations[0].messages[0].content).toBe('Message 2')
    })
  })

  describe('Streaming', () => {
    it('should set streaming state', () => {
      const { setStreaming } = useConversationStore.getState()
      
      setStreaming(true)
      expect(useConversationStore.getState().isStreaming).toBe(true)
      
      setStreaming(false)
      expect(useConversationStore.getState().isStreaming).toBe(false)
    })

    it('should append content to last message', () => {
      const { createConversation, addMessage, appendToLastMessage } = useConversationStore.getState()
      
      const id = createConversation('Test')
      addMessage(id, { role: 'assistant', content: 'Hello' })
      
      appendToLastMessage(id, ' world')
      appendToLastMessage(id, '!')
      
      const { conversations } = useConversationStore.getState()
      expect(conversations[0].messages[0].content).toBe('Hello world!')
    })
  })

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useConversationStore.getState()
      
      setLoading(true)
      expect(useConversationStore.getState().isLoading).toBe(true)
      
      setLoading(false)
      expect(useConversationStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = useConversationStore.getState()
      
      setError('Test error')
      expect(useConversationStore.getState().error).toBe('Test error')
      
      setError(null)
      expect(useConversationStore.getState().error).toBeNull()
    })
  })
})
