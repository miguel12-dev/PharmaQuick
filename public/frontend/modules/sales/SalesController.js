class SalesController {
    constructor() {
        this.cart = [];
        this.html5QrcodeScanner = null;
        this.searchTimeout = null;
    }

    init() {
        SalesView.bindSearchInput(this.handleSearch.bind(this));
        SalesView.bindCompleteSale(this.handleCompleteSale.bind(this));
        
        // Hide search results if clicked outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#posSearchResults') && e.target.id !== 'posSearchProduct') {
                document.getElementById('posSearchResults').style.display = 'none';
            }
        });

        // Barcode scanner integration
        document.getElementById('btnScanBarcode').addEventListener('click', () => {
            this.toggleScanner();
        });
        
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
            Toast.showError("No se pudo acceder a la cámara");
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
            return;
        }

        this.searchTimeout = setTimeout(async () => {
            try {
                const response = await SalesService.searchProducts(query);
                if (response.success && response.data) {
                    const exactMatch = response.data.find(p => p.codigo_barras === query);
                    if (exactMatch && response.data.length === 1) {
                        this.addToCart(exactMatch);
                        document.getElementById('posSearchProduct').value = '';
                        SalesView.showSearchResults([]);
                    } else {
                        SalesView.showSearchResults(response.data, this.addToCart.bind(this));
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
                Toast.showWarning(`Stock insuficiente. Disponible: ${item.lote.stock_actual}`);
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
            if (response.success && response.data && response.data.lote) {
                cartItem.lote = response.data.lote;
            } else {
                cartItem.noStock = true;
                Toast.showWarning(`No hay stock disponible para ${product.nombre}`);
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
        const total = subtotal + taxes;
        
        const canComplete = this.cart.length > 0 && !hasNoStockItems && !hasLoadingItems;
        
        SalesView.updateTotals(subtotal, taxes, total, canComplete);
    }

    async handleCompleteSale(paymentMethod) {
        try {
            document.getElementById('btnCompleteSale').innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Procesando...';
            document.getElementById('btnCompleteSale').disabled = true;

            const items = this.cart.map(item => ({
                producto_id: item.producto.id,
                lote_id: item.lote.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }));

            const saleData = {
                items: items,
                metodo_pago: paymentMethod,
                impuestos: 0
            };

            const response = await SalesService.createSale(saleData);
            if (response.success) {
                Toast.showSuccess('Venta completada con éxito');
                this.cart = [];
                this.updateView();
            }
        } catch (error) {
            console.error('Error completing sale:', error);
            Toast.showError('Error al procesar la venta: ' + error.message);
        } finally {
            this.updateView();
            document.getElementById('btnCompleteSale').innerHTML = '<i class="fas fa-check-circle me-2"></i>Completar Venta';
        }
    }
}
window.SalesController = SalesController;
