document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    
    const socialToggle = document.getElementById('social-toggle');
    const socialLinksFloat = document.querySelector('.social-links-float');

    const projectCards = document.querySelectorAll('.project-card');
    const projectModal = document.getElementById('project-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalExternal = document.getElementById('modal-external');
    const modalGithub = document.getElementById('modal-github');
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-img');
    const modalDesc = document.getElementById('modal-desc');
    const modalTechList = document.getElementById('modal-tech-list');
    const modalFeaturesList = document.getElementById('modal-features-list');

    const projectData = {
        'deepdev': {
            title: 'DeepDev - AI Code Editor',
            description: 'DeepDev, yapay zeka destekli gelişmiş bir kod editörüdür. Kodunuzun ne işe yaradığını anlayabilen, otomatik tamamlama ve hata düzeltme önerileri sunan modern bir geliştirme ortamı.',
            technologies: ['React.js', 'Electron.js', 'FastAPI', 'Python', 'OpenAI API', 'SQLite'],
            features: [
                'AI destekli kod tamamlama',
                'Akıllı hata tespiti ve düzeltme önerileri',
                'Çoklu dil desteği',
                'Gerçek zamanlı kod analizi',
                'Özelleştirilebilir tema sistemi',
                'Git entegrasyonu'
            ],
            image: 'https://via.placeholder.com/800x300/7877c6/ffffff?text=DeepDev',
            externalUrl: './projects/deepdev/',
            githubUrl: false
        },
        'rehabilitasyon': {
            title: 'VR Rehabilitasyon Oyunu',
            description: 'Meta Quest 3 için geliştirilen, felçli hastalar için özel tasarlanmış VR rehabilitasyon oyunu. El kaslarını güçlendirmeye yönelik interaktif egzersizler içerir.',
            technologies: ['Unity', 'C#', 'Meta SDK', 'Firebase', 'Next.js', 'WebXR'],
            features: [
                'Gerçek zamanlı hareket takibi',
                'Kişiselleştirilmiş egzersiz programları',
                'İlerleme raporlama sistemi',
                'Doktor paneli ile hasta takibi',
                'Gamification öğeleri',
                'Meta Quest 3 optimizasyonu'
            ],
            image: 'https://via.placeholder.com/800x300/ff9f7c/ffffff?text=VR+Rehab',
            externalUrl: './projects/rehabilitasyon/',
            githubUrl: 'https://github.com/e500ky/rehabilitasyon'
        },
        'wobble': {
            title: 'Wobble - Discord Alternative',
            description: 'Discord\'a modern bir alternatif olan Wobble, sade ve etkili topluluk iletişim platformudur. Gelişmiş mesajlaşma, ses/video arama ve sunucu yönetim özellikleri içerir.',
            technologies: ['Next.js', 'Go', 'PocketBase', 'WebRTC', 'Socket.io', 'PostgreSQL'],
            features: [
                'Gerçek zamanlı mesajlaşma',
                'Ses ve video arama',
                'Sunucu ve kanal yönetimi',
                'Dosya paylaşımı',
                'Bot entegrasyonu',
                'End-to-end şifreleme'
            ],
            image: '../assets/wobble-preview.png',
            externalUrl: './projects/wobble/',
            githubUrl: 'https://github.com/e500ky/wobble'
        },
        'film-platform': {
            title: 'Film Keşif Platformu',
            description: 'Yapay zeka destekli film, dizi ve oyuncu önerileri sunan keşif platformu. Kullanıcı tercihlerine göre kişiselleştirilmiş içerik önerileri ve detaylı analiz raporları.',
            technologies: ['Next.js', 'FastAPI', 'Python', 'Machine Learning', 'TMDB API', 'Redis'],
            features: [
                'AI destekli film önerileri',
                'Gelişmiş filtreleme sistemi',
                'Kullanıcı puanlama ve yorumları',
                'Watchlist ve takip sistemi',
                'Platform karşılaştırması',
                'Trend analizi raporları'
            ],
            image: '../assets/film-platform-preview.png',
            externalUrl: './projects/film-platform/',
            githubUrl: false
        }
    };

    let currentProjectId = null;

    // Sosyal medya widget toggle
    socialToggle.addEventListener('click', function() {
        socialToggle.classList.toggle('active');
        socialLinksFloat.classList.toggle('active');
    });

    // Dışarı tıklayınca sosyal medya widget'ını kapat
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.floating-social')) {
            socialToggle.classList.remove('active');
            socialLinksFloat.classList.remove('active');
        }
    });

    // Project modal functions
    function openModal(projectId) {
        const project = projectData[projectId];
        if (!project) return;

        currentProjectId = projectId;
        modalTitle.textContent = project.title;
        modalDesc.textContent = project.description;
        modalImg.src = project.image;
        modalImg.alt = project.title;

        modalTechList.innerHTML = '';
        project.technologies.forEach(tech => {
            const techTag = document.createElement('span');
            techTag.className = 'tech-tag';
            techTag.textContent = tech;
            modalTechList.appendChild(techTag);
        });

        modalFeaturesList.innerHTML = '';
        project.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            modalFeaturesList.appendChild(li);
        });

        projectModal.classList.add('active');
        body.style.overflow = 'hidden';

        if (currentProjectId && projectData[currentProjectId].githubUrl === false) {
            modalGithub.style.display = 'none';
        }
        else {
            modalGithub.style.display = 'inline-block';
        }
    }

    function closeModal() {
        projectModal.classList.remove('active');
        body.style.overflow = 'auto';
        currentProjectId = null;
    }

    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            const projectId = this.dataset.project;
            openModal(projectId);
        });
    });

    // Modal close events
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Modal external link
    modalExternal.addEventListener('click', function() {
        if (currentProjectId && projectData[currentProjectId]) {
            window.open(projectData[currentProjectId].externalUrl, '_blank');
        }
    });

    // Modal GitHub link
    modalGithub.addEventListener('click', function() {
        if (currentProjectId && projectData[currentProjectId]) {
            window.open(projectData[currentProjectId].githubUrl, '_blank');
        }
    });

    // ESC tuşu ile modal kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 't' && projectModal.classList.contains('active')) {
            window.open(projectData[currentProjectId].externalUrl, '_blank');
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === 'g' && projectModal.classList.contains('active')) {
            window.open(projectData[currentProjectId].githubUrl, '_blank');
        }
    });



    // Tema değiştirme
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('theme-dark');
        body.classList.toggle('theme-light');
        
        // LocalStorage'a tema tercihini kaydet
        const isDark = body.classList.contains('theme-dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Buton ikonunu güncelle
        updateThemeIcon();
    });

    // Tema ikonu güncelleme fonksiyonu
    function updateThemeIcon() {
        const isDark = body.classList.contains('theme-dark');
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }

    // Sayfa yüklendiğinde kayıtlı temayı uygula
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.remove('theme-dark', 'theme-light');
        body.classList.add(savedTheme === 'dark' ? 'theme-dark' : 'theme-light');
    }
    
    // İlk yüklemede ikonu güncelle
    updateThemeIcon();

    // Smooth scroll ve active class yönetimi
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const scrollTop = window.pageYOffset;

            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
});