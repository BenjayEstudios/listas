<?php
$host = 'localhost';
$user = 'root'; // Tu usuario de MySQL
$pass = '';     // Tu contraseña de MySQL

try {
    // 1. Conectar al servidor de MySQL (sin base de datos aún)
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Crear la Base de Datos
    $pdo->exec("CREATE DATABASE IF NOT EXISTS complementos CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci");
    echo "Base de datos 'complementos' lista.<br>";

    // 3. Conectar a la base de datos recién creada
    $pdo->exec("USE complementos");

    // 4. Crear Tabla 'listas'
    $sqlListas = "CREATE TABLE IF NOT EXISTS listas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        estado TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creador VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB";
    $pdo->exec($sqlListas);
    echo "Tabla 'listas' creada.<br>";

    // 5. Crear Tabla 'items_lista'
    $sqlItems = "CREATE TABLE IF NOT EXISTS items_lista (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lista_id INT NOT NULL,
        contenido TEXT NOT NULL,
        completado TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_lista FOREIGN KEY (lista_id) REFERENCES listas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB";
    $pdo->exec($sqlItems);
    echo "Tabla 'items_lista' creada.<br>";

} catch (PDOException $e) {
    die("Error crítico: " . $e->getMessage());
}
?>