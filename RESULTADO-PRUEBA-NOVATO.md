# CRUZA · Resultado de la prueba de usuario

## Qué se corrigió

- Una intersección del crucigrama abría Matrícula u Horario pero dejaba el selector encima. Ahora se cierra al elegir una ruta; su botón dice «MATRÍCULA».
- Las clases del horario confirmado ahora abren una ficha con grupo, docente, aula, horarios y créditos. Se probó la apertura con Enter, el cierre con Escape y la devolución del foco.
- Se corrigió la presentación de «Mié» y «Sáb» en los selectores de grupos y administración, sin cambiar las claves internas de horarios.

## Recorrido visible

En una pestaña visible con una base ficticia separada se revisaron las credenciales de demostración, el acceso, la intersección, el conflicto de Álgebra y Desarrollo web, la selección del grupo B, la confirmación y los datos de la clase confirmada.

## Pruebas complementarias en este equipo

- Auditoría de acciones sobre FastAPI y SQLite aislados: 96 interacciones y 69 solicitudes, sin errores JavaScript ni HTTP 5xx; proceso finalizado con código 0. Incluye filtros, matrícula, agenda, simulador, docente, administración y recuperación sobre datos ficticios.
- Auditoría de 82 vistas de los tres roles y varios tamaños: código 0; la revisión automatizada no señaló desbordamiento, controles sin nombre ni errores JavaScript en esos estados.
- 20 pruebas de API y reglas académicas: aprobadas en modo demo con base temporal. Una ejecución inicial sin activar el modo demo falló; se corrigió la configuración de la prueba y se repitió.
- Regresiones específicas de las dos rutas de la intersección y de la ficha de horario: aprobadas.
- El inventario de las 96 acciones está en `INVENTARIO-PRUEBA-USUARIO.md`; los resultados y capturas están en `docs/auditoria/`.

## Límites y pendientes

- No se probaron individualmente todos los botones repetidos ni todas las combinaciones posibles. La lista de 96 acciones es el alcance ejecutado; no debe interpretarse como cobertura total.
- La anomalía anterior al redimensionar de escritorio a móvil tras mover el cursor aún no se ha diagnosticado de forma concluyente. La auditoría de vistas desde tamaños establecidos no la reprodujo.
- La impresión física y la accesibilidad con lectores de pantalla concretos no se verificaron. Tampoco se realizó una medición exhaustiva de todos los contrastes o revisión profesional de estilo.
- Las notas iniciales del período están pendientes: para demostrar una nota real, regístrala con el usuario docente o presenta el simulador como hipotético.
- Los cambios son locales y no están publicados en GitHub. GitHub Pages sigue siendo una vista estática.

## Recomendación para exponer

Sí recomiendo el recorrido ensayado: estudiante → crucigrama → matrícula con conflicto → grupo B → horario y ficha → simulador → agenda. Si hay tiempo, muestra el acceso docente con una nota ficticia. Indica que es un proyecto conceptual independiente con datos de demostración y evita afirmar cobertura total o equivalencia con reglas oficiales de la UTS.

Abre http://127.0.0.1:8765/ y recarga con Ctrl+Shift+R. Si el servidor está apagado, ejecuta `PRESENTAR.bat`.
