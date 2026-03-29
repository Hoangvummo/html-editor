// exporter.js — Export/Import HTML using iframe for perfect rendering
// Import: render full page in iframe (100% browser-like)
// Export: extract clean HTML from canvas

import { emit } from './state.js';
import { setupIframeClicks } from './canvas.js';

// ── Export HTML as downloadable file ───────────────────────
export function exportHTML() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  let htmlContent;

  // If iframe exists (imported page), export from iframe
  const iframe = canvas.querySelector('iframe.imported-iframe');
  if (iframe && iframe.contentDocument) {
    htmlContent = iframe.contentDocument.documentElement.outerHTML;
  } else {
    // Export from canvas directly
    const cleaned = cleanCanvas(canvas);
    htmlContent = wrapHTML5(cleaned);
  }

  // Create blob and trigger download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'page.html';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  showToast('✅ HTML exported successfully!');
  return htmlContent;
}

// ── Import HTML from file ──────────────────────────────────
export function importHTML() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.htm,text/html';
  input.style.display = 'none';

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      loadImportedHTML(event.target.result);
      showToast('✅ HTML imported successfully!');
    };
    reader.onerror = () => showToast('❌ Failed to read file', 'error');
    reader.readAsText(file);
  });

  document.body.appendChild(input);
  input.click();
  setTimeout(() => { if (input.parentNode) input.remove(); }, 5000);
}

// ── Load HTML into iframe (renders EXACTLY like browser) ──
export function loadImportedHTML(htmlString) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // ── 1. Clear canvas ─────────────────────────────────────
  canvas.innerHTML = '';

  // ── 2. Create iframe ────────────────────────────────────
  const iframe = document.createElement('iframe');
  iframe.className = 'imported-iframe';
  iframe.style.cssText = `
    width: 100%;
    min-height: 400px;
    height: 400px;
    border: none;
    display: block;
    background: white;
    border-radius: inherit;
  `;

  // ── 3. Add iframe to canvas ─────────────────────────────
  canvas.appendChild(iframe);

  // ── 4. Auto-resize iframe to fit content ────────────────
  iframe.addEventListener('load', () => {
    try {
      resizeIframe(iframe);
    } catch (e) {
      console.warn('resizeIframe failed:', e);
    }
    try {
      setupIframeClicks();
    } catch (e) {
      console.warn('setupIframeClicks failed:', e);
    }
    // Watch for content changes
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body) {
        const observer = new MutationObserver(() => {
          try { resizeIframe(iframe); } catch(e) {}
        });
        observer.observe(doc.body, {
          childList: true, subtree: true, attributes: true
        });
      }
    } catch (e) {
      console.warn('MutationObserver setup failed:', e);
    }
    window.addEventListener('resize', () => {
      try { resizeIframe(iframe); } catch(e) {}
    });
  });

  // ── 5. Write HTML into iframe ───────────────────────────
  // Using srcdoc preserves full HTML including external scripts/styles
  iframe.srcdoc = htmlString;

  emit('history:push');
}

function resizeIframe(iframe) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;
    const body = doc.body;
    const html = doc.documentElement;
    const height = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.scrollHeight, html.offsetHeight
    );
    iframe.style.height = Math.max(height, 400) + 'px';
  } catch (e) {
    iframe.style.height = '100vh';
  }
}

// ── Get iframe contentDocument for editing ────────────────
export function getImportedDoc() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return null;
  const iframe = canvas.querySelector('iframe.imported-iframe');
  if (iframe && iframe.contentDocument) return iframe.contentDocument;
  return null;
}

// ── Check if page is imported (using iframe) ──────────────
export function isImportedPage() {
  const canvas = document.getElementById('canvas');
  return canvas ? !!canvas.querySelector('iframe.imported-iframe') : false;
}

// ── Copy to clipboard ─────────────────────────────────────
export async function copyToClipboard() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  let htmlContent;
  const iframe = canvas.querySelector('iframe.imported-iframe');
  if (iframe && iframe.contentDocument) {
    htmlContent = iframe.contentDocument.documentElement.outerHTML;
  } else {
    htmlContent = wrapHTML5(cleanCanvas(canvas));
  }

  try {
    await navigator.clipboard.writeText(htmlContent);
    showToast('📋 HTML copied to clipboard!');
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = htmlContent;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('📋 Copied!'); }
    catch (e) { showToast('❌ Failed to copy', 'error'); }
    document.body.removeChild(ta);
  }
}

// ── Clean canvas for export (non-iframe content) ──────────
function cleanCanvas(sourceCanvas) {
  const clone = sourceCanvas.cloneNode(true);
  clone.querySelectorAll('.canvas-empty-state, .drop-indicator, .drag-handle, iframe').forEach(el => el.remove());
  clone.querySelectorAll('.imported-content').forEach(w => {
    while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w);
    w.remove();
  });
  clone.querySelectorAll('*').forEach(el => {
    ['editor-selected','editor-hover','editor-editing','sortable-ghost',
     'sortable-chosen','sortable-drag','dragging','editing']
      .forEach(cls => el.classList.remove(cls));
    el.removeAttribute('data-component');
    el.removeAttribute('data-component-id');
    el.removeAttribute('data-imported');
    el.removeAttribute('contenteditable');
    el.removeAttribute('draggable');
    if (el.className === '') el.removeAttribute('class');
  });
  return clone.innerHTML;
}

// ── Wrap in HTML5 document ────────────────────────────────
function wrapHTML5(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ── Toast notification ─────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px;
    background:${type === 'error' ? '#f85149' : '#3fb950'};
    color:#fff; padding:12px 20px; border-radius:8px;
    font:14px Inter,system-ui,sans-serif;
    z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.3);
    animation:toastIn 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease-in forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}
