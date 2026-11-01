// Writes the server-rendered first screen into dist/index.html, so the page paints before any JavaScript runs.
// Runs after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import { readFile, rm, writeFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const { render } = await import(pathToFileURL(resolve(root, "dist-ssr/entry-server.js")).href)

const file = resolve(root, "dist/index.html")
let html = await readFile(file, "utf8")
if (!html.includes("<!--app-html-->")) throw new Error("dist/index.html has no <!--app-html--> placeholder")
html = html.replace("<!--app-html-->", render())

// The stylesheet is small (about 5 kB gzipped), so it goes inline: one less request blocking the first paint.
const link = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/)
if (link) {
  const css = await readFile(resolve(root, "dist", link[1].slice(1)), "utf8")
  html = html.replace(link[0], () => `<style>${css}</style>`)
}

// The prerendered page is complete without JavaScript, so the bundle is fetched right after the first paint
// instead of competing with the document and the font for the first one.
const script = html.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/)
if (script) {
  html = html.replace(
    script[0],
    () =>
      `<script type="module">requestAnimationFrame(() => setTimeout(() => import(${JSON.stringify(script[1])})))</script>`,
  )
}

await writeFile(file, html)
await rm(resolve(root, "dist-ssr"), { recursive: true, force: true })
console.log("prerendered dist/index.html")
