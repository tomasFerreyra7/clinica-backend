# Clinica - Backend (Semana 1)

Setup, conexión a base y autenticación (JWT).

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

Copiar `.env.example` a `.env` y completar credenciales (ya viene un `.env` de ejemplo para desarrollo local).

## Correr

```bash
pnpm run dev
```

Servidor en `http://localhost:3000`.

## Endpoints

- `GET /health` — chequea conexión a la base.
- `GET /coberturas` — público, lista coberturas disponibles (usado en el registro).
- `GET /coberturas/:id`, `POST /coberturas`, `PUT /coberturas/:id`, `DELETE /coberturas/:id` — CRUD, solo rol `admin`. El delete es baja lógica (columna `activo`) y devuelve 409 si la cobertura tiene usuarios asociados.
- `GET /sedes`, `GET /sedes/:id`, `POST /sedes`, `PUT /sedes/:id`, `DELETE /sedes/:id` — CRUD, solo rol `admin`. El delete es baja lógica (columna `activo`) y devuelve 409 si la sede tiene médicos, operadores o agenda asociada.
- `POST /auth/registro` — alta de paciente. Body: `nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono?`.
- `POST /auth/login` — Body: `dni, password`. Devuelve JWT con `id, rol, id_sede`.
- `GET /auth/perfil` — protegido (`verificarToken` + `verificarRol`). Header `Authorization: Bearer <token>`.

## Formato de respuesta uniforme

```json
{ "codigo": 200, "estado": "ok", "datos": { } }
```

Mismo formato en éxito y error.

## Postman

Las colecciones de Postman no se versionan en git (contienen credenciales de prueba). Mantené tu copia local en `postman_collection.json` / `postman/` (ya en `.gitignore`) y compartila con el equipo por fuera del repo.
