import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Template {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  content: string;
  structure?: string | null; // JSON string
  tenantId?: string | null;
  isGlobal: boolean;
  tags?: string | null; // JSON string
  isNistCompliant: boolean;
  nistFramework?: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateState {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
  
  setTemplates: (templates: Template[]) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (templateId: string, updatedFields: Partial<Template>) => void;
  removeTemplate: (templateId: string) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTemplateState: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    immer((set) => ({
      templates: [],
      selectedTemplate: null,
      isLoading: false,
      error: null,

      setTemplates: (templates) => set((state) => {
        state.templates = templates;
      }),
      addTemplate: (template) => set((state) => {
        state.templates.push(template);
      }),
      updateTemplate: (templateId, updatedFields) => set((state) => {
        const index = state.templates.findIndex(t => t.id === templateId);
        if (index !== -1) {
          state.templates[index] = { ...state.templates[index], ...updatedFields };
        }
        if (state.selectedTemplate?.id === templateId) {
          state.selectedTemplate = { ...state.selectedTemplate, ...updatedFields };
        }
      }),
      removeTemplate: (templateId) => set((state) => {
        state.templates = state.templates.filter(t => t.id !== templateId);
        if (state.selectedTemplate?.id === templateId) {
          state.selectedTemplate = null;
        }
      }),
      setSelectedTemplate: (template) => set((state) => {
        state.selectedTemplate = template;
      }),
      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),
      setError: (error) => set((state) => {
        state.error = error;
      }),
      clearTemplateState: () => set((state) => {
        state.templates = [];
        state.selectedTemplate = null;
        state.isLoading = false;
        state.error = null;
      }),
    })),
    {
      name: 'template-storage',
      partialize: (state) => ({
        selectedTemplate: state.selectedTemplate,
      }),
    }
  )
);

