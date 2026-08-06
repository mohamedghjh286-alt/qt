// script.js — منطق العد التنازلي وإرسال بيانات التفعيل إلى البوت

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
  const backButton = document.getElementById("backButton");
  const backButtonText = document.getElementById("backButtonText");
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
      finishCountdown();
      return;
    }
    remaining -= 1;
    setTimeout(tick, 1000);
  }

  function finishCountdown() {
    timerNumberEl.textContent = "✓";
    hintText.textContent = "تم الانتهاء! اضغط الزر أدناه للعودة إلى البوت وتفعيل صلاحيتك.";
    backButton.disabled = false;
    backButtonText.textContent = "العودة إلى البوت";
  }

  backButton.addEventListener("click", function () {
    if (backButton.disabled) return;

    const payload = {
      action: "free_activation_complete",
      timestamp: Date.now(),
    };

    if (tg) {
      tg.sendData(JSON.stringify(payload));
      tg.close();
    } else {
      // وضع اختبار خارج تيليجرام (متصفح عادي)
      alert("تم التفعيل بنجاح (وضع الاختبار خارج تيليجرام).");
    }
  });

  // بدء العد التنازلي
  updateRing(remaining);
  tick();
})();
