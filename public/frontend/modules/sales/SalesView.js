class SalesView {
    static bindSearchInput(handler) {
        const input = document.getElementById('posSearchProduct');
        input.addEventListener('input', (e) => {
            handler(e.target.value);
        });
    }

    static showSearchResults(results, onSelect) {
        const container = document.getElementById('posSearchResults');
        const gridContainer = document.getElementById('posRecommendations');
        
        // Si hay resultados y el query es largo, ocultamos el grid de sugerencias
        // y mostramos los resultados en su lugar (o viceversa)
        if (!results || results.length === 0) {
            container.style.display = 'none';
            // Al limpiar búsqueda, el controlador debería recargar los iniciales
            return;
        }

        // Si el usuario quiere cards, renderizamos en el grid
        if (gridContainer) {
            gridContainer.innerHTML = '<div class="col-12"><small class="text-muted text-uppercase fw-bold x-small">Resultados de búsqueda</small></div>';
            results.forEach(product => {
                const col = this._createProductCard(product, onSelect);
                gridContainer.appendChild(col);
            });
        }

        // También mantenemos el dropdown para compatibilidad rápida
        container.innerHTML = '';
        results.forEach(product => {
            const a = document.createElement('a');
            a.className = 'list-group-item list-group-item-action d-flex align-items-center gap-3';
            a.href = '#';
            
            const imgHtml = product.imagen_url 
                ? `<img src="${product.imagen_url}" alt="${product.nombre}" class="rounded shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`
                : `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;"><i class="fas fa-pills text-muted"></i></div>`;

            a.innerHTML = `
                ${imgHtml}
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <strong>${product.nombre}</strong>
                        <span class="badge bg-primary-soft text-primary small">$${parseFloat(product.precio_venta || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <small class="text-muted">${product.codigo || product.codigo_barras || 'N/A'}</small>
                    <div class="d-flex justify-content-between">
                        <small class="text-info">Stock: ${product.stock_total || 0}</small>
                        <small class="text-muted small">${product.presentacion || ''}</small>
                    </div>
                </div>
            `;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                onSelect(product);
                container.style.display = 'none';
                document.getElementById('posSearchProduct').value = '';
            });
            container.appendChild(a);
        });
        container.style.display = 'block';
    }

    static renderCart(cart, onRemove, onQuantityChange) {
        const tbody = document.getElementById('cartTableBody');
        tbody.innerHTML = '';

        if (cart.length === 0) {
            tbody.innerHTML = '<tr id="emptyCartRow"><td colspan="6" class="text-center text-muted py-4"><i class="fas fa-shopping-cart fa-2x mb-2 opacity-50"></i><br>El carrito está vacío</td></tr>';
            return;
        }

        cart.forEach((item, index) => {
            const tr = document.createElement('tr');
            const subtotal = item.cantidad * item.precio;
            
            // Lote display
            let loteDisplay = '<span class="text-muted small">Sin asignar</span>';
            if (item.lote) {
                loteDisplay = `<span class="badge bg-info-soft text-info border-info border-opacity-25">${item.lote.codigo_lote}</span><br><small class="text-muted">Vence: ${item.lote.fecha_vencimiento}</small>`;
            } else if (item.loadingLote) {
                loteDisplay = '<span class="spinner-border spinner-border-sm text-primary" role="status"></span>';
            } else if (item.noStock) {
                loteDisplay = '<span class="badge bg-danger-soft text-danger">Sin stock</span>';
            }

            const imgHtml = item.producto.imagen_url 
                ? `<img src="${item.producto.imagen_url}" alt="${item.producto.nombre}" class="rounded me-2" style="width: 32px; height: 32px; object-fit: cover;">`
                : `<div class="bg-light rounded d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;"><i class="fas fa-pills text-muted small"></i></div>`;

            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        ${imgHtml}
                        <div>
                            <div class="fw-bold text-dark">${item.producto.nombre}</div>
                            <small class="text-muted">${item.producto.codigo || item.producto.codigo_barras || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${loteDisplay}</td>
                <td>
                    <div class="input-group input-group-sm" style="width: 100px;">
                        <input type="number" class="form-control text-center cart-qty" value="${item.cantidad}" min="1" data-index="${index}" ${item.noStock ? 'disabled' : ''}>
                    </div>
                </td>
                <td class="text-nowrap">$${parseFloat(item.precio).toLocaleString('es-CO')}</td>
                <td class="fw-bold text-primary text-nowrap">$${subtotal.toLocaleString('es-CO')}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-link text-danger btn-remove" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;

            const qtyInput = tr.querySelector('.cart-qty');
            qtyInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                // Verificar stock disponible si hay lote
                if (item.lote && val > item.lote.stock_actual) {
                Toast.warning(`Stock insuficiente. Disponible: ${item.lote.stock_actual}`);
                    val = item.lote.stock_actual;
                    e.target.value = val;
                }
                onQuantityChange(index, val);
            });

            tr.querySelector('.btn-remove').addEventListener('click', () => {
                onRemove(index);
            });

            tbody.appendChild(tr);
        });
    }

    static updateTotals(subtotal, taxes, total, canComplete) {
        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
        document.getElementById('posSubtotal').textContent = fmt.format(subtotal);
        document.getElementById('posTaxes').textContent = fmt.format(taxes);
        document.getElementById('posTotal').textContent = fmt.format(total);
        
        const btnComplete = document.getElementById('btnCompleteSale');
        btnComplete.disabled = !canComplete;
    }

    static bindCompleteSale(handler) {
        const btn = document.getElementById('btnCompleteSale');
        if (btn) {
            btn.addEventListener('click', () => {
                const paymentMethod = document.getElementById('posPaymentMethod').value;
                handler(paymentMethod);
            });
        }
    }

    static renderInitialProducts(products, onSelect) {
        const container = document.getElementById('posSearchProduct').parentElement;
        let recContainer = document.getElementById('posRecommendations');
        if (!recContainer) {
            recContainer = document.createElement('div');
            recContainer.id = 'posRecommendations';
            recContainer.className = 'row g-2 mt-3';
            container.parentElement.appendChild(recContainer);
        }

        recContainer.innerHTML = '<div class="col-12"><small class="text-muted text-uppercase fw-bold x-small">Sugerencias / Productos con Stock</small></div>';
        
        products.forEach(product => {
            const col = this._createProductCard(product, onSelect);
            recContainer.appendChild(col);
        });
    }

    static _createProductCard(product, onSelect) {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-xl-3 mb-2';
        
        const imgHtml = product.imagen_url 
            ? `<img src="${product.imagen_url}" class="card-img-top p-2" style="height: 80px; object-fit: contain;">`
            : `<div class="bg-light d-flex align-items-center justify-content-center" style="height: 80px;"><i class="fas fa-pills text-muted fs-4"></i></div>`;

        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm btn-select-product cursor-pointer hover-shadow" style="transition: all 0.2s; border-radius: 12px; overflow: hidden;">
                ${imgHtml}
                <div class="card-body p-2 text-center">
                    <h6 class="card-title small fw-bold mb-1 text-truncate" title="${product.nombre}">${product.nombre}</h6>
                    <div class="text-primary small fw-bold">$${parseFloat(product.precio_venta || 0).toLocaleString('es-CO')}</div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <span class="text-muted x-small">Stock: ${product.stock_total || 0}</span>
                        <span class="badge bg-light text-muted x-small">${product.presentacion ? product.presentacion.substring(0,10) : ''}</span>
                    </div>
                </div>
            </div>
        `;
        
        col.querySelector('.btn-select-product').addEventListener('click', () => onSelect(product));
        return col;
    }
}
window.SalesView = SalesView;
