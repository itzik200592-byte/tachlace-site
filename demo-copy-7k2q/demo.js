/* דמו קופי: מציג את האתר האמיתי (iframe) עם הטקסט של היום מול ההצעה של בר.
   לא נוגע בעמודים החיים: כל ההחלפות נעשות בזיכרון של ה-iframe בלבד.
   מקור ההצעה: proposals.json (from -> to לפי טקסט נוכחי). */
(function () {
  'use strict';

  var PAGES = {
    index:   { file: '../index.html',   label: 'עמוד הבית' },
    catalog: { file: '../catalog.html', label: 'קטלוג' },
    about:   { file: '../about.html',   label: 'אודות' }
  };

  // אזור בעמוד: הראשון שמתאים כשעולים מהאלמנט כלפי מעלה
  var SECTIONS = [
    ['.skip-link', 'נגישות (דילוג לתוכן)'],
    ['.cat-modal', 'חלון "מתעניינת בדגם?"'],
    ['.cat-tab', 'כפתור סינון (נייד)'],
    ['.mobile-menu', 'תפריט (נייד)'],
    ['header.nav', 'תפריט עליון'],
    ['.cat-toolbar, .cat-tabpanel, .cat-filters', 'סינון הקטלוג'],
    ['.catalog-hero', 'כותרת הקטלוג'],
    ['#cat-grid, .cat-card', 'כרטיסי דגמים'],
    ['#cat-empty', 'אין תוצאות'],
    ['.personal-strip', 'כל תכלייס נתפרת בשבילך'],
    ['header.hero', 'פתיחה (Hero)'],
    ['.page-hero, .about-hero', 'פתיחת העמוד'],
    ['.about-story, .about-quote, .about-sign', 'הסיפור של בר'],
    ['.strip', 'פס אמון'],
    ['#what', 'מה זו פאת פרונט'],
    ['#why', 'למה תכלייס'],
    ['#about, .about', 'אודות'],
    ['#reviews', 'המלצות'],
    ['#faq', 'שאלות נפוצות'],
    ['#contact, .band', 'הזמנה לפגישה'],
    ['footer', 'כותרת תחתונה']
  ];
  var KINDS = { H1: 'כותרת ראשית', H2: 'כותרת', H3: 'כותרת משנה', H4: 'כותרת משנה', P: 'פסקה', A: 'קישור/כפתור',
                BUTTON: 'כפתור', SUMMARY: 'שאלה', LI: 'פריט', LABEL: 'תווית', BLOCKQUOTE: 'ציטוט' };
  // [hidden] לא נחשב: החלון הקופץ של הקטלוג ומצב "אין תוצאות" מוסתרים אבל הם טקסטים לכל דבר
  var SKIP = 'script,style,noscript,svg,template,video,audio,canvas,iframe,.intro,[aria-hidden="true"]';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = { page: 'index', view: 'today', device: 'desktop' };
  var proposals = { pages: {} };
  var parsed = {};                     // עמוד -> מסמך מקורי (לרשימות)
  var toastTimer = null;

  /* ---------------- עזרים ---------------- */
  function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plain(s) { return norm(String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')); }

  function unitText(el) {
    var c = el.cloneNode(true);
    $$('br', c).forEach(function (b) { b.replaceWith(' '); });
    $$('svg,script,style', c).forEach(function (n) { n.remove(); });
    return norm(c.textContent);
  }

  function sectionOf(el) {
    for (var a = el; a && a.nodeType === 1; a = a.parentElement) {
      for (var i = 0; i < SECTIONS.length; i++) { if (a.matches(SECTIONS[i][0])) return SECTIONS[i][1]; }
    }
    return 'אחר';
  }

  function kindOf(el) {
    if (el.matches('.eyebrow')) return 'כותרת עליונה קטנה';
    if (el.matches('.btn, a.btn, button')) return 'כפתור';
    if (el.closest('.menu, .mobile-menu')) return 'תפריט';
    return KINDS[el.tagName] || 'טקסט';
  }

  /* כל "יחידת טקסט" בעמוד: אלמנט עם טקסט ישיר שלא מקונן ביחידה אחרת */
  function extract(doc) {
    var out = [];
    (function visit(el) {
      if (el.matches && el.matches(SKIP)) return;
      var hasText = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); });
      if (hasText) {
        var t = unitText(el);
        if (/[A-Za-z0-9֐-׿]/.test(t)) out.push({ el: el, text: t, section: sectionOf(el), kind: kindOf(el) });
        return;
      }
      Array.prototype.forEach.call(el.children, visit);
    })(doc.body);
    out.forEach(function (u, i) { u.n = i + 1; });

    // כותרת הדף ותיאור גוגל
    var seo = [];
    if (doc.title) seo.push({ el: null, kindSeo: 'title', text: norm(doc.title), section: 'כותרת הדף בגוגל (SEO)', kind: 'כותרת הדף' });
    var md = doc.querySelector('meta[name="description"]');
    if (md && md.getAttribute('content')) seo.push({ el: null, kindSeo: 'desc', text: norm(md.getAttribute('content')), section: 'כותרת הדף בגוגל (SEO)', kind: 'תיאור בגוגל' });
    seo.forEach(function (u, i) { u.n = 'S' + (i + 1); });
    return out.concat(seo);
  }

  /* HTML בטוח: מותר <br> <em> <b> <strong> <i> בלבד, וירידת שורה */
  function sanitize(s) {
    var d = document.createElement('div');
    d.textContent = String(s).replace(/\r?\n/g, '<br>');
    return d.innerHTML.replace(/&lt;(\/?)(br|em|b|strong|i)\s*\/?&gt;/gi, function (m, sl, tag) {
      return '<' + sl + tag.toLowerCase() + (tag.toLowerCase() === 'br' ? '/' : '') + '>';
    });
  }

  /* ---------------- החלה / ביטול על מסמך (iframe) ---------------- */
  function replaceUnit(u, to) {
    var el = u.el;
    if (!el) {                                                     // SEO
      if (u.kindSeo === 'title') { u.doc.title = plain(to); }
      else { var m = u.doc.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', plain(to)); }
      return;
    }
    if (!el.hasAttribute('data-demo-orig')) el.setAttribute('data-demo-orig', el.innerHTML);
    el.setAttribute('data-demo-changed', '1');
    el.setAttribute('data-demo-old', u.text);
    if (to === '') { el.classList.add('demo-removed'); return; }
    if (el.querySelector('svg,img')) {                              // כפתור עם אייקון: מחליפים רק את הטקסט
      var tn = Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); });
      tn[0].nodeValue = ' ' + plain(to) + ' ';
      tn.slice(1).forEach(function (n) { n.remove(); });
    } else {
      el.innerHTML = sanitize(to);
    }
  }

  /* "in": מגביל את ההחלפה ליחידות באזור שהתווית שלו מכילה את הטקסט (למשל "פתיחה (Hero)") */
  function inScope(u, p) { return !p['in'] || u.section.indexOf(p['in']) > -1; }
  function paras(s) { return s ? String(s).split(/\n+/).filter(function (t) { return /\S/.test(t); }) : []; }

  /* סקשן חדש בעיצוב של האתר: כותרת עליונה, כותרת, פסקאות, כרטיסים, סלוגן וכפתור */
  function blockHTML(b) {
    var h = '';
    if (b.eyebrow || b.title || b.lead) {
      h += '<div class="sec-head">';
      if (b.eyebrow) h += '<div class="eyebrow tagline">' + esc(b.eyebrow) + '</div>';
      if (b.title) h += '<h2>' + sanitize(b.title) + '</h2>';
      paras(b.lead).forEach(function (t) { h += '<p>' + sanitize(t) + '</p>'; });
      h += '</div>';
    }
    if (b.items && b.items.length) {
      h += '<div class="why demo-items">';
      b.items.forEach(function (it) {
        h += '<div class="card"><h3>' + sanitize(it.title) + '</h3>' + paras(it.text).map(function (t) { return '<p>' + sanitize(t) + '</p>'; }).join('') + '</div>';
      });
      h += '</div>';
    }
    if (b.slogan) h += '<p class="demo-slogan">' + esc(b.slogan) + '</p>';
    if (b.cta) h += '<div class="demo-cta"><a class="btn btn-main" href="#">' + esc(b.cta) + '</a></div>';
    return h;
  }

  function blocksOf(pageId) { return ((proposals.blocks || []).filter(function (b) { return b.page === pageId; })); }
  function blockPlain(b) {
    var t = [];
    if (b.eyebrow) t.push(b.eyebrow);
    if (b.title) t.push(plain(b.title));
    paras(b.lead).forEach(function (x) { t.push(plain(x)); });
    (b.items || []).forEach(function (it) { t.push(plain(it.title)); paras(it.text).forEach(function (x) { t.push(plain(x)); }); });
    if (b.slogan) t.push(b.slogan);
    if (b.cta) t.push('[כפתור] ' + b.cta);
    return t;
  }

  function applyTo(doc, pageId) {
    var list = (proposals.pages && proposals.pages[pageId]) || [];
    var units = extract(doc);
    units.forEach(function (u) { u.doc = doc; });
    var stats = list.map(function (p) { return { p: p, matched: 0 }; });

    list.forEach(function (p, i) {
      if (p.from != null && p.to != null) {
        var key = norm(p.from);
        units.forEach(function (u) { if (u.text === key && inScope(u, p)) { stats[i].matched++; replaceUnit(u, p.to); } });
      }
    });
    list.forEach(function (p, i) {                                  // טקסט חדש שנוסף מתחת לקיים
      if (p.after == null) return;
      var key = norm(p.after);
      units.some(function (u) {
        if (u.text !== key || !u.el || !inScope(u, p)) return false;
        var c = doc.createElement(p.tag || u.el.tagName.toLowerCase());
        if (p.cls != null) { if (p.cls) c.className = p.cls; }
        else { Array.prototype.forEach.call(u.el.classList, function (k) { c.classList.add(k); }); }
        if (p.tag === 'a') c.setAttribute('href', '#');
        c.innerHTML = sanitize(p.to);
        c.setAttribute('data-demo-added', '1');
        u.el.insertAdjacentElement('afterend', c);
        stats[i].matched++;
        return true;
      });
    });
    blocksOf(pageId).forEach(function (b) {                         // סקשנים חדשים
      var ref = doc.querySelector(b.before || b.after);
      if (!ref) return;
      var d = doc.createElement('div');
      d.className = 'demo-block'; d.setAttribute('data-demo-added', '1'); d.innerHTML = blockHTML(b);
      ref.insertAdjacentElement(b.before ? 'beforebegin' : 'afterend', d);
    });
    return stats;
  }

  function revert(doc) {
    $$('[data-demo-added]', doc).forEach(function (n) { n.remove(); });
    $$('[data-demo-orig]', doc).forEach(function (n) {
      n.innerHTML = n.getAttribute('data-demo-orig');
      ['data-demo-orig', 'data-demo-changed', 'data-demo-old'].forEach(function (a) { n.removeAttribute(a); });
      n.classList.remove('demo-removed');
    });
    if (doc.__origTitle != null) doc.title = doc.__origTitle;
  }

  /* ---------------- iframe: טעינה, הגנות, סימון ---------------- */
  var INJECT_CSS =
    '.intro{display:none!important}' +
    '[data-demo-changed]{outline:2px dashed #C9A66B;outline-offset:5px;border-radius:4px;background-image:linear-gradient(rgba(201,166,107,.16),rgba(201,166,107,.16))}' +
    '[data-demo-added]{outline:2px dashed #5c7256;outline-offset:5px;border-radius:4px;background-image:linear-gradient(rgba(92,114,86,.14),rgba(92,114,86,.14))}' +
    '.demo-removed{display:none!important}' +
    '.demo-block{padding:56px 0 18px;margin-top:20px}.demo-block .sec-head p{margin-bottom:12px}' +
    '.demo-items{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))!important}' +
    '.demo-items .card{padding:30px 26px 26px}.demo-items .card h3{font-size:24px}.demo-items .card p{margin-bottom:10px}' +
    '.demo-slogan{text-align:center;font-family:"HandHeb",cursive;font-size:32px;color:#93194f;margin:30px 0 6px}' +
    '.demo-cta{text-align:center;margin-top:18px}';

  function guardFrame(fr) {
    var win = fr.contentWindow, doc = fr.contentDocument;
    if (!doc || !doc.head) return;
    doc.__origTitle = doc.title;
    var st = doc.createElement('style'); st.textContent = INJECT_CSS; doc.head.appendChild(st);
    win.sendLeadToCRM = function () { return Promise.resolve(); };    // בדמו לא נשלחים לידים אמיתיים
    win.open = function () { toast('בדמו לא נפתחים קישורים חיצוניים'); return null; };
    doc.addEventListener('submit', function (e) { e.preventDefault(); e.stopImmediatePropagation(); toast('בדמו לא נשלחים לידים אמיתיים'); }, true);
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/^(https?:\/\/(wa\.me|api\.whatsapp)|tel:|mailto:)/i.test(h)) { e.preventDefault(); toast('בדמו לא נפתחים וואטסאפ וטלפון'); return; }
      var m = h.match(/^(?:\.\/)?(index|catalog|about)\.html(#.*)?$/);
      if (m) { e.preventDefault(); setState({ page: m[1] }); return; }
      if (/^https?:\/\//i.test(h)) { e.preventDefault(); toast('בדמו לא נפתחים קישורים חיצוניים'); }
    }, true);
  }

  function loadFrame(fr, pageId, mode, done) {
    var url = PAGES[pageId].file + '?intro=0&demo=1';
    fr.onload = function () {
      try { guardFrame(fr); if (mode === 'proposed') applyTo(fr.contentDocument, pageId); } catch (e) { console.error(e); }
      if (done) done();
    };
    fr.src = url;
  }

  /* גלילה משותפת. האתר החי מגדיר scroll-behavior:smooth, אז גוללים "מיידי" ומתעלמים מהאירוע
     שאנחנו עצמנו גרמנו לו בצד השני (אחרת הצדדים מתנגשים ומרעידים). */
  function syncScroll(a, b) {
    var quiet = new Map();
    function link(from, to) {
      var w = from.contentWindow;
      w.addEventListener('scroll', function () {
        if (performance.now() < (quiet.get(from) || 0)) return;
        var d1 = from.contentDocument.documentElement, d2 = to.contentDocument.documentElement;
        var r = w.scrollY / Math.max(1, d1.scrollHeight - w.innerHeight);
        quiet.set(to, performance.now() + 120);
        to.contentWindow.scrollTo({ top: r * Math.max(0, d2.scrollHeight - to.contentWindow.innerHeight), left: 0, behavior: 'instant' });
      }, { passive: true });
    }
    link(a, b); link(b, a);
  }

  /* ---------------- הצגה ---------------- */
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  function setState(patch) {
    var prev = { page: state.page, view: state.view, device: state.device };
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    if ((state.view === 'split') && window.innerWidth < 1000) state.view = 'proposed';
    try { history.replaceState(null, '', '#' + [state.page, state.view, state.device].join('/')); } catch (e) {}
    render(prev);
  }

  function frames() { return { a: $('#if-a'), b: $('#if-b') }; }

  /* האתר נבדק ברוחב מחשב אמיתי (1280px) גם כשהצד צר: מקטינים את כל המסגרת במקום להפעיל פריסת טאבלט.
     בטלפון (או כשיש מקום) המסגרת בגודלה הטבעי. */
  var DESKTOP_W = 1280;
  function fit() {
    ['a', 'b'].forEach(function (k) {
      var frame = $('#frame-' + k), fr = $('#if-' + k);
      if (!frame || $('#pane-' + k).hidden || $('#stage').hidden) return;
      var avail = frame.clientWidth;
      if (state.device === 'phone' || avail >= DESKTOP_W || window.innerWidth < 1000) {
        fr.style.width = '100%'; fr.style.height = '100%'; fr.style.transform = ''; return;
      }
      var sc = avail / DESKTOP_W;
      fr.style.width = DESKTOP_W + 'px';
      fr.style.height = (frame.clientHeight / sc) + 'px';
      fr.style.transform = 'scale(' + sc + ')';
    });
  }
  window.addEventListener('resize', fit);

  function render(prev) {
    var v = state.view, isFrameView = (v === 'today' || v === 'proposed' || v === 'split');
    document.body.className = 'view-' + v;
    $$('[data-page]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.page === state.page); });
    $$('[data-view]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.view === v); });
    $$('[data-device]').forEach(function (b) { b.classList.toggle('on', b.dataset.device === state.device); });

    var stage = $('#stage');
    stage.hidden = !isFrameView;
    $('#list').hidden = isFrameView;
    stage.className = 'stage' + (v === 'split' ? ' split' : '') + (state.device === 'phone' ? ' phone' : '');
    $('#pane-b').hidden = (v === 'today');
    $('#pane-a').hidden = (v === 'proposed');
    $('#title-a').textContent = 'היום באתר';
    $('#title-b').textContent = 'ההצעה של בר';
    if (v === 'proposed') { $('#pane-a').hidden = true; }

    var total = countChanges();
    $('#banner').hidden = !(total === 0 && isFrameView);
    fit();

    if (isFrameView) {
      var f = frames();
      var needReload = !prev || prev.page !== state.page || prev.view === 'changes' || prev.view === 'deck' || !f.a.src;
      if (v === 'today') {
        if (needReload) loadFrame(f.a, state.page, 'today');
      } else if (v === 'proposed') {
        // המסגרת הפעילה היא b
        if (needReload || prev.view === 'split' || prev.view === 'today') loadFrame(f.b, state.page, 'proposed');
      } else if (v === 'split') {
        var loaded = 0;
        var both = function () { if (++loaded === 2) { try { syncScroll(f.a, f.b); } catch (e) {} } };
        loadFrame(f.a, state.page, 'today', both);
        loadFrame(f.b, state.page, 'proposed', both);
      }
    } else {
      renderList(v);
    }
  }

  /* ---------------- רשימות ---------------- */
  function countChanges() {
    var n = 0;
    Object.keys(PAGES).forEach(function (p) { n += ((proposals.pages && proposals.pages[p]) || []).length; });
    n += (proposals.blocks || []).length + (proposals.code || []).length;
    var c = $('#count'); c.textContent = n; c.classList.toggle('zero', n === 0);
    return n;
  }

  function loadParsed(pageId) {
    if (parsed[pageId]) return Promise.resolve(parsed[pageId]);
    return fetch(PAGES[pageId].file, { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      parsed[pageId] = doc; return doc;
    });
  }

  function wordDiff(a, b) {
    var A = a.split(/\s+/).filter(Boolean), B = b.split(/\s+/).filter(Boolean);
    var n = A.length, m = B.length, L = [], i, j;
    for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var ha = [], hb = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ha.push(esc(A[i])); hb.push(esc(B[j])); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { ha.push('<del>' + esc(A[i++]) + '</del>'); }
      else { hb.push('<ins>' + esc(B[j++]) + '</ins>'); }
    }
    while (i < n) ha.push('<del>' + esc(A[i++]) + '</del>');
    while (j < m) hb.push('<ins>' + esc(B[j++]) + '</ins>');
    return { a: ha.join(' '), b: hb.join(' ') };
  }

  function copyText(text) {
    var done = function () { toast('הועתק. אפשר להדביק בוואטסאפ או במסמך'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { toast('ההעתקה נכשלה'); });
    else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
  }

  function renderList(v) {
    var box = $('#list');
    box.innerHTML = '<div class="empty">טוען...</div>';
    var ids = Object.keys(PAGES);
    Promise.all(ids.map(loadParsed)).then(function () {
      var html = '', plainOut = [];
      var title = v === 'changes' ? 'רשימת השינויים' : 'כל הטקסטים באתר היום';
      html += '<div class="list-head"><h2>' + title + '</h2>' +
              '<button class="btn ghost" id="b-copy" type="button">העתקה כטקסט</button>' +
              '<button class="btn" id="b-print" type="button">הדפסה / שמירה כ-PDF</button></div>';

      var qs = proposals.questions || [];
      if (v === 'changes' && qs.length) {                               // נקודות שהמסמך של בר לא סוגר
        html += '<div class="page-block q-block"><h3>נקודות לבירור עם בר<small>' + qs.length + ' נקודות</small></h3><ol class="qlist">';
        plainOut.push('== נקודות לבירור עם בר ==');
        qs.forEach(function (q, i) {
          var title = typeof q === 'string' ? q : q.q, detail = typeof q === 'string' ? '' : (q.d || '');
          html += '<li><b>' + esc(title) + '</b>' + (detail ? '<span>' + esc(detail) + '</span>' : '') + '</li>';
          plainOut.push((i + 1) + '. ' + title + (detail ? '\n   ' + detail : ''));
        });
        html += '</ol></div>';
      }
      ids.forEach(function (id) {
        var doc = parsed[id], units = extract(doc);
        units.forEach(function (u) { u.doc = doc; });
        html += '<div class="page-block" id="blk-' + id + '"><h3>' + PAGES[id].label + '<small id="sub-' + id + '"></small></h3>';
        plainOut.push('== ' + PAGES[id].label + ' ==');
        if (v === 'deck') {
          units.forEach(function (u) {
            html += '<div class="deck-row"><div class="n">' + u.n + '</div><div class="meta"><b>' + esc(u.section) + '</b>' + esc(u.kind) + '</div><div class="txt">' + esc(u.text) + '</div></div>';
            plainOut.push(u.n + '. [' + u.section + '] ' + u.text);
          });
          html = html.replace('<small id="sub-' + id + '"></small>', '<small>' + units.length + ' טקסטים</small>');
        } else {
          var list = (proposals.pages && proposals.pages[id]) || [], rows = '', k = 0;
          list.forEach(function (p) {
            var isAdd = p.after != null, key = norm(isAdd ? p.after : p.from);
            var hits = units.filter(function (u) { return u.text === key && inScope(u, p); });
            k++;
            if (!hits.length) {
              rows += '<div class="row warn"><div class="n">' + k + '</div><div class="cell" style="grid-column:2 / span 2"><div class="tag"><i>לא נמצא באתר</i></div><div class="txt">' + esc(key) + '</div><div class="note">הטקסט הזה לא נמצא בעמוד. ייתכן שהוא השתנה או שיש טעות הקלדה.</div></div></div>';
              plainOut.push(k + '. [לא נמצא באתר] ' + key);
              return;
            }
            var u = hits[0], to = p.to == null ? '' : plain(p.to);
            var d = isAdd ? { a: '<span style="color:#9b8a78">(אין טקסט כאן היום)</span>', b: '<ins>' + esc(to) + '</ins>' } :
                    (to === '' ? { a: '<del>' + esc(u.text) + '</del>', b: '<span style="color:#9b8a78">(להסיר)</span>' } : wordDiff(u.text, to));
            rows += '<div class="row"><div class="n">' + k + '</div>' +
              '<div class="cell old"><div class="tag"><i>' + esc(u.section) + '</i><i>' + esc(isAdd ? 'מתחת ל: ' + u.kind : u.kind) + '</i>' + (hits.length > 1 ? '<i>מופיע ' + hits.length + ' פעמים</i>' : '') + '</div><span class="lbl">היום</span><div class="txt">' + d.a + '</div></div>' +
              '<div class="cell new"><div class="tag"><i>' + (isAdd ? 'טקסט חדש' : 'הצעה של בר') + '</i></div><span class="lbl">הצעה</span><div class="txt">' + d.b + '</div>' +
              (p.note ? '<div class="note">' + esc(p.note) + '</div>' : '') +
              '<div class="actions"><button type="button" class="link" data-show="' + id + '" data-key="' + esc(key) + '">הצג באתר</button></div></div></div>';
            plainOut.push(k + '. [' + u.section + '] ' + (isAdd ? 'להוסיף מתחת: ' : '') + 'היום: ' + (isAdd ? '-' : u.text) + '\n   הצעה: ' + (to === '' ? '(להסיר)' : to));
          });
          var blks = blocksOf(id);
          blks.forEach(function (b) {                                   // סקשנים חדשים
            k++;
            var lines = blockPlain(b);
            rows += '<div class="row"><div class="n">' + k + '</div>' +
              '<div class="cell old"><div class="tag"><i>אין היום</i></div><span class="lbl">היום</span><div class="txt"><span style="color:#9b8a78">(אין סקשן כזה באתר היום)</span></div></div>' +
              '<div class="cell new"><div class="tag"><i>סקשן חדש</i>' + (b.label ? '<i>' + esc(b.label) + '</i>' : '') + '</div><span class="lbl">הצעה</span><div class="txt">' +
              lines.map(function (t) { return '<ins>' + esc(t) + '</ins>'; }).join('<br><br>') + '</div>' +
              (b.note ? '<div class="note">' + esc(b.note) + '</div>' : '') +
              '<div class="actions"><button type="button" class="link" data-show="' + id + '" data-key="__block__">הצג באתר</button></div></div></div>';
            plainOut.push(k + '. [סקשן חדש' + (b.label ? ': ' + b.label : '') + ']\n   ' + lines.join('\n   '));
          });
          if (!list.length && !blks.length) rows = '<div class="empty">אין שינויים בעמוד הזה.</div>';
          else html += '<div class="row head"><div></div><div class="cell">היום באתר</div><div class="cell">ההצעה של בר</div></div>';
          html += rows;
          html = html.replace('<small id="sub-' + id + '"></small>', '<small>' + (list.length + blks.length) + ' שינויים</small>');
        }
        html += '</div>';
      });
      var code = proposals.code || [];
      if (v === 'changes' && code.length) {                             // טקסטים שנוצרים בקוד או בהודעות
        html += '<div class="page-block"><h3>טקסטים שנוצרים בקוד ובהודעות<small>' + code.length + ' שינויים, לא נראים בדמו</small></h3>' +
                '<div class="row head"><div></div><div class="cell">היום</div><div class="cell">ההצעה של בר</div></div>';
        plainOut.push('== טקסטים שנוצרים בקוד ובהודעות ==');
        code.forEach(function (c, i) {
          var d = wordDiff(norm(c.from || ''), norm(c.to || ''));
          html += '<div class="row"><div class="n">' + (i + 1) + '</div>' +
            '<div class="cell old"><div class="tag"><i>' + esc(c.where || 'קוד') + '</i></div><span class="lbl">היום</span><div class="txt">' + (c.from ? d.a : '<span style="color:#9b8a78">(אין היום)</span>') + '</div></div>' +
            '<div class="cell new"><div class="tag"><i>הצעה של בר</i></div><span class="lbl">הצעה</span><div class="txt">' + d.b + '</div>' + (c.note ? '<div class="note">' + esc(c.note) + '</div>' : '') + '</div></div>';
          plainOut.push((i + 1) + '. [' + (c.where || 'קוד') + '] היום: ' + (c.from || '-') + '\n   הצעה: ' + c.to);
        });
        html += '</div>';
      }
      box.innerHTML = html;
      $('#b-print').onclick = function () { window.print(); };
      $('#b-copy').onclick = function () { copyText(plainOut.join('\n')); };
      $$('[data-show]', box).forEach(function (b) {
        b.onclick = function () { jumpTo(b.dataset.show, b.dataset.key); };
      });
    });
  }

  function jumpTo(pageId, key) {
    setState({ page: pageId, view: 'proposed' });
    var tries = 0;
    (function wait() {
      var d = $('#if-b').contentDocument, el = d && key !== '__block__' && $$('[data-demo-old]', d).filter(function (n) { return n.getAttribute('data-demo-old') === key; })[0];
      if (!el && d) el = $$('.demo-block', d)[0] || $$('[data-demo-added]', d)[0];
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (++tries < 30) setTimeout(wait, 150);
    })();
  }

  /* ---------------- אתחול ---------------- */
  function init() {
    $$('[data-page]').forEach(function (b) { b.onclick = function () { setState({ page: b.dataset.page }); }; });
    $$('[data-view]').forEach(function (b) { b.onclick = function () { setState({ view: b.dataset.view }); }; });
    $$('[data-device]').forEach(function (b) { b.onclick = function () { setState({ device: b.dataset.device }); }; });
    var h = (location.hash || '').replace('#', '').split('/');
    if (PAGES[h[0]]) state.page = h[0];
    if (['today', 'proposed', 'split', 'changes', 'deck'].indexOf(h[1]) > -1) state.view = h[1];
    if (h[2] === 'phone' || h[2] === 'desktop') state.device = h[2];
    if (window.innerWidth < 1000 && state.view === 'split') state.view = 'proposed';

    var pf = new URLSearchParams(location.search).get('p');
    if (!pf || !/^[\w.-]+\.json$/.test(pf)) pf = 'proposals.json';
    fetch(pf + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { pages: {} }; })
      .catch(function () { return { pages: {} }; })
      .then(function (j) {
        proposals = j || { pages: {} };
        window.__demo.loaded = true;                              // ה-build של העותק הנקי (build_preview.js) ממתין לזה
        var n = countChanges();
        if (n > 0 && !location.hash) state.view = window.innerWidth >= 1000 ? 'split' : 'proposed';
        render(null);
      });
  }

  window.__demo = { extract: extract, norm: norm, PAGES: PAGES, state: state, applyTo: applyTo, loaded: false };
  init();
})();
