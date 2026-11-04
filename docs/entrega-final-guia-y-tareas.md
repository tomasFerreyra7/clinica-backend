# Entrega final (frontend y backend): guía de trabajo y división de tareas

Este documento reúne **todo el enunciado** de la entrega final (frontend y cambios de backend), las reglas obligatorias, los criterios de aceptación y la división de tareas entre Vos y Tomás. Está pensado para que Claude Code (o cualquier integrante) sepa qué construir, cómo y con qué restricciones.

---

## 1. Contexto y objetivo

- Completar, sobre la base de la **semana 1**, todas las funcionalidades restantes del frontend para los **cuatro roles**: administrador, médico, operador y paciente.
- Cubre: administración de sedes, especialidades y coberturas, agenda médica, turnos, historial clínico, notificaciones, gestión de usuarios, auditoría y reportes.
- Al finalizar, la aplicación debe quedar **completa y lista para la defensa**.
- Esta consigna reemplaza las semanas 2, 3 y 4 de frontend y se entrega en **una única instancia**.
- Se cuenta con la API construida en las cuatro semanas de backend y su documentación. Si la API no alcanza para alguna pantalla, se puede modificar (ver sección 6).

---

## 2. Instrucciones para Claude Code

### Stack y convenciones
- **Angular 21** con componentes de **Angular Material** en todas las pantallas.
- Todo lo de la semana 1 tiene que seguir funcionando. No romper el registro, el login ni el layout existentes.
- El proyecto debe levantar con `npm install` + `ng serve` y compilar con `ng build` **sin errores**.
- La URL de la API se define **en un solo lugar** (`environment`). Nunca repetir URLs en servicios o componentes.
- Sin `console.log` de prueba y sin código comentado sin uso.
- Diseño solo para **PC de escritorio**: no hace falta que sea responsive.

### Reglas al tocar el backend
- Respetar la **estructura de respuesta uniforme** de la API.
- Todo endpoint nuevo o modificado debe estar **protegido por rol**.
- Registrar en la **auditoría** cuando corresponda (altas, bajas y modificaciones sensibles).
- Documentar cada endpoint nuevo o modificado en la **colección de Postman** y mencionarlo en el `README.md`.
- Los errores de validación deben ser **controlados** (4xx con mensaje claro), nunca un 500.

### Reglas de interfaz que aplican a todas las pantallas
- Cada pantalla solo es accesible para los roles que corresponden, **tanto desde el menú como escribiendo la URL a mano** (guards).
- Mientras se espera una respuesta del backend, se muestra un **indicador de carga**.
- Si un listado no tiene resultados, se muestra un **mensaje** en lugar de una tabla vacía.
- Las fechas se muestran en formato local **dd/mm/aaaa**.
- Los errores del backend en altas, modificaciones y bajas se muestran al usuario **de forma clara**.
- Si el backend no responde o devuelve un error inesperado, se muestra un mensaje y la app **no queda en blanco ni en un estado inconsistente**.
- Si el token vence durante el uso, el usuario vuelve al **login**.
- Todas las opciones del menú quedan implementadas: **ninguna pantalla "En construcción"**.
- Los listados para elegir opciones (sedes, especialidades, coberturas y médicos) se cargan **desde la API**, nunca escritos a mano en el código.
- Los formularios **no permiten enviar datos inválidos**.
- El formulario de turno y el de alta de paciente **se reutilizan entre roles**: no hay pantallas duplicadas.

---

## 3. Reglas de negocio obligatorias

Son obligatorias sin importar cómo se implemente el backend:

- **Cada rol solo ve y opera sobre lo que le corresponde:**
  - Paciente: sus propios turnos y datos.
  - Médico: su propia agenda, sus propios turnos (en cualquiera de las sedes donde atiende) y el historial de los turnos que atendió él mismo.
  - Operador: solo modifica la agenda y los turnos **de su sede**. Puede consultar las demás sedes, pero no modificarlas.
- Al solicitar un turno solo se ofrecen las **fechas en que el médico tiene agenda** y los **horarios que siguen libres**.
- **No se puede eliminar un rango horario con turnos confirmados**, ni modificarlo dejando algún turno confirmado fuera del nuevo horario. La interfaz lo informa con un mensaje claro.
- El paciente solo puede modificar **email, contraseña, teléfono y cobertura**.
- El administrador puede crear y editar usuarios, incluidas las especialidades del médico.
- El operador y el médico **tienen sede**; el administrador **no tiene sede**.
- Un médico puede atender en **más de una sede**: la sede de cada rango horario es la que se indica en la agenda.

