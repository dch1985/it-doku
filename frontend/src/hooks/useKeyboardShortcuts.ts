/**
 * useKeyboardShortcuts Hook
 * Global Keyboard Shortcuts
 */

import { useHotkeys } from 'react-hotkeys-hook';

interface KeyboardShortcutsConfig {
  onNewDocument?: () => void;
  onSearch?: () => void;
  onToggleDarkMode?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    onNewDocument,
    onSearch,
    onToggleDarkMode,
    onEscape,
  } = config;

  // N = New Document
  useHotkeys('n', (e) => {
    e.preventDefault();
    if (onNewDocument) onNewDocument();
  }, { enableOnFormTags: false });

  // Ctrl+K / Cmd+K = Search
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    if (onSearch) onSearch();
  });

  // Ctrl+D / Cmd+D = Toggle Dark Mode
  useHotkeys('ctrl+d, cmd+d', (e) => {
    e.preventDefault();
    if (onToggleDarkMode) onToggleDarkMode();
  });

  // ESC = Close Modal / Clear
  useHotkeys('esc', (e) => {
    if (onEscape) onEscape();
  });
};

export default useKeyboardShortcuts;
