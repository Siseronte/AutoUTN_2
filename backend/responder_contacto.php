<?php
// 2. Configurar cabeceras para la respuesta JSON y CORS (Cross-Origin Resource Sharing)
// Esto permite que tu frontend (en un dominio/puerto diferente) pueda comunicarse con este script.
// ¡IMPORTANTE! Esto debe ser lo PRIMERO que hace el script.
header("Access-Control-Allow-Origin: *"); // Permite peticiones desde cualquier origen (ajustar en producción a tu dominio del frontend).
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 1. Incluir la configuración y las clases de PHPMailer
// Usamos __DIR__ para asegurar que las rutas sean correctas sin importar cómo se llame al script.
require __DIR__ . '/config.php';
require __DIR__ . '/php_mailer/PHPMailer.php';
require __DIR__ . '/php_mailer/SMTP.php';
require __DIR__ . '/php_mailer/Exception.php';

// Usar las clases del namespace de PHPMailer para evitar conflictos de nombres.
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Manejar la petición preliminar (preflight) de CORS.
// El navegador envía una petición OPTIONS antes de un POST con JSON.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // Responder con OK
    exit(); // Y terminar el script. No procesar nada más.
}

// 3. Verificar que la petición sea de tipo POST, que es como el frontend envía los datos.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // 405 Método no permitido
    echo json_encode(['message' => 'Método no permitido. Solo se aceptan peticiones POST.']);
    exit();
}

// 4. Obtener los datos del cuerpo de la petición (enviados como JSON desde admin-panel.js)
$data = json_decode(file_get_contents("php://input"));

// Validar que los datos necesarios (id_contacto, legajo_admin, mensaje_respuesta) estén presentes.
if (empty($data->id_contacto) || empty($data->legajo_admin) || empty($data->mensaje_respuesta)) {
    http_response_code(400); // 400 Petición incorrecta
    echo json_encode(['message' => 'Faltan datos: id_contacto, legajo_admin y mensaje_respuesta son requeridos.']);
    exit();
}

// Asignar los datos a variables para un uso más fácil.
$id_contacto = $data->id_contacto;
$legajo_admin = $data->legajo_admin;
$mensaje_respuesta = $data->mensaje_respuesta;

// 5. Conexión a la base de datos usando MySQLi (orientado a objetos)
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Verificar si la conexión a la base de datos falló.
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Error de conexión a la base de datos: ' . $mysqli->connect_error]);
    exit();
}

// Iniciar una transacción. Esto asegura que si el envío de correo falla,
// la respuesta tampoco se guarde en la base de datos, manteniendo la consistencia.
$mysqli->begin_transaction();

try {
    // PASO A: Obtener los datos del mensaje original para poder construir el correo.
    $stmt_select = $mysqli->prepare("SELECT email, tema, mensaje FROM contactos WHERE id_contacto = ?");
    $stmt_select->bind_param("i", $id_contacto); // "i" significa que el parámetro es un entero.
    $stmt_select->execute();
    $result = $stmt_select->get_result();
    $contacto_original = $result->fetch_assoc();
    $stmt_select->close();

    if (!$contacto_original) {
        throw new Exception('El mensaje de contacto original no fue encontrado.', 404);
    }

    // PASO B: Guardar la respuesta en la base de datos llamando al procedimiento almacenado que ya tienes.
    $stmt_insert = $mysqli->prepare("CALL admin_responder_contacto(?, ?, ?)");
    $stmt_insert->bind_param("iss", $id_contacto, $legajo_admin, $mensaje_respuesta); // "i" entero, "s" string, "s" string
    $stmt_insert->execute();
    $stmt_insert->close();

    // PASO C: Enviar el correo electrónico al usuario usando PHPMailer.
    $mail = new PHPMailer(true); // El 'true' activa las excepciones en caso de error.
    
    // Configuración del servidor SMTP (usando los datos de config.php)
    $mail->isSMTP();
    $mail->Host       = EMAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = EMAIL_USER;
    $mail->Password   = EMAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // 'ssl'
    $mail->Port       = EMAIL_PORT;
    $mail->CharSet    = 'UTF-8';

    // Remitente y destinatario
    $mail->setFrom(EMAIL_USER, EMAIL_FROM_NAME);
    $mail->addAddress($contacto_original['email']); // Email del usuario que hizo la consulta.

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = 'Respuesta a tu consulta: "' . htmlspecialchars($contacto_original['tema']) . '"';
    $mail->Body    = '
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Respuesta a tu consulta en AutoUTN</h2>
            <p>Hola,</p>
            <p>Hemos respondido a tu mensaje sobre el tema: <strong>' . htmlspecialchars($contacto_original['tema']) . '</strong>.</p>
            <hr>
            <p><strong>Tu mensaje original:</strong></p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin-left: 1em; color: #555;">' . nl2br(htmlspecialchars($contacto_original['mensaje'])) . '</blockquote>
            <p><strong>Nuestra respuesta:</strong></p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
                <p>' . nl2br(htmlspecialchars($mensaje_respuesta)) . '</p>
            </div>
            <p>Gracias por contactarnos.</p>
            <p><em>El equipo de AutoUTN</em></p>
        </div>';
    
    $mail->send();

    // Si todo fue bien (guardado en BD y envío de email), confirmar la transacción.
    $mysqli->commit();

    // Enviar respuesta de éxito al frontend.
    http_response_code(201); // 201 Creado
    echo json_encode(['message' => 'Respuesta guardada y enviada por correo con éxito.']);

} catch (Exception $e) {
    // Si algo falla (en la BD o en el envío de email), revertir la transacción.
    $mysqli->rollback();
    
    // Enviar mensaje de error al frontend.
    http_response_code(500);
    echo json_encode(['message' => 'Error al procesar la respuesta: ' . $e->getMessage()]);

} finally {
    // Cerrar siempre la conexión a la base de datos.
    $mysqli->close();
}
?>