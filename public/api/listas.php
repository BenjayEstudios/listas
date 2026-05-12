<?php
header("Content-Type: application/json");
require_once '../../../db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            // Capturamos el usuario enviado desde el fetch en app.js
            $usuario = $_GET['user'] ?? null;
            
            if ($usuario) {
                // Filtramos por creador para que Benjamin no vea las listas de otro
                $stmt = $pdo->prepare("SELECT * FROM listas WHERE creador = ? ORDER BY created_at DESC");
                $stmt->execute([$usuario]);
            } else {
                $stmt = $pdo->query("SELECT * FROM listas ORDER BY created_at DESC");
            }
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
            $data = json_decode(file_get_contents('php://input'), true);
            if (!empty($data['id']) && !empty($data['nombre'])) {
                $stmt = $pdo->prepare("UPDATE listas SET nombre = ?, estado = ? WHERE id = ?");
                $stmt->execute([$data['nombre'], $data['estado'] ?? 0, $data['id']]);
                echo json_encode(["success" => true, "message" => "Lista actualizada"]);
            } else {
                echo json_encode(["success" => false, "message" => "Datos insuficientes"]);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['id'])) throw new Exception("ID de lista requerido");
            try {
                $pdo->beginTransaction();
                $stmtItems = $pdo->prepare("DELETE FROM items_lista WHERE lista_id = ?");
                $stmtItems->execute([$data['id']]);
                $stmtLista = $pdo->prepare("DELETE FROM listas WHERE id = ?");
                $stmtLista->execute([$data['id']]);
                $pdo->commit();
                echo json_encode(["success" => true, "message" => "Eliminado correctamente"]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;
        
        case 'COPY':
            $data = json_decode(file_get_contents('php://input'), true);
            $id_origen = $data['id'] ?? null;
            if (!$id_origen) throw new Exception("ID de origen requerido");
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("SELECT nombre, creador FROM listas WHERE id = ?");
                $stmt->execute([$id_origen]);
                $listaOriginal = $stmt->fetch();
                if (!$listaOriginal) throw new Exception("Lista no encontrada");

                $nuevoNombre = $listaOriginal['nombre'] . " copia";
                $stmtInsert = $pdo->prepare("INSERT INTO listas (nombre, creador) VALUES (?, ?)");
                $stmtInsert->execute([$nuevoNombre, $listaOriginal['creador']]);
                $nuevoId = $pdo->lastInsertId();

                $stmtItems = $pdo->prepare("SELECT contenido, completado FROM items_lista WHERE lista_id = ?");
                $stmtItems->execute([$id_origen]);
                $items = $stmtItems->fetchAll();

                $stmtInsertItem = $pdo->prepare("INSERT INTO items_lista (lista_id, contenido, completado) VALUES (?, ?, ?)");
                foreach ($items as $item) {
                    $stmtInsertItem->execute([$nuevoId, $item['contenido'], $item['completado']]);
                }
                $pdo->commit();
                echo json_encode(["success" => true, "nuevo_id" => $nuevoId]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}