---

## 4. Funcionalidades por rol

### 4.1 Administrador

**Sedes, especialidades y coberturas**
- Una pantalla por entidad: sedes (nombre, dirección y teléfono), especialidades (descripción) y coberturas (nombre).
- Listado en una tabla con filtro de texto para buscar.
- Alta y modificación mediante un formulario con validaciones.
- Baja con confirmación previa ("¿Está seguro de eliminar...?").
- Si el backend rechaza la baja por dependencias, se muestra el mensaje del backend y el listado no se modifica.
- Después de cada alta, modificación o baja exitosa, el listado se actualiza sin recargar la página.

**Gestión de usuarios**
- Listado completo, paginado, con filtros por nombre, apellido, tipo de usuario y sede.
- Alta de operador, médico y administrador. Operador y médico se asignan a una sede; el administrador no tiene sede. El médico, además, recibe sus especialidades.
- Edición de cualquier tipo de usuario, incluidos los pacientes.

**Auditoría**
- Pantalla de solo lectura: usuario, acción (`ALTA` / `BAJA` / `MODIFICACION`), entidad, detalle y fecha.
- Filtros por usuario, entidad y rango de fechas.
- Listado paginado, con los registros más recientes primero.

**Reportes y estadísticas**
- Dashboard con: turnos por especialidad, turnos por sede, ranking de médicos por turnos atendidos y tasa de cancelación.
- Filtro por rango de fechas que actualiza **todos** los indicadores a la vez.
- Al menos un indicador con gráfico de barras y/o torta. Librería a elección, compatible con Angular 21, indicada en el `README`.

### 4.2 Médico

**Gestión de agenda**
- Ve su propia agenda, por defecto la del día actual, con selector de fecha.
- Da de alta rangos horarios con fecha, hora de entrada, hora de salida, especialidad y sede.
- La especialidad se elige entre las del propio médico. La sede se elige de un listado, con la sede del médico preseleccionada.
- Puede cargar más de un rango horario para el mismo día.
- Puede modificar y eliminar sus rangos. El formulario valida que la hora de salida sea posterior a la de entrada antes de enviar.

**Turnos programados**
- Por defecto, los turnos del día actual en todas las sedes donde atiende, con selector de fecha y filtro de sede.
- Tabla con hora, paciente, edad (calculada desde la fecha de nacimiento) y sede, ordenada por proximidad.
- Al hacer click en un turno se despliegan las notas del paciente.
- Cada turno confirmado tiene la acción "Marcar como atendido", que permite cargar diagnóstico, tratamiento y observaciones.
- Puede cancelar un turno, previa confirmación.

**Historial clínico**
- Buscar un paciente por DNI o apellido y consultar su historial, mostrando **únicamente** los registros de los turnos que atendió el médico logueado.

### 4.3 Operador

**Agenda y turnos**
- Al ingresar ve un filtro de fecha (día actual por defecto) y uno de sede (su sede por defecto), y una tabla con los médicos que tienen agenda para esa fecha y sede: nombre, especialidad y horario.
- Al cambiar cualquier filtro, la tabla se actualiza.
- Acción "Nueva agenda": elige el médico de un listado y carga el rango horario en su sede (fecha, horario y especialidad del médico), aunque el médico no tenga agenda previa.
- Cada fila tiene dos acciones:
  - Lápiz: editar la agenda del médico (agregar, modificar o eliminar rangos).
  - Ojo: ver los turnos confirmados de ese médico para esa fecha, con posibilidad de cancelarlos.
- Estas acciones y "Nueva agenda" solo están disponibles para **la sede del operador**.

**Pacientes y turnos**
- Alta de pacientes con los mismos datos y validaciones que el registro de la semana 1 (componente reutilizado).
- Asignar turnos: busca al paciente y le asigna un turno con el mismo flujo de "Nuevo turno", con la sede fija en la suya (componente reutilizado).

### 4.4 Paciente

**Nuevo turno**
- Paso a paso: especialidad → sede → médico → fecha → horario disponible → nota (obligatoria) y confirmación.
- Cada paso filtra el siguiente: solo médicos de la especialidad y sede elegidas, solo fechas con agenda y solo horarios libres de ese día.
- Antes de confirmar se muestra un resumen: especialidad, médico, sede, fecha, hora y cobertura. La cobertura no se elige: es la registrada por el paciente.
- Si el backend rechaza el turno (por ejemplo, el horario se ocupó), se muestra el mensaje y se permite elegir otro horario.

