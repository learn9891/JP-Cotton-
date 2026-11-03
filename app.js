// ===== DYNAMIC API BASE HELPER =====
window.getApiBase = function () {
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  if (window.location.port === '3000' || window.location.port === '') return '';
  if (window.location.origin.includes('127.0.0.1')) return 'http://127.0.0.1:3000';
  return 'http://localhost:3000';
};
const API_BASE = window.getApiBase();

/**
 * JP Cotton - Interaction Logic
 */

// ===== AUTH STATE HELPERS =====

function getCurrentUser() {
  const raw = localStorage.getItem('petal_user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    // Optional: validate expiry if your login flow stores a token/expiry
    if (user.expiresAt && Date.now() > user.expiresAt) {
      localStorage.removeItem('petal_user');
      return null;
    }
    return user;
  } catch (e) {
    // Corrupted data — clear it so it doesn't keep breaking things
    localStorage.removeItem('petal_user');
    return null;
  }
}

function logoutUser(e) {
  if (e && e.preventDefault) e.preventDefault();
  try {
    localStorage.removeItem('petal_user');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('jp_last_order');
  } catch (err) { }
  window.location.href = 'login.html?logged_out=1';
}
window.logoutUser = logoutUser;
window.logout = logoutUser;
window.signOut = logoutUser;

function updateAuthNavigation() {
  const userIcon = document.getElementById('auth-user-icon');
  if (!userIcon) return;

  const user = getCurrentUser();
  const mobileNav = document.querySelector('.mobile-navlinks');

  if (user) {
    const firstName = user.first_name || (user.user && user.user.first_name) || 'Patron';
    const email = user.email || (user.user && user.user.email) || '';

    userIcon.setAttribute('href', 'profile.html');
    userIcon.classList.add('logged-in');
    userIcon.title = `Signed in as ${firstName}`;

    // Wrap in auth-user-wrap with dropdown if not already wrapped
    let parent = userIcon.parentElement;
    if (parent && !parent.classList.contains('auth-user-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'auth-user-wrap';
      parent.insertBefore(wrap, userIcon);
      wrap.appendChild(userIcon);

      const dropdown = document.createElement('div');
      dropdown.className = 'auth-user-dropdown';
      dropdown.id = 'auth-user-dropdown';
      dropdown.innerHTML = `
        <div class="auth-user-dropdown-header">
          <div class="auth-user-dropdown-name">Hi, ${firstName}</div>
          <div class="auth-user-dropdown-email">${email}</div>
        </div>
        <a href="profile.html">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>My Profile & Orders</span>
        </a>
        <a href="favorites.html">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          <span>Saved Wishlist</span>
        </a>
        <button type="button" class="signout-btn" onclick="logoutUser(event)">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign Out</span>
        </button>
      `;
      wrap.appendChild(dropdown);
    }

    // Update Mobile Nav
    if (mobileNav && !document.getElementById('mobile-auth-account')) {
      const mobDiv = document.createElement('div');
      mobDiv.id = 'mobile-auth-account';
      mobDiv.style.cssText = "border-top:1px solid rgba(0,0,0,0.08); margin-top:16px; padding-top:16px;";
      mobDiv.innerHTML = `
        <a href="profile.html" style="font-weight:600; color:var(--primary); display:flex; align-items:center; gap:8px;">
          <span>👤 My Account (${firstName})</span>
        </a>
        <a href="javascript:void(0)" onclick="logoutUser(event)" style="color:#dc2626 !important; font-weight:600; display:flex; align-items:center; gap:8px;">
          <span>🚪 Sign Out</span>
        </a>
      `;
      mobileNav.appendChild(mobDiv);
    }
  } else {
    userIcon.setAttribute('href', 'login.html');
    userIcon.classList.remove('logged-in');
    userIcon.title = 'Sign In';

    // Update Mobile Nav for Guest
    if (mobileNav && !document.getElementById('mobile-auth-guest')) {
      const mobDiv = document.createElement('div');
      mobDiv.id = 'mobile-auth-guest';
      mobDiv.style.cssText = "border-top:1px solid rgba(0,0,0,0.08); margin-top:16px; padding-top:16px;";
      mobDiv.innerHTML = `
        <a href="login.html" style="font-weight:600; color:var(--primary); display:flex; align-items:center; gap:8px;">
          <span>👤 Sign In / Register</span>
        </a>
      `;
      mobileNav.appendChild(mobDiv);
    }
  }
}

// ===== PAGE GUARD FOR PROTECTED PAGES =====
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    // Preserve intended destination so login can redirect back
    const redirectTarget = window.location.pathname.split('/').pop();
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
  }
  return user;
}

function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const fullSearch = window.location.search;
  const fullTarget = currentPath + fullSearch;

  document.querySelectorAll('.navlinks .nav-item a, .mobile-navlinks a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === fullTarget || (fullTarget === 'index.html' && (href === 'index.html' || href === ''))) {
      link.classList.add('active');
      const navItem = link.closest('.nav-item');
      if (navItem) navItem.classList.add('active');
    } else if (!fullSearch && href === currentPath) {
      link.classList.add('active');
      const navItem = link.closest('.nav-item');
      if (navItem) navItem.classList.add('active');
    }
  });
}

