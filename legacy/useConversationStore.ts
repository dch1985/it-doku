import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: Array<{
      title: string;
      url?: string;
      excerpt: string;
    }>;
    tokensUsed?: number;
    model?: string;
    error?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens?: number;
    documentsReferenced?: string[];
  };
}

interface ConversationState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Current Chat State
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  
  // Message Actions
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  
  // Streaming
  setStreaming: (streaming: boolean) => void;
  appendToLastMessage: (conversationId: string, content: string) => void;
  
  // Utility
  clearConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConversationStore = create<ConversationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        conversations: [],
        activeConversationId: null,
        isStreaming: false,
        isLoading: false,
        error: null,

        // Create new conversation
        createConversation: (title = 'New Chat') => {
          const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set((state) => {
            state.conversations.unshift({
              id,
              title,
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            state.activeConversationId = id;
          });
          return id;
        },

        deleteConversation: (id) =>
          set((state) => {
            state.conversations = state.conversations.filter((conv) => conv.id !== id);
            if (state.activeConversationId === id) {
              state.activeConversationId = 
                state.conversations.length > 0 ? state.conversations[0].id : null;
            }
          }),

        setActiveConversation: (id) =>
          set((state) => {
            state.activeConversationId = id;
          }),

        // Message Actions
        addMessage: (conversationId, message) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              const newMessage: Message = {
                ...message,
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
              };
              conversation.messages.push(newMessage);
              conversation.updatedAt = new Date();
              
              // Auto-generate title from first user message
              if (conversation.messages.length === 1 && message.role === 'user') {
                conversation.title = message.content.slice(0, 50) + 
                  (message.content.length > 50 ? '...' : '');
              }
            }
          }),

        updateMessage: (conversationId, messageId, updates) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              const message = conversation.messages.find((m) => m.id === messageId);
              if (message) {
                Object.assign(message, updates);
                conversation.updatedAt = new Date();
              }
            }
          }),

        deleteMessage: (conversationId, messageId) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              conversation.messages = conversation.messages.filter(
                (m) => m.id !== messageId
              );
              conversation.updatedAt = new Date();
            }
          }),

        // Streaming
        setStreaming: (streaming) =>
          set((state) => {
            state.isStreaming = streaming;
          }),

        appendToLastMessage: (conversationId, content) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation && conversation.messages.length > 0) {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              lastMessage.content += content;
            }
          }),

        // Utility
        clearConversation: (conversationId) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              conversation.messages = [];
              conversation.updatedAt = new Date();
            }
          }),

        renameConversation: (conversationId, title) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === conversationId);
            if (conversation) {
              conversation.title = title;
              conversation.updatedAt = new Date();
            }
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
      })),
      {
        name: 'conversation-storage',
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
        }),
      }
    ),
    { name: 'ConversationStore' }
  )
);

// Selectors
export const selectActiveConversation = (state: ConversationState) =>
  state.conversations.find((c) => c.id === state.activeConversationId);

export const selectConversationMessages = (conversationId: string) => (state: ConversationState) =>
  state.conversations.find((c) => c.id === conversationId)?.messages || [];
