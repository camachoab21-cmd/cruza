# Verificación reproducible de CRUZA 3

Fecha de revisión: 11 de noviembre de 2026.

## Resultado de ejecución comprobado

- `PYTHONPATH=. CRUZA_DEMO_MODE=1 pytest -q` — **19 pruebas pasadas** (cálculos, seguridad, bloqueo, recuperación, tres perfiles, matrícula, notas, asistencia y agenda).
- `node --check app/static/app.js` y `python -m py_compile app/*.py` — sintaxis revisada.
- `python tests/ui_smoke.py` — **4 recorridos visuales aislados** completados: estudiante escritorio (1440×900), docente escritorio, administrador escritorio y estudiante móvil (390×844). Sin errores JS capturados ni scroll horizontal extra en las pantallas visitadas.
- Se generaron capturas en `docs/capturas/CRUZA3-*`. La grabación `docs/CRUZA3-RECORRIDO-VISUAL.mp4` corresponde a CRUZA 3 y demuestra la interfaz mediante transporte simulado; **no demuestra la conexión navegador-servidor real**. La grabación `docs/DEMOSTRACION-ANTERIOR.mp4` corresponde a la versión HTML anterior y se conserva como respaldo.

## Limitación de pruebas visuales

En este entorno, Chromium bloqueó navegar a `http://127.0.0.1:8765` y a archivos `file://` con `ERR_BLOCKED_BY_ADMINISTRATOR`. Para capturas, Playwright cargó el CSS/JS real con `set_content()` y simuló el transporte, utilizando respuestas extraídas de la API real mediante `TestClient`. Esto **NO** equivale a probar la navegación HTTP real del navegador: exige comprobación adicional en Windows con el servidor arrancado.

## Pruebas manuales pendientes en Windows

- Login con los tres perfiles y logout, asegurando que el navegador recibe cookies `HttpOnly` y token CSRF.
- Bloqueo y recuperación en una sesión de navegador real, incluyendo bloqueo al cuarto fallo.
- Corrección de nota publicada con motivo y su actualización desde otro navegador.
- Inscripción desde la UI, elección de grupo B y confirmación; exportación CSV.
- Respuesta del canvas de polvo y trazo de pincel, triángulo y cambio de herramienta.
- Pruebas con zoom 200%, navegación con teclado, movimiento reducido y tamaños tablet.
- Verificación de despliegue remoto si alguna vez se configura.

## GitHub y colaboración

El repositorio `camachoab21-cmd/cruza` mostraba al revisarlo únicamente un README de 7 bytes y un `index.html` de ~35 KB; último commit observado `ab240b92b49fd048e025af01c942859b28f2b202`. La conexión GitHub disponible tenía usuario `EdwingStivenMejiaSaenz-Campus` y permiso de **lectura, no escritura**. Por tanto, **estos nuevos archivos NO están publicados todavía**.

Tampoco se pudo comprobar ni emitir una invitación a `ISFRANT` porque los permisos de administración GitHub no estaban disponibles. Es un paso pendiente.

## No se afirma

- Que el backend sea seguro para producción o cumpla auditorías externas.
- Que el navegador real de Windows haya pasado todas las pruebas.
- Que GitHub ya esté actualizado o GitHub Pages publique el servidor.
- Que exista servicio de email para la recuperación.


## Actualización final — ejecución adicional

- `PYTHONPATH=. CRUZA_DEMO_MODE=1 pytest -q`: **19/19 tests aprobados**. Nueva prueba: rechaza créditos fraccionarios, flotantes y booleanos.
- `python tests/e2e_navegador_servidor.py`: **APROBADO**, 26 solicitudes reales procesadas por FastAPI/SQLite desde Chromium mediante puente de transporte; 0 errores JavaScript y 0 respuestas HTTP 5xx. La prueba incluye login de 3 perfiles, matrícula con conflicto, cambio de grupo, confirmación, agenda, nota, alta y aprobación administrativa y contraseña larga.
- Recorridos manuales automatizados adicionales: estudiante con 10 secciones, guardado de notas y asistencia y visualización desde estudiante; alta de estudiante pendiente, rechazo de acceso y aprobación; móvil 390×844 sin desbordamiento horizontal, menú con Escape y pantalla Inscripción.
- `node --check app/static/app.js` y `python -m py_compile app/*.py`: **sin errores de sintaxis**.
- `docs/CRUZA3-VISITA-GUIADA.mp4`: **46,5 segundos**, incluye 17 capturas estables de recorridos ejecutados y explicaciones en español. `VER-RECORRIDO.html` permite seleccionar capítulos sin conexión.

**Distinción importante:** el navegador controlado no pudo navegar directamente a `http://127.0.0.1` por una restricción del entorno. La integración usa el frontend real y una API HTTP real a través de un puente Python para las llamadas `fetch`, por lo que aún falta la prueba de acceso nativo en el equipo Windows del usuario. La visita guiada es una secuencia de capturas verificadas, no una grabación de clics en tiempo real.

**GitHub sigue pendiente:** ninguna publicación ni invitación a `ISFRANT` fue confirmada con permiso de escritura.
