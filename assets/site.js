// ---------- Enquiry forms ----------
// Each form goes to HubSpot (same forms the old site fed) and to an email copy.
var HUBSPOT_PORTAL = "143463613";
var HUBSPOT_FORMS = {
  "Generic Contact Form": "0d09aa64-3a60-4fb4-b6b5-184df0a9ab20",
  "Hospitality Contact Form": "f75f542e-a8be-47aa-9e36-3c9b716f4819",
  "Corporate Gifts Contact Form": "01f29217-49b7-42c0-882b-f92be33fc6b5",
  "Social Events Contact Form": "e937085e-4599-4649-a17d-36e83084efe6",
  "Welcome Gifts Contact Form": "5d9d2b9e-6e42-4825-b3d0-f5ec2dc9fde7"
};
var NOTIFY_EMAIL = "b2b@sunofabeach.com";
var LABELS = {
  "company name": "Company", "full name": "Full name", email: "Email", phone: "Phone",
  interested_in: "Interested in", property_type: "Type of property", property_size: "Size",
  hosp_interest: "Interested in", guest_capacity: "Guest capacity", number_gifts: "Number of gifts",
  estim_num_gifts: "Number of gifts", corp_gifts_type: "Occasion", personalisation: "Logo / personalisation",
  delivery_date: "Needed by", type_event: "Event type", attending_guests: "Guests", event_date: "Event date",
  country: "Country", timeline: "When needed", website: "Website", message: "Message",
  marketing_consent: "Marketing emails OK"
};

// ---------- Size question depends on the type of property ----------
var SIZE_OPTIONS = {
  "Hotel": ["Number of rooms", ["1–19 rooms", "20–29 rooms", "30–49 rooms", "50–99 rooms", "100+ rooms"]],
  "Resort": ["Number of rooms", ["1–19 rooms", "20–29 rooms", "30–49 rooms", "50–99 rooms", "100+ rooms"]],
  "Boutique hotel": ["Number of rooms", ["1–19 rooms", "20–29 rooms", "30–49 rooms", "50–99 rooms", "100+ rooms"]],
  "Villas": ["Number of villas you manage", ["1 villa", "2–4 villas", "5–10 villas", "10+ villas"]],
  "Beach club": ["Number of sunbeds", ["Under 50 sunbeds", "50–100 sunbeds", "100–200 sunbeds", "200+ sunbeds"]],
  "Yacht": ["Number of yachts", ["1 yacht", "2–5 yachts", "6+ yachts"]],
  "Rooms to let / apartments": ["Number of units", ["1–5 units", "6–19 units", "20+ units"]],
  "Other": ["Number of units", ["1–5 units", "6–19 units", "20+ units"]]
};
// Small properties: suggest the e-shop bundle builder (they can still send the form)
var SMALL = { "1–19 rooms": "Equipping a smaller hotel?", "1 villa": "Equipping a villa?", "2–4 villas": "Equipping a few villas?",
  "1 yacht": "Equipping a yacht?", "1–5 units": "Equipping a smaller property?", "6–19 units": "Equipping a smaller property?" };

// Qualified = the kind of buyer we want Meta/LinkedIn to find more of
function qualification(formName, d) {
  var size = d.property_size || "", type = d.property_type || "";
  if (formName === "Welcome Gifts Contact Form") return /^(100|250|500)/.test(d.number_gifts || "") ? [true, "Welcome gifts, " + d.number_gifts] : [false, "Welcome gifts, under 100"];
  if (formName === "Hospitality Contact Form") {
    if (/^(Hotel|Resort|Boutique hotel)$/.test(type)) return /^(20|30|50|100)/.test(size) ? [true, type + ", " + size] : [false, type + " under 20 rooms"];
    if (type === "Villas") return /^(5|10)/.test(size) ? [true, "Villas, " + size] : [false, "Villas, " + size];
    if (type === "Beach club") return /^(50|100|200)/.test(size) ? [true, "Beach club, " + size] : [false, "Beach club, " + size];
    if (type === "Yacht") return /^(2|6)/.test(size) ? [true, "Yachts, " + size] : [false, "Single yacht"];
    return [false, type || "Property type not given"];
  }
  if (formName === "Corporate Gifts Contact Form") return /^(100|300|1,000)/.test(d.estim_num_gifts || "") ? [true, "Corporate, " + d.estim_num_gifts + " gifts"] : [false, "Corporate, under 100 gifts"];
  if (formName === "Social Events Contact Form") return /^(100|300)/.test(d.attending_guests || "") ? [true, "Event, " + d.attending_guests + " guests"] : [false, "Event, under 100 guests"];
  return [false, "General enquiry"];
}

