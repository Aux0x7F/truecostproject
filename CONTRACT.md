# True Cost Project Contract

This file is the working contract for this workspace. Follow it before local preference, generic web advice, or stale history.

## Mission

True Cost Project is building a small public launch site for animal rights advocacy and investor-facing credibility.

The work centers on exposing and challenging investments in animal-based, vivisection, animal agriculture, and related murder-industries. These industries cage captives, treat them as products, and convert flesh, fear, confinement, and stolen freedom into public and private cost.

We are vegans speaking vegan. Do not soften the premise to make cruelty comfortable. Use the enlightened vernacular where it fits: cages, captives, he, she, they, flesh, dreams, freedom, consent, extraction, captivity, slaughter, exploitation, and liberation.

The tone is a positive go-getter facing widespread cruelty. It should be direct, useful, and alive.

## Audience

The site must work for:

- Animal rights advocates and total liberationists.
- Vegans who expect clear moral language.
- People who do not want tax dollars funding animal agriculture, vivisection, or other animal-based harm.
- Investors, donors, volunteers, tipsters, and adjacent supporters who need a fast read on credibility and action.

## Voice Rules

- Use human language. No synthetic filler.
- Avoid AI-isms: no em dashes, no triple-comma rhythm, no lazy negative-positive contrast sentences, no padded setup phrases, no corporate mush.
- Do not call captive animals "it."
- Do not hide the violence behind neutral industry phrasing when plain language is better.
- Keep CTAs short and active.
- Placeholder copy is allowed while client copy is pending, but it must be obviously temporary and sized to the expected final copy.

## Launch Priority

Order of priority:

1. Scrapeable Git-hosted static pages.
2. Broken-link-safe public launch.
3. Concise layout and concise code.
4. Stable responsive layout.
5. Single shared CSS file and single shared JS file.
6. Modular, normalized sections that can be copied across pages.
7. Multiple simple HTML endpoints.
8. Polyfills where they protect common browser behavior.
9. Progressive enhancement only after the static page works.
10. Heavy calls, fancy motion, embedded dependencies, and fragile experiences are anti-priority.

Never trade a working static launch for a clever interaction.

## Technical Shape

- Build as plain static HTML, CSS, and JS unless the user explicitly changes direction.
- Target GitHub Pages or another static host.
- Prefer `index.html`, `about.html`, `act.html`, `supporters.html`, `privacy.html`, and `terms.html`.
- Keep `merch.html` hidden or absent until explicitly needed.
- Keep shared assets under an `assets/` folder.
- Use one global stylesheet, normally `assets/styles.css`.
- Use one global script, normally `assets/site.js`.
- Do not require a build step for the public site.
- Do not require network calls for first paint.
- External forms and social destinations can be normal links until the client provides final embed or form details.
- Forms should be external destinations, not jump-page handoffs.
- Until final external URLs arrive, form and donation CTAs should be dead links that do not move the page.
- Images may be placeholder gradients or aspect-ratio blocks until final art arrives.
- Org logos may be treated as square placeholders until final files arrive.

## Required Workspace Skill

For architecture, refactor, runtime/product convergence, devops, proof, metrics, browser/lab verification, or repeated diagnostic drift, follow:

```text
constitute-workspace/skills/architectural-systems-thinking.md
```

For workspace devops, proof, or metrics orchestration, use:

```text
node constitute-workspace/tools/constitution-ops.mjs ...
```

Use direct scripts only when repairing the operator plane itself or when the operator plane is missing and the work is blocked without a direct check. If the required skill or operator plane is missing, state that plainly and choose the smallest safe fallback.

## Current Launch Scope

Global navigation:

- About
- Act
- Supporters
- Merch hidden for now

Primary CTA:

- Donate

Important links still pending:

- Volunteer form
- Email updates signup
- Tips destination, likely CryptPad
- Donation page
- Instagram
- Facebook
- Other social links

Important assets still pending:

- Final brand asset, if the client replaces the temporary Anton wordmark
- Hero image, desktop aspect
- Hero image, mobile aspect
- Misc banners
- Forms banner or cover
- About banner
- Supporter logos

## Wireframe Reading

The supplied wireframes define the mobile-first behavior.

Header:

- Use the local Anton wordmark at left instead of a logo until final branding arrives.
- Hamburger menu at right on mobile.
- Desktop breakpoints should show expanded navigation full time.
- Non-homepage hamburger menus should include Home.
- Desktop navigation should not show Home unless explicitly requested.
- Keep the logo and menu visible while scrolling when practical.
- Open mobile menu should include Home on non-home pages, About, Act, Supporters, and Donate.

