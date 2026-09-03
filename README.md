# Semana 4

# Clinica - Backend

API de gestión de clínica: autenticación JWT, coberturas, sedes, especialidades, agenda médica, turnos, historial clínico, notificaciones y reportes estadísticos.

Roles en la base: `admin`, `operador`, `medico`, `paciente`.

Header en rutas protegidas: `Authorization: Bearer <token>`.

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

## Estructura del proyecto

```
src/
├── index.js           # Express app y registro de rutas
├── routes/            # Rutas HTTP + middlewares de auth por endpoint
├── controllers/       # try/catch, enviarOk / enviarError
├── services/          # Lógica de negocio y consultas SQL
├── middlewares/         # verificarToken, verificarRol
├── utils/             # respuesta.js, validacion.js
└── database/db.js     # Pool MySQL
```

## Formato de respuesta uniforme

Todas las respuestas usan `enviarOk` y `enviarError` (`src/utils/respuesta.js`).

**Éxito:**

```json
{
  "codigo": 200,
  "estado": "ok",
  "mensaje": null,
  "datos": {}
}
```

`mensaje` puede traer texto en algunos endpoints (historial, notificaciones). `codigo` en el JSON coincide con el HTTP (200, 201, etc.).

**Error:**

```json
{
  "codigo": 400,
  "estado": "error",
  "mensaje": "descripcion del error",
  "datos": null
}
```

**Códigos HTTP habituales:**

| Código | Uso |
|--------|-----|
| `200` | OK |
| `201` | Recurso creado |
| `400` | Validación de input |
| `401` | Sin token o token inválido |
| `403` | Rol o permiso insuficiente |
| `404` | Recurso no encontrado |
| `409` | Conflicto de negocio |
| `500` | Error interno (sin detalle de MySQL) |

Rutas inexistentes → `404` con `{ "mensaje": "Recurso no encontrado" }`.

## Resumen de endpoints

| Prefijo | Auth | Rol(es) | Descripción |
|---------|------|---------|-------------|
| `GET /health` | No | — | Estado del servidor y DB |
| `/auth` | Parcial | — | Registro, login, perfil |
| `/coberturas` | Parcial | `admin` (CRUD) | Coberturas médicas |
| `/sedes` | Sí | `admin` | Sedes |
| `/especialidades` | Sí | `admin` | Especialidades |
| `/agendas` | Sí | `operador`, `medico` | Agenda médica |
| `/turnos` | Sí | varios | Turnos |
| `/historial` | Sí | `medico` (POST), paciente/médico (GET) | Historial clínico |
| `/notificaciones` | Sí | cualquier autenticado | Notificaciones del usuario |
| `/reportes` | Sí | `admin` | Estadísticas de turnos |
| `/auditoria` | Sí | `admin` | Logs de auditoría con filtros |

---

## Endpoints

### Base

- `GET /health` — chequea conexión a la base. Respuesta: `{ "db": "conectada" }` en `datos`.

### Auth

- `POST /auth/registro` — alta de paciente (público).
  - Body: `nombre`, `apellido`, `dni`, `email`, `password`, `fecha_nacimiento`, `id_cobertura`, `telefono?`.
- `POST /auth/login` — Body: `dni`, `password`.
  - Respuesta en `datos`: `{ "token", "usuario": { "id", "rol", "id_sede" } }`.
- `GET /auth/perfil` — protegido (`verificarToken`). Devuelve datos del usuario autenticado.

### Coberturas

- `GET /coberturas` — **público**, lista coberturas activas (usado en el registro).
- `GET /coberturas/:id` — solo `admin`.
- `POST /coberturas` — solo `admin`. Body: `{ "nombre": "..." }` (máx. 30 caracteres).
- `PUT /coberturas/:id` — solo `admin`. Body: `{ "nombre": "..." }`.
- `DELETE /coberturas/:id` — solo `admin`. Baja lógica (`activo = 0`). `409` si tiene usuarios asociados.

### Sedes (solo `admin`)

Body de alta/modificación: `{ "nombre", "direccion", "telefono" }` (nombre máx. 50, dirección 100, teléfono 15).

- `GET /sedes` — listado de sedes activas.
- `GET /sedes/:id` — detalle.
- `POST /sedes` — alta.
- `PUT /sedes/:id` — modificación.
- `DELETE /sedes/:id` — baja lógica. `409` si tiene médicos, operadores o agenda asociada.

