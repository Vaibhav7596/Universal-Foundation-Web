/* ── LOADER ──────────────────────────────────────── */
document.body.classList.add("loading");

window.addEventListener("load", () => {
  document.body.classList.remove("loading");
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
});

/* ── HEADER SCROLL ───────────────────────────────── */
window.addEventListener("scroll", () => {
  document
    .querySelector("header")
    ?.classList.toggle("scrolled", window.scrollY > 40);
});

/* ── ACTIVE NAV LINK ─────────────────────────────── */
(function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });
})();

/* ── MOBILE MENU TOGGLE ──────────────────────────── */
const mobileToggle = document.querySelector(".mobile-menu-toggle");
const nav = document.querySelector("nav");

if (mobileToggle && nav) {
  mobileToggle.addEventListener("click", () => {
    nav.classList.toggle("active");
    const icon = mobileToggle.querySelector("i");
    if (icon) {
      if (nav.classList.contains("active")) {
        icon.className = "fa-solid fa-xmark";
      } else {
        icon.className = "fa-solid fa-bars";
      }
    }
  });

  // Close nav on click outside
  document.addEventListener("click", (e) => {
    if (!mobileToggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove("active");
      const icon = mobileToggle.querySelector("i");
      if (icon) icon.className = "fa-solid fa-bars";
    }
  });
}

/* ── COUNTER ANIMATION FUNCTION ──────────────────── */
function initCounters() {
  document.querySelectorAll(".counter").forEach((counter) => {
    counter.textContent = "0";
    const target = +counter.getAttribute("data-target");
    const duration = 1800;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      counter.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(counter);
  });
}

/* ── SCROLL REVEAL (for elements without AOS) ───── */
const reveals = document.querySelectorAll(".reveal");
if (reveals.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  reveals.forEach((el) => revealObserver.observe(el));
}

/* ── FORM VALIDATION ─────────────────────────────── */
function validateForm() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const message = document.getElementById("message")?.value.trim();

  if (!name || !email || !message) {
    showToast("Please fill in all fields.", "error");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address.", "error");
    return false;
  }

  showToast("Sending message...", "success");
  return true; // ✅ ALLOW FORM TO SUBMIT
}

/* ── TOAST NOTIFICATION ──────────────────────────── */
function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:80px; right:28px;
    background:${type === "success" ? "#2d6a4f" : "#a94442"};
    color:white; padding:14px 22px;
    border-radius:8px; font-size:0.9rem;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 8px 28px rgba(0,0,0,0.18);
    z-index:9999; opacity:0;
    transform:translateY(10px);
    transition:opacity 0.3s,transform 0.3s;
    max-width:320px; line-height:1.5;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ── FRONTEND DYNAMIC HYDRATION ──────────────────── */
