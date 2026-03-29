// app.js — Bootstrap & Entry Point
// Initializes all modules and wires toolbar event listeners

import { init as initCanvas } from './canvas.js';
import { initSidebarDrag, initCanvasSortable, initDropZone } from './drag.js';
import { init as initPanel } from './panel.js';
import { init as initEditor } from './editor.js';
import { init as initHistory, undo, redo, canUndo, canRedo } from './history.js';
import { togglePreview, setResponsive } from './preview.js';
import { exportHTML, importHTML, copyToClipboard, loadImportedHTML } from './exporter.js';
import { on } from './state.js';
import { renderSidebar } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
  // Render sidebar components first
  renderSidebar();

  // Setup search filter
  const searchInput = document.getElementById('component-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderSidebar(searchInput.value));
  }

  // Initialize all core modules
  initCanvas();
  initSidebarDrag();
  initCanvasSortable();
  initDropZone();
  initPanel();
  initEditor();
  initHistory();
  initToolbar();

  console.log('🎨 Visual Editor initialized');

  // ── Auto-import test page ─────────────────────────────────
  setTimeout(() => {
    fetch('./test.html')
      .then(r => r.text())
      .then(html => { loadImportedHTML(html); console.log('✅ Test page loaded'); })
      .catch(e => console.warn('Import failed:', e));
  }, 500);
});

function initToolbar() {
  // ── Undo / Redo ──────────────────────────────────────────
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');

  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      undo();
      updateUndoRedoState();
    });
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      redo();
      updateUndoRedoState();
    });
  }

  // ── Preview toggle ───────────────────────────────────────
  const previewBtn = document.getElementById('btn-preview');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      togglePreview();
    });
  }

  // ── Responsive buttons ───────────────────────────────────
  const desktopBtn = document.getElementById('btn-desktop') ||
                     document.querySelector('[data-responsive="desktop"]');
  const tabletBtn = document.getElementById('btn-tablet') ||
                    document.querySelector('[data-responsive="tablet"]');
  const mobileBtn = document.getElementById('btn-mobile') ||
                    document.querySelector('[data-responsive="mobile"]');

  if (desktopBtn) {
    desktopBtn.addEventListener('click', () => setResponsive('desktop'));
  }
  if (tabletBtn) {
    tabletBtn.addEventListener('click', () => setResponsive('tablet'));
  }
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => setResponsive('mobile'));
  }

  // ── Export / Import ──────────────────────────────────────
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportHTML());
  }

  const importBtn = document.getElementById('btn-import');
  if (importBtn) {
    importBtn.addEventListener('click', () => importHTML());
  }

  // ── Copy to clipboard ────────────────────────────────────
  const copyBtn = document.getElementById('btn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyToClipboard());
  }

  // ── Keyboard shortcuts ───────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Ctrl+Z → Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      updateUndoRedoState();
    }

    // Ctrl+Y or Ctrl+Shift+Z → Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
      updateUndoRedoState();
    }

    // Ctrl+E → Toggle preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      togglePreview();
    }

    // Ctrl+S → Export
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      exportHTML();
    }

    // Ctrl+D → Duplicate (handled in panel.js via event)
  });

  // ── Listen to state changes to update undo/redo ──────────
  on('history:push', updateUndoRedoState);
  on('history:undo', updateUndoRedoState);
  on('history:redo', updateUndoRedoState);

  // Initial state update
  updateUndoRedoState();

  // Set initial responsive mode
  setResponsive('desktop');
}

function updateUndoRedoState() {
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');

  if (undoBtn) {
    undoBtn.disabled = !canUndo();
    undoBtn.classList.toggle('disabled', !canUndo());
  }

  if (redoBtn) {
    redoBtn.disabled = !canRedo();
    redoBtn.classList.toggle('disabled', !canRedo());
  }
}
