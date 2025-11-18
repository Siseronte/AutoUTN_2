// js/ui.js

/**
 * Configura los listeners de eventos para elementos comunes de la UI.
 * Esta función se ejecuta una vez, cuando la página carga.
 */
function setupUI() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');

    // 1. Inicializar el módulo darkMode para aplicar el tema guardado y las clases de página.
    darkMode.init();

    // 2. Configurar el menú hamburguesa para móviles
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

}

/**
 * Protege las rutas que requieren autenticación.
 * Si un usuario no autenticado intenta acceder, lo redirige al inicio.
 */
function protegerRutas() {
    const paginasProtegidas = ['mis-autos.html', 'dashboard.html', 'admin-panel.html', 'registrar-entrada.html', 'registrar-salida.html']; // Removido 'reserva.html'
    const paginaActual = window.location.pathname.split('/').pop();

    if (!authManager.isAuthenticated() && paginasProtegidas.includes(paginaActual)) {
        console.warn('Acceso denegado. Redirigiendo al inicio.');
        window.location.href = 'index.html';
    }
}

// Hacemos la función global para poder llamarla desde otros scripts
function actualizarUI() {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const navMenu = document.querySelector('.nav-menu');

    // Limpiamos el contenedor y añadimos el botón de tema, que siempre es visible.
    if (authButtonsContainer) {
        authButtonsContainer.innerHTML = `
            <div class="user-actions">
                <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Cambiar tema">
                    <i class="fas fa-sun theme-icon-sun"></i>
                    <i class="fas fa-moon theme-icon-moon"></i>
                </button>
            </div>
        `;
    }

    if (authManager.isAuthenticated()) {
        // --- El usuario ESTÁ logueado ---
        const userData = authManager.getUserData();

        // 1. Actualizar el header para mostrar el nombre y el botón de logout
        if (authButtonsContainer) {
            const userActionsContainer = authButtonsContainer.querySelector('.user-actions');
            if (userActionsContainer) {
                // Creamos el botón y lo añadimos de forma segura para no borrar el botón de tema
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn-login logout-btn';
                logoutBtn.textContent = 'Cerrar Sesión';
                logoutBtn.addEventListener('click', () => {
                    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                        authManager.logout();
                    }
                });
                userActionsContainer.appendChild(logoutBtn);
            }
        }

        // 2. Cambiar el enlace de "Inicio" para que apunte al Dashboard
        if (navMenu) {
            // Selector corregido: Busca específicamente el enlace 'Inicio' dentro del menú de navegación.
            const inicioLink = navMenu.querySelector('li a[href="index.html"], li a[href="dashboard.html"]');
            if (inicioLink) {
                // Esto asegura que solo el enlace del texto "Inicio" se cambie a "dashboard.html"
                inicioLink.href = 'dashboard.html';
                inicioLink.textContent = 'Inicio';
            }

            // Asegurarse de que los enlaces de reserva y mis-autos estén visibles
            const reservaLink = navMenu?.querySelector('a[href="reserva.html"]');
            if (reservaLink) {
                reservaLink.parentElement.style.display = '';
            }
            const misAutosLink = navMenu?.querySelector('a[href="mis-autos.html"]');
            if (misAutosLink) {
                misAutosLink.parentElement.style.display = '';
            }
        }

        // 3. Si estamos en el dashboard, rellenar la información del usuario
        if (window.location.pathname.endsWith('dashboard.html')) {
            document.querySelectorAll('.user-name').forEach(el => el.textContent = `${userData.nombre} ${userData.apellido}`);
            document.querySelectorAll('.user-legajo').forEach(el => el.textContent = userData.legajo);
            document.querySelectorAll('.user-email').forEach(el => el.textContent = userData.email);
            document.querySelectorAll('.user-tokens').forEach(el => el.textContent = userData.tokens);

            // --- INICIO: Lógica para botones de Cambiar Contraseña y Eliminar Cuenta ---
            const dashboardActionsContainer = document.querySelector('.user-dashboard-actions');
            if (dashboardActionsContainer) {
                dashboardActionsContainer.innerHTML = `
                    <button id="btn-cambiar-password" class="btn-secondary">Cambiar Contraseña</button>
                    <button id="btn-eliminar-cuenta" class="btn-danger">Eliminar Cuenta</button>
                `;

                // Listener para cambiar contraseña
                document.getElementById('btn-cambiar-password').addEventListener('click', async () => {
                    const passwordActual = prompt('Para continuar, ingresa tu contraseña actual:');
                    if (!passwordActual) return;

                    const passwordNueva = prompt('Ingresa tu nueva contraseña:');
                    if (!passwordNueva) return;

                    const passwordNuevaConfirm = prompt('Confirma tu nueva contraseña:');
                    if (passwordNueva !== passwordNuevaConfirm) {
                        alert('Las contraseñas no coinciden.');
                        return;
                    }

                    try {
                        const response = await fetch('http://localhost:3000/api/usuarios/cambiar-password', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ legajo: userData.legajo, passwordActual, passwordNueva })
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (response.ok) authManager.logout(); // Forzar logout para re-loguear con la nueva pass
                    } catch (error) {
                        alert('Error de conexión al cambiar la contraseña.');
                    }
                });

                // Listener para eliminar cuenta
                document.getElementById('btn-eliminar-cuenta').addEventListener('click', async () => {
                    const confirmacion = prompt(`ACCIÓN IRREVERSIBLE.\nPara eliminar tu cuenta, escribe "eliminar ${userData.legajo}" en el campo de abajo.`);
                    if (confirmacion !== `eliminar ${userData.legajo}`) {
                        alert('Confirmación incorrecta. La cuenta no ha sido eliminada.');
                        return;
                    }

                    const password = prompt('Para confirmar, ingresa tu contraseña:');
                    if (!password) return;

                    try {
                        const response = await fetch('http://localhost:3000/api/usuarios/eliminar-cuenta', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ legajo: userData.legajo, password })
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (response.ok) authManager.logout();
                    } catch (error) {
                        alert('Error de conexión al eliminar la cuenta.');
                    }
                });
            }
            // --- FIN: Lógica para botones ---
        }

        // 4. Añadir enlace al panel de administrador si el usuario es admin
        if (userData.rol === 'administrador' && navMenu) {
            // Evitar añadir el enlace si ya existe
            if (!navMenu.querySelector('a[href="admin-panel.html"]')) {
                const adminLi = document.createElement('li');
                adminLi.innerHTML = '<a href="admin-panel.html">Admin Panel</a>';
                navMenu.appendChild(adminLi);
            }
        }


    } else {
        // --- El usuario NO ESTÁ logueado ---
        // Añadimos los botones de Iniciar Sesión y Registrarse
        const paginaActual = window.location.pathname.split('/').pop();
        const esPaginaInicio = paginaActual === 'index.html' || paginaActual === '';
        const esPaginaRegistro = paginaActual === 'registro.html';

        if (authButtonsContainer) {
            const userActionsContainer = authButtonsContainer.querySelector('.user-actions');
            if (userActionsContainer) {
                // En cualquier página que no sea la de inicio, mostramos "Iniciar Sesión"
                if (!esPaginaInicio) {
                    userActionsContainer.insertAdjacentHTML('beforeend', `<a href="index.html" class="btn-login">Iniciar Sesión</a>`);
                }
                // En cualquier página que no sea la de registro, mostramos "Registrarse"
                if (!esPaginaRegistro) {
                    userActionsContainer.insertAdjacentHTML('beforeend', `<a href="registro.html" class="btn-login">Registrarse</a>`);
                }
            }
        }

        // Mostrar enlace de "Reserva" pero ocultar "Mis Autos"
        if (navMenu) {
            const reservaLink = navMenu.querySelector('a[href="reserva.html"]');
            if (reservaLink) {
                reservaLink.parentElement.style.display = ''; // Mostrar Reserva
            }
            const misAutosLink = navMenu.querySelector('a[href="mis-autos.html"]');
            if (misAutosLink) {
                misAutosLink.parentElement.style.display = 'none'; // Ocultar Mis Autos
            }
        }
    }

    // El listener para el botón de tema se añade siempre, al final.
    const themeToggleBtn = document.querySelector('#theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => darkMode.toggle());
    }
}

// Ejecutar las funciones de UI cuando el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', () => {
    protegerRutas(); // Primero, proteger la ruta
    setupUI();
    actualizarUI();
});