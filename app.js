// Global variables
let mangaData = [];
let filteredManga = [];
let currentPage = 1;
const itemsPerPage = 12;
let currentGenre = 'all';
let currentMangaSlug = '';
let currentChapterData = null;
let currentChapterIndex = 0;

// Store current manga data for library operations
window.currentMangaData = null;
window.openMangaModal = openMangaModal; // Make it globally accessible

// DOM elements
const mangaGrid = document.getElementById('mangaGrid');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('mangaModal');
const closeModal = document.querySelector('.close');
const readMangaBtn = document.getElementById('readMangaBtn');
const chapterReader = document.getElementById('chapterReader');
const closeReader = document.getElementById('closeReader');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMangaData();
    setupEventListeners();
    initializeNavigation();
    initializeGenreCards();
    setupScrollToTop();
    setupHorizontalScroll();
    setupMobileMenu();
});

// Load manga data from JSON
async function loadMangaData() {
    try {
        const response = await fetch('mangavers.json');
        mangaData = await response.json();
        filteredManga = [...mangaData];
        
        // Initialize with discover tab content
        displayDiscoverContent();
        updateGenreCounts();
    } catch (error) {
        console.error('Error loading manga data:', error);
        showError('خطأ في تحميل البيانات');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Pagination - Fixed to start from page 1
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayManga();
                updatePagination();
                scrollToTop();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayManga();
                updatePagination();
                scrollToTop();
            }
        });
    }

    // Search functionality - Fixed debouncing
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Mobile search sync
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', debounce(() => {
            searchInput.value = mobileSearchInput.value;
            handleSearch();
        }, 300));
    }

    // Modal events
    if (closeModal) {
        closeModal.addEventListener('click', closeModalHandler);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    if (readMangaBtn) {
        readMangaBtn.addEventListener('click', openMangaReader);
    }

    // Chapter reader events
    if (closeReader) {
        closeReader.addEventListener('click', closeChapterReader);
    }
    
    const prevChapterBtn = document.getElementById('prevChapter');
    const nextChapterBtn = document.getElementById('nextChapter');
    const goToChapterBtn = document.getElementById('goToChapter');
    
    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', () => navigateChapter(-1));
    }
    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', () => navigateChapter(1));
    }
    if (goToChapterBtn) {
        goToChapterBtn.addEventListener('click', goToSpecificChapter);
    }

    // View all buttons functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-all-btn') || e.target.closest('.view-all-btn')) {
            const section = e.target.closest('.section');
            let sectionType = 'all';
            
            if (section.classList.contains('featured-section')) {
                sectionType = 'featured';
            } else if (section.classList.contains('trending-section')) {
                sectionType = 'trending';
            } else if (section.classList.contains('latest-section')) {
                sectionType = 'latest';
            }
            
            showAllMangaSection(sectionType);
        }
    });

    // Filter buttons event listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn')) {
            const filter = e.target.dataset.filter;
            
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            currentGenre = filter;
            filterManga();
        }
    });

    // Promo banner close
    const promoClose = document.querySelector('.promo-close');
    if (promoClose) {
        promoClose.addEventListener('click', function() {
            document.querySelector('.promo-banner').style.display = 'none';
        });
    }

    // Keyboard shortcuts for chapter reader
    document.addEventListener('keydown', (e) => {
        if (!chapterReader.classList.contains('hidden')) {
            switch(e.key) {
                case 'ArrowLeft':
                    navigateChapter(1);
                    break;
                case 'ArrowRight':
                    navigateChapter(-1);
                    break;
                case 'Escape':
                    closeChapterReader();
                    break;
            }
        }
    });
}

// Initialize navigation for new HTML structure
function initializeNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active states
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabType = this.dataset.tab;
            handleTabSwitch(tabType);
        });
    });
}

function handleTabSwitch(tabType) {
    const sections = document.querySelectorAll('.section');
    const allMangaSection = document.getElementById('allMangaSection');
    const userLibrary = document.getElementById('userLibrary');
    
    // Hide all sections first
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('hidden');
    });

    // Reset current page to 1 for all tab switches
    currentPage = 1;

    switch(tabType) {
        case 'discover':
            displayDiscoverContent();
            break;
        case 'genres':
            document.querySelector('.genres-section').style.display = 'block';
            document.querySelector('.genres-section').classList.remove('hidden');
            document.querySelector('.genres-section').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'trending':
            showTrendingSection();
            break;
        case 'latest':
            showLatestSection();
            break;
        case 'library':
            if (libraryManager) {
                libraryManager.showLibrarySection();
            }
            break;
    }
}

