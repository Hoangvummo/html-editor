// panel.js — Properties panel logic
// Renders controls based on element type, applies CSS changes

import { state, on, emit, selectElement, deselect } from './state.js';
import { removeElement } from './canvas.js';

const FONTS = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Playfair Display', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'system-ui', 'sans-serif', 'serif', 'monospace'
];

const FONT_WEIGHTS = [300, 400, 500, 600, 700];

const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double', 'none'];

const OBJECT_FITS = ['cover', 'contain', 'fill', 'none', 'scale-down'];

const DISPLAY_OPTIONS = ['block', 'flex', 'grid', 'inline-block', 'none', 'inline-flex'];

let panelEl;

export function init() {
  panelEl = document.getElementById('panel');
  if (!panelEl) {
    console.error('Panel element #panel not found');
    return;
  }

  on('element:selected', renderPanel);
  on('element:deselected', clearPanel);

  clearPanel();
}

// ── Clear panel ────────────────────────────────────────────
function clearPanel() {
  if (!panelEl) return;
  panelEl.innerHTML = `
    <div class="panel-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12h8M12 8v8"/>
      </svg>
      <p>Select an element to edit its properties</p>
    </div>
  `;
}

// ── Render panel for selected element ──────────────────────
function renderPanel(el) {
  if (!panelEl || !el) return;

  const tagName = el.tagName.toLowerCase();
  const componentName = el.dataset.component || tagName;

  panelEl.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = `
    <span class="panel-element-type">${componentName}</span>
    <span class="panel-element-tag">&lt;${tagName}&gt;</span>
  `;
  panelEl.appendChild(header);

  // ── Always-shown sections ────────────────────────────────
  panelEl.appendChild(buildSpacingVisualizer(el));
  panelEl.appendChild(buildSection('🎨 Colors', buildColorControls(el)));
  panelEl.appendChild(buildSection('📝 Typography', buildTypographyControls(el, tagName)));
  panelEl.appendChild(buildSection('📐 Spacing', buildSpacingControls(el)));
  panelEl.appendChild(buildSection('🔲 Border', buildBorderControls(el)));
  panelEl.appendChild(buildSection('✨ Effects', buildEffectControls(el)));
  panelEl.appendChild(buildSection('📏 Size', buildSizeControls(el)));

  // ── Type-specific sections ───────────────────────────────
  if (isTextElement(tagName)) {
    panelEl.appendChild(buildSection('📖 Text', buildTextControls(el)));
  }
  if (tagName === 'img') {
    panelEl.appendChild(buildSection('🖼 Image', buildImageControls(el)));
  }
  if (tagName === 'button') {
    panelEl.appendChild(buildSection('🔘 Button', buildButtonControls(el)));
  }
  if (isContainerElement(el)) {
    panelEl.appendChild(buildSection('📦 Layout', buildContainerControls(el)));
  }

  // ── Actions ──────────────────────────────────────────────
  const actions = document.createElement('div');
  actions.className = 'panel-actions';
  actions.innerHTML = `
    <button class="btn btn-duplicate" title="Duplicate element (Ctrl+D)">
      <span>⧉</span> Duplicate
    </button>
    <button class="btn btn-delete" title="Delete element (Del)">
      <span>🗑</span> Delete
    </button>
  `;

  actions.querySelector('.btn-duplicate').addEventListener('click', () => {
    duplicateSelected(el);
  });

  actions.querySelector('.btn-delete').addEventListener('click', () => {
    removeElement(el);
    emit('element:deleted', el);
  });

  panelEl.appendChild(actions);
}

// ── Section builder (collapsible) ──────────────────────────
function buildSection(title, contentEl) {
  const section = document.createElement('div');
  section.className = 'panel-section';

  const heading = document.createElement('div');
  heading.className = 'panel-section-header';
  heading.innerHTML = `<span>${title}</span><span class="chevron">▾</span>`;
  heading.addEventListener('click', () => {
    section.classList.toggle('collapsed');
    heading.querySelector('.chevron').textContent =
      section.classList.contains('collapsed') ? '▸' : '▾';
  });

  const body = document.createElement('div');
  body.className = 'panel-section-body';
  body.appendChild(contentEl);

  section.appendChild(heading);
  section.appendChild(body);
  return section;
}

