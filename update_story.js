const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'our-cotton.html');
let content = fs.readFileSync(filePath, 'utf8');

const newContent = `  <section class="story-hero">
    <div class="wrap reveal">
      <h1>The Fabric of India</h1>
      <p style="font-size: 18px; opacity: 0.9;">Every thread tells a story. From farm to loom, we trace every step.</p>
    </div>
  </section>

  <section class="story-quote reveal">
    <div class="wrap">
      <h2>"True luxury is found in the integrity of the materials, the hands that shape them, and the earth that provides them."</h2>
      <p>— The JP Cotton Philosophy</p>
    </div>
  </section>

  <section class="timeline">
    <div class="wrap">
      <div style="text-align:center; margin-bottom: 60px;">
        <h2 style="font-family: var(--font-display); font-size:40px; color:var(--primary); font-style:italic;">The Journey</h2>
      </div>
      <div class="timeline-grid">
        <div class="timeline-step reveal">
          <img src="assets/cotton_harvest.jpg" alt="Harvesting Seed">
          <h3>1. Sourced</h3>
          <p>Grown in the rich soils of Gujarat, hand-picked by local farming communities.</p>
        </div>
        <div class="timeline-step reveal" style="transition-delay: 0.1s;">
          <img src="assets/cotton_ginning.jpg" alt="Spinning Yarn">
          <h3>2. Spun</h3>
          <p>Purified and spun into fine yarn, preserving the natural strength of the fiber.</p>
        </div>
        <div class="timeline-step reveal" style="transition-delay: 0.2s;">
          <img src="assets/cotton_weaving.jpg" alt="Weaving Loom">
          <h3>3. Woven</h3>
          <p>Master artisans weave the yarn on traditional looms to create breathable fabrics.</p>
        </div>
        <div class="timeline-step reveal" style="transition-delay: 0.3s;">
          <img src="assets/cotton_finishing.jpg" alt="Finishing Fabric">
          <h3>4. Crafted</h3>
          <p>Tailored into elegant, timeless silhouettes designed for ultimate comfort.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="community-section reveal">
    <div class="wrap">
      <div class="community-flex">
        <div class="community-text">
          <h2 style="font-family: var(--font-display); font-size:48px; color:var(--primary); margin-bottom: 24px; font-style:italic;">Our Community</h2>
          <p style="color:var(--ink-soft); font-size:16px; margin-bottom: 24px; line-height:1.8;">We believe that sustainability is as much about people as it is about the planet. By partnering directly with farmers and weavers, we ensure fair wages, safe working conditions, and the preservation of multi-generational craft traditions.</p>
          <p style="color:var(--ink-soft); font-size:16px; line-height:1.8;">When you wear JP Cotton, you aren't just wearing fabric. You are wearing a legacy.</p>
        </div>
        <div class="community-img">
          <img src="assets/community_1.jpg" alt="Community of weavers">
        </div>
      </div>
    </div>
  </section>`;

// Replace from <div class="page-header reveal"> to before <!-- Footer -->
const startMarker = '<div class="page-header reveal">';
const endMarker = '<!-- Footer -->';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newContent + '\n\n  ' + content.substring(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated our-cotton.html layout.');
} else {
    console.log('Markers not found!');
}
