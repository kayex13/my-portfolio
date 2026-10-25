(function () {
  var root = document.documentElement;
  var header = document.getElementById('header');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TABLET_MAX = 1024;

  /* ---------- Desktop scaling (frames are designed at 1440px) ---------- */
  function fit() {
    root.style.setProperty('--s', root.clientWidth / 1440);
    fitAuto();
  }

  // frames whose height depends on their content (Experience page): size the stage to match
  function fitAuto() {
    var stages = document.querySelectorAll('.stage--auto');
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i], fr = st.firstElementChild;
      if (window.innerWidth <= TABLET_MAX) { st.style.removeProperty('height'); continue; }
      st.style.height = (fr.offsetHeight * (root.clientWidth / 1440)) + 'px';
    }
  }

  /* ---------- Mobile / tablet menu ---------- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Scroll-linked word reveal ("Designing intuitive interfaces…") ---------- */
  var MIN_OPACITY = 0.04;  // very dim starting opacity so the fade is obvious
  var SPREAD = 5;          // how many words are mid-fade at the same time

  var revealBlocks = [].slice.call(document.querySelectorAll('[data-reveal]')).map(function (el) {
    var words = [];
    [].slice.call(el.querySelectorAll('.line')).forEach(function (line) {
      var parts = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      parts.forEach(function (w, i) {
        var span = document.createElement('span');
        span.className = 'reveal-word';
        span.textContent = w;
        line.appendChild(span);
        if (i < parts.length - 1) line.appendChild(document.createTextNode(' '));
        words.push(span);
      });
    });
    return { el: el, words: words };
  });

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function updateReveal() {
    var vh = window.innerHeight;
    revealBlocks.forEach(function (b) {
      var rect = b.el.getBoundingClientRect();
      // 0 while the block is still below ~85% of the screen, 1 once its top reaches ~30%
      var p = clamp01((vh * 0.85 - rect.top) / (vh * 0.55));
      var n = b.words.length;
      b.words.forEach(function (w, i) {
        // each word starts fading a little after the previous one
        var t = clamp01((p * (n + SPREAD) - i) / SPREAD);
        w.style.opacity = (MIN_OPACITY + (1 - MIN_OPACITY) * t).toFixed(3);
      });
    });
  }


  /* ---------- Reveal-on-scroll: letters, blocks, folders (tablet/mobile) ---------- */
  function splitLetters(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'ch';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.setProperty('--i', i);
      ch.textContent = text[i] === ' ' ? '\u00a0' : text[i];
      el.appendChild(ch);
    }
    el.classList.add('split');
  }
  [].slice.call(document.querySelectorAll('[data-split]')).forEach(splitLetters);

  function mark(selector, cls, stagger) {
    [].slice.call(document.querySelectorAll(selector)).forEach(function (el, i) {
      el.classList.add(cls);
      if (stagger) el.style.setProperty('--i', Math.min(i, 14));
    });
  }
  mark('.about .section-head__num, .experience .section-head__num, .proj__num', 'reveal');
  mark('.experience__sub, .certs__sub', 'reveal');
  mark('.about .subhead', 'reveal');
  mark('.about__bio, .about__who .btn-glass, .experience > .btn-glass', 'reveal');
  mark('.about__photo', 'reveal-wipe');
  mark('.chips .chip', 'reveal', true);
  mark('.exp-row', 'reveal', true);
  mark('.cert', 'reveal', true);
  mark('.cta-block__text, .cta-block .btn-dark', 'reveal');
  // "More about me" page
  mark('.more__who .subhead, .more__who .about__bio, .more__who .btn-glass, .more__edu .subhead', 'reveal');
  mark('.more__edu-row, .more__scholar', 'reveal', true);
  mark('.more__beyond-sub', 'reveal');
  mark('.more__etitle, .more__epara', 'reveal');
  mark('.more__photo, .more__img', 'reveal-wipe');
  // Full History page
  mark('.tl__entry, .tl__date', 'reveal');
  // Archive page
  mark('.arc__sub', 'reveal');
  mark('.arc__card', 'reveal', true);
  // PUP IsKount page
  mark('.isk__sub, .isk__meta', 'reveal', true);
  mark('.isk__piece', 'reveal', true);
  mark('.isk__hand', 'reveal-wipe');
  mark('.isk__success', 'reveal');
  mark('.isk__about-block, .isk__goal', 'reveal', true);
  mark('.isk__sec-head, .isk__approach-text', 'reveal');
  mark('.isk__stats--a .stat', 'reveal', true);
  mark('.isk__stats--b .stat', 'reveal', true);
  mark('.mrt__entablado', 'reveal');

  var revealTargets = [].slice.call(document.querySelectorAll('.reveal, .reveal-wipe, .reveal-tab, .reveal-pop, .split'));
  if ('IntersectionObserver' in window) {
    // clipped elements (the photo wipe) are observed through their parent, since a
    // fully clipped element never reports as "visible"
    var observed = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          (observed.get(en.target) || en.target).classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) {
      var target = el.classList.contains('reveal-wipe') ? el.parentElement : el;
      observed.set(target, el);
      io.observe(target);
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Stat numbers count up when they scroll into view (PUP IsKount) ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function fmtCount(el, v) {
    return v.toFixed(+el.getAttribute('data-dec') || 0) + (el.getAttribute('data-suffix') || '');
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-count')), dur = 1400, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp01((ts - t0) / dur);
      el.textContent = fmtCount(el, to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        setTimeout(function () { runCount(el); }, 350);   // let the card finish rising first
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = fmtCount(el, 0); cio.observe(el); });
  }

  /* ---------- Projects: folders slide up one by one as you scroll ---------- */
  var track = document.getElementById('folders-track');
  var tabletMQ = window.matchMedia('(max-width: ' + TABLET_MAX + 'px)');
  var FOLDER_H = 675;      // design height of one folder (incl. tab)
  var MOVE = 0.7;          // share of each step spent moving (rest = a pause so it can be read / clicked)
  var STEP_VH = 0.8;       // scroll distance per folder, in viewport heights
  var folders = track ? [].slice.call(track.querySelectorAll('.folder')) : [];
  var geo = { step: 1, pinTop: 0, travel: 0 };

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function layoutFolders() {
    if (!track) return;
    if (tabletMQ.matches) {
      ['--fs', '--pin-top', '--track-h'].forEach(function (p) { track.style.removeProperty(p); });
      folders.forEach(function (f) { f.style.transform = ''; });
      return;
    }
    var s = root.clientWidth / 1440;
    var pinTop = Math.round(header.getBoundingClientRect().height + 12);
    var avail = window.innerHeight - pinTop - 12;
    var fs = Math.max(0.3, Math.min(s, avail / FOLDER_H));   // fit the whole stack on screen
    var steps = folders.length - 1;
    geo.step = window.innerHeight * STEP_VH;
    geo.pinTop = pinTop;
    geo.travel = window.innerHeight - pinTop + 30;
    track.style.setProperty('--fs', fs);
    track.style.setProperty('--pin-top', pinTop + 'px');
    track.style.setProperty('--track-h', (FOLDER_H * fs + steps * geo.step) + 'px');
  }

  function updateFolders() {
    if (!track || tabletMQ.matches) return;
    var steps = folders.length - 1;
    var t = reduceMotion ? steps : Math.min(steps, Math.max(0, (geo.pinTop - track.getBoundingClientRect().top) / geo.step));
    folders.forEach(function (f, i) {
      if (i === 0) return;
      var local = clamp01(t - (i - 1));
      var m = easeOut(clamp01(local / MOVE));
      f.style.transform = m >= 1 ? '' : 'translateY(' + ((1 - m) * geo.travel).toFixed(1) + 'px)';
    });
  }

  // click a tab to bring that project to the front
  if (track) {
    track.addEventListener('click', function (e) {
      var tab = e.target.closest('.folder__label');
      if (!tab || tabletMQ.matches) return;
      var f = tab.closest('.folder');
      folders.forEach(function (x) { x.classList.remove('is-front'); });
      f.classList.add('is-front');
      f.classList.remove('is-pop');
      void f.offsetWidth;
      f.classList.add('is-pop');
    });
  }

  /* ---------- Experience timeline: the centre line draws itself as you scroll ---------- */
  var tl = document.getElementById('tl');
  var tlFill = tl ? tl.querySelector('.tl__fill') : null;
  var tlRows = tl ? [].slice.call(tl.querySelectorAll('.tl__row')) : [];
  function updateTimeline() {
    if (!tl) return;
    var line = tl.querySelector('.tl__line').getBoundingClientRect();
    var anchor = window.innerHeight * 0.68;                  // the "reading line" on screen
    var drawn = reduceMotion ? line.height : Math.min(line.height, Math.max(0, anchor - line.top));
    tlFill.style.transform = 'scaleY(' + (line.height ? drawn / line.height : 0).toFixed(4) + ')';
    tlRows.forEach(function (row) {
      var d = row.querySelector('.tl__dot').getBoundingClientRect();
      var reached = (d.top + d.height / 2) - line.top <= drawn + 1;
      row.classList.toggle('is-active', reached);
    });
    tl.classList.toggle('is-complete', line.height > 0 && drawn >= line.height - 2);
  }

  /* ---------- Scroll / resize ---------- */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 4);
    updateReveal();
    updateFolders();
    updateTimeline();
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });

  window.addEventListener('resize', function () {
    fit();
    layoutFolders();
    if (window.innerWidth > TABLET_MAX) setMenu(false);
    updateReveal();
    updateFolders();
    updateTimeline();
  });

  fit();
  layoutFolders();
  onScroll();
  window.addEventListener('load', function () { fitAuto(); updateTimeline(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitAuto(); updateTimeline(); });
  if (tabletMQ.addEventListener) tabletMQ.addEventListener('change', function () { layoutFolders(); updateFolders(); });
})();