### Especialidades (solo `admin`)

- `POST /especialidades` — alta. Body: `{ "descripcion": "..." }` (máx. 30 caracteres).
- `GET /especialidades` — listado.
- `PUT /especialidades/:id` — modificación. Body: `{ "descripcion": "..." }`.
- `DELETE /especialidades/:id` — baja. `409` si tiene filas en `medico_especialidad`.

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
- Deben existir médico (`rol = medico`), especialidad y sede activa.
- El médico debe tener esa especialidad en `medico_especialidad`.
- No se permiten horarios solapados del mismo médico en la misma fecha.
- **Médico:** solo gestiona su propia agenda (`id_medico` = usuario del token). Si intenta la de otro → `403`.
- **Operador:** puede gestionar la agenda de cualquier médico.
- **Paciente:** `403` en todos los endpoints de agenda.

### Turnos

Estados posibles: `confirmado`, `cancelado`, `atendido`.

Duración fija de cada turno: **30 minutos** (solo hora de inicio en el body; el fin se calcula en el servidor).

Body de alta (`POST /turnos`), roles `paciente` | `operador`:

```json
{
  "id_especialidad": 1,
  "id_sede": 1,
  "id_medico": 2,
  "fecha": "2026-09-15",
  "hora": "09:30",
  "nota": "Primera consulta",
  "id_paciente": 5
}
```

- `id_paciente` solo lo envía el **operador** (obligatorio para él). El paciente no lo envía: se toma del token.
- `id_cobertura` **no** se acepta en el body: se toma del paciente.

Endpoints:

- `POST /turnos` — solicitar turno. Roles: `paciente`, `operador`. Estado inicial `confirmado`; notifica `turno_creado`.
- `PATCH /turnos/:id/cancelar` — cancelar. Roles: `paciente`, `operador`, `medico`. Pasa a `cancelado`; notifica `turno_cancelado`.
- `PATCH /turnos/:id/atender` — marcar atendido. Solo `medico`. Pasa a `atendido`; notifica `turno_atendido`.
- `GET /turnos/mios` — turnos del paciente autenticado (`paciente`). Orden: `fecha ASC`, `hora ASC`.
- `GET /turnos` — listado por fecha. Roles: `operador`, `medico`. Query obligatoria: `fecha`.
  - Por médico: `id_medico` + `fecha`.
  - Por sede (solo operador): `id_sede` + `fecha`.

Reglas de negocio (alta):

- `nota` obligatoria (máx. 40 caracteres).
- `fecha` y `hora` no pueden ser pasadas.
- Deben existir médico, especialidad, sede activa y vínculo en `medico_especialidad`.
- Debe existir bloque de agenda para médico/especialidad/sede/fecha.
- El turno debe caber dentro del bloque (`hora_entrada < hora_inicio` y `hora_fin < hora_salida`).
- Sin solapamiento con otro turno `confirmado` del mismo médico y fecha (intervalo 30 min).
- **Operador:** solo en su sede (`id_sede` del body = token).
- **Médico:** no puede crear turnos (`403`).

Reglas de negocio (cancelación):

- Solo desde `confirmado`.
- **Paciente:** solo sus turnos.
- **Operador / médico:** solo turnos de su sede.

Reglas de negocio (atención):

- Solo desde `confirmado`.
- Solo el médico dueño del turno.
- No crea historial; eso es `POST /historial`.

Reglas de negocio (listados):

- **Médico:** solo sus turnos; `id_medico` ajeno → `403`.
- **Operador:** `id_medico` o `id_sede`, no ambos; sede solo la del token.

### Historial clínico

- `POST /historial` — solo `medico`.
- `GET /historial` — paciente ve el suyo; médico ve el de turnos que atendió.

Body de `POST /historial`:

```json
{
  "id_turno": 1,
  "diagnostico": "Gripe estacional",
  "tratamiento": "Reposo y abundante hidratacion",
  "observaciones": "Control en 7 dias"
}
```

El turno debe existir, estar `atendido` y pertenecer al médico autenticado. Un solo historial por turno.

Respuestas: `201`, `400`, `403`, `404`, `409` (no atendido o duplicado).

### Notificaciones

