// state.js — Central state management + event bus
// Single source of truth for editor state

export const state = {
  selectedElement: null,
  history: [],
  historyIndex: -1,
  isPreview: false,
  responsiveMode: 'desktop'
};

// ── Event bus ──────────────────────────────────────────────
const listeners = {};

export function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

export function off(event, fn) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(f => f !== fn);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(fn => {
    try {
      fn(data);
    } catch (err) {
      console.error(`Event handler error [${event}]:`, err);
    }
  });
}

// ── Selection ──────────────────────────────────────────────
export function selectElement(el) {
  // Deselect previous
  if (state.selectedElement && state.selectedElement !== el) {
    state.selectedElement.classList.remove('editor-selected');
  }

  state.selectedElement = el;
  el.classList.add('editor-selected');
  emit('element:selected', el);
}

export function deselect() {
  if (state.selectedElement) {
    state.selectedElement.classList.remove('editor-selected');
    state.selectedElement = null;
    emit('element:deselected');
  }
}

export function getSelected() {
  return state.selectedElement;
}
