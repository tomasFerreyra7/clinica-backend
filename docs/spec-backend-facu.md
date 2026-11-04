# Spec: backend de Facu para la entrega final

Tareas de backend que le tocan a Facu según `docs/entrega-final-guia-y-tareas.md` (sección 6, "Vos: Administrador, Paciente y Notificaciones"). Cada tarea se implementa, se prueba y se commitea por separado.

- **Rama:** `facu-entrega-final`, creada desde `master`. Al final se mergea con los cambios de Tomás.
- **Commits:** Conventional Commits, uno por tarea (ver la sección final).
- **Fuera de esta spec:**
  - Nombres en `GET /turnos/mios`: lo hace Tomás.
  - Colección de Postman: se entrega por otro lado.

---

## Reglas generales

Aplican a todas las tareas y siguen las convenciones del repo.

- **Capas:** `routes` → `controllers` → `services` → `database/db.js`. Sin lógica de negocio en routes ni controllers.
- **Respuesta uniforme:** `{ codigo, estado, mensaje, datos }`, usando `enviarOk` y `enviarError`.
- **Errores:**
  - De validación: `400` con mensaje claro.
  - Conflictos de negocio: `409`.
  - Recurso inexistente: `404`.
  - Sin sesión o sin permiso: `401` o `403`.
  - Nunca un `500` por un input inválido.
- **Validación antes de la base:** se valida todo lo que llega en `body`, `params` y `query`. A los strings se les hace trim y se rechazan los vacíos o hechos solo de espacios.
- **Seguridad:** nunca se devuelve el campo `password`. Las contraseñas se guardan con `bcrypt` (`SALT_ROUNDS = 10`, igual que en `auth.service.js`).
- **Auditoría:** se usa `registrarAuditoria` de `src/utils/auditoria.js` con `entidad: 'usuario'`. En `idUsuario` va quien hace la acción. El detalle nunca incluye contraseñas.
- **Swagger:** cada endpoint nuevo o modificado se documenta con un bloque `@swagger` en su archivo de rutas.

### Validaciones de campos de usuario

Son reutilizables entre las tareas 4, 5 y 6. Las longitudes salen de la tabla `usuario`.

| Campo | Regla |
|---|---|
| `nombre`, `apellido` | Texto obligatorio, máximo 30 caracteres. |
| `dni` | Solo dígitos, de 7 a 8. Único. |
| `email` | Formato `algo@dominio.ext`, máximo 30 caracteres. Único. |
| `password` | Texto de 6 caracteres como mínimo. |
| `telefono` | Solo dígitos, de 6 a 10. |
| `fecha_nacimiento` | `YYYY-MM-DD` válida (con `validarFecha`) y no posterior a hoy. |
| `id_sede` | Entero positivo de una sede activa (`sede.activo = 1`). |
| `id_cobertura` | Entero positivo de una cobertura activa (`cobertura.activo = 1`). |
| `especialidades` | Array no vacío de enteros positivos, sin repetidos, todos existentes en `especialidad`. |

### Reglas por rol

| Rol | Sede | Especialidades | Cobertura |
|---|---|---|---|
| `operador` | Obligatoria | No se envían | No se envía |
| `medico` | Obligatoria | Obligatorias | No se envía |
| `admin` | No tiene: enviarla da `400` | No se envían | No se envía |
| `paciente` | No tiene | No se envían | Obligatoria |

Mandar un campo que no corresponde al rol da `400` con un mensaje que lo nombra. Por ejemplo: "El administrador no tiene sede".

---

## Tarea 1: impedir borrar una especialidad que se usa en la agenda

**Problema:** `DELETE /especialidades/:id` solo revisa `medico_especialidad`. Si la especialidad está en una agenda, la clave foránea `agenda.id_especialidad` hace fallar el `DELETE` y la API responde `500`.

**Pasos:**
1. En `eliminarEspecialidad` (`src/services/especialidad.service.js`), después del chequeo de `medico_especialidad`, consultar `SELECT id FROM agenda WHERE id_especialidad = ? LIMIT 1`.
2. Si hay filas, lanzar `ErrorServicio(409, 'No se puede eliminar la especialidad porque se usa en la agenda')`.
3. En el Swagger de `DELETE /especialidades/{id}` (`src/routes/especialidad.routes.js`), actualizar la descripción del `409`: "Tiene médicos asociados o se usa en la agenda".

