CREATE DATABASE complementos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_spanish_ci;

USE complementos;

CREATE TABLE listas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado TINYINT(1) DEFAULT 0 COMMENT '0: Inactivo, 1: Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creador VARCHAR(100) NOT NULL,
    INDEX idx_creador (creador)
) ENGINE=InnoDB;


CREATE TABLE items_lista (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lista_id INT NOT NULL,
    contenido TEXT NOT NULL,
    completado TINYINT(1) DEFAULT 0 COMMENT '0: Pendiente, 1: Hecho',
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Definición de la Llave Foránea (FK)
    CONSTRAINT fk_lista 
        FOREIGN KEY (lista_id) 
        REFERENCES listas(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1. Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Crear tabla intermedia para compartir listas (Relación Muchos a Muchos)
CREATE TABLE listas_usuarios (
    lista_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol ENUM('propietario', 'invitado') DEFAULT 'propietario',
    PRIMARY KEY (lista_id, usuario_id),
    FOREIGN KEY (lista_id) REFERENCES listas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE USER 'complentosDB'@'localhost' IDENTIFIED BY 'complementosDB';
GRANT ALL PRIVILEGES ON complementos.* TO 'complentosDB'@'localhost';