(function hydrateCmsData() {
  const isHomepage = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
  const isWorkpage = window.location.pathname.endsWith("work.html");
  const isEventspage = window.location.pathname.endsWith("events.html");
  const isContactpage = window.location.pathname.endsWith("contact.html");

  fetch('/api/public/settings')
    .then(res => {
      if (!res.ok) throw new Error("Settings fetch failed");
      return res.json();
    })
    .then(settings => {
      // 1. Global Dynamics (Header/Footer/WhatsApp Links)
      document.querySelectorAll(".dynamic-brand").forEach(el => {
        el.textContent = "Universal Foundation";
      });
      document.querySelectorAll(".dynamic-email").forEach(el => {
        el.textContent = settings.contact.email;
        el.setAttribute("href", `mailto:${settings.contact.email}`);
      });
      document.querySelectorAll(".dynamic-wa-link").forEach(el => {
        el.setAttribute("href", settings.contact.whatsapp);
      });
      document.querySelectorAll(".dynamic-phone").forEach(el => {
        el.textContent = settings.contact.phone;
        el.setAttribute("href", `tel:${settings.contact.phoneRaw || '918347807007'}`);
      });
      document.querySelectorAll(".dynamic-address").forEach(el => {
        el.textContent = settings.contact.location;
      });

      // 2. Page Specific Hydrations
      
      // index.html
      if (isHomepage) {
        // Hero texts
        const heroTitle = document.querySelector(".hero h1");
        if (heroTitle && settings.hero.title) heroTitle.innerHTML = settings.hero.title;
        const heroEyebrow = document.querySelector(".hero-eyebrow");
        if (heroEyebrow && settings.hero.eyebrow) heroEyebrow.textContent = settings.hero.eyebrow;
        const heroDesc = document.querySelector(".hero p");
        if (heroDesc && settings.hero.description) heroDesc.textContent = settings.hero.description;

        // About Intro texts
        const aboutTitle = document.querySelector(".two-col h2");
        if (aboutTitle && settings.aboutIntro.title) aboutTitle.innerHTML = settings.aboutIntro.title;
        const aboutDesc = document.querySelector(".two-col p");
        if (aboutDesc && settings.aboutIntro.description) aboutDesc.textContent = settings.aboutIntro.description;

        // Stats counter targets
        const counters = document.querySelectorAll(".counter");
        if (counters.length >= 4 && settings.stats) {
          settings.stats.forEach((s, idx) => {
            if (counters[idx]) {
              counters[idx].setAttribute("data-target", s.target);
              // Update labels if needed
              const labelEl = counters[idx].parentElement.nextElementSibling;
              if (labelEl && s.label) labelEl.textContent = s.label;
            }
          });
        }
        
        // Dynamic Home Gallery (Render top 3 from gallery database)
        fetch('/api/public/gallery')
          .then(res => res.json())
          .then(galleryImages => {
            const galleryContainer = document.querySelector(".gallery");
            if (galleryContainer && galleryImages && galleryImages.length >= 3) {
              galleryContainer.innerHTML = galleryImages.slice(0, 3).map(img => `
                <div class="gallery-item">
                  <img src="${img}" alt="Activity" loading="lazy">
                </div>
              `).join('');
            }
          }).catch(err => console.error("Error loading home gallery:", err));
      }

      // work.html
      if (isWorkpage) {
        // Stats counter targets for work page
        const counters = document.querySelectorAll(".counter");
        if (counters.length >= 4 && settings.workStats) {
          settings.workStats.forEach((s, idx) => {
            if (counters[idx]) {
              counters[idx].setAttribute("data-target", s.target);
              const labelEl = counters[idx].parentElement.nextElementSibling;
              if (labelEl && s.label) labelEl.textContent = s.label;
            }
          });
        }

        // Full dynamic photo journal gallery
        fetch('/api/public/gallery')
          .then(res => res.json())
          .then(galleryImages => {
            const galleryContainer = document.querySelector(".gallery");
            if (galleryContainer && galleryImages && galleryImages.length > 0) {
              galleryContainer.innerHTML = galleryImages.map(img => `
                <div class="gallery-item" data-aos="fade-up">
                  <img src="${img}" alt="Community Outreach" loading="lazy">
                </div>
              `).join('');
            }
          }).catch(err => console.error("Error loading work gallery:", err));
      }

      // contact.html
      if (isContactpage) {
        const phoneCard = document.querySelector(".contact-item a[href^='tel:']");
        if (phoneCard) {
          phoneCard.textContent = settings.contact.phone;
          phoneCard.setAttribute("href", `tel:${settings.contact.phoneRaw}`);
        }
        const emailCard = document.querySelector(".contact-item a[href^='mailto:']");
        if (emailCard) {
          emailCard.textContent = settings.contact.email;
          emailCard.setAttribute("href", `mailto:${settings.contact.email}`);
        }
        const addressCard = document.querySelector(".contact-item p");
        if (addressCard) {
          addressCard.textContent = settings.contact.location;
        }
        const waCard = document.querySelector(".contact-item a[href^='https://wa.me']");
        if (waCard) {
          waCard.setAttribute("href", settings.contact.whatsapp);
        }
        const iframeMap = document.querySelector(".map-wrap iframe");
        if (iframeMap && settings.contact.mapUrl) {
          iframeMap.setAttribute("src", settings.contact.mapUrl);
        }
      }

      // Initialize counter animations after dynamic values have been hydrated
      initCounters();
    })
    .catch(err => {
      console.error("Hydration failed, falling back to static HTML defaults:", err);
      // Fallback: Still trigger counter animation for default hardcoded values
      initCounters();
    });

  // events.html
  if (isEventspage) {
    // 1. Fetch Dynamic Upcoming Events
    fetch('/api/public/events')
      .then(res => res.json())
      .then(events => {
        const eventsContainer = document.querySelector(".grid[data-aos='fade-up']");
        if (eventsContainer) {
          if (!events || events.length === 0) {
            eventsContainer.innerHTML = `
              <div style="grid-column: 1/-1; text-align:center; padding: 30px; background:var(--earth-sand); border-radius:var(--radius-md);">
                <h3>No Upcoming Events Scheduled</h3>
                <p>We are planning our next batches of safety drives. Check back soon or contact us to volunteer!</p>
              </div>
            `;
            return;
          }

          eventsContainer.innerHTML = events.map(event => `
            <div class="card" data-aos="fade-up">
              <div class="card-date">${event.date}</div>
              <div class="card-icon"><i class="fa-solid ${event.icon || 'fa-calendar'}"></i></div>
              <h3>${event.title}</h3>
              <p>${event.description}</p>
              ${event.location ? `<p style="font-size:0.82rem; color:var(--ink-light); margin-top:12px;"><i class="fa-solid fa-location-dot" style="margin-right:5px;color:var(--green-mid);"></i>${event.location}</p>` : ''}
              <a href="contact.html" class="btn btn-ghost" style="margin-top:16px; font-size:0.85rem; padding:9px 18px;">Register Interest</a>
            </div>
          `).join('');
        }
      }).catch(err => console.error("Error loading events:", err));

    // 2. Fetch Dynamic Internship Status
    fetch('/api/public/internships')
      .then(res => res.json())
      .then(internships => {
        const internship = internships.find(i => i.id === 'internship-1');
        if (internship) {
          // Update the apply CTA section
          const sectionLabel = document.querySelector(".section--deep .section-label");
          if (sectionLabel && internship.batch) {
            sectionLabel.textContent = internship.title || "Applications Open";
          }
          const heading = document.querySelector(".section--deep h2");
          if (heading) {
            heading.textContent = internship.batch || "Ready to Make a Difference?";
          }
          const description = document.querySelector(".section--deep p");
          if (description) {
            description.textContent = internship.description;
          }
          const applyBtn = document.querySelector(".section--deep a.btn");
          if (applyBtn) {
            if (internship.status === 'closed') {
              applyBtn.textContent = "Applications Closed";
              applyBtn.setAttribute("href", "#");
              applyBtn.style.background = "#555";
              applyBtn.style.color = "#ccc";
              applyBtn.style.cursor = "not-allowed";
              applyBtn.style.pointerEvents = "none";
              applyBtn.style.boxShadow = "none";
            } else {
              applyBtn.textContent = "Apply Now";
              applyBtn.setAttribute("href", "contact.html");
              applyBtn.style.cssText = ""; // Restore original styles
            }
          }
        }
      }).catch(err => console.error("Error loading internship schedules:", err));
  }
})();


