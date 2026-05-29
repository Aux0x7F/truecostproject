import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyRoot = path.join(root, "copy");
const htmlPages = ["index.html", "about.html", "act.html", "privacy.html", "terms.html"];
const extractMissing = process.argv.includes("--extract-missing");

const copyIdPattern = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)+$/;
const copyElementPattern = /<(?<tag>[a-z][a-z0-9-]*)\b(?<attrs>[^>]*\sdata-copy-id="(?<id>[^"]+)"[^>]*)>(?<content>[\s\S]*?)<\/\k<tag>>/gi;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const decodeHtml = (value) =>
  String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

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

const copyIdToFile = (id) => path.join(copyRoot, ...id.split("/")) + ".txt";

const readCopy = async () => {
  const files = await walkTextFiles(copyRoot);
  const copy = new Map();
  for (const file of files) {
    const relative = path.relative(copyRoot, file).replace(/\\/g, "/").replace(/\.txt$/, "");
    if (!copyIdPattern.test(relative)) {
      throw new Error(`Invalid copy file path: ${relative}`);
    }
    copy.set(relative, (await fs.readFile(file, "utf8")).replace(/\r\n/g, "\n").replace(/\n$/, ""));
  }
  return copy;
};

const writeIfChanged = async (file, value) => {
  const current = await fs.readFile(file, "utf8").catch(() => null);
  if (current === value) {
    return false;
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, value, "utf8");
  return true;
};

const copy = await readCopy();
let wrote = 0;

if (extractMissing) {
  for (const page of htmlPages) {
    const pagePath = path.join(root, page);
    const html = await fs.readFile(pagePath, "utf8");
    for (const match of html.matchAll(copyElementPattern)) {
      const id = match.groups.id;
      if (!copyIdPattern.test(id)) {
        throw new Error(`Invalid data-copy-id "${id}" in ${page}`);
      }
      if (!copy.has(id)) {
        const file = copyIdToFile(id);
        const text = decodeHtml(match.groups.content);
        if (await writeIfChanged(file, `${text}\n`)) {
          wrote += 1;
        }
        copy.set(id, text);
      }
    }
  }
}

for (const page of htmlPages) {
  const pagePath = path.join(root, page);
  const html = await fs.readFile(pagePath, "utf8");
  const next = html.replace(copyElementPattern, (full, tag, attrs, id, content, offset, source, groups) => {
    const copyId = groups.id;
    if (!copyIdPattern.test(copyId)) {
      throw new Error(`Invalid data-copy-id "${copyId}" in ${page}`);
    }
    if (!copy.has(copyId)) {
      return full;
    }
    return `<${groups.tag}${groups.attrs}>${escapeHtml(copy.get(copyId))}</${groups.tag}>`;
  });
  if (await writeIfChanged(pagePath, next)) {
    wrote += 1;
  }
}

console.log(`copy applied; files changed: ${wrote}`);
