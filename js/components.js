// components.js — Component library definitions
// All draggable component templates with their HTML, icons, and metadata

const components = [
  // ── Layout ───────────────────────────────────────────────
  {
    id: 'section',
    name: 'Section',
    icon: '⬜',
    category: 'Layout',
    html: `<section data-component="section" style="padding: 40px 20px; min-height: 200px; background: #161b22; border-radius: 8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <p style="text-align:center; color:#8b949e; margin:0;">Section — drop content here</p>
    </section>`
  },
  {
    id: 'container',
    name: 'Container',
    icon: '📦',
    category: 'Layout',
    html: `<div data-component="container" style="max-width: 1200px; margin: 0 auto; padding: 20px; min-height: 100px; border: 1px dashed #30363d; border-radius: 8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <p style="text-align:center; color:#8b949e; margin:0;">Container</p>
    </div>`
  },
  {
    id: 'grid-2',
    name: 'Grid 2 Col',
    icon: '▥',
    category: 'Layout',
    html: `<div data-component="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; min-height: 100px; border: 1px dashed #30363d; border-radius: 8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <div style="background:#21262d; padding:20px; border-radius:4px; text-align:center; color:#8b949e;">Column 1</div>
      <div style="background:#21262d; padding:20px; border-radius:4px; text-align:center; color:#8b949e;">Column 2</div>
    </div>`
  },
  {
    id: 'grid-3',
    name: 'Grid 3 Col',
    icon: '▦',
    category: 'Layout',
    html: `<div data-component="grid-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding: 16px; min-height: 100px; border: 1px dashed #30363d; border-radius: 8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <div style="background:#21262d; padding:20px; border-radius:4px; text-align:center; color:#8b949e;">Col 1</div>
      <div style="background:#21262d; padding:20px; border-radius:4px; text-align:center; color:#8b949e;">Col 2</div>
      <div style="background:#21262d; padding:20px; border-radius:4px; text-align:center; color:#8b949e;">Col 3</div>
    </div>`
  },
  {
    id: 'flex-row',
    name: 'Flex Row',
    icon: '☰',
    category: 'Layout',
    html: `<div data-component="flex-row" style="display: flex; gap: 16px; padding: 16px; min-height: 80px; border: 1px dashed #30363d; border-radius: 8px; align-items: center;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <div style="flex:1; background:#21262d; padding:16px; border-radius:4px; text-align:center; color:#8b949e;">Item</div>
      <div style="flex:1; background:#21262d; padding:16px; border-radius:4px; text-align:center; color:#8b949e;">Item</div>
    </div>`
  },

  // ── Text ─────────────────────────────────────────────────
  {
    id: 'heading',
    name: 'Heading',
    icon: '🔤',
    category: 'Text',
    html: `<h1 data-component="heading" style="font-size: 32px; font-weight: 700; color: #e6edf3; margin: 0 0 8px 0;">
      <div class="drag-handle" style="display:none;">⠿</div>
      Heading Text
    </h1>`
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    icon: '¶',
    category: 'Text',
    html: `<p data-component="paragraph" style="font-size: 16px; line-height: 1.6; color: #8b949e; margin: 0 0 12px 0;">
      <div class="drag-handle" style="display:none;">⠿</div>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </p>`
  },
  {
    id: 'span',
    name: 'Inline Text',
    icon: '📝',
    category: 'Text',
    html: `<span data-component="span" style="font-size: 14px; color: #e6edf3;">
      <div class="drag-handle" style="display:none;">⠿</div>
      Inline text
    </span>`
  },

  // ── Media ────────────────────────────────────────────────
  {
    id: 'image',
    name: 'Image',
    icon: '🖼',
    category: 'Media',
    html: `<img data-component="image" src="https://placehold.co/600x400/21262d/8b949e?text=Image" alt="Placeholder" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
    <div class="drag-handle" style="display:none;">⠿</div>`
  },
  {
    id: 'video',
    name: 'Video',
    icon: '🎬',
    category: 'Media',
    html: `<div data-component="video" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #21262d;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0; border-radius:8px;" allowfullscreen></iframe>
    </div>`
  },

  // ── Buttons ──────────────────────────────────────────────
  {
    id: 'button-primary',
    name: 'Button',
    icon: '🔘',
    category: 'Buttons',
    html: `<button data-component="button-primary" style="background: #58a6ff; color: #ffffff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
      <div class="drag-handle" style="display:none;">⠿</div>
      Click Me
    </button>`
  },
  {
    id: 'button-secondary',
    name: 'Outline Button',
    icon: '◻',
    category: 'Buttons',
    html: `<button data-component="button-secondary" style="background: transparent; color: #58a6ff; border: 2px solid #58a6ff; padding: 10px 22px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
      <div class="drag-handle" style="display:none;">⠿</div>
      Outline
    </button>`
  },

  // ── Cards ────────────────────────────────────────────────
  {
    id: 'card',
    name: 'Card',
    icon: '🃏',
    category: 'Cards',
    html: `<div data-component="card" style="background: #161b22; border-radius: 12px; padding: 24px; border: 1px solid #30363d; max-width: 360px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <img src="https://placehold.co/320x180/21262d/8b949e?text=Card" alt="Card image" style="width:100%; height:auto; border-radius:8px; margin-bottom:16px;" />
      <h3 style="color:#e6edf3; font-size:20px; margin:0 0 8px 0;">Card Title</h3>
      <p style="color:#8b949e; font-size:14px; line-height:1.5; margin:0 0 16px 0;">A short description of the card content goes here.</p>
      <button style="background:#58a6ff; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:13px; cursor:pointer;">Learn More</button>
    </div>`
  },

  // ── Navigation ───────────────────────────────────────────
  {
    id: 'navbar',
    name: 'Navbar',
    icon: '🧭',
    category: 'Navigation',
    html: `<nav data-component="navbar" style="display:flex; align-items:center; justify-content:space-between; padding:16px 24px; background:#161b22; border-radius:8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <span style="font-size:20px; font-weight:700; color:#e6edf3;">Brand</span>
      <div style="display:flex; gap:24px;">
        <a href="#" style="color:#8b949e; text-decoration:none; font-size:14px;">Home</a>
        <a href="#" style="color:#8b949e; text-decoration:none; font-size:14px;">About</a>
        <a href="#" style="color:#8b949e; text-decoration:none; font-size:14px;">Contact</a>
      </div>
    </nav>`
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: '⬇',
    category: 'Navigation',
    html: `<footer data-component="footer" style="padding: 32px 24px; background: #161b22; border-top: 1px solid #30363d; text-align: center; border-radius: 8px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <p style="color:#8b949e; font-size:14px; margin:0 0 8px 0;">© 2024 Brand. All rights reserved.</p>
      <div style="display:flex; gap:16px; justify-content:center;">
        <a href="#" style="color:#58a6ff; text-decoration:none; font-size:13px;">Privacy</a>
        <a href="#" style="color:#58a6ff; text-decoration:none; font-size:13px;">Terms</a>
      </div>
    </footer>`
  },

  // ── Forms ────────────────────────────────────────────────
  {
    id: 'input',
    name: 'Input',
    icon: '⌨',
    category: 'Forms',
    html: `<div data-component="input" style="margin-bottom: 12px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <label style="display:block; font-size:14px; color:#8b949e; margin-bottom:6px;">Label</label>
      <input type="text" placeholder="Enter text..." style="width:100%; padding:10px 12px; background:#21262d; border:1px solid #30363d; border-radius:6px; color:#e6edf3; font-size:14px; box-sizing:border-box;" />
    </div>`
  },
  {
    id: 'textarea',
    name: 'Textarea',
    icon: '📝',
    category: 'Forms',
    html: `<div data-component="textarea" style="margin-bottom: 12px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <label style="display:block; font-size:14px; color:#8b949e; margin-bottom:6px;">Message</label>
      <textarea placeholder="Enter your message..." rows="4" style="width:100%; padding:10px 12px; background:#21262d; border:1px solid #30363d; border-radius:6px; color:#e6edf3; font-size:14px; resize:vertical; box-sizing:border-box;"></textarea>
    </div>`
  },

  // ── Data ─────────────────────────────────────────────────
  {
    id: 'table',
    name: 'Table',
    icon: '📊',
    category: 'Data',
    html: `<div data-component="table" style="overflow-x:auto;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:12px; border-bottom:2px solid #30363d; color:#e6edf3;">Name</th>
            <th style="text-align:left; padding:12px; border-bottom:2px solid #30363d; color:#e6edf3;">Status</th>
            <th style="text-align:left; padding:12px; border-bottom:2px solid #30363d; color:#e6edf3;">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#8b949e;">Item 1</td>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#3fb950;">Active</td>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#8b949e;">2024-01-15</td>
          </tr>
          <tr>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#8b949e;">Item 2</td>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#f85149;">Inactive</td>
            <td style="padding:12px; border-bottom:1px solid #30363d; color:#8b949e;">2024-02-20</td>
          </tr>
        </tbody>
      </table>
    </div>`
  },

  // ── Utility ──────────────────────────────────────────────
  {
    id: 'divider',
    name: 'Divider',
    icon: '➖',
    category: 'Utility',
    html: `<hr data-component="divider" style="border:none; border-top:1px solid #30363d; margin:24px 0;" />`
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: '↕',
    category: 'Utility',
    html: `<div data-component="spacer" style="height: 40px;">
      <div class="drag-handle" style="display:none;">⠿</div>
    </div>`
  },
  {
    id: 'hero',
    name: 'Hero Section',
    icon: '🦸',
    category: 'Hero',
    html: `<section data-component="hero" style="padding:80px 24px; text-align:center; background:linear-gradient(135deg, #161b22 0%, #0d1117 100%); border-radius:12px;">
      <div class="drag-handle" style="display:none;">⠿</div>
      <h1 style="font-size:48px; font-weight:700; color:#e6edf3; margin:0 0 16px 0;">Welcome</h1>
      <p style="font-size:18px; color:#8b949e; max-width:600px; margin:0 auto 32px auto; line-height:1.6;">Build beautiful pages with our visual editor. Drag, drop, and customize with ease.</p>
      <button style="background:#58a6ff; color:#fff; border:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer;">Get Started</button>
    </section>`
  }
];

