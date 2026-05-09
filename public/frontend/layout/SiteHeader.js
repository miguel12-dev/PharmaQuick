/**
 * PharmaQuick — Cabecera pública con logo (home, login, etc.)
 */

const SiteHeader = {
    logoSrc: '/image/logo_pharmaQuick.png',

    /**
     * @param {Object} [options]
     * @param {'marketing'|'auth'} [options.variant] marketing = CTA según sesión; auth = enlace inicio
     * @param {boolean} [options.loggedIn]
     * @param {string|null} [options.actionsHtml] HTML de la columna derecha (anula variant)
     * @param {string} [options.headerExtraClass] clases extra en <header> (ej. home-reveal)
     * @param {string|number} [options.revealDelay] data-delay para animaciones home
     */
    render(options = {}) {
        const {
            variant = 'marketing',
            loggedIn = false,
            actionsHtml = null,
            headerExtraClass = '',
            revealDelay
        } = options;

        let right = actionsHtml;
        if (right === null) {
            if (variant === 'auth') {
                right = '<a href="/" class="btn btn-outline-primary btn-sm px-3">Inicio</a>';
            } else {
                const navLinks = [];
                
                // Tienda (Siempre visible)
                navLinks.push('<a href="/tienda" class="pq-nav-link d-none d-sm-inline-block">Tienda</a>');
                
                if (loggedIn) {
                    // Ventas y Reservas (Solo logueado)
                    navLinks.push('<a href="/ventas" class="pq-nav-link">Ventas</a>');
                    navLinks.push('<a href="/reservas" class="pq-nav-link">Reservas</a>');
                }

                const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
                const userName = session.userName || session.email || 'Usuario';
                const isCliente = session.rol === 'CLIENTE';

                const authBtn = loggedIn
                    ? `
                    <div class="dropdown">
                        <button class="btn btn-primary btn-sm px-3 shadow-sm dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <i class="fas fa-user-circle"></i>
                            <span class="d-none d-md-inline">${userName}</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2">
                            ${!isCliente ? '<li><a class="dropdown-item py-2" href="/dashboard"><i class="fas fa-chart-line me-2 opacity-50"></i> Dashboard</a></li>' : ''}
                            ${isCliente ? '<li><a class="dropdown-item py-2" href="/cliente/perfil"><i class="fas fa-user-edit me-2 opacity-50"></i> Mi Perfil</a></li>' : '<li><a class="dropdown-item py-2" href="/perfil"><i class="fas fa-user-edit me-2 opacity-50"></i> Mi Perfil</a></li>'}
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" onclick="event.preventDefault(); window.Router.logout()"><i class="fas fa-power-off me-2 opacity-50"></i> Cerrar Sesión</a></li>
                        </ul>
                    </div>`
                    : `<a href="/login" class="btn btn-outline-primary btn-sm px-3">Acceder</a>
                       <a href="/register" class="btn btn-primary btn-sm px-3">Registrarse</a>`;

                right = `
                    <nav class="d-flex align-items-center gap-3 me-2">
                        ${navLinks.join('')}
                    </nav>
                    <div class="d-flex align-items-center gap-2 border-start ps-3 ms-2">
                        <a href="/tienda" class="btn btn-link text-secondary p-1 position-relative" title="Carrito de compras">
                            <i class="fas fa-shopping-cart fa-lg"></i>
                        </a>
                        ${authBtn}
                    </div>
                `;
            }
        }

        const delayAttr = revealDelay !== undefined && revealDelay !== null
            ? ` data-delay="${revealDelay}"`
            : '';

        const extra = headerExtraClass.trim();

        return `
<header class="pq-site-header ${extra}" role="banner"${delayAttr}>
    <div class="container pq-site-header__inner d-flex align-items-center justify-content-between py-3">
        <a href="/" class="pq-site-header__brand text-decoration-none d-inline-flex align-items-center">
            <span class="pq-site-header__logo-wrap">
                <img src="${this.logoSrc}" alt="PharmaQuick" class="pq-site-header__logo" loading="eager" decoding="async">
            </span>
        </a>
        <div class="pq-site-header__actions d-flex align-items-center gap-2">
            ${right}
        </div>
    </div>
</header>`;
    }
};

window.SiteHeader = SiteHeader;