// Display discover content (home page)
function displayDiscoverContent() {
    // Show main sections
    document.querySelector('.hero-section').style.display = 'block';
    document.querySelector('.featured-section').style.display = 'block';
    document.querySelector('.featured-section').classList.remove('hidden');
    document.querySelector('.trending-section').style.display = 'block';
    document.querySelector('.trending-section').classList.remove('hidden');
    document.querySelector('.latest-section').style.display = 'block';
    document.querySelector('.latest-section').classList.remove('hidden');
    document.querySelector('.genres-section').style.display = 'block';
    document.querySelector('.genres-section').classList.remove('hidden');
    
    // Populate sections with manga data
    populateHomePageSections();
}

// Populate home page sections with manga data
function populateHomePageSections() {
    if (mangaData.length === 0) return;

    // Featured section - first 6 manga
    const featuredContainer = document.querySelector('.featured-section .manga-cards-container');
    if (featuredContainer) {
        featuredContainer.innerHTML = '';
        const featuredManga = mangaData.slice(0, 6);
        featuredManga.forEach(manga => {
            featuredContainer.appendChild(createMangaCard(manga));
        });
    }

    // Trending section - random selection
    const trendingContainer = document.querySelector('.trending-section .manga-cards-container');
    if (trendingContainer) {
        trendingContainer.innerHTML = '';
        const trendingManga = getRandomManga(mangaData, 6);
        trendingManga.forEach(manga => {
            trendingContainer.appendChild(createMangaCard(manga));
        });
    }

    // Latest section - last 6 manga (reversed)
    const latestContainer = document.querySelector('.latest-section .manga-cards-container');
    if (latestContainer) {
        latestContainer.innerHTML = '';
        const latestManga = [...mangaData].reverse().slice(0, 6);
        latestManga.forEach(manga => {
            latestContainer.appendChild(createMangaCard(manga));
        });
    }
}

// Show trending section with pagination
function showTrendingSection() {
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    allMangaSection.classList.remove('hidden');
    allMangaSection.style.display = 'block';
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = 'الأكثر شعبية';
    
    // Show random manga for trending
    filteredManga = getRandomManga(mangaData, 24);
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Show latest section with pagination
function showLatestSection() {
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    allMangaSection.classList.remove('hidden');
    allMangaSection.style.display = 'block';
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = 'آخر التحديثات';
    
    // Show latest manga (reversed order)
    filteredManga = [...mangaData].reverse();
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Show all manga section
function showAllMangaSection(type) {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('hidden');
    });
    
    allMangaSection.classList.remove('hidden');
    allMangaSection.style.display = 'block';
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    switch(type) {
        case 'featured':
            sectionTitle.textContent = 'المانجا المميزة';
            filteredManga = mangaData.slice(0, 20);
            break;
        case 'trending':
            sectionTitle.textContent = 'الأكثر شعبية';
            filteredManga = getRandomManga(mangaData, 24);
            break;
        case 'latest':
            sectionTitle.textContent = 'آخر التحديثات';
            filteredManga = [...mangaData].reverse();
            break;
        default:
            sectionTitle.textContent = 'جميع المانجا';
            filteredManga = [...mangaData];
    }
    
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Initialize genre cards
function initializeGenreCards() {
    const genreCards = document.querySelectorAll('.genre-card');
    genreCards.forEach(card => {
        card.addEventListener('click', function() {
            const genre = this.dataset.genre;
            filterByGenre(genre);
        });
    });
    
    // Mobile genre items
    const mobileGenreItems = document.querySelectorAll('.mobile-genre-item');
    mobileGenreItems.forEach(item => {
        item.addEventListener('click', function() {
            const genre = this.dataset.genre;
            filterByGenre(genre);
            // Close mobile menu
            if (window.mobileMenu) {
                window.mobileMenu.closeMenu();
            }
        });
    });
}

function updateGenreCounts() {
    if (mangaData.length === 0) return;

    const genreCards = document.querySelectorAll('.genre-card');
    genreCards.forEach(card => {
        const genre = card.dataset.genre;
        if (genre) {
            const count = mangaData.filter(manga => 
                manga.genres && manga.genres.includes(genre)
            ).length;
            
            const countElement = card.querySelector('.genre-count');
            if (countElement) {
                countElement.textContent = `${count} مانجا`;
            }
        }
    });
}

function filterByGenre(genre) {
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');
    
    // Hide other sections
    document.querySelectorAll('.section:not(.all-manga-section)').forEach(section => {
        section.style.display = 'none';
        section.classList.add('hidden');
    });
    
    allMangaSection.classList.remove('hidden');
    allMangaSection.style.display = 'block';
    allMangaSection.scrollIntoView({ behavior: 'smooth' });
    
    sectionTitle.textContent = `مانجا ${genre}`;
    filteredManga = mangaData.filter(manga => 
        manga.genres && manga.genres.includes(genre)
    );
    currentPage = 1;
    currentGenre = genre;
    
    displayManga();
    updatePagination();
    updateFilterButtons(genre);
}

// Update filter buttons to match selected genre
function updateFilterButtons(activeGenre) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === activeGenre) {
            btn.classList.add('active');
        }
    });
}