Donate:

- Donate is the primary action.
- Use a clear donate button in hero and action sections.
- Consider a persistent floating donate button at the bottom right on mobile.
- Avoid placing the donate button where it covers footer legal text or form actions.

Home page sequence:

1. Hero in a dark or colored section with a strong text block and donate CTA.
2. Social engagement or evidence grid, using Instagram-like square cards as placeholders.
3. Testimonials as simple tiles with optional image bubble, quote, and name.
4. About or closing sale section with concise mission copy and a CTA to About.
5. Footer with socials, copyright, 501c3 pending, privacy, terms, and disclaimer.

Instagram:

- Use the simplest connector.
- No carousel.
- Do not add a title or subtitle above the Instagram tile section unless the client asks for it.
- Prefer Instagram's own public embed when the client wants real population without API keys.
- If the Instagram embed fails, fall back to a normal profile link rather than scraping.
- Tiles should be single-wide on mobile and wrap up to four-wide on desktop.
- The current experimental path may probe Instagram's undocumented public web feed endpoint directly from the browser. Treat this as non-assured. Do not hide CORS, rate-limit, or endpoint failures. Do not add a server proxy or build-time scraper unless the user explicitly accepts that extra dependency.

Testimonials:

- Use simple tiles unless the user asks to restore a carousel.
- Each tile has optional image bubble, quote, and name.
- Tiles should be single-wide on mobile and wrap up to four-wide on desktop.

Act page sequence:

1. Page banner or title.
2. Action cards for Volunteer, Submit a Tip, Donate, and Subscribe.
3. Each action gets a short compelling description and a link.

About page sequence:

1. Banner.
2. Descriptive copy about what the org does and how.
3. Donate CTA.

Supporters page sequence:

1. Square supporter logo grid with optional links.
2. Space for testimonials or partner statements later.

Supporter logos:

- Treat logos as square.
- Wrap single-wide or two-wide on mobile, up to four-wide on desktop.

Footer:

- Social icons or compact text links.
- No footer sitemap.
- Copyright.
- 501c3 pending.
- Privacy and Terms links.
- Disclaimer text:

```text
The information contained in this site and related pages is provided for informational purposes only, and should not be construed as legal advice on any subject matter. Refrain from acting on the basis of any content included in this site without seeking legal or other professional advice.
```

## Visual Direction

- Alternate light and dark sections.
- Balance uplifting urgency with the reality of cruelty.
- Current palette target: red primary, gold accent on primary, white or cream, graphite.
- Keep the layout roomy but not decorative for decoration's sake.
- Use approximate gradient image placeholders only while final imagery is missing.
- Do not use eyebrow labels.
- Section titles should use the width of their container. Do not force narrow character-based wraps unless a specific design calls for it.
- Page banners can be the right-aspect section itself with a themed gradient background.
- Do not create separate banner boxes just to hold placeholder imagery.
- Hero and banner sections should not contain live text. Final text inside banner art belongs in the baked asset and its alt description.
- Only the homepage hero gets an embedded bottom-center Donate button.
- Do not add a separate visible homepage intro section for the hero headline or pitch unless the client asks for it.
- Do not let placeholder art dominate the page.
- Avoid broken-looking empty space.

## Placeholder Policy

Until client inputs arrive:

- Use placeholder copy sized close to expected final copy.
- Mark unreconciled destinations with `#` or a clear placeholder constant.
- Do not invent legal status, donation processor details, partner names, supporter endorsements, or client commitments.
- Do not invent testimony from real people.
- Use fake testimonials only when clearly represented as placeholders in code or content comments.

## Proof Standard

For site work:

- Check that every HTML endpoint opens.
- Check mobile and desktop layout.
- Check that menu, testimonial controls, and CTA links behave safely.
- Check that pages work without a build step.
- Prefer browser proof when a dev server or local file preview is available.

For launch-readiness:

- Surface every missing client dependency as a short checklist.
- Separate blocking missing inputs from optional polish.
- Do not call the site launch-ready while primary donation or contact destinations are missing.

## Open Inputs

These are still expected from the client:

- Final logo.
- Final hero art for desktop and mobile.
- Final About copy.
- Donation URL.
- Volunteer URL.
- Subscribe form destination and consent text.
- Tips destination.
- Instagram and Facebook URLs.
- Supporter org list and logos.
- Privacy and Terms destination or static pages.
