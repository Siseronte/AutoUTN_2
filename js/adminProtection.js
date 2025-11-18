// adminProtection.js - Protección de páginas que requieren rol de administrador
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar si el usuario está autenticado
    if (!authManager.isAuthenticated()) {
        // Si no está autenticado, redirigir al login
        window.location.href = 'index.html';
        return;
    }

    // 2. Si está autenticado, verificar si es administrador
    const userData = authManager.getUserData();
    if (userData.rol !== 'administrador') {
        alert('Acceso denegado. Esta página es solo para administradores.');
        window.location.href = 'dashboard.html'; // Redirigir a su dashboard normal
        return;
    }

    // 3. Si es admin, refrescar sus datos y actualizar la UI
    await authManager.refreshSession();
    actualizarUI();
});