// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (this.isLoggedIn()) {
                    this.showUserMenu();
                } else {
                    this.showLoginModal();
                }
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.closeAuthModal(e.target.id);
            }
        });
    }

    loadUsers() {
        const users = localStorage.getItem('mangaverse_users');
        return users ? JSON.parse(users) : [];
    }

    saveUsers() {
        localStorage.setItem('mangaverse_users', JSON.stringify(this.users));
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUI();
            this.closeAuthModal('loginModal');
            this.showToast('تم تسجيل الدخول بنجاح!', 'success');
        } else {
            this.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        // Check if username already exists
        if (this.users.find(u => u.username === username)) {
            this.showToast('اسم المستخدم موجود بالفعل', 'error');
            return;
        }

        // Check if email already exists
        if (this.users.find(u => u.email === email)) {
            this.showToast('البريد الإلكتروني موجود بالفعل', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.updateUI();
        this.closeAuthModal('registerModal');
        this.showToast('تم إنشاء الحساب بنجاح!', 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showToast('تم تسجيل الخروج بنجاح', 'success');
        
        // Hide library tab if visible
        this.hideLibraryTab();
        
        // Redirect to discover tab if on library
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.dataset.tab === 'library') {
            document.querySelector('[data-tab="discover"]').click();
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        
        if (this.isLoggedIn()) {
            // Update desktop login button
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    ${this.currentUser.username}
                `;
                loginBtn.classList.add('logged-in');
            }

            // Update mobile login button
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <span>${this.currentUser.username}</span>
                `;
                mobileLoginBtn.classList.add('logged-in');
            }

            // Show library tab
            this.showLibraryTab();
        } else {
            // Reset desktop login button
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-user"></i>
                    تسجيل الدخول
                `;
                loginBtn.classList.remove('logged-in');
            }

            // Reset mobile login button
            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `
                    <i class="fas fa-user"></i>
                    <span>تسجيل الدخول</span>
                `;
                mobileLoginBtn.classList.remove('logged-in');
            }

            // Hide library tab
            this.hideLibraryTab();
        }
    }

    showLibraryTab() {
        const libraryTab = document.querySelector('[data-tab="library"]');
        const mobileLibraryNav = document.getElementById('mobileLibraryNav');
        
        if (libraryTab) {
            libraryTab.style.display = 'flex';
        }
        if (mobileLibraryNav) {
            mobileLibraryNav.style.display = 'block';
        }
    }

    hideLibraryTab() {
        const libraryTab = document.querySelector('[data-tab="library"]');
        const mobileLibraryNav = document.getElementById('mobileLibraryNav');
        
        if (libraryTab) {
            libraryTab.style.display = 'none';
        }
        if (mobileLibraryNav) {
            mobileLibraryNav.style.display = 'none';
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
    }

    showUserMenu() {
        // Create user menu
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.style.top = '60px';
        userMenu.style.right = '20px';
        
        userMenu.innerHTML = `
            <div class="user-menu-content">
                <a href="#" onclick="authSystem.goToLibrary()">
                    <i class="fas fa-bookmark"></i> مكتبتي
                </a>
                <a href="#" onclick="authSystem.logout(); document.querySelector('.user-menu').remove();">
                    <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                </a>
            </div>
        `;

        document.body.appendChild(userMenu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!userMenu.contains(e.target) && !document.getElementById('loginBtn').contains(e.target)) {
                    userMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    goToLibrary() {
        const libraryTab = document.querySelector('[data-tab="library"]');
        if (libraryTab) {
            libraryTab.click();
        }
        
        // Close user menu
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.remove();
        }
    }

    closeAuthModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showToast(message, type = 'success') {
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

// Global functions for modal switching
function switchToRegister() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'block';
}

function switchToLogin() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
}

function closeAuthModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize auth system
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});

