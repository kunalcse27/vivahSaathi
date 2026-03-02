// ═══════════════════════════════════════════
//   VivahSaathi — script.js
// ═══════════════════════════════════════════

/* ── Custom Cursor ── */
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Scale ring on hover of interactive elements
  document.querySelectorAll('a, button, .filter-tab, .template-card, .symbol-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.transform = 'translate(-50%, -50%) scale(2)';
      ring.style.opacity   = '0.5';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.transform = 'translate(-50%, -50%) scale(1)';
      ring.style.opacity   = '1';
    });
  });
})();

/* ── Navbar Scroll ── */
(function initNavbar() {
  const nav = document.querySelector('.nav-bar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
})();

/* ── Mobile Menu ── */
(function initMobileMenu() {
  const menuBtn  = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('closeMenu');
  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
  closeBtn && closeBtn.addEventListener('click', closeMobile);
})();

function closeMobile() {
  const m = document.getElementById('mobileMenu');
  if (m) m.classList.remove('open');
}

/* ── Scroll-triggered Animations ── */
(function initScrollAnimations() {
  const els = document.querySelectorAll('[data-animate="slide-up"]');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));
})();

/* ── Stat Counter Animation ── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(el) {
    const target  = parseFloat(el.dataset.count);
    const decimal = parseInt(el.dataset.decimal || 0);
    const duration = 2200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = target * easeOutQuart(progress);
      el.textContent = decimal > 0 ? value.toFixed(decimal) : Math.floor(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
})();

/* ── Template Data ── */
const TEMPLATES = [
  {
    id: 1,
    name: 'Maroon Heritage',
    desc: 'Traditional · Elegant borders',
    colorClass: 'tpl-maroon',
    tags: ['traditional', 'groom', 'bride'],
    for: 'groom'
  },
  {
    id: 2,
    name: 'Royal Navy',
    desc: 'Classic · Formal design',
    colorClass: 'tpl-navy',
    tags: ['traditional', 'groom'],
    for: 'groom'
  },
  {
    id: 3,
    name: 'Rose Blush',
    desc: 'Modern · Feminine touch',
    colorClass: 'tpl-rust',
    tags: ['modern', 'bride'],
    for: 'bride'
  },
  {
    id: 4,
    name: 'Forest Royale',
    desc: 'Rich · Nature-inspired',
    colorClass: 'tpl-forest',
    tags: ['modern', 'groom', 'bride'],
    for: 'both'
  },
  {
    id: 5,
    name: 'Indigo Dreams',
    desc: 'Contemporary · Minimalist',
    colorClass: 'tpl-indigo',
    tags: ['modern', 'bride'],
    for: 'bride'
  },
  {
    id: 6,
    name: 'Teal Zenith',
    desc: 'Bold · Statement-making',
    colorClass: 'tpl-teal',
    tags: ['modern', 'groom', 'bride'],
    for: 'both'
  }
];

function buildTemplateCard(t) {
  const tagLabel = t.for === 'bride' ? 'Bride' : t.for === 'groom' ? 'Groom' : 'Bride & Groom';
  const tagClass = t.for === 'bride' ? 'bride' : t.for === 'groom' ? 'groom' : '';

  return `
    <div class="template-card" data-tags='${JSON.stringify(t.tags)}' data-id="${t.id}">
      <div class="template-preview ${t.colorClass}">
        <div class="tpl-preview-art">
          <div class="tpl-symbol">ॐ</div>
          <div class="tpl-header-row">
            <div class="tpl-header-left">
              <div class="tpl-line tpl-line-sm"></div>
              <div class="tpl-line tpl-line-md"></div>
            </div>
            <div class="tpl-photo"></div>
          </div>
          <div class="tpl-divider"></div>
          <div class="tpl-line tpl-line-lg"></div>
          <div class="tpl-line tpl-line-sm"></div>
          <div class="tpl-line tpl-line-md"></div>
          <div class="tpl-divider"></div>
          <div class="tpl-line tpl-line-lg"></div>
          <div class="tpl-line tpl-line-sm"></div>
          <div class="tpl-line tpl-line-md"></div>
          <div class="tpl-line tpl-line-sm"></div>
          <div class="tpl-divider"></div>
          <div class="tpl-line tpl-line-md"></div>
          <div class="tpl-line tpl-line-sm"></div>
        </div>
        <div class="template-tag ${tagClass}">${tagLabel}</div>
        <div class="template-overlay">
          <button class="template-use-btn" onclick="useTemplate(${t.id})">
            Use This Template →
          </button>
        </div>
      </div>
      <div class="template-info">
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
      </div>
    </div>
  `;
}

