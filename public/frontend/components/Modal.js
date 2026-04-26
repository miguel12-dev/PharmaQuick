/**
 * PharmaQuick - Modal Component
 * Modal reutilizable con animaciones
 */

class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            size: 'md', // sm, md, lg, xl
            closeOnBackdrop: true,
            closeOnEscape: true,
            showFooter: true,
            confirmText: 'Guardar',
            cancelText: 'Cancelar',
            onConfirm: null,
            onCancel: null,
            onClose: null,
            ...options
        };
        
        this.element = null;
        this.isOpen = false;
    }
    
    /**
     * Crear elemento modal
     */
    create() {
        if (this.element) return this.element;
        
        const { title, size, closeOnBackdrop, closeOnEscape, showFooter, confirmText, cancelText } = this.options;
        
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-container modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button type="button" class="modal-close" aria-label="Cerrar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.options.content}
                </div>
                ${showFooter ? `
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-cancel">${cancelText}</button>
                        <button type="button" class="btn btn-primary modal-confirm">${confirmText}</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.attachEventListeners(closeOnBackdrop, closeOnEscape);
        
        document.body.appendChild(this.element);
        return this.element;
    }
    
    /**
     * Adjuntar event listeners
     */
    attachEventListeners(closeOnBackdrop, closeOnEscape) {
        // Botón cerrar
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Footer botones
        const cancelBtn = this.element.querySelector('.modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.options.onCancel) {
                    this.options.onCancel();
                }
                this.close();
            });
        }
        
        const confirmBtn = this.element.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.options.onConfirm) {
                    this.options.onConfirm();
                }
            });
        }
        
        // Click en backdrop
        if (closeOnBackdrop) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }
        
        // Escape
        if (closeOnEscape) {
            this._escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this._escapeHandler);
        }
    }
    
    /**
     * Abrir modal
     */
    open() {
        if (!this.element) {
            this.create();
        }
        
        // Agregar clase para animación
        requestAnimationFrame(() => {
            this.element.classList.add('show');
            this.isOpen = true;
            
            // Focus en primer input
            const firstInput = this.element.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        // Lock scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Cerrar modal
     */
    close() {
        if (!this.element || !this.isOpen) return;
        
        this.element.classList.remove('show');
        this.isOpen = false;
        
        if (this.options.onClose) {
            this.options.onClose();
        }
        
        // Unlock scroll
        document.body.style.overflow = '';
        
        // Remover después de animación
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
        }, Config.ANIMATION_DURATION);
    }
    
    /**
     * Actualizar contenido
     */
    setContent(content) {
        this.options.content = content;
        if (this.element) {
            const body = this.element.querySelector('.modal-body');
            if (body) {
                body.innerHTML = content;
            }
        }
    }
    
    /**
     * Obtener datos del formulario
     */
    getFormData(formId) {
        const form = this.element.querySelector(`#${formId}`);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            // Checkbox handling
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.type === 'checkbox') {
                data[key] = input.checked;
            } else {
                data[key] = value;
            }
        });
        
        return data;
    }
    
    /**
     * Mostrar estado de carga en botón confirmar
     */
    setLoading(loading) {
        if (!this.element) return;
        
        const confirmBtn = this.element.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.disabled = loading;
            confirmBtn.innerHTML = loading 
                ? '<span class="spinner spinner-sm"></span> Guardando...'
                : this.options.confirmText;
        }
    }
    
    /**
     * Mostrar error en modal
     */
    showError(message) {
        if (!this.element) return;
        
        // Buscar container de errores o crear
        let errorDiv = this.element.querySelector('.modal-error');
        if (!errorDiv) {
            const body = this.element.querySelector('.modal-body');
            errorDiv = document.createElement('div');
            errorDiv.className = 'modal-error';
            body.insertBefore(errorDiv, body.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
    
    /**
     * Ocultar error en modal
     */
    hideError() {
        if (!this.element) return;
        
        const errorDiv = this.element.querySelector('.modal-error');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }
}

// Exportar global
const ModalComponent = Modal;