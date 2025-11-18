// pageProtection.js - Protección de páginas que requieren autenticación
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si el usuario está autenticado
    if (!authManager.checkAuth()) {
        // Si no está autenticado, redirigir al login
        window.location.href = 'index.html';
        return;
    }

    // Si está autenticado, refrescamos sus datos desde el servidor para asegurar que estén actualizados.
    await authManager.refreshSession();
    actualizarUI(); // Llamamos a actualizarUI después de que los datos se hayan refrescado.
});