- `GET /notificaciones` — del usuario autenticado, más reciente primero.
- `PATCH /notificaciones/:id/leida` — marca como leída una notificación propia.

No hay endpoint público para crear notificaciones. Uso interno: `crearNotificacion(idUsuario, tipo, mensaje)` en `notificacion.service.js`.

Tipos de turnos: `turno_creado`, `turno_cancelado`, `turno_atendido`.

### Reportes y estadísticas (solo `admin`)

Consultas agregadas sobre `turno`, `agenda`, `especialidad` y `sede`. Sin tablas nuevas.

Query obligatoria en todos: `desde` y `hasta` (`YYYY-MM-DD`, inclusive). Filtro sobre `turno.fecha`.

Ejemplo: `?desde=2026-01-01&hasta=2026-03-31`.

| Endpoint | Descripción |
|----------|-------------|
| `GET /reportes/turnos-por-especialidad` | Cantidad de turnos por especialidad (todos los estados). Incluye especialidades con `cantidad: 0`. |
| `GET /reportes/turnos-por-sede` | Cantidad por sede (todos los estados). Incluye sedes con `cantidad: 0`. |
| `GET /reportes/ranking-medicos` | Ranking completo por turnos **atendidos**. Empates en posición (1, 2, 2, 4). |
| `GET /reportes/tasa-cancelacion` | `total`, `cancelados`, `tasa_cancelacion` (% con 2 decimales). Sin turnos → tasa `0`. |

Ejemplo de respuesta (`turnos-por-especialidad`):

```json
{
  "codigo": 200,
  "estado": "ok",
  "mensaje": null,
  "datos": {
    "desde": "2026-01-01",
    "hasta": "2026-03-31",
    "items": [
      { "id_especialidad": 1, "descripcion": "Cardiologia", "cantidad": 42 }
    ]
  }
}
```

Ejemplo (`tasa-cancelacion`):

```json
{
  "codigo": 200,
  "estado": "ok",
  "mensaje": null,
  "datos": {
    "desde": "2026-01-01",
    "hasta": "2026-03-31",
    "total": 100,
    "cancelados": 15,
    "tasa_cancelacion": 15.00
  }
}
```

Los reportes reflejan el estado actual de los turnos: cancelar o atender un turno actualiza los indicadores sin pasos extra.

Respuestas: `200`, `400` (fechas), `401`, `403`, `500`.

### Auditoría (solo `admin`)

Registro automático de acciones relevantes en la tabla `log_auditoria`. Un único endpoint de consulta con filtros opcionales.

- `GET /auditoria` — listado de logs, orden más reciente primero.

Query opcionales (todos combinables):

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_usuario` | entero positivo | Filtrar por usuario que realizó la acción |
| `entidad` | string | Una de: `usuario`, `cobertura`, `especialidad`, `sede` |
| `desde` | `YYYY-MM-DD` | Inicio del rango de fechas (requiere `hasta`) |
| `hasta` | `YYYY-MM-DD` | Fin del rango de fechas (requiere `desde`) |

Cada log contiene: `id`, `id_usuario`, `accion`, `entidad`, `detalle`, `fecha`.

Respuestas: `200`, `400` (filtros inválidos), `401`, `403`.

---

## Flujo de prueba (E2E)

1. Login como operador/médico y cargar agenda (`POST /agendas`) si hace falta.
2. Login como paciente u operador y solicitar turno (`POST /turnos`).
3. `GET /turnos/mios` (paciente) o `GET /turnos` con `fecha` (operador/médico).
4. Alta rechazada por horario → `409`.
5. Cancelar turno → notificación `turno_cancelado`.
6. Otro turno, atender → notificación `turno_atendido`.
7. `POST /historial` y `GET /historial` (paciente y médico).
8. `PATCH /notificaciones/:id/leida`.
9. Login `admin` → reportes con rango de fechas; cancelar turno y verificar `tasa-cancelacion`.

## Postman / Swagger

Las colecciones locales no se versionan en git (credenciales de prueba). Mantener `postman_collection.json` en local (`.gitignore`).

Documentación detallada de requests/responses en Postman o Swagger.

Casos mínimos sugeridos para la entrega:

- Turno rechazado por horario (fuera de agenda o superpuesto).
- Turno cancelado con notificación.
- Turno atendido con historial clínico.
- Reportes admin coherentes tras crear/cancelar/atender turnos.
