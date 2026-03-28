# 🎨 Visual HTML Editor - Technical Plan

> **Mục tiêu:** Xây dựng web app editor HTML trực quan (giống Elementor) bằng Vanilla HTML/CSS/JS, dark mode, professional UI.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    index.html (Entry)                    │
│  ┌──────────┐  ┌─────────────────────┐  ┌────────────┐  │
│  │  Sidebar  │  │      Canvas         │  │ Properties │  │
│  │ (Library) │  │  (Drop Zone/Preview)│  │   Panel    │  │
│  │           │  │                     │  │            │  │
│  │ - Search  │  │  [User's content]   │  │ - CSS Edit │  │
│  │ - Components│ │  [Drag & Drop]     │  │ - Colors   │  │
│  │ - Import  │  │  [Inline Edit]      │  │ - Fonts    │  │
│  │           │  │                     │  │ - Spacing  │  │
│  └──────────┘  └─────────────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Toolbar: Undo/Redo | Preview | Responsive | Export      │
└─────────────────────────────────────────────────────────┘
```

### Module Architecture (ES Modules)

```
index.html
  ├── css/style.css          (Main stylesheet - dark theme)
  ├── js/
  │   ├── app.js             (Entry point, bootstrap)
  │   ├── state.js           (Central state management)
  │   ├── canvas.js          (Canvas/drop zone logic)
  │   ├── drag.js            (Drag & drop engine)
  │   ├── components.js      (Component library definitions)
  │   ├── panel.js           (Properties panel logic)
  │   ├── editor.js          (Inline text editing)
  │   ├── history.js         (Undo/Redo stack)
  │   ├── exporter.js        (Export/import HTML)
  │   ├── preview.js         (Preview mode + responsive)
  │   └── utils.js           (Shared utilities)
```

### Design Principles
- **MVC-ish pattern:** `state.js` là single source of truth, các module khác subscribe để render
- **Event-driven:** Các module giao tiếp qua custom events trên `document`
- **DOM-based canvas:** Canvas là `<div>` thật, content được clone khi export
- **Không over-engineer:** Mỗi file ~200-400 lines, không abstract quá mức

---

## 2. Danh sách Files cần tạo

| # | File | Mô tả | Lines (est.) |
|---|------|--------|:------------:|
| 1 | `index.html` | Entry point, layout 3 cột, toolbar, import CSS/JS | ~150 |
| 2 | `css/style.css` | Dark theme, glassmorphism, layout CSS, animations | ~600 |
| 3 | `css/canvas.css` | Styles riêng cho canvas area (drop zones, outlines) | ~150 |
| 4 | `css/panel.css` | Styles cho properties panel (inputs, color pickers) | ~200 |
| 5 | `js/app.js` | Bootstrap: import modules, init, event wiring | ~80 |
| 6 | `js/state.js` | State object, selected element, event bus | ~120 |
| 7 | `js/canvas.js` | Canvas init, click-to-select, drop handlers | ~200 |
| 8 | `js/drag.js` | Drag from sidebar + reorder within canvas | ~250 |
| 9 | `js/components.js` | HTML templates for all components | ~400 |
| 10 | `js/panel.js` | Properties panel: render controls, apply CSS changes | ~350 |
| 11 | `js/editor.js` | Inline text editing (contenteditable) | ~100 |
| 12 | `js/history.js` | Undo/redo with snapshot-based stack | ~120 |
| 13 | `js/exporter.js` | Export clean HTML/CSS, import HTML files | ~180 |
| 14 | `js/preview.js` | Preview mode toggle, responsive viewport resize | ~120 |
| 15 | `js/utils.js` | DOM helpers, debounce, color utils | ~80 |
| | | **Total** | **~3,100** |

---

## 3. Core Modules và Tương tác

### 3.1 `state.js` - Central State

```javascript
// State shape
const state = {
  selectedElement: null,    // DOM element đang được chọn
  history: [],              // Undo stack (snapshots)
  historyIndex: -1,         // Current position in history
  isPreview: false,         // Preview mode flag
  responsiveMode: 'desktop' // desktop | tablet | mobile
};

// Event bus (simple pub/sub)
const events = {};
export function on(event, fn) { ... }
export function emit(event, data) { ... }
export function selectElement(el) { ... }
export function deselect() { ... }
```

### 3.2 Module Interaction Diagram

```
                    ┌───────────┐
                    │  state.js │ (single source of truth)
                    └─────┬─────┘
                          │ emit/select events
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
    │  canvas.js │  │  panel.js │  │ history.js│
    │ (render)   │  │ (CSS edit)│  │ (undo/redo)│
    └─────┬─────┘  └─────┬─────┘  └───────────┘
          │               │
    ┌─────▼─────┐  ┌─────▼─────┐
    │  drag.js  │  │ editor.js │
    │ (D&D)     │  │ (inline)  │
    └─────┬─────┘  └───────────┘
          │
    ┌─────▼─────┐
    │components │
    │   .js     │
    └───────────┘

Export/Import/Preview đọc trực tiếp từ canvas DOM.
```

### 3.3 Event Flow (Custom Events)

| Event | Emitter | Listener | Purpose |
|-------|---------|----------|---------|
| `element:selected` | canvas.js | panel.js, editor.js | Element mới được chọn |
| `element:deselected` | canvas.js | panel.js, editor.js | Bỏ chọn |
| `element:dropped` | drag.js | canvas.js, history.js | Component mới được drop |
| `element:moved` | drag.js | history.js | Component bị reorder |
| `element:deleted` | panel.js | canvas.js, history.js | Xóa component |
| `property:changed` | panel.js | history.js | CSS property thay đổi |
| `history:push` | * | history.js | Lưu snapshot |
| `history:undo` | toolbar | canvas.js | Undo action |
| `history:redo` | toolbar | canvas.js | Redo action |
| `preview:toggle` | toolbar | canvas.js, panel.js | Switch preview/edit |
| `responsive:change` | toolbar | canvas.js | Change viewport size |

---

## 4. UI Layout

### 4.1 Main Layout (3-Column)

```
┌──────────────────────────────────────────────────────────────────┐
│  🎨 Visual Editor          [Undo] [Redo] [Preview] [📱][💻][🖥] │  ← Toolbar
│  [Export HTML] [Import HTML]                                      │
├────────────┬─────────────────────────────────┬───────────────────┤
│            │                                 │                   │
│  SIDEBAR   │         CANVAS                  │  PROPERTIES       │
│  240px     │         (flex: 1)               │  PANEL 280px      │
│            │                                 │                   │
│ 🔍 Search  │  ┌─────────────────────────┐   │  Selected: Card   │
│            │  │                         │   │                   │
│ 📦 Layout  │  │   [Drop Zone]           │   │  🎨 Colors        │
│  - Hero    │  │                         │   │  - Background     │
│  - Navbar  │  │  ┌─────────────────┐   │   │  - Text Color     │
│  - Footer  │  │  │ Component 1     │   │   │                   │
│            │  │  └─────────────────┘   │   │  📝 Typography     │
│ 🧩 Content │  │  ┌─────────────────┐   │   │  - Font Family    │
│  - Card    │  │  │ Component 2     │   │   │  - Font Size      │
│  - Text    │  │  └─────────────────┘   │   │  - Font Weight    │
│  - Image   │  │                         │   │                   │
│  - Video   │  └─────────────────────────┘   │  📐 Spacing       │
│            │                                 │  - Margin         │
│ 📝 Forms   │                                 │  - Padding        │
│  - Form    │                                 │                   │
│  - Input   │                                 │  🔲 Border        │
│  - Button  │                                 │  - Width/Style    │
│            │                                 │  - Radius         │
│ 📊 Data    │                                 │                   │
│  - Table   │                                 │  ✨ Effects        │
│  - List    │                                 │  - Shadow         │
│            │                                 │  - Opacity        │
│            │                                 │                   │
│            │                                 │  📏 Size           │
│            │                                 │  - Width/Height   │
│            │                                 │                   │
│            │                                 │  [🗑 Delete]      │
└────────────┴─────────────────────────────────┴───────────────────┘
```

### 4.2 Responsive Preview Modes

```
Desktop (full):   ┌──────────────────────────────────────┐
                  │              Canvas                   │
                  └──────────────────────────────────────┘

Tablet (768px):          ┌────────────────────────┐
                         │       Canvas           │
                         └────────────────────────┘

Mobile (375px):               ┌──────────────┐
                              │   Canvas     │
                              └──────────────┘
```

### 4.3 Visual Style (Dark Glassmorphism)

```css
/* Color Palette */
--bg-primary: #0d1117;       /* Deep dark */
--bg-secondary: #161b22;     /* Panel bg */
--bg-tertiary: #21262d;      /* Input bg */
--border-color: #30363d;     /* Subtle borders */
--text-primary: #e6edf3;     /* Main text */
--text-secondary: #8b949e;   /* Muted text */
--accent: #58a6ff;           /* Blue accent */
--accent-hover: #79b8ff;
--success: #3fb950;
--danger: #f85149;
--glass-bg: rgba(22, 27, 34, 0.8);
--glass-border: rgba(48, 54, 61, 0.6);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
```

---

## 5. Component Library

### 5.1 Danh sách Components

| Category | Component | HTML Tag | Description |
|----------|-----------|----------|-------------|
| **Layout** | Section | `<section>` | Full-width container section |
| | Container | `<div>` | Centered max-width container |
| | Grid 2-col | `<div>` | 2-column grid layout |
| | Grid 3-col | `<div>` | 3-column grid layout |
| | Flex Row | `<div>` | Horizontal flex container |
| **Content** | Heading | `<h1>`-`<h6>` | Heading text |
| | Paragraph | `<p>` | Body text |
| | Image | `<img>` | Responsive image placeholder |
| | Video | `<iframe>` | Embedded video (YouTube) |
| | Icon Box | `<div>` | Icon + title + description |
| **Navigation** | Navbar | `<nav>` | Responsive navigation bar |
| | Footer | `<footer>` | Simple footer with links |
| | Breadcrumb | `<nav>` | Breadcrumb navigation |
| **Cards** | Card | `<div>` | Card with image, title, text, button |
| | Pricing Card | `<div>` | Pricing table card |
| | Testimonial | `<div>` | Customer testimonial card |
| **Buttons** | Button Primary | `<button>` | Primary CTA button |
| | Button Secondary | `<button>` | Secondary/outline button |
| | Button Group | `<div>` | Group of buttons |
| **Forms** | Form | `<form>` | Complete form with fields |
| | Input | `<input>` | Text input field |
| | Textarea | `<textarea>` | Multi-line text input |
| | Select | `<select>` | Dropdown select |
| | Checkbox | `<input>` | Checkbox with label |
| **Data** | Table | `<table>` | Data table with header |
| | List | `<ul>` | Unordered list |
| | Stats | `<div>` | Statistics/numbers display |
| **Hero** | Hero Simple | `<section>` | Hero with title + subtitle + CTA |
| | Hero Image | `<section>` | Hero with background image |
| **Divider** | Spacer | `<div>` | Vertical spacing element |
| | Divider | `<hr>` | Horizontal line divider |

### 5.2 Component Template Structure

```javascript
// Mỗi component là object:
{
  id: 'card',                    // Unique ID
  name: 'Card',                  // Display name
  icon: '🃏',                    // Icon cho sidebar
  category: 'Cards',             // Category để group
  html: `<div class="editor-card" data-component="card">
    <img src="..." alt="Card image">
    <h3>Card Title</h3>
    <p>Card description text.</p>
    <button>Click me</button>
  </div>`,
  defaultStyles: {               // CSS inline defaults
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#1f2937'
  }
}
```

---

## 6. Event Flow

### 6.1 Drag & Drop Flow

```
User drags component from sidebar
        │
        ▼
drag.js: dragstart event
  - Set dataTransfer with component ID
  - Add visual feedback (.dragging class)
        │
        ▼
canvas.js: dragover event
  - Show drop indicator (blue line/border)
  - Prevent default to allow drop
        │
        ▼
canvas.js: drop event
  - Get component ID from dataTransfer
  - components.js: create DOM element from template
  - Insert at drop position in canvas
  - Emit 'element:dropped'
        │
        ▼
history.js: listen 'element:dropped'
  - Save canvas snapshot for undo
        │
        ▼
state.js: emit 'element:selected'
  - panel.js: show properties for new element
```

### 6.2 Inline Text Edit Flow

```
User double-clicks on text element
        │
        ▼
editor.js: dblclick event
  - Set contenteditable="true" on element
  - Add .editing class (visual feedback)
  - Focus element
        │
        ▼
User types / edits text
        │
        ▼
User clicks outside (blur) OR presses Escape
        │
        ▼
editor.js: blur/keydown event
  - Set contenteditable="false"
  - Remove .editing class
  - Emit 'history:push' (save state)
```

### 6.3 CSS Property Edit Flow

```
User selects element → panel.js shows controls
        │
        ▼
User changes value (color picker, slider, input)
        │
        ▼
panel.js: input/change event
  - Read property name + value
  - Apply: selectedElement.style[property] = value
  - Emit 'property:changed'
        │
        ▼
history.js: debounce 500ms → save snapshot
```

### 6.4 Export Flow

```
User clicks "Export HTML"
        │
        ▼
exporter.js:
  1. Clone canvas DOM
  2. Remove all editor-specific classes/attributes
     - Remove data-* attributes
     - Remove contenteditable
     - Remove .editor-* classes
  3. Extract all inline styles
  4. Generate clean <style> block
  5. Wrap in valid HTML5 document
  6. Create Blob → download link → trigger download
```

### 6.5 Undo/Redo Flow

```
history.js maintains:
  - stack[]: array of canvas innerHTML snapshots
  - pointer: current position in stack

On any mutation (drop, move, delete, property change):
  - Save current canvas.innerHTML to stack
  - Truncate forward history if we branched

Undo (Ctrl+Z):
  - pointer--
  - Restore canvas.innerHTML from stack[pointer]

Redo (Ctrl+Y):
  - pointer++
  - Restore canvas.innerHTML from stack[pointer]

Limit: max 50 snapshots (memory management)
```

---

## 7. Công nghệ sử dụng

### 7.1 Core (Vanilla)

| Tech | Purpose |
|------|---------|
| HTML5 | Entry point, structure |
| CSS3 | Styling, glassmorphism, layout (Grid + Flexbox) |
| JavaScript ES Modules | All logic, no build step |
| DOM API | Canvas manipulation, events |

### 7.2 CDN Libraries (Minimal)

| Library | CDN | Purpose | Why needed |
|---------|-----|---------|------------|
| **SortableJS** | `cdn.jsdelivr.net/npm/sortablejs@1.15.0` | Drag & drop reordering within canvas | Vanilla D&D API is clunky for sortable lists. SortableJS handles it beautifully. ~10KB. |
| **Google Fonts** | `fonts.googleapis.com` | Inter font for UI | Professional look |

### 7.3 Icons

Dùng **SVG inline icons** hoặc **unicode emoji** thay vì icon library để giảm dependency. Các icon chính:

- 📦 Components, 🎨 Colors, 📝 Typography, 📐 Spacing
- SVG icons cho: drag handle (⠿), delete (🗑), duplicate (⧉), close (✕)

### 7.4 Browser APIs sử dụng

| API | Usage |
|-----|-------|
| Drag and Drop API | Sidebar → Canvas dragging |
| contenteditable | Inline text editing |
| File API | Import HTML files |
| Blob + URL.createObjectURL | Export/download HTML |
| CSS Custom Properties | Theme variables |
| ResizeObserver | Responsive preview sizing |

---

## 8. Implementation Order

### Phase 1: Foundation (Build trước)

| Order | File | Depends on | Task |
|:-----:|------|:----------:|------|
| 1 | `css/style.css` | - | Dark theme, layout CSS, reset, variables |
| 2 | `index.html` | style.css | 3-column layout, toolbar, basic structure |
| 3 | `js/utils.js` | - | DOM helpers ($$, on, debounce, etc.) |
| 4 | `js/state.js` | utils.js | State object, event bus (on/emit) |
| 5 | `js/components.js` | - | All component templates |

### Phase 2: Canvas + Drag & Drop

| Order | File | Depends on | Task |
|:-----:|------|:----------:|------|
| 6 | `js/canvas.js` | state.js, utils.js | Canvas rendering, click-to-select |
| 7 | `js/drag.js` | state.js, canvas.js, components.js | Sidebar drag + SortableJS reorder |
| 8 | `css/canvas.css` | - | Drop zones, selection outlines, drag indicators |
| 9 | `js/app.js` | all above | Wire everything together, init |

### Phase 3: Properties Panel

| Order | File | Depends on | Task |
|:-----:|------|:----------:|------|
| 10 | `css/panel.css` | - | Panel styling, inputs, color pickers |
| 11 | `js/panel.js` | state.js, utils.js | Render controls, apply CSS changes |
| 12 | `js/editor.js` | state.js | Inline text editing |

### Phase 4: History + Export/Import

| Order | File | Depends on | Task |
|:-----:|------|:----------:|------|
| 13 | `js/history.js` | state.js | Undo/redo stack, keyboard shortcuts |
| 14 | `js/exporter.js` | canvas.js | Export HTML, import HTML |
| 15 | `js/preview.js` | state.js, canvas.js | Preview mode, responsive viewport |

### Phase 5: Polish

| Order | Task |
|:-----:|------|
| 16 | Add keyboard shortcuts (Ctrl+Z, Delete, etc.) |
| 17 | Add duplicate component feature |
| 18 | Add drag-to-reorder sections (SortableJS) |
| 19 | Polish animations & transitions |
| 20 | Test all components, fix edge cases |

---

## 9. Milestones

### 🏁 Phase 1: Canvas + Drag & Drop (MVP)
**Goal:** Có thể drag components từ sidebar vào canvas, reorder được.
- ✅ Dark theme UI layout hoàn chỉnh
- ✅ Sidebar hiển thị component library với search
- ✅ Drag component từ sidebar → canvas
- ✅ Click chọn element (highlight outline)
- ✅ Reorder elements trong canvas (SortableJS)
- ✅ Delete element
- **Demo:** Drag 3-4 components vào canvas, reorder, delete

### 🏁 Phase 2: Edit + Properties Panel
**Goal:** Chỉnh sửa được nội dung và style của elements.
- ✅ Properties panel hiện controls khi chọn element
- ✅ Color picker (native `<input type="color">`)
- ✅ Font family/size/weight controls
- ✅ Spacing controls (margin, padding)
- ✅ Border controls (width, style, radius, color)
- ✅ Shadow control
- ✅ Width/height controls
- ✅ Inline text editing (double-click)
- **Demo:** Thêm Card, đổi màu background, edit text, chỉnh font

### 🏁 Phase 3: Export + Import
**Goal:** Import HTML có sẵn, export ra file HTML sạch.
- ✅ Import HTML file từ máy
- ✅ Export ra file HTML/CSS sạch (download)
- ✅ Export loại bỏ editor-specific markup
- **Demo:** Import file HTML, chỉnh sửa vài chỗ, export ra file mới

### 🏁 Phase 4: Preview + Responsive
**Goal:** Xem trước kết quả, test responsive.
- ✅ Preview mode (ẩn editor UI, xem như user thấy)
- ✅ Responsive preview: desktop / tablet (768px) / mobile (375px)
- ✅ Toolbar responsive mode toggle
- **Demo:** Switch preview modes, xem responsive

### 🏁 Phase 5: Polish + Keyboard Shortcuts
**Goal:** Hoàn thiện UX, keyboard shortcuts.
- ✅ Ctrl+Z / Ctrl+Y undo/redo
- ✅ Delete key để xóa element
- ✅ Ctrl+D duplicate element
- ✅ Smooth animations
- ✅ Component search filter trong sidebar
- ✅ Drag handle icon cho elements
- **Demo:** Full workflow: drag → edit → style → preview → export

---

## 10. Key Implementation Details

### 10.1 Canvas Structure

```html
<!-- index.html -->
<div id="canvas-wrapper">
  <div id="canvas" class="canvas" data-responsive="desktop">
    <!-- User's dropped components go here -->
    <div class="canvas-empty-state">
      <p>🎨 Drag components here to start building</p>
    </div>
  </div>
</div>
```

### 10.2 Selected Element Highlight

```css
/* Khi element được chọn */
.editor-selected {
  outline: 2px solid var(--accent) !important;
  outline-offset: 2px;
  position: relative;
}

.editor-selected::before {
  content: attr(data-component-name);
  position: absolute;
  top: -24px;
  left: 0;
  background: var(--accent);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px 4px 0 0;
}
```

### 10.3 Drop Indicator

```css
.drop-indicator {
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  margin: 2px 0;
  transition: opacity 0.15s;
}
```

### 10.4 Export Cleanup Process

```javascript
function cleanForExport(canvasEl) {
  const clone = canvasEl.cloneNode(true);
  // Remove editor attributes
  clone.querySelectorAll('[data-component]').forEach(el => {
    el.removeAttribute('data-component');
    el.removeAttribute('data-component-id');
    el.removeAttribute('contenteditable');
    el.classList.remove('editor-selected', 'editor-hover');
  });
  // Remove empty state
  clone.querySelectorAll('.canvas-empty-state').forEach(el => el.remove());
  // Remove drag handles
  clone.querySelectorAll('.drag-handle').forEach(el => el.remove());
  return clone;
}
```

### 10.5 Properties Panel - Smart Controls

Panel tự động hiển thị controls dựa trên element type:

| Element Type | Controls Shown |
|-------------|----------------|
| All | Background, Text Color, Font, Padding, Margin |
| Text (p, h1-h6) | Text align, Line height, Letter spacing |
| Image | Width, Height, Object fit, Border radius |
| Button | Background, Text, Padding, Border radius, Hover color |
| Container/Section | Min-height, Max-width, Flex/Grid controls |
| Card | All box controls + image controls |

### 10.6 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl+D` | Duplicate selected element |
| `Escape` | Deselect / exit inline edit |
| `Ctrl+E` | Toggle preview mode |
| `Ctrl+S` | Export HTML (download) |

---

## 11. File Structure (Final)

```
projects/html-editor/
├── index.html              ← Entry point
├── css/
│   ├── style.css           ← Main theme + layout
│   ├── canvas.css          ← Canvas-specific styles
│   └── panel.css           ← Properties panel styles
├── js/
│   ├── app.js              ← Bootstrap & init
│   ├── state.js            ← State management + event bus
│   ├── canvas.js           ← Canvas logic
│   ├── drag.js             ← Drag & drop engine
│   ├── components.js       ← Component templates
│   ├── panel.js            ← Properties panel
│   ├── editor.js           ← Inline text editing
│   ├── history.js          ← Undo/redo
│   ├── exporter.js         ← Export/import HTML
│   ├── preview.js          ← Preview + responsive
│   └── utils.js            ← Utilities
└── PLAN.md                 ← This file
```

---

## 12. Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Drag & drop cross-browser issues | SortableJS handles cross-browser |
| Undo/redo memory bloat | Limit to 50 snapshots, debounce saves |
| Export produces messy HTML | Thorough cleanup function, test nhiều cases |
| Complex CSS in properties panel | Start simple (most-used properties), expand later |
| Inline edit breaks layout | Use contenteditable carefully, save state on blur |

---

**Total estimated effort:** ~3,100 lines of code
**Estimated build time:** 5-7 sessions (phases)
**Complexity:** Medium (no build tools, no frameworks = simple)

> 🎯 **Mantra:** Keep it simple. Each file does one thing well. No premature abstraction.