**Mis turnos**
- Listado del más próximo al menos próximo, con detalle desplegable: fecha completa, especialista, especialidad y sede.
- El estado (confirmado, cancelado, atendido) se distingue visualmente.
- Los turnos confirmados se pueden cancelar, previa confirmación.
- Si el turno fue atendido, el detalle muestra el resumen del historial clínico (diagnóstico, tratamiento y observaciones).

**Mis datos personales**
- Muestra toda la información del paciente. Solo se modifican email, contraseña, teléfono y cobertura; el resto en modo lectura.
- El cambio de contraseña pide repetir la nueva y valida que coincidan antes de enviar.

### 4.5 Notificaciones (todos los roles)
- La campana del header muestra la cantidad de no leídas; si no hay, el contador no se muestra.
- Al hacer click se despliega el listado, de la más reciente a la más antigua, distinguiendo visualmente las no leídas.
- El usuario puede marcar una notificación como leída y el contador se actualiza al instante.
- Después de confirmar, cancelar o atender un turno, el contador se actualiza sin recargar la página.
- Para el otro usuario involucrado alcanza con que se actualice la próxima vez que ingresa o navega. **No se requiere tiempo real.**

---

## 5. Sugerencias de cambios en el backend

Estos cambios son **sugerencias** para facilitar el desarrollo del frontend, no son obligatorios. Cada grupo decide cómo resolverlo en el backend: con estos endpoints, con otros distintos o adaptando los que ya tiene. Lo que sí es obligatorio es que el frontend respete las reglas de la sección 3, sin importar cómo se implementen.

Si se agregan o modifican endpoints, deben respetar la **estructura de respuesta uniforme**, estar **protegidos por rol** y quedar **documentados en la colección de Postman**.

### 5.1 Listado de médicos (nuevo)
- Endpoint que liste los médicos con sus especialidades: nombre, apellido y especialidades, **sin otros datos personales**.
- Filtrable por especialidad y por sede.
- Accesible para **cualquier usuario con sesión**. Lo usan:
  - El operador, para cargar agenda.
  - El médico, para ver sus propias especialidades.
  - El paciente, al solicitar un turno.

### 5.2 Lectura de sedes y especialidades
- Los listados de sedes y de especialidades pasan a estar disponibles para cualquier usuario con sesión (hoy son exclusivos del administrador).
- El alta, la modificación y la baja siguen siendo exclusivas del rol administrador.

### 5.3 Médicos en más de una sede
- Un médico puede atender en más de una sede: la sede de cada rango horario es la que se indica en la agenda.
- La restricción de la semana 3 de backend que limita al médico a los turnos "de su propia sede" se reemplaza por: **el médico solo puede operar sobre sus propios turnos, en cualquiera de las sedes donde tenga agenda**.

### 5.4 Agenda y turnos del operador
- El operador solo puede modificar la agenda y los turnos de **su propia sede**.
- Para los **turnos**, ya existe la restricción de la semana 3 de backend.
- Para la **agenda**, que en la semana 2 podía gestionar en cualquier sede, se sugiere validar que el alta, la modificación y la baja de rangos horarios hechas por un operador sean de su sede, respondiendo con un error controlado (**403**) en otro caso.
- La **consulta** del listado de agenda de otras sedes sigue permitida.

### 5.5 Consulta de disponibilidad (nuevo)
- Endpoint que, para un **médico, una especialidad y una sede**, devuelva las **fechas** en las que tiene agenda.
- Endpoint que, para un **médico, una fecha, una especialidad y una sede**, devuelva los **horarios libres**: los rangos de agenda del médico para esa especialidad y sede, menos los turnos confirmados.
- La **duración de cada turno** la define el grupo y debe ser coherente con la validación del alta de turno. Documentarla en el README.
- Accesibles para los roles **paciente y operador**.
- **No deben exponer datos de otros pacientes.**

### 5.6 Validaciones de agenda y especialidades
- No se puede eliminar un rango horario que tenga turnos confirmados, ni modificarlo de forma que algún turno confirmado quede fuera del nuevo horario. El intento devuelve un **error controlado (no un 500)**.
- Al eliminar una especialidad, además de `medico_especialidad`, validar que **no esté utilizada en la agenda**.

