import { useCallback, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react"
import { portfolioData as data, type Project, type Tool } from "@/data/portfolio"
import { BrandIcon } from "@/components/BrandIcon"
import { useSmoothWheel } from "@/hooks/useSmoothWheel"

const featured = ["mcp-audit-proxy", "cardioguard-mg", "aletheia"] as const
const TILE_IDS = ["about", ...featured, "stack", "side-projects", "contact"] as const
type TileId = (typeof TILE_IDS)[number]

const byId = Object.fromEntries(data.projects.map((p) => [p.id, p])) as Record<string, Project>
const titleOf = Object.fromEntries(
  [...data.projects, ...data.sideProjects].map((p) => [p.id, p.title]),
) as Record<string, string>
const allTools = data.stack.flatMap((g) => g.tools)

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const SHEET_MS = 700

function isTile(id: string): id is TileId {
  return (TILE_IDS as readonly string[]).includes(id)
}

// Every link that leaves the site opens in a new tab.
function ExtLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="chips">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  )
}

function ProjectSheet({ p }: { p: Project }) {
  return (
    <>
      <div>
        <h2 id="sheet-title">{p.title}</h2>
        <p className="sheet-meta">
          {p.kind} · {p.year} · {p.status}
        </p>
        <ProjectStats href={p.href} />
      </div>
      <div>
        <p className="sheet-lede">{p.summary}</p>
        <ul className="points">
          {p.points.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <Chips items={p.stack} />
        {p.homepage && (
          <ExtLink className="go" href={p.homepage}>
            {siteLabel(p.homepage)} ↗
          </ExtLink>
        )}
        <ExtLink className={p.homepage ? "go go-quiet" : "go"} href={p.href}>
          View source ↗
        </ExtLink>
        <ArtCredit id={p.id} />
      </div>
    </>
  )
}

function ArtCredit({ id }: { id: string }) {
  const art = data.artworks[id]
  if (!art) return null
  return (
    <p className="art-credit">
      Background: {art.artist},{" "}
      <ExtLink href={art.href}>
        <cite>{art.title}</cite>
      </ExtLink>
      , {art.source}, {art.license}.
    </p>
  )
}

const ART_WIDTHS = [480, 960, 1280, 1920]
// A tile is a quarter of the screen on desktop and half of it below 1024px.
const TILE_SIZES = "(max-width: 1024px) 50vw, 25vw"

const artSrcSet = (src: string, ext: string) => ART_WIDTHS.map((w) => `${src}-${w}.${ext} ${w}w`).join(", ")

// The small file the tile already loaded (480 or 960 wide, by screen density), shown under the
// large one on the page until that has arrived.
const artThumb = (src: string) =>
  `image-set(${["avif", "webp"]
    .map((ext) => `url("${src}-480.${ext}") type("image/${ext}") 1x, url("${src}-960.${ext}") type("image/${ext}") 2x`)
    .join(", ")})`

// Starts fetching and decoding a page's full-screen painting before the tile is clicked, from hover or
// focus. A detached <picture> makes the browser pick the same single file the page will ask for.
const preloaded = new Map<string, HTMLImageElement>()
function preloadArt(id: string) {
  const art = data.artworks[id]
  if (!art || preloaded.has(id)) return
  const picture = document.createElement("picture")
  for (const ext of ["avif", "webp"]) {
    const source = document.createElement("source")
    source.type = `image/${ext}`
    source.srcset = artSrcSet(art.src, ext)
    source.sizes = "100vw"
    picture.append(source)
  }
  const img = new Image()
  picture.append(img)
  img.src = `${art.src}.jpg`
  img.decode().catch(() => {})
  preloaded.set(id, img)
}

// The painting layer behind a tile, or behind the page that grows out of it.
// `sizes` tells the browser how wide it is drawn, so a tile loads a small file and a page a large one.
// With `reveal`, the image stays hidden until it is fully loaded and decoded, so a large file that is
// still arriving never paints half-drawn over the placeholder.
function ArtLayer({ id, className, sizes, reveal }: { id: string; className: string; sizes: string; reveal?: boolean }) {
  const art = data.artworks[id]
  const [ready, setReady] = useState(!reveal)
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = img.current
    if (!reveal || !el) return
    let live = true
    const show = () => live && setReady(true)
    // decode() resolves once the chosen source is loaded and decoded, cached or not.
    el.decode().then(show, () => el.addEventListener("load", show, { once: true }))
    return () => {
      live = false
    }
  }, [reveal])

  if (!art) return null
  return (
    <div
      className={`${className}${ready ? " is-ready" : ""}`}
      aria-hidden="true"
      style={
        {
          "--art-pos": art.position,
          "--art-ground": art.ground,
          "--art-thumb": artThumb(art.src),
        } as React.CSSProperties
      }
    >
      <picture>
        <source type="image/avif" srcSet={artSrcSet(art.src, "avif")} sizes={sizes} />
        <source type="image/webp" srcSet={artSrcSet(art.src, "webp")} sizes={sizes} />
        <img ref={img} src={`${art.src}.jpg`} alt="" width={art.width} height={art.height} decoding="async" />
      </picture>
    </div>
  )
}