**Prueba:**
- Borrar una especialidad que está en una agenda pero no tiene médicos asociados devuelve `409` con el mensaje nuevo, y la especialidad sigue en la base.
- Borrar una especialidad sin uso sigue devolviendo `200`.

---

## Tarea 2: listado de usuarios paginado (`GET /usuarios`)

Crea el módulo nuevo de usuarios.

**Acceso:** `verificarToken` + `verificarRol('admin')`, aplicados a todo el router con `router.use`, igual que en especialidades.

**Query (todos opcionales):**

| Parámetro | Regla | Uso |
|---|---|---|
| `nombre` | Texto, máximo 30 caracteres | Contiene: `nombre LIKE %valor%` |
| `apellido` | Texto, máximo 30 caracteres | Contiene: `apellido LIKE %valor%` |
| `rol` | `admin`, `operador`, `medico` o `paciente` | Igualdad |
| `id_sede` | Entero positivo | Igualdad |
| `pagina` | Entero positivo, por defecto `1` | Página pedida |
| `limite` | Entero de 1 a 50, por defecto `10` | Usuarios por página |

Un parámetro presente pero inválido da `400`. Un parámetro vacío (`?nombre=`) se ignora.

**Respuesta `200`:**
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
- Orden: `apellido`, `nombre`, `id`, ascendente.
- `sede` y `cobertura` salen de un `LEFT JOIN`; son `null` si el usuario no tiene.
- `fecha_nacimiento` en formato `YYYY-MM-DD`.
- `total` se calcula con un `COUNT(*)` que usa los mismos filtros.
- Si se pide una página más allá de la última, `items` viene vacío. No es un error.

**Pasos:**
1. Crear `src/services/usuario.service.js` con su `ErrorServicio`, una función `obtenerFiltrosUsuario(query)` y `listarUsuarios(query)`.
2. Crear `src/controllers/usuario.controller.js` con `listar`, que usa el mismo manejo de errores que los demás controllers.
3. Crear `src/routes/usuario.routes.js` con `GET /` y su Swagger (tag `Usuarios`).
4. Registrar la ruta en `src/index.js`: `app.use('/usuarios', usuarioRoutes)`.

**Prueba:**
- Sin token da `401`. Con un rol que no es admin da `403`.
- Filtros combinados y la paginación (`?pagina=2&limite=5`) devuelven lo esperado.
- `?rol=jefe` y `?limite=100` dan `400`.

---

## Tarea 3: detalle de usuario (`GET /usuarios/:id`)

**Acceso:** solo admin (lo hereda del router).

**Validaciones:**
- `id` tiene que ser un entero positivo; si no, `400`.
- Si el usuario no existe, `404` "Usuario no encontrado".

**Respuesta `200`:** los mismos campos que un item del listado, más `especialidades`. Ejemplo:
```json
{ "id": 3, "...": "...", "especialidades": [{ "id": 1, "descripcion": "Traumatologia" }] }
```
Si el usuario no es médico, `especialidades` es `[]`.

**Pasos:**
1. En el service, agregar `obtenerUsuario(id)`: un `SELECT` con los `JOIN` de sede y cobertura, más la consulta de especialidades a `medico_especialidad JOIN especialidad`.
2. Agregar `obtener` en el controller y `GET /:id` en las rutas, con su Swagger.

**Prueba:**
- Un médico trae sus especialidades; un paciente trae `especialidades: []`.
- `/usuarios/abc` da `400`. `/usuarios/999` da `404`.

---

## Tarea 4: alta de usuario (`POST /usuarios`)

**Acceso:** solo admin.

**Body:**

| Campo | Obligatorio |
|---|---|
| `nombre`, `apellido`, `dni`, `email`, `password`, `telefono`, `fecha_nacimiento`, `rol` | Sí |
| `id_sede` | Solo para operador y médico |
| `especialidades` | Solo para médico |

**Validaciones**, en este orden:
1. Todos los campos según la tabla de "Validaciones de campos de usuario".
2. `rol` es `operador`, `medico` o `admin`. Si es `paciente`, `400` "Los pacientes se registran con POST /auth/registro".
3. Las reglas por rol: sede, especialidades y que no venga `id_cobertura`.
4. La sede, las especialidades y la cobertura existen en la base.
5. `dni` o `email` duplicado: `409` "Ya existe un usuario con ese DNI o email".