// Display manga cards - Fixed pagination issue
function displayManga() {
    if (!mangaGrid) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const mangaToShow = filteredManga.slice(startIndex, endIndex);

    mangaGrid.innerHTML = '';

    if (mangaToShow.length === 0) {
        mangaGrid.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
        return;
    }

    mangaToShow.forEach(manga => {
        const mangaCard = createMangaCard(manga);
        mangaGrid.appendChild(mangaCard);
    });
}

// Create manga card element
function createMangaCard(manga) {
    const card = document.createElement('div');
    card.className = 'manga-card';
    card.addEventListener('click', () => openMangaModal(manga));

    const totalChapters = extractChapterCount(manga.chapters);

    card.innerHTML = `
        <img src="${manga.image_url}" alt="${manga.title}" onerror="this.src='https://via.placeholder.com/250x300?text=صورة+غير+متوفرة'" loading="lazy">
        <div class="manga-card-content">
            <h3>${manga.title}</h3>
            <p class="manga-type">${manga.type}</p>
            <div class="chapters-info">
                <i class="fas fa-book"></i>
                <span>${totalChapters} فصل</span>
            </div>
        </div>
    `;

    return card;
}

// Extract chapter count from chapters array
function extractChapterCount(chapters) {
    if (!chapters || chapters.length === 0) return 0;
    
    const lastChapter = chapters[chapters.length - 1];
    if (lastChapter && lastChapter.url) {
        const match = lastChapter.url.match(/\/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    }
    
    return 0;
}

// Open manga modal
function openMangaModal(manga) {
    if (!modal) return;

    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalType = document.getElementById('modalType');
    const modalStatus = document.getElementById('modalStatus');
    const modalGenres = document.getElementById('modalGenres');
    const modalDescription = document.getElementById('modalDescription');
    const chaptersCount = document.getElementById('chaptersCount');

    modalImage.src = manga.image_url;
    modalImage.alt = manga.title;
    modalTitle.textContent = manga.title;
    modalType.textContent = manga.type;
    modalStatus.textContent = manga.status;
    modalDescription.textContent = manga.description;

    // Display genres
    modalGenres.innerHTML = '';
    if (manga.genres && manga.genres.length > 0) {
        manga.genres.forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.className = 'genre-tag';
            genreTag.textContent = genre;
            modalGenres.appendChild(genreTag);
        });
    }

    const totalChapters = extractChapterCount(manga.chapters);
    chaptersCount.textContent = `${totalChapters} فصل متاح`;

    currentMangaSlug = manga.slug;
    window.currentMangaData = manga;

    // Update library buttons
    if (libraryManager) {
        libraryManager.updateModalButtons(manga);
    }

    modal.style.display = 'block';
}

// Close modal
function closeModalHandler() {
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentMangaData = null;
}

