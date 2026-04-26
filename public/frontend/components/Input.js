/**
 * PharmaQuick - Input Component
 * Input con validación en tiempo real
 */

class Input {
    /**
     * Crear input con label
     */
    static create(config) {
        const {
            id,
            name,
            type = 'text',
            label = '',
            placeholder = '',
            value = '',
            required = false,
            disabled = false,
            readonly = false,
            min = null,
            max = null,
            minLength = null,
            maxLength = null,
            pattern = null,
            error = '',
            helpText = '',
            containerClass = '',
            inputClass = ''
        } = config;
        
        const inputId = id || name;
        const hasError = error && error.length > 0;
        
        const container = document.createElement('div');
        container.className = `form-group ${containerClass} ${hasError ? 'has-error' : ''}`;
        
        container.innerHTML = `
            ${label ? `<label for="${inputId}" class="form-label">
                ${label} ${required ? '<span class="required">*</span>' : ''}
            </label>` : ''}
            <input 
                type="${type}"
                id="${inputId}"
                name="${name}"
                class="form-input ${inputClass}"
                placeholder="${placeholder}"
                value="${value}"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}
                ${readonly ? 'readonly' : ''}
                ${min !== null ? `min="${min}"` : ''}
                ${max !== null ? `max="${max}"` : ''}
                ${minLength !== null ? `minlength="${minLength}"` : ''}
                ${maxLength !== null ? `maxlength="${maxLength}"` : ''}
                ${pattern ? `pattern="${pattern}"` : ''}
                autocomplete="off"
            >
            ${helpText ? `<span class="form-help">${helpText}</span>` : ''}
            ${hasError ? `<span class="form-error">${error}</span>` : ''}
        `;
        
        return container;
    }
    
    /**
     * Crear textarea
     */
    static createTextarea(config) {
        const {
            id,
            name,
            label = '',
            placeholder = '',
            value = '',
            required = false,
            disabled = false,
            readonly = false,
            rows = 3,
            maxLength = null,
            error = '',
            helpText = '',
            containerClass = ''
        } = config;
        
        const inputId = id || name;
        const hasError = error && error.length > 0;
        
        const container = document.createElement('div');
        container.className = `form-group ${containerClass} ${hasError ? 'has-error' : ''}`;
        
        container.innerHTML = `
            ${label ? `<label for="${inputId}" class="form-label">
                ${label} ${required ? '<span class="required">*</span>' : ''}
            </label>` : ''}
            <textarea 
                id="${inputId}"
                name="${name}"
                class="form-textarea"
                placeholder="${placeholder}"
                rows="${rows}"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}
                ${readonly ? 'readonly' : ''}
                ${maxLength ? `maxlength="${maxLength}"` : ''}
            >${value}</textarea>
            ${helpText ? `<span class="form-help">${helpText}</span>` : ''}
            ${hasError ? `<span class="form-error">${error}</span>` : ''}
        `;
        
        return container;
    }
    
    /**
     * Crear select
     */
    static createSelect(config) {
        const {
            id,
            name,
            label = '',
            options = [],
            value = '',
            required = false,
            disabled = false,
            placeholder = 'Seleccionar...',
            error = '',
            containerClass = ''
        } = config;
        
        const inputId = id || name;
        const hasError = error && error.length > 0;
        
        const container = document.createElement('div');
        container.className = `form-group ${containerClass} ${hasError ? 'has-error' : ''}`;
        
        container.innerHTML = `
            ${label ? `<label for="${inputId}" class="form-label">
                ${label} ${required ? '<span class="required">*</span>' : ''}
            </label>` : ''}
            <select 
                id="${inputId}"
                name="${name}"
                class="form-select"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}
            >
                <option value="">${placeholder}</option>
                ${options.map(opt => `
                    <option value="${opt.value}" ${opt.value == value ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
            ${hasError ? `<span class="form-error">${error}</span>` : ''}
        `;
        
        return container;
    }
    
    /**
     * Obtener valor
     */
    static getValue(input) {
        if (!input) return null;
        
        if (input.type === 'checkbox') {
            return input.checked;
        }
        
        return input.value;
    }
    
    /**
     * Establecer valor
     */
    static setValue(input, value) {
        if (!input) return;
        
        if (input.type === 'checkbox') {
            input.checked = value;
        } else {
            input.value = value;
        }
    }
    
    /**
     * Mostrar error
     */
    static showError(input, message) {
        if (!input) return;
        
        const group = input.closest('.form-group');
        if (group) {
            group.classList.add('has-error');
            
            let errorEl = group.querySelector('.form-error');
            if (errorEl) {
                errorEl.textContent = message;
            }
        }
    }
    
    /**
     * Ocultar error
     */
    static clearError(input) {
        if (!input) return;
        
        const group = input.closest('.form-group');
        if (group) {
            group.classList.remove('has-error');
        }
    }
    
    /**
     * Validar input
     */
    static validate(input) {
        if (!input) return { valid: true };
        
        const value = input.value;
        const required = input.required;
        
        // Requerido
        if (required && !value.trim()) {
            return { valid: false, error: 'Este campo es requerido' };
        }
        
        // Email
        if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { valid: false, error: 'Ingrese un email válido' };
            }
        }
        
        // Min length
        if (input.minLength && value.length < input.minLength) {
            return { valid: false, error: `Mínimo ${input.minLength} caracteres` };
        }
        
        //Max length
        if (input.maxLength && value.length > input.maxLength) {
            return { valid: false, error: `Máximo ${input.maxLength} caracteres` };
        }
        
        // Number
        if (input.type === 'number') {
            const num = parseFloat(value);
            if (input.min !== undefined && !isNaN(num) && num < parseFloat(input.min)) {
                return { valid: false, error: `Valor mínimo: ${input.min}` };
            }
            if (input.max !== undefined && !isNaN(num) && num > parseFloat(input.max)) {
                return { valid: false, error: `Valor máximo: ${input.max}` };
            }
        }
        
        return { valid: true };
    }
}

// Exportar global
const InputComponent = Input;