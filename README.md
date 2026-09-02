# Semana 4

# Clinica - Backend

API de gestión de clínica: autenticación JWT, coberturas, sedes, especialidades, agenda médica, turnos, historial clínico y notificaciones.

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
- Deben existir médico (`rol = medico`), especialidad y sede activa.
- El médico debe tener esa especialidad en `medico_especialidad`.
- No se permiten horarios solapados del mismo médico en la misma fecha.
- **Médico:** solo gestiona su propia agenda (`id_medico` = usuario del token). Si intenta la de otro → `403`.
- **Operador:** puede gestionar la agenda de cualquier médico.
- **Paciente:** `403` en todos los endpoints de agenda.

### Turnos

Estados posibles: `confirmado`, `cancelado`, `atendido`.

Duración fija de cada turno: **30 minutos** (se usa solo la hora de inicio en el body; el fin se calcula en el servidor).

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
- `id_cobertura` **no** se acepta en el body: se toma automáticamente del paciente.

Endpoints:

- `POST /turnos` — solicitar turno. Roles: `paciente`, `operador`. Crea con estado `confirmado` y notifica `turno_creado` al paciente.
- `PATCH /turnos/:id/cancelar` — cancelar turno. Roles: `paciente`, `operador`, `medico`. Pasa a `cancelado` y notifica `turno_cancelado`.
- `PATCH /turnos/:id/atender` — marcar atendido. Solo `medico`. Pasa a `atendido` y notifica `turno_atendido`.
- `GET /turnos/mios` — turnos del paciente autenticado, ordenados del más próximo al más lejano (`fecha ASC`, `hora ASC`).
- `GET /turnos` — listado por fecha. Roles: `operador`, `medico`. Query obligatoria: `fecha`. Además:
  - Por médico: `id_medico` + `fecha`.
  - Por sede (solo operador): `id_sede` + `fecha`.

Reglas de negocio (alta):

- `nota` obligatoria (máx. 40 caracteres).
- `fecha` y `hora` no pueden ser pasadas.
- Deben existir médico, especialidad, sede activa y vínculo en `medico_especialidad`.
- Debe existir un bloque de agenda para esa combinación médico/especialidad/sede/fecha.
- El turno debe caber dentro del bloque: `hora_entrada < hora_inicio` y `hora_fin < hora_salida` (extremos no inclusivos).
- No puede superponerse con otro turno `confirmado` del mismo médico en la misma fecha (intervalo de 30 min).
- **Operador:** solo puede operar en su sede (`id_sede` del body = `id_sede` del token).
- **Médico:** no puede crear turnos (`403`).

Reglas de negocio (cancelación):

- Solo desde estado `confirmado`.
- **Paciente:** solo sus propios turnos.
- **Operador / médico:** solo turnos de su sede (`agenda.id_sede` = `id_sede` del token).

Reglas de negocio (atención):

- Solo desde estado `confirmado`.
- Solo el médico dueño del turno (`agenda.id_medico` = usuario del token).
- No crea historial clínico; eso es un paso posterior con `POST /historial`.

Reglas de negocio (listados):

- **Médico:** en `GET /turnos` solo ve sus turnos; si envía `id_medico` ajeno → `403`.
- **Operador:** en listado por sede, solo su `id_sede`; debe indicar `id_medico` o `id_sede`, no ambos.

### Historial clínico

- `POST /historial` — registra el historial de un turno. Solo `medico`.
- `GET /historial` — paciente ve el suyo; médico ve el de los turnos que atendió.

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

- `GET /notificaciones` — lista las del usuario autenticado, de más reciente a más antigua.
- `PATCH /notificaciones/:id/leida` — marca como leída una notificación propia.

No hay endpoint público para crear notificaciones. La función interna `crearNotificacion(idUsuario, tipo, mensaje)` está en `src/services/notificacion.service.js` (fecha automática, `leida = 0`).

Tipos usados por turnos: `turno_creado`, `turno_cancelado`, `turno_atendido`.

### Reportes y estadísticas (solo `admin`)

Todos requieren query `desde` y `hasta` (`YYYY-MM-DD`, inclusive). El filtro usa `turno.fecha`.

- `GET /reportes/turnos-por-especialidad` — cantidad de turnos por especialidad (todos los estados: `confirmado`, `cancelado`, `atendido`). Incluye especialidades sin turnos con `cantidad: 0`.
- `GET /reportes/turnos-por-sede` — cantidad de turnos por sede (todos los estados). Incluye sedes sin turnos con `cantidad: 0`.
- `GET /reportes/ranking-medicos` — ranking completo de médicos por turnos **atendidos** en el período, ordenado por cantidad descendente. Posición con empates (ej. 1, 2, 2, 4).
- `GET /reportes/tasa-cancelacion` — `total`, `cancelados` y `tasa_cancelacion` (porcentaje 0–100, 2 decimales). Si no hay turnos en el período, `tasa_cancelacion: 0`.

Ejemplo de query: `?desde=2026-01-01&hasta=2026-03-31`.

Respuestas posibles: `200` ok, `400` fechas inválidas o rango inconsistente, `401` sin token, `403` rol distinto de `admin`, `500` error interno.

### Flujo de prueba (E2E)

1. Login como operador/médico y cargar agenda (`POST /agendas`) si hace falta.
2. Login como paciente u operador y solicitar turno (`POST /turnos`).
3. Consultar `GET /turnos/mios` (paciente) o `GET /turnos?id_medico=&fecha=` / `?id_sede=&fecha=` (operador/médico).
4. Probar alta rechazada por horario fuera de agenda o superpuesto → respuesta `409`.
5. Cancelar turno (`PATCH /turnos/:id/cancelar`) y verificar `GET /notificaciones` (`turno_cancelado`).
6. Crear otro turno, atenderlo (`PATCH /turnos/:id/atender`) y verificar notificación `turno_atendido`.
7. Registrar historial (`POST /historial`) y consultar `GET /historial` como paciente y como médico.
8. Marcar notificación leída (`PATCH /notificaciones/:id/leida`).
9. Login como `admin` y consultar reportes con rango de fechas; cancelar un turno y verificar que sube `cancelados` y la tasa en `/reportes/tasa-cancelacion`.

## Postman

Las colecciones de Postman no se versionan en git (contienen credenciales de prueba). Mantené tu copia local en `postman_collection.json` / `postman/` (ya en `.gitignore`) y compartila con el equipo por fuera del repo.

Casos mínimos sugeridos para la entrega:

- Turno rechazado por horario (fuera de agenda o superpuesto).
- Turno cancelado con notificación generada.
- Turno atendido con historial clínico asociado.