// Names a repository's homepage by where it points.
function siteLabel(url: string) {
  const host = new URL(url).hostname
  if (host.endsWith("huggingface.co")) return "Hugging Face"
  if (host === "pypi.org") return "PyPI"
  return "Website"
}

const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${word}${n === 1 ? "" : "s"}`

// "firatmio/aletheia" from a GitHub URL, or null for links elsewhere.
function repoName(url: string) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)\/?$/)
  return m ? m[1] : null
}

const githubGet = (path: string) =>
  fetch(`https://api.github.com/${path}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

interface RepoStats {
  stars: number
  forks: number
  watchers?: number
  mergedPRs?: number
}

// One request covers every public repository's stars and forks, for the side project cards.
let allReposCache: Promise<Record<string, RepoStats>> | null = null
function loadAllRepoStats() {
  allReposCache ??= githubGet("users/firatmio/repos?per_page=100")
    .then((repos: { full_name: string; stargazers_count: number; forks_count: number }[]) =>
      Object.fromEntries(
        repos.map((r) => [r.full_name, { stars: r.stargazers_count, forks: r.forks_count }]),
      ),
    )
    .catch((e) => {
      allReposCache = null
      throw e
    })
  return allReposCache
}

// A project page also shows who watches it and how many pull requests were merged.
const repoCache = new Map<string, Promise<RepoStats>>()
function loadRepoStats(name: string) {
  if (!repoCache.has(name)) {
    const p = Promise.all([
      githubGet(`repos/${name}`),
      githubGet(`search/issues?q=${encodeURIComponent(`repo:${name} is:pr is:merged`)}&per_page=1`).catch(
        () => null,
      ),
    ]).then(([repo, merged]) => ({
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.subscribers_count,
      mergedPRs: merged?.total_count,
    }))
    p.catch(() => repoCache.delete(name))
    repoCache.set(name, p)
  }
  return repoCache.get(name)!
}

function ProjectStats({ href }: { href: string }) {
  const name = repoName(href)
  const [s, setS] = useState<RepoStats | null>(null)

  useEffect(() => {
    if (name) loadRepoStats(name).then(setS, () => {})
  }, [name])

  if (!s) return null
  const items: [number | undefined, string][] = [
    [s.stars, "star"],
    [s.watchers, "watcher"],
    [s.forks, "fork"],
    [s.mergedPRs, "merged PR"],
  ]
  return (
    <ul className="repo-stats">
      {items
        .filter(([n]) => n !== undefined)
        .map(([n, word]) => (
          <li key={word}>
            <b>{n!.toLocaleString("en")}</b> {n === 1 ? word : `${word}s`}
          </li>
        ))}
    </ul>
  )
}

const ago = (iso: string) => {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return "today"
  return days === 1 ? "yesterday" : `${days} days ago`
}

interface GitHubNow {
  stars: number
  release: string
  profile: GitHubProfile
  recent: { name: string; description: string; pushed: string }[]
}

interface GitHubProfile {
  stars: number
  repos: number
  followers: number
  forks: number
  since: number
  languages: string[]
}

type Repo = {
  name: string
  fork: boolean
  description: string | null
  pushed_at: string
  stargazers_count: number
  forks_count: number
  language: string | null
}

let githubCache: Promise<GitHubNow> | null = null

