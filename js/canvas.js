// canvas.js — Canvas/drop zone logic
// Handles element rendering, click-to-select, drop insertion, empty state

import { state, on, emit, selectElement, deselect } from './state.js';
import { getComponent } from './components.js';

let canvas;

export function init() {
  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('Canvas element #canvas not found');
    return;
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('dragover', handleDragOver);
  canvas.addEventListener('dragleave', handleDragLeave);
  canvas.addEventListener('drop', handleDrop);

  on('element:deselected', () => {
    canvas.querySelectorAll('.editor-selected').forEach(el =>
      el.classList.remove('editor-selected')
    );
  });

  on('history:undo', () => refreshSelection());
  on('history:redo', () => refreshSelection());

  updateEmptyState();
}

function refreshSelection() {
  canvas.querySelectorAll('.editor-selected').forEach(el =>
    el.classList.remove('editor-selected')
  );
  updateEmptyState();
}

// ── Click handler ──────────────────────────────────────────
function handleClick(e) {
  if (e.target.isContentEditable) {
    e.stopPropagation();
    return;
  }

  // Check if clicking on canvas background → deselect
  const componentEl = e.target.closest('[data-component]');
  if (componentEl && canvas.contains(componentEl)) {
    e.stopPropagation();
    selectElement(componentEl);
  } else {
    deselect();
  }
}

// ── Setup click handling inside imported iframe ────────────
export function setupIframeClicks() {
  const iframe = canvas.querySelector('iframe.imported-iframe');
  if (!iframe || !iframe.contentDocument) return;

  try {
    const iframeDoc = iframe.contentDocument;

    iframeDoc.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Find clicked element
      const target = e.target;
      if (!target || target === iframeDoc.body || target === iframeDoc.documentElement) {
        // Clicked on iframe background → select iframe wrapper
        selectElement(iframe);
        return;
      }

      // Select the clicked element
      // Remove previous selections
      iframeDoc.querySelectorAll('.editor-selected').forEach(el =>
        el.classList.remove('editor-selected')
      );

      target.classList.add('editor-selected');
      selectElement(target);
    }, true);

    // Hover effect
    iframeDoc.addEventListener('mouseover', (e) => {
      if (e.target && e.target !== iframeDoc.body && e.target !== iframeDoc.documentElement) {
        e.target.classList.add('editor-hover');
      }
    });
    iframeDoc.addEventListener('mouseout', (e) => {
      if (e.target) e.target.classList.remove('editor-hover');
    });

  } catch (e) {
    console.warn('Could not setup iframe clicks:', e);
  }
}

// ── Drop indicator helpers ─────────────────────────────────
function getDropIndicator() {
  let indicator = canvas.querySelector('.drop-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
  }
  return indicator;
}

function removeDropIndicator() {
  canvas.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

function showDropIndicatorAt(y) {
  const indicator = getDropIndicator();
  const children = getCanvasChildren();
  let insertBefore = null;

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (y < midY) {
      insertBefore = child;
      break;
    }
  }

  if (insertBefore) {
    canvas.insertBefore(indicator, insertBefore);
  } else {
    canvas.appendChild(indicator);
  }
}

function getCanvasChildren() {
  return Array.from(canvas.children).filter(
    el => !el.classList.contains('drop-indicator') &&
          !el.classList.contains('canvas-empty-state')
  );
}

// ── Drag & drop handlers ──────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  showDropIndicatorAt(e.clientY);
}

function handleDragLeave(e) {
  // Only remove if truly leaving canvas (not entering a child)
  if (!canvas.contains(e.relatedTarget)) {
    removeDropIndicator();
  }
}

function handleDrop(e) {
  e.preventDefault();
  removeDropIndicator();

  const componentId = e.dataTransfer.getData('text/plain');
  if (!componentId) return;

  const component = getComponent(componentId);
  if (!component) {
    console.warn('Unknown component:', componentId);
    return;
  }

  // Calculate insert index
  const children = getCanvasChildren();
  let insertIndex = children.length;

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      insertIndex = i;
      break;
    }
  }

  addElement(component.html, insertIndex);
  emit('element:dropped', { componentId, index: insertIndex });
  emit('history:push');
}

// ── Public API ─────────────────────────────────────────────
export function addElement(html, index) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const el = wrapper.firstElementChild;
  if (!el) return null;

  // Ensure data-component attribute exists
  if (!el.hasAttribute('data-component')) {
    el.setAttribute('data-component', 'custom');
  }

  const children = getCanvasChildren();

  if (index === undefined || index === null || index >= children.length) {
    canvas.appendChild(el);
  } else if (index <= 0) {
    const firstChild = children[0];
    if (firstChild) {
      canvas.insertBefore(el, firstChild);
    } else {
      canvas.appendChild(el);
    }
  } else {
    canvas.insertBefore(el, children[index]);
  }

  updateEmptyState();
  selectElement(el);
  return el;
}

export function removeElement(el) {
  if (el && canvas.contains(el)) {
    const wasSelected = el.classList.contains('editor-selected');
    el.remove();
    if (wasSelected) deselect();
    updateEmptyState();
    emit('history:push');
  }
}

export function moveElement(el, newIndex) {
  const children = getCanvasChildren();
  if (!el || !canvas.contains(el)) return;

  // Remove from current position
  el.remove();

  // Get updated children after removal
  const updatedChildren = getCanvasChildren();

  if (newIndex >= updatedChildren.length) {
    canvas.appendChild(el);
  } else if (newIndex <= 0) {
    const firstChild = updatedChildren[0];
    if (firstChild) {
      canvas.insertBefore(el, firstChild);
    } else {
      canvas.appendChild(el);
    }
  } else {
    canvas.insertBefore(el, updatedChildren[newIndex]);
  }

  emit('history:push');
}

export function getCanvasHTML() {
  return canvas.innerHTML;
}

export function setCanvasHTML(html) {
  canvas.innerHTML = html;
  updateEmptyState();
}

export function clearCanvas() {
  canvas.innerHTML = '';
  deselect();
  updateEmptyState();
}

function updateEmptyState() {
  const children = getCanvasChildren();
  const existing = canvas.querySelector('.canvas-empty-state');

  if (children.length === 0 && !existing) {
    const empty = document.createElement('div');
    empty.className = 'canvas-empty-state';
    empty.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <p>Drag components here to start building</p>
    `;
    canvas.appendChild(empty);
  } else if (children.length > 0 && existing) {
    existing.remove();
  }
}

export { canvas };