document.addEventListener("change", function (e) {
  var el = e.target, form = el.form;
  if (!form || !form.matches("form.breakdance-form")) return;
  var name = el.getAttribute("name");
  if (name === "fields[property_type]") {
    var sizeSel = form.querySelector('[name="fields[property_size]"]'), cfg = SIZE_OPTIONS[el.value];
    var label = sizeSel.closest(".breakdance-form-field").querySelector("label");
    sizeSel.innerHTML = "";
    var first = document.createElement("option"); first.value = ""; first.textContent = cfg ? "Select..." : "Select type of property first"; sizeSel.appendChild(first);
    if (cfg) cfg[1].forEach(function (o) { var op = document.createElement("option"); op.value = op.textContent = o; sizeSel.appendChild(op); });
    label.firstChild.textContent = " " + (cfg ? cfg[0] : "Size of property");
    toggleNote(form, "");
  }
  if (name === "fields[property_size]") toggleNote(form, el.value);
  if (name === "fields[interested_in]") {
    var pn = form.querySelector(".soab-personal-note");
    if (pn) pn.style.display = el.value === "Something for myself" ? "block" : "none";
  }
});
function toggleNote(form, size) {
  var note = form.querySelector(".soab-eshop-note"); if (!note) return;
  var title = SMALL[size];
  note.style.display = title ? "block" : "none";
  if (title) note.querySelector(".soab-eshop-note__title").textContent = title;
}
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest(".soab-eshop-link, .soab-personal-note a");
  if (a) (window.dataLayer = window.dataLayer || []).push({ event: a.classList.contains("soab-eshop-link") ? "eshop_bundle_click" : "eshop_personal_click" });
});

function cookie(name) {
  var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
  return m ? decodeURIComponent(m[1]) : undefined;
}

// ---------- Lead source (UTMs / click IDs), kept for the visit ----------
var THANK_YOU = {
  "Hospitality Contact Form": "/thank-you/hospitality/",
  "Welcome Gifts Contact Form": "/thank-you/welcome-gifts/",
  "Corporate Gifts Contact Form": "/thank-you/corporate-gifts/",
  "Social Events Contact Form": "/thank-you/events/",
  "Generic Contact Form": "/thank-you/general/"
};
var ATTR = (function () {
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "li_fat_id"];
  var q = new URLSearchParams(location.search), now = {}, has = false, saved = null;
  keys.forEach(function (k) { if (q.get(k)) { now[k] = q.get(k).slice(0, 200); has = true; } });
  try { saved = JSON.parse(sessionStorage.getItem("soab_attr") || "null"); } catch (_) {}
  if (has || !saved) {
    now.landing_page = location.pathname;
    var ref = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer : "";
    if (ref) now.referrer = ref.slice(0, 200);
    saved = now;
    try { sessionStorage.setItem("soab_attr", JSON.stringify(saved)); } catch (_) {}
  }
  return saved || {};
})();
function sourceText() {
  var a = ATTR, parts = [];
  if (a.utm_source || a.utm_medium) parts.push((a.utm_source || "?") + " / " + (a.utm_medium || "?"));
  if (a.utm_campaign) parts.push("campaign: " + a.utm_campaign);
  if (a.utm_content) parts.push("ad: " + a.utm_content);
  if (a.utm_term) parts.push("keyword: " + a.utm_term);
  if (a.gclid) parts.push("Google Ads click");
  if (a.fbclid) parts.push("Meta click");
  if (a.li_fat_id) parts.push("LinkedIn click");
  if (!parts.length) parts.push(a.referrer ? "referral: " + a.referrer.replace(/^https?:\/\//, "").split("/")[0] : "direct / organic");
  if (a.landing_page) parts.push("landed on " + a.landing_page);
  return parts.join(", ");
}

function sendHubspot(formName, d, summary) {
  var guid = HUBSPOT_FORMS[formName] || HUBSPOT_FORMS["Generic Contact Form"];
  // HubSpot keeps only "firstname" for these forms, so send the full name there (as the old site did)
  var fields = [
    ["email", d.email], ["firstname", String(d["full name"] || "").trim()],
    ["company", d["company name"]], ["phone", d.phone], ["website", d.website], ["country", d.country], ["message", summary]
  ].filter(function (f) { return f[1]; }).map(function (f) { return { name: f[0], value: String(f[1]) }; });
  var context = { pageUri: location.href, pageName: document.title };
  var hutk = cookie("hubspotutk");
  if (hutk) context.hutk = hutk;
  return fetch("https://api.hsforms.com/submissions/v3/integration/submit/" + HUBSPOT_PORTAL + "/" + guid, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: fields, context: context })
  }).then(function (r) { if (!r.ok) throw new Error("hubspot " + r.status); });
}

