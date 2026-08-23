/* ==========================================================================
   תכלייס - שליחת לידים מהאתר ל-CRM
   --------------------------------------------------------------------------
   נשלח ל-Webhook של הסינריו "תכלייס - ליד מהאתר ← CRM" ב-Make של תכלייס,
   שיוצר Lead ב-CRM (Base44) עם channel="אתר", status="חדש".
   התעבורה: form-urlencoded (UTF-8) + mode:"no-cors" - כדי לעקוף CORS של
   Webhook של Make (שליחה בלבד, לא קוראים תשובה). זו הסיבה שלא שולחים JSON.
   ========================================================================== */
(function () {
  var WEBHOOK = "https://hook.eu1.make.com/ttjr5tjy2vv3zd99qsixybs841ag9u08";

  // payload: { customer_name, phone, product_interest, notes }
  window.sendLeadToCRM = function (payload) {
    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (k) {
      body.append(k, payload[k] == null ? "" : payload[k]);
    });
    return fetch(WEBHOOK, { method: "POST", mode: "no-cors", body: body });
  };

  // ---- טופס הליד בעמוד הבית ----
  var form = document.querySelector(".lead-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.querySelector('[name="name"]').value.trim();
    var phone = form.querySelector('[name="phone"]').value.trim();
    var status = form.querySelector(".lead-status");
    if (!name || !phone) { status.textContent = "נא למלא שם וטלפון"; return; }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = "שולח...";

    window.sendLeadToCRM({
      customer_name: name,
      phone: phone,
      product_interest: "",
      notes: "ליד מהאתר · דף הבית"
    }).then(function () {
      form.innerHTML = '<div class="lead-thanks">קיבלנו! 🤍 נחזור אלייך בהקדם.</div>';
    }).catch(function () {
      status.textContent = "קרתה תקלה קטנה. אפשר לפנות אלינו בוואטסאפ ונשמח לעזור.";
      btn.disabled = false;
    });
  });
})();
