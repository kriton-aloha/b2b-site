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
var NOTIFY_EMAIL = "business@sunofabeach.com";
var LABELS = {
  "company name": "Company", "full name": "Full name", email: "Email", phone: "Phone",
  guest_capacity: "Guest capacity", number_gifts: "Number of gifts",
  estim_num_gifts: "Estimated number of gifts", corp_gifts_type: "Gift type",
  type_event: "Event type", attending_guests: "Attending guests", message: "Message"
};

function cookie(name) {
  var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
  return m ? decodeURIComponent(m[1]) : undefined;
}

function sendHubspot(formName, d, summary) {
  var guid = HUBSPOT_FORMS[formName] || HUBSPOT_FORMS["Generic Contact Form"];
  var parts = String(d["full name"] || "").trim().split(/\s+/);
  var fields = [
    ["email", d.email], ["firstname", parts.shift() || ""], ["lastname", parts.join(" ")],
    ["company", d["company name"]], ["phone", d.phone], ["message", summary]
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

function sendEmail(formName, d, rows) {
  var body = { _subject: "B2B enquiry: " + (d["company name"] || "") + " – " + (d["full name"] || ""),
               _replyto: d.email, _template: "table", Form: formName, Page: location.pathname };
  rows.forEach(function (r) { body[r[0]] = r[1]; });
  return fetch("https://formsubmit.co/ajax/" + NOTIFY_EMAIL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
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
  function done() {
    form.reset();
    form.style.display = "none";
    msg.textContent = "Your message has been received!";
    if (window.dataLayer) window.dataLayer.push({ event: "enquiry_submitted", form_name: formName });
  }
  if (d.hpname) { done(); return; } // bot filled the hidden field

  var rows = Object.keys(LABELS).filter(function (k) { return d[k] && String(d[k]).length; })
    .map(function (k) { return [LABELS[k], Array.isArray(d[k]) ? d[k].join(", ") : String(d[k])]; });
  var summary = "B2B site – " + formName + " (" + location.pathname + ")\n\n" +
    rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");

  var btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.style.opacity = ".6"; }
  msg.textContent = "";

  Promise.allSettled([sendHubspot(formName, d, summary), sendEmail(formName, d, rows)]).then(function (res) {
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
