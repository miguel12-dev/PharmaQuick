/**
 * PharmaQuick - Recuperar Contraseña
 * Maneja la solicitud de recuperación y cambio de contraseña
 */

(function() {
    'use strict';

    const API_BASE = '/api';

    /**
     * Obtener token de la URL
     */
    function getTokenFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    }

    /**
     * Mostrar mensaje de error
     */
    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        const messageEl = document.getElementById(elementId === 'resetError' ? 'resetErrorMessage' : 'errorMessage');
        
        messageEl.textContent = message;
        errorEl.classList.remove('d-none');
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorEl.classList.add('d-none');
        }, 5000);
    }

    /**
     * Mostrar mensaje de éxito
     */
    function showSuccess(elementId, message) {
        const successEl = document.getElementById(elementId);
        const messageEl = document.getElementById(elementId === 'resetSuccess' ? 'resetSuccessMessage' : 'successMessage');
        
        messageEl.textContent = message;
        successEl.classList.remove('d-none');
    }

    /**
     * Mostrar/ocultar spinner de carga
     */
    function toggleLoading(buttonId, spinnerId, isLoading) {
        const btn = document.getElementById(buttonId);
        const spinner = document.getElementById(spinnerId);
        const btnText = btn.querySelector('span:not(.spinner-border)');
        
        if (isLoading) {
            btn.disabled = true;
            spinner.classList.remove('d-none');
            btnText.classList.add('d-none');
        } else {
            btn.disabled = false;
            spinner.classList.add('d-none');
            btnText.classList.remove('d-none');
        }
    }

    /**
     * Toggle visibilidad de contraseña
     */
    function setupPasswordToggle(toggleBtnId, inputId, iconId) {
        const toggleBtn = document.getElementById(toggleBtnId);
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);

        if (toggleBtn && input && icon) {
            toggleBtn.addEventListener('click', () => {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                icon.classList.toggle('bi-eye');
                icon.classList.toggle('bi-eye-slash');
            });
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    async function handleRecoverSubmit(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showError('recoverError', 'Por favor ingresa tu correo electrónico');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('recoverError', 'Por favor ingresa un correo electrónico válido');
            return;
        }

        toggleLoading('recoverBtn', 'recoverBtnSpinner', true);

        try {
            const response = await fetch(`${API_BASE}/auth.php/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess('recoverSuccess', data.message || 'Si el correo existe, recibirás un enlace para recuperar tu contraseña');
                document.getElementById('recoverForm').reset();
            } else {
                showError('recoverError', data.message || 'Error al solicitar recuperación');
            }
        } catch (error) {
            console.error('Recover error:', error);
            showError('recoverError', 'Error de conexión. Por favor intenta más tarde');
        } finally {
            toggleLoading('recoverBtn', 'recoverBtnSpinner', false);
        }
    }

    /**
     * Cambiar contraseña con token
     */
    async function handleResetSubmit(event) {
        event.preventDefault();
        
        const token = getTokenFromUrl();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!token) {
            showError('resetError', 'Token de recuperación inválido o expirado');
            return;
        }

        if (newPassword.length < 6) {
            showError('resetError', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('resetError', 'Las contraseñas no coinciden');
            return;
        }

        toggleLoading('resetBtn', 'resetBtnSpinner', true);

        try {
            const response = await fetch(`${API_BASE}/auth.php/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    token,
                    password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess('resetSuccess', data.message || 'Contraseña actualizada correctamente');
                document.getElementById('resetForm').reset();
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError('resetError', data.message || 'Error al cambiar contraseña');
            }
        } catch (error) {
            console.error('Reset error:', error);
            showError('resetError', 'Error de conexión. Por favor intenta más tarde');
        } finally {
            toggleLoading('resetBtn', 'resetBtnSpinner', false);
        }
    }

    /**
     * Inicializar la página
     */
    function init() {
        const token = getTokenFromUrl();
        
        if (token) {
            // Modo reset de contraseña (desde email)
            document.getElementById('recoverForm').classList.add('d-none');
            document.getElementById('resetForm').classList.remove('d-none');
            
            // Configurar toggle de contraseñas
            setupPasswordToggle('toggleNewPassword', 'newPassword', 'toggleNewIcon');
            setupPasswordToggle('toggleConfirmPassword', 'confirmPassword', 'toggleConfirmIcon');
            
            // Evento submit
            document.getElementById('resetForm').addEventListener('submit', handleResetSubmit);
        } else {
            // Modo solicitud de recuperación
            document.getElementById('recoverForm').classList.remove('d-none');
            document.getElementById('resetForm').classList.add('d-none');
            
            // Evento submit
            document.getElementById('recoverForm').addEventListener('submit', handleRecoverSubmit);
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();