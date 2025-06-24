// Global variables
let mangaData = [];
let filteredManga = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentGenre = 'all';
let currentMangaSlug = '';
let currentChapterData = null;
let currentChapterIndex = 0;

// DOM elements
const mangaGrid = document.getElementById('mangaGrid');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const genreButtons = document.querySelectorAll('.genre-btn');
const modal = document.getElementById('mangaModal');
const closeModal = document.querySelector('.close');
const readMangaBtn = document.getElementById('readMangaBtn');
const chapterReader = document.getElementById('chapterReader');
const closeReader = document.getElementById('closeReader');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMangaData();
    setupEventListeners();
    initializeNavigation(); // Added this line
    initializeGenreCards(); // Added this line
});

// Load manga data from JSON
async function loadMangaData() {
    try {
        const response = await fetch('mangavers.json');
        mangaData = await response.json();
        filteredManga = [...mangaData];
        displayManga();
        updatePagination();
    } catch (error) {
        console.error('Error loading manga data:', error);
        showError('خطأ في تحميل البيانات');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Pagination
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayManga();
            updatePagination();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayManga();
            updatePagination();
        }
    });

    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Genre filtering (original genre buttons)
    genreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genreButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGenre = btn.dataset.genre;
            filterManga();
        });
    });

    // Modal events
    closeModal.addEventListener('click', closeModalHandler);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    readMangaBtn.addEventListener('click', openMangaReader);

    // Chapter reader events
    closeReader.addEventListener('click', closeChapterReader);
    document.getElementById('prevChapter').addEventListener('click', () => navigateChapter(-1));
    document.getElementById('nextChapter').addEventListener('click', () => navigateChapter(1));
    document.getElementById('goToChapter').addEventListener('click', goToSpecificChapter);

    // Smooth scrolling for navigation (for original nav-links)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // View all buttons functionality (for new HTML structure)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-all-btn')) {
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
            filteredManga = [...mangaData];
            currentPage = 1;
            displayManga();
        }
    });

    // Filter buttons event listeners (for new HTML structure)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn')) {
            const filter = e.target.dataset.filter;
            
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            if (filter === 'all') {
                filteredManga = [...mangaData];
            } else {
                filteredManga = mangaData.filter(manga => manga.genres && manga.genres.includes(filter));
            }
            
            currentPage = 1;
            displayManga();
        }
    });
}

// Initialize navigation for new HTML structure
function initializeNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const promoBanner = document.querySelector('.promo-banner');
    const promoClose = document.querySelector('.promo-close');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabType = this.dataset.tab;
            handleTabSwitch(tabType);
        });
    });
    
    if (promoClose) {
        promoClose.addEventListener('click', function() {
            promoBanner.style.display = 'none';
        });
    }
}

function handleTabSwitch(tabType) {
    const sections = document.querySelectorAll('.section');
    const allMangaSection = document.getElementById('allMangaSection');
    
    sections.forEach(section => section.style.display = 'none'); // Hide all sections first

    switch(tabType) {
        case 'discover':
            document.querySelector('.hero-section').style.display = 'block';
            document.querySelector('.featured-section').style.display = 'block';
            document.querySelector('.trending-section').style.display = 'block';
            document.querySelector('.latest-section').style.display = 'block';
            document.querySelector('.genres-section').style.display = 'block';
            allMangaSection.classList.add('hidden');
            break;
        case 'genres':
            document.querySelector('.genres-section').style.display = 'block';
            document.querySelector('.genres-section').scrollIntoView({ behavior: 'smooth' });
            allMangaSection.classList.add('hidden');
            break;
        case 'trending':
            showAllMangaSection('trending');
            break;
        case 'latest':
            showLatestUpdatesSection();
            break;
    }
}

// Show latest updates section with reverse pagination
function showLatestUpdatesSection() {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => section.style.display = 'none');
    allMangaSection.classList.remove('hidden');
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = 'آخر التحديثات';
    
    // Sort manga by latest (assuming we have a date field or use array order)
    // For now, we'll reverse the array to show latest first
    filteredManga = [...mangaData].reverse();
    
    currentPage = 1;
    displayLatestManga();
    updateLatestPagination();
}

