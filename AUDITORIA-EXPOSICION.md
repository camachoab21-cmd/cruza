# Auditoría de CRUZA · 24 de noviembre

## Resultado

La aplicación local permite ensayar el recorrido de presentación. La auditoría no demuestra que cada botón, texto, color y combinación de estados esté libre de errores: conserva los límites que siguen.

## Corregido en esta copia

- Tablero: «1 pendiente» en singular. La primera materia ya no se identifica falsamente como «próxima clase»; ahora dice «Materia inscrita».
- Calendario y horario: abreviaturas Mié y Sáb donde aparecen los encabezados. La fecha seleccionada del calendario se muestra en español.
- Simulador: la escala está identificada como parte de la demostración y no se presenta como normativa oficial.
- Matrícula: tarjetas con acentos de color en ambos temas, brillo al pasar el cursor por las casillas de horario y respuesta visual de botones y tarjetas. El brillo animado se desactiva con movimiento reducido.
- Copia del JavaScript anterior: `.local/app-antes-auditoria-24nov.js`.

## Ejecutado

- 20 pruebas Python de API y reglas académicas: aprobadas.
- Chromium con servidor y SQLite aislados: recorrido de estudiante, docente y administrador, con 29 solicitudes y sin errores JavaScript ni respuestas 5xx. Las acciones llegaron al final; el proceso de prueba terminó con error al intentar borrar la base temporal porque quedó bloqueada en Windows.
- Auditoría de acciones y formularios: 96 interacciones y 69 solicitudes; sin errores JavaScript ni respuestas 5xx en el recorrido. El proceso terminó con el mismo error de limpieza temporal.
- Auditoría de 82 vistas en diferentes tamaños y temas: no reportó errores de JavaScript, etiquetas ausentes ni desbordamiento horizontal en sus comprobaciones. Terminó con el mismo error de limpieza temporal.
- Prueba nueva de textos y prueba de brillo en Chromium: aprobadas. Se verificaron tema claro/oscuro, escritorio/móvil con recarga y preferencia de movimiento reducido. Se revisaron capturas de esas vistas.

## Límites y pendientes

1. Se observó un desbordamiento horizontal cuando la prueba cambia de una ventana de escritorio a móvil tras pasar el cursor por el horario. Al recargar a tamaño móvil la prueba no lo detectó. La causa aún no está confirmada; no se debe afirmar que quedó corregido.
2. Los bloques del horario muestran materia, grupo y aula, pero actualmente no abren una ficha detallada al pulsarlos. El usuario había solicitado esa interacción.
3. Las notas iniciales del período aparecen pendientes. Para enseñar un cambio real en Notas, regístralo primero desde la cuenta docente, o usa el simulador explicando que es hipotético.
4. La rama de exposición está en el PR #11 y estos últimos retoques son locales; el sitio de GitHub Pages es una vista estática, no la aplicación de servidor.
5. No se hizo una revisión lingüística por un corrector profesional, una medición exhaustiva de contraste, ni una prueba manual de absolutamente todas las combinaciones o dispositivos.
6. Las herramientas de auditoría dejan procesos o archivos temporales bloqueados en Windows en este entorno. Es un problema observado al finalizar las pruebas; debe diagnosticarse sin alterar la base de exposición.

Para presentar, abre http://127.0.0.1:8765/ o ejecuta `PRESENTAR.bat` y actualiza la página con Ctrl+Shift+R. Lee también `ENSAYAR-AHORA.md`.
