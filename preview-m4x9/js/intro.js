// תכלייס - פתיחה קולנועית: סיבוב 360° של 4.8 שניות, פעם אחת לביקור.
// ההחלטה אם להציג נעשית בסקריפט הקטן ב-<head> (מחלקת html.intro-on) כדי שלא יהיה הבזק של האתר לפני הפתיחה.
// כל כשל (אוטופליי חסום, חיבור איטי, שגיאת וידאו) מסיים את הפתיחה בשקט והאתר נטען כרגיל.
(function () {
  var root = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro || !root.classList.contains('intro-on')) return;

  var fg = intro.querySelector('.intro-fg');
  var bg = intro.querySelector('.intro-bg');
  var skip = intro.querySelector('.intro-skip');
  var bar = intro.querySelector('.intro-bar i');

  var finished = false, started = false, failTimer = null, maxTimer = null;
  var LEAD = 0.8;          // שניות לפני סוף הסרטון שבהן מתחיל המעבר לאתר (הזום ממשיך מתחת ל-fade)
  var LEAVE_MS = 1150;     // משך ה-fade של השכבה; חייב להיות >= משך ה-transition ב-CSS

  // נשאל בכל קריאה: הסקריפט רץ בראש ה-body, לפני שהניווט וה-main נטענו
  function setInert(on) {
    var els = document.querySelectorAll('.skip-link, header.nav, main, footer');
    for (var i = 0; i < els.length; i++) {
      if (on) els[i].setAttribute('inert', ''); else els[i].removeAttribute('inert');
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(failTimer); clearTimeout(maxTimer);
    try { sessionStorage.setItem('tc_intro_seen', '1'); } catch (e) {}

    // intro-leaving: השכבה נמסה ומתרחבת (הזום ממשיך "דרך" המסך). intro-done: ה-hero נדחף פנימה מתחתיה.
    // הסרת intro-on משחררת גלילה ומפעילה את אנימציות העמוד
    root.classList.add('intro-leaving');
    root.classList.add('intro-done');
    root.classList.remove('intro-on');
    if (bg) { try { bg.pause(); } catch (e) {} }            // הרקע המטושטש קופא בזמן המעבר, חוסך פענוח בפריימים הקריטיים
    setInert(false);
    document.dispatchEvent(new Event('tachlace:intro-done'));

    setTimeout(function () {
      root.classList.remove('intro-leaving');
      try { fg.pause(); if (bg) bg.pause(); } catch (e) {}
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, LEAVE_MS);
    setTimeout(function () { root.classList.remove('intro-done'); }, 1600);   // אנימציית הכניסה של ה-hero הסתיימה
  }

  var hasBg = !!bg && getComputedStyle(bg).display !== 'none';

  // שומר "אף פעם לא תקוע": אם הזמן בסרטון לא מתקדם 1.2 שניות (באפרינג באמצע), מוותרים ועוברים לאתר.
  // נמדד לפי currentTime מול שעון, לא לפי אירועי waiting/stalled שלא אמינים בין דפדפנים.
  // ניגון "עצור-סע" (באפרינג כל חצי שנייה) נחשב תקוע: דורשים לפחות 60% מקצב אמיתי בכל חלון של 1.5 שניות.
  var samples = [];
  function watchdog() {
    if (finished) return;
    var now = Date.now(), ct = fg.currentTime;
    samples.push([now, ct]);
    while (samples.length && now - samples[0][0] > 1500) samples.shift();
    var first = samples[0];
    if (now - first[0] >= 1400 && (ct - first[1]) < 0.6 * (now - first[0]) / 1000) { finish(); return; }
    setTimeout(watchdog, 150);
  }

  // רץ פעם אחת, כשהסרטון באמת רץ. עד אז פס ההתקדמות מהבהב כדי שהפתיחה לא תיראה קפואה.
  function begin() {
    if (started || finished) return;
    started = true;
    clearTimeout(failTimer);
    intro.classList.remove('is-waiting');
    maxTimer = setTimeout(finish, 9000);                       // רשת ביטחון אחרונה
    if (hasBg) { try { bg.play(); } catch (e) {} }

    var d = fg.duration || 4.98;
    if (bar) { bar.style.animationDuration = d + 's'; intro.classList.add('is-running'); }
    fg.addEventListener('timeupdate', function () {
      if (hasBg && Math.abs(bg.currentTime - fg.currentTime) > 0.25) bg.currentTime = fg.currentTime;
      if (fg.currentTime >= d - LEAD) finish();                // גיבוי ל-rAF (דפדפנים שמשהים rAF)
    });
    samples = []; watchdog();
    // מדויק לפריים: המעבר מתחיל בדיוק כשהזום מתקרב, לא בקפיצות של timeupdate
    (function watch() {
      if (finished) return;
      if (fg.currentTime >= d - LEAD) { finish(); return; }
      requestAnimationFrame(watch);
    })();
  }

  // טעינה בשני שלבים, כדי שהסרטון ירוץ חלק גם בסלולר:
  // 1) play() מיד - זו הדרך היחידה לגרום ל-iOS Safari להתחיל להוריד (הוא מתעלם מ-preload).
  //    ברגע שהניגון מתחיל (יש נתונים) עוצרים על הפריים הראשון - זהה לפוסטר, הלקוחה לא רואה הבדל.
  // 2) מחכים שייאגר מספיק באפר (או עד 2.2 שניות), ורק אז מנגנים באמת. בחיבור מהיר זה מיידי.
  //    אם אחרי ההמתנה הבאפר עדיין דל - מדלגים על הפתיחה במקום להתחיל סרטון שייתקע.
  var file = window.innerWidth <= 820 ? 'intro-720.mp4' : 'intro-1080.mp4';
  fg.muted = true; fg.defaultMuted = true; fg.playsInline = true; fg.setAttribute('webkit-playsinline', '');
  if (hasBg) { bg.muted = true; bg.defaultMuted = true; bg.playsInline = true; }
  fg.poster = '../assets/intro/intro-poster.jpg';                 // הפוסטר נטען רק כשהפתיחה באמת מוצגת
  fg.src = '../assets/intro/' + file;
  if (hasBg) bg.src = '../assets/intro/intro-bg.mp4';

  function bufferedAhead() {
    try { var b = fg.buffered; return b.length ? b.end(b.length - 1) : 0; } catch (e) { return 0; }
  }
  function realPlay() {
    if (finished || started) return;
    fg.addEventListener('playing', begin);
    var p = fg.play();
    if (p && p.catch) p.catch(finish);
  }
  function primed() {                                          // שלב 2: יש נתונים ראשונים
    if (finished || started) return;
    try { fg.pause(); fg.currentTime = 0; } catch (e) {}
    var d = fg.duration || 4.98, t0 = Date.now();
    (function wait() {
      if (finished || started) return;
      var ahead = bufferedAhead();
      if (ahead >= d * 0.6 || ahead >= d - 0.1) { realPlay(); return; }        // מספיק כדי לרוץ חלק
      if (Date.now() - t0 > 2200) { if (ahead >= d * 0.3) realPlay(); else finish(); return; }
      setTimeout(wait, 100);
    })();
  }

  fg.addEventListener('ended', finish);
  fg.addEventListener('error', finish);
  intro.classList.add('is-waiting');
  try {                                                        // שלב 1
    var p0 = fg.play();
    if (p0 && p0.then) p0.then(primed, finish); else primed();
  } catch (e) { finish(); }
  failTimer = setTimeout(finish, 3200);                        // שום דבר לא זז? לא מעכבים את האתר

  if (skip) skip.addEventListener('click', finish);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });

  // נועלים את התוכן מאחורי השכבה (מקלדת/קורא מסך) ברגע שהוא נטען
  document.addEventListener('DOMContentLoaded', function () { if (!finished) setInert(true); });
})();
