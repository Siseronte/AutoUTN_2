// c:/Users/User/Desktop/Proyecto Final Integrador/backend/server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path'); // 1. Importa el módulo 'path' de Node.js

// 2. Configura dotenv para que encuentre el archivo .env en la carpeta actual del backend
require('dotenv').config({ path: path.resolve(__dirname, '.env') });



const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Middleware de Autenticación de Administrador ---
// NOTA: En una aplicación real, esto se manejaría con tokens (JWT) y no confiando en el legajo enviado.
// Por ahora, para simplificar, asumimos que el legajo en el body/query es confiable para esta verificación.
const checkAdmin = async (req, res, next) => {
    // El legajo puede venir en el body (POST), query (GET) o params (DELETE, etc.)
    const legajo = req.body.legajo || req.query.legajo || req.params.legajo;
    
    if (!legajo) {
        return res.status(401).json({ message: 'Acceso no autorizado: se requiere legajo.' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT rol FROM usuarios WHERE legajo = ?', [legajo]);
        await connection.end();
        if (rows.length > 0 && rows[0].rol === 'administrador') {
            next(); // El usuario es admin, continuar
        } else {
            res.status(403).json({ message: 'Acceso denegado: no tienes permisos de administrador.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error interno al verificar permisos.' });
    }
};

// --- Endpoint de Registro ---
app.post('/api/registro', async (req, res) => {
    const { legajo, nombre, apellido, email, dni, password } = req.body;

    if (!legajo || !nombre || !apellido || !email || !dni || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL registrar_usuario(?, ?, ?, ?, ?, ?)', // Llamada con 6 parámetros
            [legajo, nombre, apellido, email, dni, hashedPassword] // Se envían 6 argumentos
        );
        await connection.end();

        res.status(201).json({ message: 'Usuario registrado con éxito.' });

    } catch (error) {
        console.error('Error en el registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email o legajo ya está en uso.' });
        }
        res.status(500).json({ message: 'Error interno del servidor. Revisa la consola del backend.' });
    }
});

