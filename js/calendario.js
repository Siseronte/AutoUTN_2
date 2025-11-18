document.addEventListener('DOMContentLoaded', () => {

    if (!authManager.isAuthenticated()) {
        return;
    }
    const monthElement = document.querySelector('.current-month');
    const prevMonthButton = document.querySelector('.prev-month');
    const nextMonthButton = document.querySelector('.next-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingForm = document.getElementById('booking-form');
    const timeRangeInputs = document.querySelectorAll('input[name="rango-horario"]');
    const selectorVehiculo = document.getElementById('selector-vehiculo');
    const listaMisReservas = document.getElementById('lista-mis-reservas');
    const disponibilidadTurnos = document.getElementById('disponibilidad-turnos');

    let currentDate = new Date();
    currentDate.setDate(1);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;
    let selectedDateObj = null;

    const today = new Date();


    const cargarVehiculosUsuario = async () => {
        const userData = authManager.getUserData();
        if (!userData) return;

        try {
            const response = await fetch(`http://localhost:3000/api/vehiculos?legajo=${userData.legajo}`);
            if (!response.ok) throw new Error('No se pudieron cargar tus vehículos.');
            
            const vehiculos = await response.json();
            selectorVehiculo.innerHTML = '';

            if (vehiculos.length === 0) {
                selectorVehiculo.innerHTML = '<option value="">No tienes vehículos registrados</option>';
                selectorVehiculo.disabled = true;
            } else {
                selectorVehiculo.disabled = false;
                vehiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.patente;
                    option.textContent = `${v.marca} ${v.modelo} (${v.patente})`;
                    selectorVehiculo.appendChild(option);
                });
            }
        } catch (error) {
            console.error(error);
            selectorVehiculo.innerHTML = `<option value="">${error.message}</option>`;
            selectorVehiculo.disabled = true;
        }
    };


    const cargarReservasUsuario = async () => {
        const userData = authManager.getUserData();
        if (!userData) return;

        try {
            const response = await fetch(`http://localhost:3000/api/reservas?legajo=${userData.legajo}`);
            if (!response.ok) throw new Error('No se pudieron cargar tus reservas.');

            const reservas = await response.json();
            listaMisReservas.innerHTML = '';

            if (reservas.length === 0) {
                listaMisReservas.innerHTML = '<li>No tienes reservas activas o pasadas.</li>';
            } else {
                const turnos = { 1: 'Mañana (08:00-13:00)', 2: 'Tarde (13:00-18:00)', 3: 'Noche (18:00-23:00)' };
                reservas.forEach(r => {
                    const li = document.createElement('li');
                    const fecha = new Date(r.fecha_reserva).toLocaleDateString('es-AR');
                    li.className = `reserva-item estado-${r.estado.replace(/\s+/g, '-')}`;
                    li.innerHTML = `
                        <div class="reserva-content">
                            <div class="reserva-info">
                                <div class="reserva-info-row">
                                    <div class="reserva-info-item">
                                        <i class="fas fa-calendar-alt"></i>
                                        <span>${fecha}</span>
                                    </div>
                                    <div class="reserva-info-item">
                                        <i class="fas fa-clock"></i>
                                        <span>${turnos[r.horario]}</span>
                                    </div>
                                </div>
                                <div class="reserva-info-row">
                                    <div class="reserva-info-item">
                                        <i class="fas fa-car"></i>
                                        <span>${r.patente_vehiculo}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="reserva-actions">
                                <div class="reserva-estado">${r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}</div>
                                ${r.estado === 'activa' ? `<button class="btn-cancelar" data-reserva-id="${r.id_reserva}">Cancelar</button>` : ''}
                            </div>
                        </div>
                    `;
                    listaMisReservas.appendChild(li);
                });


                document.querySelectorAll('.btn-cancelar').forEach(button => {
                    button.addEventListener('click', (e) => cancelarReserva(e.target.dataset.reservaId, e.target));
                });


                document.querySelectorAll('.btn-finalizar').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        await finalizarReserva(e.target.dataset.reservaId, e.target);
                    });
                });
            }
        } catch (error) {
            console.error(error);
            listaMisReservas.innerHTML = `<li>${error.message}</li>`;
        }
    };


    const cancelarReserva = async (reservaId, button) => {
        if (!confirm('¿Estás seguro de que quieres cancelar esta reserva? Se te devolverá 1 token.')) {
            return;
        }

        button.disabled = true;
        button.textContent = 'Cancelando...';

        try {
            const response = await fetch(`http://localhost:3000/api/reservas/${reservaId}/cancelar`, {
                method: 'PUT'
            });
            const data = await response.json();

            alert(data.message);

            if (response.ok) {
                authManager.updateUserData(data.user);
                cargarReservasUsuario();
                actualizarUI();
            }
        } catch (error) {
            alert('Error al intentar cancelar la reserva.');
        } finally {
            button.disabled = false;
            button.textContent = 'Cancelar';
        }
    };


    const finalizarReserva = async (reservaId, button) => {
        if (!confirm('¿Estás seguro de que quieres finalizar esta reserva? Esta acción no se puede deshacer y el token no será devuelto.')) {
            return;
        }

        button.disabled = true;
        button.textContent = 'Finalizando...';

        try {
            const response = await fetch(`http://localhost:3000/api/reservas/${reservaId}/finalizar`, {
                method: 'PUT'
            });
            const data = await response.json();

            alert(data.message);

            if (response.ok) {
                authManager.updateUserData(data.user);
                cargarReservasUsuario();
                actualizarUI();
            }
        } catch (error) {
            alert('Error al intentar finalizar la reserva.');
            button.disabled = false;
            button.textContent = 'Finalizar';
        }
    };


    const mostrarDisponibilidadTurnos = async (fecha) => {
        const fechaStr = fecha.toISOString().split('T')[0];
        
        try {
            const response = await fetch(`http://localhost:3000/api/disponibilidad-turnos?fecha=${fechaStr}`);
            if (!response.ok) throw new Error('Error al obtener disponibilidad');
            
            const data = await response.json();
            

            document.getElementById('turno-1-disponibles').textContent = `${data.turnos[1].disponibles} lugares`;
            document.getElementById('turno-2-disponibles').textContent = `${data.turnos[2].disponibles} lugares`;
            document.getElementById('turno-3-disponibles').textContent = `${data.turnos[3].disponibles} lugares`;
            

            disponibilidadTurnos.style.display = 'block';
            
        } catch (error) {
            console.error('Error al obtener disponibilidad por turnos:', error);

            disponibilidadTurnos.style.display = 'none';
        }
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    function updateHorarios(selectedDayDate) {
        const now = new Date();
        const currentHour = now.getHours();


        timeRangeInputs.forEach(input => {
            input.checked = false;
            input.disabled = false;
            input.parentElement.classList.remove('disabled');
        });

        if (selectedDayDate.toDateString() === now.toDateString()) {
            timeRangeInputs.forEach(input => {
                let horaFinTurno;

                switch (input.value) {
                    case '1':
                        horaFinTurno = 13;
                        break;
                    case '2':
                        horaFinTurno = 18;
                        break;
                    case '3':
                        horaFinTurno = 23;
                        break;
                }

                if (horaFinTurno && currentHour >= horaFinTurno) {
                    input.disabled = true;
                    input.parentElement.classList.add('disabled');
                }
            });
        }
    }

    function renderCalendar() {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        calendarGrid.innerHTML = '';

        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayNames.forEach(day => {
            const dayNameCell = document.createElement('div');
            dayNameCell.classList.add('day-name');
            dayNameCell.textContent = day;
            calendarGrid.appendChild(dayNameCell);
        });

        let startingDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        for (let i = startingDay; i > 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'prev-month-day');
            dayCell.textContent = lastDayOfPrevMonth - i + 1;
            
            const prevMonthDate = new Date(currentYear, currentMonth - 1, lastDayOfPrevMonth - i + 1);
            
            dayCell.classList.add('disabled-day');
            dayCell.style.backgroundColor = 'transparent';
            
            calendarGrid.appendChild(dayCell);
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.textContent = i;

            const date = new Date(currentYear, currentMonth, i);


            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            

            const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
            const mondayOfCurrentWeek = new Date(todayDate);
            mondayOfCurrentWeek.setDate(todayDate.getDate() - daysFromMonday);
            

            const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
            sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
            

            const sundayOfNextWeek = new Date(sundayOfCurrentWeek);
            sundayOfNextWeek.setDate(sundayOfCurrentWeek.getDate() + 7);
            
            let isAvailable = false;
            

            if (dateToCheck >= mondayOfCurrentWeek && dateToCheck <= sundayOfCurrentWeek) {

                isAvailable = date.getDay() !== 0 && dateToCheck >= todayDate;
            } else if (today.getDay() === 0 && dateToCheck > sundayOfCurrentWeek && dateToCheck <= sundayOfNextWeek) {

                isAvailable = date.getDay() !== 0;
            }
            
            if (!isAvailable) {
                dayCell.classList.add('disabled-day');
                dayCell.style.backgroundColor = 'transparent';
            } else {
                dayCell.classList.add('selectable-day');
                dayCell.addEventListener('click', () => {
                    const selectedDay = document.querySelector('.selected');
                    if (selectedDay) {
                        selectedDay.classList.remove('selected');
                    }
                    dayCell.classList.add('selected');
                    selectedDate = `${i}/${currentMonth + 1}/${currentYear}`;
                    selectedDateObj = date;
                    bookingFormContainer.classList.add('visible');
                    updateHorarios(selectedDateObj);
                    mostrarDisponibilidadTurnos(selectedDateObj);
                    console.log(`Fecha seleccionada: ${selectedDate}`);
                });
            }


            if (date.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            calendarGrid.appendChild(dayCell);
        }

        const totalCells = startingDay + lastDateOfMonth;
        const nextDays = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);

        for (let i = 1; i <= nextDays; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'next-month-day');
            dayCell.textContent = i;
            
            const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
            
            dayCell.classList.add('disabled-day');
            dayCell.style.backgroundColor = 'transparent';
            
            calendarGrid.appendChild(dayCell);
        }
        
        updateNavButtons();
    }

    function updateNavButtons() {
        const now = new Date();
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        if (currentYear === currentMonthDate.getFullYear() && currentMonth === currentMonthDate.getMonth()) {
            prevMonthButton.disabled = true;
        } else {
            prevMonthButton.disabled = false;
        }

        if (currentYear === nextMonthDate.getFullYear() && currentMonth === nextMonthDate.getMonth()) {
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
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedTimeRange = document.querySelector('input[name="rango-horario"]:checked');
        const selectedPatente = selectorVehiculo.value;
        const btnReserva = bookingForm.querySelector('.btn-reserva');

        if (!selectedDate) {
            alert('Por favor, selecciona una fecha en el calendario.');
            return;
        }
        if (!selectedTimeRange) {
            alert('Por favor, selecciona un rango horario.');
            return;
        }
        if (!selectedPatente) {
            alert('Por favor, selecciona un vehículo. Si no tienes, regístralo en "Mis Autos".');
            return;
        }


        btnReserva.disabled = true;
        btnReserva.textContent = 'Procesando...';


        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        const fechaSimple = `${year}-${month}-${day}`;
        const horarioSeleccionado = selectedTimeRange.value;
        const startTime = selectedTimeRange.dataset.startTime;
        const fechaHoraCompleta = `${fechaSimple}T${startTime}:00`;

        try {

            const disponibilidadResponse = await fetch(`http://localhost:3000/api/disponibilidad?fecha=${fechaSimple}&horario=${horarioSeleccionado}`);
            const disponibilidadData = await disponibilidadResponse.json();

            if (!disponibilidadResponse.ok || disponibilidadData.disponibles <= 0) {
                throw new Error(disponibilidadData.message || 'No hay lugares disponibles para ese horario.');
            }


            const userData = authManager.getUserData();
            if (!userData) {
                alert('Debes iniciar sesión para poder reservar.');
                window.location.href = 'index.html';
                return;
            }

            const reservaResponse = await fetch('http://localhost:3000/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legajo: userData.legajo, patente: selectedPatente, fecha: fechaHoraCompleta, horario: horarioSeleccionado })
            });
            const reservaData = await reservaResponse.json();

            alert(reservaData.message); 
            if (reservaResponse.ok) {

                authManager.updateUserData(reservaData.user);
                window.location.href = 'dashboard.html';
            }

        } catch (error) {
            alert(error.message);
        } finally {

            btnReserva.disabled = false;
            btnReserva.textContent = 'Reservar';
        }
    });

    renderCalendar();


    cargarVehiculosUsuario();
    cargarReservasUsuario();
});