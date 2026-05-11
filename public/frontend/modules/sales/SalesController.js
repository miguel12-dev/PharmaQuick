class SalesController {
    constructor() {
        this.cart = [];
        this.html5QrcodeScanner = null;
        this.searchTimeout = null;
    }

    async loadInitialProducts() {
        try {
            const response = await SalesService.getPOSProductos();
            // Soporta { success: true, data: { productos: [] } } o { success: true, data: [] }
            const products = response.data?.productos || (Array.isArray(response.data) ? response.data : []);
            this.initialProducts = products;
            
            if (response.success && products.length > 0) {
                SalesView.renderInitialProducts(products, (product) => this.addToCart(product));
            }
        } catch (error) {
            console.error('Error cargando productos iniciales:', error);
        }
    }

    async init() {
        SalesView.bindSearchInput(this.handleSearch.bind(this));
        SalesView.bindCompleteSale(this.handleCompleteSale.bind(this));
        await this.loadInitialProducts();
        
        // Hide search results if clicked outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#posSearchResults') && e.target.id !== 'posSearchProduct') {
                const results = document.getElementById('posSearchResults');
                if (results) {
                    results.style.display = 'none';
                }
            }
        });

        // Barcode scanner integration
        const btnScan = document.getElementById('btnScanBarcode');
        if (btnScan) {
            btnScan.addEventListener('click', () => {
                this.toggleScanner();
            });
        }

        // Check for direct product addition from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('producto');
        if (productId) {
            try {
                const response = await ProductService.getById(productId);
                if (response.success && response.data) {
                    this.addToCart(response.data);
                }
            } catch (error) {
                console.error('Error adding product from URL:', error);
            }
        }
        
        this.updateView();
    }

    toggleScanner() {
        const container = document.getElementById('readerContainer');
        if (container.classList.contains('d-none')) {
            container.classList.remove('d-none');
            this.startScanner();
        } else {
            container.classList.add('d-none');
            this.stopScanner();
        }
    }

    startScanner() {
        if (!this.html5QrcodeScanner) {
            this.html5QrcodeScanner = new Html5Qrcode("reader");
        }
        
        this.html5QrcodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                document.getElementById('posSearchProduct').value = decodedText;
                this.handleSearch(decodedText);
                this.toggleScanner(); // Close scanner after successful scan
            },
            (errorMessage) => {
                // Ignore parse errors as they are frequent
            }
        ).catch(err => {
            console.error("Error starting scanner", err);
            Toast.error("No se pudo acceder a la cámara");
            this.toggleScanner();
        });
    }

    stopScanner() {
        if (this.html5QrcodeScanner) {
            this.html5QrcodeScanner.stop().catch(err => console.error("Error stopping scanner", err));
        }
    }

    async handleSearch(query) {
        clearTimeout(this.searchTimeout);
        if (!query || query.length < 2) {
            SalesView.showSearchResults([]);
            if (this.initialProducts) {
                SalesView.renderInitialProducts(this.initialProducts, (product) => this.addToCart(product));
            }
            return;
        }

        this.searchTimeout = setTimeout(async () => {
            try {
                const response = await SalesService.searchProducts(query);
                if (response.success && response.data) {
                    // Soporta { success: true, data: { productos: [] } } o { success: true, data: [] }
                    const products = response.data.productos || (Array.isArray(response.data) ? response.data : []);
                    
                    const exactMatch = products.find(p => p.codigo === query || p.codigo_barras === query);
                    if (exactMatch && products.length === 1) {
                        this.addToCart(exactMatch);
                        document.getElementById('posSearchProduct').value = '';
                        SalesView.showSearchResults([]);
                        if (this.initialProducts) {
                            SalesView.renderInitialProducts(this.initialProducts, (p) => this.addToCart(p));
                        }
                    } else {
                        SalesView.showSearchResults(products, this.addToCart.bind(this));
                    }
                }
            } catch (error) {
                console.error("Error searching products", error);
            }
        }, 300);
    }

    async addToCart(product) {
        // Check if already in cart
        const existingIndex = this.cart.findIndex(item => item.producto.id === product.id);
        if (existingIndex >= 0) {
            // Increase qty and verify stock
            const item = this.cart[existingIndex];
            item.cantidad++;
            if (item.lote && item.cantidad > item.lote.stock_actual) {
                Toast.warning(`Stock insuficiente. Disponible: ${item.lote.stock_actual}`);
                item.cantidad = item.lote.stock_actual;
            }
            this.updateView();
            return;
        }

        // Add to cart with loading state for FEFO batch
        const cartItem = {
            producto: product,
            cantidad: 1,
            precio: parseFloat(product.precio_venta || 0),
            lote: null,
            loadingLote: true,
            noStock: false
        };
        
        this.cart.push(cartItem);
        this.updateView();

        try {
            const response = await SalesService.getFefoBatch(product.id);
            // La respuesta tiene los lotes en response.data.lotes
            if (response.success && response.data && response.data.lotes && response.data.lotes.length > 0) {
                // Filtrar lotes bloqueados por vencimiento si el backend no lo hizo
                const availableLotes = response.data.lotes.filter(l => !l.bloqueado && l.stock > 0);
                if (availableLotes.length > 0) {
                    const bestLote = availableLotes[0];
                    cartItem.lote = {
                        id: bestLote.lote_id,
                        codigo_lote: bestLote.codigo_lote,
                        fecha_vencimiento: bestLote.fecha_venc,
                        stock_actual: bestLote.stock,
                        precio: bestLote.precio_venta || cartItem.precio
                    };
                } else {
                    cartItem.noStock = true;
                    Toast.warning(`No hay lotes aptos para la venta para ${product.nombre}`);
                }
            } else {
                cartItem.noStock = true;
                Toast.warning(`No hay stock disponible para ${product.nombre}`);
            }
        } catch (error) {
            console.error("Error getting FEFO batch", error);
            cartItem.noStock = true;
        } finally {
            cartItem.loadingLote = false;
            this.updateView();
        }
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateView();
    }

    changeQuantity(index, newQty) {
        this.cart[index].cantidad = newQty;
        this.updateView();
    }

    updateView() {
        SalesView.renderCart(this.cart, this.removeFromCart.bind(this), this.changeQuantity.bind(this));
        
        let subtotal = 0;
        let hasNoStockItems = false;
        let hasLoadingItems = false;

        this.cart.forEach(item => {
            subtotal += item.cantidad * item.precio;
            if (item.noStock) hasNoStockItems = true;
            if (item.loadingLote) hasLoadingItems = true;
        });

        const taxes = 0;
        this.total = subtotal + taxes;
        
        const canComplete = this.cart.length > 0 && !hasNoStockItems && !hasLoadingItems;
        
        SalesView.updateTotals(subtotal, taxes, this.total, canComplete);
    }

    async handleCompleteSale(paymentMethod) {
        try {
            document.getElementById('btnCompleteSale').innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Procesando...';
            document.getElementById('btnCompleteSale').disabled = true;

            const items = this.cart.map(item => ({
                producto_id: item.producto.id,
                lote_id: item.lote.id,
                cantidad: item.cantidad,
                precio: item.precio
            }));

            const saleData = {
                items: items,
                metodo_pago: paymentMethod,
                impuestos: 0
            };
            const response = await SalesService.createSale(saleData);
            if (response.success) {
                const saleSummary = {
                    items: this.cart.map(item => ({...item})),
                    total: this.total,
                    metodo_pago: paymentMethod
                };
                
                SalesView.showSaleSuccess(response.data.venta_id, saleSummary, () => {
                    // Acción opcional para "Nueva Venta"
                    document.getElementById('posSearchProduct').focus();
                });
                this.cart = [];
                this.updateView();
            }
        } catch (error) {
            console.error('Error completing sale:', error);
            Toast.error('Error al procesar la venta: ' + error.message);
        } finally {
            this.updateView();
            document.getElementById('btnCompleteSale').innerHTML = '<i class="fas fa-check-circle me-2"></i>Completar Venta';
        }
    }
}
window.SalesController = SalesController;
