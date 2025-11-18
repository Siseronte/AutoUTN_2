document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const monthElement = document.querySelector('.current-month');
    const prevMonthButton = document.querySelector('.prev-month');
    const nextMonthButton = document.querySelector('.next-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const fechaSeleccionadaSpan = document.getElementById('fecha-seleccionada');
    const listaReservasDia = document.getElementById('lista-reservas-dia');
    const loadingReservas = document.getElementById('loading-reservas');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const turnoFilterContainer = document.getElementById('turno-filter-container');
    const turnoFilterSelect = document.getElementById('filter-turno-select');
    const estadoFilterSelect = document.getElementById('filter-estado-select'); // Nuevo selector de estado
    const sortReservasSelect = document.getElementById('sort-reservas-select'); // Nuevo selector
    const loadingUsuarios = document.getElementById('loading-usuarios');
    const btnDescargarPdf = document.getElementById('btn-descargar-pdf');
    const searchUserInput = document.getElementById('search-user-input');
    // Elementos para Gestión de Vehículos
    const listaVehiculosAdmin = document.getElementById('lista-vehiculos-admin');
    const loadingVehiculos = document.getElementById('loading-vehiculos');
    // Elementos para Mensajes de Contacto
    const listaContactosPendientes = document.getElementById('lista-contactos-pendientes');
    const listaContactosRespondidos = document.getElementById('lista-contactos-respondidos');
    const loadingContactosPendientes = document.getElementById('loading-contactos-pendientes');
    const loadingContactosRespondidos = document.getElementById('loading-contactos-respondidos');
    const searchPendientesInput = document.getElementById('search-pendientes-input');
    const searchRespondidosInput = document.getElementById('search-respondidos-input');
    // Nuevos botones de orden para los mensajes de contacto
    const sortPendientesBtn = document.getElementById('sort-pendientes-btn');
    const sortRespondidosBtn = document.getElementById('sort-respondidos-btn');
    // Elementos para Gestión de Capacidad
    const capacidadInput = document.getElementById('capacidad-input');
    const btnGuardarCapacidad = document.getElementById('btn-guardar-capacidad');
    const loadingCapacidad = document.getElementById('loading-capacidad');
    const capacidadFeedback = document.getElementById('capacidad-feedback');
    const capacidadActualValor = document.getElementById('capacidad-actual-valor'); // Nuevo span para mostrar el valor




    // Elementos del Modal de Edición de Usuario
    const modalOverlay = document.getElementById('edit-user-modal-overlay');
    const modal = document.getElementById('edit-user-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const editUserForm = document.getElementById('edit-user-form');
    const legajoInput = document.getElementById('edit-user-legajo');
    const nombreInput = document.getElementById('edit-user-nombre');
    const apellidoInput = document.getElementById('edit-user-apellido');
    const tokensInput = document.getElementById('edit-user-tokens');
    const saveChangesBtn = document.getElementById('save-user-changes-btn');
    const deleteUserBtn = document.getElementById('delete-user-btn');

    // Elementos del Modal de Respuesta de Contacto
    const replyModalOverlay = document.getElementById('reply-contact-modal-overlay');
    const closeReplyModalBtn = document.getElementById('close-reply-modal-btn');
    const replyContactIdInput = document.getElementById('reply-contact-id');
    const replyContactEmailP = document.getElementById('reply-contact-email');
    const replyContactTemaP = document.getElementById('reply-contact-tema');
    const replyContactMensajeTextarea = document.getElementById('reply-contact-mensaje');
    const replyCharCounter = document.getElementById('reply-char-counter');
    const sendReplyBtn = document.getElementById('send-reply-btn');

    let currentDate = new Date();
    currentDate.setDate(1);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let allUsers = []; // Almacenará todos los usuarios para el filtrado
    let allVehiculos = []; // Almacenará todos los vehículos para el filtrado
    let reservasDelDia = []; // Almacenará las reservas del día seleccionado para filtrar
    let allContactos = []; // Almacenará todos los mensajes de contacto para el filtrado
    let reservasMostradas = []; // Almacenará las reservas actualmente visibles (filtradas o no)
    // Variables para mantener el estado del orden de los mensajes
    let sortPendientesAsc = false; // false = DESC (más nuevo primero), true = ASC (más viejo primero)
    let sortRespondidosAsc = false;

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // --- RENDERIZADO DEL CALENDARIO ---
    async function renderCalendar() {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // 1. Obtener los días con reservas para el mes actual
        let diasConReservas = [];
        try {
            const response = await fetch(`http://localhost:3000/api/admin/fechas-con-reservas?anio=${currentYear}&mes=${currentMonth + 1}`);
            if (response.ok) diasConReservas = await response.json();
        } catch (error) {
            console.error("Error al cargar días con reservas:", error);
        }

        monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        calendarGrid.innerHTML = '';

        // Corrección: El calendario debe empezar en Lunes para coincidir con la lógica de cálculo.
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayNames.forEach(day => {
            const dayNameCell = document.createElement('div');
            dayNameCell.classList.add('day-name');
            dayNameCell.textContent = day;
            calendarGrid.appendChild(dayNameCell);
        });
        
        // Corrección: El cálculo para los días vacíos del inicio del mes.
        const startingDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; // Lunes = 0, Domingo = 6
        for (let i = 0; i < startingDay; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.textContent = i;
            const date = new Date(currentYear, currentMonth, i);
            const fechaISO = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // 2. Comprobar si el día actual está en la lista de días con reservas
            if (diasConReservas.includes(fechaISO)) {
                dayCell.classList.add('selectable-day'); // Es seleccionable
                dayCell.addEventListener('click', () => {
                    const selectedDay = document.querySelector('.selected');
                    if (selectedDay) {
                        selectedDay.classList.remove('selected');
                    }
                    dayCell.classList.add('selected');
                    fechaSeleccionadaSpan.textContent = date.toLocaleDateString('es-AR');
                    cargarReservasPorFecha(fechaISO);
                });
            } else {
                dayCell.classList.add('disabled-day'); // No es seleccionable
            }

            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            calendarGrid.appendChild(dayCell);
        }
    }

    function updateNavButtons() {
        // Lógica restaurada y simplificada para los límites del calendario.
        const now = new Date();
        // Fecha del primer día del mes actual real.
        const currentRealMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // Fecha del primer día del mes siguiente real.
        const nextRealMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Deshabilitar "anterior" si el calendario está en el mes actual o antes.
        if (currentYear < currentRealMonthDate.getFullYear() || (currentYear === currentRealMonthDate.getFullYear() && currentMonth <= currentRealMonthDate.getMonth())) {
            prevMonthButton.disabled = true;
        } else {
            prevMonthButton.disabled = false;
        }

        // Deshabilitar "siguiente" si el calendario está en el mes siguiente al actual.
        if (currentYear > nextRealMonthDate.getFullYear() || (currentYear === nextRealMonthDate.getFullYear() && currentMonth >= nextRealMonthDate.getMonth())) {
            nextMonthButton.disabled = true;
        } else {
            nextMonthButton.disabled = false;
        }
    }

    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        // Corrección: Llamar a updateNavButtons aquí también.
        updateNavButtons();
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        // Corrección: Llamar a updateNavButtons ANTES de renderCalendar para evitar condiciones de carrera.
        updateNavButtons();
        renderCalendar();
    });

    // --- GESTIÓN DE RESERVAS ---
    async function cargarReservasPorFecha(fecha) {
        loadingReservas.style.display = 'block'; // Muestra el loader
        listaReservasDia.innerHTML = ''; // Limpia la lista anterior

        try {
            // Llama al nuevo endpoint del backend
            const response = await fetch(`http://localhost:3000/api/admin/reservas-por-fecha?fecha=${fecha}`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar las reservas.');
            }
            reservasDelDia = await response.json(); // Guardamos las reservas en la variable global
            loadingReservas.style.display = 'none'; // Oculta el loader

            if (reservasDelDia.length === 0) {
                listaReservasDia.innerHTML = '<li>No hay reservas para este día.</li>';
                turnoFilterContainer.style.display = 'none'; // Ocultar filtro si no hay reservas
            } else {
                reservasMostradas = reservasDelDia; // Guardar estado inicial
                renderizarListaReservas(reservasMostradas); // Renderizar la lista completa inicialmente
                popularFiltroTurnos(); // Popular el dropdown de filtro de turnos
                popularFiltroEstado(); // Popular el nuevo dropdown de estado
                popularFiltroOrden(); // Popular el nuevo dropdown de orden
                turnoFilterContainer.style.display = 'block'; // Mostrar el filtro
            }
        } catch (error) {
            loadingReservas.style.display = 'none';
            reservasMostradas = [];
            listaReservasDia.innerHTML = `<li>Error: ${error.message}</li>`;
            turnoFilterContainer.style.display = 'none';
        }
    }

    // Nueva función para renderizar la lista de reservas (reutilizable)
    function renderizarListaReservas(reservas) {
        listaReservasDia.innerHTML = '';
        if (reservas.length === 0) {
            listaReservasDia.innerHTML = '<li>No se encontraron reservas para el filtro aplicado.</li>';
            return;
        }

        const turnos = { 1: 'Mañana', 2: 'Tarde', 3: 'Noche' };
        reservas.forEach(reserva => {
            // Determinar si se debe mostrar el botón de finalizar
            const puedeFinalizar = reserva.estado === 'activa' || reserva.estado === 'en uso';
            const botonFinalizarHTML = puedeFinalizar
                ? `<button class="btn-finalizar-admin" data-id-reserva="${reserva.id_reserva}" title="Finalizar esta reserva">
                       <i class="fas fa-check-circle"></i> Finalizar
                   </button>`
                : '';

            const li = document.createElement('li');
            // Añadimos una clase específica para el nuevo estilo de tarjeta
            li.className = 'reserva-item-admin'; 
            li.dataset.idReserva = reserva.id_reserva; // Añadimos un data-attribute al <li>
            li.innerHTML = `
                <div class="reserva-main-info">
                    <div class="reserva-usuario">
                        <i class="fas fa-user"></i>
                        <span>${reserva.nombre} ${reserva.apellido}</span>
                        <span class="reserva-legajo">(Leg: ${reserva.legajo_usuario})</span>
                    </div>
                    <div class="reserva-vehiculo">
                        <i class="fas fa-car"></i>
                        <span>${reserva.patente_vehiculo}</span>
                    </div>
                </div>
                <div class="reserva-details">
                    <span class="reserva-turno"><i class="fas fa-clock"></i> ${turnos[reserva.horario]}</span>
                    <span class="reserva-estado-badge estado-${reserva.estado.replace(/ /g, '-')}">${reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}</span>
                    ${botonFinalizarHTML}
                </div>
            `;
            listaReservasDia.appendChild(li);
        });
    }

    // Nueva función para llenar el <select> con los turnos
    function popularFiltroTurnos() {
        turnoFilterSelect.innerHTML = `
            <option value="all">Todos los turnos</option>
            <option value="1">Mañana (08:00 - 13:00)</option>
            <option value="2">Tarde (13:00 - 18:00)</option>
            <option value="3">Noche (18:00 - 23:00)</option>
        `;
    }

    // Nueva función para llenar el <select> de estado
    function popularFiltroEstado() {
        estadoFilterSelect.innerHTML = `
            <option value="all">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="en uso">En uso</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
        `;
    }

    // Nueva función para llenar el <select> de ordenamiento
    function popularFiltroOrden() {
        sortReservasSelect.innerHTML = `
            <option value="legajo-asc">Legajo (Ascendente)</option>
            <option value="legajo-desc">Legajo (Descendente)</option>
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="apellido-asc">Apellido (A-Z)</option>
            <option value="apellido-desc">Apellido (Z-A)</option>
        `;
    }

    // Función centralizada para filtrar y ordenar
    function aplicarFiltrosYOrden() {
        const turnoSeleccionado = turnoFilterSelect.value;
        const estadoSeleccionado = estadoFilterSelect.value;
        const ordenSeleccionado = sortReservasSelect.value;

        // 1. Copiamos el array original para no modificarlo
        let reservasProcesadas = [...reservasDelDia];

        // 2. Filtrar por turno (si no es 'todos')
        if (turnoSeleccionado !== 'all') {
            reservasProcesadas = reservasProcesadas.filter(r => r.horario.toString() === turnoSeleccionado);
        }

        // 3. Filtrar por estado (si no es 'todos')
        if (estadoSeleccionado !== 'all') {
            reservasProcesadas = reservasProcesadas.filter(r => r.estado === estadoSeleccionado);
        }

        // 4. Ordenar el resultado filtrado
        reservasProcesadas.sort((a, b) => {
            switch (ordenSeleccionado) {
                case 'legajo-asc':
                    return a.legajo_usuario - b.legajo_usuario;
                case 'legajo-desc':
                    return b.legajo_usuario - a.legajo_usuario;
                case 'apellido-asc':
                    return a.apellido.localeCompare(b.apellido);
                case 'apellido-desc':
                    return b.apellido.localeCompare(a.apellido);
                case 'nombre-asc':
                    return a.nombre.localeCompare(b.nombre);
                case 'nombre-desc':
                    return b.nombre.localeCompare(a.nombre);
                default:
                    return a.legajo_usuario - b.legajo_usuario; // Orden por defecto
            }
        });

        // 5. Actualizar la lista visible y renderizar
        reservasMostradas = reservasProcesadas;
        renderizarListaReservas(reservasMostradas);
    }

    // Event listeners para todos los selectores
    turnoFilterSelect.addEventListener('change', aplicarFiltrosYOrden);
    estadoFilterSelect.addEventListener('change', aplicarFiltrosYOrden);
    sortReservasSelect.addEventListener('change', aplicarFiltrosYOrden);

    // --- FINALIZAR RESERVA (ADMIN) ---
    // Usamos delegación de eventos en la lista de reservas del día
    listaReservasDia.addEventListener('click', async (e) => {
        const finalizarBtn = e.target.closest('.btn-finalizar-admin');
        if (!finalizarBtn) return;

        const idReserva = finalizarBtn.dataset.idReserva;
        if (!confirm(`¿Estás seguro de que deseas finalizar la reserva ID: ${idReserva}? Esta acción no se puede deshacer.`)) {
            return;
        }

        finalizarBtn.disabled = true;
        finalizarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`http://localhost:3000/api/admin/reservas/${idReserva}/finalizar`, {
                method: 'PUT'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            alert(result.message);

            // Actualizar la UI sin recargar toda la lista
            const itemReserva = listaReservasDia.querySelector(`li[data-id-reserva='${idReserva}']`);
            if (itemReserva) {
                // Cambiar el badge de estado
                const badge = itemReserva.querySelector('.reserva-estado-badge');
                badge.textContent = 'Finalizada';
                badge.className = 'reserva-estado-badge estado-finalizada';

                // Eliminar el botón de finalizar
                finalizarBtn.remove();
            }

        } catch (error) {
            alert(`Error: ${error.message}`);
            finalizarBtn.disabled = false;
            finalizarBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar';
        }
    });


    // --- GENERACIÓN DE PDF ---
    function generarPDFReservas() {
        if (reservasMostradas.length === 0) {
            alert('No hay reservas para generar el PDF.');
            return;
        }

        // Se instancia jsPDF. El objeto global `jspdf` es creado por la librería cargada en el HTML.
        const doc = new jspdf.jsPDF();

        const fecha = fechaSeleccionadaSpan.textContent;
        const turnoSeleccionado = turnoFilterSelect.options[turnoFilterSelect.selectedIndex].text;

        // Título del documento
        doc.setFontSize(18);
        doc.text('Reporte de Reservas - AutoUTN', 14, 22);
        doc.setFontSize(12);
        doc.text(`Fecha: ${fecha}`, 14, 30);
        doc.text(`Turno: ${turnoSeleccionado}`, 14, 36);

        // Definir columnas y filas para la tabla
        const head = [['Legajo', 'Nombre', 'Apellido', 'Patente', 'Estado']];
        const body = reservasMostradas.map(r => [
            r.legajo_usuario,
            r.nombre,
            r.apellido,
            r.patente_vehiculo,
            r.estado
        ]);

        // Con el plugin cargado correctamente, el método .autoTable() se añade a la instancia `doc`.
        doc.autoTable({
            head: head,
            body: body,
            startY: 45 // Posición inicial de la tabla
        });

        // Descargar el PDF
        doc.save(`reservas_${fecha.replace(/\//g, '-')}_${turnoSeleccionado.split(' ')[0]}.pdf`);
    }

    btnDescargarPdf.addEventListener('click', generarPDFReservas);
    // --- GESTIÓN DE USUARIOS ---
    async function cargarTodosLosUsuarios() {
        loadingUsuarios.style.display = 'block';
        listaUsuarios.innerHTML = '';

        try {
            const response = await fetch('http://localhost:3000/api/admin/usuarios');
            if (!response.ok) throw new Error('Error al cargar los usuarios.');

            allUsers = await response.json();
            loadingUsuarios.style.display = 'none';
            renderizarUsuarios(allUsers);

        } catch (error) {
            loadingUsuarios.style.display = 'none';
            listaUsuarios.innerHTML = `<li>${error.message}</li>`;
        }
    }

    function renderizarUsuarios(users) {
        listaUsuarios.innerHTML = '';
        if (users.length === 0) {
            listaUsuarios.innerHTML = '<li>No se encontraron usuarios.</li>';
            return;
        }

        users.forEach(u => {
            const li = document.createElement('li');
            li.dataset.legajo = u.legajo; // Guardamos el legajo en el <li> para futuras referencias
            li.className = 'usuario-item-admin'; // Añadimos clase para el nuevo estilo
            li.innerHTML = `
                <div class="usuario-main-info">
                    <div class="usuario-nombre">
                        <i class="fas fa-user-circle"></i>
                        <span>${u.apellido}, ${u.nombre}</span>
                        <span class="usuario-legajo">(Leg: ${u.legajo})</span>
                    </div>
                    <div class="usuario-contacto">
                        <i class="fas fa-envelope"></i>
                        <span>${u.email}</span>
                    </div>
                </div>
                <div class="usuario-stats">
                    <button class="btn-editar-usuario" 
                            data-legajo="${u.legajo}" 
                            data-nombre="${u.nombre}" 
                            data-apellido="${u.apellido}" 
                            data-tokens="${u.tokens}">
                        Editar
                    </button>
                    <span class="usuario-tokens"><i class="fas fa-coins"></i> 
                        <span class="tokens-count">${u.tokens}</span> Tokens
                    </span>
                </div>
            `;
            listaUsuarios.appendChild(li);
        });
    }

    // --- BÚSQUEDA DE USUARIOS ---
    searchUserInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (!searchTerm) {
            renderizarUsuarios(allUsers);
            return;
        }

        const filteredUsers = allUsers.filter(user =>
            user.nombre.toLowerCase().includes(searchTerm) ||
            user.apellido.toLowerCase().includes(searchTerm) ||
            user.legajo.toString().includes(searchTerm)
        );

        renderizarUsuarios(filteredUsers);
    });

    // --- GESTIÓN DEL MODAL DE EDICIÓN DE USUARIO ---

    // Abrir modal (usando delegación de eventos)
    listaUsuarios.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-editar-usuario')) {
            const button = e.target;
            // Llenar el formulario del modal con los datos del botón
            legajoInput.value = button.dataset.legajo;
            nombreInput.value = button.dataset.nombre;
            apellidoInput.value = button.dataset.apellido;
            tokensInput.value = button.dataset.tokens;
            
            // Mostrar el modal
            modalOverlay.style.display = 'flex';
        }
    });

    // Cerrar modal
    function closeModal() {
        modalOverlay.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) { // Si se hace clic en el fondo gris
            closeModal();
        }
    });

    // Guardar cambios del usuario
    saveChangesBtn.addEventListener('click', async () => {
        saveChangesBtn.disabled = true;
        saveChangesBtn.textContent = 'Guardando...';

        const legajo = legajoInput.value;
        const updatedData = {
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            tokens: parseInt(tokensInput.value, 10)
        };

        try {
            const response = await fetch(`http://localhost:3000/api/admin/usuarios/${legajo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            alert(result.message);

            // Actualizar la UI al instante (sin recargar)
            const userLi = listaUsuarios.querySelector(`li[data-legajo='${legajo}']`);
            if (userLi) {
                userLi.querySelector('.usuario-nombre span:first-of-type').textContent = `${updatedData.apellido}, ${updatedData.nombre}`;
                userLi.querySelector('.tokens-count').textContent = updatedData.tokens;
                const editBtn = userLi.querySelector('.btn-editar-usuario');
                editBtn.dataset.nombre = updatedData.nombre;
                editBtn.dataset.apellido = updatedData.apellido;
                editBtn.dataset.tokens = updatedData.tokens;
            }
            closeModal();

        } catch (error) {
            alert(`Error al guardar: ${error.message}`);
        } finally {
            saveChangesBtn.disabled = false;
            saveChangesBtn.textContent = 'Guardar Cambios';
        }
    });

    // Eliminar usuario
    deleteUserBtn.addEventListener('click', async () => {
        const legajo = legajoInput.value;
        const nombreCompleto = `${nombreInput.value} ${apellidoInput.value}`;

        if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${nombreCompleto} (Legajo: ${legajo})? Esta acción es PERMANENTE y no se puede deshacer.`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/usuarios/${legajo}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert(result.message);
                // Eliminar el elemento de la UI
                const userLi = listaUsuarios.querySelector(`li[data-legajo='${legajo}']`);
                if (userLi) userLi.remove();
                closeModal();
            } catch (error) {
                alert(`Error al eliminar: ${error.message}`);
            }
        }
    });

    // --- GESTIÓN DE VEHÍCULOS ---
    async function cargarTodosLosVehiculos() {
        loadingVehiculos.style.display = 'block';
        listaVehiculosAdmin.innerHTML = '';

        try {
            const response = await fetch('http://localhost:3000/api/admin/vehiculos');
            if (!response.ok) throw new Error('Error al cargar los vehículos.');

            allVehiculos = await response.json();
            loadingVehiculos.style.display = 'none';
            renderizarVehiculos(allVehiculos);

        } catch (error) {
            loadingVehiculos.style.display = 'none';
            listaVehiculosAdmin.innerHTML = `
                <li class="empty-list-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${error.message}</span>
                </li>`;
        }
    }

    function renderizarVehiculos(vehiculos) {
        listaVehiculosAdmin.innerHTML = '';
        if (vehiculos.length === 0) {
            listaVehiculosAdmin.innerHTML = `
                <li class="empty-list-message">
                    <i class="fas fa-car-alt"></i>
                    <span>No se encontraron vehículos.</span>
                </li>`;
            return;
        }

        vehiculos.forEach(v => {
            const li = document.createElement('li');
            li.className = 'vehiculo-item-admin';
            li.innerHTML = `
                <div class="vehiculo-main-info">
                    <div class="vehiculo-info">
                        <i class="fas fa-car"></i>
                        <span class="vehiculo-patente">${v.patente}</span>
                        <span>${v.marca} ${v.modelo} (${v.anio})</span>
                    </div>
                    <div class="vehiculo-propietario">
                        <i class="fas fa-user"></i>
                        <span class="vehiculo-propietario-nombre">${v.nombre} ${v.apellido}</span>
                        <span class="vehiculo-legajo">(Leg: ${v.legajo_usuario})</span>
                    </div>
                </div>
                <div class="vehiculo-details">
                    <span class="vehiculo-color"><i class="fas fa-palette"></i> ${v.color || 'N/A'}</span>
                    <!-- Aquí podrías añadir botones de acción si fueran necesarios, ej. eliminar -->
                </div>
            `;
            listaVehiculosAdmin.appendChild(li);
        });
    }

    // --- BÚSQUEDA DE VEHÍCULOS ---
    const searchVehiculoInput = document.getElementById('search-vehiculo-input');
    searchVehiculoInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (!searchTerm) {
            renderizarVehiculos(allVehiculos);
            return;
        }

        const filteredVehiculos = allVehiculos.filter(vehiculo =>
            vehiculo.patente.toLowerCase().includes(searchTerm) ||
            vehiculo.modelo.toLowerCase().includes(searchTerm) ||
            vehiculo.marca.toLowerCase().includes(searchTerm) ||
            vehiculo.nombre.toLowerCase().includes(searchTerm) ||
            vehiculo.apellido.toLowerCase().includes(searchTerm)
        );
        renderizarVehiculos(filteredVehiculos);
    });

    // --- GESTIÓN DE MENSAJES DE CONTACTO ---
    async function cargarMensajesDeContacto() {
        loadingContactosPendientes.style.display = 'block';
        loadingContactosRespondidos.style.display = 'block';
        listaContactosPendientes.innerHTML = '';
        listaContactosRespondidos.innerHTML = '';

        try {
            const response = await fetch('http://localhost:3000/api/admin/contactos');
            if (!response.ok) throw new Error('Error al cargar los mensajes.');

            allContactos = await response.json();
            
            // Filtrar y renderizar en las listas correspondientes
            const mensajesPendientes = allContactos.filter(msg => !msg.respondido);
            const mensajesRespondidos = allContactos.filter(msg => msg.respondido);

            // Ordenar y renderizar
            ordenarYRenderizarMensajes(mensajesPendientes, listaContactosPendientes, sortPendientesAsc);
            ordenarYRenderizarMensajes(mensajesRespondidos, listaContactosRespondidos, sortRespondidosAsc);

        } catch (error) {
            listaContactosPendientes.innerHTML = `<li>${error.message}</li>`;
            listaContactosRespondidos.innerHTML = `<li>${error.message}</li>`;
        } finally {
            loadingContactosPendientes.style.display = 'none';
            loadingContactosRespondidos.style.display = 'none';
        }
    }

    // Nueva función para ordenar y luego renderizar los mensajes
    function ordenarYRenderizarMensajes(mensajes, listaElement, ascendente) {
        // Ordena el array de mensajes basándose en la fecha
        mensajes.sort((a, b) => {
            const fechaA = new Date(a.fecha_envio);
            const fechaB = new Date(b.fecha_envio);
            return ascendente ? fechaA - fechaB : fechaB - fechaA;
        });
        renderizarMensajes(mensajes, listaElement);
    }
    function renderizarMensajes(mensajes, listaElement) {
        listaElement.innerHTML = '';
        if (mensajes.length === 0) {
            listaElement.innerHTML = `
                <li class="empty-list-message">
                    <i class="fas fa-info-circle"></i>
                    <span>No hay mensajes en esta categoría.</span>
                </li>`;
            return;
        }

        mensajes.forEach(msg => {
            const li = document.createElement('li');
            li.className = 'contacto-item-admin';
            const fechaFormateada = new Date(msg.fecha_envio).toLocaleString('es-AR');

            // Determinar el estado del botón y el texto del indicador de respuesta
            const esRespondido = msg.respondido;
            const botonAccion = esRespondido
                ? `<button class="btn-ver-respuesta" data-id-contacto="${msg.id_contacto}"><i class="fas fa-eye"></i> Ver Respuesta</button>`
                : `<button class="btn-responder-contacto" data-id-contacto="${msg.id_contacto}"><i class="fas fa-reply"></i> Responder</button>`;

            li.innerHTML = `
                <div class="contacto-header">
                    <div class="contacto-remitente">
                        <i class="fas fa-envelope-open-text"></i>
                        <span>${msg.email}</span>
                    </div>
                    <span class="contacto-fecha">${fechaFormateada}</span>
                </div>
                <div class="contacto-body">
                    <p class="contacto-tema">
                        <i class="fas fa-tag"></i>
                        ${msg.tema}
                    </p>
                    <div class="contacto-mensaje-wrapper">
                        <p class="contacto-mensaje">${msg.mensaje}</p>
                    </div>
                </div>
                <div class="contacto-actions">
                    <button class="btn-toggle-mensaje"><i class="fas fa-chevron-down"></i> Ver más</button>
                    ${botonAccion}
                </div>
                <div class="respuesta-container">
                    <!-- La respuesta se cargará aquí dinámicamente -->
                </div>
            `;
            listaElement.appendChild(li);
        });
    }


    // Búsqueda de mensajes PENDIENTES
    searchPendientesInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const mensajesPendientes = allContactos.filter(msg => !msg.respondido);

        const filtered = mensajesPendientes.filter(msg =>
            msg.email.toLowerCase().includes(searchTerm) ||
            msg.tema.toLowerCase().includes(searchTerm) ||
            msg.mensaje.toLowerCase().includes(searchTerm)
        );

        ordenarYRenderizarMensajes(filtered, listaContactosPendientes, sortPendientesAsc);
    });

    // Búsqueda de mensajes RESPONDIDOS
    searchRespondidosInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const mensajesRespondidos = allContactos.filter(msg => msg.respondido);

        const filtered = mensajesRespondidos.filter(msg =>
            msg.email.toLowerCase().includes(searchTerm) ||
            msg.tema.toLowerCase().includes(searchTerm) ||
            msg.mensaje.toLowerCase().includes(searchTerm)
        );

        ordenarYRenderizarMensajes(filtered, listaContactosRespondidos, sortRespondidosAsc);
    });

    // --- Lógica de ordenamiento de mensajes (con protección) ---
    // Se verifica que los botones existan en el DOM antes de añadir listeners.
    // Esto previene que el script se rompa si los botones no están en el HTML.
    if (sortPendientesBtn) {
        sortPendientesBtn.addEventListener('click', () => {
            sortPendientesAsc = !sortPendientesAsc; // Invertir el orden
            const icon = sortPendientesBtn.querySelector('i');
            icon.classList.toggle('fa-arrow-up-wide-short', sortPendientesAsc);
            icon.classList.toggle('fa-arrow-down-wide-short', !sortPendientesAsc);
            sortPendientesBtn.setAttribute('aria-label', sortPendientesAsc ? 'Orden: Más antiguo primero' : 'Orden: Más nuevo primero');
    
            // Re-filtrar y re-ordenar la lista actual disparando el evento 'input' de la búsqueda
            searchPendientesInput.dispatchEvent(new Event('input'));
        });
    }

    if (sortRespondidosBtn) {
        sortRespondidosBtn.addEventListener('click', () => {
            sortRespondidosAsc = !sortRespondidosAsc; // Invertir el orden
            const icon = sortRespondidosBtn.querySelector('i');
            icon.classList.toggle('fa-arrow-up-wide-short', sortRespondidosAsc);
            icon.classList.toggle('fa-arrow-down-wide-short', !sortRespondidosAsc);
            sortRespondidosBtn.setAttribute('aria-label', sortRespondidosAsc ? 'Orden: Más antiguo primero' : 'Orden: Más nuevo primero');
    
            // Re-filtrar y re-ordenar la lista actual
            searchRespondidosInput.dispatchEvent(new Event('input'));
        });
    }

    // Delegación de eventos para el botón "Ver más" de los mensajes
    document.querySelector('.contactos-split-container').addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-toggle-mensaje');
        if (!toggleBtn) return;

        const item = toggleBtn.closest('.contacto-item-admin');
        const icon = toggleBtn.querySelector('i');

        item.classList.toggle('expanded');

        if (item.classList.contains('expanded')) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Ver menos';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Ver más';
        }
    });

    // Delegación de eventos para el botón "Ver Respuesta"
    document.querySelector('.contactos-split-container').addEventListener('click', async (e) => {
        const verRespuestaBtn = e.target.closest('.btn-ver-respuesta');
        if (!verRespuestaBtn) return;

        const item = verRespuestaBtn.closest('.contacto-item-admin');
        const respuestaContainer = item.querySelector('.respuesta-container');

        // Si la respuesta ya está visible, la ocultamos
        if (item.classList.contains('respuesta-visible')) {
            item.classList.remove('respuesta-visible');
            verRespuestaBtn.innerHTML = '<i class="fas fa-eye"></i> Ver Respuesta';
            return;
        }

        // Si no, la cargamos
        const idContacto = verRespuestaBtn.dataset.idContacto;
        verRespuestaBtn.disabled = true;
        verRespuestaBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

        try {
            const response = await fetch(`http://localhost:3000/api/admin/contactos/${idContacto}/respuestas`);
            if (!response.ok) throw new Error('No se pudo cargar la respuesta.');

            const respuestas = await response.json();
            respuestaContainer.innerHTML = ''; // Limpiar por si acaso

            if (respuestas.length > 0) {
                const respuesta = respuestas[0]; // Tomamos la primera respuesta
                const fechaRespuesta = new Date(respuesta.fecha_respuesta).toLocaleString('es-AR');
                respuestaContainer.innerHTML = `
                    <p class="respuesta-meta">
                        Respondido por <strong>${respuesta.admin_nombre_completo || 'Admin'}</strong> el ${fechaRespuesta}
                    </p>
                    <p class="respuesta-texto">${respuesta.mensaje_respuesta}</p>
                `;
            } else {
                respuestaContainer.innerHTML = '<p class="respuesta-texto">No se encontró una respuesta para este mensaje.</p>';
            }

            item.classList.add('respuesta-visible');
            verRespuestaBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Respuesta';

        } catch (error) {
            alert(error.message);
        } finally {
            verRespuestaBtn.disabled = false;
        }
    });

    // --- Lógica del Modal de Respuesta ---

    // Actualizar contador de caracteres del modal de respuesta
    replyContactMensajeTextarea.addEventListener('input', () => {
        const currentLength = replyContactMensajeTextarea.value.length;
        const maxLength = replyContactMensajeTextarea.maxLength;
        
        replyCharCounter.textContent = `${currentLength} / ${maxLength}`;

        // Lógica de colores para el contador
        replyCharCounter.classList.remove('warning', 'error');
        if (currentLength >= maxLength) {
            replyCharCounter.classList.add('error');
        } else if (currentLength >= maxLength * 0.9) { // Si se ha usado el 90% o más
            replyCharCounter.classList.add('warning');
        }
    });

    // Función para resetear el estado del contador al abrir el modal
    function resetCharCounter() {
        replyCharCounter.textContent = `0 / ${replyContactMensajeTextarea.maxLength}`;
        replyCharCounter.classList.remove('warning', 'error');
    }

    // Abrir el modal de respuesta
    document.querySelector('.contactos-split-container').addEventListener('click', async (e) => {
        const responderBtn = e.target.closest('.btn-responder-contacto');
        if (!responderBtn) return;

        const item = responderBtn.closest('.contacto-item-admin');
        const email = item.querySelector('.contacto-remitente span').textContent;
        const tema = item.querySelector('.contacto-tema').textContent.trim();

        // Llenar el modal con la información del mensaje
        replyContactIdInput.value = responderBtn.dataset.idContacto;
        replyContactEmailP.textContent = email;
        replyContactTemaP.textContent = tema;
        replyContactMensajeTextarea.value = ''; // Limpiar textarea
        resetCharCounter(); // Reseteamos el contador

        // Mostrar el modal
        replyModalOverlay.style.display = 'flex';
        replyContactMensajeTextarea.focus();
    });

    // Cerrar el modal de respuesta
    function closeReplyModal() {
        replyModalOverlay.style.display = 'none';
    }
    closeReplyModalBtn.addEventListener('click', closeReplyModal);
    replyModalOverlay.addEventListener('click', (e) => {
        if (e.target === replyModalOverlay) {
            closeReplyModal();
        }
    });

    // Enviar la respuesta desde el modal
    sendReplyBtn.addEventListener('click', async () => {
        const idContacto = replyContactIdInput.value;
        const mensajeRespuesta = replyContactMensajeTextarea.value.trim();

        if (mensajeRespuesta === '') {
            alert('La respuesta no puede estar vacía.');
            replyContactMensajeTextarea.focus();
            return;
        }

        // Obtener datos del admin desde localStorage
        const adminData = JSON.parse(localStorage.getItem('userData'));
        if (!adminData) {
            alert('No se pudo verificar tu identidad. Por favor, inicia sesión de nuevo.');
            return;
        }

        sendReplyBtn.disabled = true;
        sendReplyBtn.textContent = 'Enviando...';

        try {
            // Usar el archivo PHP que maneja el envío de emails
            const response = await fetch('http://localhost/pfi/backend/responder_contacto.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_contacto: idContacto,
                    legajo_admin: adminData.legajo,
                    mensaje_respuesta: mensajeRespuesta,
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert(result.message);
            closeReplyModal();

            // Recargar las listas para mover el mensaje de "Pendientes" a "Respondidos"
            cargarMensajesDeContacto();

        } catch (error) {
            alert('Error al enviar la respuesta: ' + error.message);
        } finally {
            sendReplyBtn.disabled = false;
            sendReplyBtn.textContent = 'Enviar Respuesta';
        }
    });

    // --- GESTIÓN DE CAPACIDAD ---
    async function cargarCapacidadActual() {
        if (!loadingCapacidad || !capacidadInput || !capacidadActualValor) return;

        loadingCapacidad.style.display = 'block';
        capacidadInput.style.display = 'none'; // Ocultar input mientras carga
        capacidadActualValor.style.display = 'none'; // Ocultar valor mientras carga
        capacidadFeedback.textContent = '';

        try {
            const response = await fetch('http://localhost:3000/api/admin/capacidad');
            if (!response.ok) throw new Error('No se pudo obtener la capacidad.');
            
            const data = await response.json();
            // Mostramos el valor en el nuevo span y en el input
            capacidadActualValor.textContent = data.capacidad;
            capacidadInput.value = data.capacidad;

        } catch (error) {
            capacidadFeedback.textContent = error.message;
            capacidadFeedback.className = 'feedback-message error';
        } finally {
            loadingCapacidad.style.display = 'none'; // Ocultar loader
            capacidadInput.style.display = 'inline-block';
            capacidadActualValor.style.display = 'inline'; // Mostrar valor
        }
    }

    if (btnGuardarCapacidad) {
        btnGuardarCapacidad.addEventListener('click', async () => {
            const nuevaCapacidad = parseInt(capacidadInput.value, 10);

            if (isNaN(nuevaCapacidad) || nuevaCapacidad < 0) {
                alert('Por favor, ingresa un número válido y no negativo.');
                return;
            }

            btnGuardarCapacidad.disabled = true;
            btnGuardarCapacidad.textContent = 'Guardando...';
            capacidadFeedback.textContent = '';

            try {
                const response = await fetch('http://localhost:3000/api/admin/capacidad', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ capacidad: nuevaCapacidad })
                });
                const result = await response.json();

                capacidadFeedback.textContent = result.message;
                capacidadFeedback.className = `feedback-message ${response.ok ? 'success' : 'error'}`;
                // Si fue exitoso, recargamos el valor mostrado
                if (response.ok) cargarCapacidadActual();

            } catch (error) {
                capacidadFeedback.textContent = 'Error de conexión al guardar.';
                capacidadFeedback.className = 'feedback-message error';
            } finally {
                btnGuardarCapacidad.disabled = false;
                btnGuardarCapacidad.textContent = 'Guardar';
            }
        });
    }

    // --- INICIALIZACIÓN ---
    function init() {
        renderCalendar();
        cargarTodosLosUsuarios();
        cargarTodosLosVehiculos(); // ¡Añadido!
        cargarMensajesDeContacto();
        cargarCapacidadActual(); // ¡LÍNEA CLAVE AÑADIDA! Esto carga la capacidad al iniciar.
        updateNavButtons(); // Establecer el estado inicial de los botones
    }

    init();
});
