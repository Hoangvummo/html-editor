// exporter.js — Export/Import HTML
// Import: render full page in iframe (100% browser-like)
// Export: extract clean HTML

import { emit } from './state.js';

// ── Export HTML as downloadable file ───────────────────────
export function exportHTML() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  let html;
  const iframe = canvas.querySelector('iframe');
  if (iframe && iframe.contentDocument) {
    html = '<!DOCTYPE html>\n' + iframe.contentDocument.documentElement.outerHTML;
  } else {
    html = wrapHTML5(cleanCanvas(canvas));
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'page.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported!');
  return html;
}

// ── Import HTML from file ──────────────────────────────────
export function importHTML() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.htm';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImportedHTML(ev.target.result);
    reader.readAsText(file);
  };
  input.click();
}

// ── Load HTML into iframe ──────────────────────────────────
export function loadImportedHTML(htmlString) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  // Clear canvas
  canvas.innerHTML = '';

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:800px;border:none;display:block;background:#fff;overflow:auto;';
  iframe.setAttribute('scrolling', 'yes');

  // Set srcdoc BEFORE appending
  iframe.srcdoc = htmlString;

  // Append to canvas
  canvas.appendChild(iframe);

  // On load: resize iframe to fit content
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 800);
        iframe.style.height = h + 'px';
      }
    } catch(e) {
      iframe.style.height = '5000px';
    }

    // Delayed resizes for CDN scripts (Tailwind, GSAP)
    [2000, 5000].forEach(ms => {
      setTimeout(() => {
        try {
          const d = iframe.contentDocument;
          if (d && d.body) {
            iframe.style.height = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight, 800) + 'px';
          }
        } catch(e) {}
      }, ms);
    });

    // Setup click handling inside iframe
    try {
      const doc = iframe.contentDocument;
      doc.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const el = e.target;
        doc.querySelectorAll('.editor-selected').forEach(x => x.classList.remove('editor-selected'));
        if (el && el !== doc.body && el !== doc.documentElement) {
          el.classList.add('editor-selected');
        }
      }, true);
      doc.addEventListener('mouseover', (e) => {
        if (e.target && e.target !== doc.body) e.target.classList.add('editor-hover');
      });
      doc.addEventListener('mouseout', (e) => {
        if (e.target) e.target.classList.remove('editor-hover');
      });
    } catch(e) {}
  };

  emit('history:push');
}

// ── Copy to clipboard ─────────────────────────────────────
export async function copyToClipboard() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const iframe = canvas.querySelector('iframe');
  const html = iframe && iframe.contentDocument
    ? '<!DOCTYPE html>\n' + iframe.contentDocument.documentElement.outerHTML
    : wrapHTML5(cleanCanvas(canvas));
  await navigator.clipboard.writeText(html);
  showToast('Copied!');
}

// ── Helper: clean canvas for export ────────────────────────
function cleanCanvas(canvas) {
  const clone = canvas.cloneNode(true);
  clone.querySelectorAll('iframe, .canvas-empty-state, .drop-indicator, .drag-handle').forEach(el => el.remove());
  clone.querySelectorAll('*').forEach(el => {
    ['editor-selected','editor-hover','editor-editing','sortable-ghost','sortable-chosen'].forEach(c => el.classList.remove(c));
    el.removeAttribute('data-component');
    el.removeAttribute('data-component-id');
    el.removeAttribute('data-imported');
    el.removeAttribute('contenteditable');
    if (!el.className) el.removeAttribute('class');
  });
  return clone.innerHTML;
}

// ── Helper: wrap in HTML5 document ─────────────────────────
function wrapHTML5(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page</title>
</head>
<body>
${body}
</body>
</html>`;
}

// ── Toast notification ─────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast-notification');
  if (t) t.remove();
  t = document.createElement('div');
  t.className = 'toast-notification';
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#3fb950;color:#fff;padding:10px 18px;border-radius:8px;font:14px Inter,sans-serif;z-index:9999;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
