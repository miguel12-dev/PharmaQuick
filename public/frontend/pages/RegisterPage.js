class RegisterPage {
    static async init(container) {
        this.container = container;
        this.render();
    }

    static render() {
        this.container.innerHTML = `
            <div class="auth-wrapper d-flex align-items-center justify-content-center min-vh-100 bg-light">
                <div class="auth-card card shadow-lg border-0" style="max-width: 450px; width: 100%; border-radius: 1.5rem; overflow: hidden;">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" style="height: 60px;" class="mb-3">
                            <h2 class="fw-bold text-primary">Crea tu cuenta</h2>
                            <p class="text-muted">Únete a PharmaQuick y gestiona tus pedidos</p>
                        </div>

                        <form id="registerForm" class="needs-validation" novalidate>
                            <div class="mb-3">
                                <label for="nombre" class="form-label small fw-semibold text-secondary">Nombre Completo</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="fas fa-user"></i></span>
                                    <input type="text" class="form-control border-start-0 ps-0" id="nombre" placeholder="Ej: Juan Pérez" required>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label small fw-semibold text-secondary">Correo Electrónico</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="fas fa-envelope"></i></span>
                                    <input type="email" class="form-control border-start-0 ps-0" id="email" placeholder="nombre@ejemplo.com" required>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label small fw-semibold text-secondary">Contraseña</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="fas fa-lock"></i></span>
                                    <input type="password" class="form-control border-start-0 ps-0" id="password" placeholder="Mínimo 6 caracteres" required minlength="6">
                                </div>
                            </div>

                            <div class="mb-4">
                                <label for="confirm_password" class="form-label small fw-semibold text-secondary">Confirmar Contraseña</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="fas fa-check-double"></i></span>
                                    <input type="password" class="form-control border-start-0 ps-0" id="confirm_password" placeholder="Repite tu contraseña" required>
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg py-3 fw-bold shadow-sm" style="border-radius: 0.8rem;">
                                    Registrarse <i class="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </form>

                        <div class="text-center mt-4">
                            <p class="text-muted small">¿Ya tienes una cuenta? <a href="/login" class="text-primary fw-bold text-decoration-none" onclick="event.preventDefault(); window.Router.navigate('/login')">Inicia Sesión</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    static setupEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm_password').value;

            if (password !== confirm) {
                alert('Las contraseñas no coinciden');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Registro exitoso. Ahora puedes iniciar sesión.');
                    window.Router.navigate('/login');
                } else {
                    alert(result.message || 'Error en el registro');
                }
            } catch (error) {
                console.error('Register error:', error);
                alert('No se pudo conectar con el servidor');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
}

window.RegisterPage = RegisterPage;
