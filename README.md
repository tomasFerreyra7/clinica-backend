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
| `/sedes` | Sí | lectura: cualquier autenticado; escritura: `admin` | Sedes |
| `/especialidades` | Sí | lectura: cualquier autenticado; escritura: `admin` | Especialidades |
| `/medicos` | Sí | cualquier autenticado | Listado de médicos con especialidades |
| `/pacientes` | Sí | `operador`, `medico`, `admin` | Búsqueda de pacientes por DNI o apellido |
| `/disponibilidad` | Sí | `paciente`, `operador` | Fechas y horarios libres de un médico |
| `/agendas` | Sí | `operador`, `medico` | Agenda médica |
| `/turnos` | Sí | varios | Turnos |
| `/historial` | Sí | `medico` (POST), paciente/médico (GET) | Historial clínico |
| `/notificaciones` | Sí | cualquier autenticado | Notificaciones del usuario |
| `/reportes` | Sí | `admin` | Estadísticas de turnos |
| `/auditoria` | Sí | `admin` | Logs de auditoría con filtros |
| `/usuarios` | Sí | `admin` | Gestión de usuarios (listado paginado, alta y edición) |

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
- `PATCH /auth/perfil` — solo `paciente`. Actualiza sus datos personales.
  - Body: `email?`, `password?`, `telefono?`, `id_cobertura?`. Tiene que venir al menos uno.
  - Otra clave (`nombre`, `dni`, `rol`, etc.) da `400`. Un email usado por otro usuario da `409`.
  - La contraseña se guarda hasheada. Devuelve el perfil actualizado y queda registrado en la auditoría.

### Coberturas

- `GET /coberturas` — **público**, lista coberturas activas (usado en el registro).
- `GET /coberturas/:id` — solo `admin`.
- `POST /coberturas` — solo `admin`. Body: `{ "nombre": "..." }` (máx. 30 caracteres).
- `PUT /coberturas/:id` — solo `admin`. Body: `{ "nombre": "..." }`.
- `DELETE /coberturas/:id` — solo `admin`. Baja lógica (`activo = 0`). `409` si tiene usuarios asociados.

### Sedes (lectura: cualquier usuario autenticado; alta, modificación y baja: solo `admin`)

Body de alta/modificación: `{ "nombre", "direccion", "telefono" }` (nombre máx. 50, dirección 100, teléfono 15).

- `GET /sedes` — listado de sedes activas.
- `GET /sedes/:id` — detalle.
- `POST /sedes` — alta.
- `PUT /sedes/:id` — modificación.
- `DELETE /sedes/:id` — baja lógica. `409` si tiene médicos, operadores o agenda asociada.

### Especialidades (lectura: cualquier usuario autenticado; alta, modificación y baja: solo `admin`)

- `POST /especialidades` — alta. Body: `{ "descripcion": "..." }` (máx. 30 caracteres).
- `GET /especialidades` — listado.
- `PUT /especialidades/:id` — modificación. Body: `{ "descripcion": "..." }`.
- `DELETE /especialidades/:id` — baja. `409` si tiene filas en `medico_especialidad` o si se usa en la agenda.

### Médicos (cualquier usuario autenticado)

- `GET /medicos` — lista médicos con sus especialidades. Devuelve solo `id`, `nombre`, `apellido` y `especialidades: [{ id, descripcion }]`, sin otros datos personales.
  - Query opcionales: `id_especialidad`, `id_sede`. Con `id_sede` se devuelven los médicos cuya sede es esa **o** que tienen agenda cargada en ella (un médico puede atender en varias sedes). Si se combina con `id_especialidad`, la agenda considerada es la de esa especialidad.
  - Ids inválidos → `400`. Orden por apellido y nombre.

### Pacientes (roles `operador`, `medico`, `admin`)