**Pasos:**
1. En el service, crear los validadores compartidos de la sección "Reglas generales", que después reutilizan las tareas 5 y 6.
2. Agregar `crearUsuario(body, idAdmin)` en el service:
   - Hashear la contraseña.
   - Abrir una transacción con `pool.getConnection()` y `beginTransaction`.
   - Insertar en `usuario` y, si es médico, insertar sus filas en `medico_especialidad`.
   - Hacer `commit`. Si algo falla, `rollback`. En los dos casos, `release`.
   - Registrar en la auditoría: `ALTA`, con el detalle "Se dio de alta el usuario {id} con rol {rol}".
   - Devolver el usuario creado con el mismo formato de la tarea 3.
3. Agregar `crear` en el controller (responde `201`) y `POST /` en las rutas, con su Swagger.

**Prueba:**
- Crear un operador con sede, un médico con dos especialidades y un admin sin sede: los tres dan `201`.
- Un admin con `id_sede`, un médico sin especialidades y `rol: paciente` dan `400`.
- Un DNI repetido da `409`.
- Después de crear un médico, ver en `medico_especialidad` que se guardaron sus filas.
- En `GET /auditoria?entidad=usuario` aparecen las altas.
- Hacer login con el usuario creado funciona.

---

## Tarea 5: edición de usuario (`PUT /usuarios/:id`)

**Acceso:** solo admin. Sirve para cualquier rol, incluido paciente.

**Body:** el formulario completo del usuario, según su rol actual.

| Campo | Regla |
|---|---|
| `nombre`, `apellido`, `dni`, `email`, `telefono`, `fecha_nacimiento` | Obligatorios. |
| `id_sede`, `especialidades`, `id_cobertura` | Según la tabla "Reglas por rol", con el rol actual del usuario. Para un médico, `especialidades` reemplaza todas las que tenía. |
| `password` | Opcional. Si viene, se valida y se guarda hasheada. Si no viene, la contraseña no cambia. |
| `rol` | El rol no se puede modificar. Si viene y es distinto del actual, `400` "No se puede modificar el rol del usuario". Si viene igual, se ignora. |

**Validaciones:**
- `id` tiene que ser un entero positivo (`400`) y el usuario tiene que existir (`404`).
- Los campos, según las tablas de "Reglas generales".
- `dni` o `email` usado por otro usuario: `409`.
- **Especialidades con agenda:** si a un médico se le quita una especialidad que tiene en una agenda de hoy en adelante, `409` "No se puede quitar la especialidad {descripcion} porque el medico tiene agenda con ella".

**Pasos:**
1. Agregar `actualizarUsuario(id, body, idAdmin)` en el service. Reutiliza los validadores de la tarea 4.
2. En una transacción:
   - Hacer el `UPDATE` de `usuario`.
   - Si es médico, borrar sus filas de `medico_especialidad` e insertar las nuevas.
3. Registrar en la auditoría: `MODIFICACION`, con el detalle "Se modifico el usuario {id}". Si cambió la contraseña, agregar " (incluye cambio de contraseña)".
4. Devolver el usuario actualizado con el formato de la tarea 3.
5. Agregar `actualizar` en el controller y `PUT /:id` en las rutas, con su Swagger.

**Notas:**
- Si se cambia la sede de un operador o un médico, el cambio se aplica cuando vuelve a hacer login, porque `id_sede` viaja en el token.
- La sede del médico es la que se preselecciona en su agenda. Las sedes donde atiende salen de la agenda (punto 5.3 de la guía, que lo hace Tomás).

**Prueba:**
- Editar los datos de un paciente da `200`.
- Cambiar las especialidades de un médico reemplaza sus filas en `medico_especialidad`.
- Mandar `rol` distinto del actual da `400`.
- Sin `password`, el login con la contraseña anterior sigue funcionando. Con `password`, funciona el login con la nueva.
- En `GET /auditoria?entidad=usuario` aparece la modificación.

---

## Tarea 6: datos personales del paciente (`PATCH /auth/perfil`)

