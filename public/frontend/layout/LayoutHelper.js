class LayoutHelper {
    /**
     * Renderiza el layout base y lo inicializa según el rol del usuario
     */
    static render(container, activePage = '') {
        const template = document.getElementById('template-layout');
        if (!template) return;

        container.innerHTML = '';
        container.appendChild(template.content.cloneNode(true));

        this.applyRoleRestrictions(container);
        this.initSidebar(container);
        this.loadUserInfo(container);
        this.setActiveLink(container, activePage);
    }

    /**
     * Oculta módulos no permitidos según el rol
     */
    static applyRoleRestrictions(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        const rol = session.rol || 'USUARIO';

        if (rol === 'CLIENTE') {
            // Módulos administrativos a ocultar
            const adminPages = ['dashboard', 'productos', 'inventario', 'proveedores', 'configuracion', 'clientes'];
            
            container.querySelectorAll('.sidebar .nav-link').forEach(link => {
                const page = link.dataset.page;
                if (adminPages.includes(page)) {
                    link.style.display = 'none';
                }
            });

            // Si es cliente, el dashboard no es la página de inicio ideal
            // Pero si está en dashboard, quizás mostrar algo amigable
        }
    }

    static initSidebar(container) {
        const sidebar = container.querySelector('#sidebar');
        const collapseBtn = container.querySelector('#sidebarCollapseBtn');
        const mobileBtn = container.querySelector('#sidebarToggleMobile');

        if (!sidebar) return;

        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            const icon = sidebar.querySelector('.sidebar-toggle-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        }

        if (collapseBtn) {
            collapseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('collapsed');
                const nowCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', nowCollapsed);
                document.body.classList.toggle('sidebar-collapsed', nowCollapsed);
                
                const icon = sidebar.querySelector('.sidebar-toggle-icon');
                if (icon) {
                    icon.classList.toggle('fa-chevron-right', nowCollapsed);
                    icon.classList.toggle('fa-chevron-left', !nowCollapsed);
                }
            });
        }

        if (mobileBtn) {
            mobileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('show');
            });
        }

        // Logout
        const logoutHandler = async (e) => {
            e.preventDefault();
            const confirmed = confirm('¿Estás seguro que deseas cerrar sesión?');
            if (confirmed) {
                window.Router.logout();
            }
        };

        container.querySelectorAll('#logoutBtn, #logoutBtnDropdown').forEach(btn => {
            btn.addEventListener('click', logoutHandler);
        });
    }

    static loadUserInfo(container) {
        const userNameEls = container.querySelectorAll('#userName');
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        const displayName = session.userName || session.email || 'Admin';
        
        userNameEls.forEach(el => el.textContent = displayName);
    }

    static setActiveLink(container, page) {
        container.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
    }
}

window.LayoutHelper = LayoutHelper;
