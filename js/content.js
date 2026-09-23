/* Ibom Data Community — renders CMS-editable content
   Reads JSON files under /data (editable via /admin) and populates the page. */

document.addEventListener('DOMContentLoaded', function () {
  var eventsArchive = document.getElementById('eventsArchive');
  if (eventsArchive) {
    fetch('data/events.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { renderEvents(eventsArchive, data.events || []); })
      .catch(function () { /* keep section empty, page still works */ });
  }

  var teamGrid = document.getElementById('teamGrid');
  if (teamGrid) {
    fetch('data/team.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { renderTeam(teamGrid, data.members || []); })
      .catch(function () { });
  }

  var spotlightCard = document.getElementById('spotlightCard');
  if (spotlightCard) {
    Promise.all([
      fetch('data/spotlight.json?t=' + Date.now()).then(function (r) { return r.json(); }).catch(function () { return { spotlights: [] }; }),
      fetch('data/birthdays.json?t=' + Date.now()).then(function (r) { return r.json(); }).catch(function () { return { birthdays: [] }; })
    ]).then(function (results) {
      initSpotlightSection(results[0].spotlights || [], results[1].birthdays || []);
    });
  }

  var blogList = document.getElementById('blogList');
  if (blogList) {
    fetch('data/blog.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { renderBlogList(blogList, data.posts || []); })
      .catch(function () { });
  }

  var postBody = document.getElementById('postBody');
  if (postBody) {
    fetch('data/blog.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { renderBlogPost(data.posts || []); })
      .catch(function () { });
  }

  initVisualParallax();
  initStory();

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderEvents(container, events) {
    var primary = events.filter(function (e) { return e.kind === 'primary'; })[0];
    var past = events.filter(function (e) { return e.kind === 'past'; });
    var next = events.filter(function (e) { return e.kind === 'next'; })[0];

    var html = '';

    if (primary) {
      html += '' +
        '<a href="' + escapeHtml(primary.link) + '" class="event-primary">' +
          '<img src="' + escapeHtml(primary.image) + '" alt="' + escapeHtml(primary.title) + ' — ' + escapeHtml(primary.theme || '') + '" loading="lazy"/>' +
          '<div class="event-primary-copy">' +
            '<span class="event-status">' + escapeHtml(primary.status) + '</span>' +
            '<h3>' + escapeHtml(primary.title) + '</h3>' +
            (primary.theme ? '<p class="event-theme">' + escapeHtml(primary.theme) + '</p>' : '') +
            '<span class="event-cta">' + escapeHtml(primary.linkText.replace(/\s*→\s*$/, '')) + ' <span class="event-cta-arrow">→</span></span>' +
          '</div>' +
        '</a>';
    }

    if (past.length) {
      html += '<div class="events-secondary">' + past.map(function (e) {
        return '' +
          '<a href="' + escapeHtml(e.link) + '" class="event-secondary">' +
            '<div class="event-secondary-photo"><img src="' + escapeHtml(e.image) + '" alt="' + escapeHtml(e.title) + '" loading="lazy"/></div>' +
            '<span class="event-status">' + escapeHtml(e.status) + '</span>' +
            '<h4>' + escapeHtml(e.title) + '</h4>' +
            '<p class="event-desc">' + escapeHtml(e.description) + '</p>' +
            '<span class="event-cta">' + escapeHtml(e.linkText.replace(/\s*→\s*$/, '')) + ' <span class="event-cta-arrow">→</span></span>' +
          '</a>';
      }).join('') + '</div>';
    }

    if (next) {
      html += '' +
        '<div class="event-next">' +
          '<svg class="event-next-pattern drift" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
            '<line x1="10" y1="85" x2="28" y2="70"/><line x1="28" y1="70" x2="50" y2="80"/>' +
            '<line x1="72" y1="15" x2="90" y2="25"/><line x1="72" y1="15" x2="60" y2="30"/>' +
            '<circle cx="10" cy="85" r="0.8"/><circle cx="28" cy="70" r="0.8"/><circle cx="50" cy="80" r="0.8"/>' +
            '<circle cx="72" cy="15" r="0.8"/><circle cx="90" cy="25" r="0.8"/><circle cx="60" cy="30" r="0.8"/>' +
          '</svg>' +
          '<div class="event-next-inner">' +
            '<span class="event-next-status">' + escapeHtml(next.status) + '</span>' +
            '<h3>' + escapeHtml(next.title) + '</h3>' +
            (next.theme ? '<p class="event-next-theme">' + escapeHtml(next.theme) + '</p>' : '') +
            (next.date ? '<div class="event-next-date">' + escapeHtml(next.date) + '</div>' : '') +
            '<p class="event-next-desc">' + escapeHtml(next.description) + '</p>' +
            '<a href="' + escapeHtml(next.link) + '" class="btn btn-primary">' +
              escapeHtml(next.linkText.replace(/\s*→\s*$/, '')) + ' <span class="event-cta-arrow">→</span>' +
            '</a>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;
    Array.prototype.forEach.call(container.querySelectorAll('.event-primary, .event-secondary, .event-next'), function (el) {
      window.idcRevealNow && window.idcRevealNow(el);
    });
  }

  function renderTeam(grid, members) {
    grid.innerHTML = members.map(function (m) {
      var photo = m.photo
        ? '<img src="' + escapeHtml(m.photo) + '" alt="' + escapeHtml(m.name) + '"/>'
        : '<span class="team-photo-placeholder">👤</span><div class="photo-hint">📸 Add photo via /admin</div>';
      var linkedin = m.linkedin ? '<a href="' + escapeHtml(m.linkedin) + '" target="_blank" rel="noopener">💼 LinkedIn</a>' : '';
      var twitter = m.twitter ? '<a href="' + escapeHtml(m.twitter) + '" target="_blank" rel="noopener">🐦 Twitter</a>' : '';
      return '' +
        '<div class="team-card">' +
          '<div class="team-card-photo">' + photo + '</div>' +
          '<div class="team-card-body">' +
            '<div class="team-role">' + escapeHtml(m.role) + '</div>' +
            '<h3>' + escapeHtml(m.name) + '</h3>' +
            '<p>' + escapeHtml(m.bio) + '</p>' +
            '<div class="team-social">' + linkedin + twitter + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(grid.children, function (el) { window.idcRevealNow && window.idcRevealNow(el); });
  }

  function slugify(str) {
    return String(str || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'member';
  }

  function initSpotlightSection(spotlights, birthdays) {
    var todayMD = (function () {
      var d = new Date();
      return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })();

    var todaysBirthdays = (birthdays || [])
      .filter(function (b) { return b.date === todayMD; })
      .map(function (b) {
        return {
          slug: b.slug || slugify(b.name),
          name: b.name,
          role: 'Birthday Today',
          quote: b.message,
          photo: b.photo,
          isBirthday: true
        };
      });

    var spotlightList = (spotlights || []).map(function (m) {
      return { slug: m.slug || slugify(m.name), name: m.name, role: m.role, quote: m.quote, photo: m.photo };
    });

    var params = new URLSearchParams(window.location.search);
    var wantedSlug = params.get('member');

    setupCarousel({
      list: spotlightList,
      block: document.getElementById('spotlightBlock'),
      card: document.getElementById('spotlightCard'),
      prevBtn: document.getElementById('spotlightPrev'),
      nextBtn: document.getElementById('spotlightNext'),
      wantedSlug: wantedSlug,
      emptyState: {
        name: 'Coming Soon',
        quote: "We're just getting started — check back soon to meet our next Community Member of the Week."
      }
    });

    setupCarousel({
      list: todaysBirthdays,
      block: document.getElementById('birthdayBlock'),
      card: document.getElementById('birthdayCard'),
      prevBtn: document.getElementById('birthdayPrev'),
      nextBtn: document.getElementById('birthdayNext'),
      wantedSlug: wantedSlug
    });
  }

  function setupCarousel(opts) {
    var list = opts.list, block = opts.block, card = opts.card;
    var prevBtn = opts.prevBtn, nextBtn = opts.nextBtn;
    if (!block || !card) return;

    if (!list.length) {
      if (!opts.emptyState) return;
      block.style.display = '';
      card.classList.remove('is-birthday');
      card.innerHTML =
        '<div class="spotlight-avatar">⭐</div>' +
        '<p class="spotlight-quote">' + escapeHtml(opts.emptyState.quote) + '</p>' +
        '<div class="spotlight-name">' + escapeHtml(opts.emptyState.name) + '</div>';
      window.idcRevealNow && window.idcRevealNow(card);
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    block.style.display = '';

    var deepLinked = false;
    var idx = 0;
    if (opts.wantedSlug) {
      var found = list.findIndex(function (m) { return m.slug === opts.wantedSlug; });
      if (found !== -1) { idx = found; deepLinked = true; }
    }

    var timer = null;

    function render() {
      var m = list[idx];
      var avatar = m.photo
        ? '<img src="' + escapeHtml(m.photo) + '" alt="' + escapeHtml(m.name) + '"/>'
        : '⭐';
      card.classList.toggle('is-birthday', !!m.isBirthday);
      card.innerHTML =
        '<div class="spotlight-avatar">' + avatar + '</div>' +
        '<p class="spotlight-quote">"' + escapeHtml(m.quote) + '"</p>' +
        '<div class="spotlight-name">' + escapeHtml(m.name) + '</div>' +
        '<div class="spotlight-role">' + escapeHtml(m.role) + '</div>' +
        '<div class="spotlight-actions">' +
          '<button type="button" class="spotlight-share" data-slug="' + escapeHtml(m.slug) + '">Copy Link</button>' +
          '<button type="button" class="spotlight-download">Download</button>' +
        '</div>';
      window.idcRevealNow && window.idcRevealNow(card);

      var shareBtn = card.querySelector('.spotlight-share');
      shareBtn.addEventListener('click', function () {
        var url = window.location.origin + window.location.pathname + '?member=' + encodeURIComponent(m.slug) + '#shine-a-light';
        var done = function () {
          shareBtn.textContent = 'Copied!';
          shareBtn.classList.add('copied');
          setTimeout(function () { shareBtn.textContent = 'Copy Link'; shareBtn.classList.remove('copied'); }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(function () { prompt('Copy this link:', url); });
        } else {
          prompt('Copy this link:', url);
        }
      });

      var downloadBtn = card.querySelector('.spotlight-download');
      downloadBtn.addEventListener('click', function () {
        if (downloadBtn.disabled) return;
        downloadBtn.disabled = true;
        var originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Preparing…';
        drawSpotlightImage(m).then(function (canvas) {
          var filename = slugify(m.name) + (m.isBirthday ? '-birthday' : '-spotlight') + '.png';
          downloadCanvasAsPng(canvas, filename);
          downloadBtn.textContent = originalText;
          downloadBtn.disabled = false;
        }).catch(function () {
          downloadBtn.textContent = originalText;
          downloadBtn.disabled = false;
        });
      });
    }

    function go(delta) {
      idx = (idx + delta + list.length) % list.length;
      render();
      restartTimer();
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      if (list.length > 1 && !deepLinked) timer = setInterval(function () { go(1); }, 7000);
    }

    render();
    if (list.length > 1) {
      if (nextBtn) nextBtn.addEventListener('click', function () { deepLinked = false; go(1); });
      if (prevBtn) prevBtn.addEventListener('click', function () { deepLinked = false; go(-1); });
      restartTimer();
    } else {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0) || ''; }).join('').toUpperCase();
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function loadImageEl(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  // Renders a shareable 1080x1080 image of a spotlight/birthday card — no external
  // dependency, just canvas, so it works the same as the rest of this site's JS.
  function drawSpotlightImage(m) {
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () { return loadImageEl(m.photo); }).then(function (img) {
      var W = 1080, H = 1080;
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');

      var grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0D1F0A');
      grad.addColorStop(0.55, '#1A3D0F');
      grad.addColorStop(1, '#2D6618');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#F7921E';
      ctx.beginPath();
      ctx.arc(W - 60, 90, 320, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#F7921E';
      ctx.font = '700 30px Inter, sans-serif';
      ctx.fillText(m.isBirthday ? 'HAPPY BIRTHDAY' : 'SHINE A LIGHT', W / 2, 130);

      var cx = W / 2, cy = 380, r = 170;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#F7921E';
      ctx.fill();
      if (img) {
        ctx.clip();
        var scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
        var dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 120px Nunito, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials(m.name), cx, cy + 12);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 56px Nunito, sans-serif';
      ctx.fillText(m.name, W / 2, cy + r + 90);

      ctx.fillStyle = '#F7921E';
      ctx.font = '700 28px Inter, sans-serif';
      ctx.fillText(String(m.role || '').toUpperCase(), W / 2, cy + r + 135);

      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = 'italic 400 34px Georgia, serif';
      var lines = wrapCanvasText(ctx, '"' + m.quote + '"', 820).slice(0, 6);
      var qy = cy + r + 205;
      lines.forEach(function (line, i) { ctx.fillText(line, W / 2, qy + i * 46); });

      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '700 26px Nunito, sans-serif';
      ctx.fillText('IBOM DATA COMMUNITY', W / 2, H - 60);

      return canvas;
    });
  }

  function downloadCanvasAsPng(canvas, filename) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        resolve();
      }, 'image/png');
    });
  }

  function initVisualParallax() {
    var visual = document.getElementById('visual');
    if (!visual) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var isNarrow = window.matchMedia('(max-width: 900px)').matches;
    if (reduceMotion || !canHover || isNarrow) return;

    var photos = Array.prototype.slice.call(visual.querySelectorAll('.visual-photo'));
    var words = Array.prototype.slice.call(visual.querySelectorAll('.visual-word'));
    var targets = photos.concat(words).map(function (el) {
      return { el: el, depth: parseFloat(el.getAttribute('data-depth')) || 1 };
    });

    var raf = null;
    var nx = 0, ny = 0;

    visual.addEventListener('mousemove', function (e) {
      var rect = visual.getBoundingClientRect();
      nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    visual.addEventListener('mouseleave', function () {
      nx = 0; ny = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    function apply() {
      raf = null;
      targets.forEach(function (t) {
        var isPhoto = t.el.classList.contains('visual-photo');
        var max = isPhoto ? 3 : 7; // photos drift barely; words drift a touch more
        var tx = (nx * max * t.depth).toFixed(2);
        var ty = (ny * max * t.depth).toFixed(2);
        t.el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      });
    }
  }

  function initStory() {
    var story = document.getElementById('story');
    if (!story) return;

    var tabs = Array.prototype.slice.call(story.querySelectorAll('.story-tab'));
    var imgs = Array.prototype.slice.call(story.querySelectorAll('.story-img'));
    var headline = story.querySelector('.story-headline');
    var desc = story.querySelector('.story-desc');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;

    function goTo(tab) {
      if (tab.classList.contains('active')) return;
      var key = tab.getAttribute('data-key');

      tabs.forEach(function (t) {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      imgs.forEach(function (img) {
        img.classList.toggle('active', img.getAttribute('data-key') === key);
      });

      var swap = function () {
        headline.textContent = tab.getAttribute('data-headline');
        desc.textContent = tab.getAttribute('data-desc');
      };

      if (reduceMotion) {
        swap();
      } else {
        headline.classList.add('fade');
        desc.classList.add('fade');
        setTimeout(function () {
          swap();
          headline.classList.remove('fade');
          desc.classList.remove('fade');
        }, 200);
      }
    }

    function goToNext() {
      var activeIndex = tabs.findIndex(function (t) { return t.classList.contains('active'); });
      goTo(tabs[(activeIndex + 1) % tabs.length]);
    }

    function startTimer() {
      if (reduceMotion) return;
      stopTimer();
      timer = setInterval(goToNext, 3000);
    }

    function stopTimer() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        goTo(tab);
        startTimer(); // manual pick restarts the countdown rather than jumping mid-cycle
      });
    });

    // Pause while the visitor is looking at it; resume once they move on
    story.addEventListener('mouseenter', stopTimer);
    story.addEventListener('mouseleave', startTimer);
    story.addEventListener('focusin', stopTimer);
    story.addEventListener('focusout', startTimer);

    startTimer();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function renderBlogList(container, posts) {
    if (!posts.length) {
      container.innerHTML = '<p class="blog-empty">No posts yet — check back soon.</p>';
      return;
    }
    var sorted = posts.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    container.innerHTML = sorted.map(function (p) {
      return '' +
        '<a href="blog-post.html?slug=' + encodeURIComponent(p.slug) + '" class="blog-post-item">' +
          '<div class="blog-post-thumb"><img src="' + escapeHtml(p.coverImage) + '" alt="' + escapeHtml(p.title) + '" loading="lazy"/></div>' +
          '<div class="blog-post-body">' +
            '<span class="blog-post-meta">' + escapeHtml(formatDate(p.date)) + ' · ' + escapeHtml(p.author) + '</span>' +
            '<h2>' + escapeHtml(p.title) + '</h2>' +
            '<p>' + escapeHtml(p.excerpt) + '</p>' +
            '<span class="blog-post-cta">Read Article <span class="blog-post-cta-arrow">→</span></span>' +
          '</div>' +
        '</a>';
    }).join('');
    Array.prototype.forEach.call(container.children, function (el) { window.idcRevealNow && window.idcRevealNow(el); });
  }

  function renderBlogPost(posts) {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    var post = posts.filter(function (p) { return p.slug === slug; })[0];

    var titleEl = document.getElementById('postTitle');
    var metaEl = document.getElementById('postMeta');
    var bodyEl = document.getElementById('postBody');
    var coverWrap = document.getElementById('postCoverWrap');
    var coverImg = document.getElementById('postCoverImg');
    var metaDesc = document.getElementById('postMetaDesc');

    if (!post) {
      titleEl.textContent = 'Post Not Found';
      metaEl.textContent = '';
      bodyEl.innerHTML = '<div class="post-not-found"><p>We couldn\'t find that post. It may have been moved or removed.</p><br/><a href="blog.html" class="btn btn-primary">← Back to Blog</a></div>';
      return;
    }

    document.title = post.title + ' — Ibom Data Community';
    if (metaDesc) metaDesc.setAttribute('content', post.excerpt || '');
    titleEl.textContent = post.title;
    metaEl.textContent = formatDate(post.date) + ' · ' + post.author;

    if (post.coverImage) {
      coverImg.src = post.coverImage;
      coverImg.alt = post.title;
      coverWrap.style.display = 'block';
    }

    var paragraphs = (post.body || '').split(/\n\s*\n/).filter(Boolean);
    bodyEl.innerHTML = paragraphs.map(function (para) {
      return '<p>' + escapeHtml(para).replace(/\n/g, '<br/>') + '</p>';
    }).join('');

    var shareBtn = document.getElementById('postShare');
    if (shareBtn) {
      shareBtn.style.display = 'inline-flex';
      shareBtn.addEventListener('click', function () {
        var url = window.location.origin + window.location.pathname + '?slug=' + encodeURIComponent(post.slug);
        var done = function () {
          shareBtn.textContent = 'Copied!';
          shareBtn.classList.add('copied');
          setTimeout(function () { shareBtn.textContent = 'Copy Link'; shareBtn.classList.remove('copied'); }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(function () { prompt('Copy this link:', url); });
        } else {
          prompt('Copy this link:', url);
        }
      });
    }
  }
});
