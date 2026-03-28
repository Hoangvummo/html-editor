// drag.js — Drag & drop engine
// Sidebar component dragging + SortableJS canvas reordering

import { emit } from './state.js';
import { getComponent, getAllComponents } from './components.js';
import { addElement } from './canvas.js';

let canvasSortableInstance = null;

// ── Sidebar drag initialization ────────────────────────────
export function initSidebarDrag() {
  const sidebarItems = document.querySelectorAll('.component-item[data-component-id]');

  sidebarItems.forEach(item => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleSidebarDragStart);
    item.addEventListener('dragend', handleSidebarDragEnd);
  });

  // Delegation for dynamically added items
  const sidebar = document.querySelector('.sidebar, .component-items, .component-list');
  if (sidebar && !sidebar._dragDelegation) {
    sidebar._dragDelegation = true;
    sidebar.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.component-item[data-component-id]');
      if (item) handleSidebarDragStart.call(item, e);
    });
    sidebar.addEventListener('dragend', (e) => {
      const item = e.target.closest('.component-item[data-component-id]');
      if (item) handleSidebarDragEnd.call(item, e);
    });
  }
}

function handleSidebarDragStart(e) {
  const componentId = this.dataset.componentId;
  e.dataTransfer.setData('text/plain', componentId);
  e.dataTransfer.effectAllowed = 'copy';

  // Visual feedback
  this.classList.add('dragging');
  this.style.opacity = '0.5';
  this.style.transform = 'scale(0.95)';

  // Create a drag image
  const ghost = this.cloneNode(true);
  ghost.style.position = 'absolute';
  ghost.style.top = '-1000px';
  ghost.style.opacity = '0.8';
  ghost.style.transform = 'scale(1.05)';
  ghost.style.pointerEvents = 'none';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 20, 20);

  requestAnimationFrame(() => ghost.remove());
}

function handleSidebarDragEnd() {
  this.classList.remove('dragging');
  this.style.opacity = '';
  this.style.transform = '';
}

// ── Canvas sortable (reorder) ─────────────────────────────
export function initCanvasSortable() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Destroy existing instance if any
  if (canvasSortableInstance) {
    canvasSortableInstance.destroy();
  }

  // Check if SortableJS is available
  if (typeof Sortable === 'undefined' && typeof window.Sortable === 'undefined') {
    console.warn('SortableJS not loaded. Canvas reordering disabled.');
    return;
  }

  const SortableLib = typeof Sortable !== 'undefined' ? Sortable : window.Sortable;

  canvasSortableInstance = SortableLib.create(canvas, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: '.canvas-empty-state, .drop-indicator, [data-imported]',
    preventOnFilter: false,
    draggable: '[data-component]:not([data-imported])',

    onEnd(evt) {
      // Remove visual feedback classes
      const el = evt.item;
      if (el) {
        el.classList.remove('sortable-ghost', 'sortable-chosen', 'sortable-drag');
      }

      emit('element:moved', {
        element: el,
        oldIndex: evt.oldIndex,
        newIndex: evt.newIndex
      });
      emit('history:push');
    },

    onStart(evt) {
      // Highlight the dragged element
      const el = evt.item;
      if (el) {
        el.classList.add('editor-selected');
      }
    },

    onMove(evt) {
      // Don't allow dragging empty state or drop indicator
      if (evt.related &&
          (evt.related.classList.contains('canvas-empty-state') ||
           evt.related.classList.contains('drop-indicator'))) {
        return false;
      }
    }
  });
}

// ── Canvas drop zone (for sidebar drag) ────────────────────
export function initDropZone() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Additional drop zone setup beyond what canvas.js handles
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
}

// ── Drop index calculator ─────────────────────────────────
export function getDropIndex(canvas, mouseY) {
  const children = Array.from(canvas.children).filter(
    el => !el.classList.contains('drop-indicator') &&
          !el.classList.contains('canvas-empty-state')
  );

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (mouseY < midY) {
      return i;
    }
  }

  return children.length;
}

// ── Cleanup ────────────────────────────────────────────────
export function destroySortable() {
  if (canvasSortableInstance) {
    canvasSortableInstance.destroy();
    canvasSortableInstance = null;
  }
}
