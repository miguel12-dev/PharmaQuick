/**
 * PharmaQuick - Login Page
 * Página de login para SPA
 */

const LoginPage = {
    /**
     * Inicializar página de login
     */
    async init(container) {
        // Si ya está autenticado, redirigir a dashboard
        if (Router.isAuthenticated()) {
            Router.navigate('/dashboard');
            return;
        }
        
        // Renderizar template de login
        const template = document.getElementById('template-login');
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            // Fallback: login inline
            container.innerHTML = this.getLoginHtml();
        }
        
        // Inicializar eventos
        this.initForm();
        this.initTogglePassword();
    },
    
    /**
     * Obtener HTML del login
     */
    getLoginHtml() {
        return `
            <div class="container">
                <div class="row justify-content-center align-items-center min-vh-100">
                    <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                        <div class="card shadow-lg border-0">
                            <div class="card-body p-4">
                                <div class="text-center mb-4">
                                    <i class="bi bi-capsule text-primary fs-1"></i>
                                    <h3 class="mt-2 fw-bold text-dark">PharmaQuick</h3>
                                    <p class="text-muted small">Gestión de Farmacias</p>
                                </div>

                                <form id="loginForm">
                                    <div class="mb-3">
                                        <label for="email" class="form-label fw-semibold">
                                            <i class="bi bi-envelope me-2"></i>Correo Electrónico
                                        </label>
                                        <input type="email" class="form-control" id="email" required
                                               placeholder="admin@pharmaquick.com" autocomplete="email">
                                    </div>

                                    <div class="mb-3">
                                        <label for="password" class="form-label fw-semibold">
                                            <i class="bi bi-key me-2"></i>Contraseña
                                        </label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="password" required
                                                   placeholder="**********" autocomplete="current-password">
                                            <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                <i class="bi bi-eye" id="toggleIcon"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="rememberMe">
                                        <label class="form-check-label" for="rememberMe">Recordarme</label>
                                    </div>

                                    <div id="loginError" class="alert alert-danger d-none" role="alert">
                                        <i class="bi bi-exclamation-triangle me-2"></i>
                                        <span id="errorMessage"></span>
                                    </div>

                                    <div id="loginSuccess" class="alert alert-success d-none" role="alert">
                                        <i class="bi bi-check-circle me-2"></i>
                                        <span id="successMessage"></span>
                                    </div>

                                    <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="loginBtn">
                                        <span id="loginBtnText">Iniciar Sesión</span>
                                        <span id="loginBtnSpinner" class="spinner-border spinner-border-sm d-none" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </span>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div class="text-center mt-3">
                            <small class="text-muted">&copy; 2024 PharmaQuick v1.0</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Inicializar formulario
     */
    initForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                this.showError('Por favor ingrese email y contraseña');
                return;
            }
            
            this.setLoading(true);
            this.hideMessages();
            
            try {
                await this.login(email, password);
                this.showSuccess('Autenticación exitosa, redireccionando...');
                
                // Redirigir al dashboard
                setTimeout(() => {
                    Router.navigate('/dashboard');
                }, 500);
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.setLoading(false);
            }
        });
    },
    
    /**
     * Inicializar toggle de contraseña
     */
    initTogglePassword() {
        const toggleBtn = document.getElementById('togglePassword');
        if (!toggleBtn) return;
        
        toggleBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('toggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.className = 'bi bi-eye-slash';
            } else {
                passwordInput.type = 'password';
                toggleIcon.className = 'bi bi-eye';
            }
        });
    },
    
    /**
     * Realizar login
     */
    async login(email, password) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar sesión
            AuthService.setSession(data.data);
            return data.data;
        } else {
            throw new Error(data.message || 'Error en la autenticación');
        }
    },
    
    /**
     * Mostrar error
     */
    showError(message) {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },
    
    /**
     * Mostrar éxito
     */
    showSuccess(message) {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        const successMessage = document.getElementById('successMessage');
        
        if (successMessage) successMessage.textContent = message;
        if (successDiv) successDiv.classList.remove('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
    },
    
    /**
     * Ocultar mensajes
     */
    hideMessages() {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        
        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },
    
    /**
     * Establecer estado de carga
     */
    setLoading(loading) {
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        const inputs = document.querySelectorAll('#loginForm input');
        
        if (loading) {
            if (btnText) btnText.textContent = 'Iniciando...';
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btn) btn.disabled = true;
            inputs.forEach(input => input.disabled = true);
        } else {
            if (btnText) btnText.textContent = 'Iniciar Sesión';
            if (btnSpinner) btnSpinner.classList.add('d-none');
            if (btn) btn.disabled = false;
            inputs.forEach(input => input.disabled = false);
        }
    }
};

// Exportar
window.LoginPage = LoginPage;