- `GET /pacientes?dni=&apellido=` — búsqueda de pacientes. Requiere al menos un filtro.
  - `dni`: solo números, hasta 8 dígitos; busca por prefijo.
  - `apellido`: entre 2 y 30 caracteres; busca por prefijo, sin distinguir mayúsculas. Los comodines `%` y `_` se toman como texto literal.
  - Se pueden combinar (AND). Máximo 50 resultados, ordenados por apellido y nombre. Solo devuelve usuarios con rol paciente.
  - Respuesta: `id`, `nombre`, `apellido`, `dni`, `fecha_nacimiento` (`YYYY-MM-DD`), `id_cobertura`, `cobertura_nombre`. No expone contraseña, email ni teléfono.
  - Sin filtros o filtros inválidos (o repetidos) → `400`.

### Disponibilidad (roles `paciente` | `operador`)

Duración de cada turno: **30 minutos** (constante `DURACION_TURNO_MIN` en `src/config/turnos.js`, usada por el alta de turno, la validación de rangos y estos endpoints).

- `GET /disponibilidad/fechas?id_medico=&id_especialidad=&id_sede=` — fechas (`YYYY-MM-DD`, ascendentes, desde hoy) en las que el médico tiene agenda para esa especialidad y sede y queda al menos un horario libre.
- `GET /disponibilidad/horarios?id_medico=&id_especialidad=&id_sede=&fecha=` — horarios de inicio libres (`HH:MM`, ascendentes).
  - Se generan cada 30 minutos desde la `hora_entrada` de cada rango, mientras el turno entre completo antes de la `hora_salida` (agenda 09:00–13:00 → 09:00 a 12:30).
  - Se descartan los que se superponen con turnos `confirmado` del médico en esa fecha (en cualquiera de sus sedes). Los turnos cancelados liberan el horario.
  - Si la fecha es hoy, se descartan los horarios que ya pasaron; una fecha pasada devuelve lista vacía.
  - Todo horario ofrecido es aceptado por `POST /turnos`.
- No devuelve datos de pacientes. Parámetros faltantes, inválidos o repetidos → `400`. Ids inexistentes → lista vacía.

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
- `GET /agendas` — listado. Query opcionales: `id_medico`, `id_sede`, `id_especialidad`, `fecha`. Además de los ids, cada fila trae `medico_nombre`, `medico_apellido`, `especialidad_descripcion` y `sede_nombre`.
- `PUT /agendas/:id` — modificación (mismas validaciones que el alta).
- `DELETE /agendas/:id` — baja.

Reglas de negocio:

- `hora_entrada` anterior a `hora_salida` (formato `HH:MM`).
- `fecha` en `YYYY-MM-DD`.
- Deben existir médico (`rol = medico`), especialidad y sede activa.
- El médico debe tener esa especialidad en `medico_especialidad`.
- No se permiten horarios solapados del mismo médico en la misma fecha.
- **Médico:** solo gestiona su propia agenda (`id_medico` = usuario del token). Si intenta la de otro → `403`.
- **Operador:** puede gestionar la agenda de cualquier médico, pero **solo en su sede**: alta, modificación y baja de rangos de otra sede (o sin sede asignada) → `403`. La consulta (`GET /agendas`) de cualquier sede sigue permitida.
- **Médico en más de una sede:** la sede de cada rango es la indicada en la agenda; el médico puede cargar rangos en cualquier sede.
- **Rangos con turnos confirmados:**
  - No se puede eliminar un rango con turnos `confirmado` → `409`.
  - No se puede eliminar un rango con turnos `cancelado` o `atendido` asociados (integridad del historial) → `409`.
  - No se puede modificar un rango dejando algún turno `confirmado` fuera del nuevo horario → `409`.
  - No se puede cambiar fecha, médico, especialidad o sede de un rango con turnos confirmados → `409`.
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
- `PATCH /turnos/:id/atender` — marcar atendido. Solo `medico`. Pasa a `atendido`; notifica `turno_atendido`. Body opcional `{ diagnostico, tratamiento, observaciones }` (máx. 255 caracteres cada uno; `diagnostico` y `tratamiento` obligatorios si se envía alguno): el cambio de estado y el historial clínico se guardan en **una sola transacción**, si algo falla no queda ninguno. La respuesta incluye `historial`. Sin body solo cambia el estado.
- `GET /turnos/mios` — turnos del paciente autenticado (`paciente`). Orden: `fecha ASC`, `hora ASC`.
- Los listados de turnos (`GET /turnos/mios` y `GET /turnos`) devuelven, además de los ids, `nombre_medico`, `apellido_medico`, `especialidad`, `sede`, `nombre_paciente`, `apellido_paciente` y `fecha_nacimiento_paciente` (`YYYY-MM-DD`, para calcular la edad).
- `GET /turnos` — listado por fecha. Roles: `operador`, `medico`. Query obligatoria: `fecha`.
  - Por médico: `id_medico` + `fecha`.
  - Por sede (solo operador): `id_sede` + `fecha`.

