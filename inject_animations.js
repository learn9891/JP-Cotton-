const fs = require('fs');
const path = require('path');

// 1. Append CSS
const stylePath = path.join(__dirname, 'style.css');
const css = `
/* --- Premium Scroll Animations --- */
.fade-up-element {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: opacity, transform;
}
.fade-up-element.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered delays for grids */
.product-grid .p-card:nth-child(1) { transition-delay: 0.05s; }
.product-grid .p-card:nth-child(2) { transition-delay: 0.15s; }
.product-grid .p-card:nth-child(3) { transition-delay: 0.25s; }
.product-grid .p-card:nth-child(4) { transition-delay: 0.35s; }
.product-grid .p-card:nth-child(5) { transition-delay: 0.45s; }

.cat-card:nth-child(1) { transition-delay: 0.1s; }
.cat-card:nth-child(2) { transition-delay: 0.2s; }
.cat-card:nth-child(3) { transition-delay: 0.3s; }
.cat-card:nth-child(4) { transition-delay: 0.4s; }

/* Micro-interaction: Nav Link Hover Underline */
.desktop-only .nav-item > a {
  position: relative;
}
.desktop-only .nav-item > a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: -4px;
  left: 50%;
  background-color: var(--primary);
  transition: width 0.3s ease, left 0.3s ease;
}
.desktop-only .nav-item:hover > a::after {
  width: 100%;
  left: 0;
}
`;

fs.appendFileSync(stylePath, css, 'utf8');

// 2. Append JS
const appPath = path.join(__dirname, 'app.js');
const js = `

/* --- Premium Scroll Animations --- */
const scrollObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

window.attachScrollAnimations = () => {
  const elements = document.querySelectorAll('.cat-card:not(.fade-up-element), .p-card:not(.fade-up-element), .t-card:not(.fade-up-element), .story-text:not(.fade-up-element)');
  elements.forEach(el => {
    el.classList.add('fade-up-element');
    scrollObserver.observe(el);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(window.attachScrollAnimations, 100);
});

// Watch for DOM changes (like dynamically loaded products) to attach animations
const domObserver = new MutationObserver(() => {
  window.attachScrollAnimations();
});
domObserver.observe(document.body, { childList: true, subtree: true });
`;

fs.appendFileSync(appPath, js, 'utf8');
console.log("Animations injected.");
