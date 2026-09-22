/* Ibom Data Community — shared site interactivity
   Dark mode toggle, animated counters, scroll-reveal. No dependencies. */

(function () {
  var stored = localStorage.getItem('idc-theme');
  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  function updateToggleIcons() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.textContent = isDark ? '☀️' : '🌙';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  window.toggleTheme = function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('idc-theme', next);
    updateToggleIcons();
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateToggleIcons();
    setupCounters();
    setupReveal();
  });

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
      '.card, .sponsor-card, .story-photo, .story-secondary-item';
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
