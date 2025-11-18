// unauthorizedAccess.js - Manejo de acceso no autorizado con mensaje de error
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario no está autenticado
    if (!authManager.isAuthenticated()) {
        // Mostrar mensaje de error en lugar de redirigir
        mostrarMensajeError();
    }
});

function mostrarMensajeError() {
    // Crear el contenedor del mensaje de error
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-access-container';
    errorContainer.innerHTML = `
        <div class="error-access-content">
            <div class="error-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h2>Acceso Restringido</h2>
            <p>Debes iniciar sesión para acceder a esta página.</p>
            <div class="error-actions">
                <a href="index.html" class="btn-primary">Iniciar Sesión</a>
                <a href="registro.html" class="btn-secondary">Registrarse</a>
            </div>
        </div>
    `;

    // Ocultar el contenido principal
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // Insertar el mensaje de error después del header
    const header = document.querySelector('header');
    if (header) {
        header.insertAdjacentElement('afterend', errorContainer);
    }

    // Agregar estilos CSS dinámicamente
    const style = document.createElement('style');
    style.textContent = `
        .error-access-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 120px);
            padding: 2rem;
            background-color: var(--bg-color, #f8f9fa);
        }

        .error-access-content {
            text-align: center;
            background: var(--card-bg, white);
            padding: 3rem 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
        }

        .error-icon {
            font-size: 4rem;
            color: #dc3545;
            margin-bottom: 1.5rem;
        }

        .error-access-content h2 {
            color: var(--text-color, #333);
            margin-bottom: 1rem;
            font-size: 1.8rem;
        }

        .error-access-content p {
            color: var(--text-secondary, #666);
            margin-bottom: 2rem;
            line-height: 1.5;
        }

        .error-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .error-actions .btn-primary,
        .error-actions .btn-secondary {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            min-width: 120px;
        }

        .error-actions .btn-primary {
            background-color: #007bff;
            color: white;
        }

        .error-actions .btn-primary:hover {
            background-color: #0056b3;
        }

        .error-actions .btn-secondary {
            background-color: transparent;
            color: #007bff;
            border: 2px solid #007bff;
        }

        .error-actions .btn-secondary:hover {
            background-color: #007bff;
            color: white;
        }

        @media (max-width: 480px) {
            .error-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}