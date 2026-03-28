// utils.js — Shared utility functions
// DOM helpers, debounce, color utils, etc.

// ── DOM helpers ────────────────────────────────────────────

/** Shorthand for querySelector */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/** Shorthand for querySelectorAll */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/** Create element with attributes and children */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else if (key === 'className') {
      el.className = val;
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      el.setAttribute(key, val);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  });
  return el;
}

// ── Debounce ───────────────────────────────────────────────

export function debounce(fn, delay = 250) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ── Color utilities ────────────────────────────────────────

export function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return '#000000';
  if (rgb.startsWith('#')) return rgb.length === 4
    ? '#' + rgb[1] + rgb[1] + rgb[2] + rgb[2] + rgb[3] + rgb[3]
    : rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function hexToRgb(hex, alpha = 1) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return alpha < 1
    ? `rgba(${r}, ${g}, ${b}, ${alpha})`
    : `rgb(${r}, ${g}, ${b})`;
}

export function isValidHex(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// ── CSS utilities ──────────────────────────────────────────

export function parsePx(value) {
  if (typeof value === 'number') return value;
  const match = String(value).match(/^(-?\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

export function getInlineStyle(el, prop) {
  return el.style[prop] || '';
}

export function getComputedValue(el, prop) {
  return window.getComputedStyle(el)[prop];
}

// ── String utilities ───────────────────────────────────────

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function camelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
