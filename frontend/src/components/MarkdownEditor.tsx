/**
 * MarkdownEditor Component
 * Markdown Editor mit Live-Preview
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Markdown eingeben...',
  height = 400,
  disabled = false,
}) => {
  const handleChange = (val?: string) => {
    onChange(val || '');
  };

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview="live"
        hideToolbar={false}
        enableScroll={true}
        textareaProps={{
          placeholder: placeholder,
          disabled: disabled,
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
      <div className="mt-2 text-xs text-gray-500">
        💡 Tipp: Nutze Markdown-Syntax für Formatierung. 
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 ml-1"
        >
          Markdown Cheatsheet
        </a>
      </div>
    </div>
  );
};

export default MarkdownEditor;
