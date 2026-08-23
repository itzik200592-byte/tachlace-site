/* ==========================================================================
   נתוני הקטלוג של תכלייס
   --------------------------------------------------------------------------
   קובץ זמני לתצוגת הקטלוג הסטטי. במעבר ל-Base44 הנתונים יהפכו ל-entity בשם
   Product ובר תנהל אותם מפאנל ניהול (כמו באולטראסקיט) - הקובץ הזה יוחלף.

   כל דגם:
     id       - קוד דגם (מזהה ייחודי)
     color    - צבע (מתוך רשימת הצבעים ב-catalog.js)
     length   - אורך: "קצר" | "אמצע" | "ארוך"
     hairType - סוג שיער: "מתולתל" | "גלי" | "חלק"
     image    - נתיב לתמונה

   התמונות: התקבלו מבר (15.8), הומרו ל-JPG מותאם-web תחת assets/catalog/.
   התיוג (צבע/אורך/סוג) לפי שמות הקבצים כפי שנמסרו ואושרו.
   ========================================================================== */
window.TACHLACE_PRODUCTS = [
  { id: "TC-01", color: "בלונדי",      length: "קצר",  hairType: "חלק",    image: "assets/catalog/tc-01-blond-short.jpg" },
  { id: "TC-02", color: "אפור",        length: "אמצע", hairType: "גלי",    image: "assets/catalog/tc-02-ash-mid.jpg" },
  { id: "TC-03", color: "ג'ינג'י",     length: "ארוך", hairType: "חלק",    image: "assets/catalog/tc-03-ginger-long.jpg" },
  { id: "TC-04", color: "חום גוונים",  length: "אמצע", hairType: "גלי",    image: "assets/catalog/tc-04-brownlight-mid.jpg" },
  { id: "TC-05", color: "חום גוונים",  length: "אמצע", hairType: "חלק",    image: "assets/catalog/tc-05-brownshades-mid.jpg" },
  { id: "TC-06", color: "חום כהה",     length: "אמצע", hairType: "גלי",    image: "assets/catalog/tc-06-brownwavy-mid.jpg" },
  { id: "TC-07", color: "חום כהה",     length: "ארוך", hairType: "חלק",    image: "assets/catalog/tc-07-darkbrown-long.jpg" },
  { id: "TC-08", color: "חום כהה",     length: "קצר",  hairType: "חלק",    image: "assets/catalog/tc-08-darkbrown-short.jpg" },
  { id: "TC-09", color: "שחור פחם",    length: "אמצע", hairType: "חלק",    image: "assets/catalog/tc-09-black-mid.jpg" },
  { id: "TC-10", color: "שחור גוונים", length: "אמצע", hairType: "חלק",    image: "assets/catalog/tc-10-blackshades-mid.jpg" },
  { id: "TC-11", color: "שחור פחם",    length: "קצר",  hairType: "מתולתל", image: "assets/catalog/tc-11-black-short-curly.jpg" },
  { id: "TC-12", color: "שחור פחם",    length: "קצר",  hairType: "חלק",    image: "assets/catalog/tc-12-jetblack-short.jpg" }
];
