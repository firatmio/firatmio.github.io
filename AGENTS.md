# AGENTS.md

## Proje özeti

`firattunaarslan.me` — Fırat Tuna Arslan'ın kişisel portfolyo sitesi. Tek sayfalık, sürekli kamera yolculuğu şeklinde sinematik bir WebGL deneyimi. Scroll = zaman ekseni. Kullanıcı bir nöron ağının içinden geçip beyne, oradan evrene, oradan kuma ve yıldızların altındaki bir gece çölüne yolculuk yapıyor. Proje detayları ve "About" bilgisi bu yolculuğun duraklarına gömülü.

Mevcut site (açık/krem editoryal tema, Writings/Projects/About sekmeleri) bir yer tutucuydu ve tamamen kaldırılıyor.

---

## Tasarım ilkeleri — EN KRİTİK KISIM

- **Organik, matematiksel değil.** Düzgün küre/grid/simetrik formüller YASAK. Tüm pozisyonlar Simplex/Perlin noise ile bozulmalı. Nöron dağılımı, bağlantı eğrileri, kum/dalga dokusu — hepsi düzensiz, "elle büyümüş" hissi vermeli.
- **Düz çizgi yok.** Nöron bağlantıları (synapse) bezier eğrisi, sinir lifi gibi kavis almalı — asla düz segment değil.
- **Homojen değil.** Nöron boyut/parlaklığı eşit dağılmamalı — gerçek projeler (hub) büyük/parlak, dekoratif/trivia node'lar küçük/soluk.
- **Hareket nefes alır gibi.** Idle animasyonlar düzensiz-fazlı (her nöron farklı zamanlama ile pulse eder, hepsi senkron değil). Kamera hareketi lineer değil, ease eğrileriyle organik hızlanma/yavaşlama.
- **Tüm geçişler yumuşak interpolasyon.** Sert kesiş (hard cut) yok — evren → kum → gece çölü dahil. (İlk plandaki evren→sahil hard cut'ı denendi; kopuk hissettirdiği için kaldırıldı.)

---

## Teknik yığın

- **Next.js** (App Router, TypeScript) — routing iskeleti, `/projects/[slug]` detay sayfaları için
- **Three.js** — sahne/kamera/render yönetimi
- **GLSL custom shader'lar** — parçacık deformasyonu, durumlar arası morph, glow
- **GSAP + ScrollTrigger** — scroll progress'i kamera pozisyonuna ve shader uniform'larına (`uProgress`, `uTime`) bağlamak için
- **postprocessing / Three.js `EffectComposer`** — bloom (nöron/yıldız parlaklığı)
- **simplex-noise** (npm) — organik pozisyon üretimi
- **Tailwind CSS** — UI katmanı (liquid glass card, metin overlay'leri)

---

## Sahne akışı

| # | Sahne | Tetikleyici | İçerik |
|---|-------|-------------|--------|
| 0 | İmza (FTA) | Yüklenince | Parçacıklar ışıklı tozdan, Fraunces fontunda "FTA" baş harflerini oluşturur: kameraya düz bakan, tek parça, kabartmalı (ışık-gölgeyle hacim veren) harfler — perspektif/katman yok. Fareyle etkileşim: imlecin geçtiği yerlerde harflerin taneleri sürükleme yönünde, düzensizce savrulur ve iz söndükçe yavaşça yerine döner (duran imleç delik açmaz); kamera hafif paralaks yapar. |
| 1 | Nöron haritası (hero) | İlk scroll | İmza dağılır, parçacıklar ekranı kaplayan organik nöron ağına yerleşir. Her proje = bir nöron. Boşluk dolgusu için dekoratif/trivia nöronlar. |
| — | Etkileşim | Tıklama | Proje-nöronuna tıklama → liquid glass card (özet + `/projects/[slug]` linki) |
| 2 | Zoom-in | Scroll 1 | Kamera yaklaşır, harita büyür, detaylar netleşir |
| 3 | Nöron içine giriş = About | Scroll 2 | Kamera bir nöronun içine girer, bio/skills/background gösterilir |
| 4 | Zoom-out → beyin dokusu | Scroll 3 | Merkezi nöron küçülür, çevredeki diğer nöronlar görünür kalır |
| 5 | Evren/yıldız kümesi | Scroll 4 | Aynı nokta deseni yıldız kümesi gibi okunur (nöron ≈ yıldız metaforu) |
| 6 | Sıkışma → kum | Scroll 5 | Galaksi girdap gibi süzülüp yakın plan bir kum yüzeyine yerleşir (yumuşak geçiş). Kumun üstünde, yine tanelerden oluşan, kendi renklerinde (krem yazı, turuncu Q — quacomes.com koyu tema) bir Quacomes logosu fiziksel bir nesne gibi durur: kamera ona hafif yukarıdan bakar, kum arkasında da sürer ve harfler arkadaki kumu örter; logo kameraya düz bakar, kalınlığı sağa doğru eğik (klasik 3D yazı gibi) okunur, dibinde temas gölgesi var (dibine kum birikintisi denendi, kaide gibi durdu); alçak güneş gölgesini kuma düşürür. Logoya tıklayınca quacomes.com yeni sekmede açılır. |
| 7 | Gece çölü — kapanış + footer | Scroll son | Kamera kum tanelerinden geri çekilir: ufka uzanan ay ışıklı kumullar, rüzgârın kretlerden savurduğu kum, gökte yeniden galaksi (Samanyolu); taneler yıldızlara yükselir. Dört parlak iletişim yıldızı (hero'daki proje nöronlarının aynası) çekirdek olur: son kaydırmada yıldızlar akıp onlara toplanır ve platform logolarını (LinkedIn, X, GitHub, e-posta) kendi marka renklerinde oluşturur — ortada gevşek bir 2×2, Samanyolu yerinde kalır. Her logo tıklanabilir, altında adı ve kullanıcı adı; üzerine gelinen logo parlar. Sahnenin son anı = footer/iletişim (ayrı bileşen değil, sahnenin kendisi bu işlevi taşır). |

**Kapsam dışı (bilinçli olarak ekleniyor değil):** Yatay scroll ile kayan proje/yazı kart şeridi. İleride ayrı değerlendirilecek — şimdi eklenmeyecek.

---

## Mimari yaklaşım

- **Tek parçacık sistemi, çoklu hedef pozisyon seti.** Ayrı sahneler kurmak yerine tek bir `InstancedMesh`/`Points` sistemi — imza, nöron haritası, beyin, evren, kum, gece çölü hepsi bu sistemin farklı hedef pozisyon dizileri. Scroll progress'e göre pozisyonlar arası interpolasyon/blend yapılır.
- **Işık ve örtme:** Parçacıklar toplamalı parlar; tek istisna kum durumu — yere oturmuş taneler opaktır ve arkalarını örter (premultiplied "over" karışımı + kum kamerasına göre uzaktan yakına çizim sırası). Böylece kumdaki Quacomes logosu fiziksel bir cisim gibi okunur.
- **Kamera:** Scroll'a bağlı, ease eğrileriyle hareket eden tek bir path. GSAP ScrollTrigger `scrub` ile senkronize.
- **Gece çölü de aynı parçacık sisteminin bir durumu** — kumullar, savrulan kum ve yıldızlar ayrı sahne değil; `uTime` bazlı sürekli animasyon. Tek yardımcı alt-sistem ufuktaki hafif gökyüzü parıltısı. (Tanelerin altına kesintisiz bir kumul yüzeyi denendi, beğenilmedi; doluluk tanelerin kendisinden gelmeli.)
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

### İletişim (gece çölü / footer — yıldızlardan oluşan tıklanabilir logolar)

- LinkedIn: `/in/firattunaarslan`
- X (Twitter): `@firattunaarslan`
- GitHub: `@firatmio`
- Email: `me@firattunaarslan.me`

---

## Yapılmaması gerekenler

- Yatay scroll kart şeridi (Writings/çalışmalar özeti) EKLENMEYECEK — bilinçli olarak kapsam dışı bırakıldı
- Kapanış sahnesi (gece çölü) ayrı bir footer bileşeni DEĞİL — sahnenin kendisi bu işlevi görüyor
- Kendi yüzü/fotoğrafı siteye KONULMAYACAK
- Geometrik/matematiksel kusursuzluk (düzgün küre, simetrik grid, düz çizgi) KULLANILMAYACAK
- Hiçbir sahne geçişinde sert kesiş kullanılmayacak — hepsi yumuşak interpolasyon

---

## Önerilen uygulama sırası

1. İskelet: Next.js kurulumu, temel Three.js canvas, boş sahne + kamera
2. Nöron parçacık sistemi (statik): noise-tabanlı pozisyon, hub/dekoratif ayrımı, temel shader, bloom
3. Idle animasyon: düzensiz-fazlı pulse, bağlantı eğrileri + sinyal akışı
4. Etkileşim: raycasting ile tıklama → liquid glass card (önce CSS blur, gerekirse shader'a geçiş)
5. Scroll-kamera sistemi: GSAP ScrollTrigger, kamera path'i, uniform bağlantısı
6. Sahne durumları arası interpolasyon (nöron → beyin → evren)
7. About durağı: nöron-içi kamera girişi + içerik overlay
8. Evren → kum sıkışması (yumuşak geçiş)
9. Gece çölü: kumullar, rüzgârla savrulan kum, yıldızlı gök + atmosfer
10. Footer/iletişim: tıklanabilir iletişim yıldızları
11. Proje detay sayfaları (`/projects/[slug]`)
12. Performans geçişi: mobil test, parçacık ölçekleme, fallback

Büyük/karmaşık görevlerde önce küçük bir kapsamla (örn. sadece faz 2) pilot çalışma yapıp sonucu değerlendirmek, sonra devam etmek tercih edilir.
