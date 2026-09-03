CREATE TABLE log_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  accion VARCHAR(20) NOT NULL,
  entidad VARCHAR(30) NOT NULL,
  detalle TEXT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_log_auditoria_usuario (id_usuario),
  INDEX idx_log_auditoria_entidad (entidad),
  INDEX idx_log_auditoria_fecha (fecha),

  CONSTRAINT chk_log_auditoria_accion
    CHECK (accion IN ('ALTA', 'BAJA', 'MODIFICACION'))
);
