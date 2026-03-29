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
  console.log('🔧 [Step 1] DOM loaded, starting initialization...');

  // Render sidebar components first
  renderSidebar();
  console.log('🔧 [Step 2] Sidebar rendered');

  // Setup search filter
  const searchInput = document.getElementById('component-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderSidebar(searchInput.value));
    console.log('🔧 [Step 2.1] Search filter attached');
  } else {
    console.warn('⚠️ [Step 2.1] Search input not found');
  }

  // Initialize all core modules
  try { initCanvas(); console.log('🔧 [Step 3] Canvas initialized'); }
  catch(e) { console.error('❌ [Step 3] Canvas init failed:', e); }

  try { initSidebarDrag(); console.log('🔧 [Step 4] Sidebar drag initialized'); }
  catch(e) { console.error('❌ [Step 4] Sidebar drag failed:', e); }

  try { initCanvasSortable(); console.log('🔧 [Step 5] Canvas sortable initialized'); }
  catch(e) { console.error('❌ [Step 5] Canvas sortable failed:', e); }

  try { initDropZone(); console.log('🔧 [Step 6] Drop zone initialized'); }
  catch(e) { console.error('❌ [Step 6] Drop zone failed:', e); }

  try { initPanel(); console.log('🔧 [Step 7] Panel initialized'); }
  catch(e) { console.error('❌ [Step 7] Panel init failed:', e); }

  try { initEditor(); console.log('🔧 [Step 8] Editor initialized'); }
  catch(e) { console.error('❌ [Step 8] Editor init failed:', e); }

  try { initHistory(); console.log('🔧 [Step 9] History initialized'); }
  catch(e) { console.error('❌ [Step 9] History init failed:', e); }

  try { initToolbar(); console.log('🔧 [Step 10] Toolbar initialized'); }
  catch(e) { console.error('❌ [Step 10] Toolbar init failed:', e); }

  console.log('🎨 Visual Editor initialized — all modules loaded');

  // ── Auto-import Go Global page ──────────────────────────
  // Step 4: Import goglobal.html directly
  setTimeout(() => {
    console.log('🔧 [Step 11] Starting auto-import of goglobal.html...');
    fetch('./goglobal.html')
      .then(r => {
        console.log('🔧 [Step 12] Fetch response status:', r.status, r.statusText);
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.text();
      })
      .then(html => {
        console.log('🔧 [Step 13] HTML loaded, length:', html.length, 'chars');
        console.log('🔧 [Step 13.1] First 200 chars:', html.substring(0, 200));
        console.log('🔧 [Step 13.2] Has DOCTYPE:', html.includes('<!DOCTYPE'));
        console.log('🔧 [Step 13.3] Has body:', html.includes('<body'));
        console.log('🔧 [Step 13.4] External scripts:', (html.match(/<script\s+src=/g) || []).length);

        loadImportedHTML(html);
        console.log('✅ [Step 14] Go Global page loaded into iframe');

        // Verify iframe was created
        const canvas = document.getElementById('canvas');
        const iframe = canvas ? canvas.querySelector('iframe.imported-iframe') : null;
        if (iframe) {
          console.log('✅ [Step 15] Iframe created successfully');
          console.log('🔧 [Step 15.1] Iframe srcdoc length:', (iframe.srcdoc || '').length);
          console.log('🔧 [Step 15.2] Iframe dimensions:', iframe.offsetWidth, 'x', iframe.offsetHeight);
        } else {
          console.error('❌ [Step 15] Iframe NOT found in canvas!');
        }
      })
      .catch(e => {
        console.error('❌ [Step 12/13] Import failed:', e);
        // Fallback: try simple-test.html
        console.log('🔧 [Fallback] Trying simple-test.html...');
        fetch('./simple-test.html')
          .then(r => r.text())
          .then(html => {
            loadImportedHTML(html);
            console.log('✅ [Fallback] Simple test loaded');
          })
          .catch(e2 => console.error('❌ [Fallback] Simple test also failed:', e2));
      });
  }, 300);
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
