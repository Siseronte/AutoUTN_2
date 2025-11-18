document.addEventListener('DOMContentLoaded', () => {
    const listaVehiculos = document.getElementById('lista-vehiculos');
    const loadingVehiculos = document.getElementById('loading-vehiculos');
    const formRegistrar = document.getElementById('form-registrar-vehiculo');
    const mensajeForm = document.getElementById('mensaje-form');

    const userData = authManager.getUserData();
    if (!userData) {
        // pageProtection.js ya debería haber redirigido, pero es una doble seguridad.
        return;
    }

    // --- FUNCIÓN PARA OBTENER Y MOSTRAR VEHÍCULOS ---
    const cargarVehiculos = async () => {
        loadingVehiculos.style.display = 'block';
        listaVehiculos.innerHTML = ''; // Limpiar lista

        try {
            const response = await fetch(`http://localhost:3000/api/vehiculos?legajo=${userData.legajo}`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar los vehículos.');
            }
            const vehiculos = await response.json();

            loadingVehiculos.style.display = 'none';

            if (vehiculos.length === 0) {
                listaVehiculos.innerHTML = '<p>No tienes vehículos registrados.</p>';
            } else {
                vehiculos.forEach(v => {
                    const li = document.createElement('li');
                    li.className = 'item-vehiculo';
                    li.innerHTML = `
                        <div class="info-vehiculo">
                            <strong>${v.marca} ${v.modelo}</strong> (${v.anio})
                            <span>Patente: ${v.patente} | Color: ${v.color || 'N/A'}</span>
                        </div>
                        <button class="btn-eliminar" data-patente="${v.patente}"><i class="fas fa-trash"></i></button>
                    `;
                    listaVehiculos.appendChild(li);
                });
            }
        } catch (error) {
            loadingVehiculos.textContent = error.message;
        }
    };

    // --- FUNCIÓN PARA REGISTRAR UN NUEVO VEHÍCULO ---
    formRegistrar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formRegistrar);
        const vehiculo = Object.fromEntries(formData.entries());
        vehiculo.legajo_usuario = userData.legajo;

        try {
            const response = await fetch('http://localhost:3000/api/vehiculos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehiculo)
            });
            const data = await response.json();

            mensajeForm.textContent = data.message;
            mensajeForm.className = `message ${response.ok ? 'message-success' : 'message-error'}`;
            mensajeForm.style.display = 'block';

            if (response.ok) {
                formRegistrar.reset();
                cargarVehiculos(); // Recargar la lista de vehículos
            }
            // Si el backend devuelve un 409 (Conflicto), también mostramos el mensaje.
            // Esto es útil para el límite de vehículos.
            if (response.status === 409) {
                // El mensaje ya se habrá mostrado, no es necesario hacer nada más.
            }
        } catch (error) {
            mensajeForm.textContent = 'Error de conexión al registrar.';
            mensajeForm.className = 'message message-error';
            mensajeForm.style.display = 'block';
        }
    });

    // --- FUNCIÓN PARA ELIMINAR UN VEHÍCULO (usando delegación de eventos) ---
    listaVehiculos.addEventListener('click', async (e) => {
        // Verificar si el clic fue en un botón de eliminar o su ícono
        const btnEliminar = e.target.closest('.btn-eliminar');
        if (!btnEliminar) return;

        const patente = btnEliminar.dataset.patente;
        if (!confirm(`¿Estás seguro de que quieres eliminar el vehículo con patente ${patente}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/vehiculos/${patente}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            alert(data.message);
            cargarVehiculos(); // Recargar la lista

        } catch (error) {
            alert(`Error al eliminar: ${error.message}`);
        }
    });

    // Carga inicial de vehículos al entrar a la página
    cargarVehiculos();
});