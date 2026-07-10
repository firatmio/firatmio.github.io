import { createSignal, Show, createEffect, onCleanup } from 'solid-js'
import { Motion } from 'solid-motionone'
import { FiCopy, FiShare2, FiX } from 'solid-icons/fi'
import './App.css'

function CodeBlock(props: { code: string }) {
  const [copied, setCopied] = createSignal(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(props.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div class="code-block-wrapper">
      <button class="copy-btn" onClick={handleCopy}>
        {copied() ? 'Copied!' : 'Copy'}
      </button>
      <pre>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}

function MyelinChart() {
  return (
    <div class="chart-container">
      <div class="chart-header">Perplexity Degradation (Lower = Better)</div>
      <div class="chart-bar-group">
        <div class="chart-bar-label">
          <span>Biomimetic Masking (12 / 16 layers active)</span>
          <span class="chart-bar-value">188.8 PPL</span>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill biomimetic" style={{ width: '15%' }}></div>
        </div>
      </div>
      <div class="chart-bar-group">
        <div class="chart-bar-label">
          <span>Naive Skipping (12 / 16 layers active)</span>
          <span class="chart-bar-value">14,055.8 PPL (74x worse)</span>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill naive" style={{ width: '100%' }}></div>
        </div>
      </div>
      <div class="chart-footer">* Measured on Llama 3.2 1B running on RTX 4060 Laptop GPU. Naive skipping disrupts semantic coherence, while biomimetic importance keep-sets maintain output flow.</div>
    </div>
  )
}

function App() {
  const profileUrl = "https://github.com/firatmio.png"

  // Client-Side History Router logic (Clean URLs)
  const getRouteFromPath = () => {
    const path = window.location.pathname
    const parts = path.split('/')
    let primary = parts[1] || 'writings'
    if (primary === '') primary = 'writings'
    const secondary = parts[2] || null
    return { primary, secondary }
  }

  const [route, setRoute] = createSignal(getRouteFromPath())

  createEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath())
    }
    window.addEventListener('popstate', handlePopState)
    onCleanup(() => window.removeEventListener('popstate', handlePopState))
  })

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(getRouteFromPath())
  }

  const [loading, setLoading] = createSignal(true)
  let isFirstRoute = true

  // Show loading skeleton only on initial mount to let layouts settle, keep subsequent tab switching instant
  createEffect(() => {
    route() // track route changes
    if (isFirstRoute) {
      isFirstRoute = false
      const timer = setTimeout(() => {
        setLoading(false)
      }, 250)
      onCleanup(() => clearTimeout(timer))
    } else {
      setLoading(false)
    }
  })

  const activeTab = () => {
    const p = route().primary
    if (p === 'writings') return 'writings'
    if (p === 'projects') return 'projects'
    if (p === 'about') return 'about'
    return 'writings'
  }

  const [scrollPercent, setScrollPercent] = createSignal(0)

  // Track scroll percentage for progress indicator
  createEffect(() => {
    const currentRoute = route()
    if (currentRoute.primary === 'writings' && currentRoute.secondary !== null) {
      const handleScroll = () => {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight
        if (totalScroll > 0) {
          setScrollPercent((window.scrollY / totalScroll) * 100)
        }
      }
      window.addEventListener('scroll', handleScroll)
      handleScroll() // initialize
      onCleanup(() => window.removeEventListener('scroll', handleScroll))
    } else {
      setScrollPercent(0)
    }
  })

  // Track text selections to show custom copy/share tooltip
  const [tooltipVisible, setTooltipVisible] = createSignal(false)
  const [tooltipPos, setTooltipPos] = createSignal({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = createSignal('')

  createEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setTooltipVisible(false)
        return
      }

      const text = selection.toString().trim()
      if (text.length > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        const tooltipWidth = 72
        const tooltipHeight = 32
        const scrollY = window.scrollY || window.pageYOffset
        const scrollX = window.scrollX || window.pageXOffset
        
        let left = scrollX + rect.left + rect.width / 2 - tooltipWidth / 2
        // Constrain within the window bounds to prevent overflow on mobile
        left = Math.max(scrollX + 8, Math.min(scrollX + window.innerWidth - tooltipWidth - 8, left))
        
        setTooltipPos({
          top: scrollY + rect.top - tooltipHeight - 8,
          left: left
        })
        setSelectedText(text)
        setTooltipVisible(true)
      } else {
        setTooltipVisible(false)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    onCleanup(() => {
      document.removeEventListener('selectionchange', handleSelection)
    })
  })

  const handleCopySelection = () => {
    navigator.clipboard.writeText(selectedText())
    window.getSelection()?.removeAllRanges()
  }

  const handleShareSelection = () => {
    if (navigator.share) {
      navigator.share({
        text: selectedText()
      }).catch(err => console.log('Share canceled or failed', err))
    } else {
      navigator.clipboard.writeText(selectedText())
      alert("Share menu is not supported on this browser. Selection has been copied to your clipboard instead!")
    }
    window.getSelection()?.removeAllRanges()
  }

  // Image preview state & effects
  const [previewImg, setPreviewImg] = createSignal<string | null>(null)

  // Listen for clicks on elements with previewable-img class
  createEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG' && target.classList.contains('previewable-img')) {
        setPreviewImg((target as HTMLImageElement).src)
      }
    }
    document.addEventListener('click', handleImageClick)
    onCleanup(() => document.removeEventListener('click', handleImageClick))
  })

  
  // Listen for ESC key to dismiss preview
  createEffect(() => {
    if (previewImg() !== null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setPreviewImg(null)
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      onCleanup(() => window.removeEventListener('keydown', handleKeyDown))
    }
  })

  // Prevent background scrolling when image preview is open
  createEffect(() => {
    if (previewImg() !== null) {
      document.body.style.overflow = 'hidden'
      onCleanup(() => {
        document.body.style.overflow = ''
      })
    } else {
      document.body.style.overflow = ''
    }
  })

  const closePreview = () => setPreviewImg(null)

  const skills = [
    "Go", "Rust", "Python", "TypeScript", "JavaScript",
    "SolidJS", "React", "Next.js", "Tauri", "PyTorch",
    "FastAPI", "PostgreSQL", "Supabase", "Docker"
  ]

  const projects = [
    {
      title: "Axiom",
      description: "A local-first, privacy-focused desktop AI assistant that automates terminal workflows, runs open-source LLMs offline via Ollama, and manages developer tasks securely using a Rust-powered security engine.",
      tech: "Rust, Ollama, Tauri, Security Engine",
      year: "2026",
      url: "https://axiom.quacomes.com/en/"
    },
    {
      title: "CardioGuard",
      description: "An end-to-end health technology platform that analyzes real-time cardiac data from Holter ECG devices using Google MedGemma and CNN models for anomaly detection.",
      tech: "Python, PyTorch, Go, Next.js, MedGemma, Docker",
      year: "2026",
      url: "https://github.com/firatmio/CardioGuard"
    },
    {
      title: "lofi-pomodoro",
      description: "A minimalist desktop pomodoro timer built on Rust and Tauri, designed to minimize distractions and improve focus.",
      tech: "Rust, Tauri, TypeScript, Tailwind CSS",
      year: "2025",
      url: "https://github.com/firatmio/lofi-pomodoro"
    },
    {
      title: "OmniSketch",
      description: "A minimalist and lightweight drawing/sketch board application developed with modern web technologies, enabling fully vector-based drawings.",
      tech: "TypeScript, HTML5 Canvas, Vanilla CSS",
      year: "2024",
      url: "https://github.com/firatmio/omni-sketch"
    },
    {
      title: "Filmbox Promo",
      description: "A high-performance movie discovery platform built on Next.js 15 and React 19 architecture, featuring a modern and responsive interface.",
      tech: "Next.js 15, React 19, Tailwind CSS, TMDB API",
      year: "2025",
      url: "https://github.com/firatmio/filmbox-promo"
    }
  ]

  const posts = [
    {
      id: 1,
      slug: "local-first-desktop-ai",
      title: "The Case for Local-First Desktop AI",
      date: "July 2026",
      readTime: "5 min read",
      summary: "An analysis of why cloud-based AI orchestration introduces friction for developer workflows and how local-first agents like Axiom represent a shift toward secure, offline automation.",
      content: () => (
        <>
          <p>As developer tools integrate more deeply with generative AI, the choice of execution runtime becomes a first-class architectural decision. Today, the default path remains cloud-centric, routing developer prompts, context, and filesystem buffers to remote APIs. While this model benefits from massive cloud compute resources, it introduces significant friction points: network latency, subscription costs, data governance liabilities, and a complete lack of offline functionality.</p>
          <p>Local-first desktop AI agents, such as Axiom, represent a paradigm shift. By leveraging local execution layers, developers can run models like Llama 3.2 or Qwen 2.5 on their own machines, completely offline. This architecture yields three core advantages:</p>
          <blockquote>
            "True developer autonomy is only achieved when execution, computation, and intelligence reside in the same local sandbox."
          </blockquote>
          <p>First is <strong>security and privacy</strong>. When an AI agent needs permission to read files, examine git histories, or run terminal commands, sending this sensitive context to a cloud API is a major compliance risk. Local-first systems ensure that all data stays on disk, processed under sandboxed execution limits.</p>
          <p>Second is <strong>workflow speed</strong>. Roundtrip HTTP requests to cloud APIs add hundreds of milliseconds of latency. A local runner connected to a resident Ollama service executes tokens directly on consumer GPUs, avoiding network hops and enabling real-time, low-latency agent loops.</p>
          <p>Finally, there's the <strong>cost equation</strong>. Subscription boundaries disappear. Instead of paying per-token or monthly fees for arbitrary API allocations, developers run tasks utilizing the idle GPU power they already own. Axiom is built on this exact philosophy: an offline LLM orchestrator combined with a Rust-powered security engine that runs locally on developer hardware, turning consumer GPUs into autonomous developer environments.</p>
        </>
      )
    },
    {
      id: 2,
      slug: "biomimetic-layer-masking",
      title: "Biomimetic Layer-Masking in CUDA Kernels",
      date: "June 2026",
      readTime: "7 min read",
      summary: "A technical evaluation of Myelin's dynamic activation mechanism, demonstrating how input-adaptive middle-layer dropping preserves LLM quality while scaling down computational demand.",
      content: () => (
        <>
          <p>In standard transformer architectures, every forward pass executes every parameter across all layers. While this uniform execution pathway is simple to implement, it is computationally inefficient and stands in contrast to biological neural systems. In the human brain, neurons and pathways are activated dynamically; only the active circuits consume energy and process signals.</p>
          <img src="/myelin-banner.png" alt="Myelin Banner" loading="lazy" class="previewable-img" style={{ width: "100%", "border-radius": ".75rem", border: "1px solid var(--border)", "margin-bottom": "1rem", cursor: "zoom-in" }} />
          <p>The <strong>Myelin</strong> project explores this biomimetic approach by injecting a dynamic layer-masking mechanism directly at the CUDA kernel level. Instead of running all 16 layers of a model like Llama 3.2 1B for every token, Myelin dynamically determines which layers to activate based on the complexity of the input and the saturation of the residual stream.</p>
          <p>Reproduction of baseline evaluations can be initiated with the following cargo run invocation:</p>
          <CodeBlock code="cargo run -p myel-bench --example llama_masking_bench --features cuda --release" />
          <h3>Empirical Perplexity Validation</h3>
          <p>To validate this thesis, we evaluated Myelin on a real Llama 3.2 1B model, comparing naive (evenly-spaced) layer skipping with our activation-importance (biomimetic) masking. The results measured on an NVIDIA RTX 4060 Laptop GPU are striking:</p>
          <MyelinChart />
          <table>
            <thead>
              <tr>
                <th>Configuration</th>
                <th>Active Layers</th>
                <th>Perplexity (Lower = Better)</th>
                <th>VRAM Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Full Baseline</strong></td>
                <td>16 / 16</td>
                <td><strong>18.2</strong></td>
                <td>3712 MB</td>
              </tr>
              <tr>
                <td>Naive Selection @ 0.75</td>
                <td>12 / 16</td>
                <td>14,055.8</td>
                <td>2784 MB</td>
              </tr>
              <tr>
                <td><strong>Biomimetic @ 0.75</strong></td>
                <td>12 / 16</td>
                <td><strong>188.8</strong></td>
                <td>2784 MB</td>
              </tr>
              <tr>
                <td>Naive Selection @ 0.50</td>
                <td>8 / 16</td>
                <td>880,763.9</td>
                <td>1856 MB</td>
              </tr>
              <tr>
                <td><strong>Biomimetic @ 0.50</strong></td>
                <td>8 / 16</td>
                <td><strong>2,033.0</strong></td>
                <td>1856 MB</td>
              </tr>
            </tbody>
          </table>
          <p>By mapping layer importance and keeping critical boundaries (like the early input projections and the final attention layer), the biomimetic path preserves perplexity up to <strong>433× better</strong> than naive selection at the same VRAM budget. Latency and memory consumption scale down linearly with active layer counts.</p>
          <h3>Input-Adaptive, Per-Token Masking</h3>
          <p>In addition to static masks, we implemented a dynamic exit policy (Hybrid v2). For each token, the residual stream delta norm is measured: <code>residual_delta_norm &lt; &tau;</code>. When the change in residual state falls below the threshold, the token exits early, bypassing the remaining middle layers. Under light-to-moderate budgets, this input-adaptive strategy yields 15–20% computational savings with almost zero perplexity loss (PPL 18.7 vs full model's 18.2). This confirms that simple tokens can skip heavy compute layers without degrading generative performance.</p>
        </>
      )
    },
    {
      id: 3,
      slug: "cardiac-anomaly-detection",
      title: "Real-Time Anomaly Detection on ECG Streams",
      date: "May 2026",
      readTime: "6 min read",
      summary: "Exploring the integration of 1D Convolutional Neural Networks and Google MedGemma for continuous cardiovascular monitoring using Holter devices.",
      content: () => (
        <>
          <p>Continuous electrocardiogram (ECG) monitoring is a vital diagnostic tool for catching intermittent arrhythmias that standard clinical tests often miss. However, processing days of continuous data collected from wearable Holter devices creates a significant bottleneck for cardiologists. The challenge lies in extracting rare anomalous waves from noisy, high-frequency signals in real-time.</p>
          <p><strong>CardioGuard</strong> solves this by combining high-speed feature extraction with advanced linguistic reasoning. The system utilizes a hybrid model architecture: a 1D Convolutional Neural Network (CNN) runs locally to perform real-time wave segmentation and anomaly filtering, while Google's MedGemma model generates clinical text reports for flagged events.</p>
          <h3>The Signal Pipeline</h3>
          <p>The continuous raw ECG signal is first passed through a localized filtering kernel to remove baseline wander and powerline interference. The clean signal is then processed through a sliding window architecture:</p>
          <CodeBlock code="[Raw Stream] --> [High-Pass Filter] --> [1D CNN Classifier] --> [MedGemma Reporter]" />
          <p>The 1D CNN is trained on the MIT-BIH Arrhythmia database, classifying individual heartbeats into normal, ventricular ectopic, or supraventricular ectopic beats with 98.4% accuracy. When an anomaly is detected, a localized signal segment is serialized and sent to the MedGemma generator. The language model translates the structural parameters (such as R-R intervals, QRS duration, and T-wave inversions) into cohesive, structured clinical summaries, speeding up clinical reviews and diagnostic timelines.</p>
        </>
      )
    }
  ]

  return (
    <div class="container">
      {/* Scroll Progress Bar for Reader View */}
      <Show when={route().primary === 'writings' && route().secondary !== null}>
        <div 
          class="scroll-progress-bar" 
          style={{ width: `${scrollPercent()}%` }} 
        />
      </Show>

      {/* Image Preview Overlay */}
      <Show when={previewImg() !== null}>
        <div 
          class="image-overlay"
          onClick={closePreview}
        >
          <button class="overlay-close" onClick={closePreview} title="Close preview">
            <FiX size={24} />
          </button>
          <Motion.img 
            src={previewImg()!} 
            class="overlay-img" 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, easing: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Show>

      {/* Custom Selection Tooltip */}
      <Show when={tooltipVisible()}>
        <div 
          class="selection-tooltip"
          style={{
            top: `${tooltipPos().top}px`,
            left: `${tooltipPos().left}px`
          }}
        >
          <button class="tooltip-btn" onClick={handleCopySelection} title="Copy selection">
            <FiCopy size={15} />
          </button>
          <div class="tooltip-divider" />
          <button class="tooltip-btn" onClick={handleShareSelection} title="Share selection">
            <FiShare2 size={15} />
          </button>
        </div>
      </Show>

      {/* Header / Nav */}
      <header>
        <div class="nav-logo" onClick={() => navigate('/')}>
          Fırat Tuna Arslan
        </div>
        <nav class="nav-links">
          <button 
            class={`nav-button ${activeTab() === 'writings' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Writings
          </button>
          <button 
            class={`nav-button ${activeTab() === 'projects' ? 'active' : ''}`}
            onClick={() => navigate('/projects')}
          >
            Projects
          </button>
          <button 
            class={`nav-button ${activeTab() === 'about' ? 'active' : ''}`}
            onClick={() => navigate('/about')}
          >
            About
          </button>
        </nav>
      </header>

      {/* Main Panel switching */}
      <Show when={loading()}>
        <Show when={route().primary === 'writings' && route().secondary !== null}>
          {/* Article Skeleton */}
          <div class="skeleton-post">
            <div class="skeleton-bar back" />
            <div class="skeleton-bar main-title" />
            <div class="skeleton-bar post-meta" />
            <div class="skeleton-paragraph">
              <div class="skeleton-bar body-line" />
              <div class="skeleton-bar body-line" />
              <div class="skeleton-bar body-line" />
              <div class="skeleton-bar body-line-short" />
            </div>
          </div>
        </Show>

        <Show when={route().secondary === null}>
          <Show when={activeTab() === 'writings'}>
            {/* Writings Feed Skeleton */}
            <div class="skeleton-list">
              <div class="skeleton-item">
                <div class="skeleton-bar meta" />
                <div class="skeleton-bar title" />
                <div class="skeleton-bar summary" />
                <div class="skeleton-bar summary-short" />
              </div>
              <div class="skeleton-item">
                <div class="skeleton-bar meta" />
                <div class="skeleton-bar title" />
                <div class="skeleton-bar summary" />
              </div>
            </div>
          </Show>

          <Show when={activeTab() === 'projects'}>
            {/* Projects Skeleton */}
            <div class="skeleton-projects">
              <div class="skeleton-bar section-title" />
              <div class="skeleton-card large" />
              <div class="skeleton-bar section-title" style={{ "margin-top": "3rem" }} />
              <div class="skeleton-project-grid">
                <div class="skeleton-card small" />
                <div class="skeleton-card small" />
              </div>
            </div>
          </Show>

          <Show when={activeTab() === 'about'}>
            {/* About Skeleton */}
            <div class="skeleton-about">
              <div class="skeleton-about-hero">
                <div class="skeleton-about-text">
                  <div class="skeleton-bar main-title" />
                  <div class="skeleton-bar body-line" />
                  <div class="skeleton-bar body-line" />
                </div>
                <div class="skeleton-avatar" />
              </div>
            </div>
          </Show>
        </Show>
      </Show>

      <Show when={!loading()}>
        <Show when={route().primary === 'writings' && route().secondary !== null}>
          {(() => {
            const post = posts.find(p => p.slug === route().secondary)
            return (
              <Motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, easing: [0.16, 1, 0.3, 1] }}
              >
                <button class="back-link" onClick={() => navigate('/')}>
                  ← back to writings
                </button>
                <article class="post-header">
                  <h1 class="post-title">{post?.title}</h1>
                  <div class="post-meta">
                    <span>{post?.date}</span>
                    <span>•</span>
                    <span>{post?.readTime}</span>
                  </div>
                </article>
                <div class="post-content">
                  {post?.content()}
                </div>
              </Motion.div>
            )
          })()}
        </Show>

        <Show when={route().secondary === null}>
          {/* Writings Tab */}
          <Show when={activeTab() === 'writings'}>
            <Motion.div 
              class="writing-list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, easing: [0.16, 1, 0.3, 1] }}
            >
              {posts.map((post) => (
                <div class="writing-item" onClick={() => navigate(`/writings/${post.slug}`)}>
                  <div class="writing-meta">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 class="writing-title">{post.title}</h3>
                  <p class="writing-summary">{post.summary}</p>
                </div>
              ))}
            </Motion.div>
          </Show>

          {/* Projects Tab */}
          <Show when={activeTab() === 'projects'}>
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, easing: [0.16, 1, 0.3, 1] }}
            >
              {/* Current Focus - Myelin */}
              <section style={{ "margin-bottom": "3rem" }}>
                <h2>Current Focus: Myelin</h2>
                <div class="myelin-container">
                  <p class="text-block">
                    I am currently working on <strong>Myelin</strong>, a bio-mimetic inference engine designed to eliminate cloud dependencies and enable high-performance, efficient local LLM execution on consumer-grade hardware (e.g., RTX 4060 GPU).
                  </p>
                  <p class="text-block">
                    Myelin utilizes <strong>dynamic layer-masking</strong> inspired by neural activation patterns in the brain. Instead of executing all layers of a model during inference, it dynamically masks which layers need to be active at the CUDA kernel level based on input and context. Real hardware benchmarks on Llama 3.2 1B validate that it preserves output perplexity <strong>74× to 433×</strong> better than naive (evenly-spaced) approaches while scaling down VRAM and compute overhead.
                  </p>
                  <div class="tags">
                    <span class="tag">Rust</span>
                    <span class="tag">CUDA</span>
                    <span class="tag">Protobuf</span>
                    <span class="tag">LLM Inference</span>
                  </div>
                </div>
              </section>

              <section>
                <h2>Selected Works</h2>
                <div class="project-list">
                  {projects.map((project) => (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" class="project-item">
                      <div class="project-header">
                        <span class="project-title">{project.title}</span>
                        <span class="project-year">{project.year}</span>
                      </div>
                      <p class="project-description">{project.description}</p>
                      <div class="project-tech">{project.tech}</div>
                    </a>
                  ))}
                </div>
              </section>
            </Motion.div>
          </Show>

          {/* About Tab */}
          <Show when={activeTab() === 'about'}>
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, easing: [0.16, 1, 0.3, 1] }}
            >
              {/* Intro Hero Section */}
              <section class="intro-container">
                <div class="intro-text">
                  <h1>Fırat Tuna Arslan</h1>
                  <div class="subtitle">
                    Artificial Intelligence Engineering Student & Software Developer
                  </div>
                  <p class="bio">
                    I have been in the software world since 2017. I design production-grade applications focusing on systems programming, AI integrations, and modern web technologies. Currently pursuing my degree in Artificial Intelligence Engineering at Trabzon University, while actively working as a Software Engineer at Quacomes.
                  </p>
                </div>
                <div class="profile-img-container">
                  <img src={profileUrl} alt="Fırat Tuna Arslan" loading="lazy" class="profile-img previewable-img" style={{ cursor: "zoom-in" }} />
                </div>
              </section>

              {/* Focus & Capabilities */}
              <section style={{ "margin-top": "3rem" }}>
                <h2>Focus & Capabilities</h2>
                <p class="text-block">
                  I advocate for writing efficient, readable, and scalable code. I build projects across a wide spectrum, from Large Language Model (LLM) integrations to low-level system architectures. Writing high-performance services in Rust and Go, and designing minimalist web experiences using SolidJS and Next.js are core parts of my routine.
                </p>
                <div class="tags">
                  {skills.map((skill) => (
                    <span class="tag">{skill}</span>
                  ))}
                </div>
              </section>

              {/* Contact & Socials */}
              <section style={{ "margin-top": "3rem" }}>
                <h2>Get in Touch</h2>
                <p class="text-block">
                  Feel free to reach out via email or social media if you want to discuss ideas, collaborate on projects, or just say hello.
                </p>
                
                <div class="contact-grid">
                  <a href="https://linkedin.com/in/firattunaarslan" target="_blank" rel="noopener noreferrer" class="contact-card">
                    <span class="contact-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </span>
                    <div class="contact-info">
                      <span class="contact-label">LinkedIn</span>
                      <span class="contact-value">/in/firattunaarslan</span>
                    </div>
                  </a>

                  <a href="https://x.com/firattunaarslan" target="_blank" rel="noopener noreferrer" class="contact-card">
                    <span class="contact-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </span>
                    <div class="contact-info">
                      <span class="contact-label">X (Twitter)</span>
                      <span class="contact-value">@firattunaarslan</span>
                    </div>
                  </a>

                  <a href="https://instagram.com/firattunaarslann" target="_blank" rel="noopener noreferrer" class="contact-card">
                    <span class="contact-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </span>
                    <div class="contact-info">
                      <span class="contact-label">Instagram</span>
                      <span class="contact-value">@firattunaarslann</span>
                    </div>
                  </a>

                  <a href="mailto:firattunaarslan@gmail.com" class="contact-card">
                    <span class="contact-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </span>
                    <div class="contact-info">
                      <span class="contact-label">Email</span>
                      <span class="contact-value">firattunaarslan@gmail.com</span>
                    </div>
                  </a>
                </div>
              </section>
            </Motion.div>
          </Show>
        </Show>
      </Show>

      {/* Footer */}
      <Motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        © 2026 Fırat Tuna Arslan.
      </Motion.footer>
    </div>
  )
}

export default App
