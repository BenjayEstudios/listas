<?php
header("Content-Type: application/json");
// require_once '../config/db.php';
require_once '../../../db.php'; # prod

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? null;
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        throw new Exception("Usuario y contraseña son requeridos");
    }

    if ($action === 'register') {
        // Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            throw new Exception("El nombre de usuario ya está registrado");
        }

        // Encriptar contraseña en frío con algoritmo estándar (bcrypt)
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmtInsert = $pdo->prepare("INSERT INTO usuarios (username, password) VALUES (?, ?)");
        $stmtInsert->execute([$username, $hashedPassword]);

        echo json_encode(["success" => true, "message" => "Usuario registrado con éxito"]);

    } elseif ($action === 'login') {
        // Buscar usuario
        $stmt = $pdo->prepare("SELECT username, password FROM usuarios WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // Validar credenciales de forma estricta
        if (!$user || !password_verify($password, $user['password'])) {
            throw new Exception("Credenciales incorrectas");
        }

        // Éxito: Retornamos el username para el manejo de sesión en el cliente
        echo json_encode([
            "success" => true,
            "username" => $user['username'],
            "message" => "Inicio de sesión correcto"
        ]);
    } else {
        throw new Exception("Acción no válida");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}