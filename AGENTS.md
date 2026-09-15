# AGENTS.md

## Proje özeti

`firattunaarslan.me` — Fırat Tuna Arslan'ın kişisel portfolyo sitesi. Tek sayfalık, sürekli kamera yolculuğu şeklinde sinematik bir WebGL deneyimi. Scroll = zaman ekseni. Kullanıcı bir nöron ağının içinden geçip beyne, oradan evrene, oradan bir sahile yolculuk yapıyor. Proje detayları ve "About" bilgisi bu yolculuğun duraklarına gömülü.

Mevcut site (açık/krem editoryal tema, Writings/Projects/About sekmeleri) bir yer tutucuydu ve tamamen kaldırılıyor.

---

## Tasarım ilkeleri — EN KRİTİK KISIM

- **Organik, matematiksel değil.** Düzgün küre/grid/simetrik formüller YASAK. Tüm pozisyonlar Simplex/Perlin noise ile bozulmalı. Nöron dağılımı, bağlantı eğrileri, kum/dalga dokusu — hepsi düzensiz, "elle büyümüş" hissi vermeli.
- **Düz çizgi yok.** Nöron bağlantıları (synapse) bezier eğrisi, sinir lifi gibi kavis almalı — asla düz segment değil.
- **Homojen değil.** Nöron boyut/parlaklığı eşit dağılmamalı — gerçek projeler (hub) büyük/parlak, dekoratif/trivia node'lar küçük/soluk.
- **Hareket nefes alır gibi.** Idle animasyonlar düzensiz-fazlı (her nöron farklı zamanlama ile pulse eder, hepsi senkron değil). Kamera hareketi lineer değil, ease eğrileriyle organik hızlanma/yavaşlama.
- **Geçişlerin çoğu yumuşak interpolasyon — SADECE bir istisna var:** Evren/yıldız sahnesinden kum/sahil sahnesine geçiş **sert kesiş (hard cut)** olmalı, crossfade değil.

---

## Teknik yığın

