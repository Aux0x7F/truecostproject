import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homePages = new Set(["index.html", "index-b.html"]);
const pages = [...homePages, "about.html", "act.html", "privacy.html", "terms.html"];
const copyRoot = path.join(root, "copy");
const requiredFiles = [
  ...pages,
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  "assets/styles.css",
  "assets/site.js",
  "assets/icons.svg",
  "assets/brand/wordmark-header.png",
  "assets/brand/wordmark-footer.png",
  "assets/brand/wordmark-square-nav.png",
  "assets/brand/wordmark-square-transparent.png",
  "assets/fonts/anton.ttf",
  "assets/social-card.png",
  "assets/images/home-hero-desktop.png",
  "assets/images/home-hero-mobile.png",
  "assets/images/home-hero-desktop-b.png",
  "assets/images/home-hero-mobile-b.png",
  "assets/images/about-banner.png",
  "assets/images/act-banner.png",
  "favicon.ico",
  "assets/icons/favicon-16x16.png",
  "assets/icons/favicon-32x32.png",
  "assets/icons/favicon-96x96.png",
  "assets/icons/android-icon-192x192.png",
  "assets/icons/apple-icon-180x180.png",
  "assets/icons/ms-icon-144x144.png",
  "assets/icons/manifest.json",
  "assets/icons/browserconfig.xml"
];
const copyIdPattern = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)+$/;
const donateUrl = "https://patreon.com/TrueCostProject";
const facebookUrl = "https://www.facebook.com/profile.php?id=61567428772270";
const volunteerUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdItLGn1wnQm3ApwFnvKo05v48QzDq50IV4SlKLuaknGB5ijw/viewform";
const tipUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfZku3W3lYjDypTkToon5VW0wiZErMpE2BNcIZPpksmq18pmA/viewform";
const subscribeUrl = "https://forms.gle/38hdWnoYiEzeVhBeA";
const problems = [];
let checks = 0;

const fail = (message) => {
  problems.push(message);
};

const assert = (condition, message) => {
  checks += 1;
  if (!condition) {
    fail(message);
  }
};

const exists = async (relative) => {
  try {
    await fs.access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
};

const read = async (relative) => fs.readFile(path.join(root, relative), "utf8");

const stripUrlParts = (value) => value.split("#")[0].split("?")[0];

const isExternal = (value) =>
  /^(?:https?:|mailto:|tel:)/i.test(value) || value.startsWith("#") || value.startsWith("data:");

const walkTextFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkTextFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".txt")) {
      files.push(fullPath);
    }
  }
  return files;
};

for (const file of requiredFiles) {
  assert(await exists(file), `Missing required file: ${file}`);
}

const copyFiles = new Set(
  (await walkTextFiles(copyRoot)).map((file) =>
    path.relative(copyRoot, file).replace(/\\/g, "/").replace(/\.txt$/, "")
  )
);
const usedCopyIds = new Set();

