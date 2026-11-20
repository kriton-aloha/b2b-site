// XENIA 2026 banner: added to HTML pages only for visitors from Greece, until the show ends.
// Test from abroad with ?geo=GR on any page. Remove this file (and assets/xenia.*) after the show.
const END = Date.parse("2026-11-23T22:00:00Z"); // end of Monday 23 Nov 2026, Athens
const TAG = '<link rel="stylesheet" href="/assets/xenia.css?v=3"><script src="/assets/xenia.js?v=3" defer></script>';

export async function onRequest(ctx) {
  const res = await ctx.next();
  if (Date.now() > END) return res;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;

  const url = new URL(ctx.request.url);
  if (/^\/(lookbook|hotels-resorts|villas-yachts)/.test(url.pathname)) return res; // client presentation: no banner
  const country = (url.searchParams.get("geo") || ctx.request.cf?.country || "").toUpperCase();
  if (country !== "GR") return res;

  return new HTMLRewriter()
    .on("body", { element(el) { el.append(TAG, { html: true }); } })
    .transform(res);
}