### 5.7 Listado de agenda
- Se recomienda que el listado de agenda devuelva, además de los ids, el **nombre y apellido del médico** y la **descripción de la especialidad y de la sede**, para no tener que resolverlos uno por uno desde el front.

### 5.8 Pacientes
- Endpoint de **búsqueda de pacientes por DNI o apellido**, accesible para los roles operador, médico y administrador.
- Endpoint para que el paciente actualice sus datos personales: **solo email, contraseña (guardada hasheada), teléfono y cobertura**.

### 5.9 Gestión de usuarios (rol administrador)
- Listado de usuarios **paginado**, con filtros por nombre, apellido, tipo de usuario y sede.
- Alta de usuarios de tipo **operador, médico y administrador**:
  - Al operador y al médico se les asigna una sede.
  - El administrador **no tiene sede**, ya que opera sobre todas.
  - Al médico se le asignan además sus especialidades (`medico_especialidad`).
- Edición de **cualquier tipo de usuario**, incluidas las especialidades del médico.
- Cada alta y modificación de usuarios **queda registrada en la auditoría**.

### 5.10 Otros ajustes en el backend
Además de las sugerencias anteriores, si para implementar alguna funcionalidad del frontend hace falta modificar el backend, se puede. Por ejemplo:
- Agregar un endpoint que no exista o ampliar uno existente.
- Sumar datos a una respuesta para no tener que resolverlos uno por uno desde el front (por ejemplo, nombres en lugar de ids).
- Agregar validaciones o ajustar la base de datos.

Estos cambios deben respetar las mismas convenciones del resto de la API: estructura de respuesta uniforme, protección por rol y registro en la auditoría cuando corresponda. Además, deben quedar **documentados en la colección de Postman** y **mencionados en el `README.md`**.

---

## 6. División de tareas

**Criterio:** división por dominio, de punta a punta. Cada uno hace el backend y el frontend de sus pantallas, para no pisarse archivos y poder probar sin esperar al otro.

### Fase 0: arranque (1 o 2 días)

**Juntos**
- [ ] Definir los contratos (DTOs) de los endpoints nuevos, incluido el del historial clínico.
- [ ] Acordar la estructura de carpetas y servicios.

**Vos: infraestructura común**
- [ ] Interceptor HTTP: backend caído, error inesperado y mensaje del backend.
- [ ] Redirección al login si vence el token (401).
- [ ] Guards por rol en todas las rutas.
- [ ] Componentes compartidos: diálogo de confirmación, indicador de carga y mensaje de "sin resultados".
- [ ] Formato de fecha dd/mm/aaaa.
- [ ] URL de la API en un solo lugar (`environment`).

**Tomás: backend de lectura compartido**
- [ ] Sedes y especialidades accesibles para cualquier usuario con sesión.
- [ ] Endpoint de listado de médicos con especialidades, filtrable por especialidad y sede.

### Vos: Administrador, Paciente y Notificaciones

**Backend**
- [ ] Gestión de usuarios: listado paginado con filtros, alta, edición y registro en auditoría.
- [ ] Actualización de datos personales del paciente.
- [ ] Validar que una especialidad no esté en la agenda antes de eliminarla.

**Frontend**
- [ ] ABM de sedes, especialidades y coberturas (4.1).
- [ ] Gestión de usuarios (4.1).
- [ ] Auditoría (4.1).
- [ ] Reportes con gráfico (4.1).
- [ ] Alta de paciente como **componente reutilizable**.
- [ ] Mis turnos (4.4).
- [ ] Mis datos personales (4.4).
- [ ] Notificaciones (4.5), con un método del servicio para refrescar el contador que usa Tomás.

### Tomás: Médico, Operador y flujo de turnos

**Backend**
- [ ] Médicos en más de una sede.
- [ ] Restricción de agenda del operador a su sede (403).
- [ ] Endpoints de disponibilidad.
- [ ] Validaciones de rangos con turnos confirmados.
- [ ] Listado de agenda con nombres.
- [ ] Búsqueda de pacientes por DNI o apellido.

**Frontend**
- [ ] Nuevo turno como **componente reutilizable** (4.4).
- [ ] Agenda del médico (4.2).
- [ ] Turnos programados del médico (4.2).
- [ ] Historial clínico del médico (4.2).
- [ ] Agenda y turnos del operador (4.3).
- [ ] Alta de paciente del operador, usando el componente de Vos.
- [ ] Asignar turno del operador, usando el componente de nuevo turno con sede fija.

