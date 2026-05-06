/**
 * PharmaQuick - Página de inicio (marketing / bienvenida)
 * Contenido alineado con DAET y arquitectura técnica del proyecto.
 */

const HomePage = {
    async init(container) {
        const loggedIn = typeof Router !== 'undefined' && Router.isAuthenticated();

        container.innerHTML = this.getHtml(loggedIn);

        this.runEntranceAnimations(container);

        container.querySelectorAll('[data-home-action="primary"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.navigate(loggedIn ? '/dashboard' : '/login');
            });
        });
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
        const primaryLabel = loggedIn ? 'Ir al panel' : 'Iniciar sesión';
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
<a href="/tienda" class="btn btn-outline-primary btn-lg px-4 ms-2 home-reveal" data-delay="280">Catálogo público</a>
                            <a href="#funciones" class="btn btn-outline-primary btn-lg px-4 home-reveal home-btn-secondary" data-delay="280">Ver funciones</a>
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
                    Accede con tu cuenta de farmacia para ver inventario, ventas y reservas en tiempo real.
                </p>
                <button type="button" class="btn btn-primary btn-lg px-5 home-cta-btn" data-home-action="primary">${primaryLabel}</button>
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
