import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "about.html", "act.html", "privacy.html", "terms.html"];
const copyRoot = path.join(root, "copy");
const requiredFiles = [
  ...pages,
  "robots.txt",
  "sitemap.xml",
  "assets/styles.css",
  "assets/site.js",
  "assets/icons.svg",
  "assets/brand/wordmark-header.png",
  "assets/brand/wordmark-footer.png",
  "assets/fonts/anton.ttf",
  "assets/social-card.png",
  "assets/images/home-hero-desktop.jpg",
  "assets/images/home-hero-mobile.jpg",
  "assets/images/about-banner.jpg",
  "assets/images/act-banner.jpg",
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
  assert(!/contact\.html|supporters\.html/i.test(html), `${page} still references a removed page.`);

  if (["index.html", "about.html", "act.html"].includes(page)) {
    assert(html.includes("application/ld+json"), `${page} is missing JSON-LD.`);
  }

  if (page === "index.html") {
    assert(html.includes("class=\"hero"), "index.html is missing the homepage hero.");
    assert(html.includes("banner-donate"), "index.html is missing the hero Donate button.");
    assert(html.includes("data-curator-feed"), "index.html is missing the social grid handoff.");
    assert(html.includes("testimony-grid"), "index.html is missing testimonials.");
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
const manifest = JSON.parse(await read("assets/icons/manifest.json"));
const browserconfig = await read("assets/icons/browserconfig.xml");
assert(robots.includes("https://truecostproject.org/sitemap.xml"), "robots.txt does not point at the public sitemap.");
assert(sitemap.includes("https://truecostproject.org/"), "sitemap.xml does not use the public domain.");
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
