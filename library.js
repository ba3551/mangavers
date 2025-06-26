// Library Management System
class LibraryManager {
    constructor() {
        this.favorites = this.loadFavorites();
        this.readLater = this.loadReadLater();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Library tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('library-tab')) {
                this.switchLibraryTab(e.target.dataset.library);
            }
        });

        // Add to favorites button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addToFavoritesBtn' || e.target.closest('#addToFavoritesBtn')) {
                this.toggleFavorite();
            }
        });

        // Add to read later button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addToReadLaterBtn' || e.target.closest('#addToReadLaterBtn')) {
                this.toggleReadLater();
            }
        });
    }

    loadFavorites() {
        const favorites = localStorage.getItem('mangaverse_favorites');
        return favorites ? JSON.parse(favorites) : {};
    }

    loadReadLater() {
        const readLater = localStorage.getItem('mangaverse_readLater');
        return readLater ? JSON.parse(readLater) : {};
    }

    saveFavorites() {
        localStorage.setItem('mangaverse_favorites', JSON.stringify(this.favorites));
    }

    saveReadLater() {
        localStorage.setItem('mangaverse_readLater', JSON.stringify(this.readLater));
    }

    getUserKey() {
        if (!authSystem.isLoggedIn()) {
            return null;
        }
        return authSystem.getCurrentUser().id.toString();
    }

    getUserFavorites() {
        const userKey = this.getUserKey();
        if (!userKey) return [];
        return this.favorites[userKey] || [];
    }

    getUserReadLater() {
        const userKey = this.getUserKey();
        if (!userKey) return [];
        return this.readLater[userKey] || [];
    }

    addToFavorites(manga) {
        const userKey = this.getUserKey();
        if (!userKey) {
            authSystem.showToast('يجب تسجيل الدخول أولاً', 'error');
            return false;
        }

        if (!this.favorites[userKey]) {
            this.favorites[userKey] = [];
        }

        // Check if already in favorites
        const exists = this.favorites[userKey].find(m => m.slug === manga.slug);
        if (exists) {
            return false;
        }

        // Add manga with timestamp
        const favoriteItem = {
            ...manga,
            addedAt: new Date().toISOString()
        };

        this.favorites[userKey].push(favoriteItem);
        this.saveFavorites();
        return true;
    }

    removeFromFavorites(mangaSlug) {
        const userKey = this.getUserKey();
        if (!userKey) return false;

        if (!this.favorites[userKey]) return false;

        const index = this.favorites[userKey].findIndex(m => m.slug === mangaSlug);
        if (index !== -1) {
            this.favorites[userKey].splice(index, 1);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    addToReadLater(manga) {
        const userKey = this.getUserKey();
        if (!userKey) {
            authSystem.showToast('يجب تسجيل الدخول أولاً', 'error');
            return false;
        }

        if (!this.readLater[userKey]) {
            this.readLater[userKey] = [];
        }

        // Check if already in read later
        const exists = this.readLater[userKey].find(m => m.slug === manga.slug);
        if (exists) {
            return false;
        }

        // Add manga with timestamp
        const readLaterItem = {
            ...manga,
            addedAt: new Date().toISOString()
        };

        this.readLater[userKey].push(readLaterItem);
        this.saveReadLater();
        return true;
    }

    removeFromReadLater(mangaSlug) {
        const userKey = this.getUserKey();
        if (!userKey) return false;

        if (!this.readLater[userKey]) return false;

        const index = this.readLater[userKey].findIndex(m => m.slug === mangaSlug);
        if (index !== -1) {
            this.readLater[userKey].splice(index, 1);
            this.saveReadLater();
            return true;
        }
        return false;
    }

    isInFavorites(mangaSlug) {
        const userFavorites = this.getUserFavorites();
        return userFavorites.some(m => m.slug === mangaSlug);
    }

    isInReadLater(mangaSlug) {
        const userReadLater = this.getUserReadLater();
        return userReadLater.some(m => m.slug === mangaSlug);
    }

    toggleFavorite() {
        if (!authSystem.isLoggedIn()) {
            authSystem.showToast('يجب تسجيل الدخول أولاً', 'error');
            authSystem.showLoginModal();
            return;
        }

        const currentManga = window.currentMangaData;
        if (!currentManga) return;

        const btn = document.getElementById('addToFavoritesBtn');
        const icon = btn.querySelector('i');
        
        if (this.isInFavorites(currentManga.slug)) {
            // Remove from favorites
            if (this.removeFromFavorites(currentManga.slug)) {
                btn.classList.remove('active');
                icon.className = 'fas fa-heart';
                authSystem.showToast('تم إزالة المانجا من المفضلة', 'success');
                
                // Refresh favorites view if currently viewing
                if (document.getElementById('favoritesContent').classList.contains('active')) {
                    this.displayFavorites();
                }
            }
        } else {
            // Add to favorites
            if (this.addToFavorites(currentManga)) {
                btn.classList.add('active');
                icon.className = 'fas fa-heart';
                authSystem.showToast('تم إضافة المانجا للمفضلة', 'success');
            }
        }
    }

    toggleReadLater() {
        if (!authSystem.isLoggedIn()) {
            authSystem.showToast('يجب تسجيل الدخول أولاً', 'error');
            authSystem.showLoginModal();
            return;
        }

        const currentManga = window.currentMangaData;
        if (!currentManga) return;

        const btn = document.getElementById('addToReadLaterBtn');
        const icon = btn.querySelector('i');
        
        if (this.isInReadLater(currentManga.slug)) {
            // Remove from read later
            if (this.removeFromReadLater(currentManga.slug)) {
                btn.classList.remove('active');
                icon.className = 'fas fa-clock';
                authSystem.showToast('تم إزالة المانجا من قائمة القراءة لاحقاً', 'success');
                
                // Refresh read later view if currently viewing
                if (document.getElementById('readLaterContent').classList.contains('active')) {
                    this.displayReadLater();
                }
            }
        } else {
            // Add to read later
            if (this.addToReadLater(currentManga)) {
                btn.classList.add('active');
                icon.className = 'fas fa-clock';
                authSystem.showToast('تم إضافة المانجا لقائمة القراءة لاحقاً', 'success');
            }
        }
    }

    updateModalButtons(manga) {
        const favBtn = document.getElementById('addToFavoritesBtn');
        const readLaterBtn = document.getElementById('addToReadLaterBtn');
        
        if (!authSystem.isLoggedIn()) {
            favBtn.style.display = 'none';
            readLaterBtn.style.display = 'none';
            return;
        }

        favBtn.style.display = 'flex';
        readLaterBtn.style.display = 'flex';

        // Update favorites button
        if (this.isInFavorites(manga.slug)) {
            favBtn.classList.add('active');
            favBtn.querySelector('i').className = 'fas fa-heart';
            favBtn.innerHTML = '<i class="fas fa-heart"></i> إزالة من المفضلة';
        } else {
            favBtn.classList.remove('active');
            favBtn.querySelector('i').className = 'far fa-heart';
            favBtn.innerHTML = '<i class="far fa-heart"></i> إضافة للمفضلة';
        }

        // Update read later button
        if (this.isInReadLater(manga.slug)) {
            readLaterBtn.classList.add('active');
            readLaterBtn.querySelector('i').className = 'fas fa-clock';
            readLaterBtn.innerHTML = '<i class="fas fa-clock"></i> إزالة من القراءة لاحقاً';
        } else {
            readLaterBtn.classList.remove('active');
            readLaterBtn.querySelector('i').className = 'far fa-clock';
            readLaterBtn.innerHTML = '<i class="far fa-clock"></i> قراءة لاحقاً';
        }
    }

    switchLibraryTab(tabType) {
        // Update tab buttons
        document.querySelectorAll('.library-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-library="${tabType}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.library-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabType === 'favorites') {
            document.getElementById('favoritesContent').classList.add('active');
            this.displayFavorites();
        } else if (tabType === 'readLater') {
            document.getElementById('readLaterContent').classList.add('active');
            this.displayReadLater();
        }
    }

    displayFavorites() {
        const grid = document.getElementById('favoritesGrid');
        const favorites = this.getUserFavorites();

        if (favorites.length === 0) {
            grid.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-heart"></i>
                    <h3>لا توجد مانجا في المفضلة</h3>
                    <p>ابدأ بإضافة المانجا المفضلة لديك</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        favorites.reverse().forEach(manga => {
            const card = this.createLibraryCard(manga, 'favorites');
            grid.appendChild(card);
        });
    }

    displayReadLater() {
        const grid = document.getElementById('readLaterGrid');
        const readLater = this.getUserReadLater();

        if (readLater.length === 0) {
            grid.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-clock"></i>
                    <h3>لا توجد مانجا في قائمة القراءة لاحقاً</h3>
                    <p>أضف المانجا التي تريد قراءتها لاحقاً</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        readLater.reverse().forEach(manga => {
            const card = this.createLibraryCard(manga, 'readLater');
            grid.appendChild(card);
        });
    }

    createLibraryCard(manga, type) {
        const card = document.createElement('div');
        card.className = 'manga-card';
        
        const totalChapters = this.extractChapterCount(manga.chapters);
        
        card.innerHTML = `
            <img src="${manga.image_url}" alt="${manga.title}" onerror="this.src='https://via.placeholder.com/250x300?text=صورة+غير+متوفرة'" loading="lazy">
            <div class="manga-card-content">
                <h3>${manga.title}</h3>
                <p class="manga-type">${manga.type}</p>
                <div class="chapters-info">
                    <i class="fas fa-book"></i>
                    <span>${totalChapters} فصل</span>
                </div>
                <div class="library-actions">
                    <button class="remove-btn" onclick="libraryManager.removeFromLibrary('${manga.slug}', '${type}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Add click event to open modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-btn')) {
                window.openMangaModal(manga);
            }
        });

        return card;
    }

    removeFromLibrary(mangaSlug, type) {
        let removed = false;
        let message = '';

        if (type === 'favorites') {
            removed = this.removeFromFavorites(mangaSlug);
            message = 'تم إزالة المانجا من المفضلة';
        } else if (type === 'readLater') {
            removed = this.removeFromReadLater(mangaSlug);
            message = 'تم إزالة المانجا من قائمة القراءة لاحقاً';
        }

        if (removed) {
            authSystem.showToast(message, 'success');
            
            // Refresh the current view
            if (type === 'favorites' && document.getElementById('favoritesContent').classList.contains('active')) {
                this.displayFavorites();
            } else if (type === 'readLater' && document.getElementById('readLaterContent').classList.contains('active')) {
                this.displayReadLater();
            }
        }
    }

    extractChapterCount(chapters) {
        if (!chapters || chapters.length === 0) return 0;
        
        const lastChapter = chapters[chapters.length - 1];
        if (lastChapter && lastChapter.url) {
            const match = lastChapter.url.match(/\/(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        }
        
        return 0;
    }

    showLibrarySection() {
        if (!authSystem.isLoggedIn()) {
            authSystem.showToast('يجب تسجيل الدخول أولاً', 'error');
            authSystem.showLoginModal();
            return;
        }

        // Hide all other sections
        document.querySelectorAll('.section:not(.user-library-section)').forEach(section => {
            section.style.display = 'none';
        });

        // Show library section
        const librarySection = document.getElementById('userLibrary');
        librarySection.classList.remove('hidden');
        librarySection.style.display = 'block';
        librarySection.scrollIntoView({ behavior: 'smooth' });

        // Display favorites by default
        this.switchLibraryTab('favorites');
    }
}

// Initialize library manager
let libraryManager;
document.addEventListener('DOMContentLoaded', () => {
    libraryManager = new LibraryManager();
});

