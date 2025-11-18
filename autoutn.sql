-- CREACION DE BASE DE DATOS
DROP DATABASE IF EXISTS autoutn;
CREATE DATABASE autoutn;
USE autoutn;

-- ELIMINACION DE TABLAS PREEXISTENTES 
DROP TABLE IF EXISTS contactos_respuestas;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS configuracion;
DROP TABLE IF EXISTS contactos;
DROP TABLE IF EXISTS auditoria;


-- CREACION DE TABLA USUARIOS
CREATE TABLE usuarios (
  legajo INT UNSIGNED PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  dni INT UNSIGNED NOT NULL UNIQUE,
  tokens TINYINT UNSIGNED,
  contraseña VARCHAR(255) NOT NULL,
  rol ENUM('general', 'administrador') DEFAULT 'general' NOT NULL
);


-- CREACION DE TABLA VEHICULOS
CREATE TABLE vehiculos (
  patente VARCHAR(10) PRIMARY KEY,   -- ahora es la PK
  modelo VARCHAR(50) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  color VARCHAR(30),
  anio YEAR NOT NULL,
  legajo_usuario INT UNSIGNED,            -- referencia al usuario dueño
  FOREIGN KEY (legajo_usuario) REFERENCES usuarios(legajo) ON DELETE SET NULL
);

-- CREACION DE TABLA CONFIGURACION (encargada de contener la cantidad maxima de lugares disponibles)
CREATE TABLE configuracion (
  clave VARCHAR(50) PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT
);

-- CREACION DE TABLA RESERVAS
CREATE TABLE reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  legajo_usuario INT UNSIGNED NOT NULL,
  patente_vehiculo VARCHAR(10) NULL,
  horario TINYINT UNSIGNED NOT NULL CHECK (horario IN (1, 2, 3)), -- 1: Mañana, 2: Tarde, 3: Noche
  fecha_reserva DATETIME NOT NULL,
  fecha_entrada DATETIME,
  fecha_salida DATETIME,
  estado ENUM('activa','en uso','finalizada','cancelada','ausente') DEFAULT 'activa',
  FOREIGN KEY (legajo_usuario) REFERENCES usuarios(legajo) ON DELETE CASCADE,
  FOREIGN KEY (patente_vehiculo) REFERENCES vehiculos(patente) ON DELETE SET NULL
);

-- CREACION DE TABLA AUDITORIA
CREATE TABLE auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,  -- nombre de la tabla donde ocurrió el cambio
  accion ENUM('INSERT','UPDATE','DELETE') NOT NULL, -- tipo de acción
  clave_primaria VARCHAR(50) NOT NULL,   -- valor de la PK afectada
  legajo_usuario INT UNSIGNED,                -- quién hizo la acción (si aplica)
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP, -- fecha y hora de la acción
  detalle VARCHAR(500)                           -- descripción opcional del cambio
);

-- CREACION DE TABLA CONTACTOS
CREATE TABLE contactos (
  id_contacto INT AUTO_INCREMENT PRIMARY KEY,  -- clave primaria autoincremental
  email VARCHAR(100) NOT NULL,                 -- email del remitente
  tema ENUM('Consulta general', 'Problemas con mi cuenta', 'Sugerencias', 'Reportar un error', 'Otros') NOT NULL,
  mensaje TEXT NOT NULL,                       -- texto del mensaje enviado
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP, -- fecha y hora automática
  respondido BOOLEAN NOT NULL DEFAULT FALSE      -- Nuevo campo para saber si fue respondido
);

-- CREACION DE TABLA CONTACTOS_RESPUESTAS
CREATE TABLE contactos_respuestas (
  id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
  id_contacto INT NOT NULL,                         -- FK a la tabla de contactos
  legajo_admin INT UNSIGNED,                        -- Quién respondió (un admin). Permite NULL si el admin es borrado.
  mensaje_respuesta TEXT NOT NULL,                  -- El contenido de la respuesta
  fecha_respuesta DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de la respuesta
  FOREIGN KEY (id_contacto) REFERENCES contactos(id_contacto) ON DELETE CASCADE, -- Si se borra el mensaje, se borra la respuesta
  FOREIGN KEY (legajo_admin) REFERENCES usuarios(legajo) ON DELETE SET NULL      -- Si se borra el admin, la respuesta queda pero sin autor
);


DELIMITER $$

-- ==========================
-- TRIGGERS PARA USUARIOS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_usuarios_insert $$
CREATE TRIGGER auditoria_usuarios_insert_y_validacion
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    -- Validar el formato del email antes de insertar
    IF NOT (NEW.email REGEXP '^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Formato de email inválido. Debe ser del dominio UTN (@frh.utn.edu.ar o @alumnos.frh.utn.edu.ar)';
    END IF;
    -- La auditoría se realizará en el trigger AFTER INSERT para asegurar que la inserción fue exitosa.
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_insert_log $$
CREATE TRIGGER auditoria_usuarios_insert_log
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'INSERT', NEW.legajo, NEW.legajo, CONCAT('Usuario creado: ', NEW.nombre, ' ', NEW.apellido));
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_update $$
CREATE TRIGGER auditoria_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'UPDATE', NEW.legajo, NEW.legajo, CONCAT(
        'Antes: ', OLD.nombre, ' ', OLD.apellido, 
        ' | Después: ', NEW.nombre, ' ', NEW.apellido));
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_delete $$
CREATE TRIGGER auditoria_usuarios_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'DELETE', OLD.legajo, OLD.legajo, CONCAT('Usuario eliminado: ', OLD.nombre, ' ', OLD.apellido));
END $$

-- ==========================
-- TRIGGERS PARA VEHÍCULOS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_vehiculos_insert $$
CREATE TRIGGER auditoria_vehiculos_insert
AFTER INSERT ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'INSERT', NEW.patente, NEW.legajo_usuario, CONCAT('Vehículo creado: ', NEW.marca, ' ', NEW.modelo, ' - ', NEW.patente));
END $$

DROP TRIGGER IF EXISTS auditoria_vehiculos_update $$
CREATE TRIGGER auditoria_vehiculos_update
AFTER UPDATE ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'UPDATE', NEW.patente, NEW.legajo_usuario, CONCAT(
        'Antes: ', OLD.marca, ' ', OLD.modelo, ' | Después: ', NEW.marca, ' ', NEW.modelo));