Reglas de negocio (alta):

- `nota` obligatoria (máx. 40 caracteres).
- `fecha` y `hora` no pueden ser pasadas.
- Deben existir médico, especialidad, sede activa y vínculo en `medico_especialidad`.
- Debe existir bloque de agenda para médico/especialidad/sede/fecha.
- El turno debe caber dentro del bloque, extremos incluidos (`hora_entrada <= hora_inicio` y `hora_fin <= hora_salida`). Ej.: agenda 09:00–13:00 admite turnos desde 09:00 hasta 12:30.
- Sin solapamiento con otro turno `confirmado` del mismo médico y fecha (intervalo 30 min).
- **Operador:** solo en su sede (`id_sede` del body = token).
- **Médico:** no puede crear turnos (`403`).

Reglas de negocio (cancelación):

- Solo desde `confirmado`.
- **Paciente:** solo sus turnos.
- **Operador:** solo turnos de su sede.
- **Médico:** solo sus propios turnos, en cualquiera de las sedes donde atiende (turno de otro médico → `403`).

Reglas de negocio (atención):

- Solo desde `confirmado`.
- Solo el médico dueño del turno.
- El historial se puede cargar en el mismo pedido (ver arriba) o después con `POST /historial`.

Reglas de negocio (listados):

- **Médico:** solo sus turnos (de todas sus sedes); `id_medico` ajeno → `403`. `id_sede` opcional para filtrar por sede.
- **Operador:** `id_medico` o `id_sede`, no ambos. Puede consultar cualquier sede o médico (solo lectura); modificar o cancelar queda limitado a su sede.

### Historial clínico

- `POST /historial` — solo `medico`.
- `GET /historial` — paciente ve el suyo; médico ve únicamente el de turnos que atendió él mismo. Query opcional `id_paciente`: el médico obtiene solo los registros de ese paciente que él atendió (los de otros médicos nunca se devuelven); el paciente solo puede pedir el suyo (otro → `403`). Cada registro incluye, además de los datos clínicos, `fecha_turno`, `hora_turno`, `especialidad_descripcion`, `sede_nombre`, `paciente_nombre`, `paciente_apellido`, `medico_nombre` y `medico_apellido`. Orden: turno más reciente primero.

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

### Usuarios (solo `admin`)

Gestión de usuarios para el administrador. Todas las rutas requieren token de un `admin` (`401` sin token, `403` con otro rol). Nunca se devuelve el campo `password`.

- `GET /usuarios`: listado paginado con filtros.
- `GET /usuarios/:id`: detalle del usuario. Incluye `especialidades` (`[]` si no es médico).
- `POST /usuarios`: alta de `operador`, `medico` o `admin`. Responde `201`.
- `PUT /usuarios/:id`: edición de un usuario de cualquier rol, incluido `paciente`.

**Paginación de `GET /usuarios`**

