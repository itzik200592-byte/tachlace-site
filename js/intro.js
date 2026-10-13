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

    // intro-leaving משאיר את השכבה על המסך בזמן ה-fade; הסרת intro-on משחררת גלילה ומפעילה את אנימציות העמוד
    root.classList.add('intro-leaving');
    root.classList.remove('intro-on');
    setInert(false);
    document.dispatchEvent(new Event('tachlace:intro-done'));

    setTimeout(function () {
      root.classList.remove('intro-leaving');
      try { fg.pause(); if (bg) bg.pause(); } catch (e) {}
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 900);
  }

  function begin() {
    if (started || finished) return;
    started = true;
    clearTimeout(failTimer);
    maxTimer = setTimeout(finish, 9000);                       // רשת ביטחון: לא נתקעים לעולם

    var p = fg.play();
    if (p && p.catch) p.catch(finish);                         // אוטופליי חסום (חיסכון בסוללה וכד') - מדלגים
    if (bg && getComputedStyle(bg).display !== 'none') { try { bg.play(); } catch (e) {} }

    var d = fg.duration || 4.8;
    if (bar) { bar.style.animationDuration = d + 's'; intro.classList.add('is-running'); }
    fg.addEventListener('timeupdate', function () {
      if (fg.currentTime > d - 1.3) intro.classList.add('is-logo');
      if (bg && Math.abs(bg.currentTime - fg.currentTime) > 0.25) bg.currentTime = fg.currentTime;
    });
  }

  // וידאו קל לנייד/טאבלט, איכות מלאה למחשב
  var file = window.innerWidth <= 820 ? 'intro-720.mp4' : 'intro-1080.mp4';
  var src = 'assets/intro/' + file;
  fg.poster = 'assets/intro/intro-poster.jpg';                 // הפוסטר נטען רק כשהפתיחה באמת מוצגת
  fg.src = src;
  if (bg && getComputedStyle(bg).display !== 'none') bg.src = src;

  fg.addEventListener('canplay', function () { setTimeout(begin, 80); });
  fg.addEventListener('ended', finish);
  fg.addEventListener('error', finish);
  failTimer = setTimeout(finish, 3500);                        // חיבור איטי: לא מעכבים את האתר

  if (skip) skip.addEventListener('click', finish);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });

  // נועלים את התוכן מאחורי השכבה (מקלדת/קורא מסך) ברגע שהוא נטען
  document.addEventListener('DOMContentLoaded', function () { if (!finished) setInert(true); });
})();
