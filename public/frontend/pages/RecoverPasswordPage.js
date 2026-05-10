/**
 * PharmaQuick - Recover Password Page
 * Página de recuperación de contraseña para SPA
 */

const RecoverPasswordPage = {
    /**
     * Obtener token de la URL
     */
    getTokenFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    },

    /**
     * Fragmento HTML de la tarjeta (sin shell ni cabecera)
     */
    getRecoverCardHtml() {
        return `
            <div class="row justify-content-center">
                <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div class="card login-card shadow-lg border-0">
                        <div class="card-body">
                            <div class="text-center mb-2">
                                <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" style="height: 45px; max-width: 100%;" class="img-fluid">
                            </div>
                            <p class="text-center login-subtitle mb-4">
                                Ingresa tu correo para recuperar tu contraseña.
                            </p>

                            <form id="recoverForm">
                                <div class="mb-3">
                                    <label for="email" class="form-label fw-semibold">
                                        <i class="bi bi-envelope me-2"></i>Correo Electrónico
                                    </label>
                                    <input type="email" class="form-control" id="email" required
                                           placeholder="tu@email.com" autocomplete="email">
                                </div>

                                <div id="recoverError" class="alert alert-danger d-none" role="alert">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    <span id="recoverErrorMessage"></span>
                                </div>

                                <div id="recoverSuccess" class="alert alert-success d-none" role="alert">
                                    <i class="bi bi-check-circle me-2"></i>
                                    <span id="recoverSuccessMessage"></span>
                                </div>

                                <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="recoverBtn">
                                    <span id="recoverBtnText">Enviar Enlace de Recuperación</span>
                                    <span id="recoverBtnSpinner" class="spinner-border spinner-border-sm d-none" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </span>
                                </button>
                            </form>

                            <div class="text-center mt-4 pt-2 border-top">
                                <a href="/login" class="btn btn-link text-primary fw-bold text-decoration-none p-0" onclick="event.preventDefault(); Router.navigate('/login')">
                                    <i class="bi bi-arrow-left me-1"></i>Volver a Iniciar Sesión
                                </a>
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
     * Fragmento HTML para.reset de contraseña (con token)
     */
    getResetCardHtml() {
        return `
            <div class="row justify-content-center">
                <div class="col-12 col-sm-8 col-md-6 col-lg-4">
                    <div class="card login-card shadow-lg border-0">
                        <div class="card-body">
                            <div class="text-center mb-2">
                                <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" style="height: 45px; max-width: 100%;" class="img-fluid">
                            </div>
                            <p class="text-center login-subtitle mb-4">
                                Ingresa tu nueva contraseña.
                            </p>

                            <form id="resetForm">
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label fw-semibold">
                                        <i class="bi bi-key me-2"></i>Nueva Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="newPassword" required
                                               placeholder="Mínimo 6 caracteres" minlength="6" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleNewPassword">
                                            <i class="bi bi-eye" id="toggleNewPasswordIcon"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label fw-semibold">
                                        <i class="bi bi-key-fill me-2"></i>Confirmar Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="confirmPassword" required
                                               placeholder="Repite tu contraseña" autocomplete="new-password">
                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                            <i class="bi bi-eye" id="toggleConfirmPasswordIcon"></i>
                                        </button>
                                    </div>
                                </div>

                                <div id="resetError" class="alert alert-danger d-none" role="alert">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    <span id="resetErrorMessage"></span>
                                </div>

                                <div id="resetSuccess" class="alert alert-success d-none" role="alert">
                                    <i class="bi bi-check-circle me-2"></i>
                                    <span id="resetSuccessMessage"></span>
                                </div>

                                <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="resetBtn">
                                    <span id="resetBtnText">Cambiar Contraseña</span>
                                    <span id="resetBtnSpinner" class="spinner-border spinner-border-sm d-none" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </span>
                                </button>
                            </form>

                            <div class="text-center mt-4 pt-2 border-top">
                                <a href="/login" class="btn btn-link text-primary fw-bold text-decoration-none p-0" onclick="event.preventDefault(); Router.navigate('/login')">
                                    <i class="bi bi-arrow-left me-1"></i>Volver a Iniciar Sesión
                                </a>
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
     * Inicializar página de recuperación
     */
    async init(container) {
        const token = this.getTokenFromUrl();
        
        // Usar template del HTML si está disponible, sino generar HTML
        const template = document.getElementById('template-recover-password');
        
        // Si hay token, usar formulario de reset, sino el de recuperación
        let cardHtml;
        if (token && template) {
            // Cuando hay token, necesitamos mostrar el formulario de reset
            // Por ahora generamos el HTML directamente
            cardHtml = this.getResetCardHtml();
        } else if (template) {
            cardHtml = template.innerHTML.trim();
        } else {
            cardHtml = this.getRecoverCardHtml();
        }

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

        // Inicializar el formulario correcto según si hay token
        if (token) {
            this.initResetForm();
            this.initTogglePassword('toggleNewPassword', 'newPassword', 'toggleNewPasswordIcon');
            this.initTogglePassword('toggleConfirmPassword', 'confirmPassword', 'toggleConfirmPasswordIcon');
        } else {
            this.initRecoverForm();
        }
    },

    initRecoverForm() {
        const form = document.getElementById('recoverForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();

            if (!email) {
                this.showError('Por favor ingresa tu correo electrónico');
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showError('Por favor ingresa un correo electrónico válido');
                return;
            }

            this.setLoading(true);
            this.hideMessages();

            try {
                const data = await httpClient.post('/auth/recover', { email }, false);
                
                if (data.success) {
                    this.showSuccess(data.message || 'Si el correo existe, recibirás un enlace para recuperar tu contraseña');
                    form.reset();
                } else {
                    this.showError(data.message || 'Error al solicitar recuperación');
                }
            } catch (error) {
                this.showError('Error de conexión. Por favor intenta más tarde');
            } finally {
                this.setLoading(false);
            }
        });
    },

    initResetForm() {
        const form = document.getElementById('resetForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = this.getTokenFromUrl();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!token) {
                this.showResetError('Token de recuperación inválido o expirado');
                return;
            }

            if (newPassword.length < 6) {
                this.showResetError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showResetError('Las contraseñas no coinciden');
                return;
            }

            this.setResetLoading(true);
            this.hideResetMessages();

            try {
                const data = await httpClient.post('/auth/reset', { 
                    token,
                    password: newPassword
                }, false);
                
                if (data.success) {
                    this.showResetSuccess(data.message || 'Contraseña actualizada correctamente');
                    form.reset();
                    
                    // Redirigir al login después de 2 segundos
                    setTimeout(() => {
                        Router.navigate('/login');
                    }, 2000);
                } else {
                    this.showResetError(data.message || 'Error al cambiar contraseña');
                }
            } catch (error) {
                this.showResetError('Error de conexión. Por favor intenta más tarde');
            } finally {
                this.setResetLoading(false);
            }
        });
    },

    initTogglePassword(toggleBtnId, inputId, iconId) {
        const toggleBtn = document.getElementById(toggleBtnId);
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'bi bi-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'bi bi-eye';
                }
            }
        });
    },

    showError(message) {
        const errorDiv = document.getElementById('recoverError');
        const successDiv = document.getElementById('recoverSuccess');
        const errorMessage = document.getElementById('recoverErrorMessage');

        if (errorMessage) errorMessage.textContent = message;
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    showSuccess(message) {
        const errorDiv = document.getElementById('recoverError');
        const successDiv = document.getElementById('recoverSuccess');
        const successMessage = document.getElementById('recoverSuccessMessage');

        if (successMessage) successMessage.textContent = message;
        if (successDiv) successDiv.classList.remove('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
    },

    showResetError(message) {
        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');
        const errorMessage = document.getElementById('resetErrorMessage');

        if (errorMessage) errorMessage.textContent = message;
        if (errorDiv) errorDiv.classList.remove('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    showResetSuccess(message) {
        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');
        const successMessage = document.getElementById('resetSuccessMessage');

        if (successMessage) successMessage.textContent = message;
        if (successDiv) successDiv.classList.remove('d-none');
        if (errorDiv) errorDiv.classList.add('d-none');
    },

    hideMessages() {
        const errorDiv = document.getElementById('recoverError');
        const successDiv = document.getElementById('recoverSuccess');

        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    hideResetMessages() {
        const errorDiv = document.getElementById('resetError');
        const successDiv = document.getElementById('resetSuccess');

        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    },

    setLoading(loading) {
        const btn = document.getElementById('recoverBtn');
        const btnText = document.getElementById('recoverBtnText');
        const btnSpinner = document.getElementById('recoverBtnSpinner');
        const input = document.getElementById('email');

        if (loading) {
            if (btnText) btnText.textContent = 'Enviando...';
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btn) btn.disabled = true;
            if (input) input.disabled = true;
        } else {
            if (btnText) btnText.textContent = 'Enviar Enlace de Recuperación';
            if (btnSpinner) btnSpinner.classList.add('d-none');
            if (btn) btn.disabled = false;
            if (input) input.disabled = false;
        }
    },

    setResetLoading(loading) {
        const btn = document.getElementById('resetBtn');
        const btnText = document.getElementById('resetBtnText');
        const btnSpinner = document.getElementById('resetBtnSpinner');
        const inputs = document.querySelectorAll('#resetForm input');

        if (loading) {
            if (btnText) btnText.textContent = 'Cambiando...';
            if (btnSpinner) btnSpinner.classList.remove('d-none');
            if (btn) btn.disabled = true;
            inputs.forEach(input => input.disabled = true);
        } else {
            if (btnText) btnText.textContent = 'Cambiar Contraseña';
            if (btnSpinner) btnSpinner.classList.add('d-none');
            if (btn) btn.disabled = false;
            inputs.forEach(input => input.disabled = false);
        }
    }
};

window.RecoverPasswordPage = RecoverPasswordPage;