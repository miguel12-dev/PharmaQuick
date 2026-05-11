/**
 * PharmaQuick - Página de inicio (marketing / bienvenida)
 * Contenido alineado con DAET y arquitectura técnica del proyecto.
 */

const HomePage = {
    async init(container) {
        const loggedIn = typeof Router !== 'undefined' && Router.isAuthenticated();

        container.innerHTML = this.getHtml(loggedIn);

        this.runEntranceAnimations(container);

        // Cargar catálogo inicial (8 productos)
        this.loadCatalog(container);

        this.setupEventListeners(container, loggedIn);
    },

setupEventListeners(container, loggedIn) {
        // Botón principal (CTA)
        container.querySelector('[data-home-action="primary"]')?.addEventListener('click', () => {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            const isCliente = session.rol === 'CLIENTE';
            const dashboardRoute = isCliente ? '/cliente/catalogo' : '/dashboard';
            const buyRoute = isCliente ? '/cliente/catalogo' : '/ventas';

            if (loggedIn) {
                Router.navigate(dashboardRoute);
            } else {
                Router.navigate('/login');
            }
        });

        // Botón de comprar en productos
        container.querySelectorAll('.action-buy').forEach(buyBtn => {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            const isCliente = session.rol === 'CLIENTE';
            const buyRoute = isCliente ? '/cliente/catalogo' : '/ventas';

            if (buyBtn) {
                const id = buyBtn.dataset.id;
                if (loggedIn) {
                    Router.navigate(`${buyRoute}?producto=${id}`);
                } else {
                    const nextUrl = encodeURIComponent(`${buyRoute}?producto=${id}`);
                    Router.navigate(`/login?next=${nextUrl}`);
                }
            }
        });

        // Búsqueda en homepage
        const searchInput = container.querySelector('#homeSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                searchTimeout = setTimeout(() => {
                    this.loadCatalog(container, query);
                }, 400);
            });
        }
    },

    async loadCatalog(container, query = '') {
        const grid = container.querySelector('#homeProductsGrid');
        if (!grid) return;

        // Mostrar skeleton o loading si es necesario
        if (query) {
            grid.classList.add('opacity-50');
        }

        try {
            const products = await window.publicCatalogService.getCatalog(query, 8);
            grid.innerHTML = this.renderProductsList(products);
            grid.classList.remove('opacity-50');

            // Animaciones de entrada para las cards
            const cards = grid.querySelectorAll('.product-card-reveal');
            cards.forEach((card, i) => {
                setTimeout(() => {
                    card.classList.add('product-card-reveal--visible');
                }, i * 50);
            });
        } catch (error) {
            console.error('Error loading home catalog:', error);
            grid.innerHTML = '<div class="col-12 text-center text-danger">No se pudo cargar el catálogo.</div>';
        }
    },

    renderProductsList(products) {
        if (!products || products.length === 0) {
            return `
                <div class="col-12 text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-search display-4 text-muted mb-3 d-block"></i>
                        <h4 class="text-secondary">No encontramos lo que buscas</h4>
                        <p class="text-muted">Intenta con otros términos o explora el catálogo completo.</p>
                    </div>
                </div>`;
        }
        return products.map((p, i) => this.renderProductCard(p, i)).join('');
    },

    renderProductCard(product, index) {
        const defaultImage = '/image/logo_pharmaQuick.png';
        const image = product.imagen || defaultImage;
        const price = parseFloat(product.precio_activo || 0);
        const formatPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
        const hasStock = parseInt(product.stock_total || 0) > 0;

        return `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <article class="home-feature-card product-card-reveal card h-100 border-0" data-id="${product.id}">
                    ${!hasStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2 z-index-1">Agotado</span>' : ''}
                    <div class="product-img-wrapper">
                        <img src="${image}" class="product-img" alt="${product.nombre}" onerror="this.src='${defaultImage}'">
                    </div>
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="mb-1 text-muted small fw-semibold text-uppercase">${product.categoria || 'Medicamento'}</div>
                        <h3 class="h6 fw-bold mb-2 text-dark">${product.nombre}</h3>
                        <p class="small text-secondary mb-3">${product.presentacion || ''}</p>
                        <div class="mt-auto">
                            <div class="fs-5 fw-bold text-primary mb-3">${formatPrice}</div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-sm action-buy" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus me-1"></i> Comprar
                                </button>
                                <!-- [DESHABILITADO] Botón de Reservar - Deshabilitado por no utilizarse
                                <button class="btn btn-outline-primary btn-sm action-reserve" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="fas fa-calendar-check me-1"></i> Reservar
                                </button>
                                -->
                            </div>
                        </div>
                    </div>
                </article>
            </div>`;
    },

    runEntranceAnimations(container) {
        const reveals = container.querySelectorAll('.home-reveal');
        requestAnimationFrame(() => {
            reveals.forEach((el, i) => {
                const delay = Number(el.dataset.delay ?? i * 70);
                setTimeout(() => el.classList.add('home-reveal--visible'), delay);
            });
        });
    },

    getHtml(loggedIn) {
        // Determinar rol para textos correctos
        let isCliente = false;
        let dashboardRoute = '/dashboard';
        let primaryLabel = 'Iniciar sesión';
        
        if (loggedIn) {
            try {
                const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
                isCliente = session.rol === 'CLIENTE';
                dashboardRoute = isCliente ? '/cliente/catalogo' : '/dashboard';
                primaryLabel = isCliente ? 'Mi Cuenta' : 'Ir al panel';
            } catch (e) {
                primaryLabel = 'Ir al panel';
            }
        }
        
        const registerBtn = loggedIn ? '' : `<a href="/register" class="btn btn-outline-primary btn-lg px-4 ms-2 home-reveal" data-delay="260">Regístrate</a>`;
        return `
<div class="home-landing">
    ${SiteHeader.render({
            variant: 'marketing',
            loggedIn,
            headerExtraClass: 'home-reveal',
            revealDelay: 0
        })}

    <main>
        <section class="home-hero">
            <div class="home-hero-bg" aria-hidden="true"></div>
            <div class="home-hero-grid" aria-hidden="true"></div>
            <div class="container position-relative py-5 py-lg-6">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6">
                        <p class="home-eyebrow home-reveal text-uppercase fw-semibold small mb-3" data-delay="60">Operación farmacéutica integral</p>
                        <h1 class="home-title home-reveal display-5 fw-bold text-dark mb-3" data-delay="120">
                            Más que un CRM: inventario seguro, ventas y cumplimiento normativo
                        </h1>
                        <p class="home-lead home-reveal lead text-secondary mb-4" data-delay="180">
                            <strong>PharmaQuick</strong> apoya la gestión comercial y operativa de farmacias con foco en trazabilidad de lotes,
                            rotación <abbr title="First Expired, First Out" class="text-decoration-none">FEFO</abbr> y herramientas para el equipo y para tus clientes.
                        </p>
                        <div class="home-hero-actions home-reveal d-flex flex-wrap gap-3 mb-4" data-delay="240">
                            <button type="button" class="btn btn-primary btn-lg px-4 shadow-sm" data-home-action="primary">${primaryLabel}</button>
                            ${registerBtn}
                            <a href="/tienda" class="btn btn-outline-primary btn-lg px-4 ms-2 home-reveal" data-delay="280">Catálogo público</a>
                        </div>
                        <ul class="home-pills home-reveal list-unstyled d-flex flex-wrap gap-2 mb-0" data-delay="300">
                            <li><span class="home-pill">Inventario FEFO</span></li>
                            <li><span class="home-pill">POS</span></li>
                            <li><span class="home-pill">Reservas</span></li>
                            <li><span class="home-pill">Multi-farmacia</span></li>
                            <li><span class="home-pill">Excel masivo</span></li>
                        </ul>
                    </div>
                    <div class="col-lg-6 text-center text-lg-end">
                        <div class="home-hero-visual home-reveal mx-auto" data-delay="200">
                            <div class="home-hero-ring" aria-hidden="true"></div>
                            <img src="/image/logo_pharmaQuick.png" alt="" class="home-hero-img" role="presentation" loading="lazy" decoding="async">
                            <p class="small text-muted mt-3 mb-0 home-reveal" data-delay="380">Gestión pensada para farmacias y cadena regional</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="funciones" class="home-section home-section--features py-5 scroll-margin-top">
            <div class="container">
                <div class="row justify-content-center mb-5">
                    <div class="col-lg-8 text-center">
                        <h2 class="home-section-title home-reveal mb-3" data-delay="0">¿Qué resuelve PharmaQuick?</h2>
                        <p class="home-reveal text-secondary mb-0 home-lead-section" data-delay="80">
                            Combina funciones de <strong>CRM operativo</strong> con un núcleo de <strong>inventario por lotes</strong> y movimientos auditables,
                            tal como define la documentación técnica del proyecto.
                        </p>
                    </div>
                </div>
                <div class="row g-4">
                    ${this.featureCard({
            icon: 'fa-chart-line',
            title: 'Dashboard y CRM operativo',
            delay: 40,
            body: 'Resumen de alertas, ventas y actividad. Rutas para clientes, proveedores, perfil y configuración para coordinar el día a día del equipo.'
        })}
                    ${this.featureCard({
            icon: 'fa-boxes-stacked',
            title: 'Inventario con FEFO y semáforos',
            delay: 100,
            body: 'Prioriza lotes próximos a vencer en POS y reportes; alertas por criticidad de vencimiento y bloqueo parametrizable de lotes en ventana de riesgo.'
        })}
                    ${this.featureCard({
            icon: 'fa-cash-register',
            title: 'Punto de venta (POS)',
            delay: 160,
            body: 'Ventas conectadas al motor de lotes: sugiere FEFO, reduce errores en mostrador y mantiene coherencia con el kardex.'
        })}
                    ${this.featureCard({
            icon: 'fa-calendar-check',
            title: 'Reservas de medicamentos',
            delay: 220,
            body: 'Los clientes pueden apartar productos; el sistema administra estados y liberación de stock cuando corresponde.'
        })}
                    ${this.featureCard({
            icon: 'fa-file-excel',
            title: 'Carga masiva y reportes',
            delay: 280,
            body: 'Importación de catálogos con plantillas Excel y exportación de información para inventarios críticos y farmacovigilancia.'
        })}
                    ${this.featureCard({
            icon: 'fa-shield-halved',
            title: 'Arquitectura multi-tenant',
            delay: 340,
            body: 'Modelo por clústeres de bases de datos para aislar farmacias, escalar por región y mantener buen rendimiento.'
        })}
                </div>
            </div>
        </section>

        <section id="home-catalog" class="home-section py-5 bg-white">
            <div class="container">
                <div class="row mb-5 align-items-end">
                    <div class="col-md-7">
                        <h2 class="home-section-title home-reveal mb-2" data-delay="0">Catálogo de Venta</h2>
                        <p class="home-reveal text-secondary mb-0 home-lead-section" data-delay="60">
                            Encuentra lo que necesitas y resérvalo desde la comodidad de tu hogar.
                        </p>
                    </div>
                    <div class="col-md-5 mt-4 mt-md-0">
                        <div class="home-search-container home-reveal" data-delay="120">
                            <div class="input-group shadow-sm">
                                <span class="input-group-text border-0 bg-white ps-3"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" id="homeSearchInput" class="form-control border-0 py-2" placeholder="¿Qué medicamento buscas?">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="homeProductsGrid" class="row g-4 min-vh-25">
                    <!-- Los productos se cargarán aquí dinámicamente -->
                </div>
                
                <div class="text-center mt-5 home-reveal" data-delay="200">
                    <a href="/tienda" class="btn btn-outline-primary px-5 py-2 rounded-pill fw-semibold">
                        Ver catálogo completo <i class="fas fa-arrow-right ms-2"></i>
                    </a>
                </div>
            </div>
        </section>

        <section class="home-section home-section--muted py-5">
            <div class="container">
                <div class="home-compliance home-reveal card border-0 overflow-hidden" data-delay="0">
                    <div class="card-body p-4 p-lg-5">
                        <div class="row g-4 align-items-center">
                            <div class="col-lg-8">
                                <h3 class="h5 fw-bold mb-3"><i class="fas fa-scale-balanced text-primary me-2"></i>Cumplimiento y datos</h3>
                                <p class="text-secondary mb-3 mb-lg-0">
                                    El diseño prioriza la <strong>Resolución 1403 de 2007</strong> y la trazabilidad: lotes, fechas de vencimiento y movimientos centralizados.
                                    La visión del proyecto incluye auditoría, protección de datos personales (Ley 1581) y prácticas de seguridad en profundidad.
                                </p>
                            </div>
                            <div class="col-lg-4 text-lg-end">
                                <span class="home-badge d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill small fw-semibold">
                                    <i class="fas fa-lock"></i> Privacy by design
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="home-cta py-5">
            <div class="container">
                <div class="home-cta-panel home-reveal text-center" data-delay="0">
                <h2 class="home-cta-title mb-3">¿Listo para usar PharmaQuick?</h2>
                <p class="home-cta-lead text-secondary mb-4 mx-auto">
                    ${loggedIn
                ? 'Accede con tu cuenta para ver inventario y ventas en tiempo real.'
                : 'Regístrate como cliente y accede a compras de medicamentos de forma sencilla.'}
                </p>
                <button type="button" class="btn btn-primary btn-lg px-5 home-cta-btn" data-home-action="primary">${primaryLabel}</button>
                ${!loggedIn ? '<a href="/register" class="btn btn-outline-primary btn-lg px-5 ms-2">Regístrate gratis</a>' : ''}
                </div>
            </div>
        </section>
    </main>

    <footer class="home-footer py-4">
        <div class="container text-center small text-muted">
            &copy; ${new Date().getFullYear()} PharmaQuick · CRM y operación farmacéutica
        </div>
    </footer>
</div>`;
    },

    featureCard({ icon, title, body, delay }) {
        return `
        <div class="col-md-6 col-xl-4">
            <article class="home-feature-card home-reveal card h-100 border-0" data-delay="${delay}">
                <div class="card-body p-4 p-lg-4">
                    <div class="home-feature-icon-wrap mb-3">
                        <span class="home-feature-icon d-inline-flex align-items-center justify-content-center rounded-4">
                            <i class="fas ${icon}" aria-hidden="true"></i>
                        </span>
                    </div>
                    <h3 class="h6 fw-bold mb-2">${title}</h3>
                    <p class="small text-secondary mb-0">${body}</p>
                </div>
            </article>
        </div>`;
    }
};

window.HomePage = HomePage;