// --- Endpoint de Login ---
app.post('/api/login', async (req, res) => {
    const { legajo, password } = req.body;

    if (!legajo || !password) {
        return res.status(400).json({ message: 'Legajo y contraseña son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE legajo = ?', [legajo]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Usamos un mensaje genérico por seguridad
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.contraseña);

        if (match) {
            // ¡Login exitoso!
            // Por ahora, solo enviamos los datos del usuario. Más adelante aquí se generaría un Token (JWT).
            const userData = {
                legajo: user.legajo,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                tokens: user.tokens
            };
            res.status(200).json({ message: 'Login exitoso', user: userData });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER datos de un usuario por legajo ---
app.get('/api/usuarios/:legajo', async (req, res) => {
    const { legajo } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajo]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para CAMBIAR la contraseña de un usuario ---
app.put('/api/usuarios/cambiar-password', async (req, res) => {
    const { legajo, passwordActual, passwordNueva } = req.body;

    if (!legajo || !passwordActual || !passwordNueva) {
        return res.status(400).json({ message: 'Se requieren el legajo, la contraseña actual y la nueva contraseña.' });
    }

    if (passwordActual === passwordNueva) {
        return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT contraseña FROM usuarios WHERE legajo = ?', [legajo]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(passwordActual, user.contraseña);

        if (!match) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
        }

        const hashedNewPassword = await bcrypt.hash(passwordNueva, 10);
        await connection.execute('UPDATE usuarios SET contraseña = ? WHERE legajo = ?', [hashedNewPassword, legajo]);
        
        res.status(200).json({ message: 'Contraseña actualizada con éxito. Por favor, vuelve a iniciar sesión.' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
        if (connection) await connection.end();
    }
});

// --- Endpoint para ELIMINAR la propia cuenta de un usuario ---
app.delete('/api/usuarios/eliminar-cuenta', async (req, res) => {
    const { legajo, password } = req.body;

    if (!legajo || !password) {
        return res.status(400).json({ message: 'Se requiere legajo y contraseña para eliminar la cuenta.' });
    }

    // Reutilizamos la lógica del endpoint de cambio de contraseña para verificar el password
    // (En una app más grande, esto se podría refactorizar en una función helper)
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT contraseña FROM usuarios WHERE legajo = ?', [legajo]);
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].contraseña))) {
        await connection.end();
        return res.status(401).json({ message: 'La contraseña es incorrecta. No se pudo eliminar la cuenta.' });
    }

    // Si la contraseña es correcta, procedemos a eliminar usando el SP existente
    await connection.execute('CALL eliminar_usuario_completo(?)', [legajo]);
    await connection.end();
    res.status(200).json({ message: 'Tu cuenta ha sido eliminada permanentemente.' });
});


// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};


// --- Endpoint para verificar disponibilidad ---
app.get('/api/disponibilidad', async (req, res) => {
    const { fecha, horario } = req.query; // Recibimos fecha y horario, ej: /api/disponibilidad?fecha=2025-10-27&horario=1

    if (!fecha || !horario) {
        return res.status(400).json({ message: 'Se requiere una fecha y un horario.' });
    }

    // Validar que la fecha sea un formato válido (simplificado)
    if (isNaN(new Date(fecha).getTime())) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        // Llamamos a la nueva función SQL
        const [rows] = await connection.execute('SELECT lugares_disponibles_en_fecha_y_horario(?, ?) AS disponibles', [fecha, horario]);
        await connection.end();

        const disponibles = rows[0].disponibles;
        res.status(200).json({ disponibles: disponibles });

    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para obtener disponibilidad por turnos de una fecha ---
app.get('/api/disponibilidad-turnos', async (req, res) => {
    const { fecha } = req.query;

    if (!fecha) {
        return res.status(400).json({ message: 'Se requiere una fecha.' });
    }

    if (isNaN(new Date(fecha).getTime())) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [turno1] = await connection.execute('SELECT calcular_lugares_disponibles(?, 1) AS disponibles', [fecha]);
        const [turno2] = await connection.execute('SELECT calcular_lugares_disponibles(?, 2) AS disponibles', [fecha]);
        const [turno3] = await connection.execute('SELECT calcular_lugares_disponibles(?, 3) AS disponibles', [fecha]);
        await connection.end();

        res.status(200).json({
            turnos: {
                1: { nombre: 'Mañana (08:00-13:00)', disponibles: turno1[0].disponibles },
                2: { nombre: 'Tarde (13:00-18:00)', disponibles: turno2[0].disponibles },
                3: { nombre: 'Noche (18:00-23:00)', disponibles: turno3[0].disponibles }
            }
        });

    } catch (error) {
        console.error('Error al obtener disponibilidad por turnos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para crear una reserva ---
app.post('/api/reservas', async (req, res) => {
    // NOTA: En un futuro, aquí deberíamos verificar que el usuario esté autenticado (con JWT, por ejemplo)
    const { legajo, patente, fecha, horario } = req.body;

    if (!legajo || !patente || !fecha || !horario) {
        return res.status(400).json({ message: 'Legajo, patente, fecha y horario son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 0. Validación adicional: Verificar si el usuario ya tiene una reserva activa para ese día.
        const [existingDayReservation] = await connection.execute('SELECT usuario_tiene_reserva_activa_en_dia(?, ?) AS tiene_reserva', [legajo, new Date(fecha).toISOString().slice(0, 10)]);
        if (existingDayReservation[0].tiene_reserva === 1) {
            await connection.end();
            return res.status(409).json({ message: 'Ya tienes una reserva activa para este día. Solo se permite una reserva activa por día.' });
        }

        // 1. Volvemos a verificar la disponibilidad como medida de seguridad, por si justo alguien reservó.
        const [rows] = await connection.execute('SELECT lugares_disponibles_en_fecha_y_horario(?, ?) AS disponibles', [new Date(fecha).toISOString().slice(0, 10), horario]);
        if (rows[0].disponibles <= 0) {
            await connection.end();
            return res.status(409).json({ message: 'Lo sentimos, ya no hay lugares disponibles para ese horario.' }); // 409 Conflict
        }

        // 2. Si hay lugar, llamamos al procedimiento para abrir la reserva.
        // Usamos una transacción para asegurar que la reserva y la consulta de usuario sean atómicas.
        await connection.beginTransaction();
        await connection.execute('CALL abrir_reserva(?, ?, ?, ?)', [legajo, patente, fecha, horario]);
        
        // 3. Obtenemos los datos actualizados del usuario (con los tokens descontados por el trigger).
        const [userRows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajo]);
        
        await connection.commit(); // Confirmamos la transacción
        await connection.end();

        // 4. Enviamos el mensaje de éxito Y los datos actualizados del usuario.
        res.status(201).json({ message: 'Reserva creada con éxito.', user: userRows[0] });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        // Si es un error de validación lanzado desde un trigger (SQLSTATE 45000), enviamos el mensaje específico del trigger al frontend.
        if (error.sqlState === '45000') {
            // Usamos un código de estado 409 (Conflicto), que es apropiado para estas validaciones.
            return res.status(409).json({ message: error.sqlMessage });
        }
        // Para cualquier otro tipo de error, enviamos un mensaje genérico.
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER las reservas de un usuario ---
app.get('/api/reservas', async (req, res) => {
    const { legajo } = req.query;

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [reservas] = await connection.execute('CALL obtener_reservas_por_legajo(?)', [legajo]);
        await connection.end();
        res.status(200).json(reservas[0]);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para FINALIZAR una reserva ---
app.put('/api/reservas/:id/finalizar', async (req, res) => {
    const { id } = req.params; // Obtenemos el ID de la reserva desde la URL

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID de la reserva.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Para devolver los datos del usuario, primero necesitamos saber a quién pertenece la reserva.
        // Usamos una transacción para asegurar la integridad de los datos.
        await connection.beginTransaction();
        const [reservaRows] = await connection.execute('SELECT legajo_usuario FROM reservas WHERE id_reserva = ?', [id]);
        
        if (reservaRows.length === 0) {
            await connection.rollback();
            await connection.end();
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        const legajoUsuario = reservaRows[0].legajo_usuario;

        // Llamamos al nuevo procedimiento que finaliza la reserva y devuelve el token
        const [result] = await connection.execute('CALL finalizar_reserva_por_id(?)', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            await connection.end();
            return res.status(404).json({ message: 'No se encontró una reserva activa o en uso con ese ID para finalizar.' });
        }

        // A diferencia de cancelar, finalizar no devuelve un token.
        // Pero para mantener la consistencia de la respuesta y que el frontend se actualice,
        // volvemos a consultar los datos del usuario.
        const [userRows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajoUsuario]);

        await connection.commit();
        await connection.end();

        res.status(200).json({ message: 'Reserva finalizada con éxito.', user: userRows[0] });
    } catch (error) {
        console.error('Error al finalizar la reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para CANCELAR una reserva ---
app.put('/api/reservas/:id/cancelar', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID de la reserva.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Obtener el legajo del dueño de la reserva para poder devolverle sus datos actualizados
        const [reservaRows] = await connection.execute('SELECT legajo_usuario FROM reservas WHERE id_reserva = ? AND estado = "activa"', [id]);
        if (reservaRows.length === 0) {
            await connection.rollback();
            await connection.end();
            return res.status(404).json({ message: 'No se encontró una reserva activa con ese ID para cancelar.' });
        }
        const legajoUsuario = reservaRows[0].legajo_usuario;

        // 2. Llamar al procedimiento para cancelar la reserva (esto activará el trigger que devuelve el token)
        await connection.execute('CALL cancelar_reserva_por_id(?)', [id]);

        // 3. Obtener los datos actualizados del usuario (con el token devuelto)
        const [userRows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajoUsuario]);
        await connection.commit();
        await connection.end();

        res.status(200).json({ message: 'Reserva cancelada con éxito. Se ha devuelto 1 token a tu cuenta.', user: userRows[0] });
    } catch (error) {
        console.error('Error al cancelar la reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para REGISTRAR ENTRADA de una reserva (cambia estado a "en uso") ---
app.post('/api/reservas/:id/registrar-entrada', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID de la reserva.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('CALL registrar_entrada_reserva(?)', [id]);
        await connection.end();

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Entrada registrada con éxito. La reserva está ahora "en uso".' });
        } else {
            res.status(404).json({ message: 'No se encontró una reserva activa con ese ID para registrar la entrada.' });
        }
    } catch (error) {
        console.error('Error al registrar la entrada:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para REGISTRAR ENTRADA de la PRÓXIMA reserva activa de un usuario ---
app.post('/api/reservas/registrar-entrada-proxima', async (req, res) => {
    const { legajo } = req.body;

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // 1. Usar la función para obtener el ID de la próxima reserva
        const [idRows] = await connection.execute('SELECT obtener_proxima_reserva_activa_id(?) AS id_reserva', [legajo]);
        const idReserva = idRows[0].id_reserva;

        if (!idReserva) {
            await connection.end();
            return res.status(404).json({ message: 'No se encontró una próxima reserva activa para registrar la entrada.' });
        }

        // 2. Si se encontró un ID, llamar al procedimiento para registrar la entrada
        const [result] = await connection.execute('CALL registrar_entrada_reserva(?)', [idReserva]);
        await connection.end();

        if (result.affectedRows > 0) {
            res.status(200).json({ message: '¡Entrada registrada con éxito! Tu reserva ahora está "en uso".' });
        } else {
            // Esto podría pasar en una condición de carrera muy rara donde la reserva se cancela justo después de obtener el ID.
            res.status(404).json({ message: 'No se pudo registrar la entrada. La reserva ya no está activa.' });
        }
    } catch (error) {
        if (connection) await connection.end();
        console.error('Error al registrar la entrada de la próxima reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para FINALIZAR la reserva "en uso" de un usuario ---
app.post('/api/reservas/finalizar-reserva-en-uso', async (req, res) => {
    const { legajo } = req.body;

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // 1. Usar la nueva función para obtener el ID de la reserva "en uso"
        const [idRows] = await connection.execute('SELECT obtener_reserva_en_uso_id(?) AS id_reserva', [legajo]);
        const idReserva = idRows[0].id_reserva;

        if (!idReserva) {
            await connection.end();
            return res.status(404).json({ message: 'No se encontró ninguna reserva "en uso" para finalizar.' });
        }

        // 2. Si se encontró un ID, llamar al procedimiento para finalizar la reserva
        const [result] = await connection.execute('CALL finalizar_reserva_por_id(?)', [idReserva]);
        await connection.end();

        if (result.affectedRows > 0) {
            res.status(200).json({ message: '¡Salida registrada con éxito! Gracias por utilizar nuestro servicio.' });
        } else {
            res.status(404).json({ message: 'No se pudo registrar la salida. La reserva ya no se encontraba "en uso".' });
        }
    } catch (error) {
        if (connection) await connection.end();
        console.error('Error al finalizar la reserva en uso:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// ==========================================
// 🚗 ENDPOINTS DE VEHÍCULOS
// ==========================================

// --- Endpoint para OBTENER los vehículos de un usuario ---
app.get('/api/vehiculos', async (req, res) => {
    const { legajo } = req.query; // Recibimos el legajo por query params: /api/vehiculos?legajo=12345

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [vehiculos] = await connection.execute('CALL obtener_vehiculos_por_legajo(?)', [legajo]);
        await connection.end();
        res.status(200).json(vehiculos[0]); // El resultado del SP está en el primer elemento del array
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para REGISTRAR un nuevo vehículo ---
app.post('/api/vehiculos', async (req, res) => {
    const { patente, modelo, marca, color, anio, legajo_usuario } = req.body;

    if (!patente || !modelo || !marca || !anio || !legajo_usuario) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL registrar_vehiculo(?, ?, ?, ?, ?, ?)',
            [patente, modelo, marca, color, anio, legajo_usuario]
        );
        await connection.end();
        res.status(201).json({ message: 'Vehículo registrado con éxito.' });
    } catch (error) {
        console.error('Error al registrar vehículo:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La patente ingresada ya está registrada.' });
        }
        if (error.sqlState === '45000') {
            // Captura el error de límite de vehículos del trigger/procedimiento
            return res.status(409).json({ message: error.sqlMessage });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para ELIMINAR un vehículo ---
app.delete('/api/vehiculos/:patente', async (req, res) => {
    const { patente } = req.params; // La patente viene en la URL: /api/vehiculos/ABC123

    if (!patente) {
        return res.status(400).json({ message: 'Se requiere la patente del vehículo.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL eliminar_vehiculo(?)', [patente]);
        await connection.end();
        res.status(200).json({ message: 'Vehículo eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ==========================================
// ✉️ ENDPOINT DE CONTACTO
// ==========================================

app.post('/api/contacto', async (req, res) => {
    const { email, tema, mensaje } = req.body;

    if (!email || !tema || !mensaje) {
        return res.status(400).json({ message: 'El email, el tema y el mensaje son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL registrar_contacto(?, ?, ?)', [email, tema, mensaje]); // Corregido para pasar 3 argumentos
        await connection.end();
        res.status(201).json({ message: 'Mensaje enviado con éxito. Gracias por contactarnos.' });
    } catch (error) {
        console.error('Error al registrar contacto:', error);
        // Manejar el error de formato de email del trigger
        if (error.sqlState === '45000') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ==========================================
// 👑 ENDPOINTS DE ADMINISTRADOR
// ==========================================

// --- Endpoint para OBTENER TODOS los usuarios (solo admin) ---
app.get('/api/admin/usuarios', async (req, res) => {
    // Este endpoint no necesita el middleware `checkAdmin` porque no filtra por un legajo específico,
    // sino que devuelve todos los usuarios. La protección se hará en el frontend.
    // En un sistema con JWT, el token mismo probaría que el usuario es admin.
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('CALL admin_obtener_todos_los_usuarios()');
        await connection.end();
        res.status(200).json(users[0]);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER TODOS los vehículos (solo admin) ---
app.get('/api/admin/vehiculos', async (req, res) => {
    // NOTA: Proteger esta ruta con un middleware de admin en un futuro.
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [vehiculos] = await connection.execute('CALL admin_obtener_todos_los_vehiculos()');
        await connection.end();
        res.status(200).json(vehiculos[0]);
    } catch (error) {
        console.error('Error de admin al obtener todos los vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- Endpoint para OBTENER TODAS las reservas de una fecha (solo admin) ---
app.get('/api/admin/reservas-por-fecha', async (req, res) => {
    const { fecha } = req.query;

    if (!fecha) {
        return res.status(400).json({ message: 'Se requiere una fecha.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [reservas] = await connection.execute('CALL admin_obtener_reservas_por_fecha(?)', [fecha]);
        await connection.end();
        res.status(200).json(reservas[0]);
    } catch (error) {
        console.error('Error al obtener reservas por fecha:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER TODAS las reservas de una fecha (solo admin) ---
app.get('/api/admin/reservas-por-fecha', async (req, res) => {
    const { fecha } = req.query;

    if (!fecha) {
        return res.status(400).json({ message: 'Se requiere una fecha.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [reservas] = await connection.execute('CALL admin_obtener_reservas_por_fecha(?)', [fecha]);
        await connection.end();
        res.status(200).json(reservas[0]);
    } catch (error) {
        console.error('Error al obtener reservas por fecha:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER los días de un mes que tienen reservas (solo admin) ---
app.get('/api/admin/fechas-con-reservas', async (req, res) => {
    const { anio, mes } = req.query;

    if (!anio || !mes) {
        return res.status(400).json({ message: 'Se requiere un año y un mes.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute('CALL admin_obtener_fechas_con_reservas_por_mes(?, ?)', [anio, mes]);
        await connection.end();
        
        // Extraemos solo las fechas en formato 'YYYY-MM-DD'
        // Se añade un filtro (r.fecha) para ignorar cualquier posible valor nulo que venga de la BD
        const fechas = results[0].filter(r => r.fecha) // Filtra los resultados nulos
                                  .map(r => r.fecha.toISOString().split('T')[0]); // Convierte a string solo los válidos
        res.status(200).json(fechas);
    } catch (error) {
        console.error('Error al obtener fechas con reservas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para ACTUALIZAR un usuario (solo admin) ---
app.put('/api/admin/usuarios/:legajo', async (req, res) => {
    const { legajo } = req.params;
    const { nombre, apellido, tokens } = req.body;

    if (!nombre || !apellido || tokens === undefined) {
        return res.status(400).json({ message: 'Nombre, apellido y tokens son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL admin_actualizar_usuario(?, ?, ?, ?)',
            [legajo, nombre, apellido, tokens]
        );
        await connection.end();
        res.status(200).json({ message: 'Usuario actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.sqlState === '45000') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para ELIMINAR un usuario (solo admin) ---
app.delete('/api/admin/usuarios/:legajo', async (req, res) => {
    const { legajo } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL eliminar_usuario_completo(?)', [legajo]);
        await connection.end();
        res.status(200).json({ message: 'Usuario eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.sqlState === '45000') {
            return res.status(404).json({ message: error.sqlMessage });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER la capacidad máxima del estacionamiento (solo admin) ---
app.get('/api/admin/capacidad', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT valor FROM configuracion WHERE clave = 'capacidad_maxima'"
        );
        await connection.end();

        if (rows.length > 0) {
            res.status(200).json({ capacidad: parseInt(rows[0].valor, 10) });
        } else {
            res.status(404).json({ message: 'No se encontró la configuración de capacidad.' });
        }
    } catch (error) {
        console.error('Error al obtener la capacidad:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para ACTUALIZAR la capacidad máxima (solo admin) ---
app.put('/api/admin/capacidad', async (req, res) => {
    const { capacidad } = req.body;

    if (capacidad === undefined || !Number.isInteger(capacidad) || capacidad < 0) {
        return res.status(400).json({ message: 'Se requiere un valor de "capacidad" numérico y no negativo.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            "UPDATE configuracion SET valor = ? WHERE clave = 'capacidad_maxima'",
            [capacidad.toString()]
        );
        await connection.end();
        res.status(200).json({ message: `Capacidad del estacionamiento actualizada a ${capacidad} con éxito.` });
    } catch (error) {
        console.error('Error al actualizar la capacidad:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para FINALIZAR una reserva (solo admin) ---
app.put('/api/admin/reservas/:id/finalizar', async (req, res) => {
    const { id } = req.params;

    // NOTA: En un futuro, aquí iría un middleware como `checkAdmin` para proteger la ruta.
    // Por ahora, confiamos en que el botón solo se muestra a los administradores en el frontend.

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID de la reserva.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        // Reutilizamos el procedimiento existente que ya hace lo que necesitamos.
        const [result] = await connection.execute('CALL finalizar_reserva_por_id(?)', [id]);
        await connection.end();

        // `affectedRows` nos dice si la consulta UPDATE realmente cambió una fila.
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Reserva finalizada con éxito por el administrador.' });
        } else {
            res.status(404).json({ message: 'No se encontró una reserva activa o en uso con ese ID para finalizar.' });
        }
    } catch (error) {
        console.error('Error de admin al finalizar la reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER TODOS los mensajes de contacto (solo admin) ---
app.get('/api/admin/contactos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [mensajes] = await connection.execute('CALL admin_obtener_todos_los_contactos()');
        await connection.end();
        res.status(200).json(mensajes[0]);
    } catch (error) {
        console.error('Error al obtener todos los mensajes de contacto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para RESPONDER un mensaje de contacto (solo admin) ---
app.post('/api/admin/contactos/:id/responder', async (req, res) => {
    const { id } = req.params; // id_contacto
    const { legajo_admin, mensaje_respuesta } = req.body;

    if (!legajo_admin || !mensaje_respuesta) {
        return res.status(400).json({ message: 'Se requiere el legajo del administrador y el mensaje de respuesta.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL admin_responder_contacto(?, ?, ?)',
            [id, legajo_admin, mensaje_respuesta]
        );
        await connection.end();
        res.status(201).json({ message: 'Respuesta guardada con éxito.' });
    } catch (error) {
        console.error('Error al responder al mensaje de contacto:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER las respuestas de un mensaje (solo admin) ---
app.get('/api/admin/contactos/:id/respuestas', async (req, res) => {
    const { id } = req.params; // id_contacto

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [respuestas] = await connection.execute(
            'CALL admin_obtener_respuestas_por_contacto(?)',
            [id]
        );
        await connection.end();
        res.status(200).json(respuestas[0]);
    } catch (error) {
        console.error('Error al obtener las respuestas del mensaje:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});






// Iniciar el servidor
app.listen(port, () => {
    console.log(`Backend corriendo en http://localhost:${port}`);
});
