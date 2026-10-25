/* ==========================================================================
   קטלוג תכלייס - פילטרים, תצוגת דגמים, וצור קשר לכל דגם
   ========================================================================== */
(function () {
  var WA_NUMBER = "972539593290";

  // צבעים -> דוגמית רקע (solid או gradient). משמש גם לפלייסהולדר הכרטיס.
  var COLORS = {
    "שחור פחם":       { bg: "#17171b", light: false },
    "שחור גוונים":    { bg: "linear-gradient(135deg,#1a1a1e,#3c3c45)", light: false },
    "חום כהה":        { bg: "#3a2418", light: false },
    "חום גוונים":     { bg: "linear-gradient(135deg,#3a2418,#6d4529)", light: false },
    "ג'ינג'י":        { bg: "linear-gradient(135deg,#7a3311,#c46a2b)", light: false },
    "בלונדי":         { bg: "#d9b877", light: true },
    "בלונדי גוונים":  { bg: "linear-gradient(135deg,#c39f5c,#e7d09b)", light: true },
    "אומברה":         { bg: "linear-gradient(135deg,#241509 0%,#3a2418 42%,#cba667 100%)", light: false },
    "אפור":           { bg: "#9c9ca1", light: true },
    "לבן":            { bg: "#ededec", light: true }
  };

  // סדר קנוני (כהה -> בהיר). הפילטר מציג רק ערכים שיש להם דגמים בפועל,
  // כדי שלא ייווצר סינון ל"מסך ריק" - וכדי שצבע חדש שבר מוסיפה בפאנל יופיע אוטומטית.
  var COLOR_CANON  = ["שחור פחם","שחור גוונים","חום כהה","חום גוונים","ג'ינג'י","בלונדי","בלונדי גוונים","אומברה","אפור","לבן"];
  var LENGTH_CANON = ["קצר","אמצע","ארוך","ארוך מאוד"];
  var TYPE_CANON   = ["מתולתל","גלי","חלק"];

  // מקור הנתונים: פאנל ניהול האתר ב-CRM תכלייס (ישות SiteProduct).
  // אם הקריאה נכשלת, נשארים עם הרשימה הסטטית מ-data/products.js - האתר לא נשבר.
  var PRODUCTS_API = "https://tachlace.isru-automation.com/functions/getSiteProducts";

  // סלוגן המותג + צבעי כותרת מתחלפים לכל כרטיס (מפלטת המותג)
  var SLOGAN = "הכי יפה לך ככה";
  var TITLE_COLORS = ["#B81E63", "#8a6a3f", "#93194f", "#b56389", "#4A3226"];

  var products = window.TACHLACE_PRODUCTS || [];
  var state = { color: "", length: "", hairType: "" };

  // ---- בניית קבוצת פילטר ----
  function buildFilterGroup(container, key, label, values, withSwatch) {
    var group = document.createElement("div");
    group.className = "filter-group";
    group.innerHTML = '<span class="filter-label">' + label + '</span>';
    var chips = document.createElement("div");
    chips.className = "filter-chips";

    values.unshift("__all__");
    values.forEach(function (val) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (val === "__all__" ? " is-active" : "");
      chip.setAttribute("data-key", key);
      chip.setAttribute("data-val", val === "__all__" ? "" : val);

      if (withSwatch && val !== "__all__" && COLORS[val]) {
        var sw = document.createElement("span");
        sw.className = "chip-swatch" + (COLORS[val].light ? " is-light" : "");
        sw.style.background = COLORS[val].bg;
        chip.appendChild(sw);
      }
      chip.appendChild(document.createTextNode(val === "__all__" ? "הכל" : val));
      chip.addEventListener("click", function () { onChip(key, this.getAttribute("data-val")); });
      chips.appendChild(chip);
    });
    group.appendChild(chips);
    container.appendChild(group);
  }

  // מסנכרן את מצב ה"פעיל" בכל הצ'יפים - גם בסינון ה-inline וגם בפאנל של הטאב (שני עותקים)
  function syncChips() {
    document.querySelectorAll(".chip").forEach(function (c) {
      var k = c.getAttribute("data-key");
      c.classList.toggle("is-active", c.getAttribute("data-val") === (state[k] || ""));
    });
  }

  function onChip(key, val) {
    state[key] = (state[key] === val) ? "" : val;
    syncChips();
    render();
  }

  // ---- סינון ----
  function filtered() {
    return products.filter(function (p) {
      return (!state.color || p.color === state.color)
        && (!state.length || p.length === state.length)
        && (!state.hairType || p.hairType === state.hairType);
    });
  }

  // ---- כרטיס דגם ----
  function card(p, i) {
    var c = COLORS[p.color] || { bg: "#ccc", light: true };
    var titleColor = TITLE_COLORS[i % TITLE_COLORS.length];
    var el = document.createElement("article");
    el.className = "cat-card";

    var media = '<div class="cat-media">';
    if (p.image) {
      media += '<img src="' + p.image + '" alt="תוספת שיער תכלייס בגוון ' + p.color + '" loading="lazy">';
    } else {
      media += '<div class="cat-ph" style="background:' + c.bg + '">'
             + '<span class="cat-ph-label' + (c.light ? " on-light" : "") + '">תמונה בקרוב</span></div>';
    }
    media += '</div>';

    var body = '<div class="cat-body">'
      + '<div class="cat-title" style="color:' + titleColor + '">'
      +   '<span class="cat-title-brand">תכלייס</span>'
      +   '<span class="cat-title-slogan">' + SLOGAN + '</span>'
      + '</div>'
      + '<div class="cat-tags">'
      +   '<span class="cat-tag"><span class="tag-sw' + (c.light ? " is-light" : "") + '" style="background:' + c.bg + '"></span>' + p.color + '</span>'
      +   '<span class="cat-tag">' + p.length + '</span>'
      +   '<span class="cat-tag">' + p.hairType + '</span>'
      + '</div>'
      + '<p class="cat-note">הגוונים להמחשה בלבד · ייתכנו הבדלים קלים בעבודת יד ובשיער טבעי</p>'
      + '<button class="btn btn-main cat-cta" type="button">לפרטים ולתיאום</button>'
      + '</div>';

    el.innerHTML = media + body;
    el.querySelector(".cat-cta").addEventListener("click", function () { openModal(p); });
    return el;
  }

  // ---- תצוגה ----
  function render() {
    var grid = document.getElementById("cat-grid");
    var empty = document.getElementById("cat-empty");
    var list = filtered();

    grid.innerHTML = "";
    var countText = list.length + (list.length === 1 ? " דגם" : " דגמים");
    // מעדכן את כל מוני התוצאות: ה-inline (#cat-count) + הטאב והפאנל (.cat-count-m)
    var cMain = document.getElementById("cat-count");
    if (cMain) cMain.textContent = countText;
    document.querySelectorAll(".cat-count-m").forEach(function (el) { el.textContent = countText; });

    if (!list.length) {
      empty.hidden = false;
      grid.hidden = true;
      return;
    }
    empty.hidden = true;
    grid.hidden = false;
    list.forEach(function (p, i) { grid.appendChild(card(p, i)); });
  }

  function resetFilters() {
    state = { color: "", length: "", hairType: "" };
    syncChips();
    render();
  }

  // ---- מודל צור קשר לדגם ----
  function waLink(text) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); }

  function openModal(p) {
    var modal = document.getElementById("cat-modal");
    var desc = "גוון " + p.color + " · אורך " + p.length + " · " + p.hairType;
    modal.querySelector(".m-desc").textContent = desc;

    // תיאור הדגם המדויק - נכנס לכל הודעת וואטסאפ כדי שבר תדע בדיוק על איזה מוצר מדובר
    var prod = "גוון " + p.color + ", אורך " + p.length + ", " + p.hairType;

    var baseMsg = "היי, ראיתי דגם שאהבתי בקטלוג של תכלייס ואשמח לקבל עליו פרטים ולשמוע על אפשרויות הרכישה.";
    modal.querySelector(".m-wa").href = waLink(baseMsg);

    // טופס "השאירי פרטים" - ללא שרת, מרכיב הודעת וואטסאפ עם הפרטים (יחובר ל-CRM ב-Base44)
    var form = modal.querySelector(".m-form");
    form.onsubmit = function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      if (!name || !phone) return;
      // שליחה ל-CRM עם הדגם (leads.js) - ליד מהאתר עם המוצר מהקטלוג
      if (window.sendLeadToCRM) {
        window.sendLeadToCRM({
          customer_name: name,
          phone: phone,
          product_interest: prod,
          notes: "ליד מהאתר · קטלוג"
        });
      }
      var msg = "היי, ראיתי דגם שאהבתי בקטלוג של תכלייס ואשמח לקבל עליו פרטים ולשמוע על אפשרויות הרכישה. שמי " + name + ", טלפון " + phone + ".";
      window.open(waLink(msg), "_blank", "noopener");
    };
    form.reset();

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".m-close").focus();
  }

  function closeModal() {
    var modal = document.getElementById("cat-modal");
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // ---- אתחול ----
  // רשימת הערכים לפילטר: רק מה שקיים בדגמים בפועל, לפי הסדר הקנוני.
  // ערך חדש שלא מוכר בסדר הקנוני נוסף בסוף, כך שצבע חדש מהפאנל לא "נעלם".
  function optionsFor(key, canon) {
    var present = {};
    products.forEach(function (p) { if (p[key]) present[p[key]] = true; });
    var out = canon.filter(function (v) { return present[v]; });
    Object.keys(present).forEach(function (v) { if (out.indexOf(v) === -1) out.push(v); });
    return out;
  }

  // בונה קבוצות פילטר לתוך מיכל נתון
  function buildFilters(container) {
    if (!container) return;
    container.innerHTML = "";
    buildFilterGroup(container, "color", "צבע", optionsFor("color", COLOR_CANON), true);
    buildFilterGroup(container, "length", "אורך", optionsFor("length", LENGTH_CANON), false);
    buildFilterGroup(container, "hairType", "סוג שיער", optionsFor("hairType", TYPE_CANON), false);
  }

  function buildAllFilters() {
    buildFilters(document.getElementById("cat-filters"));    // סינון inline (ראש העמוד / דסקטופ)
    buildFilters(document.getElementById("cat-filters-2"));  // עותק לפאנל הטאב (נייד)
    syncChips();
  }

  // משיכת הקטלוג מפאנל הניהול. נכשל? נשארים עם הרשימה הסטטית ולא נוגעים בתצוגה.
  function loadProductsFromPanel() {
    if (!window.fetch) return;
    fetch(PRODUCTS_API, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.products) || !data.products.length) return;
        products = data.products;
        // אם הפילטר שנבחר כבר לא קיים בדגמים החדשים - מאפסים אותו בלבד
        ["color", "length", "hairType"].forEach(function (k) {
          if (state[k] && !products.some(function (p) { return p[k] === state[k]; })) state[k] = "";
        });
        buildAllFilters();
        render();
      })
      .catch(function () { /* אין רשת / ה-API למטה - הרשימה הסטטית כבר מוצגת */ });
  }

  // הטאב בנייד: מופיע כשגוללים אל הקטלוג, פותח פאנל סינון (שכבת overlay - אפס קפיצה)
  function setupTab() {
    var tab = document.getElementById("cat-tab");
    var toolbar = document.querySelector(".cat-toolbar");
    var backdrop = document.getElementById("cat-tab-backdrop");
    var applyBtn = document.querySelector(".cat-tabpanel-apply");
    if (!tab || !toolbar) return;

    var nav = document.querySelector(".nav");
    var showAt = 0, ticking = false;
    function measure() {
      var navH = nav ? nav.offsetHeight : 64;
      document.documentElement.style.setProperty("--navh", navH + "px");  // הטאב/הפאנל יושבים מתחת ל-nav
      // הטאב מופיע כשהסינון ה-inline נעלם מאחורי ה-nav
      showAt = toolbar.offsetTop + toolbar.offsetHeight - navH;
    }
    function openPanel() { document.body.classList.add("cat-panel-open"); tab.setAttribute("aria-expanded", "true"); }
    function closePanel() { document.body.classList.remove("cat-panel-open"); tab.setAttribute("aria-expanded", "false"); }
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > showAt) {
        tab.classList.add("is-visible");
      } else {
        // חזרנו לראש - הסינון המלא inline גלוי, מסתירים את הטאב וסוגרים פאנל אם פתוח
        tab.classList.remove("is-visible");
        closePanel();
      }
      ticking = false;
    }
    tab.addEventListener("click", function () {
      document.body.classList.contains("cat-panel-open") ? closePanel() : openPanel();
    });
    if (backdrop) backdrop.addEventListener("click", closePanel);
    if (applyBtn) applyBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("resize", function () { measure(); onScroll(); });
    window.addEventListener("load", measure);
    measure(); onScroll();
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildAllFilters();

    document.querySelectorAll(".cat-reset").forEach(function (b) { b.addEventListener("click", resetFilters); });
    document.getElementById("cat-empty-reset").addEventListener("click", resetFilters);

    setupTab();

    var modal = document.getElementById("cat-modal");
    modal.querySelector(".m-close").addEventListener("click", closeModal);
    modal.querySelector(".m-backdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

    render();                   // תצוגה מיידית מהרשימה הסטטית
    loadProductsFromPanel();    // ואז עדכון מפאנל הניהול, אם זמין
  });
})();