// Display latest manga with special pagination (10 per page, descending)
function displayLatestManga() {
    const startIndex = (currentPage - 1) * 10; // 10 items per page for latest
    const endIndex = startIndex + 10;
    const mangaToShow = filteredManga.slice(startIndex, endIndex);

    const allMangaGrid = document.getElementById('mangaGrid');
    if (allMangaGrid) allMangaGrid.innerHTML = '';

    if (mangaToShow.length === 0) {
        if (allMangaGrid) allMangaGrid.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
        return;
    }

    mangaToShow.forEach(manga => {
        const mangaCard = createMangaCard(manga);
        if (allMangaGrid) allMangaGrid.appendChild(mangaCard);
    });
}

// Update pagination for latest updates
function updateLatestPagination() {
    const totalPages = Math.ceil(filteredManga.length / 10); // 10 items per page
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
    
    // Update button event listeners for latest section
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayLatestManga();
                updateLatestPagination();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayLatestManga();
                updateLatestPagination();
            }
        };
    }
}

// Show all manga section (for new HTML structure)
function showAllMangaSection(type) {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => section.style.display = 'none');
    allMangaSection.classList.remove('hidden');
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    if (type === 'trending') {
        showMostPopularSection();
    } else if (type === 'latest') {
        sectionTitle.textContent = 'آخر تحديثات المانجا';
        filteredManga = mangaData.filter(manga => manga.type === 'مانهوا'); // Example filter for latest
    } else if (type === 'search') {
        // Title set by search function
    } else {
        sectionTitle.textContent = 'جميع المانجا';
        filteredManga = [...mangaData];
    }
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Show most popular section with random manga selection
function showMostPopularSection() {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => section.style.display = 'none');
    allMangaSection.classList.remove('hidden');
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = 'الأكثر شعبية';
    
    // Get 10 random manga each time
    filteredManga = getRandomManga(mangaData, 10);
    
    currentPage = 1;
    displayManga();
    updatePopularPagination();
}

