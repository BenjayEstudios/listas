<?php
header("Content-Type: application/json");
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            // Obtener ítems de una lista: api/items.php?lista_id=1
            $lista_id = $_GET['lista_id'] ?? null;
            if (!$lista_id) throw new Exception("ID de lista requerido");

            $stmt = $pdo->prepare("SELECT * FROM items_lista WHERE lista_id = ? ORDER BY created_at DESC");
            $stmt->execute([$lista_id]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            // Añadir ítem a una lista
            $data = json_decode(file_get_contents('php://input'), true);
            if (!empty($data['contenido']) && !empty($data['lista_id'])) {
                $stmt = $pdo->prepare("INSERT INTO items_lista (lista_id, contenido) VALUES (?, ?)");
                $stmt->execute([$data['lista_id'], $data['contenido']]);
                echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
            }
            break;

        // Dentro del switch($method) en api/items.php
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['id'])) throw new Exception("ID faltante");

            // Si viene 'op' como update_text, editamos el contenido
            if (isset($data['op']) && $data['op'] === 'update_text') {
                $stmt = $pdo->prepare("UPDATE items_lista SET contenido = ? WHERE id = ?");
                $stmt->execute([$data['contenido'], $data['id']]);
            } else {
                // De lo contrario, es el toggle de completado habitual
                $stmt = $pdo->prepare("UPDATE items_lista SET completado = ? WHERE id = ?");
                $stmt->execute([$data['completado'], $data['id']]);
            }
            echo json_encode(["success" => true]);
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!empty($data['id'])) {
                $stmt = $pdo->prepare("DELETE FROM items_lista WHERE id = ?");
                $stmt->execute([$data['id']]);
                echo json_encode(["success" => true]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}