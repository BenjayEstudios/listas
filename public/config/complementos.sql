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

CREATE USER 'complentosDB'@'localhost' IDENTIFIED BY 'complementosDB';
GRANT ALL PRIVILEGES ON complementos.* TO 'complentosDB'@'localhost';