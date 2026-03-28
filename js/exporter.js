// exporter.js — Export/Import HTML
// Clean export with editor markup removed, file import, clipboard copy

import { emit } from './state.js';

const EDITOR_CLASSES = [
  'editor-selected', 'editor-hover', 'editor-editing',
  'sortable-ghost', 'sortable-chosen', 'sortable-drag',
  'dragging', 'editing'
];

// ── Export HTML as downloadable file ───────────────────────
export function exportHTML() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const cleaned = cleanCanvas(canvas);
  const html = wrapHTML5(cleaned);

  // Create blob and trigger download
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'page.html';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  showToast('✅ HTML exported successfully!');
  return html;
}

// ── Import HTML from file ──────────────────────────────────
export function importHTML() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,text/html';
  input.style.display = 'none';

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      loadImportedHTML(content);
      showToast('✅ HTML imported successfully!');
    };
    reader.onerror = () => {
      showToast('❌ Failed to read file', 'error');
    };

    reader.readAsText(file);
  });

  document.body.appendChild(input);
  input.click();

  // Cleanup input after selection
  setTimeout(() => {
    if (document.body.contains(input)) {
      document.body.removeChild(input);
    }
  }, 5000);
}

function loadImportedHTML(htmlString) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Extract body content
  let bodyContent = doc.body;

  // If the body has only one child that's a wrapper, unwrap it
  // Also try to extract from common wrapper patterns
  const content = bodyContent.innerHTML;

  // Remove any existing empty state
  const emptyState = canvas.querySelector('.canvas-empty-state');
  if (emptyState) emptyState.remove();

  // Clear canvas and set new content
  canvas.innerHTML = content;

  // Ensure all imported elements have data-component attribute
  canvas.querySelectorAll('*').forEach(el => {
    if (!el.hasAttribute('data-component') &&
        !el.classList.contains('canvas-empty-state') &&
        !el.classList.contains('drop-indicator')) {
      // Infer component type from tag
      const tag = el.tagName.toLowerCase();
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'].includes(tag)) {
        el.setAttribute('data-component', tag);
      } else if (tag === 'img') {
        el.setAttribute('data-component', 'image');
      } else if (tag === 'button') {
        el.setAttribute('data-component', 'button');
      } else if (tag === 'a') {
        el.setAttribute('data-component', 'link');
      } else if (['section', 'div', 'article', 'aside'].includes(tag)) {
        el.setAttribute('data-component', 'container');
      }
    }
  });

  emit('history:push');
}

// ── Copy to clipboard ──────────────────────────────────────
export async function copyToClipboard() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const cleaned = cleanCanvas(canvas);
  const html = wrapHTML5(cleaned);

  try {
    await navigator.clipboard.writeText(html);
    showToast('📋 HTML copied to clipboard!');
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = html;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showToast('📋 HTML copied to clipboard!');
    } catch (e) {
      showToast('❌ Failed to copy', 'error');
    }

    document.body.removeChild(textarea);
  }
}

// ── Clean canvas for export ────────────────────────────────
function cleanCanvas(sourceCanvas) {
  const clone = sourceCanvas.cloneNode(true);

  // Remove empty state placeholder
  clone.querySelectorAll('.canvas-empty-state').forEach(el => el.remove());

  // Remove drop indicator
  clone.querySelectorAll('.drop-indicator').forEach(el => el.remove());

  // Remove drag handles
  clone.querySelectorAll('.drag-handle').forEach(el => el.remove());

  // Clean all elements
  clone.querySelectorAll('*').forEach(el => {
    // Remove editor classes
    EDITOR_CLASSES.forEach(cls => el.classList.remove(cls));

    // Remove editor-specific attributes
    el.removeAttribute('data-component');
    el.removeAttribute('data-component-id');
    el.removeAttribute('contenteditable');
    el.removeAttribute('draggable');
    el.removeAttribute('spellcheck');

    // Remove empty class attributes
    if (el.className === '') {
      el.removeAttribute('class');
    }
  });

  return clone.innerHTML;
}

// ── Wrap in valid HTML5 document ───────────────────────────
function wrapHTML5(bodyContent) {
  // Collect font families used in inline styles
  const fonts = collectUsedFonts(bodyContent);

  const fontLinks = fonts.length > 0
    ? fonts.map(f =>
        `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
      ).join('\n    ')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
  ${fontLinks}
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #e6edf3;
      background: #0d1117;
    }
    img { max-width: 100%; height: auto; }
    a { color: #58a6ff; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ── Collect fonts used in content ──────────────────────────
function collectUsedFonts(html) {
  const fontSet = new Set();
  const fontFamilies = [
    'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
    'Playfair Display', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins'
  ];

  // Simple regex check for font-family in inline styles
  const styleRegex = /font-family:\s*['"]?([^;'"]+)/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const font = match[1].trim().replace(/['"]/g, '');
    if (fontFamilies.includes(font)) {
      fontSet.add(font);
    }
  }

  return Array.from(fontSet);
}

// ── Toast notification ─────────────────────────────────────
function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === 'error' ? '#f85149' : '#3fb950'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-family: Inter, system-ui, sans-serif;
    z-index: 10000;
    animation: toastIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
