// js/guestProtection.js - Protección para páginas de "invitados" (no autenticados)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario ya está autenticado
    if (authManager.isAuthenticated()) {
        // Si está autenticado, no debería estar en la página de login o registro.
        // Lo redirigimos al dashboard.
        window.location.href = 'dashboard.html';
    }
});