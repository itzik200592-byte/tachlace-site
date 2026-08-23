// תכלייס - מונה WOW: התג נכנס בקפיצה, המספר מטפס לאט ומורגש מ-1 ל-300,
// הזוהר גדל עם הספירה, ובסיום מגיע רגע-שיא: פופ + הבזק אור + ניצוצות זהב.
(function () {
  var el = document.querySelector('.count-num');
  if (!el) return;
  var b = el.closest('b') || el.parentNode;             // המיכל שנושא את הילת הזוהר
  var badge = el.closest('.float-badge') || b;          // התג כולו - לחגיגת הסיום

  var target = parseInt(el.getAttribute('data-count'), 10) || 300;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) { el.textContent = target; b.style.setProperty('--g', '0.3'); return; }

  var done = false;
  function run() {
    if (done) return;
    done = true;
    var duration = 3600, start = null;
    // easeInOutCubic - התחלה עדינה (לא "יורה" מיד), טיפוס מורגש, נחיתה רכה.
    // מתקן את התחושה שהמונה "רץ מהר מדי" בפתיחה.
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var e = ease(p);
      el.textContent = Math.max(1, Math.round(e * target));
      b.style.setProperty('--g', e.toFixed(3));          // הזוהר גדל עם הספירה
      el.style.transform = 'scale(' + (0.9 + e * 0.1).toFixed(3) + ')';
      if (p < 1) requestAnimationFrame(tick);
      else {
        el.textContent = target;
        el.style.transform = '';
        el.classList.add('is-done');                     // פופ
        badge.classList.add('is-celebrating');           // הבזק אור + ניצוצות
        b.style.setProperty('--g', '0.32');              // הזוהר מתייצב ברמה נעימה
      }
    }
    requestAnimationFrame(tick);
  }

  el.textContent = '1';
  b.style.setProperty('--g', '0.12');                    // זוהר מינימלי לפני שמתחילים
  function start() {
    // משהים מעט כדי שקפיצת הכניסה של התג תתנגן קודם, ואז מתחיל הטיפוס
    setTimeout(run, 360);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { start(); io.disconnect(); } });
    }, { threshold: 0.55 });
    io.observe(badge);
  } else {
    start();
  }
})();

// תכלייס - הנפשת "הקרנה" לדיוקן באודות (נפתח בכניסה למסך)
(function () {
  var portrait = document.querySelector('.about-portrait');
  if (!portrait) return;
  // אם אין js-anim (JS כבוי / צמצום תנועה) - התמונה מוצגת רגיל, לא נוגעים
  if (!document.documentElement.classList.contains('js-anim')) return;

  function reveal() { portrait.classList.add('is-revealed'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(portrait);
  } else {
    reveal();
  }
})();

// תכלייס - תפריט מובייל
(function () {
  var toggle = document.querySelector('.hamburger');
  var body = document.body;

  if (toggle) {
    toggle.addEventListener('click', function () {
      var isOpen = body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.mobile-menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }
})();
