const ProfilePage = {
    async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        this.renderLayout(container);
        await this.loadProfile(container);
        this.setupEventListeners(container);
    },

    renderLayout(container) {
        const template = document.getElementById('template-layout');
        container.innerHTML = template ? template.innerHTML : '';
        container.querySelector('#pageTitle').textContent = 'Perfil';
        container.querySelector('.page-content').innerHTML = `
            <section class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Datos del usuario</h5>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6"><label class="form-label">Email</label><input id="perfilEmail" class="form-control" readonly></div>
                        <div class="col-md-3"><label class="form-label">Rol</label><input id="perfilRol" class="form-control" readonly></div>
                        <div class="col-md-3"><label class="form-label">Farmacia</label><input id="perfilFarmacia" class="form-control" readonly></div>
                    </div>
                    <h5 class="fw-bold mb-3">Cambio de contraseña</h5>
                    <form id="passwordForm" class="row g-3">
                        <div class="col-md-6"><label class="form-label">Nueva contraseña</label><input type="password" id="newPassword" class="form-control" minlength="8" required></div>
                        <div class="col-md-6"><label class="form-label">Confirmar contraseña</label><input type="password" id="confirmPassword" class="form-control" minlength="8" required></div>
                        <div class="col-12"><button type="submit" class="btn btn-primary">Actualizar contraseña</button></div>
                    </form>
                </div>
            </section>
        `;
    },

    async loadProfile(container) {
        const response = await httpClient.get('/perfil');
        const perfil = response?.data?.perfil || {};
        container.querySelector('#perfilEmail').value = perfil.email || '';
        container.querySelector('#perfilRol').value = perfil.rol || '';
        container.querySelector('#perfilFarmacia').value = perfil.farmacia_nombre || '';
        const userName = container.querySelector('#userName');
        if (userName) userName.textContent = AuthService.getUserName() || perfil.email || 'Usuario';
    },

    setupEventListeners(container) {
        container.querySelectorAll('#logoutBtn, #logoutBtnDropdown').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.logout();
            });
        });

        const form = container.querySelector('#passwordForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = container.querySelector('#newPassword').value;
            const password_confirm = container.querySelector('#confirmPassword').value;
            await httpClient.put('/perfil/password', { password, password_confirm });
            if (typeof Toast !== 'undefined') Toast.success('Contraseña actualizada');
            form.reset();
        });
    }
};

window.ProfilePage = ProfilePage;
