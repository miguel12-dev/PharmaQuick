class SalesPage {
    static async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        const layoutTemplate = document.getElementById('template-layout');
        if (layoutTemplate) {
            container.innerHTML = '';
            container.appendChild(layoutTemplate.content.cloneNode(true));
        }

        const template = document.getElementById('template-ventas');
        if (!template) {
            console.error('Template template-ventas no encontrado');
            return;
        }
        
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = '';
            pageContent.appendChild(template.content.cloneNode(true));
        } else {
            container.innerHTML = '';
            container.appendChild(template.content.cloneNode(true));
        }
        
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Punto de Venta (POS)';
        
        this.initSidebarToggle(container);

        const controller = new SalesController();
        controller.init();
    }

    static initSidebarToggle(container) {
        const sidebar = container.querySelector('#sidebar');
        const collapseBtn = container.querySelector('#sidebarCollapseBtn');
        const mobileBtn = container.querySelector('#sidebarToggleMobile');

        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && sidebar && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            const icon = sidebar.querySelector('.sidebar-toggle-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        } else if (!isCollapsed) {
            document.body.classList.remove('sidebar-collapsed');
        }

        if (collapseBtn && sidebar) {
            collapseBtn.addEventListener('click', (event) => {
                event.preventDefault();
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

        if (mobileBtn && sidebar) {
            mobileBtn.addEventListener('click', (event) => {
                event.preventDefault();
                sidebar.classList.toggle('show');
            });
        }

        if (typeof AuthService !== 'undefined') {
            const userNameEls = container.querySelectorAll('#userName');
            const displayName = AuthService.getUserName() || 'Admin';
            userNameEls.forEach(el => el.textContent = displayName);
        }

        const logoutBtns = container.querySelectorAll('#logoutBtn, #logoutBtnDropdown');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const confirmed = await Confirm('¿Estás seguro que deseas cerrar sesión?');
                if (confirmed) {
                    localStorage.removeItem('pharmaSession');
                    window.location.href = '/login';
                }
            });
        });

        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && (href === '/ventas' || href.includes('ventas'))) {
                link.classList.add('active');
            }
        });
    }
}
window.SalesPage = SalesPage;
