/**
 * PharmaQuick - Register Page
 * Página de registro para SPA
 */

const RegisterPage = {
    /**
     * Fragmento HTML de la tarjeta de registro (sin shell ni cabecera)
     */
    getRegisterCardHtml() {
        return `
            <div class="row justify-content-center">
                <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div class="card login-card shadow-lg border-0">
                        <div class="card-body">
                            <div class="text-center mb-2">
                                <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" style="height: 45px; max-width: 100%;" class="img-fluid">
                            </div>
                                Crea tu cuenta de farmacia para comenzar a ordenar.
                            </p>

                            <form id="registerForm">
                                <div class="mb-3">
                                    <label for="nombre" class="form-label fw-semibold">
                                        <i class="bi bi-person me-2"></i>Nombre Completo
                                    </label>
                                    <input type="text" class="form-control" id="nombre" required
                                           placeholder="Ej: Juan Pérez" autocomplete="name">
                                </div>

                                <div class="mb-3">
                                    <label for="email" class="form-label fw-semibold">
                                        <i class="bi bi-envelope me-2"></i>Correo Electrónico
                                    </label>
                                    <input type="email" class="form-control" id="email" required
                                           placeholder="nombre@ejemplo.com" autocomplete="email">
                                </div>

                                <div class="mb-3">
                                    <label for="password" class="form-label fw-semibold">
                                        <i class="bi bi-key me-2"></i>Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="password" required
                                               placeholder="Mínimo 6 caracteres" minlength="6" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="bi bi-eye" id="togglePasswordIcon"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="confirm_password" class="form-label fw-semibold">
                                        <i class="bi bi-key-fill me-2"></i>Confirmar Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirm_password" required
                                               placeholder="Repite tu contraseña" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                            <i class="bi bi-eye" id="toggleConfirmPasswordIcon"></i>
                                        </button>
                                    </div>
                                </div>

                                <div id="registerError" class="alert alert-danger d-none" role="alert">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    <span id="registerErrorMessage"></span>
                                </div>

                                <div id="registerSuccess" class="alert alert-success d-none" role="alert">
                                    <i class="bi bi-check-circle me-2"></i>
                                    <span id="registerSuccessMessage"></span>
                                </div>

                                <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="registerBtn">
                                    <span id="registerBtnText">Crear Cuenta</span>
                                    <span id="registerBtnSpinner" class="spinner-border spinner-border-sm d-none" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </span>
                                </button>
                            </form>

                            <div class="text-center mt-4 pt-2 border-top">
                                <p class="text-muted small mb-0">¿Ya tienes una cuenta?</p>
                                <a href="/login" class="btn btn-link text-primary fw-bold text-decoration-none p-0" onclick="event.preventDefault(); Router.navigate('/login')">Inicia Sesión</a>
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
     * Inicializar página de registro
     */
    async init(container) {
        if (Router.isAuthenticated()) {
            Router.navigate('/dashboard');
            return;
        }

        const template = document.getElementById('template-register');
        const cardHtml = template ? template.innerHTML.trim() : this.getRegisterCardHtml();

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
        this.initTogglePasswords();
    },

    initForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (!nombre || !email || !password || !confirmPassword) {
                this.showError('Por favor complete todos los campos');
                return;
            }

            if (password !== confirmPassword) {
                this.showError('Las contraseñas no coinciden');
                return;
            }

            if (password.length < 6) {
                this.showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            this.setLoading(true);
            this.hideMessages();

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });

                const result = await response.json();

                if (result.success) {
                    this.showSuccess('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
                    
                    setTimeout(() => {
                        Router.navigate('/login');
                    }, 1500);
                } else {
                    this.showError(result.message || 'Error en el registro');
                }
            } catch (error) {
                console.error('Register error:', error);
                this.showError('No se pudo conectar con el servidor');
            } finally {
                this.setLoading(false);
            }
        });
    },

    initTogglePasswords() {
        // Toggle para contraseña principal
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const toggleIcon = document.getElementById('togglePasswordIcon');

                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleIcon.className = 'bi bi-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    toggleIcon.className = 'bi bi-eye';
                }
            });
        }

        // Toggle para confirmar contraseña
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', () => {
                const confirmPasswordInput = document.getElementById('confirm_password');
                const toggleIcon = document.getElementById('toggleConfirmPasswordIcon');

                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                    toggleIcon.className = 'bi bi-eye-slash';
                } else {
                    confirmPasswordInput.type = 'password';
                    toggleIcon.className = 'bi bi-eye';
                }
            });
        }
    },

    showError(message) {
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        const errorMessage = document.getElementById('registerErrorMessage');

        if (errorMessage) errorMessage.textContent = message;
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    showSuccess(message) {
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        const successMessage = document.getElementById('registerSuccessMessage');

        if (successMessage) successMessage.textContent = message;
        if (successDiv) successDiv.classList.remove('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
    },

    hideMessages() {
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');

        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    setLoading(loading) {
        const btn = document.getElementById('registerBtn');
        const btnText = document.getElementById('registerBtnText');
        const btnSpinner = document.getElementById('registerBtnSpinner');
        const inputs = document.querySelectorAll('#registerForm input');

        if (loading) {
            if (btnText) btnText.textContent = 'Creando...';
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btn) btn.disabled = true;
            inputs.forEach(input => input.disabled = true);
        } else {
            if (btnText) btnText.textContent = 'Crear Cuenta';
            if (btnSpinner) btnSpinner.classList.add('d-none');
            if (btn) btn.disabled = false;
            inputs.forEach(input => input.disabled = false);
        }
    }
};

window.RegisterPage = RegisterPage;