| Parámetro | Tipo | Por defecto | Descripción |
|-----------|------|-------------|-------------|
| `nombre` | string (máx. 30) | — | Contiene el texto |
| `apellido` | string (máx. 30) | — | Contiene el texto |
| `rol` | `admin` \| `operador` \| `medico` \| `paciente` | — | Igualdad |
| `id_sede` | entero positivo | — | Igualdad |
| `pagina` | entero positivo | `1` | Página pedida |
| `limite` | entero de 1 a 50 | `10` | Usuarios por página (máximo `50`) |

Un parámetro vacío (`?nombre=`) se ignora y uno inválido da `400`. El orden es por apellido, nombre e id. Una página posterior a la última devuelve `items` vacío. Respuesta en `datos`:

```json
{
  "items": [
    {
      "id": 3, "nombre": "Ana", "apellido": "Lopez", "dni": "20111222",
      "email": "alopez@clinica.com", "telefono": "1100000000",
      "fecha_nacimiento": "1985-03-10", "rol": "medico",
      "id_sede": 1, "sede": "Sede Centro",
      "id_cobertura": null, "cobertura": null
    }
  ],
  "total": 13,
  "pagina": 1,
  "limite": 10,
  "total_paginas": 2
}
```

**Campos de alta y edición**

| Campo | Regla |
|-------|-------|
| `nombre`, `apellido` | Obligatorios, máx. 30 caracteres |
| `dni` | 7 u 8 dígitos, único |
| `email` | Formato válido, máx. 30 caracteres, único |
| `password` | Mínimo 6 caracteres. Obligatorio en el alta, opcional en la edición (si no se envía, no cambia) |
| `telefono` | 6 a 10 dígitos |
| `fecha_nacimiento` | `YYYY-MM-DD`, no posterior a hoy |
| `rol` | Solo en el alta: `operador`, `medico` o `admin` |

| Rol | `id_sede` | `especialidades` (array de ids) | `id_cobertura` |
|-----|-----------|----------------------------------|----------------|
| `operador` | Obligatoria | No | No |
| `medico` | Obligatoria | Obligatorias | No |
| `admin` | No tiene sede | No | No |
| `paciente` (solo edición) | No | No | Obligatoria |

Mandar un campo que no corresponde al rol da `400`. Los pacientes se dan de alta con `POST /auth/registro`.

**Reglas de la edición**

- **El administrador no puede cambiar el rol de un usuario.** Si se envía `rol` distinto del actual, da `400`. Si es igual, se ignora.
- Para un médico, `especialidades` reemplaza todas las que tenía. Si se quita una especialidad que el médico tiene en una agenda de hoy en adelante, da `409`.
- Si cambia la sede de un operador o un médico, el cambio se aplica en su próximo login, porque `id_sede` viaja en el token.

Cada alta y cada modificación quedan en la auditoría (`entidad = usuario`). Respuestas: `200`/`201`, `400`, `401`, `403`, `404`, `409` (DNI o email duplicado, o especialidad con agenda).

---

## Cambios de backend para la entrega final

Endpoints nuevos:

- `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios` y `PUT /usuarios/:id`: gestión de usuarios del administrador (ver [Usuarios](#usuarios-solo-admin)).
- `PATCH /auth/perfil`: el paciente actualiza sus datos personales (ver [Auth](#auth)).

Endpoints modificados:

- `DELETE /especialidades/:id`: ahora también responde `409` si la especialidad se usa en la agenda. Antes la base rechazaba el borrado y la API devolvía `500`.

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
- Alta de operador, médico y administrador (`POST /usuarios`), y rechazo de un administrador con sede (`400`).
- Edición de un usuario sin cambiar el rol (`PUT /usuarios/:id`), y rechazo si se intenta cambiar (`400`).
- Listado de usuarios paginado y con filtros (`GET /usuarios?rol=medico&pagina=1&limite=5`).
- Paciente actualizando sus datos personales (`PATCH /auth/perfil`).
- Baja de una especialidad que se usa en la agenda rechazada con `409`.
