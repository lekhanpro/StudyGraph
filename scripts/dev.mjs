import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = normalize(join(fileURLToPath(new URL("..", import.meta.url))));
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = normalize(join(rootDir, requested));
  if (!normalized.startsWith(rootDir)) {
    return null;
  }
  return normalized;
}

createServer((request, response) => {
  const resolvedPath = safePath(request.url || "/");
  if (!resolvedPath || !existsSync(resolvedPath) || statSync(resolvedPath).isDirectory()) {
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Not found");
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", mimeTypes[extname(resolvedPath)] || "application/octet-stream");
  createReadStream(resolvedPath).pipe(response);
}).listen(port, () => {
  console.log(`StudyGraph running at http://localhost:${port}`);
});
