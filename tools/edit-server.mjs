import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyRoot = path.join(root, "copy");
const port = Number(process.env.PORT || process.env.TRUECOST_EDIT_PORT || 8787);
const host = "127.0.0.1";
const pages = ["index.html", "about.html", "act.html", "privacy.html", "terms.html"];
const copyIdPattern = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)+$/;
const safeCommitPaths = new Set(["copy", ...pages]);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".ttf", "font/ttf"]
]);

const run = async (command, args) => {
  const result = await execFileAsync(command, args, { cwd: root, maxBuffer: 1024 * 1024 });
  return `${result.stdout || ""}${result.stderr || ""}`.trim();
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeErrorMessage = (error) => {
  const raw = error && error.message ? error.message : String(error || "Save failed");
  return raw
    .replace(new RegExp(escapeRegExp(root), "gi"), "[project]")
    .replace(/[A-Za-z]:[\\/][^\s"'<>)]*/g, "[local-path]")
    .replace(/(?:\/Users|\/home|\/private\/var|\/tmp)\/[^\s"'<>)]*/g, "[local-path]")
    .slice(0, 300);
};

const statusPath = (line) => {
  const value = line.slice(3).replace(/^"|"$/g, "");
  const renamed = value.split(" -> ");
  return renamed[renamed.length - 1].replace(/\\/g, "/");
};

const isSafeCommitPath = (file) => {
  const normalized = file.replace(/\\/g, "/");
  return normalized.startsWith("copy/") || safeCommitPaths.has(normalized);
};

const unpushedCount = async () => {
  const count = await run("git", ["rev-list", "--count", "origin/main..HEAD"]).catch(() => "0");
  return Number(count) || 0;
};

const currentHead = async () => run("git", ["rev-parse", "--short", "HEAD"]).catch(() => "");

const runAcceptanceChecks = async () => {
  try {
    await run(process.execPath, ["tools/check-site.mjs"]);
  } catch {
    throw new Error("Acceptance checks failed. Run node tools/check-site.mjs locally.");
  }
};

const json = (response, status, payload) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
};

const readBody = async (request) => {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 256 * 1024) {
      throw new Error("Request body is too large");
    }
  }
  return body;
};

const listCopyIds = async (dir = copyRoot) => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const ids = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      ids.push(...await listCopyIds(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".txt")) {
      ids.push(path.relative(copyRoot, fullPath).replace(/\\/g, "/").replace(/\.txt$/, ""));
    }
  }
  return ids.sort();
};

const writeCopyUpdate = async (id, text) => {
  if (!copyIdPattern.test(id)) {
    throw new Error(`Invalid copy id: ${id}`);
  }
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  const file = path.join(copyRoot, ...id.split("/")) + ".txt";
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${normalized}\n`, "utf8");
};

const syncCopy = async (update) => {
  if (!update || typeof update !== "object") {
    throw new Error("Expected copy update");
  }
  await writeCopyUpdate(String(update.id || ""), update.text);
  await run(process.execPath, ["tools/apply-copy.mjs"]);
  return { ok: true, synced: true };
};

const saveCopy = async () => {
  await run(process.execPath, ["tools/apply-copy.mjs"]);
  await runAcceptanceChecks();
  const status = await run("git", ["status", "--porcelain", "--untracked-files=all"]);
  const lines = status ? status.split(/\r?\n/).filter(Boolean) : [];
  const copyChanges = lines.filter((line) => isSafeCommitPath(statusPath(line)));

  let committed = false;
  let head = "";
  if (copyChanges.length) {
    await run("git", ["add", "copy", ...pages]);
    await run("git", ["commit", "--only", "-m", "Update site copy", "--", "copy", ...pages]);
    committed = true;
    head = await currentHead();
  }

  const remainingStatus = await run("git", ["status", "--porcelain", "--untracked-files=all"]);
  const remainingChanges = remainingStatus ? remainingStatus.split(/\r?\n/).filter(Boolean).length : 0;
  const ahead = await unpushedCount();

  if (remainingChanges) {
    return {
      ok: true,
      changed: Boolean(copyChanges.length),
      committed,
      pushed: false,
      pushBlocked: true,
      commit: head,
      reason: ahead
        ? "Committed locally. Push is waiting on other pending changes."
        : "No copy changes. Resolve pending changes before pushing."
    };
  }

  if (ahead) {
    await run("git", ["push", "origin", "main"]);
    return {
      ok: true,
      changed: Boolean(copyChanges.length),
      committed,
      pushed: true,
      commit: head || await currentHead()
    };
  }

  return { ok: true, changed: false, committed: false, pushed: false };
};

const serveFile = async (requestUrl, response) => {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    if (request.method === "GET" && url.pathname === "/__copy/status") {
      json(response, 200, { ok: true, ids: await listCopyIds() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/__copy/sync") {
      const payload = JSON.parse(await readBody(request));
      json(response, 200, await syncCopy(payload));
      return;
    }
    if (request.method === "POST" && url.pathname === "/__copy/save") {
      await readBody(request);
      json(response, 200, await saveCopy());
      return;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      await serveFile(request.url || "/", response);
      return;
    }
    response.writeHead(405);
    response.end("Method not allowed");
  } catch (error) {
    json(response, 500, { ok: false, error: sanitizeErrorMessage(error) });
  }
});

await run(process.execPath, ["tools/apply-copy.mjs"]);
server.listen(port, host, () => {
  console.log(`True Cost editor running: http://${host}:${port}/index.html?dev=1`);
  console.log("Only ?dev=1 on this local server enables in-place editing.");
});
