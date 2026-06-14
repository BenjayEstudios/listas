<?php
header("Content-Type: application/json");
if (in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1'])) {
    // Entorno de desarrollo local
    require_once '../config/db.php';
} else {
    // Entorno de producción (benjayapps.cl)
    require_once '../../../db.php';
}



$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            $usuario = $_GET['user'] ?? null;
            
            if ($usuario) {
                $sql = "SELECT l.id, l.nombre, u_creador.username AS creador,
                               COUNT(i.id) AS total_items,
                               SUM(CASE WHEN i.completado = 1 THEN 1 ELSE 0 END) AS completados
                        FROM listas l
                        -- 1. Filtramos las listas a las que el usuario actual tiene acceso
                        INNER JOIN listas_usuarios lu_acceso ON l.id = lu_acceso.lista_id
                        INNER JOIN usuarios u_acceso ON lu_acceso.usuario_id = u_acceso.id
                        -- 2. Traemos el nombre del creador real buscando el rol 'propietario'
                        INNER JOIN listas_usuarios lu_prop ON l.id = lu_prop.lista_id AND lu_prop.rol = 'propietario'
                        INNER JOIN usuarios u_creador ON lu_prop.usuario_id = u_creador.id
                        LEFT JOIN items_lista i ON l.id = i.lista_id
                        WHERE u_acceso.username = ?
                        GROUP BY l.id
                        ORDER BY l.created_at DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$usuario]);
            } else {
                $sql = "SELECT l.id, l.nombre, u_creador.username AS creador,
                               COUNT(i.id) AS total_items,
                               SUM(CASE WHEN i.completado = 1 THEN 1 ELSE 0 END) AS completados
                        FROM listas l
                        -- Traemos el dueño de la lista sin filtrar por usuario logueado
                        INNER JOIN listas_usuarios lu_prop ON l.id = lu_prop.lista_id AND lu_prop.rol = 'propietario'
                        INNER JOIN usuarios u_creador ON lu_prop.usuario_id = u_creador.id
                        LEFT JOIN items_lista i ON l.id = i.lista_id
                        GROUP BY l.id
                        ORDER BY l.created_at DESC";
                $stmt = $pdo->query($sql);
            }
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!empty($data['nombre']) && !empty($data['creador'])) {
                try {
                    $pdo->beginTransaction();

                    // 1. Insertar la lista (ya no existe la columna creador aquí)
                    $stmt = $pdo->prepare("INSERT INTO listas (nombre) VALUES (?)");
                    $stmt->execute([$data['nombre']]);
                    $nuevoIdLista = $pdo->lastInsertId();

                    // 2. Obtener el ID del usuario a partir del username
                    $stmtUser = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
                    $stmtUser->execute([$data['creador']]);
                    $usuario = $stmtUser->fetch();
                    
                    if (!$usuario) {
                        throw new Exception("Usuario no encontrado en la base de datos");
                    }

                    // 3. Crear la relación en la tabla intermedia
                    $stmtRel = $pdo->prepare("INSERT INTO listas_usuarios (lista_id, usuario_id, rol) VALUES (?, ?, 'propietario')");
                    $stmtRel->execute([$nuevoIdLista, $usuario['id']]);

                    $pdo->commit();
                    echo json_encode(["success" => true, "id" => $nuevoIdLista]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Falta el nombre de la lista o el usuario"]);
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
        
        case 'SHARE':
            $data = json_decode(file_get_contents('php://input'), true);
            $lista_id = $data['id'] ?? null;
            $username_compartir = trim($data['usuario_compartir'] ?? '');

            if (!$lista_id || empty($username_compartir)) {
                throw new Exception("Datos insuficientes para procesar la solicitud");
            }

            // 1. Obtener la ID del usuario objetivo
            $stmtUser = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
            $stmtUser->execute([$username_compartir]);
            $usuarioDestino = $stmtUser->fetch();

            if (!$usuarioDestino) {
                echo json_encode(["success" => false, "message" => "El usuario ingresado no existe"]);
                break;
            }

            // 2. Control defensivo: Validar que no esté compartida previamente con él
            $stmtCheck = $pdo->prepare("SELECT 1 FROM listas_usuarios WHERE lista_id = ? AND usuario_id = ?");
            $stmtCheck->execute([$lista_id, $usuarioDestino['id']]);
            if ($stmtCheck->fetch()) {
                echo json_encode(["success" => false, "message" => "Esta lista ya se encuentra compartida con ese usuario"]);
                break;
            }

            // 3. Vincular el registro con el rol 'invitado'
            $stmtIns = $pdo->prepare("INSERT INTO listas_usuarios (lista_id, usuario_id, rol) VALUES (?, ?, 'invitado')");
            $stmtIns->execute([$lista_id, $usuarioDestino['id']]);

            echo json_encode(["success" => true, "message" => "Acceso concedido"]);
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