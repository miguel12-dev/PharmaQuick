/**
 * PharmaQuick - Button Component
 * Botones reutilizables
 */

class Button {
    /**
     * Crear botón
     */
    static create(config) {
        const {
            id,
            type = 'button',
            variant = 'primary', // primary, secondary, success, danger, warning, info, ghost
            size = 'md', // sm, md, lg
            text = '',
            icon = null,
            disabled = false,
            loading = false,
            block = false,
            containerClass = '',
            onClick = null
        } = config;
        
        const btn = document.createElement('button');
        btn.type = type;
        btn.className = `btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${containerClass}`;
        btn.id = id || '';
        btn.disabled = disabled || loading;
        
        if (loading) {
            btn.innerHTML = `<span class="spinner spinner-sm"></span> ${text}`;
        } else if (icon) {
            btn.innerHTML = `<span class="btn-icon">${icon}</span> ${text}`;
        } else {
            btn.textContent = text;
        }
        
        if (onClick) {
            btn.addEventListener('click', onClick);
        }
        
        return btn;
    }
    
    /**
     * Crear botón ícono
     */
    static createIcon(config) {
        const {
            icon,
            variant = 'ghost',
            size = 'md',
            title = '',
            disabled = false,
            onClick = null
        } = config;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-icon-only btn-${variant} btn-${size}`;
        btn.title = title;
        btn.disabled = disabled;
        btn.innerHTML = icon;
        btn.setAttribute('aria-label', title);
        
        if (onClick) {
            btn.addEventListener('click', onClick);
        }
        
        return btn;
    }
    
    /**
     * Grupo de botones
     */
    static createGroup(config) {
        const {
            buttons = [],
            variant = 'primary',
            size = 'md',
            containerClass = ''
        } = config;
        
        const group = document.createElement('div');
        group.className = `btn-group ${containerClass}`;
        
        buttons.forEach(btnConfig => {
            btnConfig.variant = btnConfig.variant || variant;
            btnConfig.size = size;
            group.appendChild(Button.create(btnConfig));
        });
        
        return group;
    }
    
    /**
     * Loading spinner
     */
    static setLoading(button, loading, text = null) {
        if (!button) return;
        
        button.disabled = loading;
        
        if (loading) {
            const originalText = text || button.textContent;
            button.dataset.originalText = originalText;
            button.innerHTML = `<span class="spinner spinner-sm"></span> ${originalText}`;
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
    
    /**
     * Mostrar error state
     */
    static setError(button, error) {
        if (!button) return;
        
        if (error) {
            button.classList.add('btn-error');
            button.title = error;
        } else {
            button.classList.remove('btn-error');
            button.title = '';
        }
    }
}

// Exportar global
const ButtonComponent = Button;