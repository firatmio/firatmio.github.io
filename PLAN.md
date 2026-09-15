# Fırat Tuna Arslan — Sinematik Portfolyo Sitesi
## Claude Code (Opus 5) için Uygulama Planı

---

## 1. Proje Özeti

`firattunaarslan.me` sitesinin tamamen yeniden tasarımı. Mevcut site (açık/krem editoryal tema, Writings/Projects/About sekmeleri) bir yer tutucu — tamamen kaldırılacak.

Yeni site: **tek sayfalık, sürekli kamera yolculuğu şeklinde sinematik bir WebGL deneyimi**. Scroll = zaman ekseni. Kullanıcı bir nöron ağının içinden geçip beyne, oradan evrene, oradan bir sahile yolculuk yapıyor. Proje detayları ve "About" bilgisi bu yolculuğun duraklarına gömülü.

**Tasarım felsefesi:** Her şey organik ve düzensiz görünmeli — matematiksel/kusursuz simetri yok. Perlin/Simplex noise ile bozulmuş pozisyonlar, düzensiz pulse fazları, eğri (bezier) bağlantılar, doku/grain. Referans siteler: igloo.inc (tam ekran WebGL sahne, wireframe/parçacık, scroll-tetiklemeli reveal), landonorris.com (dev tipografi, sahne geçişleri, imza motifi).

---

## 2. Sahne Akışı (tek sürekli kamera yolculuğu)

| # | Sahne | Scroll tetikleyici | İçerik |
|---|-------|---------------------|--------|
| 1 | **Nöron haritası (hero)** | Sayfa yüklenince, statik | Ekranı kaplayan organik nöron ağı. Her gerçek proje bir nöron (bkz. §5 içerik verisi). Boş alanı doldurmak için dekoratif/trivia nöronları da var (proje değil, küçük bilgi notları). İdle'da düzensiz-fazlı nefes/pulse animasyonu. |
| — | **Etkileşim (her an aktif)** | Tıklama | Bir proje-nöronuna tıklanınca **liquid glass card** açılır: proje özeti + (varsa) `/projects/[slug]` detay sayfasına link. |
| 2 | **Zoom-in** | Scroll 1 | Kamera haritaya yaklaşır, nöronlar netleşir, daha fazla detay/nöron ortaya çıkar. |
| 3 | **Nöron içine giriş = About** | Scroll 2 | Kamera belirli bir nöronun içine girer. Bio, skills, background burada gösterilir (bkz. §5). |
| 4 | **Zoom-out → beyin dokusu** | Scroll 3 | Kamera geri çekilir, merkezi nöron küçülür ama çevredeki diğer nöronlar görünür kalır ("beynin içindeymiş gibi"). |
| 5 | **Evren/yıldız kümesi** | Scroll 4 | Zoom-out devam eder, aynı nokta deseni artık yıldız kümesi/galaksi gibi okunur (nöron ≈ yıldız ölçek metaforu). |
| 6 | **Sıkışma → sert kesiş** | Scroll 5 | Noktalar kum tanesi dokusuna sıkışır. **Crossfade değil, sert kesiş (hard cut).** |
| 7 | **Sahil/deniz — kapanış + footer** | Scroll son | Kamera sahilde. Gerstner wave okyanus shader'ı (dinamik dalga + specular), noise-tabanlı rüzgarla hareket eden kum yüzeyi, opsiyonel seyrek uçuşan kum parçacığı, yavaş atmosfer (bulut/ışık kayması). **Bu sahnenin son anı = footer/iletişim** (email, LinkedIn, X, GitHub @firatmio). Ayrı bir footer bileşeni yok — sahnenin kendisi bu işlevi taşıyor. |

**Şimdilik kapsam dışı (ileride ayrı ele alınacak):** Yatay scroll ile kayan "çalışmalar" kart şeridi — genel tasarımdan kopabileceği için eklenmiyor.

---

## 3. Teknik Yığın