/* ── Render & Filter Templates ── */
(function initTemplates() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;

  function render(filter) {
    const filtered = filter === 'all'
      ? TEMPLATES
      : TEMPLATES.filter(t => t.tags.includes(filter));
    grid.innerHTML = filtered.map(buildTemplateCard).join('');
  }

  render('all');

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      render(tab.dataset.filter);
    });
  });
})();

function useTemplate(id) {
  window.location.href = `create.html?template=${id}`;
}

/* ── Testimonials Data ── */
const TESTIMONIALS = [
  {
    text: "The templates are stunning! Created my biodata in just 5 minutes. The live preview feature is amazing — exactly what I saw was what I downloaded.",
    name: "Priya Sharma",
    city: "Delhi",
    rating: 5
  },
  {
    text: "Very professional looking biodata. My entire family was impressed. So easy to use and absolutely no login required. Brilliant!",
    name: "Rajesh Kumar",
    city: "Mumbai",
    rating: 5
  },
  {
    text: "Finally found a biodata maker that looks modern and elegant. The PDF quality is excellent for printing. Highly recommend!",
    name: "Anjali Patel",
    city: "Ahmedabad",
    rating: 5
  },
  {
    text: "Made biodata for my son's matrimony in under 10 minutes. The traditional templates are beautiful and very dignified.",
    name: "Sunita Rao",
    city: "Bangalore",
    rating: 5
  },
  {
    text: "I was skeptical at first but this is genuinely free. Downloaded a gorgeous PDF biodata instantly. No catches at all!",
    name: "Arjun Mehta",
    city: "Pune",
    rating: 5
  },
  {
    text: "The range of templates is wonderful. Found the perfect one for my daughter's biodata with traditional aesthetics.",
    name: "Kavitha Nair",
    city: "Chennai",
    rating: 5
  }
];

/* ── Render Testimonials ── */
(function initTestimonials() {
  const inner = document.getElementById('testimonialsInner');
  const dotsEl = document.getElementById('testimonialDots');
  if (!inner || !dotsEl) return;

  const stars = (n) => '★'.repeat(n);

  inner.innerHTML = TESTIMONIALS.map((t, i) => `
    <div class="testimonial-card">
      <div class="stars">${stars(t.rating)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="author-avatar">${t.name[0]}</div>
        <div>
          <div class="author-name">${t.name}</div>
          <div class="author-city">${t.city}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Dots
  const perPage   = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
  const totalPages = Math.ceil(TESTIMONIALS.length / perPage);
  let current = 0;

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === current ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  }

  function goTo(page) {
    current = page;
    const cardWidth = 360 + 24; // card + gap
    inner.style.transform = `translateX(-${page * cardWidth * perPage}px)`;
    buildDots();
  }

  buildDots();

  // Auto-scroll
  setInterval(() => {
    goTo((current + 1) % totalPages);
  }, 4000);
})();

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── Parallax hero ── */
(function initParallax() {
  const mandala = document.querySelector('.mandala-rotate');
  if (!mandala) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    mandala.style.transform = `rotate(${y * 0.03}deg) scale(${1 + y * 0.0001})`;
  }, { passive: true });
})();

console.log('%cVivahSaathi ✦', 'color:#d4a853;font-size:18px;font-weight:bold;font-family:Georgia,serif;');
console.log('%cCraft your perfect marriage biodata.', 'color:#b8a99a;font-size:12px;');