// ── Category order for sidebar ─────────────────────────────
const CATEGORY_ORDER = ['Layout', 'Text', 'Media', 'Buttons', 'Cards', 'Navigation', 'Forms', 'Data', 'Hero', 'Utility'];

// ── Public API ─────────────────────────────────────────────
export function getComponent(id) {
  return components.find(c => c.id === id) || null;
}

export function getAllComponents() {
  return [...components];
}

export function getComponentsByCategory() {
  const grouped = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = components.filter(c => c.category === cat);
  }
  // Add any uncategorized
  const remaining = components.filter(c => !CATEGORY_ORDER.includes(c.category));
  if (remaining.length > 0) {
    grouped['Other'] = remaining;
  }
  return grouped;
}

export function getCategories() {
  return CATEGORY_ORDER;
}

export function createComponentElement(id) {
  const comp = getComponent(id);
  if (!comp) return null;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = comp.html;
  return wrapper.firstElementChild;
}

export function renderSidebar(filter = '') {
  const container = document.getElementById('component-list');
  if (!container) return;
  container.innerHTML = '';

  const grouped = getComponentsByCategory();
  const categories = getCategories();
  const lowerFilter = filter.toLowerCase();

  for (const cat of categories) {
    const items = grouped[cat] || [];
    const filtered = lowerFilter
      ? items.filter(c => c.name.toLowerCase().includes(lowerFilter) || c.id.includes(lowerFilter))
      : items;
    if (filtered.length === 0) continue;

    // Category header
    const section = document.createElement('div');
    section.className = 'component-category';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `<span class="category-icon">${cat}</span><span>${cat}</span><svg class="category-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    header.addEventListener('click', () => section.classList.toggle('collapsed'));

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'category-items';

    for (const comp of filtered) {
      const item = document.createElement('div');
      item.className = 'component-item';
      item.setAttribute('data-component-id', comp.id);
      item.setAttribute('draggable', 'true');
      item.innerHTML = `<span class="component-item-icon">${comp.icon}</span><span class="component-item-name">${comp.name}</span>`;
      itemsContainer.appendChild(item);
    }

    section.appendChild(header);
    section.appendChild(itemsContainer);
    container.appendChild(section);
  }
}
