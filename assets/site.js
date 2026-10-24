// Enquiry forms: send to /api/enquiry (email + HubSpot)
document.addEventListener("submit", async function (e) {
  var form = e.target;
  if (!form.matches || !form.matches("form.breakdance-form")) return;
  e.preventDefault();
  e.stopImmediatePropagation();

  var btn = form.querySelector('button[type="submit"]');
  var data = {};
  new FormData(form).forEach(function (v, k) {
    var key = k.replace(/^fields\[/, "").replace(/\]\[\]$|\]$/, "");
    if (k.endsWith("[]")) (data[key] = data[key] || []).push(v);
    else data[key] = v;
  });
  var formName = "";
  try { formName = JSON.parse(form.dataset.options || "{}").name || ""; } catch (_) {}
  data._form = formName;
  data._page = location.pathname;

  var msg = form.parentNode.querySelector(".enquiry-msg");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "enquiry-msg";
    msg.setAttribute("role", "status");
    msg.style.cssText = "padding:16px 0;font-size:16px;";
    form.parentNode.insertBefore(msg, form.nextSibling);
  }

  if (btn) { btn.disabled = true; btn.style.opacity = ".6"; }
  try {
    var r = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    form.style.display = "none";
    msg.textContent = "Your message has been received!";
    if (window.dataLayer) window.dataLayer.push({ event: "enquiry_submitted", form_name: formName });
  } catch (err) {
    msg.textContent = "Something went wrong. Please call us on +30 210 7231646 or email business@sunofabeach.com.";
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = ""; }
  }
}, true);
