// POST /api/enquiry
// Sends (1) the enquiry to the team and (2) an instant confirmation to the client.
// Cloudflare Pages > Settings > Variables and secrets:
//   BREVO_API_KEY   (required)  Brevo API key (SMTP & API > API keys); sunofabeach.com authenticated in Brevo
//   NOTIFY_TO       (optional)  default "b2b@sunofabeach.com"
//   FROM_TEAM       (optional)  default "B2B Website <website@sunofabeach.com>"
//   FROM_CLIENT     (optional)  default "Sun of a Beach for Business <b2b@sunofabeach.com>"

const SITE = "https://b2b.sunofabeach.com";
let LOGO = SITE + "/uploads/email/logo.png"; // set per request to the domain actually serving the site
const PHONE = "+30 210 7231646";
const GOLD = "#bfa582", INK = "#1d1d16", SAND = "#f6f3ee", MUTED = "#7a7466";

// form name -> subject label (same labels the team already uses) + client-facing wording
const FORMS = {
  "Hospitality Contact Form":     { label: "Hospitality",     en: "hospitality",     el: "για τη συλλογή Hospitality" },
  "Corporate Gifts Contact Form": { label: "Corporate Gifts", en: "corporate gifts", el: "για εταιρικά δώρα" },
  "Social Events Contact Form":   { label: "Social Events",   en: "event gifts",     el: "για δώρα εκδηλώσεων" },
  "Welcome Gifts Contact Form":   { label: "Welcome Gifts",   en: "welcome gifts",   el: "για welcome gifts" },
  "Generic Contact Form":         { label: "Generic Form",    en: "",                el: "" },
};

const FIELDS = [
  ["company name", "Company", "Εταιρεία"],
  ["full name", "Name", "Όνομα"],
  ["email", "Email", "Email"],
  ["phone", "Phone", "Τηλέφωνο"],
  ["guest_capacity", "Guest capacity", "Χωρητικότητα"],
  ["number_gifts", "Number of gifts", "Αριθμός δώρων"],
  ["estim_num_gifts", "Number of gifts", "Αριθμός δώρων"],
  ["corp_gifts_type", "Gift type", "Τύπος δώρων"],
  ["type_event", "Event type", "Τύπος εκδήλωσης"],
  ["attending_guests", "Guests attending", "Καλεσμένοι"],
];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim().slice(0, 4000);

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false }, 400); }
  LOGO = new URL("/uploads/email/logo.png", request.url).href;

  if (d.hpname) return json({ ok: true });                       // honeypot
  if (d._t && Date.now() - Number(d._t) < 3000) return json({ ok: true }); // filled too fast = bot

  const email = val(d.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !val(d["full name"]) || !val(d["company name"])) {
    return json({ ok: false, error: "missing fields" }, 400);
  }
  if (!env.BREVO_API_KEY) return json({ ok: false, error: "email not configured" }, 503);

  const form = FORMS[d._form] || FORMS["Generic Contact Form"];
  const ref = Math.floor(Date.now() / 1000);
  const name = val(d["full name"]).toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, c) => a + c.toUpperCase());
  const first = name.split(/\s+/)[0];
  const company = val(d["company name"]);
  const message = val(d.message);
  const greek = /[Ͱ-Ͽ]/.test(name + message);
  const rows = FIELDS.filter(([k]) => val(d[k])).map(([k, en, el]) => [en, el, val(d[k]), k]);
  const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/Athens", dateStyle: "medium", timeStyle: "short" });

  const subject = `${form.label} - Business Enquiry from ${company} - ${ref}`;

  const team = {
    from: env.FROM_TEAM || "B2B Website <website@sunofabeach.com>",
    to: (env.NOTIFY_TO || "b2b@sunofabeach.com").split(",").map((s) => s.trim()),
    reply_to: `${name} <${email}>`,
    subject,
    html: teamHtml({ form, name, company, email, phone: val(d.phone), rows, message, when, page: val(d._page), subject }),
    text: `${subject}\n\n${rows.map((r) => `${r[0]}: ${r[2]}`).join("\n")}\n\nMessage:\n${message}\n\nSent ${when} from ${SITE}${val(d._page)}\nReply to this email to answer the client directly.`,
  };

  const client = {
    from: env.FROM_CLIENT || "Sun of a Beach for Business <b2b@sunofabeach.com>",
    to: [email],
    reply_to: (env.NOTIFY_TO || "b2b@sunofabeach.com").split(",")[0].trim(),
    subject: greek ? "Σας ευχαριστούμε για το ενδιαφέρον σας στη Sun of a Beach" : "Thank you for your interest in Sun of a Beach",
    html: clientHtml({ greek, form, first, rows, message }),
    text: clientText({ greek, form, first }),
  };

  // Brevo transactional email API
  const addr = (s) => { const m = String(s).match(/^\s*(.*?)\s*<([^>]+)>\s*$/); return m ? { name: m[1], email: m[2] } : { email: String(s).trim() }; };
  const send = (m) =>
    fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: addr(m.from),
        to: m.to.map(addr),
        replyTo: addr(m.reply_to),
        subject: m.subject,
        htmlContent: m.html,
        textContent: m.text,
        tags: ["b2b-site"],
      }),
    }).then(async (r) => { if (!r.ok) throw new Error(`brevo ${r.status} ${await r.text()}`); });

  const [teamRes, clientRes] = await Promise.allSettled([send(team), send(client)]);
  if (teamRes.status === "rejected") console.error("team email", teamRes.reason);
  if (clientRes.status === "rejected") console.error("client email", clientRes.reason);
  // Brevo's error text (no secrets) helps diagnose sender/IP/key problems
  const why = (r) => (r.status === "rejected" ? String(r.reason).replace(/^Error:\s*/, "").slice(0, 300) : undefined);
  return teamRes.status === "fulfilled"
    ? json({ ok: true, ref, clientEmail: clientRes.status === "fulfilled" ? "sent" : why(clientRes) })
    : json({ ok: false, error: why(teamRes) }, 502);
}