var PAGE_LOADED = Date.now();

// Team notification + instant reply to the client (functions/api/enquiry.js)
function sendEmail(formName, d) {
  var body = Object.assign({}, d, { _form: formName, _page: location.pathname, _t: PAGE_LOADED, _source: sourceText(), _attr: ATTR });
  return fetch("/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function (r) { if (!r.ok) throw new Error("email " + r.status); });
}

document.addEventListener("submit", function (e) {
  var form = e.target;
  if (!form.matches || !form.matches("form.breakdance-form")) return;
  e.preventDefault();
  e.stopImmediatePropagation();

  var d = {};
  new FormData(form).forEach(function (v, k) {
    var key = k.replace(/^fields\[/, "").replace(/\]\[\]$|\]$/, "");
    if (/\[\]$/.test(k)) (d[key] = d[key] || []).push(v); else d[key] = v;
  });
  var formName = "";
  try { formName = JSON.parse(form.dataset.options || "{}").name || ""; } catch (_) {}

  var msg = form.parentNode.querySelector(".enquiry-msg");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "enquiry-msg";
    msg.setAttribute("role", "status");
    msg.style.cssText = "padding:16px 0;font-size:16px;";
    form.parentNode.insertBefore(msg, form.nextSibling);
  }
  function done(isBot) {
    form.reset();
    form.style.display = "none";
    // class kept from the old site: GTM fires the lead conversions when this becomes visible
    msg.className = "enquiry-msg breakdance-form-message breakdance-form-message--success";
    msg.textContent = "Your message has been received!";
    if (isBot) return;
    var journey = (THANK_YOU[formName] || THANK_YOU["Generic Contact Form"]).split("/")[2];
    var dl = (window.dataLayer = window.dataLayer || []);
    dl.push({ event: "enquiry_submitted", form_name: formName, journey: journey, qualified: d._qualified === "Yes" });
    if (d._qualified === "Yes") dl.push({ event: "enquiry_qualified", form_name: formName, journey: journey });
    // Meta: real submissions only (fbq exists only after cookie consent). Campaigns should optimise on QualifiedEnquiry.
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", "EnquirySubmitted", { journey: journey });
      if (d._qualified === "Yes") window.fbq("trackCustom", "QualifiedEnquiry", { journey: journey });
    }
    setTimeout(function () { location.href = THANK_YOU[formName] || THANK_YOU["Generic Contact Form"]; }, 1200);
  }
  if (d.hpname) { done(true); return; } // bot filled the hidden field

  var rows = Object.keys(LABELS).filter(function (k) { return d[k] && String(d[k]).length; })
    .map(function (k) { return [LABELS[k], Array.isArray(d[k]) ? d[k].join(", ") : String(d[k])]; });
  var q = qualification(formName, d);
  d._qualified = q[0] ? "Yes" : "No"; d._qualified_reason = q[1];
  var summary = "B2B site – " + formName + " (" + location.pathname + ")\n" +
    "Qualified: " + d._qualified + " (" + q[1] + ")\n\n" +
    rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n") +
    "\n\nSource: " + sourceText();

  var btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.style.opacity = ".6"; }
  msg.textContent = "";

  Promise.allSettled([sendHubspot(formName, d, summary), sendEmail(formName, d)]).then(function (res) {
    if (res.some(function (r) { return r.status === "fulfilled"; })) done();
    else msg.textContent = "Something went wrong. Please call us on +30 210 7231646 or email " + NOTIFY_EMAIL + ".";
    res.forEach(function (r) { if (r.status === "rejected") console.warn(r.reason); });
  }).finally(function () {
    if (btn) { btn.disabled = false; btn.style.opacity = ""; }
  });
}, true);

// ---------- Videos further down the page: load only when visible ----------
(function () {
  var vids = document.querySelectorAll("video[data-lazy-video]");
  if (!vids.length) return;
  function start(v) { v.preload = "auto"; v.play().catch(function () {}); }
  if (!("IntersectionObserver" in window)) { vids.forEach(start); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) start(en.target); else en.target.pause();
    });
  }, { rootMargin: "300px 0px" });
  vids.forEach(function (v) { io.observe(v); });
})();