// Get random manga selection
function getRandomManga(mangaArray, count) {
    const shuffled = [...mangaArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Update pagination for popular section (no pagination needed for random 10)
function updatePopularPagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    // Hide pagination for popular section since we only show 10 random items
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (pageInfo) pageInfo.textContent = `عرض 10 مانجا عشوائية`;
    
    // Add refresh button for new random selection
    const paginationDiv = document.querySelector('.pagination');
    if (paginationDiv && !document.getElementById('refreshPopular')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshPopular';
        refreshBtn.className = 'pagination-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث القائمة';
        refreshBtn.onclick = () => {
            filteredManga = getRandomManga(mangaData, 10);
            displayManga();
        };
        paginationDiv.appendChild(refreshBtn);
    }
}

// Initialize genre cards for new HTML structure
function initializeGenreCards() {
    const genreCards = document.querySelectorAll('.genre-card');
    genreCards.forEach(card => {
        card.addEventListener('click', function() {
            const genre = this.dataset.genre;
            filterByGenre(genre);
        });
    });
    
    // Update genre counts dynamically
    updateGenreCounts();
}

function updateGenreCounts() {
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
    
    // Also update mobile genre items if they exist
    const mobileGenreItems = document.querySelectorAll('.mobile-genre-item');
    mobileGenreItems.forEach(item => {
        const genre = item.dataset.genre;
        if (genre) {
            const count = mangaData.filter(manga => 
                manga.genres && manga.genres.includes(genre)
            ).length;
            
            const countSpan = item.querySelector('.genre-count');
            if (countSpan) {
                countSpan.textContent = `${count}`;
            } else {
                // Add count if it doesn't exist
                const span = document.createElement('span');
                span.className = 'genre-count';
                span.textContent = `${count}`;
                span.style.fontSize = '0.8rem';
                span.style.color = '#666';
                item.appendChild(span);
            }
        }
    });
}

function filterByGenre(genre) {
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');
    
    sectionTitle.textContent = `مانجا ${genre}`;
    filteredManga = mangaData.filter(manga => 
        manga.genres && manga.genres.includes(genre)
    );
    currentPage = 1;
    currentGenre = genre;
    
    showAllMangaSection('genre');
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

// Display manga cards
function displayManga() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const mangaToShow = filteredManga.slice(startIndex, endIndex);

    // Clear existing content in all relevant containers
    const allMangaGrid = document.getElementById('mangaGrid');
    const featuredContainer = document.querySelector('.featured-section .manga-cards-container');
    const trendingContainer = document.querySelector('.trending-section .manga-cards-container');
    const latestContainer = document.querySelector('.latest-section .manga-cards-container');

    if (allMangaGrid) allMangaGrid.innerHTML = '';

    if (mangaToShow.length === 0) {
        if (allMangaGrid) allMangaGrid.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
        return;
    }

    mangaToShow.forEach(manga => {
        const mangaCard = createMangaCard(manga);
        if (allMangaGrid) allMangaGrid.appendChild(mangaCard);
    });

    // Only populate home sections if we're on the discover tab and sections are visible
    const discoverTab = document.querySelector('[data-tab="discover"]');
    const isDiscoverActive = discoverTab && discoverTab.classList.contains('active');
    
    if (isDiscoverActive) {
        // Populate featured section
        if (featuredContainer && document.querySelector(".featured-section").style.display !== "none") {
            const featuredManga = mangaData.slice(0, 4);
            featuredContainer.innerHTML = "";
            featuredManga.forEach((manga) => {
                featuredContainer.appendChild(createMangaCard(manga));
            });
        }
        
        // Populate trending section
        if (trendingContainer && document.querySelector(".trending-section").style.display !== "none") {
            const trendingManga = mangaData.filter(manga => manga.status === "مستمرة").slice(0, 4);
            trendingContainer.innerHTML = "";
            trendingManga.forEach((manga) => {
                trendingContainer.appendChild(createMangaCard(manga));
            });
        }
        
        // Populate latest section
        if (latestContainer && document.querySelector(".latest-section").style.display !== "none") {
            const latestManga = [...mangaData].reverse().slice(0, 4);
            latestContainer.innerHTML = "";
            latestManga.forEach((manga) => {
                latestContainer.appendChild(createMangaCard(manga));
            });
        }
    }
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
    
    // Get the last chapter and extract the number from its URL
    const lastChapter = chapters[chapters.length - 1];
    if (lastChapter && lastChapter.url) {
        // Extract the number from the end of the URL
        const match = lastChapter.url.match(/\/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    }
    
    return 0;
}

// Open manga modal
function openMangaModal(manga) {
    const modal = document.getElementById('mangaModal');
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
    modal.style.display = 'block';
}

// Close modal
function closeModalHandler() {
    modal.style.display = 'none';
}

// Open manga reader
async function openMangaReader() {
    try {
        const response = await fetch(`${currentMangaSlug}.json`);
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
    
    prevChapterBtn.disabled = currentChapterIndex === 0;
    nextChapterBtn.disabled = currentChapterIndex === chapters.length - 1;

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
    chapterReader.classList.add('hidden');
    currentChapterData = null;
    currentChapterIndex = 0;
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Reset to original view when search is cleared
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) {
            handleTabSwitch(activeTab.dataset.tab);
        }
        return;
    }
    
    // Filter manga based on search term
    filteredManga = mangaData.filter(manga => 
        manga.title.toLowerCase().includes(searchTerm) ||
        manga.description.toLowerCase().includes(searchTerm) ||
        (manga.genres && manga.genres.some(genre => genre.toLowerCase().includes(searchTerm)))
    );

    // Show search results in all manga section
    showSearchResults(searchTerm);
}

// Show search results
function showSearchResults(searchTerm) {
    const sections = document.querySelectorAll('.section:not(.all-manga-section)');
    const allMangaSection = document.getElementById('allMangaSection');
    const sectionTitle = document.getElementById('sectionTitle');

    sections.forEach(section => section.style.display = 'none');
    allMangaSection.classList.remove('hidden');
    allMangaSection.scrollIntoView({ behavior: 'smooth' });

    sectionTitle.textContent = `نتائج البحث عن: "${searchTerm}"`;
    
    currentPage = 1;
    displayManga();
    updatePagination();
}

// Filter manga by genre
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

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
    
    // Show pagination controls
    if (prevBtn) prevBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'inline-block';
    
    // Remove any refresh button from popular section
    const refreshBtn = document.getElementById('refreshPopular');
    if (refreshBtn) {
        refreshBtn.remove();
    }
    
    // Reset pagination button event listeners to default
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayManga();
                updatePagination();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayManga();
                updatePagination();
            }
        };
    }
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
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 9999;
        font-family: 'Cairo', sans-serif;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// Hide reader header on scroll (for better reading experience)
