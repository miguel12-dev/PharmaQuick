/**
 * PharmaQuick - Login Page
 * Página de login para SPA
 */

const LoginPage = {
    /**
     * Fragmento HTML de la tarjeta de login (sin shell ni cabecera)
     */
    getLoginCardHtml() {
        return `
            <div class="row justify-content-center">
                <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div class="card login-card shadow-lg border-0">
                        <div class="card-body">
                            <p class="text-center login-subtitle mb-4 mb-lg-4">
                                Ingresa con tu cuenta de farmacia para continuar.
                            </p>

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

                            <div class="text-center mt-4 pt-2 border-top">
                                <p class="text-muted small mb-0">¿Eres nuevo en PharmaQuick?</p>
                                <a href="/register" class="btn btn-link text-primary fw-bold text-decoration-none p-0" onclick="event.preventDefault(); Router.navigate('/register')">Regístrate aquí</a>
                            </div>
                        </div>
                    </div>

                    <div class="text-center mt-3">
                        <small class="text-muted">&copy; ${new Date().getFullYear()} PharmaQuick v1.0</small>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Inicializar página de login
     */
    async init(container) {
        if (Router.isAuthenticated()) {
            Router.navigate('/dashboard');
            return;
        }

        const template = document.getElementById('template-login');
        const cardHtml = template ? template.innerHTML.trim() : this.getLoginCardHtml();

        container.innerHTML = `
            <div class="login-page">
                ${SiteHeader.render({ variant: 'auth' })}
                <main class="login-page__main">
                    <div class="container py-4 py-lg-5">
                        ${cardHtml}
                    </div>
                </main>
            </div>
        `;

        this.initForm();
        this.initTogglePassword();
    },

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

    async login(email, password) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const data = await httpClient.post('/auth/login', formData, false);

        if (data.success) {
            AuthService.setSession(data.data);
            return data.data;
        }
        throw new Error(data.message || 'Error en la autenticación');
    },

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        const errorMessage = document.getElementById('errorMessage');

        if (errorMessage) errorMessage.textContent = message;
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    showSuccess(message) {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');
        const successMessage = document.getElementById('successMessage');

        if (successMessage) successMessage.textContent = message;
        if (successDiv) successDiv.classList.remove('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
    },

    hideMessages() {
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('loginSuccess');

        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

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

window.LoginPage = LoginPage;