// ---------- templates ----------
function shell(inner, preheader) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${SAND};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:${INK};">
<tr><td align="center" style="padding:28px 24px 20px;border-bottom:3px solid ${GOLD};"><a href="${SITE}"><img src="${LOGO}" width="180" alt="Sun of a Beach – Hospitality &amp; Corporate" style="display:block;border:0;width:180px;height:auto;"></a></td></tr>
${inner}
<tr><td style="padding:20px 32px;background:${INK};color:#d9d4c7;font-size:12px;line-height:18px;" align="center">
Sun of a Beach · Showroom: Karneadou 25, 106 75 Athens, Greece<br>
<a href="tel:${PHONE.replace(/\s/g, "")}" style="color:#d9d4c7;">${PHONE}</a> · <a href="${SITE}" style="color:#d9d4c7;">b2b.sunofabeach.com</a> · <a href="https://www.instagram.com/sunofabeachtowels/" style="color:#d9d4c7;">Instagram</a>
</td></tr></table></td></tr></table></body></html>`;
}

function table(rows, labelIdx) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:22px;">${rows
    .map((r) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee9df;color:${MUTED};width:38%;vertical-align:top;">${esc(r[labelIdx])}</td><td style="padding:8px 0;border-bottom:1px solid #eee9df;vertical-align:top;">${r.html || esc(r[2])}</td></tr>`)
    .join("")}</table>`;
}

function button(href, text, solid) {
  return `<a href="${href}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 20px;border-radius:3px;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:.5px;${
    solid ? `background:${GOLD};color:#ffffff;border:1px solid ${GOLD};` : `background:#ffffff;color:${INK};border:1px solid ${INK};`}">${text}</a>`;
}

function teamHtml({ form, name, company, email, phone, rows, message, when, page, subject }) {
  const linked = rows.filter((r) => r[3] !== "company name" && r[3] !== "full name").map((r) => {
    const row = [...r];
    if (r[3] === "email") row.html = `<a href="mailto:${esc(email)}" style="color:${INK};">${esc(email)}</a>`;
    if (r[3] === "phone") row.html = `<a href="tel:${esc(phone.replace(/[^\d+]/g, ""))}" style="color:${INK};">${esc(phone)}</a>`;
    return row;
  });
  const hubspot = `https://app.hubspot.com/contacts/143463613/objects/0-1/views/all/list?query=${encodeURIComponent(email)}`;
  const reply = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: " + subject)}`;
  return shell(`
<tr><td style="padding:28px 32px 8px;">
  <div style="font-size:12px;letter-spacing:2px;color:${GOLD};font-weight:bold;text-transform:uppercase;">New ${esc(form.label === "Generic Form" ? "website" : form.label)} enquiry</div>
  <div style="font-size:24px;line-height:30px;margin-top:6px;font-weight:bold;">${esc(company)}</div>
  <div style="font-size:15px;color:${MUTED};margin-top:2px;">${esc(name)}</div>
</td></tr>
<tr><td style="padding:16px 32px 4px;">${table(linked, 0)}</td></tr>
${message ? `<tr><td style="padding:16px 32px 0;"><div style="font-size:12px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;margin-bottom:6px;">Message</div>
<div style="background:${SAND};border-left:3px solid ${GOLD};padding:14px 16px;font-size:15px;line-height:23px;white-space:pre-wrap;">${esc(message)}</div></td></tr>` : ""}
<tr><td style="padding:22px 32px 6px;">${button(reply, `Reply to ${esc(name.split(/\s+/)[0])}`, true)}${phone ? button(`tel:${esc(phone.replace(/[^\d+]/g, ""))}`, "Call") : ""}${button(hubspot, "Open in HubSpot")}</td></tr>
<tr><td style="padding:10px 32px 26px;font-size:12px;color:${MUTED};line-height:18px;">Received ${esc(when)} (Athens) from <a href="${SITE}${esc(page)}" style="color:${MUTED};">${esc(page || "/")}</a>. Hitting Reply answers the client directly. They already got an automatic confirmation.</td></tr>`,
    `${name} – ${message.slice(0, 90)}`);
}

