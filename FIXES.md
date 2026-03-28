# Visual HTML Editor — Import Fixes

## Summary
Fixed the HTML import feature so that imported pages display correctly in the canvas,
matching the original as closely as possible.

## Files Modified

### 1. `css/style.css` — CSS Reset Scoping

**Problem:** The global `* { margin: 0; padding: 0; box-sizing: border-box; }` reset
was applied to ALL elements including imported page content, destroying layout, spacing,
and box model of the imported page. Other global rules (`ul, ol { list-style: none }`,
`img { display: block }`, `html { font-size: 14px }`) also affected imported content.

**Fix:**
- Scoped the CSS reset to only editor UI containers: `#toolbar`, `#sidebar`, `#panel`,
  `#canvas-wrapper` (but NOT `#canvas` or its children)
- Changed `a`, `ul/ol`, `img`, `input` rules to use `:not(#canvas)` selectors
- Added `#canvas, #canvas * { box-sizing: border-box; }` to preserve box model
- Added Tailwind CDN preflight protection: `border: inherit` on editor UI elements
  to prevent Tailwind's global `border: 0` reset from breaking editor borders

### 2. `css/canvas.css` — Canvas Background & Children Positioning

**Problem:**
- `#canvas { background: #ffffff; }` overrode the dark background of imported pages
- `#canvas > * { position: relative; }` forced relative positioning on ALL canvas
  children, breaking imported pages with absolute/fixed positioning

**Fix:**
- Changed `background: #ffffff` → `background: transparent` so imported page's own
  background shows through
- Added `#canvas:has(.canvas-empty-state) { background: #ffffff; }` to show white
  background only when canvas is empty
- Changed `#canvas > *` selector to `#canvas > [data-component]:not(...)` so only
  editor-added components get forced `position: relative`, not imported content
- Added `.imported-content` wrapper styling: `width: 100%`

### 3. `js/exporter.js` — Import Function (Major Rewrite)

**Problem:** `loadImportedHTML()` only extracted `body.innerHTML` and set it directly
on canvas. It did NOT:
- Extract `<style>` tags from imported `<head>`
- Extract Google Fonts links
- Extract Tailwind CSS CDN (essential for Go Global page layout)
- Scope CSS to avoid conflicts with editor CSS

**Fix — `loadImportedHTML()` now does:**
1. **Google Fonts extraction:** Copies `<link href="fonts.googleapis.com">` tags
   from imported HTML into document `<head>`
2. **Tailwind CSS CDN injection:** Injects `<script src="cdn.tailwindcss.com">`
   and the Tailwind config from imported page (if present)
3. **Style extraction + scoping:** Extracts all `<style>` tags from imported `<head>`,
   scopes their CSS selectors under `.imported-content` wrapper, and injects as a
   single `<style>` block in document `<head>`
4. **Content wrapping:** Wraps imported body content in
   `<div class="imported-content" data-imported="true" data-component="imported-page">`
5. **Script removal:** Strips `<script>` tags from imported body (they won't work
   in the editor context)
6. **Empty state removal:** Hides the "Drag components here" placeholder on import

**New functions added:**
- `scopeCSS(css, scope)` — Scopes CSS rules under a parent selector. Handles:
  - `body` / `html` selectors → `.imported-content`
  - `*` universal selector → `.imported-content *` (prevents global cascade)
  - `@media` / `@supports` / `@layer` — inner rules are scoped
  - `@keyframes` / `@font-face` — preserved unchanged
- `scopeSelectors(css, scope)` — Helper that scopes individual CSS rule blocks

**Export function also updated:**
- `cleanCanvas()` now unwraps `.imported-content` wrapper (moves children up)
  and removes `data-imported` attribute for clean export

### 4. `js/canvas.js` — Click Handler for Imported Content

**Problem:** Click handler uses `e.target.closest('[data-component]')` to find
selectable elements. Imported page elements don't have `data-component`, so clicking
on imported content would deselect everything.

**Fix:** Added check for `[data-imported]` wrapper before the `data-component` check.
If click is inside imported content, the wrapper `<div class="imported-content">` is
selected (not individual inner elements). This lets users select/delete the entire
imported page as a single unit.

### 5. `js/drag.js` — SortableJS Filter for Imported Content

**Problem:** SortableJS `draggable: '[data-component]'` would match the imported
content wrapper (which has `data-component="imported-page"`), allowing users to
drag/reorder it — potentially breaking the imported page layout.

**Fix:**
- Added `[data-imported]` to SortableJS `filter` array (prevents drag initiation)
- Changed `draggable` to `'[data-component]:not([data-imported])'` (excludes
  imported content from reorderable elements)

## CSS Scoping Strategy

When importing HTML, all CSS from the imported page is scoped under `.imported-content`:

```
Original:                    Scoped:
body { bg: #050505; }   →   .imported-content { bg: #050505; }
h1 { font: serif; }     →   .imported-content h1 { font: serif; }
.glass { blur: 20px; }  →   .imported-content .glass { blur: 20px; }
* { box-sizing: ...; }  →   .imported-content * { box-sizing: ...; }
@keyframes fade {}      →   @keyframes fade {} (unchanged)
@font-face {}           →   @font-face {} (unchanged)
@media (max-width) {}   →   @media (max-width) { .imported-content ... {} }
```

This prevents imported CSS from affecting the editor UI while preserving all
styling within the canvas.

## Known Limitations

1. **Tailwind CDN conflicts:** Tailwind's global preflight (`*, *::before, *::after {
   border: 0 }`) runs on the entire page. Editor UI elements may lose borders
   temporarily. A CSS safety net is added but may not cover all cases.

2. **External scripts don't run:** Scripts like GSAP, Lucide icons are stripped
   from imported body. Dynamic animations and icon rendering won't work in editor.

3. **CSS scoping edge cases:** Complex selectors like `body.class > *` or
   `:root { ... }` may not scope correctly. Common patterns are handled.

4. **Background image on canvas-wrapper:** The editor's dot-grid background pattern
   shows through around the canvas edges. This is cosmetic and doesn't affect
  imported content.

## Testing Notes

Test file: `/root/.openclaw/media/inbound/GoGlobal_Ultimate_V7---1a761041-c835-453f-bded-ed4f2140d35f`

This page uses:
- Tailwind CSS (CDN) for layout
- Google Fonts (Inter + Playfair Display)
- Custom CSS classes (.text-gradient, .glass-panel, .bento-card)
- Dark theme (background: #050505)
- CSS animations (@keyframes gradientMove)
- GSAP + ScrollTrigger (for animations)
- Lucide icons

Expected after import:
- ✅ Dark background visible
- ✅ Google Fonts applied
- ✅ Tailwind layout classes working
- ✅ Custom CSS (.glass-panel, .bento-card, etc.) applied
- ✅ CSS animations preserved
- ⚠️ GSAP animations won't run (scripts stripped)
- ⚠️ Lucide icons won't render (scripts stripped)