// Run on every page load
document.addEventListener('DOMContentLoaded', updateAuthNavigation);
document.addEventListener('DOMContentLoaded', highlightActiveNav);

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();

  // Mobile Menu Drawer Handler
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-menu-overlay');
  const mobileClose = document.querySelector('.mobile-menu-close');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      if (mobileOverlay) mobileOverlay.classList.add('active');
    });
  }
  if (mobileOverlay && mobileMenu) {
    mobileOverlay.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      mobileOverlay.classList.remove('active');
    });
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
    });
  }

  // 1. Intersection Observer for Scroll Reveals
  const revealElements = document.querySelectorAll('.reveal');

  const revealOptions = {
    threshold: 0.01,
    rootMargin: "0px 0px 100px 0px"
  };

  const revealOnScroll = new IntersectionObserver(function (entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(el => {
    revealOnScroll.observe(el);
  });

  // Safety fallback: reveal all elements so nothing ever stays hidden on slow scroll or mobile
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.active)').forEach(el => el.classList.add('active'));
  }, 600);

  // 2. Sticky Header that hides on scroll down, shows on scroll up (Performance: requestAnimationFrame throttled)
  let lastScrollY = window.scrollY;
  const header = document.getElementById('main-header');
  let headerTicking = false;

  window.addEventListener('scroll', () => {
    if (!headerTicking) {
      window.requestAnimationFrame(() => {
        if (header) {
          if (window.scrollY > lastScrollY && window.scrollY > 150) {
            header.classList.add('hide');
          } else {
            header.classList.remove('hide');
          }
          lastScrollY = window.scrollY;
        }
        headerTicking = false;
      });
      headerTicking = true;
    }
  }, { passive: true });

  // 3. Product Card Click Handling
  // Note: For dynamically loaded cards, click handling is embedded in the HTML `onclick` on `.p-card-img`.
  // The legacy hardcoded product card listener has been removed to prevent broken redirects.

  // 4. Wishlist Interactions & Toast Notification
  const wishlistBtns = document.querySelectorAll('.p-wishlist');
  let toastTimer;

  // Create Toast Element
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);

  window.showToast = function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  };

  window.toggleWishlist = function (event, btnElement, id, name, price, image) {
    event.stopPropagation();

    // Check if currently active
    const isActive = btnElement.classList.contains('active');

    if (isActive) {
      window.jpWishlist.remove(id);
      btnElement.classList.remove('active');
      showToast('Item removed from favorites.');

      if (window.location.pathname.includes('favorites')) {
        const pCard = btnElement.closest('.p-card');
        if (pCard) {
          pCard.style.transition = 'opacity 0.3s ease';
          pCard.style.opacity = '0';
          setTimeout(() => pCard.remove(), 300);
        }
      }
    } else {
      window.jpWishlist.add({ id, name, price, image });
      btnElement.classList.add('active');
      showToast('Item saved to favorites.');
    }
  };

  // 4.5. Cart Interactions (Now handled dynamically via renderCart)

  // 4.6. Search Bar Logic
  let allProductsCache = null;

  const searchInputs = document.querySelectorAll('.global-search');
  searchInputs.forEach(input => {
    const searchBar = input.closest('.search-bar');

    // Create suggestion container
    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'search-suggestions';
    searchBar.appendChild(suggestionBox);
    searchBar.style.position = 'relative'; // Ensure relative positioning

    let debounceTimeout;

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      clearTimeout(debounceTimeout);

      if (!query) {
        suggestionBox.classList.remove('active');
        return;
      }

      debounceTimeout = setTimeout(() => {
        // Fetch or use cache
        const fetchPromise = allProductsCache
          ? Promise.resolve(allProductsCache)
          : fetch(window.getApiBase() + '/api/products').then(r => r.json());

        fetchPromise.then(products => {
          allProductsCache = products; // Cache globally

          const filtered = products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query))
          ).slice(0, 5); // Max 5 suggestions

          if (filtered.length > 0) {
            const regex = new RegExp(`(${query})`, 'gi');
            let html = `<div class="suggestion-header">Products</div>`;

            html += filtered.slice(0, 4).map(p => {
              const highlightedName = p.name.replace(regex, '<strong>$1</strong>');
              return `
              <div class="suggestion-item" onclick="window.location.href='product.html?id=${p.id}'">
                <img src="${p.image}" class="suggestion-img" onerror="this.src='assets/product_kurta_ivory.jpg'">
                <div class="suggestion-details">
                  <span class="suggestion-name">${highlightedName}</span>
                  <span class="suggestion-price">&#8377;${p.price.toFixed(2)}</span>
                </div>
              </div>
            `}).join('');

            if (filtered.length > 4) {
              html += `<div class="suggestion-view-all" onclick="window.location.href='search.html?q=${encodeURIComponent(query)}'">View all ${filtered.length} results</div>`;
            }

            suggestionBox.innerHTML = html;
            suggestionBox.classList.add('active');
          } else {
            suggestionBox.innerHTML = `
              <div class="suggestion-header">Products</div>
              <div class="suggestion-item" style="color:var(--ink-soft); justify-content:center; cursor:default; padding: 30px 20px;">No products found</div>
            `;
            suggestionBox.classList.add('active');
          }
        }).catch(err => console.error("Search error", err));
      }, 200); // Debounce delay
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchBar.contains(e.target)) {
        suggestionBox.classList.remove('active');
      }
    });

    input.addEventListener('focus', (e) => {
      if (e.target.value.trim()) {
        input.dispatchEvent(new Event('input')); // Retrigger search to show suggestions
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  });

  // 4.7. Hero Background Slider
  const heroSliderContainer = document.getElementById('dynamic-hero-slider');
  if (heroSliderContainer) {
    fetch(window.getApiBase() + '/api/hero-slides')
      .then(res => res.json())
      .then(slidesData => {
        if (!slidesData || slidesData.length === 0) {
          // Fallback to default slides
          heroSliderContainer.innerHTML = `
            <div class="slide active" style="background-image: url('assets/hero_bg.jpg');"></div>
            <div class="slide" style="background-image: url('assets/cotton_harvest.jpg');"></div>
            <div class="slide" style="background-image: url('assets/product_saree.jpg');"></div>
          `;
        } else {
          heroSliderContainer.innerHTML = slidesData.map((s, index) =>
            `<div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${s.image}');"></div>`
          ).join('');
        }
        initHeroSlider();
      })
      .catch(err => {
        console.error('Failed to load hero slides', err);
        initHeroSlider(); // Fallback
      });
  } else {
    initHeroSlider();
  }

  function initHeroSlider() {
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
          `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
        ).join('');
      }

      const dots = document.querySelectorAll('.hero-dot');

      const changeSlide = (index) => {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');

        currentSlide = (index + slides.length) % slides.length;

        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
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
  }

  // 5. Testimonial Drag to Scroll
  const slider = document.querySelector('.testimonial-row');
  if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.style.cursor = 'grab';

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });
    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // scroll speed multiplier
      slider.scrollLeft = scrollLeft - walk;
    });
  }

  // 6. 3D Cotton Journey Scroll Animation (Performance: requestAnimationFrame throttled)
  const journeySection = document.getElementById('cotton-journey');
  if (journeySection) {
    const steps = document.querySelectorAll('.j-step');
    const totalSteps = steps.length;
    let journeyTicking = false;

    window.addEventListener('scroll', () => {
      if (!journeyTicking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const sectionTop = journeySection.offsetTop;
          const sectionHeight = journeySection.offsetHeight;
          const windowHeight = window.innerHeight;

          let progress = (scrollY - sectionTop) / (sectionHeight - windowHeight);
          progress = Math.max(0, Math.min(1, progress));

          steps.forEach((step, index) => {
            const stepProgress = index / (totalSteps - 1);
            const distance = progress - stepProgress;
            const z = distance * 2000;

            let opacity = 1 - Math.abs(distance * 3);
            opacity = Math.max(0, Math.min(1, opacity));

            const rotateY = (index % 2 === 0 ? 1 : -1) * distance * 40;
            const rotateX = distance * 10;

            step.style.transform = `translateZ(${z}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            step.style.opacity = opacity;

            if (z > 800) {
              step.style.opacity = 0;
            }
          });
          journeyTicking = false;
        });
        journeyTicking = true;
      }
    }, { passive: true });

    // Trigger once to set initial transforms
    window.dispatchEvent(new Event('scroll'));
  }

  // 8. Dynamic Product Loading from Backend API (Phase 2)
  const dynamicContainer = document.getElementById('dynamic-products');
  if (dynamicContainer) {
    const categoryFilter = dynamicContainer.getAttribute('data-category');

    fetch(window.getApiBase() + '/api/products')
      .then(response => response.json())
      .then(products => {
        let filtered = products;

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
            (p.color && p.color.toLowerCase().includes(q)) ||
            (p.material && p.material.toLowerCase().includes(q))
          );

          const displayEl = document.getElementById('search-query-display');
          const titleEl = document.getElementById('search-query-title');
          const countEl = document.getElementById('search-count');
          const metaEl = document.getElementById('search-meta');

          if (titleEl) {
            titleEl.innerHTML = `Results for "<span style="color:var(--gold);">${searchQuery}</span>"`;
          }
          if (displayEl) displayEl.style.display = 'none';

          if (metaEl && filtered.length > 0) {
            metaEl.style.display = 'flex';
          }
          if (countEl) {
            countEl.textContent = `${filtered.length} Premium Item${filtered.length !== 1 ? 's' : ''} Found`;
          }
        } else if (categoryFilter) {
          const filterLower = categoryFilter.toLowerCase();
          filtered = products.filter(p => {
            const pCat = (p.category || '').toLowerCase();
            const pSub = (p.subcategory || '').toLowerCase();

            // Direct match
            if (pCat === filterLower || pSub === filterLower) return true;

            // Men's collection (Men, Men's Ethnic, Men's Cotton Essentials)
            if (filterLower.includes('men') && !filterLower.includes('women')) {
              return pCat.includes('men') && !pCat.includes('women');
            }

            // Women's Traditional / Pure Cotton
            if (filterLower.includes('traditional') || filterLower.includes('pure cotton')) {
              return pCat.includes('traditional') || pCat.includes('pure cotton');
            }

            // Women's Western / Breezy Cottons
            if (filterLower.includes('western') || filterLower.includes('breezy')) {
              return pCat.includes('western') || pCat.includes('breezy');
            }

            return pCat.includes(filterLower) || filterLower.includes(pCat);
          });
        }

        if (filtered.length === 0) {
          const metaEl = document.getElementById('search-meta');
          if (metaEl) metaEl.style.display = 'none';

          if (searchQuery) {
            dynamicContainer.innerHTML = `
              <div style="grid-column: span 12; text-align: center; padding: 100px 20px; background: #fafafa; border-radius: 8px; border: 1px solid rgba(0,0,0,0.03);">
                <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; stroke: var(--gold); stroke-width: 1.5; fill: none; margin-bottom: 24px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h2 style="font-family: var(--font-display); font-size: 32px; color: var(--indigo-d); margin-bottom: 12px; font-style: italic;">No matches found</h2>
                <p style="color: var(--ink-soft); margin-bottom: 32px; font-size: 15px;">We couldn't find anything matching "${searchQuery}".</p>
                <button onclick="window.location.href='womens-traditional.html'" class="btn-primary" style="padding: 14px 32px;">Explore Traditional Wear</button>
              </div>
            `;
          } else {
            dynamicContainer.innerHTML = '<p style="grid-column: span 12; text-align: center; color: #888; padding: 100px 0;">New arrivals coming soon to this collection.</p>';
          }
          return;
        }

        dynamicContainer.innerHTML = '';
        filtered.forEach(p => {
          const isWishlisted = window.jpWishlist.contains(p.id) ? 'active' : '';
          const hasOffer = p.original_price && Number(p.original_price) > Number(p.price);
          const discountPct = hasOffer ? Math.round(((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100) : 0;

          let offerBadgeHtml = '';
          if (p.offer_tag) {
            offerBadgeHtml = `<div class="p-tag offer-tag" style="position: absolute; top: 12px; left: 12px; background: linear-gradient(135deg, #b45309, #d97706); color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; z-index: 2; box-shadow: 0 2px 8px rgba(180,83,9,0.3);">${p.offer_tag}</div>`;
          } else if (hasOffer) {
            offerBadgeHtml = `<div class="p-tag offer-tag" style="position: absolute; top: 12px; left: 12px; background: #15803d; color: white; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; z-index: 2;">${discountPct}% OFF</div>`;
          }

          let priceBlockHtml = `<p class="price">&#8377;${Number(p.price).toFixed(2)}</p>`;
          if (hasOffer) {
            priceBlockHtml = `
              <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                <span class="price" style="font-weight: 700; color: #b45309;">&#8377;${Number(p.price).toFixed(2)}</span>
                <span style="font-size: 12px; text-decoration: line-through; color: #94a3b8;">&#8377;${Number(p.original_price).toFixed(2)}</span>
                <span style="font-size: 10px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${discountPct}% OFF</span>
              </div>
            `;
          }

          const cardHtml = `
            <div class="p-card">
              <div class="p-card-img" style="cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
                ${offerBadgeHtml}
                <div class="p-wishlist ${isWishlisted}" onclick="toggleWishlist(event, this, ${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                  <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                </div>
                <img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
                <img class="img-hover" src="${p.image}" alt="${p.name} Detail" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/product_kurta_ivory.jpg'">
                
                <!-- Quick Add Overlay -->
                <div class="quick-add-overlay" style="display: flex; gap: 8px; padding: 12px;">
                  <button type="button" onclick="event.stopPropagation(); openQuickView(${p.id});" class="btn-quick-add btn-quick-view" style="flex: 1; padding: 8px 10px; font-size: 11px; letter-spacing: 0.04em;">Quick View</button>
                  <button type="button" onclick="event.stopPropagation(); addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}');" class="btn-quick-add" style="flex: 1; padding: 8px 10px; font-size: 11px; letter-spacing: 0.04em;">+ Quick Add</button>
                </div>
              </div>
              <div onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer; padding-top: 8px;">
                <h3 style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">${p.name}</h3>
                ${priceBlockHtml}
              </div>
            </div>
          `;
          dynamicContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        dynamicContainer.innerHTML = '<p style="grid-column: span 12; text-align: center; color: red; padding: 100px 0;">Failed to load products from database.</p>';
      });
  }

  // 9. Shopping Cart & Wishlist Logic (Phase 3)
  const CART_KEY = "petal_cart";
  const WISHLIST_KEY = "petal_wishlist";

  window.jpWishlist = {
    get() {
      try {
        const stored = localStorage.getItem(WISHLIST_KEY) || localStorage.getItem('jpWishlist');
        return stored ? JSON.parse(stored) : [];
      } catch (e) { return []; }
    },
    save(wishlist) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      localStorage.setItem('jpWishlist', JSON.stringify(wishlist));
    },
    add(product) {
      const wishlist = this.get();
      if (!wishlist.find(i => i.id == product.id)) {
        wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
        this.save(wishlist);
        if (currentUser && currentUser.email) {
          fetch(window.getApiBase() + '/api/wishlist', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: currentUser.email, product_id: product.id })
          }).catch(e => console.error(e));
        }
      }
    },
    remove(productId) {
      let wishlist = this.get();
      wishlist = wishlist.filter(i => i.id != productId);
      this.save(wishlist);
      if (currentUser && currentUser.email) {
        fetch(window.getApiBase() + '/api/wishlist', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: currentUser.email, product_id: productId })
        }).catch(e => console.error(e));
      }
    },
    contains(productId) {
      return this.get().some(i => i.id == productId);
    },
    sync() {
      if (currentUser && currentUser.email) {
        fetch(`${window.getApiBase()}/api/wishlist/${currentUser.email}`)
          .then(res => res.json())
          .then(dbWishlist => {
            if (!dbWishlist || dbWishlist.error) return;
            const mapped = dbWishlist.map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image }));
            const local = this.get();
            const merged = [...local];
            mapped.forEach(dp => { if (!merged.find(lp => lp.id == dp.id)) merged.push(dp); });
            this.save(merged);
            document.dispatchEvent(new Event('wishlist-synced'));
          })
          .catch(e => console.error(e));
      }
    }
  };

  if (currentUser) {
    window.jpWishlist.sync();
  }

  window.jpCart = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
      } catch (e) { return []; }
    },
    save(cart) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    },
    add(product, qty = 1, size = null, color = null) {
      const cart = this.get();
      let lineId = product.id;
      if (color) lineId += `-${color}`;
      if (size) lineId += `-${size}`;

      const existing = cart.find(i => i.id == lineId);
      if (existing) {
        existing.qty = Math.min(10, (existing.qty || 1) + qty);
      } else {
        let displayName = product.name;
        let attrs = [];
        if (color) attrs.push(color);
        if (size) attrs.push(size);
        if (attrs.length > 0) displayName += ` (${attrs.join(', ')})`;

        cart.push({
          id: lineId,
          baseProductId: product.id,
          name: displayName,
          price: product.price,
          image: product.image,
          qty: qty || 1,
          size: size,
          color: color
        });
      }
      this.save(cart);
      if (window.updateCartCount) window.updateCartCount();
    }
  };

  window.addToCart = function (id, name, price, image) {
    window.jpCart.add({ id, name, price, image }, 1);
    showToast(name + ' added to cart!');
  };

  window.buyNow = function (id, name, price, image) {
    window.jpCart.add({ id, name, price, image }, 1);
    window.location.href = 'cart.html';
  };

  window.updateCartCount = function () {
    const cart = window.jpCart.get();
    const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => badge.innerText = count);
  }
  window.updateCartCount();

  window.renderFavorites = function () {
    const container = document.getElementById('dynamic-favorites');
    const emptyState = document.getElementById('fav-empty-state');
    if (!container || !emptyState) return;

    const favorites = window.jpWishlist.get();
    if (favorites.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = '';

    favorites.forEach(p => {
      const cardHtml = `
        <div class="p-card" id="fav-card-${p.id}">
          <div class="p-card-img" style="cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
            <div class="p-wishlist active" onclick="toggleWishlist(event, this, ${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></div>
            <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <h3 style="cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">${p.name}</h3>
          <p class="price" style="cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">&#8377;${parseFloat(p.price).toFixed(2)}</p>
          <button onclick="moveToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')" class="btn-primary" style="width: 100%; margin-top: 10px; padding: 12px; font-size: 13px;">Move to Cart</button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHtml);
    });
  };

  window.moveToCart = function (id, name, price, image) {
    // Requires going to product page if sizes/colors exist.
    // For now, we redirect to product page so they can select size/color.
    window.location.href = 'product.html?id=' + id;
  };

  window.renderCart = function () {
    const container = document.getElementById('cart-container');
    if (!container) return;

    const cart = window.jpCart.get();
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty" style="width:100%">
          <h2>Your Cart is Empty</h2>
          <p>Explore our collections and find something you love.</p>
          <a href="index.html" class="btn-primary">Shop Now</a>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    const itemsHtml = cart.map(item => {
      const itemTotal = item.price * (item.qty || 1);
      subtotal += itemTotal;
      let metaHtml = '';
      if (item.size || item.color) {
        metaHtml = `
          <div style="font-size: 12px; color: var(--ink-soft); margin-bottom: 6px;">
            ${item.color ? `<span>Color: <strong>${item.color}</strong></span>` : ''}
            ${item.color && item.size ? ' &bull; ' : ''}
            ${item.size ? `<span>Size: <strong>${item.size}</strong></span>` : ''}
          </div>
        `;
      }
      return `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-item-details">
            <h3>${item.name}</h3>
            ${metaHtml}
            <div class="price">&#8377;${item.price.toFixed(2)}</div>
            <div class="cart-item-actions">
              <div class="qty-selector">
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)" ${item.qty <= 1 ? 'disabled' : ''}>-</button>
                <input type="text" class="qty-input" value="${item.qty || 1}" readonly>
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
              </div>
              <button class="remove-btn" onclick="removeCartItem('${item.id}')">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    // Free Shipping Progress Calculation (Threshold: ₹1,999)
    const FREE_THRESHOLD = 1999;
    const diff = FREE_THRESHOLD - subtotal;
    const pct = Math.min(100, Math.round((subtotal / FREE_THRESHOLD) * 100));

    let shippingMsg = '';
    if (diff <= 0) {
      shippingMsg = '🎉 <strong>Congratulations!</strong> You unlocked <strong>FREE Insured Express Shipping!</strong>';
    } else {
      shippingMsg = 'Add <strong>₹' + Math.ceil(diff) + '</strong> more to unlock <strong>FREE Complimentary Shipping</strong>!';
    }

    const progressBarHtml = '<div class="cart-shipping-progress-card"><div class="cart-shipping-text">' + shippingMsg + '</div><div class="cart-shipping-bar-track"><div class="cart-shipping-bar-fill" style="width:' + pct + '%;"></div></div></div>';

    container.innerHTML = `
      <div class="cart-items">
        ${progressBarHtml}
        ${itemsHtml}
      </div>
      <div class="cart-summary">
        <div style="font-family: var(--font-display); font-size: 24px; color: var(--indigo-d); margin-bottom: 24px;">Order Summary</div>
        <div class="summary-row"><span>Subtotal</span><span>&#8377;${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>Free</span></div>
        <div class="summary-row"><span>Estimated Tax (5%)</span><span>&#8377;${tax.toFixed(2)}</span></div>
        <div class="summary-total"><span>Total</span><span>&#8377;${total.toFixed(2)}</span></div>
        <button class="btn-primary checkout-btn" onclick="window.location.href='checkout.html';">Proceed to Checkout</button>
      </div>
    `;
  };

  window.updateCartItemQty = function (id, change) {
    const cart = window.jpCart.get();
    const item = cart.find(i => i.id == id);
    if (item) {
      item.qty = Math.max(1, (item.qty || 1) + change);
      window.jpCart.save(cart);
      window.updateCartCount();
      window.renderCart();
    }
  };

  window.removeCartItem = function (id) {
    let cart = window.jpCart.get();
    cart = cart.filter(i => i.id != id);
    window.jpCart.save(cart);
    window.updateCartCount();
    window.renderCart();
    showToast('Item removed from cart.');
  };

  if (window.location.pathname.includes('cart')) {
    window.renderCart();
  } else if (window.location.pathname.includes('checkout')) {
    if (typeof window.renderCheckout === 'function') {
      window.renderCheckout();
    }
  } else if (window.location.pathname.includes('favorites')) {
    if (typeof window.renderFavorites === 'function') {
      window.renderFavorites();
    }
  }

  // 10. User Session Navigation Hook
  updateAuthNavigation();


  // Dynamic Curated Edits Showcase Synchronization
  const curatedWomenImg = document.getElementById('curated-women-img');
  if (curatedWomenImg) {
    fetch(window.getApiBase() + '/api/content')
      .then(res => res.json())
      .then(content => {
        if (!content) return;
        const wImg = document.getElementById('curated-women-img');
        const wTitle = document.getElementById('curated-women-title');
        const wDesc = document.getElementById('curated-women-desc');
        if (wImg && content.curated_women_img) wImg.src = content.curated_women_img;
        if (wTitle && content.curated_women_title) wTitle.textContent = content.curated_women_title;
        if (wDesc && content.curated_women_desc) wDesc.textContent = content.curated_women_desc;

        const mImg = document.getElementById('curated-men-img');
        const mTitle = document.getElementById('curated-men-title');
        const mDesc = document.getElementById('curated-men-desc');
        if (mImg && content.curated_men_img) mImg.src = content.curated_men_img;
        if (mTitle && content.curated_men_title) mTitle.textContent = content.curated_men_title;
        if (mDesc && content.curated_men_desc) mDesc.textContent = content.curated_men_desc;

        const kImg = document.getElementById('curated-kids-img');
        const kTitle = document.getElementById('curated-kids-title');
        const kDesc = document.getElementById('curated-kids-desc');
        if (kImg && content.curated_kids_img) kImg.src = content.curated_kids_img;
        if (kTitle && content.curated_kids_title) kTitle.textContent = content.curated_kids_title;
        if (kDesc && content.curated_kids_desc) kDesc.textContent = content.curated_kids_desc;
      })
      .catch(() => { });
  }

  // 11. Dynamic Homepage Curated Edits & Categories (Phase 6)
  const trioGrid = document.getElementById('curated-trio-grid');
  const categoryGrid = document.getElementById('dynamic-categories');
  const catApiBase = (window.location.port === "3000" || window.location.port === "") ? "" : (window.location.origin.includes('127.0.0.1') ? "http://127.0.0.1:3000" : "http://localhost:3000");

  if (trioGrid || categoryGrid) {
    fetch(`${catApiBase}/api/categories`)
      .then(res => res.json())
      .then(categories => {
        if (!Array.isArray(categories) || categories.length === 0) return;

        // Legacy dynamic-categories container support
        if (categoryGrid) {
          categoryGrid.innerHTML = '';
          const mainCats = categories.filter(c => !c.parent_category && c.name !== 'Men' && c.name !== 'Women');
          const displayList = mainCats.length > 0 ? mainCats : categories.slice(0, 6);
          const sizeClasses = ['large', 'small', 'half', 'half'];
          displayList.forEach((c, index) => {
            const sizeClass = sizeClasses[index % sizeClasses.length];
            const catHtml = `
              <a href="${c.link}" class="cat-card ${sizeClass}">
                <img src="${c.image}" alt="${c.name}" style="width:100%; height:100%; object-fit:cover;">
                <div class="cat-overlay"><h3>${c.name}</h3></div>
              </a>
            `;
            categoryGrid.insertAdjacentHTML('beforeend', catHtml);
          });
        }

        // Modern Curated Edits trio grid silhouette count synchronization
        if (trioGrid) {
          const womenCount = categories.filter(c => c.parent_category === 'Women' || (c.name && c.name.toLowerCase().includes('women'))).length;
          const menCount = categories.filter(c => c.parent_category === 'Men' || (c.name && c.name.toLowerCase().includes('men'))).length;
          const kidsCount = categories.filter(c => c.parent_category === 'Kids' || (c.name && c.name.toLowerCase().includes('kid'))).length;

          const cards = trioGrid.querySelectorAll('.curated-pillar-card');
          if (cards.length >= 3) {
            const womenTag = cards[0].querySelector('.curated-card-tag');
            if (womenTag && womenCount > 0) womenTag.textContent = `${womenCount} Silhouettes`;

            const menTag = cards[1].querySelector('.curated-card-tag');
            if (menTag && menCount > 0) menTag.textContent = `${menCount} Silhouettes`;

            const kidsTag = cards[2].querySelector('.curated-card-tag');
            if (kidsTag && kidsCount > 0) kidsTag.textContent = `${kidsCount} Silhouettes`;
          }
        }
      })
      .catch(err => {
        console.warn('Notice: categories could not be dynamically fetched:', err);
      });
  }

  // 12. Reviews Logic (Phase 7)
  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');
  const pdpParams = new URLSearchParams(window.location.search);
  const PRODUCT_ID = pdpParams.get('id') || '24';

  if (reviewsList) {
    // Load reviews
    const loadProductReviews = () => {
      fetch(`${window.getApiBase()}/api/reviews/${PRODUCT_ID}`)
        .then(res => res.json())
        .then(reviews => {
          if (reviews.length === 0) {
            reviewsList.innerHTML = '<div style="color:#888; font-style:italic;">No reviews yet. Be the first to review this product!</div>';
            return;
          }
          reviewsList.innerHTML = '';
          reviews.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const stars = '<span style="color:#d4af37; font-size:16px;">★</span>'.repeat(r.rating) + '<span style="color:#ccc; font-size:16px;">☆</span>'.repeat(5 - r.rating);
            reviewsList.innerHTML += `
              <div style="padding-bottom: 24px; border-bottom: 1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 8px;">
                  <strong style="font-size: 16px;">${r.customer_name}</strong>
                  <span style="color:#888; font-size:13px;">${date}</span>
                </div>
                <div style="margin-bottom: 8px;">${stars}</div>
                <p style="color:#444; line-height: 1.6;">${r.comment}</p>
              </div>
            `;
          });
        });
    };

    loadProductReviews();

    // Submit review
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
          product_id: PRODUCT_ID,
          customer_name: document.getElementById('rev-name').value,
          rating: parseInt(document.getElementById('rev-rating').value),
          comment: document.getElementById('rev-comment').value
        };

        fetch(window.getApiBase() + '/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json())
          .then(data => {
            document.getElementById('review-msg').style.display = 'block';
            reviewForm.reset();
            loadProductReviews(); // Reload list
            setTimeout(() => document.getElementById('review-msg').style.display = 'none', 3000);
          })
          .catch(err => console.error(err));
      });
    }
  }

  // 13. Content Management System (CMS) Logic
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroButton = document.getElementById('hero-button');

  if (heroTitle && heroSubtitle && heroButton) {
    let cachedCms = null;
    try { cachedCms = sessionStorage.getItem('jp_cms_content'); } catch (e) { }
    if (cachedCms) {
      try {
        const content = JSON.parse(cachedCms);
        if (content.hero_title) heroTitle.innerHTML = content.hero_title;
        if (content.hero_subtitle) heroSubtitle.innerText = content.hero_subtitle;
        if (content.hero_button) heroButton.innerText = content.hero_button;
      } catch (e) { }
    }

    fetch(window.getApiBase() + '/api/content')
      .then(res => res.json())
      .then(content => {
        try { sessionStorage.setItem('jp_cms_content', JSON.stringify(content)); } catch (e) { }
        if (content.hero_title) heroTitle.innerHTML = content.hero_title;
        if (content.hero_subtitle) heroSubtitle.innerText = content.hero_subtitle;
        if (content.hero_button) heroButton.innerText = content.hero_button;
      })
      .catch(err => console.error('Failed to load CMS content:', err));
  }

  // 14. Global Settings Logic (Cached in sessionStorage for instantaneous navigation)
  let cachedSettings = null;
  try { cachedSettings = sessionStorage.getItem('jp_store_settings'); } catch (e) { }
  if (cachedSettings) {
    try {
      const settings = JSON.parse(cachedSettings);
      applySettings(settings);
    } catch (e) { }
  }

  function applySettings(settings) {
    if (settings.store_name && !window.location.pathname.includes('admin.html')) {
      document.title = document.title.split('–')[0] + '– ' + settings.store_name;
    }
    if (settings.festive_banner_active === 'true' && settings.festive_banner_text && !window.location.pathname.includes('admin.html')) {
      renderFestiveTopBanner(settings.festive_banner_text, settings.festive_banner_code);
    }
  }

  fetch(window.getApiBase() + '/api/settings')
    .then(res => res.json())
    .then(settings => {
      try { sessionStorage.setItem('jp_store_settings', JSON.stringify(settings)); } catch (e) { }
      applySettings(settings);
    })
    .catch(err => console.error('Failed to load settings:', err));

  function renderFestiveTopBanner(bannerText, promoCode) {
    if (document.getElementById('festive-top-announcement')) return;

    const banner = document.createElement('div');
    banner.id = 'festive-top-announcement';
    banner.style.cssText = `
      background: linear-gradient(90deg, #781d1d, #b45309, #92400e, #781d1d);
      background-size: 200% 200%;
      color: #ffffff;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-align: center;
      position: relative;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    `;

    let codeButtonHtml = '';
    if (promoCode) {
      codeButtonHtml = `
        <button id="btn-copy-festive-code" onclick="copyFestivePromoCode('${promoCode}')" style="
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.45);
          color: #ffffff;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        ">
          Code: <strong>${promoCode}</strong> 📋
        </button>
      `;
    }

    banner.innerHTML = `
      <span>${bannerText}</span>
      ${codeButtonHtml}
    `;

    document.body.prepend(banner);
  }

  window.copyFestivePromoCode = function (code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-festive-code');
        if (btn) {
          btn.innerHTML = `Copied <strong>${code}</strong>! ✨`;
          btn.style.background = '#15803d';
          setTimeout(() => {
            btn.innerHTML = `Code: <strong>${code}</strong> 📋`;
            btn.style.background = 'rgba(255,255,255,0.22)';
          }, 3000);
        }
      });
    }
  };

  // 15. Single Product Page Dynamic Loading
  if (window.location.pathname.includes('product')) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const targetUrl = productId
      ? `${window.getApiBase()}/api/products/${productId}`
      : `${window.getApiBase()}/api/products`;

    fetch(targetUrl)
      .then(res => res.json())
      .then(data => {
        const product = Array.isArray(data) ? (data.find(p => p.id === 24) || data[0]) : data;
        if (!product || product.error) {
          console.error('Product not found in DB.');
          const info = document.querySelector('.pdp-info');
          const gallery = document.querySelector('.pdp-gallery');
          if (gallery) gallery.innerHTML = '<div style="grid-column: span 2; padding: 100px 0; text-align: center; color: var(--ink-muted);">Image not available.</div>';
          if (info) info.innerHTML = '<div style="padding: 100px 0; text-align: center;"><h2>Product Not Found</h2><p style="margin-top:16px; color:var(--ink-soft);">The product you are looking for does not exist or has been removed.</p><a href="index.html" class="btn-primary" style="display:inline-block; margin-top:24px;">Return to Shop</a></div>';
          return;
        }

        document.title = `${product.name} – JP Cotton`;

        // Update Images
        const gallery = document.querySelector('.pdp-gallery');
        if (gallery) {
          let imagesHtml = '';
          let galleryImages = [];
          if (product.gallery) {
            try {
              galleryImages = JSON.parse(product.gallery);
            } catch (e) { }
          }

          if (galleryImages.length > 0) {
            imagesHtml = galleryImages.map((img, idx) => {
              let style = '';
              if (galleryImages.length > 2 && idx === galleryImages.length - 1 && idx % 2 === 0) {
                style = 'style="grid-column: span 2;"';
              }
              return `<img src="${img}" alt="${product.name} Image ${idx + 1}" ${style}>`;
            }).join('');
          } else {
            imagesHtml = `
                <img src="${product.image}" alt="${product.name} Front">
                <img src="${product.image}" alt="${product.name} Detail">
                <img src="${product.image}" alt="${product.name} Close Up" style="grid-column: span 2;">
              `;
          }
          gallery.innerHTML = imagesHtml;
        }

        // Update Info
        const info = document.querySelector('.pdp-info');
        if (info) {

          const btnHtml = `
              <div style="display: flex; gap: 8px;">
                <button class="btn-primary" style="flex: 1; padding: 18px; border-radius: 0; font-size: 14px;">Add to Cart &mdash; &#8377;${product.price.toFixed(2)}</button>
                <button class="btn-primary" style="flex: 1; padding: 18px; border-radius: 0; font-size: 14px;">Buy Now</button>
              </div>
            `;

          // Build Color Selector HTML if color exists
          let colorSelectorHtml = '';
          let colorArray = [];
          let selectedColor = null;
          if (product.color && product.color.trim() !== '') {
            colorArray = product.color.split(',').map(s => s.trim()).filter(Boolean);
            if (colorArray.length === 1) {
              selectedColor = colorArray[0];
              colorSelectorHtml = `
                  <div class="size-selector" style="margin-bottom: 20px;">
                    <div class="size-header">
                      <span>Garment Color</span>
                      <span style="font-size:12px; font-weight:600; color:var(--indigo-d);">${colorArray[0]}</span>
                    </div>
                    <div style="display:inline-flex; align-items:center; gap:8px; padding:7px 14px; background:rgba(44,62,80,0.04); border:1px solid rgba(44,62,80,0.12); border-radius:6px; font-size:13px; font-weight:500;">
                      <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#2c3e50; opacity:0.8;"></span>
                      <span>${colorArray[0]} &bull; Artisanal Hand-Dyed</span>
                    </div>
                  </div>
                `;
            } else if (colorArray.length > 1) {
              const colorButtons = colorArray.map(c => `<button class="size-btn color-btn" data-color="${c}">${c}</button>`).join('');
              colorSelectorHtml = `
                  <div class="size-selector" style="margin-bottom: 20px;">
                    <div class="size-header">
                      <span>Select Color</span>
                      <span style="font-size:12px; color:var(--ink-soft);">${colorArray.length} options</span>
                    </div>
                    <div class="size-grid" id="dyn-color-grid">
                      ${colorButtons}
                    </div>
                    <div class="size-error" id="dyn-color-error" style="color: #d9534f; font-size: 12px; margin-top: 10px; display: none;">Please select a color before adding to cart.</div>
                  </div>
                `;
            }
          }

          // Material Info
          const materialText = product.material ? `<p style="font-size: 13px; color: var(--ink-soft); margin-top: 12px;"><strong>Material:</strong> ${product.material}</p>` : '';

          let pdpPriceHtml = `<div class="pdp-price">₹${Number(product.price).toFixed(2)}</div>`;
          if (product.original_price && Number(product.original_price) > Number(product.price)) {
            const diff = Number(product.original_price) - Number(product.price);
            const pct = Math.round((diff / Number(product.original_price)) * 100);
            pdpPriceHtml = `
                <div class="pdp-price-wrap" style="margin-bottom: 24px;">
                  <div style="display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;">
                    <span style="font-size: 30px; font-weight: 700; color: #b45309;">₹${Number(product.price).toFixed(2)}</span>
                    <span style="font-size: 18px; text-decoration: line-through; color: #94a3b8;">₹${Number(product.original_price).toFixed(2)}</span>
                    <span style="font-size: 12px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 4px 10px; border-radius: 20px;">${pct}% OFF</span>
                  </div>
                  ${product.offer_tag ? `<div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 5px 12px; border-radius: 6px; margin-top: 10px;">${product.offer_tag} · You save ₹${diff.toFixed(2)}!</div>` : `<div style="font-size: 13px; color: #15803d; font-weight: 600; margin-top: 6px;">🎉 Special Offer: You save ₹${diff.toFixed(2)} (${pct}% OFF)!</div>`}
                </div>
              `;
          }

          // Dynamic Sizing Engine
          let sizeArray = (product.sizes || 'XS, S, M, L, XL').split(',').map(s => s.trim()).filter(Boolean);
          if (sizeArray.length === 0) sizeArray = ['Free Size'];

          const isFreeSize = sizeArray.length === 1 && (sizeArray[0].toLowerCase().includes('free') || sizeArray[0].toLowerCase().includes('one size'));
          let selectedSize = isFreeSize ? sizeArray[0] : (sizeArray.length === 1 ? sizeArray[0] : null);

          let sizeSelectorHtml = '';
          if (isFreeSize) {
            sizeSelectorHtml = `
                <div class="size-selector" style="margin-bottom: 24px;">
                  <div class="size-header">
                    <span>Fit &amp; Sizing</span>
                    <span style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">Universal Fit</span>
                  </div>
                  <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #334155; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🥻</span>
                    <div>
                      <div style="font-weight: 600; color: #0f172a;">${sizeArray[0]} (Universal Drape)</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Handcrafted traditional dimensions designed to drape comfortably across all body types.</div>
                    </div>
                  </div>
                </div>
              `;
          } else {
            let sizeStockMap = {};
            try {
              sizeStockMap = typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : (product.size_stock || {});
            } catch (e) { }

            const sizeButtons = sizeArray.map(s => {
              const sQty = sizeStockMap[s] !== undefined ? parseInt(sizeStockMap[s]) : 99;
              const isOutOfStock = sQty <= 0;
              const activeCls = (sizeArray.length === 1 && !isOutOfStock) ? ' active' : '';
              const disabledCls = isOutOfStock ? ' out-of-stock' : '';
              const disabledAttr = isOutOfStock ? ' disabled style="opacity:0.4; cursor:not-allowed; text-decoration:line-through;"' : '';
              return `<button class="size-btn${activeCls}${disabledCls}" data-size="${s}" data-qty="${sQty}" ${disabledAttr}>${s}${isOutOfStock ? ' (Sold Out)' : ''}</button>`;
            }).join('');

            sizeSelectorHtml = `
                <div class="size-selector" style="margin-bottom: 24px;">
                  <div class="size-header">
                    <span>Select Size</span>
                    <a href="returns.html#size-guide" target="_blank" style="text-decoration:underline;">Size Guide</a>
                  </div>
                  <div class="size-grid" id="dyn-size-grid">
                    ${sizeButtons}
                  </div>
                  <div id="dyn-size-stock-hint" style="font-size: 12px; margin-top: 8px; color: #166534; font-weight: 600; display: none;"></div>
                  <div class="size-error" id="dyn-size-error" style="color: #d9534f; font-size: 12px; margin-top: 10px; display: none;">Please select a size before adding to cart.</div>
                </div>
              `;
          }

          info.innerHTML = `
              <h1>${product.name}</h1>
              ${pdpPriceHtml}
              <p class="pdp-desc">${product.description || 'Elevated everyday cotton clothing, woven close to the source.'}</p>
              ${materialText}
              
              ${colorSelectorHtml}
              ${sizeSelectorHtml}

              <div class="qty-selector" style="display: flex; border: 1px solid rgba(0,0,0,0.1); width: fit-content; margin-bottom: 24px;">
                <button class="qty-btn" id="dyn-qty-dec" style="padding: 10px 16px; background: none; border: none; cursor: pointer; color: var(--ink-soft);">-</button>
                <input type="text" class="qty-input" id="dyn-qty-input" value="1" readonly style="width: 48px; text-align: center; border: none; border-left: 1px solid rgba(0,0,0,0.1); border-right: 1px solid rgba(0,0,0,0.1); background: transparent; font-family: var(--font-body);">
                <button class="qty-btn" id="dyn-qty-inc" style="padding: 10px 16px; background: none; border: none; cursor: pointer; color: var(--ink-soft);">+</button>
              </div>

              ${btnHtml}
              <div class="add-confirm" id="dyn-add-confirm" style="margin-top: 14px; font-size: 13px; color: #27ae60; display: none; text-align: center;">Added to your cart.</div>
              <!-- Pincode Delivery Estimator -->
              <div class="pdp-delivery-card">
                <div class="pdp-delivery-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  <span>Estimated Delivery &amp; Pincode</span>
                </div>
                <div class="pdp-pincode-input-row">
                  <input type="text" id="dyn-pincode-input" placeholder="Enter 6-digit Pincode" maxlength="6">
                  <button type="button" id="dyn-pincode-btn">Check</button>
                </div>
                <div id="dyn-pincode-result" class="pdp-pincode-result" style="display: none;"></div>
              </div>

              <div class="accordion" style="margin-top: 36px; border-top: 1px solid rgba(0,0,0,0.05);">
                <div class="acc-item" style="border-bottom: 1px solid rgba(0,0,0,0.05); padding: 24px 0; font-size: 13px; color: var(--ink-soft);">
                  <h4 style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--indigo-d); margin-bottom: 8px;">Fabric & Care</h4>
                  <p>100% pure cotton. Hand wash cold with mild detergent. Line dry in shade.</p>
                </div>
                <div class="acc-item" style="border-bottom: 1px solid rgba(0,0,0,0.05); padding: 24px 0; font-size: 13px; color: var(--ink-soft);">
                  <h4 style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--indigo-d); margin-bottom: 8px;">Shipping & Returns</h4>
                  <p>Complimentary shipping on orders over ₹3,000. Free 14-day returns.</p>
                </div>
              </div>
            `;

          // Attach Dynamic Event Listeners
          let qty = 1;

          const colorGrid = info.querySelector('#dyn-color-grid');
          const colorError = info.querySelector('#dyn-color-error');
          if (colorGrid) {
            colorGrid.addEventListener('click', (e) => {
              const btn = e.target.closest('.color-btn');
              if (!btn) return;
              selectedColor = btn.dataset.color;
              colorGrid.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              if (colorError) colorError.style.display = 'none';
            });
          }

          const sizeGrid = info.querySelector('#dyn-size-grid');
          const sizeError = info.querySelector('#dyn-size-error');
          const sizeHint = info.querySelector('#dyn-size-stock-hint');
          if (sizeGrid) {
            sizeGrid.addEventListener('click', (e) => {
              const btn = e.target.closest('.size-btn');
              if (!btn || btn.disabled) return;
              selectedSize = btn.dataset.size;
              const sQty = parseInt(btn.dataset.qty) || 0;
              sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              if (sizeError) sizeError.style.display = 'none';

              if (sizeHint) {
                if (sQty <= 0) {
                  sizeHint.style.color = '#dc2626';
                  sizeHint.innerHTML = `⚠️ Size ${selectedSize} is currently out of stock.`;
                  sizeHint.style.display = 'block';
                } else if (sQty <= 3) {
                  sizeHint.style.color = '#d97706';
                  sizeHint.innerHTML = `⚡ Hurry, only ${sQty} piece${sQty > 1 ? 's' : ''} left in Size ${selectedSize}!`;
                  sizeHint.style.display = 'block';
                } else {
                  sizeHint.style.color = '#15803d';
                  sizeHint.innerHTML = `✓ Size ${selectedSize} is in stock (${sQty} available).`;
                  sizeHint.style.display = 'block';
                }
              }
            });
          }

          const qtyInput = info.querySelector('#dyn-qty-input');
          const qtyDec = info.querySelector('#dyn-qty-dec');
          const qtyInc = info.querySelector('#dyn-qty-inc');

          function renderQty() {
            qtyInput.value = qty;
            qtyDec.style.opacity = qty <= 1 ? "0.35" : "1";
            qtyDec.style.pointerEvents = qty <= 1 ? "none" : "auto";
            qtyInc.style.opacity = qty >= 10 ? "0.35" : "1";
            qtyInc.style.pointerEvents = qty >= 10 ? "none" : "auto";
          }
          qtyDec.addEventListener('click', () => { qty = Math.max(1, qty - 1); renderQty(); });
          qtyInc.addEventListener('click', () => { qty = Math.min(10, qty + 1); renderQty(); });
          renderQty();

          // Pincode Estimator Execution
          var pinBtn = info.querySelector('#dyn-pincode-btn');
          var pinInput = info.querySelector('#dyn-pincode-input');
          var pinResult = info.querySelector('#dyn-pincode-result');
          if (pinBtn && pinInput && pinResult) {
            pinBtn.onclick = function () {
              var pin = (pinInput.value || '').trim();
              if (!/^\d{6}$/.test(pin)) {
                pinResult.className = 'pdp-pincode-result invalid';
                pinResult.innerHTML = '⚠️ Please enter a valid 6-digit Indian postal pincode.';
                pinResult.style.display = 'block';
                return;
              }
              var delDate = new Date();
              delDate.setDate(delDate.getDate() + 3);
              var dateStr = delDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
              pinResult.className = 'pdp-pincode-result valid';
              pinResult.innerHTML = '<div>🚚 <strong>Express Delivery to ' + pin + ' by ' + dateStr + '</strong></div><div style="font-size:11px; margin-top:3px; color:#166534;">• Complimentary insured shipping on orders over ₹1,999</div><div style="font-size:11px; color:#166534;">• Cash on Delivery (COD) & Instant UPI available</div>';
              pinResult.style.display = 'block';
            };
          }

          // Mobile Sticky Add to Bag Bar
          var stickyBar = document.getElementById('mobile-sticky-bar');
          if (!stickyBar) {
            stickyBar = document.createElement('div');
            stickyBar.id = 'mobile-sticky-bar';
            stickyBar.className = 'mobile-sticky-bar';
            stickyBar.innerHTML = '<div class="mobile-sticky-info"><div class="mobile-sticky-title">' + product.name + '</div><div class="mobile-sticky-price">₹' + Number(product.price).toFixed(2) + '</div></div><button type="button" class="mobile-sticky-btn" id="mobile-sticky-add-btn">Add to Bag</button>';
            document.body.appendChild(stickyBar);

            var stickyAddBtn = document.getElementById('mobile-sticky-add-btn');
            if (stickyAddBtn) {
              stickyAddBtn.onclick = function () {
                var mainAddBtn = info.querySelector('.btn-primary');
                if (mainAddBtn) mainAddBtn.click();
              };
            }

            window.addEventListener('scroll', function () {
              if (window.innerWidth <= 768) {
                if (window.scrollY > 350) stickyBar.classList.add('visible');
                else stickyBar.classList.remove('visible');
              }
            });
          }

          // Handle Add to cart dynamically
          info.querySelectorAll('.btn-primary').forEach(btn => {
            if (btn.textContent.includes('Buy Now') || btn.textContent.includes('Add to Cart')) {
              btn.onclick = (e) => {
                e.preventDefault();
                let valid = true;
                if (colorGrid && !selectedColor) {
                  if (colorError) colorError.style.display = 'block';
                  valid = false;
                }
                if (sizeGrid && !selectedSize) {
                  if (sizeError) sizeError.style.display = 'block';
                  valid = false;
                }
                if (!valid) return;

                window.jpCart.add({ id: product.id, name: product.name, price: product.price, image: product.image }, qty, selectedSize, selectedColor);

                if (btn.textContent.includes('Buy Now')) {
                  window.location.href = 'cart.html';
                } else {
                  const confirmMsg = info.querySelector('#dyn-add-confirm');
                  confirmMsg.style.display = 'block';
                  updateCartCount();
                  setTimeout(() => { confirmMsg.style.display = 'none'; }, 2500);
                }
              };
            }
          });

        }
      })
      .catch(err => console.error('Error fetching product details:', err));
  }

});


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

// Performance: Debounced DOM observer so animations attach smoothly without recursive DOM thrash
let _animDebounceTimer = null;
const domObserver = new MutationObserver(() => {
  if (_animDebounceTimer) clearTimeout(_animDebounceTimer);
  _animDebounceTimer = setTimeout(window.attachScrollAnimations, 150);
});

if (document.body) {
  domObserver.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    }
  });
}

/* --- Shop The Look Hotspot Interactivity --- */
document.addEventListener('DOMContentLoaded', () => {
  const hotspots = document.querySelectorAll('.hotspot');
  if (hotspots.length > 0) {
    hotspots.forEach(spot => {
      spot.addEventListener('click', (e) => {
        // If clicking a link inside tooltip, allow navigation
        if (e.target.closest('a')) return;
        e.stopPropagation();
        const isActive = spot.classList.contains('active');
        hotspots.forEach(s => s.classList.remove('active'));
        if (!isActive) spot.classList.add('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hotspot')) {
        hotspots.forEach(s => s.classList.remove('active'));
      }
    });
  }
});


// ===== LUXURY E-COMMERCE SUITE ENHANCEMENTS =====
window.copyPromoCode = function (code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function () {
      if (window.showToast) window.showToast('Promo code "' + code + '" copied! 10% off at checkout.');
      else alert('Promo code "' + code + '" copied!');
    }).catch(function () {
      if (window.showToast) window.showToast('Use code "' + code + '" at checkout for 10% off.');
    });
  } else {
    if (window.showToast) window.showToast('Use code "' + code + '" at checkout for 10% off.');
  }
};

function injectAnnouncementBar() {
  if (document.getElementById('top-announcement-bar')) return;
  var header = document.getElementById('main-header');
  if (!header) return;
  var bar = document.createElement('div');
  bar.id = 'top-announcement-bar';
  bar.className = 'top-announcement-bar';
  bar.innerHTML = '<div class="announcement-content"><span>✨ <strong>Complimentary Insured Shipping</strong> on orders above ₹1,999</span><span class="announcement-sep">•</span><span>Use Code <button type="button" class="announcement-code-badge" onclick="copyPromoCode(\'HERITAGE\')" title="Click to copy promo code">HERITAGE</button> for 10% Off</span></div>';
  header.parentNode.insertBefore(bar, header);
}

function injectConciergeFloat() {
  if (document.getElementById('concierge-float-btn')) return;
  var btn = document.createElement('a');
  btn.id = 'concierge-float-btn';
  btn.className = 'concierge-float';
  btn.href = 'contact.html';
  btn.title = 'Artisan Concierge & Styling Help';
  btn.innerHTML = '<span class="concierge-pulse"></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>Concierge</span>';
  document.body.appendChild(btn);
}

function injectLuxurySuiteFeatures() {
  injectAnnouncementBar();
  injectConciergeFloat();
  injectQuickViewModal();
}

document.addEventListener('DOMContentLoaded', injectLuxurySuiteFeatures);


// ===== PRODUCT QUICK-VIEW MODAL & THE LOOM CIRCLE =====
window._currentQuickViewProduct = null;

function injectQuickViewModal() {
  if (document.getElementById('quickview-modal-overlay')) return;
  var div = document.createElement('div');
  div.id = 'quickview-modal-overlay';
  div.className = 'quickview-modal-overlay';
  div.setAttribute('onclick', 'closeQuickView(event)');
  div.innerHTML = `
    <div class="quickview-modal" onclick="event.stopPropagation()">
      <button type="button" class="quickview-close-btn" onclick="closeQuickView()" aria-label="Close modal">&times;</button>
      <div class="quickview-grid">
        <div class="quickview-img-wrap">
          <img id="qv-img" src="assets/product_kurta_ivory.jpg" alt="Product Quick View">
        </div>
        <div class="quickview-details">
          <div class="quickview-category" id="qv-category">PURE HANDLOOM COTTON</div>
          <h2 class="quickview-title" id="qv-title">Handloom Silhouette</h2>
          <div class="quickview-price-row">
            <span class="quickview-price-curr" id="qv-price">&#8377;1,899.00</span>
            <span class="quickview-price-orig" id="qv-original-price">&#8377;2,499.00</span>
            <span class="quickview-discount-pill" id="qv-discount">24% OFF</span>
          </div>
          <p class="quickview-desc" id="qv-desc">Artisanal 100% natural cotton silhouette hand-finished with meticulous precision, feather-light breathability, and generous fluid drape.</p>
          
          <div class="quickview-size-label">Select Size</div>
          <div class="quickview-sizes" id="qv-sizes">
            <button type="button" class="quickview-size-btn" onclick="selectQuickViewSize(this, 'S')">S</button>
            <button type="button" class="quickview-size-btn active" onclick="selectQuickViewSize(this, 'M')">M</button>
            <button type="button" class="quickview-size-btn" onclick="selectQuickViewSize(this, 'L')">L</button>
            <button type="button" class="quickview-size-btn" onclick="selectQuickViewSize(this, 'XL')">XL</button>
            <button type="button" class="quickview-size-btn" onclick="selectQuickViewSize(this, 'XXL')">XXL</button>
          </div>

          <div class="quickview-actions">
            <button type="button" class="quickview-add-btn" id="qv-add-btn" onclick="addQuickViewToCart()">Add To Bag &bull; Free Shipping</button>
            <a href="#" class="quickview-pdp-link" id="qv-pdp-link">Full Details &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

window.openQuickView = function (productId) {
  injectQuickViewModal();
  var overlay = document.getElementById('quickview-modal-overlay');
  if (!overlay) return;

  var titleEl = document.getElementById('qv-title');
  var catEl = document.getElementById('qv-category');
  var priceEl = document.getElementById('qv-price');
  var origPriceEl = document.getElementById('qv-original-price');
  var discountEl = document.getElementById('qv-discount');
  var descEl = document.getElementById('qv-desc');
  var imgEl = document.getElementById('qv-img');
  var pdpLink = document.getElementById('qv-pdp-link');

  if (titleEl) titleEl.innerText = 'Loading garment details...';
  if (catEl) catEl.innerText = 'Pure Handloom Cotton';
  if (priceEl) priceEl.innerText = '';
  if (origPriceEl) origPriceEl.innerText = '';
  if (discountEl) discountEl.style.display = 'none';
  if (descEl) descEl.innerText = 'Artisanal 100% natural cotton crafted with generational heritage techniques.';
  if (pdpLink) pdpLink.href = 'product.html?id=' + productId;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  fetch(window.getApiBase() + '/api/products/' + productId)
    .then(function (res) {
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    })
    .then(function (p) {
      var rawSizes = (p.sizes || 'XS, S, M, L, XL').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var isQvFree = rawSizes.length === 1 && (rawSizes[0].toLowerCase().includes('free') || rawSizes[0].toLowerCase().includes('one size'));
      var defaultQvSize = isQvFree ? rawSizes[0] : (rawSizes.includes('M') ? 'M' : rawSizes[0]);

      var qvColors = (p.color || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var defaultQvColor = qvColors.length > 0 ? qvColors[0] : null;

      window._currentQuickViewProduct = {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        image: p.image,
        selectedSize: defaultQvSize,
        selectedColor: defaultQvColor
      };

      var qvSizesBox = document.getElementById('qv-sizes');
      if (qvSizesBox) {
        if (isQvFree) {
          qvSizesBox.innerHTML = '<span style="display:inline-block; padding:6px 14px; background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; border-radius:4px; font-weight:600; font-size:12px;">🥻 ' + rawSizes[0] + ' (Universal Fit)</span>';
        } else {
          qvSizesBox.innerHTML = rawSizes.map(function (sz) {
            var activeClass = sz === defaultQvSize ? ' active' : '';
            return '<button type="button" class="quickview-size-btn' + activeClass + '" onclick="selectQuickViewSize(this, \'' + sz.replace(/'/g, "\\'") + '\')">' + sz + '</button>';
          }).join('');
        }
      }

      if (titleEl) titleEl.innerText = p.name;
      if (catEl) catEl.innerText = (p.category ? p.category.toUpperCase() : 'HANDLOOM COTTON') + (p.subcategory ? ' • ' + p.subcategory.toUpperCase() : '');
      if (priceEl) priceEl.innerHTML = '&#8377;' + parseFloat(p.price).toFixed(2);

      var origPrice = p.original_price ? parseFloat(p.original_price) : Math.round(parseFloat(p.price) * 1.25);
      if (origPrice && origPrice > parseFloat(p.price)) {
        if (origPriceEl) {
          origPriceEl.innerHTML = '&#8377;' + origPrice.toFixed(2);
          origPriceEl.style.display = 'inline';
        }
        if (discountEl) {
          var disc = Math.round(((origPrice - parseFloat(p.price)) / origPrice) * 100);
          discountEl.innerText = disc + '% OFF';
          discountEl.style.display = 'inline-block';
        }
      } else {
        if (origPriceEl) origPriceEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
      }

      if (descEl) {
        descEl.innerText = p.description || 'Artisanal 100% pure cotton crafted on traditional wooden looms for breathability, softness, and timeless grace.';
      }
      if (imgEl) {
        imgEl.src = p.image;
        imgEl.alt = p.name;
        imgEl.onerror = function () { this.src = 'assets/product_kurta_ivory.jpg'; };
      }
      if (pdpLink) pdpLink.href = 'product.html?id=' + p.id;
    })
    .catch(function (err) {
      console.error('Failed to load quick view:', err);
      if (titleEl) titleEl.innerText = 'Product Details Unavailable';
    });
};

window.closeQuickView = function (e) {
  if (e && e.target && !e.target.classList.contains('quickview-modal-overlay') && !e.target.classList.contains('quickview-close-btn')) {
    return;
  }
  var overlay = document.getElementById('quickview-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  document.body.style.overflow = '';
};

window.selectQuickViewSize = function (btn, size) {
  if (window._currentQuickViewProduct) {
    window._currentQuickViewProduct.selectedSize = size;
  }
  var sizeButtons = document.querySelectorAll('.quickview-size-btn');
  sizeButtons.forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
};

window.addQuickViewToCart = function () {
  if (!window._currentQuickViewProduct) return;
  var prod = window._currentQuickViewProduct;
  var size = prod.selectedSize || 'Free Size';
  var color = prod.selectedColor || null;
  window.jpCart.add({
    id: prod.id,
    name: prod.name,
    price: prod.price,
    image: prod.image
  }, 1, size, color);

  var msg = 'Added ' + prod.name + (size ? ' (' + size + ')' : '') + ' to your bag!';
  if (window.showToast) {
    window.showToast(msg);
  } else {
    alert(msg);
  }
  window.closeQuickView();
};

window.handleLoomCircleSubmit = function (e) {
  if (e) e.preventDefault();
  var input = document.getElementById('loom-email-input');
  var form = document.getElementById('loom-circle-form');
  if (!input || !input.value) return;

  var email = input.value.trim();
  if (navigator.clipboard) {
    navigator.clipboard.writeText('PATRON10').catch(function () { });
  }

  fetch((window.getApiBase ? window.getApiBase() : '') + '/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  }).catch(function (err) { console.warn('Newsletter sync notice:', err); });

  if (form) {
    form.innerHTML = '<div style="background: rgba(180, 83, 9, 0.25); border: 1px solid #f1c29e; border-radius: 10px; padding: 14px 20px; color: #fef3c7; font-size: 13px; font-weight: 600; text-align: center;">🎉 Welcome to The Loom Circle! Code <strong>PATRON10</strong> copied to clipboard (10% off your order).</div>';
  }
  if (window.showToast) {
    window.showToast('Patron privilege granted! Coupon PATRON10 copied.');
  }
};

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeQuickView();
  }
});


window.showCartAddedToast = function (item, qty, size, color) {
  let toast = document.getElementById('jp-cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'jp-cart-toast';
    toast.className = 'cart-added-toast';
    document.body.appendChild(toast);
  }
  const total = (item.price * (qty || 1)).toFixed(2);
  const meta = [color, size].filter(Boolean).join(' • ');
  toast.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center;">
      <img src="${item.image || 'assets/product_kurta_ivory.jpg'}" alt="${item.name}" style="width:48px; height:60px; object-fit:cover; border-radius:4px; flex-shrink:0;">
      <div style="flex:1; overflow:hidden;">
        <div style="font-size:12px; color:#15803d; font-weight:700;">✓ Added to Your Bag</div>
        <div style="font-size:13px; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
        <div style="font-size:12px; color:#64748b; margin-top:2px;">Qty: ${qty || 1} ${meta ? `(${meta})` : ''} &bull; <strong>₹${total}</strong></div>
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:12px;">
      <button type="button" class="btn-secondary" onclick="document.getElementById('jp-cart-toast').classList.remove('show')" style="flex:1; padding:8px 10px; font-size:12px; text-decoration:none; text-align:center; cursor:pointer;">Keep Shopping</button>
      <a href="checkout.html" class="btn-primary" style="flex:1; padding:8px 10px; font-size:12px; text-decoration:none; text-align:center;">Checkout &rarr;</a>
    </div>
  `;
  toast.classList.add('show');
  if (window._cartToastTimer) clearTimeout(window._cartToastTimer);
  window._cartToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
};
