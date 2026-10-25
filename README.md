# Sun of a Beach – B2B site

Static site for b2b.sunofabeach.com. No CMS, no database. Hosted on Cloudflare Pages; every push to `main` deploys in about a minute.

## Layout
- `index.html`, `hospitality/`, `corporate-gifts/`, … – one folder per page
- `project/<name>/` – project case studies
- `uploads/` – images and video
- `assets/` – styles and scripts (`assets/site.js` handles the enquiry forms)
- `_redirects`, `_headers`, `sitemap.xml`, `robots.txt`

## Enquiry forms
`assets/site.js` sends each enquiry to the matching HubSpot form (portal 143463613) and to `functions/api/enquiry.js`, which emails the team (b2b@sunofabeach.com, subject "<Form> - Business Enquiry from <Company> - <ref>", reply-to = client) and sends the client an instant branded confirmation in English or Greek.

Cloudflare Pages secret needed: `BREVO_API_KEY` (Brevo, same account as the wholesale portal; sunofabeach.com authenticated). Optional: `NOTIFY_TO`, `FROM_TEAM`, `FROM_CLIENT`.

## Adding a page or project
Copy an existing folder, edit the text and images, add the URL to `sitemap.xml`.
