# Sun of a Beach – B2B site

Static site for b2b.sunofabeach.com. No CMS, no database. Hosted on Cloudflare Pages; every push to `main` deploys in about a minute.

## Layout
- `index.html`, `hospitality/`, `corporate-gifts/`, … – one folder per page
- `project/<name>/` – project case studies
- `uploads/` – images and video
- `assets/` – styles and scripts (`assets/site.js` handles the enquiry forms)
- `_redirects`, `_headers`, `sitemap.xml`, `robots.txt`

## Enquiry forms
`assets/site.js` sends each enquiry to the matching HubSpot form (portal 143463613) and emails a copy to business@sunofabeach.com through FormSubmit.co. No keys or settings needed. The first enquiry triggers one FormSubmit activation email to business@, which someone clicks once.

## Adding a page or project
Copy an existing folder, edit the text and images, add the URL to `sitemap.xml`.