// Public GitHub API, no key. Fetched once per visit, and only when About is opened.
function loadGitHub(): Promise<GitHubNow> {
  const get = githubGet
  githubCache ??= Promise.all([
    get("repos/firatmio/aletheia"),
    get("repos/firatmio/aletheia/releases/latest").catch(() => null),
    get("users/firatmio"),
    get("users/firatmio/repos?sort=pushed&per_page=100"),
  ]).then(([repo, rel, user, all]: [{ stargazers_count: number }, { tag_name: string } | null, { public_repos: number; followers: number; created_at: string }, Repo[]]) => {
    const own = all.filter((r) => !r.fork && !r.name.startsWith("."))
    const byLanguage = new Map<string, number>()
    for (const r of own) if (r.language) byLanguage.set(r.language, (byLanguage.get(r.language) ?? 0) + 1)
    return {
      stars: repo.stargazers_count,
      release: rel?.tag_name ?? data.githubFallback.release,
      profile: {
        stars: own.reduce((n, r) => n + r.stargazers_count, 0),
        repos: user.public_repos,
        followers: user.followers,
        forks: own.reduce((n, r) => n + r.forks_count, 0),
        since: new Date(user.created_at).getFullYear(),
        languages: [...byLanguage].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l]) => l),
      },
      recent: own.slice(0, 5).map((r) => ({ name: r.name, description: r.description ?? "", pushed: r.pushed_at })),
    }
  })
  return githubCache
}

