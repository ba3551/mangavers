// Authentication System
class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Load users from localStorage (simulating JSON file storage)
    loadUsers() {
        try {
            const users = localStorage.getItem('mangaverse_users');
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('Error loading users:', error);
            return {};
        }
    }

    // Save users to localStorage
    saveUsers() {
        try {
            localStorage.setItem('mangaverse_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    // Load current user session
    loadCurrentUser() {
        try {
            const session = localStorage.getItem('mangaverse_session');
            if (session) {
                const sessionData = JSON.parse(session);
                // Check if session is still valid
                if (Date.now() - sessionData.timestamp < this.sessionTimeout) {
                    return sessionData.user;
                } else {
                    // Session expired
                    localStorage.removeItem('mangaverse_session');
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
        return null;
    }

    // Save current user session
    saveCurrentUser(user) {
        try {
            const sessionData = {
                user: user,
                timestamp: Date.now()
            };
            localStorage.setItem('mangaverse_session', JSON.stringify(sessionData));
            this.currentUser = user;
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Simple hash function (in production, use proper hashing like bcrypt)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        return password.length >= 6; // Minimum 6 characters
    }

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Register new user
    register(username, email, password) {
        // Sanitize inputs
        username = this.sanitizeInput(username.trim());
        email = this.sanitizeInput(email.trim().toLowerCase());
        
        // Validate inputs
        if (!username || username.length < 3) {
            throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        }
        
        if (!this.validateEmail(email)) {
            throw new Error('البريد الإلكتروني غير صحيح');
        }
        
        if (!this.validatePassword(password)) {
            throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        // Check if user already exists
        if (this.users[email]) {
            throw new Error('المستخدم موجود بالفعل');
        }

        // Check if username is taken
        for (const userEmail in this.users) {
            if (this.users[userEmail].username === username) {
                throw new Error('اسم المستخدم مستخدم بالفعل');
            }
        }

        // Create new user
        const hashedPassword = this.hashPassword(password);
        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            favorites: [],
            readingHistory: []
        };

        this.users[email] = newUser;
        this.saveUsers();

        return { username, email };
    }

    // Login user
    login(email, password) {
        email = this.sanitizeInput(email.trim().toLowerCase());
        
        if (!this.validateEmail(email)) {
            throw new Error('البريد الإلكتروني غير صحيح');
        }

        const user = this.users[email];
        if (!user) {
            throw new Error('المستخدم غير موجود');
        }

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            throw new Error('كلمة المرور غير صحيحة');
        }

        // Create session
        const sessionUser = {
            username: user.username,
            email: user.email,
            favorites: user.favorites,
            readingHistory: user.readingHistory
        };

        this.saveCurrentUser(sessionUser);
        return sessionUser;
    }

    // Logout user
    logout() {
        localStorage.removeItem('mangaverse_session');
        this.currentUser = null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Add manga to favorites
    addToFavorites(mangaSlug) {
        if (!this.isLoggedIn()) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        const user = this.users[this.currentUser.email];
        if (!user.favorites.includes(mangaSlug)) {
            user.favorites.push(mangaSlug);
            this.saveUsers();
            this.currentUser.favorites = user.favorites;
            this.saveCurrentUser(this.currentUser);
        }
    }

    // Remove manga from favorites
    removeFromFavorites(mangaSlug) {
        if (!this.isLoggedIn()) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        const user = this.users[this.currentUser.email];
        const index = user.favorites.indexOf(mangaSlug);
        if (index > -1) {
            user.favorites.splice(index, 1);
            this.saveUsers();
            this.currentUser.favorites = user.favorites;
            this.saveCurrentUser(this.currentUser);
        }
    }

    // Add to reading history
    addToHistory(mangaSlug, chapterNumber) {
        if (!this.isLoggedIn()) return;

        const user = this.users[this.currentUser.email];
        const historyItem = {
            mangaSlug: mangaSlug,
            chapterNumber: chapterNumber,
            timestamp: new Date().toISOString()
        };

        // Remove existing entry for this manga
        user.readingHistory = user.readingHistory.filter(item => item.mangaSlug !== mangaSlug);
        
        // Add new entry at the beginning
        user.readingHistory.unshift(historyItem);
        
        // Keep only last 50 items
        if (user.readingHistory.length > 50) {
            user.readingHistory = user.readingHistory.slice(0, 50);
        }

        this.saveUsers();
        this.currentUser.readingHistory = user.readingHistory;
        this.saveCurrentUser(this.currentUser);
    }
}

// Initialize authentication system
const authSystem = new AuthSystem();

// UI Management for Authentication
class AuthUI {
    constructor() {
        this.createAuthModals();
        this.updateUI();
    }

    createAuthModals() {
        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'loginModal';
        loginModal.className = 'auth-modal';
        loginModal.innerHTML = `
            <div class="auth-modal-content">
                <span class="auth-close" data-modal="loginModal">&times;</span>
                <h2>تسجيل الدخول</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">البريد الإلكتروني</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">كلمة المرور</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="auth-btn">تسجيل الدخول</button>
                </form>
                <p class="auth-switch">
                    ليس لديك حساب؟ <a href="#" id="showRegister">إنشاء حساب</a>
                </p>
            </div>
        `;

        // Create register modal
        const registerModal = document.createElement('div');
        registerModal.id = 'registerModal';
        registerModal.className = 'auth-modal';
        registerModal.innerHTML = `
            <div class="auth-modal-content">
                <span class="auth-close" data-modal="registerModal">&times;</span>
                <h2>إنشاء حساب جديد</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="registerUsername">اسم المستخدم</label>
                        <input type="text" id="registerUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">البريد الإلكتروني</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">كلمة المرور</label>
                        <input type="password" id="registerPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">تأكيد كلمة المرور</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <button type="submit" class="auth-btn">إنشاء حساب</button>
                </form>
                <p class="auth-switch">
                    لديك حساب بالفعل؟ <a href="#" id="showLogin">تسجيل الدخول</a>
                </p>
            </div>
        `;

        document.body.appendChild(loginModal);
        document.body.appendChild(registerModal);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Modal switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('loginModal');
            this.showModal('registerModal');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('registerModal');
            this.showModal('loginModal');
        });

        // Close modals
        document.querySelectorAll('.auth-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.dataset.modal);
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Login button in header
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (authSystem.isLoggedIn()) {
                    this.showUserMenu();
                } else {
                    this.showModal('loginModal');
                }
            });
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const user = authSystem.login(email, password);
            this.hideModal('loginModal');
            this.updateUI();
            this.showSuccess('تم تسجيل الدخول بنجاح');
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showError('كلمات المرور غير متطابقة');
            return;
        }

        try {
            authSystem.register(username, email, password);
            this.hideModal('registerModal');
            this.showSuccess('تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول');
            this.showModal('loginModal');
        } catch (error) {
            this.showError(error.message);
        }
    }

    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        if (!loginBtn) return;

        if (authSystem.isLoggedIn()) {
            const user = authSystem.getCurrentUser();
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.username}`;
            loginBtn.classList.add('logged-in');
        } else {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> تسجيل الدخول';
            loginBtn.classList.remove('logged-in');
        }
    }

    showUserMenu() {
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="user-menu-content">
                <a href="#" id="viewProfile">الملف الشخصي</a>
                <a href="#" id="viewFavorites">المفضلة</a>
                <a href="#" id="viewHistory">سجل القراءة</a>
                <a href="#" id="logoutBtn">تسجيل الخروج</a>
            </div>
        `;

        // Remove existing menu
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        document.body.appendChild(userMenu);

        // Position menu
        const loginBtn = document.querySelector('.login-btn');
        const rect = loginBtn.getBoundingClientRect();
        userMenu.style.position = 'fixed';
        userMenu.style.top = (rect.bottom + 5) + 'px';
        userMenu.style.right = rect.right + 'px';

        // Event listeners
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            authSystem.logout();
            this.updateUI();
            userMenu.remove();
            this.showSuccess('تم تسجيل الخروج بنجاح');
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!userMenu.contains(e.target) && !loginBtn.contains(e.target)) {
                    userMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize authentication UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthUI();
});

