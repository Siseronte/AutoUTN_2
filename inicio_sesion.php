<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Página</title>
    <link rel="stylesheet" type="text/css" href="estilos/estilos_admin.css">
    <link rel="stylesheet" type="text/css" href="normalize.css">
</head>
<body class="body-principal">
    <?php
    session_start();
    include 'conexion.php';

    // Obtener datos del formulario

    $email = mysqli_real_escape_string($conexion, $_POST['email']);
    $contraseña = md5($_POST['password']);

    // Consulta para verificar si el correo electrónico y la contraseña coinciden

    $sql = "SELECT * FROM usuario WHERE Email = '$email' AND Contraseña = '$contraseña'";
    $result = mysqli_query($conexion, $sql);

    if (mysqli_num_rows($result) == 1) {
        $row = mysqli_fetch_assoc($result);

        // Las credenciales son correctas, iniciar sesión

        $_SESSION['usuario'] = $row['ID'];
        $_SESSION['nombre'] = $row['Nombre']; 
        $_SESSION['admin'] = $row['Admin'];

        // Verificar el valor del campo Admin
        if ($_SESSION['admin'] == 0) {
            header('Location: index_cliente.php');
        } else {
            header('Location: index_admin.php');
        }
    } else {
        // Las credenciales son incorrectas, mostrar un mensaje de error
        
        header("Location: form_iniciosesion.html?mensaje=El correo electrónico o la contraseña son incorrectos.&exito=0");
    }

    mysqli_close($conexion);
    ?>

</body>
</html>