let lastScrollTop = 0;
document.getElementById('readerContent').addEventListener('scroll', function() {
    const scrollTop = this.scrollTop;
    const readerHeader = document.querySelector('.reader-header');
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        readerHeader.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        readerHeader.style.transform = 'translateY(0)';
    }
    lastScrollTop = scrollTop;
});

// Add loading animation
function showLoading() {
    mangaGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
            <p style="margin-top: 1rem; color: #666;">جاري التحميل...</p>
        </div>
    `;
}

// Add smooth scroll behavior for better UX
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

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
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
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

// Call setupHorizontalScroll on DOMContentLoaded
document.addEventListener('DOMContentLoaded', setupHorizontalScroll);



// Mobile Menu Management
class MobileMenu {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.sideMenu = document.getElementById('mobileSideMenu');
        this.overlay = document.getElementById('mobileMenuOverlay');
        this.closeBtn = document.getElementById('closeMenuBtn');
        this.mobileLoginBtn = document.getElementById('mobileLoginBtn');
        this.mobileSearchInput = document.getElementById('mobileSearchInput');
        
        this.setupEventListeners();
        this.syncWithAuth();
    }

    setupEventListeners() {
        // Hamburger button
        this.hamburgerBtn.addEventListener('click', () => {
            this.toggleMenu();
        });

        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.closeMenu();
        });

        // Overlay click
        this.overlay.addEventListener('click', () => {
            this.closeMenu();
        });

        // Mobile navigation items
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.handleNavigation(tab);
                this.closeMenu();
            });
        });

        // Mobile genre items
        document.querySelectorAll('.mobile-genre-item').forEach(item => {
            item.addEventListener('click', () => {
                const genre = item.dataset.genre;
                filterByGenre(genre);
                this.closeMenu();
            });
        });

        // Mobile login button
        this.mobileLoginBtn.addEventListener('click', () => {
            if (authSystem.isLoggedIn()) {
                this.showMobileUserMenu();
            } else {
                document.getElementById('loginModal').style.display = 'block';
                this.closeMenu();
            }
        });

        // Mobile search
        this.mobileSearchInput.addEventListener('input', debounce(() => {
            const searchTerm = this.mobileSearchInput.value;
            document.getElementById('searchInput').value = searchTerm;
            handleSearch();
        }, 300));

        // Sync search inputs
        document.getElementById('searchInput').addEventListener('input', () => {
            this.mobileSearchInput.value = document.getElementById('searchInput').value;
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sideMenu.classList.contains('active')) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.sideMenu.classList.contains('active')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.sideMenu.classList.add('active');
        this.overlay.classList.add('active');
        this.hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.sideMenu.classList.remove('active');
        this.overlay.classList.remove('active');
        this.hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleNavigation(tab) {
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

    showMobileUserMenu() {
        const user = authSystem.getCurrentUser();
        const userMenuHtml = `
            <div class="mobile-user-menu">
                <div class="mobile-user-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.username}</span>
                </div>
                <div class="mobile-user-actions">
                    <button class="mobile-user-action" onclick="this.closest('.mobile-user-menu').remove()">
                        <i class="fas fa-heart"></i>
                        <span>المفضلة</span>
                    </button>
                    <button class="mobile-user-action" onclick="this.closest('.mobile-user-menu').remove()">
                        <i class="fas fa-history"></i>
                        <span>سجل القراءة</span>
                    </button>
                    <button class="mobile-user-action logout-action" onclick="authSystem.logout(); mobileMenu.syncWithAuth(); this.closest('.mobile-user-menu').remove(); mobileMenu.closeMenu();">
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
        this.sideMenu.appendChild(menuContainer.firstElementChild);
    }

    syncWithAuth() {
        if (authSystem.isLoggedIn()) {
            const user = authSystem.getCurrentUser();
            this.mobileLoginBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>${user.username}</span>
            `;
            this.mobileLoginBtn.classList.add('logged-in');
        } else {
            this.mobileLoginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>تسجيل الدخول</span>
            `;
            this.mobileLoginBtn.classList.remove('logged-in');
        }
    }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenu = new MobileMenu();
});

// Update AuthUI to sync with mobile menu
const originalUpdateUI = AuthUI.prototype.updateUI;
AuthUI.prototype.updateUI = function() {
    originalUpdateUI.call(this);
    if (window.mobileMenu) {
        window.mobileMenu.syncWithAuth();
    }
};