// Open manga reader
async function openMangaReader() {
    try {
        const response = await fetch(`data/${currentMangaSlug}.json`);
        currentChapterData = await response.json();
        
        if (currentChapterData && currentChapterData.anime1) {
            currentChapterIndex = 0;
            displayChapter();
            chapterReader.classList.remove('hidden');
            closeModalHandler();
        } else {
            showError('لا توجد فصول متاحة لهذه المانجا');
        }
    } catch (error) {
        console.error('Error loading chapter data:', error);
        showError('خطأ في تحميل فصول المانجا');
    }
}

// Display chapter
function displayChapter() {
    if (!currentChapterData || !currentChapterData.anime1) return;

    const chapters = currentChapterData.anime1.chapters;
    if (!chapters || chapters.length === 0) return;

    const chapter = chapters[currentChapterIndex];
    const readerTitle = document.getElementById('readerTitle');
    const currentChapter = document.getElementById('currentChapter');
    const readerContent = document.getElementById('readerContent');

    readerTitle.textContent = currentChapterData.anime1.info.title;
    currentChapter.textContent = `الفصل ${chapter.chapter}`;

    // Display chapter images
    readerContent.innerHTML = '';
    if (chapter.images && chapter.images.length > 0) {
        chapter.images.forEach((imageUrl, index) => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `صفحة ${index + 1}`;
            img.className = 'chapter-image';
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/800x1200?text=صورة+غير+متوفرة';
            };
            readerContent.appendChild(img);
        });
    } else {
        readerContent.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">لا توجد صور متاحة لهذا الفصل</p>';
    }

    // Update navigation buttons
    const prevChapterBtn = document.getElementById('prevChapter');
    const nextChapterBtn = document.getElementById('nextChapter');
    
    if (prevChapterBtn) prevChapterBtn.disabled = currentChapterIndex === 0;
    if (nextChapterBtn) nextChapterBtn.disabled = currentChapterIndex === chapters.length - 1;

    // Scroll to top
    readerContent.scrollTop = 0;
}

// Navigate between chapters
function navigateChapter(direction) {
    if (!currentChapterData || !currentChapterData.anime1) return;

    const chapters = currentChapterData.anime1.chapters;
    const newIndex = currentChapterIndex + direction;

    if (newIndex >= 0 && newIndex < chapters.length) {
        currentChapterIndex = newIndex;
        displayChapter();
    }
}

// Go to specific chapter
function goToSpecificChapter() {
    const chapterSelect = document.getElementById('chapterSelect');
    const chapterNumber = parseInt(chapterSelect.value);

    if (!currentChapterData || !currentChapterData.anime1) return;

    const chapters = currentChapterData.anime1.chapters;
    const chapterIndex = chapters.findIndex(ch => parseInt(ch.chapter) === chapterNumber);

    if (chapterIndex !== -1) {
        currentChapterIndex = chapterIndex;
        displayChapter();
        chapterSelect.value = '';
    } else {
        showError('الفصل المطلوب غير موجود');
    }
}

// Close chapter reader
function closeChapterReader() {
    if (chapterReader) {
        chapterReader.classList.add('hidden');
    }
    currentChapterData = null;
    currentChapterIndex = 0;
}

// Handle search - Fixed to work properly
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Reset to discover view when search is cleared
        const discoverTab = document.querySelector('[data-tab="discover"]');
        if (discoverTab) {
            discoverTab.click();
        }
        return;
    }
    
    // Filter manga based on search term
    filteredManga = mangaData.filter(manga => 
        manga.title.toLowerCase().includes(searchTerm) ||
        manga.description.toLowerCase().includes(searchTerm) ||
        (manga.genres && manga.genres.some(genre => genre.toLowerCase().includes(searchTerm)))
    );

    showSearchResults(searchTerm);
}

// Show search results
function showSearchResults(searchTerm) {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.add('hidden');
    });
    
    allMangaSection.classList.remove('hidden');
    allMangaSection.style.display = 'block';
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = `نتائج البحث عن: "${searchTerm}"`;
    
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Filter manga by genre and search
function filterManga() {
    if (currentGenre === 'all') {
        filteredManga = [...mangaData];
    } else {
        filteredManga = mangaData.filter(manga => 
            manga.genres && manga.genres.includes(currentGenre)
        );
    }

    // Apply search filter if active
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm !== '') {
        filteredManga = filteredManga.filter(manga => 
            manga.title.toLowerCase().includes(searchTerm) ||
            manga.description.toLowerCase().includes(searchTerm) ||
            (manga.genres && manga.genres.some(genre => genre.toLowerCase().includes(searchTerm)))
        );
    }

    currentPage = 1;
    displayManga();
    updatePagination();
}