END $$

DROP TRIGGER IF EXISTS auditoria_vehiculos_delete $$
CREATE TRIGGER auditoria_vehiculos_delete
AFTER DELETE ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'DELETE', OLD.patente, OLD.legajo_usuario, CONCAT('Vehículo eliminado: ', OLD.marca, ' ', OLD.modelo, ' - ', OLD.patente));
END $$

-- ==========================
-- TRIGGERS PARA RESERVAS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_reservas_insert $$
CREATE TRIGGER auditoria_reservas_insert
AFTER INSERT ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'INSERT', NEW.id_reserva, NEW.legajo_usuario, CONCAT('Reserva creada: Vehículo ', NEW.patente_vehiculo, ' para el ', NEW.fecha_reserva));
END $$ 

DROP TRIGGER IF EXISTS auditoria_reservas_update $$
CREATE TRIGGER auditoria_reservas_update
AFTER UPDATE ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'UPDATE', NEW.id_reserva, NEW.legajo_usuario, CONCAT(
        'Reserva actualizada: Vehículo ', OLD.patente_vehiculo, ' para el ', OLD.fecha_reserva, 
        ' | Ahora: Vehículo ', NEW.patente_vehiculo, ' para el ', NEW.fecha_reserva));
END $$

DROP TRIGGER IF EXISTS auditoria_reservas_delete $$
CREATE TRIGGER auditoria_reservas_delete
AFTER DELETE ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'DELETE', OLD.id_reserva, OLD.legajo_usuario, CONCAT('Reserva eliminada: Vehículo ', OLD.patente_vehiculo, ' del ', OLD.fecha_reserva));
END $$

DELIMITER ;

-- ===================================================================
-- EVENTO PROGRAMADO PARA PENALIZAR RESERVAS SIN SALIDA REGISTRADA
-- ===================================================================

-- NOTA: Asegúrate de que el programador de eventos esté habilitado: SET GLOBAL event_scheduler = ON;

DELIMITER $$

DROP EVENT IF EXISTS evento_penalizar_ausentes $$

CREATE EVENT evento_penalizar_ausentes
ON SCHEDULE EVERY 5 MINUTE
COMMENT 'Verifica cada 5 minutos si hay reservas "en uso" que no registraron salida y penaliza al usuario.'
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id_reserva INT;
    DECLARE v_legajo_usuario INT UNSIGNED;
    DECLARE v_horario TINYINT UNSIGNED;
    DECLARE v_fecha_reserva DATETIME;
    DECLARE v_hora_fin DATETIME;
    DECLARE cur CURSOR FOR 
        SELECT id_reserva, legajo_usuario, horario, fecha_reserva FROM reservas 
        WHERE estado = 'en uso';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_id_reserva, v_legajo_usuario, v_horario, v_fecha_reserva;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calcular la hora de fin según el horario
        CASE v_horario
            WHEN 1 THEN SET v_hora_fin = DATE_ADD(DATE(v_fecha_reserva), INTERVAL 12 HOUR); -- Mañana termina a las 12:00
            WHEN 2 THEN SET v_hora_fin = DATE_ADD(DATE(v_fecha_reserva), INTERVAL 18 HOUR); -- Tarde termina a las 18:00
            WHEN 3 THEN SET v_hora_fin = DATE_ADD(DATE(v_fecha_reserva), INTERVAL 23 HOUR); -- Noche termina a las 23:00
        END CASE;
        
        -- Si han pasado 15 minutos desde el fin del horario y no registró salida
        IF NOW() > DATE_ADD(v_hora_fin, INTERVAL 15 MINUTE) THEN
            -- Cambiar estado a 'ausente' para no volver a procesarla
            UPDATE reservas SET estado = 'ausente' WHERE id_reserva = v_id_reserva;
            -- Penalizar al usuario restándole 1 token (con un mínimo de 0)
            UPDATE usuarios SET tokens = GREATEST(0, tokens - 1) WHERE legajo = v_legajo_usuario;
        END IF;
    END LOOP;
    CLOSE cur;
END $$

DELIMITER ;


--CREACION DE PROCEDIMIENTOS
DELIMITER $$

-- ==========================================
-- 1️⃣ USUARIOS
-- ==========================================

-- Crear usuario
DROP PROCEDURE IF EXISTS registrar_usuario $$
CREATE PROCEDURE registrar_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_dni INT,
    IN p_contraseña VARCHAR(255)
)
BEGIN
    DECLARE v_initial_tokens TINYINT UNSIGNED;

    -- Determinar los tokens iniciales según el email
    IF p_email LIKE '%@alumnos.%' THEN
        SET v_initial_tokens = 2;
    ELSE
        SET v_initial_tokens = 3;
    END IF;

    INSERT INTO usuarios (legajo, nombre, apellido, email, dni, tokens, contraseña)
    VALUES (p_legajo, p_nombre, p_apellido, p_email, p_dni, v_initial_tokens, p_contraseña);
END $$
-- Actualizar email
DROP PROCEDURE IF EXISTS actualizar_email_usuario $$
CREATE PROCEDURE actualizar_email_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nuevo_email VARCHAR(100)
)
BEGIN
    UPDATE usuarios
    SET email = p_nuevo_email
    WHERE legajo = p_legajo;
END $$

-- Actualizar contraseña
DROP PROCEDURE IF EXISTS actualizar_contraseña_usuario $$
CREATE PROCEDURE actualizar_contraseña_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nueva_contraseña VARCHAR(255)
)
BEGIN
    UPDATE usuarios
    SET contraseña = p_nueva_contraseña
    WHERE legajo = p_legajo;
END $$

-- Elimina usuario y todo lo relacionado a este

