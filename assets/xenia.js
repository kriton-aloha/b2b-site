// XENIA 2026 banner (loaded only for visitors from Greece — see functions/_middleware.js)
(function () {
  var XENIA = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1eFKi8LRobfP9SO5yDuzK-fObb3-TCZNRTMCmr0J3s0h5cCkt19JJolaDiaPfV0fb0el2EQDfy";
  var SHOWROOM = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1Ls92OVaY8jFzjphytXE5WkB76UV-YnCG2CILzxVFwcI86RVjbhmdlg-Sf-HyAvs2AnozT03e5";
  var KEY = "soab_xenia26_seen", DELAY = 4000;

  function seen() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
  function track(ev, extra) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: ev }; for (var k in extra || {}) o[k] = extra[k];
    window.dataLayer.push(o);
  }

  var bar = document.createElement("div");
  bar.className = "xn-bar";
  bar.innerHTML =
    '<button type="button" class="xn-bar__info" aria-haspopup="dialog">' +
      '<b>XENIA 2026</b><span>21–23 Νοεμβρίου · Hall 3, Booth A8</span>' +
    '</button>' +
    '<a class="xn-bar__cta" data-xn="xenia" href="' + XENIA + '" target="_blank" rel="noopener">Κλείστε ραντεβού</a>';

  var modal = document.createElement("div");
  modal.className = "xn-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Sun of a Beach στη XENIA 2026");
  modal.innerHTML =
    '<div class="xn-modal__box">' +
      '<button type="button" class="xn-modal__close" aria-label="Κλείσιμο">&times;</button>' +
      '<img class="xn-modal__img" src="/uploads/2026/11/xenia-2026-invitation-540.webp" ' +
        'srcset="/uploads/2026/11/xenia-2026-invitation-540.webp 540w, /uploads/2026/11/xenia-2026-invitation.webp 1080w" ' +
        'sizes="(max-width: 760px) 92vw, 440px" width="1080" height="1350" ' +
        'alt="Sun of a Beach Hospitality στη XENIA, 21–23 Νοεμβρίου 2026, Metropolitan Expo, Hall 3, Booth A8">' +
      '<div class="xn-modal__body">' +
        '<p class="xn-modal__eyebrow">XENIA 2026</p>' +
        '<h2 class="xn-modal__title">Θα χαρούμε να σας δούμε στη XENIA</h2>' +
        '<p class="xn-modal__text">Γνωρίστε από κοντά τις προτάσεις μας για πετσέτες πισίνας και δώρα για τους επισκέπτες σας, και ας συζητήσουμε τις ανάγκες σας για τη νέα σεζόν.</p>' +
        '<ul class="xn-modal__facts">' +
          '<li><span>Πότε</span>21–23 Νοεμβρίου 2026, 10:00–18:00</li>' +
          '<li><span>Πού</span>Metropolitan Expo · Hall 3, Booth A8</li>' +
        '</ul>' +
        '<a class="xn-btn xn-btn--primary" data-xn="xenia" href="' + XENIA + '" target="_blank" rel="noopener">Κλείστε ραντεβού στη XENIA</a>' +
        '<p class="xn-modal__alt">Δεν προλαβαίνετε την έκθεση; Σας υποδεχόμαστε στο showroom μας, Καρνεάδου 25, Κολωνάκι.</p>' +
        '<a class="xn-btn xn-btn--ghost" data-xn="showroom" href="' + SHOWROOM + '" target="_blank" rel="noopener">Ραντεβού στο showroom</a>' +
      '</div>' +
    '</div>';

  var lastFocus = null;
  function open(source) {
    lastFocus = document.activeElement;
    modal.classList.remove("is-leaving");
    modal.classList.add("is-open");
    document.documentElement.classList.add("xn-lock");
    modal.querySelector(".xn-modal__close").focus();
    track("xenia_banner_open", { xenia_source: source });
  }
  function close() {
    if (!modal.classList.contains("is-open")) return;
    markSeen();
    modal.classList.add("is-leaving"); // shrinks up towards the bar
    document.documentElement.classList.remove("xn-lock");
    setTimeout(function () { modal.classList.remove("is-open", "is-leaving"); }, 380);
    bar.classList.add("is-pulse");
    setTimeout(function () { bar.classList.remove("is-pulse"); }, 1600);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest(".xn-modal__close")) close();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  bar.querySelector(".xn-bar__info").addEventListener("click", function () { open("bar"); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-xn]");
    if (a) { markSeen(); track("xenia_booking_click", { xenia_booking: a.getAttribute("data-xn") }); }
  });

  document.body.insertBefore(bar, document.body.firstChild);
  document.body.appendChild(modal);
  document.documentElement.classList.add("xn-has-bar");

  // Open once per visitor, a few seconds in — after the cookie banner is answered,
  // and never on top of another popup (e.g. the enquiry form).
  function busy() {
    return document.documentElement.classList.contains("show--consent") ||
      !!document.querySelector(".breakdance-popup.breakdance-popup--open, .breakdance-popup-open");
  }
  function tryOpen() {
    if (seen() || modal.classList.contains("is-open")) return;
    if (busy()) return setTimeout(tryOpen, 1500);
    open("auto");
  }
  if (!seen()) setTimeout(tryOpen, DELAY);
})();
