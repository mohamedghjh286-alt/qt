// script.js
// -----------
// منطق Telegram Mini App لتفعيل الاستخدام المجاني (12 ساعة) مقابل مشاهدة
// إعلان Rewarded حقيقي والتحقق من نجاحه على السيرفر.
//
// قواعد أمنية أساسية (لا تُخترق من هنا):
// - لا يتم منح أي تفعيل إلا بعد استدعاء API السيرفر ونجاحه فعليًا.
// - initData يُرسل للسيرفر مع كل طلب؛ السيرفر هو من يتحقق من التوقيع ويحدد
//   هوية المستخدم الحقيقية (وليس أي قيمة من initDataUnsafe أو من الرابط).
// - لا يوجد أي مؤقت محلي (setTimeout) يُستخدم كدليل على مشاهدة الإعلان.

(function () {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  if (tg) {
    tg.ready();
    tg.expand();
  }

  const initData = tg ? tg.initData : "";

  // عناصر الشاشات
  const screens = {
    idle: document.getElementById("screenIdle"),
    loading: document.getElementById("screenLoading"),
    verifying: document.getElementById("screenVerifying"),
    success: document.getElementById("screenSuccess"),
    failed: document.getElementById("screenFailed"),
  };
  const watchBtn = document.getElementById("watchBtn");
  const retryBtn = document.getElementById("retryBtn");
  const closeBtn = document.getElementById("closeBtn");
  const expiryText = document.getElementById("expiryText");
  const failReason = document.getElementById("failReason");

  let currentSessionId = null;

  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle("hidden", key !== name);
    });
  }

  function showFailed(reason) {
    failReason.textContent = reason || "لم يتم تفعيل الـ12 ساعة لأن الإعلان لم يكتمل.";
    showScreen("failed");
  }

  async function apiPost(path, body) {
    const resp = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = {};
    try {
      data = await resp.json();
    } catch (e) {
      data = {};
    }
    return { ok: resp.ok, status: resp.status, data };
  }

  // ------------------------------------------------------------
  // 1) إنشاء جلسة مكافأة جديدة (يتحقق السيرفر من initData هنا فعليًا)
  // ------------------------------------------------------------
  async function startSession() {
    if (!initData) {
      showFailed("تعذر التحقق من هويتك في تيليجرام. افتح هذه الصفحة من داخل البوت.");
      watchBtn.disabled = true;
      return false;
    }
    const { ok, data } = await apiPost("/api/session/start", { initData });
    if (!ok || !data.session_id) {
      showFailed("تعذر بدء الجلسة، حاول لاحقًا.");
      return false;
    }
    currentSessionId = data.session_id;
    return true;
  }

  // ------------------------------------------------------------
  // 2) ضغط زر مشاهدة الإعلان
  // ------------------------------------------------------------
  async function onWatchClick() {
    if (watchBtn.disabled) return;
    watchBtn.disabled = true;

    if (!currentSessionId) {
      const ok = await startSession();
      if (!ok) {
        watchBtn.disabled = false;
        return;
      }
    }

    showScreen("loading");

    if (typeof show_11571297 !== "function") {
      showFailed("تعذر تحميل مكون الإعلانات. تأكد من اتصالك بالإنترنت وحاول مجددًا.");
      return;
    }

    show_11571297()
      .then(() => {
        // الإعلان اكتمل بنجاح فعليًا حسب شبكة الإعلانات - الآن فقط نطلب المكافأة
        onAdCompleted();
      })
      .catch(() => {
        // الإعلان لم يكتمل أو أُغلق أو حدث خطأ - لا نمنح أي مكافأة إطلاقًا
        showFailed("لم تكتمل مشاهدة الإعلان. حاول مرة أخرى.");
      });
  }

  // ------------------------------------------------------------
  // 3) بعد نجاح الإعلان فقط: إرسال طلب صرف المكافأة للسيرفر
  // ------------------------------------------------------------
  async function onAdCompleted() {
    showScreen("verifying");

    const { ok, status, data } = await apiPost("/api/ad-reward", {
      initData,
      reward_session_id: currentSessionId,
    });

    if (ok && data.success) {
      const dt = new Date(data.activated_until);
      expiryText.textContent = dt.toLocaleString();
      showScreen("success");
      return;
    }

    if (status === 409) {
      showFailed("هذه الجلسة استُخدمت بالفعل أو انتهت صلاحيتها. اضغط إعادة المحاولة للحصول على جلسة جديدة.");
      currentSessionId = null; // نجبر إنشاء جلسة جديدة عند إعادة المحاولة
      return;
    }

    showFailed("حدث خطأ أثناء التفعيل على السيرفر. حاول مرة أخرى.");
  }

  // ------------------------------------------------------------
  // أزرار التحكم
  // ------------------------------------------------------------
  watchBtn.addEventListener("click", onWatchClick);

  retryBtn.addEventListener("click", async () => {
    showScreen("idle");
    watchBtn.disabled = false;
    if (!currentSessionId) {
      await startSession();
    }
  });

  closeBtn.addEventListener("click", () => {
    if (tg) {
      tg.close();
    }
  });

  // ------------------------------------------------------------
  // بدء التشغيل: إنشاء جلسة فور فتح الصفحة (بدون أي منح مكافأة بالطبع،
  // فقط تجهيز الجلسة مسبقًا حتى يكون الضغط على زر المشاهدة أسرع)
  // ------------------------------------------------------------
  startSession();
})();
