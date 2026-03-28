// editor.js — Inline text editing
// Double-click to enable contenteditable, blur/escape to save

import { emit, getSelected } from './state.js';

let currentEditingEl = null;

export function init() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Double-click to start editing
  canvas.addEventListener('dblclick', handleDoubleClick);

  // Global escape to stop editing
  document.addEventListener('keydown', handleKeyDown);
}

function handleDoubleClick(e) {
  const target = e.target;

  // Only allow editing on text-containing elements
  if (!isEditableElement(target)) return;

  // If already editing another element, save it first
  if (currentEditingEl && currentEditingEl !== target) {
    stopEditing(currentEditingEl);
  }

  startEditing(target);
  e.stopPropagation();
}

function startEditing(el) {
  currentEditingEl = el;
  el.setAttribute('contenteditable', 'true');
  el.classList.add('editor-editing');
  el.focus();

  // Select all text for easy replacement
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // Prevent canvas click handler from selecting/deselecting
  el.addEventListener('blur', handleBlur, { once: false });
  el.addEventListener('input', handleInput);
}

function stopEditing(el) {
  if (!el) return;

  el.removeAttribute('contenteditable');
  el.classList.remove('editor-editing');
  el.removeEventListener('blur', handleBlur);
  el.removeEventListener('input', handleInput);

  currentEditingEl = null;
  emit('history:push');
}

function handleBlur(e) {
  // Small delay to allow clicking toolbar buttons etc.
  setTimeout(() => {
    if (currentEditingEl && !currentEditingEl.contains(document.activeElement)) {
      stopEditing(currentEditingEl);
    }
  }, 200);
}

function handleInput() {
  // Content changed, will be saved on blur
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && currentEditingEl) {
    e.preventDefault();
    currentEditingEl.blur();
    stopEditing(currentEditingEl);
  }
}

function isEditableElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

  // Skip non-text elements
  const tag = el.tagName.toLowerCase();
  const skipTags = ['img', 'video', 'iframe', 'svg', 'canvas', 'input', 'textarea', 'select', 'button', 'hr', 'br'];
  if (skipTags.includes(tag)) return false;

  // Skip drag handles and editor UI
  if (el.classList.contains('drag-handle') ||
      el.classList.contains('canvas-empty-state') ||
      el.classList.contains('drop-indicator')) {
    return false;
  }

  return true;
}

export function isEditing() {
  return currentEditingEl !== null;
}

export function stopAllEditing() {
  if (currentEditingEl) {
    stopEditing(currentEditingEl);
  }
}
