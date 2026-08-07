// script.js — عداد تنازلي تلقائي (10 ثوانٍ) يبدأ فور فتح الصفحة.
// بعد انتهاء العد مباشرة، يُرسل تأكيد التفعيل للبوت تلقائيًا عبر Telegram.WebApp.sendData()
// ثم تُغلق الصفحة نفسها - بدون أي حاجة لضغط المستخدم على أي زر.

(function () {
  "use strict";

  const COUNTDOWN_SECONDS = 10;
  const RING_CIRCUMFERENCE = 339.29; // 2 * PI * r (r = 54)

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  if (tg) {
    tg.ready();
    tg.expand();
    // مواءمة الألوان مع ثيم تيليجرام الحالي (فاتح/داكن) تلقائيًا عبر متغيرات CSS
    document.documentElement.style.setProperty("--tg-theme-bg-color", tg.themeParams.bg_color || "#0f1115");
    document.documentElement.style.setProperty("--tg-theme-text-color", tg.themeParams.text_color || "#f2f2f2");
    document.documentElement.style.setProperty("--tg-theme-hint-color", tg.themeParams.hint_color || "#9099a3");
    document.documentElement.style.setProperty("--tg-theme-button-color", tg.themeParams.button_color || "#3ea6ff");
    document.documentElement.style.setProperty("--tg-theme-button-text-color", tg.themeParams.button_text_color || "#ffffff");
  }

  const timerNumberEl = document.getElementById("timerNumber");
  const timerRingEl = document.getElementById("timerRing");
  const hintText = document.getElementById("hintText");

  let remaining = COUNTDOWN_SECONDS;

  function updateRing(secondsLeft) {
    const fraction = secondsLeft / COUNTDOWN_SECONDS;
    const offset = RING_CIRCUMFERENCE * (1 - fraction);
    timerRingEl.style.strokeDashoffset = String(offset);
  }

  function tick() {
    timerNumberEl.textContent = String(remaining);
    updateRing(remaining);

    if (remaining <= 0) {
      finishAndActivate();
      return;
    }
    remaining -= 1;
    setTimeout(tick, 1000);
  }

  function finishAndActivate() {
    timerNumberEl.textContent = "✓";
    hintText.textContent = "✅ تم التفعيل! جاري الرجوع إلى تيليجرام...";

    const payload = {
      action: "free_activation_complete",
      timestamp: Date.now(),
    };

    if (tg) {
      // إرسال تلقائي بدون أي تدخل من المستخدم
      tg.sendData(JSON.stringify(payload));
      setTimeout(function () {
        tg.close();
      }, 800);
    } else {
      // وضع اختبار خارج تيليجرام (متصفح عادي)
      hintText.textContent = "✅ تم التفعيل (وضع الاختبار خارج تيليجرام).";
    }
  }

  // بدء العد التنازلي تلقائيًا فور تحميل الصفحة
  updateRing(remaining);
  tick();
})();