DROP PROCEDURE IF EXISTS eliminar_usuario_completo $$
CREATE PROCEDURE eliminar_usuario_completo(IN p_legajo INT UNSIGNED)
BEGIN
    DECLARE v_usuario_count INT;

    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO v_usuario_count
    FROM usuarios
    WHERE legajo = p_legajo;

    IF v_usuario_count = 0 THEN
        -- Lanzar error
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario especificado no existe.';
    ELSE
        -- Iniciar transacción
        START TRANSACTION;

        -- Borrar reservas
        DELETE FROM reservas WHERE legajo_usuario = p_legajo;

        -- Borrar vehículos
        DELETE FROM vehiculos WHERE legajo_usuario = p_legajo;

        -- Anonimizar auditoría
        UPDATE auditoria
        SET legajo_usuario = NULL
        WHERE legajo_usuario = p_legajo;

        -- Borrar usuario
        DELETE FROM usuarios WHERE legajo = p_legajo;

        -- Confirmar transacción
        COMMIT;
    END IF;
END $$

DELIMITER ;


-- ==========================================
-- 2️⃣ RESERVAS
-- ==========================================

-- procedimiento para cerrar una reserva
DELIMITER $$

DROP PROCEDURE IF EXISTS finalizar_reserva_usuario $$
CREATE PROCEDURE finalizar_reserva_usuario(
    IN p_legajo INT UNSIGNED
)
BEGIN
    -- Actualizar la única reserva activa del usuario
    UPDATE reservas
    SET fecha_salida = NOW(),
        estado = 'finalizada'
    WHERE legajo_usuario = p_legajo
      AND estado = 'activa';
END $$

DELIMITER ;

DELIMITER $$

-- Procedimiento para finalizar una reserva específica y devolver un token
DROP PROCEDURE IF EXISTS finalizar_reserva_por_id $$
CREATE PROCEDURE finalizar_reserva_por_id(
    IN p_id_reserva INT
)
BEGIN
    DECLARE v_legajo_usuario INT UNSIGNED;

    -- Obtener el legajo del usuario de la reserva que se va a finalizar
    SELECT legajo_usuario INTO v_legajo_usuario FROM reservas WHERE id_reserva = p_id_reserva AND estado IN ('activa', 'en uso');

    -- Si se encontró una reserva activa con ese ID
    IF v_legajo_usuario IS NOT NULL THEN
        -- Finalizar la reserva
        UPDATE reservas SET estado = 'finalizada', fecha_salida = NOW() WHERE id_reserva = p_id_reserva;

        -- Ya no se devuelve el token al finalizar la reserva.
        -- UPDATE usuarios SET tokens = LEAST(tokens + 1, 20) WHERE legajo = v_legajo_usuario;
    END IF;
END $$

DELIMITER ;

DELIMITER $$

-- Procedimiento para registrar la entrada de un vehículo y cambiar el estado a "en uso"
DROP PROCEDURE IF EXISTS registrar_entrada_reserva $$
CREATE PROCEDURE registrar_entrada_reserva(
    IN p_id_reserva INT
)
BEGIN
    -- Actualiza la reserva para marcar la hora de entrada y cambiar su estado.
    -- Solo debe afectar a reservas que estén 'activas'.
    UPDATE reservas 
    SET fecha_entrada = NOW(), estado = 'en uso' 
    WHERE id_reserva = p_id_reserva AND estado = 'activa';
END $$

DELIMITER ;

-- procedimiento para abrir una reserva
DELIMITER $$

DROP PROCEDURE IF EXISTS abrir_reserva $$ 
CREATE PROCEDURE abrir_reserva(
    IN p_legajo INT UNSIGNED,
    IN p_patente VARCHAR(10),
    IN p_fecha_reserva DATETIME,
    IN p_horario TINYINT UNSIGNED
)
BEGIN
    INSERT INTO reservas (
        legajo_usuario,
        patente_vehiculo,
        horario,
        fecha_reserva,
        estado
    ) VALUES (
        p_legajo,
        p_patente,
        p_horario,
        p_fecha_reserva,
        'activa'
    );
END $$

DELIMITER ;

-- ==========================================
-- 3️⃣ VEHÍCULOS
-- ==========================================

DELIMITER $$

