class PublicStorePage {
    static async init(container) {
        this.container = container;
        this.view = new PublicStoreView(container);
        this.service = window.publicCatalogService;
        this.currentQuery = new URLSearchParams(window.location.search).get('q') || '';
        
        // Setup View Callbacks
        this.view.onSearch = this.handleSearch.bind(this);
        this.view.onBuy = this.handleBuy.bind(this);
        this.view.onReserve = this.handleReserve.bind(this);
        
        // Load data
        await this.loadCatalog();
    }

    static async loadCatalog() {
        this.view.showLoading();
        try {
            const products = await this.service.getCatalog(this.currentQuery);
            this.view.render(products, this.currentQuery);
        } catch (error) {
            this.view.showError('No se pudo cargar el catálogo. Por favor, intenta de nuevo más tarde.');
        }
    }

    static handleSearch(query) {
        this.currentQuery = query;
        // Update URL
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
        
        this.loadCatalog();
    }

    static handleBuy(productId) {
        // Redirigir al login con return a ventas
        const nextUrl = encodeURIComponent(`/ventas?producto=${productId}`);
        window.Router.navigate(`/login?next=${nextUrl}`);
    }

    static handleReserve(productId) {
        // Redirigir al login con return a reservas
        const nextUrl = encodeURIComponent(`/reservas?producto=${productId}`);
        window.Router.navigate(`/login?next=${nextUrl}`);
    }
}

window.PublicStorePage = PublicStorePage;
