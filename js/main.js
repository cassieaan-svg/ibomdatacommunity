/* Ibom Data Community — shared site interactivity
   Slide-in nav panel, animated counters, scroll-reveal. No dependencies. */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    setupCounters();
    setupReveal();
    setupMobileNav();
  });

  function setupMobileNav() {
    var panel = document.getElementById('mobileNav');
    var overlay = document.getElementById('navOverlay');
    if (!panel) return;

    function open() {
      panel.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      panel.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    window.toggleMobileNav = function () {
      if (panel.classList.contains('open')) close(); else open();
    };

    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Accordion (Events) inside the panel
    panel.querySelectorAll('.nav-panel-accordion-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        trigger.closest('.nav-panel-accordion').classList.toggle('open');
      });
    });

    // Close on any real navigation link click (not the accordion trigger itself)
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', close);
    });
  }

  function setupCounters() {
    var counters = document.querySelectorAll('.hero-stat .n, .stat-block .stat-number, .achievement-number');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { obs.observe(el); });

    function animateCount(el) {
      var raw = el.textContent.trim();
      var match = raw.match(/([\d,]+)/);
      if (!match) return;
      var target = parseInt(match[1].replace(/,/g, ''), 10);
      var suffix = raw.slice(raw.indexOf(match[1]) + match[1].length);
      var prefix = raw.slice(0, raw.indexOf(match[1]));
      var duration = 1100;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(eased * target);
        el.textContent = prefix + value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = raw;
      }
      requestAnimationFrame(step);
    }
  }

  function setupReveal() {
    var selector = '.team-card, .achievement-card, .partner-card, ' +
      '.story-card, .upcoming-event-card, .prize-card, .pillar, .spotlight-card, .timeline-item, ' +
      '.card, .sponsor-card, .story-photo, .story-secondary-item, ' +
      '.res-card, .faq-item, .experience-card, .speaker-card, .why-card, ' +
      '.blog-post-item, .event-secondary, .event-primary, .event-next, .idc-tip, ' +
      '.section-header, .final-cta-inner';
    var targets = document.querySelectorAll(selector);
    if (!targets.length) return;

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 6) * 60 + 'ms';
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('reveal-in'); });
      return;
    }

    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { revealObs.observe(el); });
  }

  // Expose so dynamically-rendered content (team/events/spotlight) can opt in too
  window.idcRevealNow = function (el) {
    el.classList.add('reveal', 'reveal-in');
  };
})();