DROP PROCEDURE IF EXISTS registrar_vehiculo $$
CREATE PROCEDURE registrar_vehiculo(
    IN p_patente VARCHAR(10),
    IN p_modelo VARCHAR(50),
    IN p_marca VARCHAR(50),
    IN p_color VARCHAR(30),
    IN p_anio YEAR,
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    DECLARE v_vehiculos_count INT;

    -- Contar cuántos vehículos tiene ya el usuario
    SELECT COUNT(*) INTO v_vehiculos_count
    FROM vehiculos
    WHERE legajo_usuario = p_legajo_usuario;

    -- Si el usuario ya tiene 2 o más vehículos, lanzar un error
    IF v_vehiculos_count >= 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Has alcanzado el límite de 2 vehículos registrados por usuario.';
    ELSE
        -- Si no, proceder con la inserción
        INSERT INTO vehiculos (patente, modelo, marca, color, anio, legajo_usuario)
        VALUES (p_patente, p_modelo, p_marca, p_color, p_anio, p_legajo_usuario);
    END IF;
END $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS eliminar_vehiculo $$
CREATE PROCEDURE eliminar_vehiculo(
    IN p_patente VARCHAR(10)
)
BEGIN
    DELETE FROM vehiculos
    WHERE patente = p_patente;
END $$

DELIMITER ;

DELIMITER $$

-- ============================================================
-- 3️⃣ Obtener todos los usuarios (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_obtener_todos_los_usuarios $$
CREATE PROCEDURE admin_obtener_todos_los_usuarios()
BEGIN
    SELECT 
        legajo,
        nombre,
        apellido,
        email,
        dni,
        rol,
        tokens
    FROM usuarios
    WHERE rol <> 'administrador' ORDER BY apellido, nombre;
END $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS obtener_vehiculos_por_legajo $$
CREATE PROCEDURE obtener_vehiculos_por_legajo(
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    SELECT patente, modelo, marca, color, anio
    FROM vehiculos
    WHERE legajo_usuario = p_legajo_usuario;
END $$

DELIMITER ;

DELIMITER $$

-- ============================================================
-- 2️⃣ Obtener todos los vehículos (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_obtener_todos_los_vehiculos $$
CREATE PROCEDURE admin_obtener_todos_los_vehiculos()
BEGIN
    SELECT 
        v.patente, v.modelo, v.marca, v.color, v.anio,
        v.legajo_usuario,
        u.nombre,
        u.apellido
    FROM vehiculos v
    JOIN usuarios u ON v.legajo_usuario = u.legajo
    ORDER BY u.apellido, u.nombre, v.marca;
END $$

DELIMITER ;

DELIMITER $$

-- ====================================================================
-- 5️⃣ Obtener los días de un mes que tienen reservas (solo administrador)
-- ====================================================================
DROP PROCEDURE IF EXISTS admin_obtener_fechas_con_reservas_por_mes $$
CREATE PROCEDURE admin_obtener_fechas_con_reservas_por_mes(
    IN p_anio INT,
    IN p_mes INT
)
BEGIN
    SELECT DISTINCT DATE(fecha_reserva) AS fecha
    FROM reservas r
    WHERE YEAR(r.fecha_reserva) = p_anio AND MONTH(r.fecha_reserva) = p_mes AND r.estado <> 'cancelada';
END $$

DELIMITER ;

DELIMITER $$

-- Función para verificar si un usuario ya tiene una reserva en una fecha y horario específicos
DROP FUNCTION IF EXISTS usuario_tiene_reserva_en_fecha_y_horario $$
CREATE FUNCTION usuario_tiene_reserva_en_fecha_y_horario(
    p_legajo INT UNSIGNED,
    p_fecha DATE,
    p_horario TINYINT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_reserva_count INT;
    SELECT COUNT(*) INTO v_reserva_count
    FROM reservas
    WHERE legajo_usuario = p_legajo
      AND DATE(fecha_reserva) = p_fecha
      AND horario = p_horario
      AND estado = 'activa';
    
    RETURN IF(v_reserva_count > 0, 1, 0); -- Devuelve 1 si ya tiene reserva, 0 si no
END $$

-- Función para verificar si un usuario ha excedido el límite de reservas activas (límite de 2)
DROP FUNCTION IF EXISTS usuario_excede_limite_reservas_activas $$
CREATE FUNCTION usuario_excede_limite_reservas_activas(
    p_legajo INT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_reservas_activas INT;
    SELECT COUNT(*) INTO v_reservas_activas FROM reservas WHERE legajo_usuario = p_legajo AND estado = 'activa';
    
    RETURN IF(v_reservas_activas >= 2, 1, 0); -- Devuelve 1 si ha alcanzado o excedido el límite, 0 si no
END $$

DELIMITER ;
-- TRIGGER PARA MANEJAR TOKENS

DELIMITER $$

-- Función para verificar si un usuario ya tiene una reserva activa en un día específico
DROP FUNCTION IF EXISTS usuario_tiene_reserva_activa_en_dia $$
CREATE FUNCTION usuario_tiene_reserva_activa_en_dia(
    p_legajo INT UNSIGNED,
    p_fecha DATE
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_reserva_count INT;
    SELECT COUNT(*) INTO v_reserva_count FROM reservas WHERE legajo_usuario = p_legajo AND DATE(fecha_reserva) = p_fecha AND estado = 'activa';
    RETURN IF(v_reserva_count > 0, 1, 0);
END $$

DELIMITER $$

-- ✅ Trigger para usar 1 token cuando se crea una reserva activa
DROP TRIGGER IF EXISTS usar_token_al_reservar $$
CREATE TRIGGER usar_token_al_reservar
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
    DECLARE v_tokens_actuales INT;
    DECLARE v_lugares_disponibles INT;

    -- Buscar tokens del usuario
    SELECT tokens INTO v_tokens_actuales
    FROM usuarios
    WHERE legajo = NEW.legajo_usuario;

    -- Validación 0: ¿Quedan lugares disponibles en el estacionamiento para esa fecha y horario?
    SELECT lugares_disponibles_en_fecha_y_horario(DATE(NEW.fecha_reserva), NEW.horario) INTO v_lugares_disponibles;
    IF v_lugares_disponibles <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No quedan lugares disponibles para la fecha y horario seleccionados.';
    END IF;

    -- Validación 1: ¿El usuario ya tiene una reserva activa para este día? (Aplica a todos, incluyendo admins)
    IF usuario_tiene_reserva_activa_en_dia(NEW.legajo_usuario, DATE(NEW.fecha_reserva)) = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya tienes una reserva activa para este día. Solo se permite una reserva activa por día.';
    END IF;

    -- Validación 2: ¿El usuario ya tiene una reserva para esta fecha y horario?
    IF usuario_tiene_reserva_en_fecha_y_horario(NEW.legajo_usuario, DATE(NEW.fecha_reserva), NEW.horario) = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya tienes una reserva para esta fecha y horario.';
    END IF;

    -- Validación 3: ¿El usuario ha excedido el límite de 2 reservas activas simultáneas?
    IF usuario_excede_limite_reservas_activas(NEW.legajo_usuario) = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Has alcanzado el límite de 2 reservas activas simultáneas.';
    END IF;

    -- Validación de tokens disponibles
    IF v_tokens_actuales IS NULL OR v_tokens_actuales < 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No tienes tokens suficientes para realizar una reserva.';
    ELSE
        -- Descontar token
        UPDATE usuarios
        SET tokens = tokens - 1
        WHERE legajo = NEW.legajo_usuario;
    END IF;
END $$

DELIMITER ;

-- ==================================
-- TRIGGERS DE VALIDACIÓN
-- ==================================

DELIMITER $$



DELIMITER ;

DELIMITER $$

-- Trigger para validar el límite de tokens en CUALQUIER actualización de la tabla usuarios
DROP TRIGGER IF EXISTS validar_limite_tokens_update $$
CREATE TRIGGER validar_limite_tokens_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    DECLARE v_max_tokens TINYINT UNSIGNED;

    -- Determinar el límite de tokens según el email
    IF NEW.email LIKE '%@alumnos.%' THEN
        SET v_max_tokens = 2;
    ELSE
        SET v_max_tokens = 3;
    END IF;

    -- Si el nuevo valor de tokens supera el máximo permitido, lo ajusta al límite en lugar de lanzar un error.
    IF NEW.tokens > v_max_tokens THEN
        SET NEW.tokens = v_max_tokens;
    END IF;
END $$

DELIMITER $$

-- Trigger para validar y corregir el límite de tokens en INSERCIONES
DROP TRIGGER IF EXISTS validar_limite_tokens_insert $$
CREATE TRIGGER validar_limite_tokens_insert
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    DECLARE v_max_tokens TINYINT UNSIGNED;

    -- Determinar el límite de tokens según el email del usuario que se está insertando
    IF NEW.email LIKE '%@alumnos.%' THEN
        SET v_max_tokens = 2;
    ELSE
        SET v_max_tokens = 3;
    END IF;

    -- Si el valor de tokens que se intenta insertar supera el máximo permitido, lo ajusta al límite.
    IF NEW.tokens > v_max_tokens THEN
        SET NEW.tokens = v_max_tokens;
    END IF;
END $$

DELIMITER $$

-- ===================================================================
-- 1️⃣ Actualizar datos de un usuario (solo administrador)
-- Este procedimiento reemplaza a los individuales para nombre, apellido y tokens.
-- ===================================================================
DROP PROCEDURE IF EXISTS admin_actualizar_usuario $$
CREATE PROCEDURE admin_actualizar_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nuevo_nombre VARCHAR(50),
    IN p_nuevo_apellido VARCHAR(50),
    IN p_nuevos_tokens TINYINT UNSIGNED
)
BEGIN
    -- Validar que los tokens estén dentro del rango permitido
    -- La validación ahora se hace en el trigger 'validar_limite_tokens_update'
    -- por lo que el IF/ELSE aquí ya no es estrictamente necesario, pero lo dejamos como una
    -- primera barrera. El trigger es la regla final.
    -- IF p_nuevos_tokens > 3 THEN ... (se podría poner, pero el trigger es más robusto)
        UPDATE usuarios
        SET 
            nombre = p_nuevo_nombre,
            apellido = p_nuevo_apellido,
            tokens = p_nuevos_tokens
        WHERE legajo = p_legajo;
END $$

DELIMITER ;

DELIMITER $$

-- Procedimiento para cancelar una reserva específica y devolver un token (via trigger)
DROP PROCEDURE IF EXISTS cancelar_reserva_por_id $$
CREATE PROCEDURE cancelar_reserva_por_id(
    IN p_id_reserva INT
)
BEGIN
    -- Cambia el estado de la reserva a 'cancelada'.
    -- Solo debe afectar a reservas que estén 'activas'.
    -- El trigger 'devolver_token_al_cancelar' se encargará de devolver el token.
    UPDATE reservas 
    SET estado = 'cancelada' 
    WHERE id_reserva = p_id_reserva AND estado = 'activa';
END $$

DELIMITER ;

DELIMITER $$

-- ====================================================================
-- FUNCIÓN para obtener el ID de la próxima reserva activa de un usuario
-- ====================================================================
DROP FUNCTION IF EXISTS obtener_proxima_reserva_activa_id $$
CREATE FUNCTION obtener_proxima_reserva_activa_id(
    p_legajo_usuario INT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_id_reserva INT;

    SELECT id_reserva INTO v_id_reserva
    FROM reservas
    WHERE legajo_usuario = p_legajo_usuario
      AND estado = 'activa'
      AND fecha_reserva >= CURDATE() -- Buscamos desde el inicio del día de hoy hacia el futuro
    ORDER BY fecha_reserva ASC -- La más cercana en el tiempo primero
    LIMIT 1; -- Solo nos interesa la primera que encuentre

    RETURN v_id_reserva; -- Devuelve el ID encontrado o NULL si no hay ninguna
END $$

DELIMITER ;

DELIMITER $$

-- ====================================================================
-- FUNCIÓN para obtener el ID de la reserva "en uso" de un usuario
-- ====================================================================
DROP FUNCTION IF EXISTS obtener_reserva_en_uso_id $$
CREATE FUNCTION obtener_reserva_en_uso_id(
    p_legajo_usuario INT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_id_reserva INT;

    SELECT id_reserva INTO v_id_reserva
    FROM reservas
    WHERE legajo_usuario = p_legajo_usuario AND estado = 'en uso'
    LIMIT 1; -- Solo debería haber una, pero limitamos por seguridad

    RETURN v_id_reserva; -- Devuelve el ID encontrado o NULL si no hay ninguna
END $$

DELIMITER ;


DELIMITER ;

DELIMITER $$

-- ✅ Trigger para devolver 1 token cuando se CANCELA una reserva
DROP TRIGGER IF EXISTS devolver_token_al_cancelar $$
CREATE TRIGGER devolver_token_al_cancelar
AFTER UPDATE ON reservas
FOR EACH ROW
BEGIN
    DECLARE v_max_tokens TINYINT UNSIGNED;
    DECLARE v_user_email VARCHAR(100);

    -- Si el estado anterior era 'activa' y el nuevo es 'cancelada'
    IF OLD.estado = 'activa' AND NEW.estado = 'cancelada' THEN
        -- Obtener el email del usuario para determinar su límite de tokens
        SELECT email INTO v_user_email FROM usuarios WHERE legajo = NEW.legajo_usuario;

        -- Determinar el límite de tokens
        IF v_user_email LIKE '%@alumnos.%' THEN SET v_max_tokens = 2;
        ELSE SET v_max_tokens = 3;
        END IF;
        -- Devolver un token al usuario, respetando el nuevo tope dinámico
        UPDATE usuarios SET tokens = LEAST(tokens + 1, v_max_tokens) WHERE legajo = NEW.legajo_usuario;
    END IF;
END $$

DELIMITER ;

DELIMITER $$

DELIMITER $$

-- ==================================
-- TRIGGERS PARA CONTACTOS
-- ==================================

DROP TRIGGER IF EXISTS auditoria_contactos_insert $$
CREATE TRIGGER auditoria_contactos_insert
AFTER INSERT ON contactos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, clave_primaria, detalle)
    VALUES (
        'contactos',
        'INSERT',
        NEW.id_contacto,
        CONCAT('Nuevo mensaje recibido de ', NEW.email)
    );
END $$

DROP TRIGGER IF EXISTS auditoria_contactos_delete $$
CREATE TRIGGER auditoria_contactos_delete
AFTER DELETE ON contactos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, clave_primaria, detalle)
    VALUES (
        'contactos',
        'DELETE',
        OLD.id_contacto,
        CONCAT('Mensaje eliminado de ', OLD.email)
    );
END $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS obtener_reservas_por_legajo $$
CREATE PROCEDURE obtener_reservas_por_legajo(
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    SELECT id_reserva, patente_vehiculo, horario, fecha_reserva, estado
    FROM reservas
    WHERE legajo_usuario = p_legajo_usuario
    ORDER BY fecha_reserva DESC;
END $$

DELIMITER ;

DELIMITER $$

-- ============================================================
-- 4️⃣ Obtener todas las reservas de una fecha (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_obtener_reservas_por_fecha $$
CREATE PROCEDURE admin_obtener_reservas_por_fecha(
    IN p_fecha DATE
)
BEGIN
    SELECT 
        r.id_reserva,
        r.legajo_usuario,
        u.nombre,
        u.apellido,
        r.patente_vehiculo,
        r.horario,
        r.estado
    FROM reservas r
    JOIN usuarios u ON r.legajo_usuario = u.legajo
    WHERE DATE(r.fecha_reserva) = p_fecha;
END $$

DELIMITER ;

DELIMITER $$

-- ==================================
-- PROCEDIMIENTOS PARA CONTACTOS
-- ==================================

-- 1️⃣ Registrar un nuevo mensaje
DROP PROCEDURE IF EXISTS registrar_contacto $$
CREATE PROCEDURE registrar_contacto(
    IN p_email VARCHAR(100),
    IN p_tema ENUM('Consulta general', 'Problemas con mi cuenta', 'Sugerencias', 'Reportar un error', 'Otros'),
    IN p_mensaje TEXT
)
BEGIN
    INSERT INTO contactos (email, tema, mensaje)
    VALUES (p_email, p_tema, p_mensaje);
END $$

-- 3️⃣ Buscar mensajes por email
DROP PROCEDURE IF EXISTS buscar_contactos_por_email $$
CREATE PROCEDURE buscar_contactos_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT id_contacto, email, tema, mensaje, fecha_envio
    FROM contactos
    WHERE email = p_email
    ORDER BY fecha_envio DESC;
END $$


-- 4️⃣ Eliminar un mensaje por ID
DROP PROCEDURE IF EXISTS eliminar_contacto_por_id $$
CREATE PROCEDURE eliminar_contacto_por_id(
    IN p_id_contacto INT
)
BEGIN
    DELETE FROM contactos
    WHERE id_contacto = p_id_contacto;
END $$

-- 5️⃣ Eliminar un mensaje por email
DROP PROCEDURE IF EXISTS eliminar_contacto_por_email $$
CREATE PROCEDURE eliminar_contacto_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    DELETE FROM contactos
    WHERE email = p_email;
END $$

-- 6️⃣ Responder un mensaje de contacto (solo admin)
DROP PROCEDURE IF EXISTS admin_responder_contacto $$
CREATE PROCEDURE admin_responder_contacto(
    IN p_id_contacto INT,
    IN p_legajo_admin INT UNSIGNED,
    IN p_mensaje_respuesta TEXT
)
BEGIN
    -- Insertar la respuesta
    INSERT INTO contactos_respuestas (id_contacto, legajo_admin, mensaje_respuesta)
    VALUES (p_id_contacto, p_legajo_admin, p_mensaje_respuesta);

    -- Marcar el mensaje original como respondido
    UPDATE contactos SET respondido = TRUE WHERE id_contacto = p_id_contacto;
END $$

-- 7️⃣ Obtener las respuestas de un mensaje de contacto (solo admin)
DROP PROCEDURE IF EXISTS admin_obtener_respuestas_por_contacto $$
CREATE PROCEDURE admin_obtener_respuestas_por_contacto(
    IN p_id_contacto INT
)
BEGIN
    SELECT 
        cr.id_respuesta,
        cr.mensaje_respuesta,
        cr.fecha_respuesta,
        cr.legajo_admin,
        CONCAT(u.nombre, ' ', u.apellido) AS admin_nombre_completo
    FROM contactos_respuestas cr
    LEFT JOIN usuarios u ON cr.legajo_admin = u.legajo
    WHERE cr.id_contacto = p_id_contacto
    ORDER BY cr.fecha_respuesta ASC;
END $$

DELIMITER ;

DELIMITER $$

-- ============================================================
-- 6️⃣ Obtener todos los mensajes de contacto (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_obtener_todos_los_contactos $$
CREATE PROCEDURE admin_obtener_todos_los_contactos()
BEGIN
    SELECT 
        id_contacto,
        email,
        tema,
        mensaje,
        fecha_envio,
        respondido -- Devolvemos el nuevo campo
    FROM contactos
    ORDER BY fecha_envio DESC;
END $$

DELIMITER ;
-- ==================================
-- ÍNDICES PARA RENDIMIENTO
-- ==================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_reservas_usuario ON reservas(legajo_usuario);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_entrada);
CREATE INDEX idx_vehiculos_usuario ON vehiculos(legajo_usuario);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_contactos_email ON contactos(email);


-- ==================================
-- FUNCIONES AUXILIARES
-- ==================================

DELIMITER $$

-- Función para validar formato de email UTN
DROP FUNCTION IF EXISTS validar_email $$
CREATE FUNCTION validar_email(p_email VARCHAR(100))
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    IF p_email REGEXP '^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$' THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END $$

-- Función para verificar si una fecha pertenece a la semana actual
DROP FUNCTION IF EXISTS es_semana_actual $$
CREATE FUNCTION es_semana_actual(p_fecha DATE)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    -- YEARWEEK(fecha, 1) calcula el año y la semana, considerando el lunes como primer día.
    -- Comparamos si la semana de la fecha a reservar es la misma que la semana de la fecha actual.
    IF YEARWEEK(p_fecha, 1) = YEARWEEK(CURDATE(), 1) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END $$





-- procedimiento para calcular cuantos espacios hay disponibles en un determinado momento
DELIMITER $$

DROP FUNCTION IF EXISTS lugares_disponibles_en_fecha_y_horario $$

CREATE FUNCTION lugares_disponibles_en_fecha_y_horario(
    p_fecha DATE, 
    p_horario TINYINT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_total_lugares INT;
    DECLARE v_reservas_ocupadas INT;
    DECLARE v_lugares_libres INT;

    -- Total de lugares en el estacionamiento
    SELECT CAST(valor AS UNSIGNED) INTO v_total_lugares
    FROM configuracion WHERE clave = 'capacidad_maxima';

    -- Cantidad de reservas activas para una fecha y horario específicos
    SELECT COUNT(*) INTO v_reservas_ocupadas
    FROM reservas
    WHERE estado IN ('activa', 'en uso') -- Contamos tanto las activas como las que ya entraron
      AND DATE(fecha_reserva) = p_fecha
      AND horario = p_horario;

    -- Calcular lugares libres
    SET v_lugares_libres = v_total_lugares - v_reservas_ocupadas; -- La lógica se mantiene

    RETURN v_lugares_libres;
END $$

DELIMITER ;

-- ==================================
-- SEEDING: POBLAR DATOS INICIALES
-- ==================================

-- Insertamos el valor inicial para la capacidad máxima del estacionamiento.
INSERT INTO configuracion (clave, valor, descripcion)
VALUES ('capacidad_maxima', '50', 'Define el número total de espacios de estacionamiento disponibles para reservar.');

-- la contraseña es password123
INSERT INTO `usuarios` (`legajo`, `nombre`, `apellido`, `email`, `dni`, `tokens`, `contraseña`, `rol`) 
VALUES ('10000', 'admin', 'admin', 'aadmin111@frh.utn.edu.ar', '11111111', '3', '$2b$10$4UZNQDd3O62d19VsXHhlJeJtpxNPFkEiALpMbNCGrWeqgFVSP./d6', 'administrador');


INSERT INTO `vehiculos` (`patente`, `modelo`, `marca`, `color`, `anio`, `legajo_usuario`)
VALUES ('AE785GR', 'Cronos', 'Fiat', 'Gris', '2021', '10000');


-- bloque de pruebas

-- Script para insertar 20 usuarios de prueba y sus vehículos en la base de datos autoutn.
-- NOTA: La contraseña para todos los usuarios es 'password123'. El hash corresponde a esa contraseña.
-- NOTA 2: El formato del email ha sido actualizado a: [primera_letra_nombre][apellido][ultimos_3_digitos_legajo]@alumnos.frh.utn.edu.ar

USE autoutn;

-- Primero, eliminamos los datos anteriores para evitar conflictos de claves duplicadas si ya ejecutaste el script anterior.
-- ¡CUIDADO! Esto borrará los usuarios y vehículos con estos legajos/patentes si ya existen.
DELETE FROM vehiculos WHERE legajo_usuario BETWEEN 30001 AND 30020;
DELETE FROM usuarios WHERE legajo BETWEEN 30001 AND 30020;

-- Inserción de 20 usuarios de ejemplo con el nuevo formato de email
INSERT INTO `usuarios` (`legajo`, `nombre`, `apellido`, `email`, `dni`, `tokens`, `contraseña`, `rol`) VALUES
(30001, 'Juan', 'Perez', 'jperez001@alumnos.frh.utn.edu.ar', 40123451, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30002, 'Maria', 'Garcia', 'mgarcia002@alumnos.frh.utn.edu.ar', 40123452, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30003, 'Carlos', 'Rodriguez', 'crodriguez003@alumnos.frh.utn.edu.ar', 40123453, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30004, 'Ana', 'Martinez', 'amartinez004@alumnos.frh.utn.edu.ar', 40123454, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30005, 'Luis', 'Lopez', 'llopez005@alumnos.frh.utn.edu.ar', 40123455, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30006, 'Laura', 'Sanchez', 'lsanchez006@alumnos.frh.utn.edu.ar', 40123456, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30007, 'Pedro', 'Gomez', 'pgomez007@alumnos.frh.utn.edu.ar', 40123457, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30008, 'Sofia', 'Fernandez', 'sfernandez008@alumnos.frh.utn.edu.ar', 40123458, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30009, 'Diego', 'Diaz', 'ddiaz009@alumnos.frh.utn.edu.ar', 40123459, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30010, 'Valentina', 'Romero', 'vromero010@alumnos.frh.utn.edu.ar', 40123460, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30011, 'Javier', 'Suarez', 'jsuarez011@alumnos.frh.utn.edu.ar', 40123461, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30012, 'Camila', 'Torres', 'ctorres012@alumnos.frh.utn.edu.ar', 40123462, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30013, 'Andres', 'Dominguez', 'adominguez013@alumnos.frh.utn.edu.ar', 40123463, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30014, 'Lucia', 'Vazquez', 'lvazquez014@alumnos.frh.utn.edu.ar', 40123464, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30015, 'Mateo', 'Sosa', 'msosa015@alumnos.frh.utn.edu.ar', 40123465, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30016, 'Micaela', 'Rojas', 'mrojas016@alumnos.frh.utn.edu.ar', 40123466, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30017, 'Facundo', 'Acosta', 'facosta017@alumnos.frh.utn.edu.ar', 40123467, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30018, 'Julieta', 'Benitez', 'jbenitez018@alumnos.frh.utn.edu.ar', 40123468, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30019, 'Nicolas', 'Ramirez', 'nramirez019@alumnos.frh.utn.edu.ar', 40123469, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general'),
(30020, 'Agustina', 'Gimenez', 'agimenez020@alumnos.frh.utn.edu.ar', 40123470, 4, '$2b$10$Th6WbnCzbn8PUXT./HXjL.UGQb7zJg79iAi3WHVySumt.xvlq/MfC', 'general');

-- Inserción de 1 vehículo para cada uno de los usuarios anteriores
INSERT INTO `vehiculos` (`patente`, `modelo`, `marca`, `color`, `anio`, `legajo_usuario`) VALUES
('AD123AA', 'Cronos', 'Fiat', 'Blanco', 2019, 30001),
('AE456BB', '208', 'Peugeot', 'Rojo', 2021, 30002),
('AF789CC', 'Onix', 'Chevrolet', 'Gris', 2020, 30003),
('AG111DD', 'Gol Trend', 'Volkswagen', 'Negro', 2018, 30004),
('AH222EE', 'Sandero', 'Renault', 'Azul', 2022, 30005),
('AI333FF', 'Etios', 'Toyota', 'Plata', 2019, 30006),
('AJ444GG', 'Focus', 'Ford', 'Blanco', 2017, 30007),
('AK555HH', 'Cruze', 'Chevrolet', 'Negro', 2021, 30008),
('AL666II', 'Polo', 'Volkswagen', 'Gris', 2023, 30009),
('AM777JJ', 'Argo', 'Fiat', 'Rojo', 2020, 30010),
('AN888KK', 'Ka', 'Ford', 'Blanco', 2018, 30011),
('AO999LL', 'Yaris', 'Toyota', 'Azul', 2022, 30012),
('AP101MM', 'C3', 'Citroën', 'Gris', 2019, 30013),
('AQ202NN', 'Kwid', 'Renault', 'Naranja', 2021, 30014),
('AR303OO', 'Mobi', 'Fiat', 'Blanco', 2020, 30015),
('AS404PP', 'Nivus', 'Volkswagen', 'Rojo', 2022, 30016),
('AT505QQ', 'Tracker', 'Chevrolet', 'Gris', 2023, 30017),
('AU606RR', '2008', 'Peugeot', 'Blanco', 2019, 30018),
('AV707SS', 'Corolla', 'Toyota', 'Negro', 2021, 30019),
('AW808TT', 'Fiesta', 'Ford', 'Plata', 2017, 30020);
-- ===================================================================
-- INSERCIÓN MANUAL DE RESERVAS DE PRUEBA
-- ===================================================================
-- NOTA: Estas inserciones directas no activan los triggers de descuento de tokens.
-- Se asume que los tokens ya fueron descontados o que esto es solo para fines de visualización y prueba del panel.

-- Usamos CURDATE() para que las fechas sean relativas al día en que se ejecuta el script.
-- Esto asegura que siempre tendrás datos relevantes para "hoy", "ayer", "mañana", etc.

INSERT INTO `reservas` (`legajo_usuario`, `patente_vehiculo`, `horario`, `fecha_reserva`, `fecha_entrada`, `fecha_salida`, `estado`) VALUES
-- Reservas para el día de HOY (para que aparezcan en el calendario)
(30001, 'AD123AA', 1, CONCAT(CURDATE(), ' 08:00:00'), NULL, NULL, 'activa'),                                     -- Activa para hoy a la mañana
(30002, 'AE456BB', 2, CONCAT(CURDATE(), ' 13:00:00'), CONCAT(CURDATE(), ' 13:05:00'), NULL, 'en uso'),         -- En uso para hoy a la tarde
(30003, 'AF789CC', 3, CONCAT(CURDATE(), ' 18:00:00'), NULL, NULL, 'activa'),                                     -- Activa para hoy a la noche

-- Reservas para el día de AYER
(30004, 'AG111DD', 1, CONCAT(CURDATE() - INTERVAL 1 DAY, ' 08:00:00'), CONCAT(CURDATE() - INTERVAL 1 DAY, ' 08:10:00'), CONCAT(CURDATE() - INTERVAL 1 DAY, ' 12:30:00'), 'finalizada'), -- Finalizada de ayer
(30005, 'AH222EE', 2, CONCAT(CURDATE() - INTERVAL 1 DAY, ' 13:00:00'), NULL, NULL, 'cancelada'),                  -- Cancelada de ayer

-- Reservas para el día de MAÑANA
(30006, 'AI333FF', 1, CONCAT(CURDATE() + INTERVAL 1 DAY, ' 08:00:00'), NULL, NULL, 'activa'),                     -- Activa para mañana
(30007, 'AJ444GG', 3, CONCAT(CURDATE() + INTERVAL 1 DAY, ' 18:00:00'), NULL, NULL, 'activa');                     -- Activa para mañana

-- ===================================================================
-- EVENTO PROGRAMADO PARA RECARGA SEMANAL DE TOKENS
-- ===================================================================

-- PASO 1: Habilitar el programador de eventos de MySQL.
-- Debes ejecutar esta línea UNA VEZ en tu cliente de base de datos (como root o un usuario con privilegios SUPER).
-- SET GLOBAL event_scheduler = ON;

-- Para verificar si está activo, puedes usar:
-- SHOW VARIABLES LIKE 'event_scheduler';

DELIMITER $$

DROP EVENT IF EXISTS evento_recarga_semanal_tokens $$

-- PASO 2: Crear el evento.
CREATE EVENT evento_recarga_semanal_tokens
ON SCHEDULE EVERY 1 WEEK
STARTS STR_TO_DATE(CONCAT(DATE_FORMAT(CURDATE() + INTERVAL (7 - DAYOFWEEK(CURDATE())) DAY, '%Y-%m-%d'), ' 03:00:00'), '%Y-%m-%d %H:%i:%s')
COMMENT 'Recarga 3 tokens a todos los usuarios cada domingo a las 3 AM, respetando sus límites.'
DO
BEGIN
    UPDATE usuarios SET tokens = tokens + 3;
END $$

DELIMITER ;

-- Función para calcular lugares disponibles por fecha y turno
DELIMITER $$

DROP FUNCTION IF EXISTS calcular_lugares_disponibles $$
CREATE FUNCTION calcular_lugares_disponibles(
    p_fecha DATE,
    p_turno TINYINT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_total_lugares INT;
    DECLARE v_reservas_ocupadas INT;
    DECLARE v_lugares_libres INT;
    
    -- Obtener total de lugares desde configuración
    SELECT CAST(valor AS UNSIGNED) INTO v_total_lugares
    FROM configuracion 
    WHERE clave = 'capacidad_maxima';
    
    -- Contar reservas activas para la fecha y turno específicos
    SELECT COUNT(*) INTO v_reservas_ocupadas
    FROM reservas
    WHERE DATE(fecha_reserva) = p_fecha
      AND horario = p_turno
      AND estado IN ('activa', 'en uso');
    
    -- Calcular lugares libres
    SET v_lugares_libres = v_total_lugares - v_reservas_ocupadas;

    IF v_lugares_libres < 0 THEN 
        SET v_lugares_libres = 0;
    END IF;

    RETURN v_lugares_libres;
END $$

DELIMITER ;
