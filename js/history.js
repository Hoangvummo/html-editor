// history.js — Undo/Redo with snapshot-based stack
// Maintains a stack of canvas innerHTML snapshots

import { emit, on } from './state.js';

const MAX_SNAPSHOTS = 50;

let stack = [];
let pointer = -1;
let debounceTimer = null;

export function init() {
  // Listen for changes that should trigger a snapshot
  on('element:dropped', () => push());
  on('element:moved', () => push());
  on('element:deleted', () => push());
  on('property:changed', () => debouncePush());

  // Take initial snapshot
  setTimeout(() => push(), 100);
}

export function push() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const snapshot = canvas.innerHTML;

  // Don't save duplicate snapshots
  if (pointer >= 0 && stack[pointer] === snapshot) return;

  // Truncate forward history if we branched
  if (pointer < stack.length - 1) {
    stack = stack.slice(0, pointer + 1);
  }

  stack.push(snapshot);

  // Enforce max limit
  if (stack.length > MAX_SNAPSHOTS) {
    stack.shift();
  } else {
    pointer++;
  }

  emit('history:push');
}

function debouncePush() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => push(), 500);
}

export function undo() {
  if (!canUndo()) return;

  pointer--;
  restoreSnapshot();
  emit('history:undo');
}

export function redo() {
  if (!canRedo()) return;

  pointer++;
  restoreSnapshot();
  emit('history:redo');
}

function restoreSnapshot() {
  const canvas = document.getElementById('canvas');
  if (!canvas || pointer < 0 || pointer >= stack.length) return;

  canvas.innerHTML = stack[pointer];

  // Clear any editor-selected state after restore
  canvas.querySelectorAll('.editor-selected').forEach(el =>
    el.classList.remove('editor-selected')
  );
}

export function canUndo() {
  return pointer > 0;
}

export function canRedo() {
  return pointer < stack.length - 1;
}

export function getHistoryLength() {
  return stack.length;
}

export function clearHistory() {
  stack = [];
  pointer = -1;
  push(); // Take initial snapshot
}

// ── Keyboard shortcuts ─────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Ctrl+Z → Undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    // Let app.js handle this to avoid double-undo
  }
});