**Acceso:** `verificarToken` + `verificarRol('paciente')`. El paciente se toma de `req.usuario.id`, nunca del body.

**Body:** `email`, `password`, `telefono` e `id_cobertura`, todos opcionales. Tiene que venir al menos uno.

**Validaciones:**
- Cualquier otra clave en el body (`nombre`, `dni`, `rol`, etc.): `400` "Solo se pueden modificar email, password, telefono e id_cobertura".
- Body vacío: `400` "Debe indicar al menos un campo a modificar".
- Cada campo presente, según la tabla de "Reglas generales".
- `email` usado por otro usuario: `409`.
- La repetición de la contraseña se valida en el front. El back no la recibe.

**Pasos:**
1. Agregar `actualizarPerfilPaciente(idUsuario, body)` en `src/services/auth.service.js`. Reutiliza los validadores de usuario: exportarlos desde `usuario.service.js` o moverlos a `src/utils/validacion.js`, lo que quede más limpio sin duplicar código.
2. Hacer un `UPDATE` solo de los campos recibidos, y hashear la contraseña si viene.
3. Registrar en la auditoría: `MODIFICACION`, con `idUsuario` del paciente y el detalle "El paciente {id} actualizo sus datos personales".
4. Devolver `obtenerPerfil(id)` actualizado.
5. Agregar `actualizarPerfil` en `src/controllers/auth.controller.js` y `PATCH /perfil` en `src/routes/auth.routes.js`, con su Swagger.

**Prueba:**
- Un paciente cambia su teléfono y su cobertura: `200`, y `GET /auth/perfil` muestra los cambios.
- Mandar `nombre` da `400`. Con un rol que no es paciente da `403`.
- Un email de otro usuario da `409`.
- Después de cambiar la contraseña, el login funciona con la nueva y falla con la anterior.

---

## Tarea 7: documentación en el README

1. Agregar al `README.md` una sección con los endpoints nuevos o modificados: `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios`, `PUT /usuarios/:id`, `PATCH /auth/perfil` y la validación nueva de `DELETE /especialidades/:id`.
2. Explicar la paginación: los parámetros `pagina` y `limite`, sus valores por defecto, el máximo de 50 y el formato de la respuesta.
3. Aclarar que el admin no puede cambiar el rol de un usuario.

---

## Observaciones

- `usuario.id` y las claves que lo referencian son `tinyint(4)`, así que el máximo es 127 usuarios. Alcanza para la entrega (hoy hay 13), pero conviene saberlo si se cargan muchos datos de prueba. Esta spec no lo cambia.

---

## Commits sugeridos

Uno por tarea, en este orden.

**Tarea 1**
```
git add src/services/especialidad.service.js src/routes/especialidad.routes.js
git commit -m "fix(especialidades): impedir baja si la especialidad se usa en la agenda"
```

**Tarea 2**
```
git add src/services/usuario.service.js src/controllers/usuario.controller.js src/routes/usuario.routes.js src/index.js
git commit -m "feat(usuarios): agregar listado paginado con filtros para administrador"
```

**Tarea 3**
```
git add src/services/usuario.service.js src/controllers/usuario.controller.js src/routes/usuario.routes.js
git commit -m "feat(usuarios): agregar detalle de usuario con especialidades del medico"
```

**Tarea 4**
```
git add src/services/usuario.service.js src/controllers/usuario.controller.js src/routes/usuario.routes.js
git commit -m "feat(usuarios): agregar alta de operador, medico y administrador con auditoria"
```

**Tarea 5**
```
git add src/services/usuario.service.js src/controllers/usuario.controller.js src/routes/usuario.routes.js
git commit -m "feat(usuarios): agregar edicion de usuarios y especialidades del medico con auditoria"
```

**Tarea 6**
```
git add src/services/auth.service.js src/controllers/auth.controller.js src/routes/auth.routes.js
git commit -m "feat(perfil): permitir al paciente actualizar sus datos personales"
```
Si en la tarea 6 los validadores se mueven a `src/utils/validacion.js`, sumar ese archivo y `src/services/usuario.service.js` al `git add`.

**Tarea 7**
```
git add README.md
git commit -m "docs: documentar gestion de usuarios y datos personales del paciente"
```

**Al terminar**
```
git push -u origin facu-entrega-final
```