function AboutSheet() {
  const [gh, setGh] = useState<GitHubNow | null>(null)
  const [failed, setFailed] = useState(false)
  const [openQ, setOpenQ] = useState(0)

  useEffect(() => {
    loadGitHub().then(setGh, () => {
      githubCache = null
      setFailed(true)
    })
  }, [])

  const stats = gh ?? (failed ? { ...data.githubFallback, recent: [] } : null)
  const profile = stats?.profile

  return (
    <>
      <div className="about-intro">
        <h2 id="sheet-title">About</h2>
        <p className="sheet-meta">{data.role}</p>
        {data.about.map((x) => (
          <p key={x} className="sheet-lede">
            {x}
          </p>
        ))}
        <ul className="chips">
          <li>Trabzon, Türkiye</li>
          <li>Go · Rust · Python</li>
          <li>Open to internships and freelance</li>
        </ul>
        <section className="gh-profile" aria-labelledby="gh-title">
          <h3 id="gh-title" className="about-label">
            <ExtLink href="https://github.com/firatmio">GitHub · firatmio</ExtLink>
          </h3>
          <dl>
            {(
              [
                ["stars", profile?.stars],
                ["repositories", profile?.repos],
                ["followers", profile?.followers],
                ["forks", profile?.forks],
                ["on GitHub since", profile?.since],
              ] as const
            ).map(([label, n]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{n === undefined ? "…" : label === "on GitHub since" ? n : n.toLocaleString("en")}</dd>
              </div>
            ))}
          </dl>
          {profile && <p className="gh-langs">Mostly {profile.languages.join(", ")}</p>}
        </section>
      </div>

      <div className="about-flow">
        <section aria-labelledby="now-title">
          <h3 id="now-title" className="about-label">
            Now
          </h3>
          <div className="stat-row">
            <div className="stat">
              <b>{stats?.stars ?? "…"}</b>
              <span>stars on aletheia</span>
            </div>
            <div className="stat">
              <b>{stats?.release ?? "…"}</b>
              <span>latest aletheia release</span>
            </div>
          </div>
          {gh && gh.recent.length > 0 && (
            <>
              <p className="about-sub">Recently worked on</p>
              <ul className="recent">
                {gh.recent.map((r) => (
                  <li key={r.name}>
                    <ExtLink href={`https://github.com/firatmio/${r.name}`}>
                      <span className="recent-what">
                        {r.name}
                        {r.description && <span> · {r.description}</span>}
                      </span>
                      <time dateTime={r.pushed}>{ago(r.pushed)}</time>
                    </ExtLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="work-title">
          <h3 id="work-title" className="about-label">
            How I work
          </h3>
          <ul className="rules">
            {data.principles.map((r) => (
              <li key={r.title} className="rule">
                <h4>{r.title}</h4>
                <ExtLink href={r.href}>{r.project} ↗</ExtLink>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="qa-title">
          <h3 id="qa-title" className="about-label">
            Questions people ask
          </h3>
          <ul className="qa">
            {data.faq.map((f, i) => (
              <li key={f.q} className={openQ === i ? "q is-open" : "q"}>
                <button aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? -1 : i)}>
                  {f.q}
                  <span aria-hidden="true">+</span>
                </button>
                <div className="q-more">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function StackSheet({ onOpen }: { onOpen: (id: TileId) => void }) {
  const [active, setActive] = useState<Tool>(allTools[0])
  return (
    <div className="stack-sheet">
      <div className="stack-head">
        <h2 id="sheet-title">Tech stack</h2>
        <p className="sheet-meta used-in" aria-live="polite">
          <span className="used-name">{active.name}</span>
          <span>
            used in{" "}
            {active.usedIn.map((id, i) => (
              <span key={id}>
                {isTile(id) ? (
                  <button className="used-link" onClick={() => onOpen(id)}>
                    {titleOf[id]}
                  </button>
                ) : (
                  titleOf[id]
                )}
                {i < active.usedIn.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </p>
      </div>
      <div className="stack-groups">
        {data.stack.map((g) => (
          <section key={g.group} className="stack-group" aria-labelledby={`g-${g.group}`}>
            <h3 id={`g-${g.group}`}>{g.group}</h3>
            <ul>
              {g.tools.map((t) => (
                <li key={t.name}>
                  <button
                    className="tool"
                    aria-pressed={active.name === t.name}
                    onMouseEnter={() => setActive(t)}
                    onFocus={() => setActive(t)}
                    onClick={() => setActive(t)}
                  >
                    <BrandIcon icon={t.icon} className="tool-logo" />
                    <span>{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function SideSheet() {
  const [stats, setStats] = useState<Record<string, RepoStats>>({})

  useEffect(() => {
    loadAllRepoStats().then(setStats, () => {})
  }, [])

  return (
    <div className="side-sheet">
      <div className="side-head">
        <h2 id="sheet-title">Side projects</h2>
        <p className="sheet-meta">Smaller tools, libraries and experiments.</p>
      </div>
      <ul className="side-list">
        {data.sideProjects.map((p, i) => {
          const s = stats[repoName(p.href) ?? ""]
          return (
            <li key={p.id} className="side-item" style={{ "--i": i + 1 } as React.CSSProperties}>
              <ExtLink href={p.href} className="side-main">
                <span className="side-title">
                  {p.title}
                  <span aria-hidden="true">↗</span>
                </span>
                <span className="side-kind">
                  {p.kind} · {p.year}
                </span>
                <span className="side-summary">{p.summary}</span>
              </ExtLink>
              <span className="side-foot">
                <span className="side-stack">
                  {p.stack.join(" · ")}
                  {s && (
                    <span className="side-stats">
                      {" "}
                      · {plural(s.stars, "star")}
                      {s.forks > 0 && `, ${plural(s.forks, "fork")}`}
                    </span>
                  )}
                </span>
                {p.homepage && (
                  <ExtLink className="side-home" href={p.homepage}>
                    {siteLabel(p.homepage)} ↗
                  </ExtLink>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      <ArtCredit id="side-projects" />
    </div>
  )
}

function sheetFor(id: TileId, onOpen: (id: TileId) => void): ReactNode {
  switch (id) {
    case "about":
      return <AboutSheet />
    case "stack":
      return <StackSheet onOpen={onOpen} />
    case "side-projects":
      return <SideSheet />
    case "contact":
      return (
        <>
          <div>
            <h2 id="sheet-title">Say hello</h2>
            <p className="sheet-meta">{data.availability}</p>
          </div>
          <div>
            <ul className="links">
              {data.links.map((l) => (
                <li key={l.label}>
                  <ExtLink href={l.href}>
                    {l.label}
                    <span>{l.handle}</span>
                  </ExtLink>
                </li>
              ))}
            </ul>
            <a className="go" href={`mailto:${data.email}`}>
              {data.email}
            </a>
          </div>
        </>
      )
    default:
      return <ProjectSheet p={byId[id]} />
  }
}

export default function App() {
  const [openId, setOpenId] = useState<TileId | null>(null)
  const [full, setFull] = useState(false)
  const tiles = useRef<Partial<Record<TileId, HTMLButtonElement | null>>>({})
  const sheet = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)
  const current = useRef<TileId | null>(null)
  useSmoothWheel(sheet, openId !== null)

  // Every page starts at its top, also when one page links to another.
  useEffect(() => {
    if (sheet.current) sheet.current.scrollTop = 0
  }, [openId])

  // The sheet grows out of the tile's own rectangle and shrinks back into it.
  const fitToTile = (id: TileId) => {
    const el = tiles.current[id]?.closest(".tile")
    if (!el || !sheet.current) return
    const r = el.getBoundingClientRect()
    const s = sheet.current.style
    s.setProperty("--t", `${r.top}px`)
    s.setProperty("--l", `${r.left}px`)
    s.setProperty("--r", `${innerWidth - r.right}px`)
    s.setProperty("--b", `${innerHeight - r.bottom}px`)
  }

  const show = useCallback((id: TileId) => {
    clearTimeout(timer.current)
    const switching = current.current !== null
    current.current = id
    setOpenId(id)
    // Already open (a link inside one sheet to another): swap the content in place.
    if (switching) return
    // Place the clip on this tile before the sheet is shown, or it starts from the last tile it closed into.
    fitToTile(id)
    setFull(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setFull(true)))
  }, [])

  const hide = useCallback(() => {
    const id = current.current
    if (!id) return
    current.current = null
    fitToTile(id)
    setFull(false)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(
      () => {
        setOpenId(null)
        tiles.current[id]?.focus()
      },
      reducedMotion() ? 0 : SHEET_MS,
    )
  }, [])

  const open = useCallback(
    (id: TileId) => {
      history.pushState({ tile: id }, "", `#${id}`)
      show(id)
    },
    [show],
  )

  const close = () => {
    if (history.state?.tile) history.back()
    else {
      history.replaceState(null, "", location.pathname)
      hide()
    }
  }

  // Each tile has its own address, so back and forward work and a link can open one directly.
  useEffect(() => {
    const sync = () => {
      const id = location.hash.slice(1)
      if (isTile(id)) show(id)
      else hide()
    }
    sync()
    addEventListener("popstate", sync)
    return () => removeEventListener("popstate", sync)
  }, [show, hide])

  useEffect(() => {
    if (full) closeBtn.current?.focus()
  }, [full])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openId) close()
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  })

  const tileRef = (id: TileId) => (el: HTMLButtonElement | null) => {
    tiles.current[id] = el
  }

  const tileButton = (id: TileId, label: string) => (
    <button
      ref={tileRef(id)}
      className="tile-btn"
      onClick={() => open(id)}
      onPointerEnter={() => preloadArt(id)}
      onPointerDown={() => preloadArt(id)}
      onFocus={() => preloadArt(id)}
    >
      {label}
    </button>
  )

  const arrow = (
    <span className="tile-arrow" aria-hidden="true">
      ↗
    </span>
  )

  return (
    <>
      <main className="grid" inert={openId !== null}>
        <article className="tile tile-me">
          <p className="tile-top is-shown">
            <span>About</span>
            <span>{data.location}</span>
          </p>
          <div>
            <h1>{tileButton("about", data.name)}</h1>
            <p className="tile-lede">{data.intro}</p>
          </div>
        </article>

        {featured.map((id) => {
          const p = byId[id]
          return (
            <article key={id} className={data.artworks[id] ? "tile tile-art" : "tile"}>
              <ArtLayer id={id} className="tile-art-bg" sizes={data.artworks[id]?.tileSizes ?? TILE_SIZES} />
              <p className="tile-top">
                <span>{p.kind}</span>
                <span>{p.year}</span>
              </p>
              <h2>{tileButton(id, p.title)}</h2>
              {arrow}
            </article>
          )
        })}

        <div className="split">
          <article className="tile tile-stack">
            <p className="tile-top">
              <span>{allTools.length} tools</span>
            </p>
            <div className="tile-stack-body">
              <h2>{tileButton("stack", "Tech stack")}</h2>
              <div className="tile-logos" aria-hidden="true">
                {allTools.slice(0, 8).map((t) => (
                  <BrandIcon key={t.name} icon={t.icon} />
                ))}
              </div>
            </div>
          </article>
          <article className="tile tile-art">
            <ArtLayer id="side-projects" className="tile-art-bg" sizes={data.artworks["side-projects"].tileSizes ?? TILE_SIZES} />
            <p className="tile-top">
              <span>{data.sideProjects.length} projects</span>
            </p>
            <h2>{tileButton("side-projects", "Side projects")}</h2>
            {arrow}
          </article>
        </div>

        <article className="tile tile-contact">
          <p className="tile-top">
            <span>{data.availability.split(" on ")[0]}</span>
            <span>{data.email}</span>
          </p>
          <h2>{tileButton("contact", "Contact")}</h2>
          {arrow}
        </article>
      </main>

      <div
        ref={sheet}
        className={`sheet${openId === "about" ? " is-dark" : ""}${openId && data.artworks[openId] ? " is-art" : ""}${full ? " is-full" : ""}`}
        hidden={openId === null}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Grows from the tile's rectangle with the same crop, so the picture never jumps between the two. */}
        {openId && <ArtLayer key={`art-${openId}`} id={openId} className="sheet-art" sizes="100vw" reveal />}
        {openId && (
          <div key={openId} className={`sheet-body sheet-${openId}`}>
            {sheetFor(openId, open)}
          </div>
        )}
        <button ref={closeBtn} className="close" onClick={close}>
          Close
          <kbd>Esc</kbd>
        </button>
      </div>
    </>
  )
}