function clientHtml({ greek, form, first, rows, message }) {
  const summary = rows.filter((r) => r[3] !== "email");
  if (message) summary.push(["Message", "Μήνυμα", message, "message"]);
  const t = greek
    ? {
        hi: "Γεια σας,",
        p1: `Σας ευχαριστούμε για την επικοινωνία και για το ενδιαφέρον σας στη <b>Sun of a Beach</b>. Λάβαμε το αίτημά σας${form.el ? " " + esc(form.el) : ""} και ένα μέλος της ομάδας μας θα το εξετάσει και θα επικοινωνήσει σύντομα μαζί σας.`,
        p2: `Αν το αίτημά σας είναι επείγον ή προτιμάτε να το συζητήσουμε τηλεφωνικά, καλέστε μας στο <a href="tel:+302107231646" style="color:${INK};">210 7231646</a> (Δευτέρα–Παρασκευή, 9:00–17:00) ή απαντήστε απλώς σε αυτό το email.`,
        sum: "Το αίτημά σας",
        p3: "Στο μεταξύ, δείτε πώς έχουμε συνεργαστεί με ξενοδοχεία και εταιρείες όπως Four Seasons, W Costa Navarino και One&amp;Only.",
        cta: "Δείτε τα projects μας",
        bye: "Με εκτίμηση,<br><b>Η ομάδα της Sun of a Beach for Business</b>",
        lab: 1,
      }
    : {
        hi: `Dear ${esc(first)},`,
        p1: `Thank you for reaching out and for your interest in <b>Sun of a Beach</b>. We've received your ${form.en ? esc(form.en) + " " : ""}enquiry and a member of our team will review it and get back to you shortly with more details.`,
        p2: `Should your request be time-sensitive, or if you'd prefer to discuss it over the phone, call us on <a href="tel:+302107231646" style="color:${INK};">${PHONE}</a> (Monday–Friday, 9:00–17:00 Athens time). You can also simply reply to this email.`,
        sum: "Your enquiry",
        p3: "In the meantime, see how we've worked with hotels and brands such as Four Seasons, W Costa Navarino and One&amp;Only.",
        cta: "View our projects",
        bye: "Warm regards,<br><b>Sun of a Beach for Business Team</b>",
        lab: 0,
      };
  const msgRow = summary.map((r) => (r[3] === "message" ? Object.assign([...r], { html: `<span style="white-space:pre-wrap;">${esc(r[2])}</span>` }) : r));
  return shell(`
<tr><td style="padding:32px 32px 4px;font-size:16px;line-height:25px;">
  <p style="margin:0 0 16px;">${t.hi}</p>
  <p style="margin:0 0 16px;">${t.p1}</p>
  <p style="margin:0 0 8px;">${t.p2}</p>
</td></tr>
<tr><td style="padding:16px 32px 4px;"><div style="font-size:12px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;margin-bottom:4px;">${t.sum}</div>${table(msgRow, t.lab)}</td></tr>
<tr><td style="padding:24px 32px 8px;font-size:16px;line-height:25px;"><p style="margin:0 0 16px;">${t.p3}</p>${button(SITE + "/projects/", t.cta, true)}</td></tr>
<tr><td style="padding:16px 32px 32px;font-size:16px;line-height:25px;">${t.bye}</td></tr>`,
    greek ? "Λάβαμε το αίτημά σας. Θα επικοινωνήσουμε σύντομα μαζί σας." : "We've received your enquiry and will be in touch shortly.");
}

function clientText({ greek, form, first }) {
  return greek
    ? `Γεια σας ${first},\n\nΣας ευχαριστούμε που επικοινωνήσατε με τη Sun of a Beach. Λάβαμε το αίτημά σας${form.el ? " " + form.el : ""} και ένα μέλος της ομάδας μας θα επικοινωνήσει σύντομα μαζί σας.\n\nΓια κάτι επείγον: 210 7231646 (Δευτέρα–Παρασκευή, 9:00–17:00) ή απαντήστε σε αυτό το email.\n\nΜε εκτίμηση,\nΗ ομάδα της Sun of a Beach for Business\n${SITE}`
    : `Dear ${first},\n\nThank you for contacting Sun of a Beach. We've received your ${form.en ? form.en + " " : ""}enquiry and a member of our team will get back to you shortly.\n\nIf it's time-sensitive, call us on ${PHONE} (Mon–Fri, 9:00–17:00 Athens time) or just reply to this email.\n\nWarm regards,\nSun of a Beach for Business Team\n${SITE}`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

// exported for previews/tests
export const _templates = { teamHtml, clientHtml, FORMS, FIELDS };