- **Next.js** (App Router) — sayfa/routing iskeleti, `/projects/[slug]` detay sayfaları için
- **Three.js** — sahne/kamera/render yönetimi
- **GLSL custom shader'lar** — parçacık deformasyonu, glow/bloom, ocean wave, kum noise
- **GSAP + ScrollTrigger** — scroll pozisyonunu kamera ve shader uniform'larına (`uProgress`, `uTime`) bağlamak için
- **postprocessing / three.js EffectComposer** — bloom (nöron/yıldız parlaklığı için)
- **backdrop-filter blur + hafif refraction shader** — liquid glass card efekti (CSS blur tek başına yetersiz kalırsa custom shader'a geçilir)

---

## 4. Sahne Mimarisi — Teknik Yaklaşım

**Tek parçacık sistemi, çoklu hedef pozisyon seti.** Üç/dört ayrı sahne kurmak yerine, tek bir `InstancedMesh`/`Points` sistemi kullanılmalı. Her "durum" (nöron haritası, beyin, evren, kum) o sistemin farklı bir hedef pozisyon dizisidir; scroll progress'e göre bu pozisyonlar arası **interpolasyon (lerp/noise-blend)** yapılır. Bu hem performans hem de sahneler arası pürüzsüz geçiş için kritik.

- **Pozisyon üretimi:** Simplex/Perlin noise ile bozulmuş dağılım — düzgün küre/grid formülü yasak, düzensizlik şart.
- **Nöron boyut/parlaklık dağılımı:** Homojen değil — hub'lar (gerçek projeler) büyük/parlak, dekoratif node'lar küçük/soluk.
- **Bağlantılar (synapse):** Düz çizgi değil, hafif bezier eğri. Sinyal akışı için bağlantı boyunca kayan gradient/ışık animasyonu.
- **Kamera:** Scroll progress'e bağlı, ease eğrileriyle (lineer değil) hareket eden tek bir kamera yolu (path). GSAP ScrollTrigger `scrub` ile senkronize.
- **Sahne 6→7 geçişi:** Diğer geçişlerin aksine bu **hard cut** — shader/kamera interpolasyonu değil, gerçek sahne değişimi (yeni Three.js sahnesi ya da aynı sahnede ani obje/kamera sıçraması).
- **Deniz sahnesi:** Ayrı bir alt-sistem — Gerstner wave vertex shader (okyanus) + noise-displacement kum yüzeyi + `uTime`'a bağlı sürekli animasyon (tetikleyici gerekmez, sahne açılır açılmaz canlı).

---

## 5. İçerik Verisi

### Projeler (nöron = proje, canlı siteden alınmıştır)

| Proje | Yıl | Açıklama | Etiketler |
|-------|-----|----------|-----------|
| **Myelin** (Current Focus) | 2026 | Bio-mimetic inference engine; cloud bağımlılığını ortadan kaldırıp tüketici donanımında (örn. RTX 4060) yüksek performanslı yerel LLM çalıştırmayı hedefliyor. Beyin aktivasyon paternlerinden ilham alan dynamic layer-masking kullanır — CUDA kernel seviyesinde hangi katmanların aktif olacağına girdiye göre karar verir. Llama 3.2 1B üzerinde gerçek donanım benchmark'ları, naif (eşit aralıklı) yaklaşımlara göre 74×–433× daha iyi perplexity koruması gösteriyor. | Rust, CUDA, Protobuf, LLM Inference |
| **Axiom** | 2026 | Terminal iş akışlarını otomatikleştiren, Ollama üzerinden açık kaynak LLM'leri offline çalıştıran, Rust tabanlı güvenlik motoruyla geliştirici görevlerini güvenli yöneten local-first masaüstü AI asistanı. | Rust, Ollama, Tauri, Security Engine |
| **CardioGuard** | 2026 | Holter EKG cihazlarından gerçek zamanlı kardiyak veriyi Google MedGemma ve CNN modelleriyle anomali tespiti için analiz eden uçtan uca sağlık teknolojisi platformu. | Python, PyTorch, Go, Next.js, MedGemma, Docker |
| **lofi-pomodoro** | 2025 | Rust ve Tauri üzerine kurulu, dikkat dağınıklığını azaltmayı hedefleyen minimalist masaüstü pomodoro zamanlayıcısı. | Rust, Tauri, TypeScript, Tailwind CSS |
| **OmniSketch** | 2024 | Tamamen vektör tabanlı çizim yapabilen, modern web teknolojileriyle geliştirilmiş minimalist/hafif çizim tahtası uygulaması. | TypeScript, HTML5 Canvas, Vanilla CSS |
| **Filmbox Promo** | 2025 | Next.js 15 ve React 19 mimarisi üzerine kurulu, modern ve duyarlı arayüzlü yüksek performanslı film keşif platformu. | Next.js 15, React 19, Tailwind CSS, TMDB API |

*Not: `/areas/` altında Nocturne, LinkUp, Lynq, IFP gibi başka projeler de var — hangilerinin siteye gireceğine karar vermek gerekiyor; yukarıdaki liste şu anki canlı sitedeki "Selected Works" ile birebir aynı.*

### About (nöron-içi sahne içeriği)

**Fırat Tuna Arslan** — Artificial Intelligence Engineering Student & Software Developer

> 2017'den beri yazılım dünyasındayım. Sistem programlama, AI entegrasyonları ve modern web teknolojilerine odaklanarak production-grade uygulamalar tasarlıyorum. Şu anda Trabzon Üniversitesi'nde Yapay Zeka Mühendisliği okuyorum, aynı zamanda Quacomes'te Software Engineer olarak çalışıyorum.

**Focus & Capabilities:** Verimli, okunabilir ve ölçeklenebilir kod savunuculuğu. LLM entegrasyonlarından düşük seviye sistem mimarilerine kadar geniş bir yelpazede proje geliştirme. Rust ve Go'da yüksek performanslı servisler, SolidJS ve Next.js ile minimalist web deneyimleri.

**Skills:** Go, Rust, Python, TypeScript, JavaScript, SolidJS, React, Next.js, Tauri, PyTorch, FastAPI, PostgreSQL, Supabase, Docker

### İletişim (deniz sahnesi / footer)

- LinkedIn: `/in/firattunaarslan`
- X (Twitter): `@firattunaarslan`
- GitHub: `@firatmio`
- Email: *(eklenmesi gerekiyor — mevcut sitede yok)*

---

## 6. Performans ve Fallback Stratejisi

- Parçacık sayısı cihaz/ekran boyutuna göre ölçeklenmeli (mobilde düşürülmüş sayı).
- Düşük FPS / WebGL desteklemeyen cihazlar için basit bir statik/video fallback düşünülmeli (en azından hero sahnesi için).
- Bloom/postprocessing mobilde kapatılabilir veya hafifletilebilir toggle olmalı.
- Shader'da CPU yerine GPU hesaplama önceliklendirilmeli (zaman bazlı `uTime` fonksiyonları, CPU'da parçacık pozisyonu hesaplanmamalı).

