// preview.js — Preview mode + responsive viewport
// Toggle between edit/preview, set responsive viewport widths

import { state, emit, on } from './state.js';

let canvasWrapper;

export function init() {
  canvasWrapper = document.getElementById('canvas-wrapper') ||
                  document.getElementById('canvas')?.parentElement;
}

export function togglePreview() {
  state.isPreview = !state.isPreview;

  const body = document.body;
  const canvas = document.getElementById('canvas');
  const sidebar = document.getElementById('sidebar');
  const panel = document.getElementById('panel');
  const toolbar = document.getElementById('toolbar');

  if (state.isPreview) {
    // ── Enter preview mode ──────────────────────────────
    body.classList.add('preview-mode');

    // Hide sidebar and panel
    if (sidebar) sidebar.style.display = 'none';
    if (panel) panel.style.display = 'none';

    // Make canvas full-width
    if (canvas) {
      canvas.style.maxWidth = '100%';
      canvas.style.margin = '0';
    }

    // Hide drag handles, outlines, selection
    document.querySelectorAll('.drag-handle').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.editor-selected').forEach(el => {
      el.classList.remove('editor-selected');
    });

    // Update preview button
    updateToolbarButton('preview', true);
  } else {
    // ── Exit preview mode ───────────────────────────────
    body.classList.remove('preview-mode');

    // Restore sidebar and panel
    if (sidebar) sidebar.style.display = '';
    if (panel) panel.style.display = '';

    // Restore canvas width based on responsive mode
    applyResponsiveMode(state.responsiveMode || 'desktop');

    // Show drag handles again
    document.querySelectorAll('.drag-handle').forEach(el => {
      el.style.display = '';
    });

    // Update preview button
    updateToolbarButton('preview', false);
  }

  emit('preview:toggle', { isPreview: state.isPreview });
}

export function setResponsive(mode) {
  state.responsiveMode = mode;

  if (state.isPreview) {
    // If in preview, apply immediately
    applyResponsiveMode(mode);
  } else {
    applyResponsiveMode(mode);
  }

  // Update toolbar button states
  updateResponsiveButtons(mode);

  emit('responsive:change', { mode });
}

function applyResponsiveMode(mode) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Remove all responsive classes
  canvas.classList.remove('responsive-desktop', 'responsive-tablet', 'responsive-mobile');
  canvas.removeAttribute('data-responsive');

  // Apply transition
  canvas.style.transition = 'max-width 0.3s ease, margin 0.3s ease';

  switch (mode) {
    case 'tablet':
      canvas.classList.add('responsive-tablet');
      canvas.setAttribute('data-responsive', 'tablet');
      canvas.style.maxWidth = '768px';
      canvas.style.margin = '0 auto';
      break;

    case 'mobile':
      canvas.classList.add('responsive-mobile');
      canvas.setAttribute('data-responsive', 'mobile');
      canvas.style.maxWidth = '375px';
      canvas.style.margin = '0 auto';
      break;

    case 'desktop':
    default:
      canvas.classList.add('responsive-desktop');
      canvas.setAttribute('data-responsive', 'desktop');
      canvas.style.maxWidth = '100%';
      canvas.style.margin = '0';
      break;
  }

  // Remove transition after animation completes
  setTimeout(() => {
    canvas.style.transition = '';
  }, 350);
}

function updateResponsiveButtons(activeMode) {
  const modes = ['desktop', 'tablet', 'mobile'];

  modes.forEach(mode => {
    const btn = document.querySelector(`[data-responsive="${mode}"]`) ||
                document.getElementById(`btn-${mode}`);
    if (btn) {
      if (mode === activeMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

function updateToolbarButton(id, active) {
  const btn = document.getElementById(`btn-${id}`) ||
              document.querySelector(`[data-action="${id}"]`);
  if (btn) {
    if (active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

// ── Export for toolbar use ─────────────────────────────────
export function isPreview() {
  return state.isPreview;
}

export function getResponsiveMode() {
  return state.responsiveMode || 'desktop';
}