// Update pagination - Fixed to show correct page numbers
function updatePagination() {
    if (!prevBtn || !nextBtn || !pageInfo) return;

    const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    pageInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
}

// Get random manga selection
function getRandomManga(mangaArray, count) {
    const shuffled = [...mangaArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Setup scroll to top functionality
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (!scrollToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Scroll to top helper function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Horizontal scroll setup
function setupHorizontalScroll() {
    const scrollContainers = document.querySelectorAll('.horizontal-scroll');
    
    scrollContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

// Mobile Menu Management
function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideMenu = document.getElementById('mobileSideMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMenuBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');

    if (!hamburgerBtn || !sideMenu) return;

    // Hamburger button
    hamburgerBtn.addEventListener('click', () => {
        toggleMobileMenu();
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeMobileMenu();
        });
    }

    // Overlay click
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeMobileMenu();
        });
    }

    // Mobile navigation items
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            handleMobileNavigation(tab);
            closeMobileMenu();
        });
    });

    // Mobile login button
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            if (authSystem && authSystem.isLoggedIn()) {
                showMobileUserMenu();
            } else {
                document.getElementById('loginModal').style.display = 'block';
                closeMobileMenu();
            }
        });
    }

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sideMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    function toggleMobileMenu() {
        if (sideMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    function openMobileMenu() {
        sideMenu.classList.add('active');
        if (overlay) overlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        sideMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    function handleMobileNavigation(tab) {
        // Update active states
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const mobileNavItem = document.querySelector(`.mobile-nav-item[data-tab="${tab}"]`);
        if (mobileNavItem) {
            mobileNavItem.classList.add('active');
        }

        // Update desktop nav as well
        document.querySelectorAll('.nav-tab').forEach(item => {
            item.classList.remove('active');
        });
        const desktopNavItem = document.querySelector(`.desktop-nav [data-tab="${tab}"]`);
        if (desktopNavItem) {
            desktopNavItem.classList.add('active');
        }

        // Handle tab switch
        handleTabSwitch(tab);
    }

    function showMobileUserMenu() {
        if (!authSystem || !authSystem.isLoggedIn()) return;

        const user = authSystem.getCurrentUser();
        const userMenuHtml = `
            <div class="mobile-user-menu">
                <div class="mobile-user-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.username}</span>
                </div>
                <div class="mobile-user-actions">
                    <button class="mobile-user-action" onclick="authSystem.goToLibrary(); this.closest('.mobile-user-menu').remove();">
                        <i class="fas fa-bookmark"></i>
                        <span>مكتبتي</span>
                    </button>
                    <button class="mobile-user-action logout-action" onclick="authSystem.logout(); this.closest('.mobile-user-menu').remove();">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        `;

        // Remove existing menu
        const existingMenu = document.querySelector('.mobile-user-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Add new menu
        const menuContainer = document.createElement('div');
        menuContainer.innerHTML = userMenuHtml;
        document.body.appendChild(menuContainer.firstElementChild);

        closeMobileMenu();
    }

    // Store functions globally for access
    window.mobileMenu = {
        openMobileMenu,
        closeMobileMenu,
        toggleMobileMenu
    };
}

// Hide reader header on scroll (for better reading experience)
let lastScrollTop = 0;
document.addEventListener('DOMContentLoaded', () => {
    const readerContent = document.getElementById('readerContent');
    if (readerContent) {
        readerContent.addEventListener('scroll', function() {
            const scrollTop = this.scrollTop;
            const readerHeader = document.querySelector('.reader-header');
            const readerFooter = document.querySelector('.reader-footer');
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                if (readerHeader) readerHeader.style.transform = 'translateY(-100%)';
                if (readerFooter) readerFooter.style.transform = 'translateY(100%)';
            } else {
                // Scrolling up
                if (readerHeader) readerHeader.style.transform = 'translateY(0)';
                if (readerFooter) readerFooter.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        });
    }
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'white';
            header.style.backdropFilter = 'none';
        }
    }
});

