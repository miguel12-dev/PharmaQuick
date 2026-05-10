/**
 * PharmaQuick - Client Profile Page
 * Perfil para clientes (e-commerce style)
 */

const ClientProfilePage = {
    async init(container) {
        // Verificar autenticación
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        this.renderLayout(container);
        await this.loadProfile(container);
        this.setupEventListeners(container);
    },

    renderLayout(container) {
        // Usar ClientLayout
        ClientLayout.render(container, 'perfil');
        
        // Inyectar contenido en clientContent
        const content = container.querySelector('#clientContent');
        if (content) {
            content.innerHTML = `
                <section class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <h5 class="fw-bold mb-3">Datos del usuario</h5>
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Email</label>
                                <input id="perfilEmail" class="form-control" readonly>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Rol</label>
                                <input id="perfilRol" class="form-control" readonly>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Tipo</label>
                                <input id="perfilFarmacia" class="form-control" readonly>
                            </div>
                        </div>
                        <h5 class="fw-bold mb-3">Cambio de contraseña</h5>
                        <form id="passwordForm" class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Nueva contraseña</label>
                                <input type="password" id="newPassword" class="form-control" minlength="8" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Confirmar contraseña</label>
                                <input type="password" id="confirmPassword" class="form-control" minlength="8" required>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary">Actualizar contraseña</button>
                            </div>
                        </form>
                    </div>
                </section>
            `;
        }
    },

    async loadProfile(container) {
        try {
            const response = await httpClient.get('/cliente/perfil', {}, true);
            const perfil = response?.data?.perfil || {};
            
            const emailInput = container.querySelector('#perfilEmail');
            const rolInput = container.querySelector('#perfilRol');
            const farmaciaInput = container.querySelector('#perfilFarmacia');
            const userName = container.querySelector('#userName');
            
            if (emailInput) emailInput.value = perfil.email || '';
            if (rolInput) rolInput.value = perfil.rol || 'CLIENTE';
            if (farmaciaInput) farmaciaInput.value = perfil.farmacia_nombre || 'Cliente del Sistema';
            if (userName) userName.textContent = AuthService.getUserName() || perfil.email || 'Cliente';
        } catch (error) {
            console.error('Error cargando perfil:', error);
            if (typeof Toast !== 'undefined') {
                Toast.error('Error al cargar el perfil');
            }
        }
    },

    setupEventListeners(container) {
        // Logout
        container.querySelectorAll('#logoutBtn, #logoutBtnDropdown, a[href="#"][onclick*="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.logout();
            });
        });

        // Form cambio de contraseña
        const form = container.querySelector('#passwordForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = container.querySelector('#newPassword')?.value;
                const password_confirm = container.querySelector('#confirmPassword')?.value;

                if (!password || !password_confirm) {
                    if (typeof Toast !== 'undefined') Toast.error('Complete todos los campos');
                    return;
                }

                try {
                    await httpClient.put('/cliente/perfil/password', { password, password_confirm }, true);
                    if (typeof Toast !== 'undefined') Toast.success('Contraseña actualizada correctamente');
                    form.reset();
                } catch (error) {
                    console.error('Error actualizando contraseña:', error);
                    if (typeof Toast !== 'undefined') Toast.error('Error al actualizar la contraseña');
                }
            });
        }
    }
};

window.ClientProfilePage = ClientProfilePage;