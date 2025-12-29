import { serve, file } from "bun";
import { join } from "path";
import { existsSync } from "fs";

const PORT = 8000;
const PUBLIC_DIR = "./dist";

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html
    if (pathname === "/") {
      pathname = "/index.html";
    }

    // Try to serve the file
    let filePath = join(PUBLIC_DIR, pathname);

    // If no extension and not found, try .html
    if (!pathname.includes(".") && !existsSync(filePath)) {
      filePath = filePath + ".html";
    }

    const f = file(filePath);

    if (await f.exists()) {
      return new Response(f);
    }

    // 404
    const notFound = file(join(PUBLIC_DIR, "404.html"));
    if (await notFound.exists()) {
      return new Response(notFound, { status: 404 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${PORT}`);