- **Next.js** (App Router, TypeScript) — routing iskeleti, `/projects/[slug]` detay sayfaları için
- **Three.js** — sahne/kamera/render yönetimi
- **GLSL custom shader'lar** — parçacık deformasyonu, ocean wave (Gerstner), kum noise-displacement, glow
- **GSAP + ScrollTrigger** — scroll progress'i kamera pozisyonuna ve shader uniform'larına (`uProgress`, `uTime`) bağlamak için
- **postprocessing / Three.js `EffectComposer`** — bloom (nöron/yıldız parlaklığı)
- **simplex-noise** (npm) — organik pozisyon üretimi
- **Tailwind CSS** — UI katmanı (liquid glass card, metin overlay'leri)

---

## Sahne akışı

| # | Sahne | Tetikleyici | İçerik |
|---|-------|-------------|--------|
| 1 | Nöron haritası (hero) | Yüklenince | Ekranı kaplayan organik nöron ağı. Her proje = bir nöron. Boşluk dolgusu için dekoratif/trivia nöronlar. |
| — | Etkileşim | Tıklama | Proje-nöronuna tıklama → liquid glass card (özet + `/projects/[slug]` linki) |
| 2 | Zoom-in | Scroll 1 | Kamera yaklaşır, harita büyür, detaylar netleşir |
| 3 | Nöron içine giriş = About | Scroll 2 | Kamera bir nöronun içine girer, bio/skills/background gösterilir |
| 4 | Zoom-out → beyin dokusu | Scroll 3 | Merkezi nöron küçülür, çevredeki diğer nöronlar görünür kalır |
| 5 | Evren/yıldız kümesi | Scroll 4 | Aynı nokta deseni yıldız kümesi gibi okunur (nöron ≈ yıldız metaforu) |
| 6 | Sıkışma → HARD CUT | Scroll 5 | Noktalar kum dokusuna sıkışır, ardından sert kesiş |
| 7 | Sahil/deniz — kapanış + footer | Scroll son | Gerstner wave okyanus + rüzgarla hareket eden kum + atmosfer. Sahnenin son anı = footer/iletişim (ayrı bileşen değil, sahnenin kendisi bu işlevi taşır). |

**Kapsam dışı (bilinçli olarak ekleniyor değil):** Yatay scroll ile kayan proje/yazı kart şeridi. İleride ayrı değerlendirilecek — şimdi eklenmeyecek.

---

## Mimari yaklaşım

- **Tek parçacık sistemi, çoklu hedef pozisyon seti.** Ayrı sahneler kurmak yerine tek bir `InstancedMesh`/`Points` sistemi — nöron haritası, beyin, evren, kum hepsi bu sistemin farklı hedef pozisyon dizileri. Scroll progress'e göre pozisyonlar arası interpolasyon/blend yapılır.
- **Kamera:** Scroll'a bağlı, ease eğrileriyle hareket eden tek bir path. GSAP ScrollTrigger `scrub` ile senkronize.
- **Deniz sahnesi ayrı bir alt-sistem** — Gerstner wave vertex shader + noise-displacement kum + `uTime` bazlı sürekli animasyon (tetikleyici gerekmez, açılır açılmaz canlı).
- **Performans:** Shader hesaplamaları GPU'da olmalı, CPU'da parçacık pozisyonu hesaplanmamalı. Parçacık sayısı cihaz/ekran boyutuna göre ölçeklenmeli (mobilde düşürülmüş sayı). Düşük FPS / WebGL desteklemeyen cihazlar için statik/video fallback düşünülmeli.

---

## İçerik verisi

### Projeler (nöron = proje)

| Proje | Yıl | Özet | Etiketler |
|-------|-----|------|-----------|
| Myelin (Current Focus) | 2026 | Bio-mimetic inference engine, cloud bağımlılığı olmadan tüketici donanımında yüksek performanslı yerel LLM çalıştırma. Dynamic layer-masking, CUDA kernel seviyesinde. Llama 3.2 1B'de 74×–433× daha iyi perplexity koruması. | Rust, CUDA, Protobuf, LLM Inference |
| Axiom | 2026 | Local-first, privacy-focused masaüstü AI asistanı. Terminal iş akışı otomasyonu, Ollama ile offline LLM, Rust güvenlik motoru. | Rust, Ollama, Tauri, Security Engine |
| CardioGuard | 2026 | Holter EKG verisini Google MedGemma ve CNN modelleriyle analiz eden uçtan uca sağlık teknolojisi platformu. | Python, PyTorch, Go, Next.js, MedGemma, Docker |
| lofi-pomodoro | 2025 | Rust/Tauri ile minimalist masaüstü pomodoro zamanlayıcısı. | Rust, Tauri, TypeScript, Tailwind CSS |
| OmniSketch | 2024 | Vektör tabanlı minimalist çizim tahtası. | TypeScript, HTML5 Canvas, Vanilla CSS |
| Filmbox Promo | 2025 | Next.js 15 / React 19 ile film keşif platformu. | Next.js 15, React 19, Tailwind CSS, TMDB API |

### About (nöron-içi sahne içeriği)

**Fırat Tuna Arslan** — Artificial Intelligence Engineering Student & Software Developer

2017'den beri yazılım dünyasında. Sistem programlama, AI entegrasyonları ve modern web teknolojilerine odaklanarak production-grade uygulamalar tasarlıyor. Trabzon Üniversitesi'nde Yapay Zeka Mühendisliği okuyor, Quacomes'te Software Engineer olarak çalışıyor.

**Skills:** Go, Rust, Python, TypeScript, JavaScript, SolidJS, React, Next.js, Tauri, PyTorch, FastAPI, PostgreSQL, Supabase, Docker

### İletişim (deniz sahnesi / footer)

- LinkedIn: `/in/firattunaarslan`
- X (Twitter): `@firattunaarslan`
- GitHub: `@firatmio`
- Email: *(henüz belirlenmedi)*

---

## Yapılmaması gerekenler

- Yatay scroll kart şeridi (Writings/çalışmalar özeti) EKLENMEYECEK — bilinçli olarak kapsam dışı bırakıldı
- Deniz sahnesi ayrı bir footer bileşeni DEĞİL — sahnenin kendisi bu işlevi görüyor
- Kendi yüzü/fotoğrafı siteye KONULMAYACAK
- Geometrik/matematiksel kusursuzluk (düzgün küre, simetrik grid, düz çizgi) KULLANILMAYACAK
- Evren→kum geçişi dışında hiçbir sahne geçişinde sert kesiş kullanılmayacak — hepsi yumuşak interpolasyon

---

## Önerilen uygulama sırası

1. İskelet: Next.js kurulumu, temel Three.js canvas, boş sahne + kamera
2. Nöron parçacık sistemi (statik): noise-tabanlı pozisyon, hub/dekoratif ayrımı, temel shader, bloom
3. Idle animasyon: düzensiz-fazlı pulse, bağlantı eğrileri + sinyal akışı
4. Etkileşim: raycasting ile tıklama → liquid glass card (önce CSS blur, gerekirse shader'a geçiş)
5. Scroll-kamera sistemi: GSAP ScrollTrigger, kamera path'i, uniform bağlantısı
6. Sahne durumları arası interpolasyon (nöron → beyin → evren)
7. About durağı: nöron-içi kamera girişi + içerik overlay
8. Evren → kum sıkışması + hard cut geçişi
9. Deniz sahnesi: Gerstner wave + kum noise + rüzgar + atmosfer
10. Footer/iletişim katmanı deniz sahnesine entegrasyon
11. Proje detay sayfaları (`/projects/[slug]`)
12. Performans geçişi: mobil test, parçacık ölçekleme, fallback

Büyük/karmaşık görevlerde önce küçük bir kapsamla (örn. sadece faz 2) pilot çalışma yapıp sonucu değerlendirmek, sonra devam etmek tercih edilir.
