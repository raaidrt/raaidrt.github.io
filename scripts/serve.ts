import { serve, file, spawn } from "bun";
import { join } from "path";
import { existsSync } from "fs";
import { watch } from "fs";

const PORT = 8000;
const PUBLIC_DIR = "./dist";

// Script injected into every HTML page. Opens a WebSocket back to this server
// and reloads the page whenever the server broadcasts a "reload" message.
const LIVE_RELOAD_SNIPPET = `
<script>
(() => {
  let ws;
  const connect = () => {
    ws = new WebSocket(\`ws://\${location.host}/__livereload\`);
    ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
    // If the server restarts, keep trying to reconnect.
    ws.onclose = () => setTimeout(connect, 1000);
  };
  connect();
})();
</script>
`;

// Run the existing build in watch mode so content is recompiled on every save.
const builder = spawn({
  cmd: ["bun", "run", "scripts/build.ts", "--watch"],
  stdout: "ignore",
  stderr: "inherit",
});

const server = serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket endpoint used by the injected live-reload snippet.
    if (url.pathname === "/__livereload") {
      if (server.upgrade(req)) return;
      return new Response("Expected WebSocket", { status: 400 });
    }

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
      // Inject the live-reload snippet into HTML responses only.
      if (filePath.endsWith(".html")) {
        const html = await f.text();
        const withReload = html.includes("</body>")
          ? html.replace("</body>", `${LIVE_RELOAD_SNIPPET}</body>`)
          : html + LIVE_RELOAD_SNIPPET;
        return new Response(withReload, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response(f);
    }

    // 404
    const notFound = file(join(PUBLIC_DIR, "404.html"));
    if (await notFound.exists()) {
      return new Response(notFound, { status: 404 });
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.subscribe("livereload");
    },
  },
});

// Watch the build output and tell every connected browser to reload when it
// changes. The build watcher writes here after each rebuild.
let debounce: ReturnType<typeof setTimeout> | null = null;
watch(PUBLIC_DIR, { recursive: true }, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    server.publish("livereload", "reload");
    console.log("↻ reloaded");
  }, 100);
});

console.log(`Server running at http://localhost:${PORT} (live reload enabled)`);

process.on("SIGINT", () => {
  builder.kill();
  process.exit(0);
});
