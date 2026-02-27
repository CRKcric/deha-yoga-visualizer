/* ============================================================
   DEHA — INDEX PAGE JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ── Navbar scroll shadow ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 12);
  });

  /* ── Scroll reveal ── */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  /* ── Poses carousel: arrows + drag-to-scroll ── */
  const track     = document.getElementById('posesTrack');
  const arrowLeft  = document.getElementById('posesArrowLeft');
  const arrowRight = document.getElementById('posesArrowRight');

  function getScrollStep() {
    // One card width + gap
    const card = track.querySelector('.pose-card');
    return card ? card.offsetWidth + 22 : 260;
  }

  function updateArrows() {
    const atStart = track.scrollLeft <= 4;
    const atEnd   = track.scrollLeft >= track.scrollWidth - track.offsetWidth - 4;
    arrowLeft.classList.toggle('disabled', atStart);
    arrowRight.classList.toggle('disabled', atEnd);
  }

  if (track && arrowLeft && arrowRight) {
    // Arrow click scroll
    arrowLeft.addEventListener('click', () => {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
    arrowRight.addEventListener('click', () => {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });

    // Update arrow state on scroll
    track.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();

    // Drag-to-scroll
    let isDown = false, startX, scrollLeft;
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('grabbing');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    const endDrag = () => { isDown = false; track.classList.remove('grabbing'); };
    track.addEventListener('mouseleave', endDrag);
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
  }

  /* ── Hero image fallback ── */
  const heroImg = document.getElementById('heroImg');
  if (heroImg) {
    heroImg.addEventListener('error', () => {
      heroImg.style.display = 'none';
      const hero = document.getElementById('hero');
      hero.style.background =
        'linear-gradient(145deg, #7a4545 0%, #5c3030 40%, #3d2020 100%)';
    });
  }

})();