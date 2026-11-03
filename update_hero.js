const fs = require('fs');
const path = require('path');

// 1. Update index.html
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

const oldHeroRegex = /<section class="hero">[\s\S]*?<\/section>/i;
const newHero = `    <!-- Hero Section -->
    <section class="hero-split">
      <div class="hero-split-text">
        <div class="hero-split-content reveal">
          <h1 id="hero-title">Modern Fashion. 100% Pure Cotton.</h1>
          <p id="hero-subtitle">Elevate your wardrobe with our luxurious, breathable cotton collections designed for the modern lifestyle.</p>
          <a href="#collections" class="btn-primary" id="hero-button">Discover Pure Cotton</a>
          
          <div class="hero-split-nav">
            <button class="hero-prev" aria-label="Previous Slide">&larr; Prev</button>
            <div class="hero-dots" id="hero-dots"></div>
            <button class="hero-next" aria-label="Next Slide">Next &rarr;</button>
          </div>
        </div>
      </div>
      <div class="hero-slider hero-split-slider" id="dynamic-hero-slider">
        <!-- Slides will be loaded dynamically by app.js -->
      </div>
    </section>`;

if (oldHeroRegex.test(indexContent)) {
    indexContent = indexContent.replace(oldHeroRegex, newHero);
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log("Updated index.html hero section");
}

// 2. Add CSS to style.css
const stylePath = path.join(__dirname, 'style.css');
const newCss = `
/* --- Premium Split Hero --- */
.hero { display: none; } /* Hide old hero if it exists anywhere else */
.hero-split {
  display: flex;
  height: calc(100vh - 80px);
  min-height: 600px;
  background: var(--bg);
}
.hero-split-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg-dark);
}
.hero-split-content {
  max-width: 500px;
}
.hero-split-content h1 {
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 300;
  color: var(--primary);
  line-height: 1.1;
  margin-bottom: 24px;
}
.hero-split-content p {
  font-size: 16px;
  color: var(--ink-soft);
  margin-bottom: 40px;
  line-height: 1.6;
}
.hero-split-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 60px;
}
.hero-split-nav button {
  background: none;
  border: none;
  font-family: var(--font-display);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
  cursor: pointer;
  padding: 8px 0;
  border-bottom: 1px solid transparent;
  transition: all 0.3s;
}
.hero-split-nav button:hover {
  border-bottom: 1px solid var(--primary);
}
.hero-dots {
  display: flex;
  gap: 8px;
}
.hero-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  cursor: pointer;
  transition: background 0.3s;
}
.hero-dot.active {
  background: var(--primary);
}
.hero-split-slider {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.hero-split-slider .slide {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1.2s ease, transform 6s ease-out;
  transform: scale(1.05);
}
.hero-split-slider .slide.active {
  opacity: 1;
  transform: scale(1);
}
@media (max-width: 900px) {
  .hero-split { flex-direction: column-reverse; height: auto; }
  .hero-split-slider { height: 60vh; min-height: 400px; width: 100%; }
  .hero-split-text { padding: 60px 20px; text-align: center; }
  .hero-split-nav { justify-content: center; }
  .hero-split-content h1 { font-size: 40px; }
}
`;

if (!fs.readFileSync(stylePath, 'utf8').includes('.hero-split')) {
    fs.appendFileSync(stylePath, newCss);
    console.log("Appended new hero CSS to style.css");
}

// 3. Update app.js to handle dots
const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

const oldSliderInit = `function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const heroPrev = document.querySelector('.hero-prev');
    const heroNext = document.querySelector('.hero-next');
    if (slides.length > 0) {
      let currentSlide = 0;
      let slideInterval;

      const changeSlide = (index) => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
      };

      const startSlider = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => changeSlide(currentSlide + 1), 3500);
      };

      if (heroPrev && heroNext) {
        heroPrev.onclick = () => {
          changeSlide(currentSlide - 1);
          startSlider();
        };
        heroNext.onclick = () => {
          changeSlide(currentSlide + 1);
          startSlider();
        };
      }

      startSlider();
    }
  }`;

const newSliderInit = `function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const heroPrev = document.querySelector('.hero-prev');
    const heroNext = document.querySelector('.hero-next');
    const heroDotsContainer = document.getElementById('hero-dots');
    
    if (slides.length > 0) {
      let currentSlide = 0;
      let slideInterval;
      
      // Create dots
      if (heroDotsContainer) {
        heroDotsContainer.innerHTML = Array.from(slides).map((_, i) => 
          \`<div class="hero-dot \${i === 0 ? 'active' : ''}" data-index="\${i}"></div>\`
        ).join('');
      }
      
      const dots = document.querySelectorAll('.hero-dot');

      const changeSlide = (index) => {
        slides[currentSlide].classList.remove('active');
        if(dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        currentSlide = (index + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        if(dots[currentSlide]) dots[currentSlide].classList.add('active');
      };

      const startSlider = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => changeSlide(currentSlide + 1), 4000); // slightly slower for elegant feel
      };

      if (heroPrev && heroNext) {
        heroPrev.onclick = () => {
          changeSlide(currentSlide - 1);
          startSlider();
        };
        heroNext.onclick = () => {
          changeSlide(currentSlide + 1);
          startSlider();
        };
      }
      
      // Dot click events
      dots.forEach(dot => {
        dot.onclick = (e) => {
          changeSlide(parseInt(e.target.dataset.index));
          startSlider();
        };
      });

      startSlider();
    }
  }`;

if (appJs.includes('function initHeroSlider() {') && !appJs.includes('heroDotsContainer')) {
    appJs = appJs.replace(oldSliderInit, newSliderInit);
    fs.writeFileSync(appJsPath, appJs, 'utf8');
    console.log("Updated app.js with dot navigation logic");
} else {
    console.log("Could not find/update initHeroSlider in app.js");
}
