-- Esquema base de la base `clinica` (MySQL / MariaDB).
--
-- Orden de carga:
--   1. script.sql                                   (este archivo)
--   2. migrations/001_soft_delete_sede_cobertura.sql
--   3. migrations/002_auditoria.sql
--   4. pnpm seed                                    (datos de prueba, opcional)
--
-- Las columnas `activo` de sede y cobertura y la tabla log_auditoria
-- no estan aca: las agregan las migraciones.

CREATE DATABASE IF NOT EXISTS clinica CHARACTER SET utf8 COLLATE utf8_general_ci;
USE clinica;

CREATE TABLE sede (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  direccion VARCHAR(100) NOT NULL,
  telefono VARCHAR(15) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE cobertura (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE especialidad (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE usuario (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  apellido VARCHAR(30) NOT NULL,
  nombre VARCHAR(30) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  email VARCHAR(30) NOT NULL,
  telefono VARCHAR(10) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  id_sede TINYINT(4) DEFAULT NULL,
  id_cobertura TINYINT(4) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY id_sede (id_sede),
  KEY id_cobertura (id_cobertura),
  CONSTRAINT usuario_ibfk_1 FOREIGN KEY (id_sede) REFERENCES sede (id),
  CONSTRAINT usuario_ibfk_2 FOREIGN KEY (id_cobertura) REFERENCES cobertura (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE medico_especialidad (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  id_medico TINYINT(4) NOT NULL,
  id_especialidad TINYINT(4) NOT NULL,
  PRIMARY KEY (id),
  KEY id_medico (id_medico),
  KEY id_especialidad (id_especialidad),
  CONSTRAINT medico_especialidad_ibfk_1 FOREIGN KEY (id_medico) REFERENCES usuario (id),
  CONSTRAINT medico_especialidad_ibfk_2 FOREIGN KEY (id_especialidad) REFERENCES especialidad (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE agenda (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  hora_entrada VARCHAR(5) NOT NULL,
  hora_salida VARCHAR(5) NOT NULL,
  fecha DATE NOT NULL,
  id_medico TINYINT(4) NOT NULL,
  id_especialidad TINYINT(4) NOT NULL,
  id_sede TINYINT(4) NOT NULL,
  PRIMARY KEY (id),
  KEY id_especialidad (id_especialidad),
  KEY id_medico (id_medico),
  KEY id_sede (id_sede),
  CONSTRAINT agenda_ibfk_1 FOREIGN KEY (id_especialidad) REFERENCES especialidad (id),
  CONSTRAINT agenda_ibfk_2 FOREIGN KEY (id_medico) REFERENCES usuario (id),
  CONSTRAINT agenda_ibfk_3 FOREIGN KEY (id_sede) REFERENCES sede (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE turno (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  nota VARCHAR(40) DEFAULT NULL,
  id_agenda TINYINT(11) NOT NULL,
  fecha DATE DEFAULT NULL,
  hora VARCHAR(5) DEFAULT NULL,
  id_paciente TINYINT(11) NOT NULL,
  id_cobertura TINYINT(4) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  PRIMARY KEY (id),
  KEY id_agenda (id_agenda),
  KEY id_paciente (id_paciente),
  KEY id_cobertura (id_cobertura),
  CONSTRAINT turno_ibfk_1 FOREIGN KEY (id_agenda) REFERENCES agenda (id),
  CONSTRAINT turno_ibfk_2 FOREIGN KEY (id_paciente) REFERENCES usuario (id),
  CONSTRAINT turno_ibfk_3 FOREIGN KEY (id_cobertura) REFERENCES cobertura (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE historial_clinico (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  id_turno TINYINT(4) NOT NULL,
  id_medico TINYINT(4) NOT NULL,
  id_paciente TINYINT(4) NOT NULL,
  diagnostico VARCHAR(255) NOT NULL,
  tratamiento VARCHAR(255) DEFAULT NULL,
  observaciones VARCHAR(255) DEFAULT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY id_turno (id_turno),
  KEY id_medico (id_medico),
  KEY id_paciente (id_paciente),
  CONSTRAINT historial_ibfk_1 FOREIGN KEY (id_turno) REFERENCES turno (id),
  CONSTRAINT historial_ibfk_2 FOREIGN KEY (id_medico) REFERENCES usuario (id),
  CONSTRAINT historial_ibfk_3 FOREIGN KEY (id_paciente) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE notificacion (
  id TINYINT(4) NOT NULL AUTO_INCREMENT,
  id_usuario TINYINT(4) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  mensaje VARCHAR(255) NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY id_usuario (id_usuario),
  CONSTRAINT notificacion_ibfk_1 FOREIGN KEY (id_usuario) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Catalogos minimos. El seed necesita las sedes 1 y 6 y al menos 2 coberturas.
INSERT INTO sede (id, nombre, direccion, telefono) VALUES
  (1, 'Sede Centro', 'San Martín 123', '3424000001'),
  (2, 'Sede Norte', 'Av. Rivadavia 456', '3424000002'),
  (6, 'Sede Sur', 'Av. Freyre 789', '3424000006');

INSERT INTO cobertura (nombre) VALUES
  ('Jerarquicos'),
  ('OSDE');
