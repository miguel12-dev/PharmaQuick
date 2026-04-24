const Layout = {
    sidebar: null,
    mainContent: null,
    sidebarToggle: null,
    isMobile: false,

    init() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('mainContent');
        this.sidebarToggle = document.getElementById('sidebarToggle');

        this.checkScreenSize();
        this.setupEventListeners();
        this.loadUserInfo();
        this.setupLogout();
        this.setCurrentDate();
    },

    checkScreenSize() {
        this.isMobile = window.innerWidth <= 768;
    },

    setupEventListeners() {
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.checkScreenSize();

            if (wasMobile !== this.isMobile) {
                if (!this.isMobile) {
                    this.closeSidebar();
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (this.isMobile && this.sidebar?.classList.contains('show')) {
                if (!this.sidebar.contains(e.target) && !this.sidebarToggle.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });
    },

    toggleSidebar() {
        if (this.isMobile) {
            this.sidebar.classList.toggle('show');
        } else {
            this.mainContent.classList.toggle('sidebar-open');
        }
    },

    closeSidebar() {
        if (this.isMobile) {
            this.sidebar.classList.remove('show');
        } else {
            this.mainContent.classList.remove('sidebar-open');
        }
    },

    loadUserInfo() {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');

        if (session.usuario) {
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = session.nombre || session.usuario;
            }
        }

        const farmaciaId = session.farmaciaId;
        if (farmaciaId) {
            const farmaciaInfoEl = document.getElementById('farmaciaInfo');
            if (farmaciaInfoEl) {
                farmaciaInfoEl.textContent = `Farmacia #${farmaciaId}`;
            }
        }
    },

    setCurrentDate() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            dateEl.textContent = now.toLocaleDateString('es-CO', options);
        }
    },

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                App.clearSession();
                window.location.href = '/login';
            });
        }
    },

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath || link.getAttribute('href') === currentPath.replace('/pages/', '')) {
                link.classList.add('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (App.requireAuth()) {
        Layout.init();
        Layout.setActiveNavLink();
    }
});