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

  // ── 1. Extract and inject Google Fonts into document <head> ──
  const headEl = document.head;
  const existingFontHrefs = new Set(
    Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
      .map(l => l.href)
  );

  doc.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
    if (!existingFontHrefs.has(link.href)) {
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = link.href;
      headEl.appendChild(newLink);
    }
  });

  // ── 2. Extract and inject Tailwind CSS CDN + config ──────────
  // Many pages rely on Tailwind CDN for layout. Without it, the page looks broken.
  const hasTailwindCDN = doc.querySelector('script[src*="tailwindcss"]');
  if (hasTailwindCDN && !document.querySelector('script[src*="tailwindcss"]')) {
    const s = document.createElement('script');
    s.src = hasTailwindCDN.src;
    s.crossOrigin = 'anonymous';
    headEl.appendChild(s);
  }

  // Inject Tailwind config from imported page (if exists)
  doc.querySelectorAll('script:not([src])').forEach(script => {
    if (script.textContent.includes('tailwind.config')) {
      const existingConfig = document.querySelector('script:not([src])');
      if (!existingConfig || !existingConfig.textContent.includes('tailwind.config')) {
        const s = document.createElement('script');
        s.textContent = script.textContent;
        headEl.appendChild(s);
      }
    }
  });

  // ── 3. Extract <style> tags from imported <head> ─────────────
  // Scope each <style> block under .imported-content to avoid conflicts
  // with editor CSS, then inject into document <head>
  const styleId = 'imported-styles-' + Date.now();
  let combinedCSS = '';

  doc.querySelectorAll('head style').forEach((styleTag, i) => {
    const css = styleTag.textContent;
    if (css.trim()) {
      combinedCSS += `\n/* Imported style block ${i + 1} */\n${css}\n`;
    }
  });

  // Also extract inline style attributes for scoping
  // Process CSS: scope top-level selectors under .imported-content
  if (combinedCSS) {
    const scopedCSS = scopeCSS(combinedCSS, '.imported-content');
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = scopedCSS;
    headEl.appendChild(styleEl);
  }

  // ── 4. Remove existing empty state ──────────────────────────
  const emptyState = canvas.querySelector('.canvas-empty-state');
  if (emptyState) emptyState.remove();

  // Remove previous imported styles if any
  const prevStyle = document.getElementById('imported-styles');
  if (prevStyle) prevStyle.remove();

  // ── 5. Wrap body content in .imported-content div ───────────
  const wrapper = document.createElement('div');
  wrapper.className = 'imported-content';

  // Get body innerHTML, excluding script tags
  const bodyClone = doc.body.cloneNode(true);
  bodyClone.querySelectorAll('script').forEach(s => s.remove());
  // Remove Tailwind config script
  bodyClone.querySelectorAll('script:not([src])').forEach(s => {
    if (s.textContent.includes('tailwind.config')) s.remove();
  });

  wrapper.innerHTML = bodyClone.innerHTML;

  // ── 6. Mark wrapper as imported (prevents editor dragging/selecting children) ──
  wrapper.setAttribute('data-imported', 'true');
  wrapper.setAttribute('data-component', 'imported-page');

  // ── 7. Inject into canvas ───────────────────────────────────
  canvas.appendChild(wrapper);

  emit('history:push');
}

/**
 * Scope CSS rules under a parent selector to avoid conflicts with editor CSS.
 * Handles:
 * - Simple selectors: .class → .imported-content .class
 * - Body selectors: body → .imported-content
 * - HTML selectors: html → .imported-content
 * - @-rules (media, keyframes, etc.) — passed through with inner rules scoped
 * - @font-face — passed through unchanged
 */
function scopeCSS(css, scope) {
  if (!css || !css.trim()) return '';

  // Step 1: Extract and preserve @-rule blocks (keyframes, font-face, etc.)
  // These should NOT be scoped — they're global by nature
  const atRulePlaceholder = '/*__AT_RULE__*/';
  const preservedAtRules = [];
  let result = css;

  // Match @-rule blocks with balanced braces (handles nested braces)
  result = result.replace(/@[\w-]+[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, (match) => {
    // Don't scope @media, @supports, @layer — handle their inner content
    const atRuleType = match.match(/^@([\w-]+)/)?.[1];
    if (['media', 'supports', 'layer'].includes(atRuleType)) {
      // Extract inner content and scope it
      const innerMatch = match.match(/^(@[^{]+)\{([\s\S]*)\}$/);
      if (innerMatch) {
        const [, atRuleHeader, innerContent] = innerMatch;
        const scopedInner = scopeSelectors(innerContent, scope);
        return `${atRuleHeader} { ${scopedInner} }`;
      }
    }
    // Preserve @keyframes, @font-face, etc. unchanged
    preservedAtRules.push(match);
    return `${atRulePlaceholder}${preservedAtRules.length - 1}${atRulePlaceholder}`;
  });

  // Step 2: Scope remaining selectors
  result = scopeSelectors(result, scope);

  // Step 3: Restore preserved @-rules
  result = result.replace(/\/\*__AT_RULE__\*\/(\d+)\/\*__AT_RULE__\*\//g, (_, index) => {
    return preservedAtRules[parseInt(index)] || '';
  });

  return result;
}

function scopeSelectors(css, scope) {
  return css.replace(/([^{]*)\{([^}]*)\}/g, (match, selector, declarations) => {
    const sel = selector.trim();
    if (sel.startsWith('@')) return match; // Skip any remaining @-rules
    if (!sel) return match;

    const scoped = sel.split(',').map(s => {
      s = s.trim();
      if (s.startsWith(scope)) return s; // Already scoped
      if (s === 'body' || s === 'html') return scope;
      if (s === '*') return `${scope} *`;
      if (s.startsWith('*::')) return `${scope} ${s}`;
      if (s.startsWith('*:')) return `${scope} ${s}`;
      return `${scope} ${s}`;
    }).join(', ');

    return `${scoped} { ${declarations} }`;
  });
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

  // Unwrap imported-content wrapper — move its children up
  clone.querySelectorAll('.imported-content').forEach(wrapper => {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
  });

  // Clean all elements
  clone.querySelectorAll('*').forEach(el => {
    // Remove editor classes
    EDITOR_CLASSES.forEach(cls => el.classList.remove(cls));

    // Remove editor-specific attributes
    el.removeAttribute('data-component');
    el.removeAttribute('data-component-id');
    el.removeAttribute('data-imported');
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
