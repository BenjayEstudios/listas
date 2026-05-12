<?php
// Configuración de acceso (Asegúrate que coincidan con lo que creamos en MariaDB)
$host = '127.0.0.1'; // Forzamos TCP para evitar problemas de socket en Linux
$db   = 'complementos';
$user = 'complentosDB';
$pass = 'complementosDB';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

header('Content-Type: text/html; charset=utf-8');

try {
    // Intentamos la conexión
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "<h2 style='color: green;'>✅ Conexión Exitosa</h2>";
    echo "<p>Estás conectado a la base de datos: <strong>$db</strong></p>";

    // Consulta de verificación técnica
    $query = $pdo->query("SELECT USER() as usuario, VERSION() as version");
    $info = $query->fetch();

    echo "<ul>";
    echo "<li><strong>Usuario en MySQL:</strong> " . $info['usuario'] . "</li>";
    echo "<li><strong>Versión del Servidor:</strong> " . $info['version'] . "</li>";
    echo "</ul>";

} catch (PDOException $e) {
    // Si falla, mostramos el error detallado
    echo "<h2 style='color: red;'>❌ Error de Conexión</h2>";
    echo "<p>Mensaje: " . $e->getMessage() . "</p>";
    echo "<hr>";
    echo "<p><strong>Consejo de Ingeniero:</strong> Si el error es 'Access denied', revisa que el usuario 
          y la contraseña en el script coincidan exactamente con lo que ejecutamos en MariaDB.</p>";
}