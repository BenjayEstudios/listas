<?php
header("Content-Type: application/json");
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM listas ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!empty($data['nombre'])) {
                $stmt = $pdo->prepare("INSERT INTO listas (nombre, creador) VALUES (?, ?)");
                $stmt->execute([$data['nombre'], $data['creador'] ?? 'Anonimo']);
                echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            }
            break;

        case 'PUT':
            // LEER: Datos para actualizar (id, nuevo nombre, nuevo estado)
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!empty($data['id']) && !empty($data['nombre'])) {
                $stmt = $pdo->prepare("UPDATE listas SET nombre = ?, estado = ? WHERE id = ?");
                $stmt->execute([
                    $data['nombre'], 
                    $data['estado'] ?? 0, 
                    $data['id']
                ]);
                
                echo json_encode(["success" => true, "message" => "Lista actualizada"]);
            } else {
                echo json_encode(["success" => false, "message" => "Datos insuficientes"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método $method no permitido"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}