for (const page of pages) {
  const html = await read(page);

  assert(html.includes("data-site-header"), `${page} is missing the site header.`);
  assert(html.includes("site-footer"), `${page} is missing the footer.`);
  assert(html.includes("floating-donate"), `${page} is missing the floating Donate button.`);
  assert(html.includes('rel="llms"'), `${page} is missing the llms.txt discovery link.`);
  assert(!/\b(?:href|src)="[^"]+\?v=/.test(html), `${page} uses query-string asset cache busting.`);
  assert(!/contact\.html|supporters\.html/i.test(html), `${page} still references a removed page.`);
  assert(!html.includes("fakependingcannotfind"), `${page} still references the placeholder Facebook URL.`);
  assert(!html.includes("data-pending-link"), `${page} still has pending-link markers.`);
  assert(html.includes(donateUrl), `${page} is missing the final Donate URL.`);
  assert(html.includes(facebookUrl), `${page} is missing the final Facebook URL.`);

  if (homePages.has(page) || ["about.html", "act.html"].includes(page)) {
    assert(html.includes("application/ld+json"), `${page} is missing JSON-LD.`);
  }

  if (homePages.has(page)) {
    assert(html.includes("class=\"hero"), `${page} is missing the homepage hero.`);
    assert(html.includes("banner-donate"), `${page} is missing the hero Donate button.`);
    assert(html.includes("data-curator-feed"), `${page} is missing the social grid handoff.`);
    assert(html.includes("data-curator-feed-id=\"ea323e97-9418-4bc4-b4ee-fff80795c060\""), `${page} is missing the Curator feed id.`);
    assert(html.includes("https://cdn.curator.io"), `${page} is missing the Curator CDN preconnect.`);
    const heroMobile = page === "index-b.html" ? "assets/images/home-hero-mobile-b.png" : "assets/images/home-hero-mobile.png";
    assert(html.includes(`srcset="${heroMobile} 1x"`), `${page} is missing hero image srcset.`);
    assert(html.includes("testimony-grid"), `${page} is missing testimonials.`);
  }

  if (page === "act.html") {
    assert(html.includes(volunteerUrl), "act.html is missing the final Volunteer URL.");
    assert(html.includes(tipUrl), "act.html is missing the final Submit a Tip URL.");
    assert(html.includes(subscribeUrl), "act.html is missing the final Stay in the Loop URL.");
  }

  for (const match of html.matchAll(/\bdata-copy-id="([^"]+)"/g)) {
    const id = match[1];
    usedCopyIds.add(id);
    assert(copyIdPattern.test(id), `${page} has invalid copy id: ${id}`);
    assert(copyFiles.has(id), `${page} has no copy file for: ${id}`);
  }

  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (isExternal(href)) {
      if (href === "#") {
        const tagStart = html.lastIndexOf("<", match.index);
        const tagEnd = html.indexOf(">", match.index);
        const tag = html.slice(tagStart, tagEnd + 1);
        assert(tag.includes("data-pending-link"), `${page} has an unsafe dead link.`);
      }
      continue;
    }
    const target = stripUrlParts(href);
    if (!target) {
      continue;
    }
    assert(await exists(target), `${page} links to missing local target: ${target}`);
  }

  for (const match of html.matchAll(/\bsrc="([^"]+)"/g)) {
    const src = match[1];
    if (!isExternal(src)) {
      assert(await exists(stripUrlParts(src)), `${page} loads missing local script/media: ${src}`);
    }
  }

  for (const match of html.matchAll(/\brel="stylesheet"[^>]+\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (!isExternal(href)) {
      assert(await exists(stripUrlParts(href)), `${page} loads missing stylesheet: ${href}`);
    }
  }
}

for (const id of copyFiles) {
  assert(usedCopyIds.has(id), `Unused copy file: ${id}.txt`);
}

const robots = await read("robots.txt");
const sitemap = await read("sitemap.xml");
const llms = await read("llms.txt");
const manifest = JSON.parse(await read("assets/icons/manifest.json"));
const browserconfig = await read("assets/icons/browserconfig.xml");
assert(robots.includes("https://truecostproject.org/sitemap.xml"), "robots.txt does not point at the public sitemap.");
assert(robots.includes("https://truecostproject.org/llms.txt"), "robots.txt does not reference llms.txt.");
assert(sitemap.includes("https://truecostproject.org/"), "sitemap.xml does not use the public domain.");
assert(llms.startsWith("# True Cost Project"), "llms.txt is missing the site title.");
assert(llms.includes("https://truecostproject.org/act.html"), "llms.txt is missing the Act page.");
assert(manifest.name === "True Cost Project", "icon manifest has the wrong app name.");
assert(manifest.theme_color === "#ffffff", "icon manifest should keep the white icon background.");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 6, "icon manifest is missing icon entries.");
for (const icon of manifest.icons || []) {
  assert(!String(icon.src || "").startsWith("/"), `icon manifest uses a root-absolute path: ${icon.src}`);
  assert(await exists(`assets/icons/${icon.src}`), `icon manifest references a missing file: ${icon.src}`);
}
assert(browserconfig.includes("<TileColor>#ffffff</TileColor>"), "browserconfig should keep the white tile background.");
assert(!browserconfig.includes('src="/'), "browserconfig uses root-absolute icon paths.");

if (problems.length) {
  console.error("check-site failed:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`check-site passed (${checks} checks)`);
