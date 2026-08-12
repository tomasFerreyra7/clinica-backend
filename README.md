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
```

Copiar `.env.example` a `.env` y completar credenciales (ya viene un `.env` de ejemplo para desarrollo local).

## Correr

```bash
pnpm run dev
```

Servidor en `http://localhost:3000`.

## Endpoints

- `GET /health` — chequea conexión a la base.
- `GET /coberturas` — lista coberturas disponibles.
- `POST /auth/registro` — alta de paciente. Body: `nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono?`.
- `POST /auth/login` — Body: `dni, password`. Devuelve JWT con `id, rol, id_sede`.
- `GET /auth/perfil` — protegido (`verificarToken` + `verificarRol`). Header `Authorization: Bearer <token>`.

## Formato de respuesta uniforme

```json
{ "codigo": 200, "estado": "ok", "datos": { } }
```

Mismo formato en éxito y error.

## Postman

Ver `postman_collection.json`.
