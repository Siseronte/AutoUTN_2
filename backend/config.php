<?php
/**
 * Archivo de configuración de la base de datos.
 * Modifica estos valores para que coincidan con tu entorno.
 */
define('DB_HOST', '127.0.0.1'); // O 'localhost'
define('DB_USER', 'root');
define('DB_PASS', ''); // La contraseña de tu usuario root (si la tienes)
define('DB_NAME', 'autoutn');

/**
 * Archivo de configuración para el envío de correos con PHPMailer.
 * REEMPLAZA ESTOS VALORES con tus credenciales de SMTP.
 */
define('EMAIL_HOST', 'smtp.gmail.com');      // Ej: 'smtp.gmail.com'
define('EMAIL_USER', 'autoutn@gmail.com');  // Ej: 'tu.correo@gmail.com'
define('EMAIL_PASS', 'cnoa vcjh ivxf ucrv');         // Contraseña de tu email o contraseña de aplicación
define('EMAIL_PORT', 465);                     // Puerto SMTP. 465 para SSL, 587 para TLS
define('EMAIL_FROM_NAME', 'Soporte AutoUTN');  // El nombre que aparecerá como remitente

?>