### Fase final: juntos
- [ ] Datos de prueba (sección 7).
- [ ] `README.md` final (sección 7).
- [ ] Colección de Postman actualizada (cada uno documenta sus endpoints).
- [ ] Limpieza: sin `console.log`, sin código comentado y sin pantallas "En construcción".
- [ ] Prueba cruzada: cada uno prueba las pantallas del otro con los criterios de la sección 9.
- [ ] Probar con el backend apagado.
- [ ] Confirmar que `ng build` compila sin errores.
- [ ] Subir a la rama `entrega-frontend`.

### Puntos de coordinación

| Qué | Lo hace | Lo usa |
|---|---|---|
| Servicio de notificaciones (refrescar contador) | Vos | Tomás (confirmar, cancelar y atender turnos) |
| Componente de alta de paciente | Vos | Tomás (operador) |
| Historial clínico cargado al atender | Tomás | Vos (Mis turnos) |
| Componente de nuevo turno | Tomás | Paciente y operador |
| Listado de médicos y lectura de sedes y especialidades | Tomás | Ambos |

---

## 7. Datos de prueba y documentación

**Base de datos de prueba**
- [ ] Al menos tres médicos, con distintas especialidades.
- [ ] Uno de ellos con agenda en más de una sede.
- [ ] Turnos en los tres estados: confirmado, cancelado y atendido.

**`README.md`**
- [ ] Versiones de Node y Angular.
- [ ] Pasos para levantar backend y frontend desde cero, incluida la base de datos.
- [ ] Variables de entorno necesarias.
- [ ] Librería de gráficos utilizada.
- [ ] Usuarios de prueba de los cuatro roles.
- [ ] Cambios realizados en el backend (endpoints nuevos o modificados).
- [ ] Duración definida para cada turno.

---

## 8. Entregable

- Repositorio frontend actualizado sobre la base de la semana 1, en la rama **`entrega-frontend`**.
- Backend con los cambios necesarios para el frontend (sigan o no las sugerencias), con la colección de Postman actualizada.
- Frontend con todas las funcionalidades de los cuatro roles.
- `README.md` final con las instrucciones completas para la defensa: cómo levantar el proyecto, versiones utilizadas, etc.

---

## 9. Criterios de aceptación

Usar esta lista como checklist final antes de entregar.

- [ ] El proyecto levanta con `npm install` + `ng serve` y compila con `ng build` sin errores. Todo lo de la semana 1 sigue funcionando.
- [ ] Las pantallas usan componentes de Angular Material.
- [ ] Cada pantalla solo es accesible para los roles que corresponden, tanto desde el menú como escribiendo la URL a mano.
- [ ] El administrador puede dar de alta, modificar y eliminar sedes, especialidades y coberturas. Eliminar una con dependencias muestra el mensaje del backend y no rompe la aplicación.
- [ ] El administrador puede listar, filtrar, crear y editar usuarios, y esas acciones aparecen luego en la auditoría.
- [ ] El médico solo ve y modifica su propia agenda, y puede cargarla en más de una sede.
- [ ] El operador puede cargar agenda a cualquier médico en su sede, aunque no tenga agenda previa, pero la interfaz no le permite modificar agenda ni turnos de otras sedes.
- [ ] La interfaz no permite eliminar un rango horario con turnos confirmados, ni modificarlo dejando algún turno confirmado afuera, y lo informa con un mensaje claro.
- [ ] El paciente solo puede elegir horarios disponibles: no se le ofrecen horarios fuera de la agenda ni ya ocupados.
- [ ] Un turno atendido muestra su historial clínico en "Mis turnos" del paciente.
- [ ] Un médico no puede ver desde la interfaz el historial de turnos que no atendió él mismo.
- [ ] Al confirmar, cancelar o atender un turno, el contador de notificaciones se actualiza: para quien realiza la acción, sin recargar; para el otro usuario, la próxima vez que ingresa o navega.
- [ ] Los reportes muestran datos consistentes con la base, se actualizan al cambiar el rango de fechas, y al menos uno se visualiza con un gráfico.
- [ ] Los formularios no permiten enviar datos inválidos.
- [ ] El formulario de turno y el de alta de paciente se reutilizan entre roles (no hay pantallas duplicadas).
- [ ] Con el backend detenido, la aplicación muestra un mensaje de error y no queda colgada ni en blanco.
- [ ] Siguiendo el `README`, alguien que no participó del desarrollo puede levantar el sistema completo y probarlo con cada rol.