// ─── DONATION HYDRATION & COPY UPI ──────────────────────────
if (document.getElementById('donation')) {
  fetch('/api/public/donation')
    .then(res => res.json())
    .then(data => {
      const msgEl = document.getElementById('donation-msg-display');
      const qrEl = document.getElementById('donation-qr-display');
      const copyBtn = document.getElementById('copy-upi-btn');
      
      if (msgEl && data.message) msgEl.textContent = data.message;
      if (qrEl && data.qrImage) qrEl.src = data.qrImage;
      if (copyBtn && data.upiId) copyBtn.setAttribute('data-upi', data.upiId);
    })
    .catch(err => console.error("Donation fetch error:", err));

  const copyBtn = document.getElementById('copy-upi-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const upi = copyBtn.getAttribute('data-upi');
      if (upi && navigator.clipboard) {
        navigator.clipboard.writeText(upi).then(() => {
          showToast('UPI ID copied to clipboard!', 'success');
        });
      }
    });
  }
}

// ─── IMPACT GALLERY HYDRATION ───────────────────────────────
const impactContainer = document.getElementById('impact-gallery-container');
if (impactContainer) {
  fetch('/api/public/impact-gallery')
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) return;
      
      // Group by year
      const grouped = data.reduce((acc, item) => {
        const y = item.year;
        if (!acc[y]) acc[y] = [];
        acc[y].push(item);
        return acc;
      }, {});
      
      // Sort years descending
      const sortedYears = Object.keys(grouped).sort((a,b) => b - a);
      
      impactContainer.innerHTML = sortedYears.map(year => {
        const events = grouped[year];
        return `
          <div class="impact-year-group" data-aos="fade-up">
            <h3 class="year-heading">${year}</h3>
            <div class="grid">
              ${events.map((ev, i) => `
                <div class="card impact-card" data-aos="fade-up" data-aos-delay="${i*100}">
                  <h4>${ev.title}</h4>
                  <p>${ev.description}</p>
                  ${ev.eventDate ? `<p style="font-size:0.8rem; color:var(--earth-warm); margin-top:8px;">${ev.eventDate}</p>` : ''}
                  
                  ${ev.images && ev.images.length > 0 ? `
                    <div class="impact-images-grid">
                      ${ev.images.map(img => `<img src="${img}" class="lightbox-trigger" loading="lazy">`).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
      
      setupLightbox();
    })
    .catch(err => console.error("Impact gallery fetch error:", err));
}

// ─── LIGHTBOX FUNCTIONALITY ─────────────────────────────────
function setupLightbox() {
  const triggers = document.querySelectorAll('.lightbox-trigger');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  
  if (!lightbox) return;

  triggers.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.classList.add('active');
    });
  });

  const closeLightbox = () => lightbox.classList.remove('active');
  
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  });
}