// ── Color controls ─────────────────────────────────────────
function buildColorControls(el) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildColorInput('Background', el, 'backgroundColor'));
  frag.appendChild(buildColorInput('Text Color', el, 'color'));
  return frag;
}

function buildColorInput(label, el, prop) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const currentVal = getComputedStyleValue(el, prop) || '#000000';
  const hex = rgbToHex(currentVal);

  wrapper.innerHTML = `
    <label>${label}</label>
    <div class="color-input-group">
      <input type="color" value="${hex}" data-prop="${prop}" />
      <input type="text" class="hex-input" value="${hex}" data-prop="${prop}" maxlength="7" />
    </div>
  `;

  const colorPicker = wrapper.querySelector('input[type="color"]');
  const hexInput = wrapper.querySelector('.hex-input');

  colorPicker.addEventListener('input', (e) => {
    el.style[prop] = e.target.value;
    hexInput.value = e.target.value;
    emitChange(prop, e.target.value);
  });

  hexInput.addEventListener('change', (e) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      el.style[prop] = val;
      colorPicker.value = val;
      emitChange(prop, val);
    }
  });

  return wrapper;
}

// ── Typography controls ────────────────────────────────────
function buildTypographyControls(el, tagName) {
  const frag = document.createDocumentFragment();

  // Font Family
  frag.appendChild(buildSelectInput('Font Family', el, 'fontFamily', FONTS));

  // Font Size
  frag.appendChild(buildTextInput('Font Size', el, 'fontSize', '16px'));

  // Font Weight
  frag.appendChild(buildButtonGroup('Font Weight', el, 'fontWeight',
    FONT_WEIGHTS.map(w => ({ label: String(w), value: String(w) }))
  ));

  return frag;
}

// ── Text controls (for text elements) ──────────────────────
function buildTextControls(el) {
  const frag = document.createDocumentFragment();

  // Text Align
  frag.appendChild(buildButtonGroup('Text Align', el, 'textAlign', [
    { label: '◧', value: 'left', title: 'Left' },
    { label: '◫', value: 'center', title: 'Center' },
    { label: '◨', value: 'right', title: 'Right' },
    { label: '▤', value: 'justify', title: 'Justify' }
  ]));

  // Line Height
  frag.appendChild(buildTextInput('Line Height', el, 'lineHeight', '1.5'));

  // Letter Spacing
  frag.appendChild(buildTextInput('Letter Spacing', el, 'letterSpacing', '0px'));

  return frag;
}

// ── Spacing visualizer (box model diagram) ─────────────────
function buildSpacingVisualizer(el) {
  const section = document.createElement('div');
  section.className = 'panel-section spacing-visualizer-section';

  const heading = document.createElement('div');
  heading.className = 'panel-section-header';
  heading.innerHTML = '<span>📐 Box Model</span><span class="chevron">▾</span>';
  heading.addEventListener('click', () => {
    section.classList.toggle('collapsed');
  });

  const diagram = document.createElement('div');
  diagram.className = 'box-model-diagram';

  const computed = window.getComputedStyle(el);
  const marginVal = {
    top: computed.marginTop || '0',
    right: computed.marginRight || '0',
    bottom: computed.marginBottom || '0',
    left: computed.marginLeft || '0'
  };
  const paddingVal = {
    top: computed.paddingTop || '0',
    right: computed.paddingRight || '0',
    bottom: computed.paddingBottom || '0',
    left: computed.paddingLeft || '0'
  };

  diagram.innerHTML = `
    <div class="box-margin">
      <span class="box-label">margin</span>
      <span class="box-top">${marginVal.top}</span>
      <span class="box-right">${marginVal.right}</span>
      <span class="box-bottom">${marginVal.bottom}</span>
      <span class="box-left">${marginVal.left}</span>
      <div class="box-border">
        <div class="box-padding">
          <span class="box-label">padding</span>
          <span class="box-top">${paddingVal.top}</span>
          <span class="box-right">${paddingVal.right}</span>
          <span class="box-bottom">${paddingVal.bottom}</span>
          <span class="box-left">${paddingVal.left}</span>
          <div class="box-content">
            ${computed.width} × ${computed.height}
          </div>
        </div>
      </div>
    </div>
  `;

  section.appendChild(heading);
  section.appendChild(diagram);
  return section;
}

