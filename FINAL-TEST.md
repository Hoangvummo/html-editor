# FINAL-TEST.md — Visual HTML Editor × Go Global Import
**Date:** 2026-03-29  
**Tester:** QA Subagent (Nô tì)

---

## 📋 Tóm tắt

Kiểm tra khả năng import `goglobal.html` vào Visual HTML Editor. Phát hiện **2 vấn đề overflow** có thể cắt nội dung iframe.

---

## 🔍 Phân tích goglobal.html

| Thuộc tính | Giá trị |
|---|---|
| Tổng dòng | 1,290 |
| Sections | 13 chính + Nav + Footer |
| Chiều cao ước tính | ~5,000–8,000px |
| Tailwind CDN | ✅ Có (cdn.tailwindcss.com) |
| Google Fonts | ✅ Inter + Playfair Display |
| GSAP + ScrollTrigger | ✅ Có |
| Lucide Icons | ✅ 76 icons |
| Custom Tailwind Config | ✅ Inline (colors, fonts) |

### Sections:
1. Hero Section (min-h-screen)
2. Market Size (chart + 4 cards)
3. Course Details
4. Target Audience
5. Learning Outcomes
6. Success Metrics
7. Instructor
8. Case Study: Wet Avocado
8b. Vietnamese Brands Going Global
9. AI Applications
10. Training Roadmap
10b. Bonus Materials
11. Learning Experience + Benefits
12. CTA / Pricing / Social Proof
13. Footer

---

## 🐛 Vấn đề phát hiện & Fix

### Vấn đề 1: `#canvas { overflow: hidden }` cắt iframe content
**File:** `css/canvas.css`, dòng 14  
**Trước:** `overflow: hidden;`  
**Sau:** `overflow: visible;`  
**Lý do:** Khi iframe content cao hơn canvas min-height, `overflow: hidden` có thể clip nội dung ở edge cases.

### Vấn đề 2: iframe thiếu `overflow: auto` và `scrolling="yes"`
**File:** `js/exporter.js`, hàm `loadImportedHTML()`  
**Trước:** iframe chỉ có `width, min-height, height, border, display, background, border-radius`  
**Sau:** Thêm `overflow: auto;` + `iframe.setAttribute('scrolling', 'yes')`  
**File:** `css/canvas.css`, selector `#canvas iframe.imported-iframe`  
**Sau:** Thêm `overflow: auto;`  
**Lý do:** Đảm bảo iframe có thể scroll nếu content dài.

---

## ✅ Kiểm tra cấu trúc Editor

| Kiểm tra | Kết quả |
|---|---|
| `#canvas` nằm trong `#canvas-wrapper` | ✅ Đúng |
| `#canvas-wrapper` có `overflow: auto` | ✅ Có (style.css) |
| `#canvas` có `overflow: visible` | ✅ Đã fix |
| iframe có `overflow: auto` | ✅ Đã fix (JS + CSS) |
| iframe có `scrolling="yes"` | ✅ Đã fix |
| `resizeIframe()` đúng logic | ✅ `Math.max(body.scrollHeight, html.scrollHeight, ...)` |
| Delayed resizes (CDN scripts) | ✅ 1s, 2s, 3s, 5s |
| MutationObserver | ✅ Theo dõi body changes |
| Window resize handler | ✅ Có |

---

## 📂 Files đã sửa

1. **`css/canvas.css`** — `#canvas` overflow: hidden → visible
2. **`css/canvas.css`** — `#canvas iframe.imported-iframe` thêm overflow: auto
3. **`js/exporter.js`** — iframe inline style thêm overflow: auto + scrolling="yes"

---

## 📂 Files đã tạo

1. **`verify.html`** — Test page đơn giản (banner hồng + 3 sections)
2. **`/tmp/goglobal-analysis.txt`** — Phân tích chi tiết goglobal.html

---

## 🔄 Luồng Import hoạt động

```
app.js → setTimeout(300ms) → fetch('./goglobal.html')
  → loadImportedHTML(html)
    → canvas.innerHTML = ''
    → create iframe.imported-iframe
    → iframe.style = { width:100%, height:400px, overflow:auto }
    → iframe.setAttribute('scrolling', 'yes')
    → canvas.appendChild(iframe)
    → iframe.srcdoc = htmlString
    → iframe 'load' event → resizeIframe()
      → Math.max(body.scrollHeight, html.scrollHeight, ...)
      → iframe.style.height = max(height, 400) + 'px'
    → MutationObserver → resize on DOM changes
    → Delayed resizes: 1s, 2s, 3s, 5s (CDN scripts)
```

---

## ⚠️ Lưu ý

- **CDN load time:** Tailwind CDN cần ~1-3s để xử lý utility classes. Trong thời gian này trang có thể hiện layout chưa đúng.
- **GSAP animations:** ScrollTrigger animations chỉ hoạt động khi page được scroll trong iframe.
- **Lucide icons:** Được render từ `<i data-lucide="...">` → SVG, cần Lucide script load xong.

---

## 🎯 Kết luận

**2 overflow issues đã được fix.** Import flow đã đúng: fetch → iframe srcdoc → resize → delayed resizes. Khi chạy trên browser thật, goglobal.html sẽ render đầy đủ 13 sections trong iframe với chiều cao tự động.

**KHÔNG push lên GitHub** theo yêu cầu của Bệ hạ.
