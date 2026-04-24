const API_BASE = '/api';

const App = {
    session: {
        isAuthenticated: false,
        usuario: null,
        farmaciaId: null,
        token: null
    },

    init() {
        this.checkSession();
    },

    checkSession() {
        const storedSession = localStorage.getItem('pharmaSession');
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                if (session.farmaciaId && session.token) {
                    this.session = session;
                    this.session.isAuthenticated = true;
                    const path = window.location.pathname;
                    if (path === '/' || path === '/login.html' || path === '/login') {
                        this.redirectToDashboard();
                    }
                }
            } catch (e) {
                this.clearSession();
            }
        }
    },

    setSession(data) {
        const session = {
            isAuthenticated: true,
            usuario: data.usuario,
            farmaciaId: data.farmacia_id,
            token: data.token,
            nombre: data.nombre
        };
        localStorage.setItem('pharmaSession', JSON.stringify(session));
        this.session = session;
    },

    clearSession() {
        localStorage.removeItem('pharmaSession');
        this.session = {
            isAuthenticated: false,
            usuario: null,
            farmaciaId: null,
            token: null
        };
    },

    async login(email, password) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            this.setSession(data.data);
            return { success: true, data: data.data };
        } else {
            throw new Error(data.message || 'Error en la autenticación');
        }
    },

    logout() {
        this.clearSession();
        window.location.href = '/index.html';
    },

    redirectToDashboard() {
        window.location.href = '/pages/dashboard.html';
    },

    getFarmaciaId() {
        return this.session.farmaciaId;
    },

    requireAuth() {
        if (!this.session.isAuthenticated) {
            window.location.href = '/index.html';
            return false;
        }
        return true;
    }
};

const Login = {
    form: null,
    btn: null,
    errorDiv: null,
    successDiv: null,
    toggleBtn: null,

    init() {
        this.form = document.getElementById('loginForm');
        this.btn = document.getElementById('loginBtn');
        this.errorDiv = document.getElementById('loginError');
        this.successDiv = document.getElementById('loginSuccess');
        this.toggleBtn = document.getElementById('togglePassword');

        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', this.togglePassword.bind(this));
        }
    },

    async handleSubmit(e) {
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
            const result = await App.login(email, password);
            this.showSuccess('Autenticación exitosa, redireccionando...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    },

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('toggleIcon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'bi bi-eye';
        }
    },

    setLoading(loading) {
        const btnText = document.getElementById('loginBtnText');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        const inputs = this.form.querySelectorAll('input');

        if (loading) {
            btnText.textContent = 'Iniciando...';
            btnSpinner.classList.remove('d-none');
            this.btn.disabled = true;
            inputs.forEach(input => input.disabled = true);
        } else {
            btnText.textContent = 'Iniciar Sesión';
            btnSpinner.classList.add('d-none');
            this.btn.disabled = false;
            inputs.forEach(input => input.disabled = false);
        }
    },

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorDiv.classList.remove('d-none');
        this.successDiv.classList.add('d-none');
    },

    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        this.successDiv.classList.remove('d-none');
        this.errorDiv.classList.add('d-none');
    },

    hideMessages() {
        this.errorDiv.classList.add('d-none');
        this.successDiv.classList.add('d-none');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        Login.init();
    } else {
        App.init();
    }
});