// ── Spacing controls ───────────────────────────────────────
function buildSpacingControls(el) {
  const frag = document.createDocumentFragment();

  // Padding
  const padRow = document.createElement('div');
  padRow.className = 'control-group';
  padRow.innerHTML = '<label class="group-label">Padding</label>';
  const padGrid = document.createElement('div');
  padGrid.className = 'spacing-grid';

  ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
    const prop = 'padding' + side;
    padGrid.appendChild(buildSmallInput(side, el, prop, '0px'));
  });

  padRow.appendChild(padGrid);
  frag.appendChild(padRow);

  // Margin
  const marRow = document.createElement('div');
  marRow.className = 'control-group';
  marRow.innerHTML = '<label class="group-label">Margin</label>';
  const marGrid = document.createElement('div');
  marGrid.className = 'spacing-grid';

  ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
    const prop = 'margin' + side;
    marGrid.appendChild(buildSmallInput(side, el, prop, '0px'));
  });

  marRow.appendChild(marGrid);
  frag.appendChild(marRow);

  return frag;
}

// ── Border controls ────────────────────────────────────────
function buildBorderControls(el) {
  const frag = document.createDocumentFragment();

  frag.appendChild(buildTextInput('Border Width', el, 'borderWidth', '0px'));
  frag.appendChild(buildSelectInput('Border Style', el, 'borderStyle', BORDER_STYLES));
  frag.appendChild(buildTextInput('Border Radius', el, 'borderRadius', '0px'));
  frag.appendChild(buildColorInput('Border Color', el, 'borderColor'));

  return frag;
}

// ── Effect controls ────────────────────────────────────────
function buildEffectControls(el) {
  const frag = document.createDocumentFragment();

  frag.appendChild(buildTextInput('Box Shadow', el, 'boxShadow', 'none'));
  frag.appendChild(buildRangeInput('Opacity', el, 'opacity', 0, 1, 0.1));

  return frag;
}

// ── Size controls ──────────────────────────────────────────
function buildSizeControls(el) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildTextInput('Width', el, 'width', 'auto'));
  frag.appendChild(buildTextInput('Height', el, 'height', 'auto'));
  return frag;
}

// ── Image controls ─────────────────────────────────────────
function buildImageControls(el) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildTextInput('Width', el, 'width', '100%'));
  frag.appendChild(buildTextInput('Height', el, 'height', 'auto'));
  frag.appendChild(buildSelectInput('Object Fit', el, 'objectFit', OBJECT_FITS));
  frag.appendChild(buildTextInput('Border Radius', el, 'borderRadius', '0px'));
  return frag;
}

// ── Button controls ────────────────────────────────────────
function buildButtonControls(el) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildColorInput('Background', el, 'backgroundColor'));
  frag.appendChild(buildColorInput('Text Color', el, 'color'));
  frag.appendChild(buildTextInput('Padding', el, 'padding', '8px 16px'));
  frag.appendChild(buildTextInput('Border Radius', el, 'borderRadius', '4px'));
  return frag;
}

// ── Container controls ─────────────────────────────────────
function buildContainerControls(el) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildTextInput('Min Height', el, 'minHeight', 'auto'));
  frag.appendChild(buildTextInput('Max Width', el, 'maxWidth', 'none'));
  frag.appendChild(buildSelectInput('Display', el, 'display', DISPLAY_OPTIONS));
  return frag;
}

