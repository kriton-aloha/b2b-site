# Sun of a Beach – B2B site

Static site for b2b.sunofabeach.com. No CMS, no database. Hosted on Cloudflare Pages; every push to `main` deploys in about a minute.

## Layout
- `index.html`, `hospitality/`, `corporate-gifts/`, … – one folder per page
- `project/<name>/` – project case studies
- `uploads/` – images and video
- `assets/` – styles and scripts (`assets/site.js` handles the enquiry forms)
- `functions/api/enquiry.js` – receives form submissions, emails them and adds the contact to HubSpot
- `_redirects`, `_headers`, `sitemap.xml`, `robots.txt`

## Enquiry form settings (Cloudflare Pages → Settings → Variables and secrets)
| Name | Value |
|---|---|
| `HUBSPOT_TOKEN` | HubSpot private app token, scope `crm.objects.contacts.write` |
| `RESEND_API_KEY` | Resend.com API key |
| `NOTIFY_TO` | Recipient(s), comma-separated. Default `business@sunofabeach.com` |
| `NOTIFY_FROM` | Sender on a verified domain, e.g. `B2B Site <website@sunofabeach.com>` |

Either HubSpot or email alone is enough for the form to work.

## Adding a page or project
Copy an existing folder, edit the text and images, add the URL to `sitemap.xml`.
