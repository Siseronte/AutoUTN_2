// c:/Users/User/Desktop/Proyecto Final Integrador/js/auth.js

class AuthManager {
    constructor() {
        this.userData = JSON.parse(localStorage.getItem('userData'));
        this.baseURL = 'http://localhost:3000/api'; // Apunta a nuestro nuevo backend
    }

    // Guardar datos del usuario en localStorage
    setUserData(userData) {
        this.userData = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    // Actualizar datos del usuario (similar a setUserData pero ideal para respuestas parciales)
    updateUserData(updatedUserData) {
        // Primero, obtenemos los datos actuales para no perder ninguna propiedad si la respuesta es parcial.
        const currentData = this.getUserData() || {};
        // Fusionamos los datos actuales con los nuevos. Los nuevos datos (ej: tokens) sobreescriben los viejos.
        const newData = { ...currentData, ...updatedUserData };
        this.setUserData(newData); // Usamos setUserData para guardar los datos fusionados.
    }

    // Obtener datos del usuario
    getUserData() {
        return this.userData || JSON.parse(localStorage.getItem('userData'));
    }

    // Eliminar datos del usuario (logout)
    removeUserData() {
        this.userData = null;
        localStorage.removeItem('userData');
    }

    // Verificar si el usuario está "logueado" (si hay datos guardados)
    isAuthenticated() {
        return !!this.getUserData();
    }

    // Realizar login
    async login(legajo, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ legajo, password })
            });

            const data = await response.json();

            if (response.ok) { // response.ok es true para status 200-299
                this.setUserData(data.user);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    }

    // Realizar logout
    logout() {
        this.removeUserData();
        window.location.href = 'index.html';
    }

    // Verificar autenticación y redirigir si es necesario
    checkAuth() {
        if (!this.isAuthenticated()) {
            // No redirige automáticamente, solo devuelve el estado.
            // La redirección la hará pageProtection.js
            return false;
        }
        return true;
    }

    // Refrescar los datos del usuario desde el servidor
    async refreshSession() {
        if (!this.isAuthenticated()) {
            return; // No hay sesión que refrescar
        }

        const localUserData = this.getUserData();
        try {
            const response = await fetch(`${this.baseURL}/usuarios/${localUserData.legajo}`);
            const serverUserData = await response.json();

            if (response.ok) {
                // Si el servidor responde bien, actualizamos los datos locales
                this.setUserData(serverUserData);
            } else {
                // Si el usuario ya no existe en la BD o hay otro error, cerramos la sesión local.
                console.error('Error al refrescar sesión, cerrando sesión local:', serverUserData.message);
                this.logout();
            }
        } catch (error) {
            console.error('Error de conexión al refrescar sesión:', error);
            // Opcional: podrías decidir si cerrar sesión o no en caso de fallo de red.
        }
    }

}

// Crear instancia global
const authManager = new AuthManager();