---

## 7. Önerilen Uygulama Sırası (fazlar)

Claude Code ile büyük patlama yerine aşamalı ilerlemek için:

1. **İskelet:** Next.js proje kurulumu, temel Three.js canvas entegrasyonu, boş sahne + kamera.
2. **Nöron parçacık sistemi (statik):** Noise-tabanlı organik pozisyon üretimi, hub/dekoratif node ayrımı, temel shader (renk/boyut), bloom postprocessing.
3. **Idle animasyon:** Düzensiz-fazlı pulse, bağlantı eğrileri + sinyal akışı animasyonu.
4. **Etkileşim:** Nöron tıklama → raycasting → liquid glass card (önce CSS blur ile, sonra istenirse shader'a geçiş).
5. **Scroll-kamera sistemi:** GSAP ScrollTrigger entegrasyonu, kamera path'i, scroll progress → shader uniform bağlantısı.
6. **Sahne durumları arası interpolasyon:** Nöron → beyin → evren pozisyon setleri ve geçiş blend'i.
7. **About durağı:** Nöron-içi kamera girişi + içerik overlay.
8. **Evren → kum sıkışması + hard cut geçişi.**
9. **Deniz sahnesi:** Gerstner wave shader, kum noise-displacement + rüzgar animasyonu, opsiyonel parçacık, atmosfer.
10. **Footer/iletişim katmanı** deniz sahnesinin sonuna entegrasyon.
11. **Proje detay sayfaları** (`/projects/[slug]`) — liquid glass card'dan linklenen klasik (sinematik olmayan) sayfalar.
12. **Performans geçişi:** Mobil test, parçacık sayısı ölçekleme, fallback.

---

## 8. Açık Kalan / Karar Bekleyen Noktalar

- Deniz sahnesindeki email adresi netleşmedi.
- Hangi projelerin nöron olarak sahneye gireceği kesinleşmedi (yukarıdaki 6 proje mi, yoksa `/areas/` altındaki diğerleri de dahil mi).
- Dekoratif/trivia nöronlarının içeriği (hangi bilgiler, kaç tane) belirlenmedi.
- Liquid glass card'ın gerçek shader mi yoksa CSS `backdrop-filter` mi olacağı — performans testine bağlı, ilk fazda CSS ile başlanması öneriliyor.
- Yatay "çalışmalar" kart şeridi kapsam dışı bırakıldı, ileride ayrı değerlendirilecek.
