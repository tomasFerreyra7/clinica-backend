# División de tareas — Frontend semanas 2 a 4

**Criterio:** división por dominio, de punta a punta. Cada uno hace el backend y el frontend de sus pantallas, para no pisarse los mismos archivos y poder probar lo propio sin esperar al otro.

---

## Fase 0 — Arranque (1 o 2 días)

### Juntos
- [ ] Definir los contratos (DTOs) de los endpoints nuevos, incluido el DTO del historial clínico.
- [ ] Acordar la estructura de carpetas y servicios.

### Vos — Infraestructura común
- [ ] Interceptor HTTP con manejo de errores: backend caído, error inesperado y mensaje del backend.
- [ ] Redirección al login si vence el token (401).
- [ ] Guards por rol en todas las rutas, para que no se pueda entrar escribiendo la URL a mano.
- [ ] Componentes compartidos: diálogo de confirmación, indicador de carga y mensaje de "sin resultados".
- [ ] Formato de fecha dd/mm/aaaa.
- [ ] URL de la API en un solo lugar (`environment`).

### Tomás — Backend de lectura compartido
- [ ] Listados de sedes y especialidades accesibles para cualquier usuario con sesión. El ABM sigue siendo solo para administrador.
- [ ] Endpoint de listado de médicos con sus especialidades, filtrable por especialidad y sede.

---

## Vos — Administrador, Paciente y Notificaciones

### Backend
- [ ] Gestión de usuarios: listado paginado con filtros (nombre, apellido, tipo y sede).
- [ ] Alta de operador, médico y administrador, con sede y especialidades según el tipo.
- [ ] Edición de cualquier usuario, incluidas las especialidades del médico.
- [ ] Registro en la auditoría de cada alta y modificación de usuarios.
- [ ] Endpoint para que el paciente actualice solo email, contraseña (hasheada), teléfono y cobertura.
- [ ] Al eliminar una especialidad, validar también que no se use en la agenda.

### Frontend
- [ ] **ABM de sedes, especialidades y coberturas**
  - Tabla con filtro de texto.
  - Formulario de alta y modificación con validaciones.
  - Baja con confirmación.
  - Si hay dependencias, mostrar el mensaje del backend sin modificar el listado.
  - Actualizar el listado sin recargar la página.
- [ ] **Gestión de usuarios:** listado, filtros, alta y edición.
- [ ] **Auditoría:** solo lectura, con filtros por usuario, entidad y fechas, paginación y lo más reciente primero.
- [ ] **Reportes**
  - Dashboard con turnos por especialidad, turnos por sede, ranking de médicos y tasa de cancelación.
  - Filtro de fechas que actualiza todo a la vez.
  - Al menos un gráfico de barras o torta. Elegir la librería y anotarla para el README.
- [ ] **Alta de paciente como componente reutilizable** (lo usa el operador).
- [ ] **Mis turnos (paciente)**
  - Orden del más próximo al menos próximo.
  - Detalle desplegable.
  - Estados distinguidos visualmente.
  - Cancelación con confirmación.
  - Historial clínico si el turno fue atendido.
- [ ] **Mis datos personales:** solo editables email, contraseña, teléfono y cobertura. Repetición de contraseña validada.
- [ ] **Notificaciones**
  - Campana con contador, oculto si no hay no leídas.
  - Listado de la más reciente a la más antigua, con las no leídas destacadas.
  - Marcar como leída con actualización instantánea del contador.
  - Exponer un método en el servicio para refrescar el contador, que usa Tomás.

---

## Tomás — Médico, Operador y flujo de turnos

### Backend
- [ ] Médicos en más de una sede: la sede sale del rango horario y el médico opera sobre sus turnos en cualquier sede.
- [ ] Operador: alta, modificación y baja de agenda solo en su sede (403 en otro caso).
- [ ] Endpoints de disponibilidad: fechas con agenda y horarios libres.
- [ ] Validaciones de agenda: no borrar un rango con turnos confirmados ni modificarlo dejando turnos afuera. Responder con un error controlado, no un 500.
- [ ] Listado de agenda con nombres de médico, especialidad y sede en vez de ids.
- [ ] Búsqueda de pacientes por DNI o apellido (operador, médico y administrador).

### Frontend
- [ ] **Nuevo turno como componente reutilizable**
  - Paso a paso: especialidad → sede → médico → fecha → horario → nota obligatoria.
  - Cada paso filtra las opciones del siguiente.
  - Resumen antes de confirmar, con la cobertura del paciente.
  - Si el backend rechaza el turno, mostrar el mensaje y permitir elegir otro horario.
- [ ] **Médico, agenda**
  - Día actual por defecto, con selector de fecha.
  - Alta, edición y baja de rangos, varios por día.
  - Validar que la hora de salida sea posterior a la de entrada.
  - Sede preseleccionada.
- [ ] **Médico, turnos programados**
  - Filtros de fecha y sede.
  - Edad calculada y orden por proximidad.
  - Notas del paciente desplegables.
  - "Marcar como atendido" con diagnóstico, tratamiento y observaciones.
  - Cancelación con confirmación.
- [ ] **Médico, historial clínico:** búsqueda de paciente, mostrando solo los turnos que atendió él.
- [ ] **Operador, agenda**
  - Filtros de fecha y sede, con su sede por defecto.
  - Tabla de médicos con agenda.
  - "Nueva agenda".
  - Lápiz para editar agenda y ojo para ver y cancelar turnos, habilitados solo en su sede.
- [ ] **Operador, alta de paciente:** usa el componente de Vos.
- [ ] **Operador, asignar turno:** usa el componente de nuevo turno, con la sede fija.

---

## Fase final — Juntos

- [ ] Datos de prueba: al menos 3 médicos con distintas especialidades, uno con agenda en más de una sede, y turnos en los tres estados.
- [ ] README: versiones de Node y Angular, pasos para levantar todo desde cero, variables de entorno, librería de gráficos, usuarios de prueba de los cuatro roles y cambios hechos al backend.
- [ ] Colección de Postman actualizada (cada uno documenta sus endpoints).
- [ ] Limpieza: sin `console.log`, sin código comentado y sin pantallas "En construcción".
- [ ] Prueba cruzada: cada uno prueba las pantallas del otro con los criterios de aceptación.
- [ ] Probar con el backend apagado.
- [ ] Confirmar que `ng build` compila sin errores.
- [ ] Crear la rama `entrega-frontend`.

---

## Puntos de coordinación

| Qué | Lo hace | Lo usa |
|---|---|---|
| Servicio de notificaciones (refrescar contador) | Vos | Tomás (confirmar, cancelar y atender turnos) |
| Componente de alta de paciente | Vos | Tomás (operador) |
| Historial clínico cargado al atender | Tomás | Vos (Mis turnos) |
| Componente de nuevo turno | Tomás | Paciente y operador |
| Listado de médicos y lectura de sedes y especialidades | Tomás | Ambos |
