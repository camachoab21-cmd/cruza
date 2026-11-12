# Verificación de CRUZA-FINAL (integración del login por perfiles)

**Base usada:** archivo `index.html` aportado por el usuario, 147.759 bytes, modificado por adición de CSS/JS al final. Se dejó respaldo byte a byte del archivo original.

## Verificado en Chromium

- 49 comprobaciones principales en `test_roles.py`: casillas y campos accesibles, mostrar/ocultar clave, campos vacíos, credenciales incorrectas, pendiente bloqueada, administración, aprobación y desactivación, Pensum, Agenda (crear/editar/completar/eliminar), enlace desde Calendario, Inscripción, Horario, Notas, Docente, Asistencia, actualización de nota al estudiante, consola, 390 × 844 y preferencia de movimiento reducido.
- Prueba adicional de matrícula: selección de Álgebra, conflicto real con Desarrollo web, bloqueo de revisión, cambio a Grupo B, confirmación, cuatro bloques de horario y descarga del horario de demostración (`.txt`). Sin errores JavaScript.
- Seis comprobaciones de persistencia/rutas: aprobación de cuenta y agenda tras reapertura con `localStorage` simulado, restricciones de rutas de docente y anchos móviles de administrador/docente.
- Capturas visuales del acceso en 1440 × 900 y 390 × 844, tablero en ambos tamaños, pantallas de administración y docente.
- Grabación MP4 del acceso animado, tablero, Pensum, agenda, aprobación administrativa y asistencia docente.
- Archivos HTML completamente autocontenidos, sin dependencias CDN, bibliotecas externas ni solicitudes de red.

## Limitaciones y pruebas manuales pendientes

- Chromium en este entorno devuelve `net::ERR_BLOCKED_BY_ADMINISTRATOR` al navegar a archivos `file://` o servidores localhost. Para las pruebas automatizadas se cargó el documento con Playwright `page.set_content`, en `about:blank`, con una implementación en memoria de `localStorage`. No se afirma haber abierto `index.html` por doble clic en Windows.
- Verifica en **tu computador Windows**: doble clic en `index.html`; inicio de sesión de los tres roles; aprobación del estudiante `PENDIENTE`; actualización tras cerrar/reabrir el archivo; ausencia de bloqueos por políticas locales del navegador.
- Las restricciones de roles y claves ficticias solo se aplican en frontend, no son medidas de seguridad para un sistema real ni comparten cambios entre equipos.
- El video muestra los módulos principales de roles y no pretende ser una prueba exhaustiva de todos los movimientos gráficos.
