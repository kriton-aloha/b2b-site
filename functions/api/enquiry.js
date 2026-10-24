// Cloudflare Pages Function: POST /api/enquiry
// Secrets (set in Cloudflare Pages > Settings > Variables):
//   HUBSPOT_TOKEN   - HubSpot private app token (scope: crm.objects.contacts.write)
//   RESEND_API_KEY  - Resend.com API key (for the notification email)
//   NOTIFY_TO       - where enquiries are emailed (default business@sunofabeach.com)
//   NOTIFY_FROM     - verified sender, e.g. "B2B Site <website@sunofabeach.com>"

const LABELS = {
  "company name": "Company",
  "full name": "Full name",
  email: "Email",
  phone: "Phone",
  guest_capacity: "Guest capacity",
  number_gifts: "Number of gifts",
  estim_num_gifts: "Estimated number of gifts",
  corp_gifts_type: "Gift type",
  type_event: "Event type",
  attending_guests: "Attending guests",
  message: "Message",
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false }, 400); }

  // honeypot: bots fill the hidden field; pretend success
  if (d.hpname) return json({ ok: true });

  const email = String(d.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !d["full name"] || !d["company name"]) {
    return json({ ok: false, error: "missing fields" }, 400);
  }

  const rows = Object.keys(LABELS)
    .filter((k) => d[k] && String(d[k]).length)
    .map((k) => [LABELS[k], Array.isArray(d[k]) ? d[k].join(", ") : String(d[k]).slice(0, 5000)]);
  const summary = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const source = `${d._form || "Enquiry"} (${d._page || "/"})`;

  const tasks = [];

  if (env.HUBSPOT_TOKEN) {
    const [first, ...rest] = String(d["full name"]).trim().split(/\s+/);
    tasks.push(
      fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.HUBSPOT_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: [{
            idProperty: "email",
            id: email,
            properties: {
              email,
              firstname: first,
              lastname: rest.join(" "),
              phone: d.phone || "",
              company: d["company name"],
              message: `B2B site – ${source}\n\n${summary}`,
            },
          }],
        }),
      }).then((r) => { if (!r.ok) return r.text().then((t) => { throw new Error("hubspot " + r.status + " " + t); }); })
    );
  }

  if (env.RESEND_API_KEY) {
    const html = `<p><b>${esc(source)}</b></p><table>${rows
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table>`;
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.NOTIFY_FROM || "B2B Site <onboarding@resend.dev>",
          to: (env.NOTIFY_TO || "business@sunofabeach.com").split(","),
          reply_to: email,
          subject: `B2B enquiry: ${d["company name"]} – ${d["full name"]}`,
          html,
          text: `${source}\n\n${summary}`,
        }),
      }).then((r) => { if (!r.ok) return r.text().then((t) => { throw new Error("resend " + r.status + " " + t); }); })
    );
  }

  if (!tasks.length) return json({ ok: false, error: "not configured" }, 500);

  const results = await Promise.allSettled(tasks);
  results.filter((r) => r.status === "rejected").forEach((r) => console.error(r.reason));
  // succeed if at least one channel worked, so no lead is lost silently
  const anyOk = results.some((r) => r.status === "fulfilled");
  return json({ ok: anyOk }, anyOk ? 200 : 502);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
