class SalesView {
    static bindSearchInput(handler) {
        const input = document.getElementById('posSearchProduct');
        input.addEventListener('input', (e) => {
            handler(e.target.value);
        });
    }

    static showSearchResults(results, onSelect) {
        const container = document.getElementById('posSearchResults');
        container.innerHTML = '';
        if (!results || results.length === 0) {
            container.style.display = 'none';
            return;
        }

        results.forEach(product => {
            const a = document.createElement('a');
            a.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            a.href = '#';
            a.innerHTML = `
                <div>
                    <strong>${product.nombre}</strong> <span class="text-muted small">(${product.codigo_barras || 'N/A'})</span>
                    <br>
                    <small class="text-success">$${parseFloat(product.precio_venta || 0).toFixed(2)}</small>
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
                loteDisplay = `<span class="badge bg-info text-dark">${item.lote.codigo_lote}</span><br><small class="text-muted">Vence: ${item.lote.fecha_vencimiento}</small>`;
            } else if (item.loadingLote) {
                loteDisplay = '<span class="spinner-border spinner-border-sm text-primary" role="status"></span>';
            } else if (item.noStock) {
                loteDisplay = '<span class="badge bg-danger">Sin stock</span>';
            }

            tr.innerHTML = `
                <td>
                    <strong>${item.producto.nombre}</strong><br>
                    <small class="text-muted">${item.producto.codigo_barras || ''}</small>
                </td>
                <td>${loteDisplay}</td>
                <td>
                    <input type="number" class="form-control form-control-sm cart-qty" value="${item.cantidad}" min="1" data-index="${index}" ${item.noStock ? 'disabled' : ''}>
                </td>
                <td>$${parseFloat(item.precio).toFixed(2)}</td>
                <td class="fw-semibold">$${subtotal.toFixed(2)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger btn-remove" data-index="${index}"><i class="fas fa-trash"></i></button>
                </td>
            `;

            const qtyInput = tr.querySelector('.cart-qty');
            qtyInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                // Verificar stock disponible si hay lote
                if (item.lote && val > item.lote.stock_actual) {
                    Toast.showWarning(`Stock insuficiente. Disponible: ${item.lote.stock_actual}`);
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
        document.getElementById('posSubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('posTaxes').textContent = `$${taxes.toFixed(2)}`;
        document.getElementById('posTotal').textContent = `$${total.toFixed(2)}`;
        
        const btnComplete = document.getElementById('btnCompleteSale');
        btnComplete.disabled = !canComplete;
    }

    static bindCompleteSale(handler) {
        document.getElementById('btnCompleteSale').addEventListener('click', () => {
            const paymentMethod = document.getElementById('posPaymentMethod').value;
            handler(paymentMethod);
        });
    }
}
window.SalesView = SalesView;
