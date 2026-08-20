# Clinica - Backend (Semana 2)

API de gestión de clínica: autenticación JWT, coberturas, especialidades y agenda médica.

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
```

Copiar `.env.example` a `.env` y completar credenciales.

## Correr

```bash
pnpm run dev
```

Servidor en `http://localhost:3000`.

Header en rutas protegidas: `Authorization: Bearer <token>`.

## Formato de respuesta uniforme

```json
{ "codigo": 200, "estado": "ok", "datos": { } }
```

Mismo formato en éxito y error (`datos` suele ser `null` en error).

## Endpoints

### Base

- `GET /health` — chequea conexión a la base.
- `GET /coberturas` — lista coberturas disponibles.

### Auth

- `POST /auth/registro` — alta de paciente. Body: `nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono?`.
- `POST /auth/login` — Body: `dni, password`. Devuelve JWT con `id, rol, id_sede`.
- `GET /auth/perfil` — protegido (`verificarToken`).
- `GET /auth/solo-admin` — prueba de rol: solo `admin`.

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

## Postman

Importar `postman_collection.json`. Completar variables de colección (`dni_*`, `password_*`, ids) antes de probar.
