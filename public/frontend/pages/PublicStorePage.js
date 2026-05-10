class PublicStorePage {
    static async init(container) {
        this.container = container;
        this.view = new PublicStoreView(container);
        this.service = window.publicCatalogService;
        this.currentQuery = new URLSearchParams(window.location.search).get('q') || '';
        
        // Setup View Callbacks
        this.view.onSearch = this.handleSearch.bind(this);
        this.view.onBuy = this.handleBuy.bind(this);
        
        // Load data
        await this.loadCatalog();
    }

    static async loadCatalog(isPartial = false) {
        if (isPartial) {
            this.view.showGridLoading();
        } else {
            this.view.showLoading();
        }

        try {
            const products = await this.service.getCatalog(this.currentQuery);
            const loggedIn = window.Router ? window.Router.isAuthenticated() : false;
            this.view.render(products, this.currentQuery, loggedIn);
            
            // Trigger animations
            this.runEntranceAnimations();
        } catch (error) {
            console.error('PublicStorePage Error:', error);
            this.view.showError('No se pudo cargar el catálogo. Por favor, intenta de nuevo más tarde.');
        }
    }

    static runEntranceAnimations() {
        const reveals = this.container.querySelectorAll('.store-reveal');
        requestAnimationFrame(() => {
            reveals.forEach((el, i) => {
                const delay = Number(el.dataset.delay ?? i * 15);
                setTimeout(() => el.classList.add('store-reveal--visible'), delay);
            });
        });

        // Grid cards
        const grid = document.getElementById('publicProductsGrid');
        if (grid) {
            const cards = grid.querySelectorAll('.product-card-reveal');
            cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('product-card-reveal--visible'), i * 15 + 50);
            });
        }
    }

    static handleSearch(query, isLive = false) {
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.currentQuery = query;

        // If it's a live search, debounce
        if (isLive) {
            this.searchTimeout = setTimeout(() => {
                this.executeSearch(query);
            }, 300);
        } else {
            this.executeSearch(query);
        }
    }

    static executeSearch(query) {
        // Update URL without full reload
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
        
        this.loadCatalog(true); // Partial load
    }

    static handleBuy(productId) {
        // Redirigir al login con return a ventas
        const nextUrl = encodeURIComponent(`/ventas?producto=${productId}`);
        window.Router.navigate(`/login?next=${nextUrl}`);
    }

    
}

window.PublicStorePage = PublicStorePage;
