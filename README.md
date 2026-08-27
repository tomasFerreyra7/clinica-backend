# Semana 3

# Clinica - Backend

API de gestión de clínica: autenticación JWT, coberturas, sedes, especialidades y agenda médica.

## Requisitos

- Node.js 18+
- pnpm
- MySQL/MariaDB corriendo

## Setup

```bash
pnpm install
```

Crear la base y cargar el script:

```sql
CREATE DATABASE clinica;
```

```bash
mysql -u root -p clinica < script.sql
mysql -u root -p clinica < migrations/001_soft_delete_sede_cobertura.sql
```

Copiar `.env.example` a `.env` y completar credenciales.

## Correr

```bash
pnpm run dev
```

Servidor en `http://localhost:3000`.

## Formato de respuesta uniforme

```json
{ "codigo": 200, "estado": "ok", "datos": {} }
```

Mismo formato en éxito y error (`datos` suele ser `null` en error).

## Endpoints

### Base

- `GET /health` — chequea conexión a la base.

### Auth

- `POST /auth/registro` — alta de paciente. Body: `nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono?`.
- `POST /auth/login` — Body: `dni, password`. Devuelve JWT con `id, rol, id_sede`.
- `GET /auth/perfil` — protegido (`verificarToken`).
- `GET /auth/solo-admin` — prueba de rol: solo `admin`.

### Coberturas

- `GET /coberturas` — público, lista coberturas disponibles (usado en el registro).
- `GET /coberturas/:id`, `POST /coberturas`, `PUT /coberturas/:id`, `DELETE /coberturas/:id` — CRUD, solo rol `admin`. El delete es baja lógica (columna `activo`) y devuelve 409 si la cobertura tiene usuarios asociados.

### Sedes (solo `admin`)

- `GET /sedes`, `GET /sedes/:id`, `POST /sedes`, `PUT /sedes/:id`, `DELETE /sedes/:id` — CRUD. El delete es baja lógica (columna `activo`) y devuelve 409 si la sede tiene médicos, operadores o agenda asociada.

### Especialidades (solo `admin`)

- `POST /especialidades` — alta. Body: `{ "descripcion": "..." }` (máx. 30 caracteres).
- `GET /especialidades` — listado.
- `PUT /especialidades/:id` — modificación. Body: `{ "descripcion": "..." }`.
- `DELETE /especialidades/:id` — baja. Si tiene médicos en `medico_especialidad` → `409`.

### Agenda (roles `operador` | `medico`)

Body de alta/modificación:

```json
{
  "hora_entrada": "09:00",
  "hora_salida": "12:00",
  "fecha": "2026-09-15",
  "id_medico": 1,
  "id_especialidad": 1,
  "id_sede": 1
}
```

- `POST /agendas` — alta de bloque horario.
- `GET /agendas` — listado. Query opcionales: `id_medico`, `id_sede`, `fecha`.
- `PUT /agendas/:id` — modificación (mismas validaciones que el alta).
- `DELETE /agendas/:id` — baja.

Reglas de negocio:

- `hora_entrada` anterior a `hora_salida` (formato `HH:MM`).
- `fecha` en `YYYY-MM-DD`.
- Deben existir médico (`rol = medico`), especialidad y sede.
- El médico debe tener esa especialidad en `medico_especialidad`.
- No se permiten horarios solapados del mismo médico en la misma fecha.
- **Médico:** solo gestiona su propia agenda (`id_medico` = usuario del token). Si intenta la de otro → `403`.
- **Operador:** puede gestionar la agenda de cualquier médico.
- **Paciente:** `403` en todos los endpoints de agenda.

### Historial clinico

Todos los endpoints requieren el header `Authorization: Bearer <token>`.

- `POST /historial` — registra el historial de un turno. Solo médicos.
- `GET /historial` — paciente ve el historial de sus turnos; médico ve el de los turnos que atendió.

Body de `POST /historial`:

```json
{
  "id_turno": 1,
  "diagnostico": "Gripe estacional",
  "tratamiento": "Reposo y abundante hidratacion",
  "observaciones": "Control en 7 dias"
}
```

El turno debe existir, estar en estado `atendido` y pertenecer al médico autenticado. No se puede registrar más de un historial para el mismo turno.

Respuestas posibles: `201` creado, `400` datos inválidos, `403` permisos insuficientes, `404` turno inexistente y `409` turno no atendido o historial duplicado.

### Notificaciones

Todos los endpoints requieren el header `Authorization: Bearer <token>`.

- `GET /notificaciones` — lista las notificaciones del usuario autenticado, de más reciente a más antigua.
- `PATCH /notificaciones/:id/leida` — marca como leída una notificación propia.

No existe un endpoint público para crear notificaciones. La función interna `crearNotificacion(idUsuario, tipo, mensaje)` se encuentra en `src/services/notificacion.service.js` y guarda automáticamente la fecha y `leida = 0`.

Tipos de notificación sugeridos: `turno_creado`, `turno_cancelado`, `turno_atendido` y `turno_rechazado`.

### Flujo de prueba

1. Iniciar sesión como paciente y como médico mediante `POST /auth/login`.
2. Usar el token correspondiente en las rutas protegidas.
3. Cancelar o actualizar un turno y consultar `GET /notificaciones`.
4. Marcar una notificación con `PATCH /notificaciones/:id/leida`.
5. Marcar un turno como `atendido` y registrar su historial con `POST /historial`.
6. Consultar `GET /historial` como paciente y como médico.
7. Verificar que un médico no pueda registrar historiales de otro médico y que un paciente no pueda crearlos.

## Postman

Las colecciones de Postman no se versionan en git (contienen credenciales de prueba). Mantené tu copia local en `postman_collection.json` / `postman/` (ya en `.gitignore`) y compartila con el equipo por fuera del repo.