// ── Control builder helpers ────────────────────────────────
function buildTextInput(label, el, prop, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const currentVal = el.style[prop] || placeholder || '';

  wrapper.innerHTML = `
    <label>${label}</label>
    <input type="text" value="${escapeAttr(currentVal)}" placeholder="${placeholder || ''}" data-prop="${prop}" />
  `;

  const input = wrapper.querySelector('input');
  input.addEventListener('change', (e) => {
    el.style[prop] = e.target.value;
    emitChange(prop, e.target.value);
  });
  input.addEventListener('input', (e) => {
    el.style[prop] = e.target.value;
  });

  return wrapper;
}

function buildSmallInput(label, el, prop, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'small-control';

  const currentVal = el.style[prop] || '';

  wrapper.innerHTML = `
    <label>${label}</label>
    <input type="text" value="${escapeAttr(currentVal)}" placeholder="${placeholder || ''}" data-prop="${prop}" />
  `;

  const input = wrapper.querySelector('input');
  input.addEventListener('change', (e) => {
    el.style[prop] = e.target.value;
    emitChange(prop, e.target.value);
  });

  return wrapper;
}

function buildSelectInput(label, el, prop, options) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const currentVal = el.style[prop] || '';

  const optionsHtml = options.map(opt => {
    const selected = currentVal === opt ? 'selected' : '';
    return `<option value="${opt}" ${selected}>${opt}</option>`;
  }).join('');

  wrapper.innerHTML = `
    <label>${label}</label>
    <select data-prop="${prop}">
      <option value="">—</option>
      ${optionsHtml}
    </select>
  `;

  const select = wrapper.querySelector('select');
  select.addEventListener('change', (e) => {
    el.style[prop] = e.target.value;
    emitChange(prop, e.target.value);
  });

  return wrapper;
}

function buildButtonGroup(label, el, prop, items) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const currentVal = el.style[prop] || '';

  const buttonsHtml = items.map(item => {
    const active = currentVal === item.value ? 'active' : '';
    const title = item.title || item.label;
    return `<button class="btn-toggle ${active}" data-value="${item.value}" title="${title}">${item.label}</button>`;
  }).join('');

  wrapper.innerHTML = `
    <label>${label}</label>
    <div class="btn-group" data-prop="${prop}">${buttonsHtml}</div>
  `;

  wrapper.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      el.style[prop] = btn.dataset.value;
      emitChange(prop, btn.dataset.value);
    });
  });

  return wrapper;
}

function buildRangeInput(label, el, prop, min, max, step) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const currentVal = parseFloat(el.style[prop]) || max;

  wrapper.innerHTML = `
    <label>${label}</label>
    <div class="range-group">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${currentVal}" data-prop="${prop}" />
      <span class="range-value">${currentVal}</span>
    </div>
  `;

  const input = wrapper.querySelector('input[type="range"]');
  const display = wrapper.querySelector('.range-value');

  input.addEventListener('input', (e) => {
    const val = e.target.value;
    el.style[prop] = val;
    display.textContent = val;
    emitChange(prop, val);
  });

  return wrapper;
}

// ── Utilities ──────────────────────────────────────────────
function emitChange(prop, value) {
  emit('property:changed', { property: prop, value });
}

function getComputedStyleValue(el, prop) {
  return window.getComputedStyle(el)[prop];
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return '#000000';
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function isTextElement(tagName) {
  return ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'a', 'li'].includes(tagName);
}

function isContainerElement(el) {
  const tagName = el.tagName.toLowerCase();
  const containers = ['div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main', 'form'];
  if (containers.includes(tagName)) return true;
  // Also check if element has children or display:flex/grid
  const display = window.getComputedStyle(el).display;
  return ['flex', 'grid', 'inline-flex', 'inline-grid'].includes(display);
}

function duplicateSelected(el) {
  if (!el) return;

  const clone = el.cloneNode(true);
  clone.classList.remove('editor-selected', 'editor-hover');

  // Insert after the original
  if (el.nextSibling) {
    el.parentNode.insertBefore(clone, el.nextSibling);
  } else {
    el.parentNode.appendChild(clone);
  }

  selectElement(clone);
  emit('history:push');
}
