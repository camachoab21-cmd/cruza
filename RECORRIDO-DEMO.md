# Recorrido guiado de CRUZA 3

Abre `VER-RECORRIDO.html` dentro del proyecto o reproduce `docs/CRUZA3-VISITA-GUIADA.mp4`.

El video dura 46,5 segundos y contiene subtítulos en español. Los capítulos cubren: acceso, tablero, pensum, inscripción, choque de horarios, cambio de grupo, horario confirmado, calendario, agenda, notas, modo noche, docente, asistencia, administración y aprobación.

La secuencia se creó con capturas reales del frontend ejecutado en Chromium, mientras las solicitudes llegaban al servidor FastAPI/SQLite por un puente de pruebas. En el computador final debe comprobarse también el navegador accediendo directamente al servidor.

## Demostración en vivo en Windows

1. Descomprime la entrega. Ejecuta `ABRIR-CRUZA.bat` y abre la página local cuando aparezca.
2. Como estudiante `ESTUDIANTE / CRUZA2026`, visita Pensum e Inscripción. Añade Álgebra lineal A (conflicto con Desarrollo web), cambia a B, confirma y comprueba Horario.
3. Crea un recordatorio en Mi agenda. Visita Calendario, Notas, Asistencia e Historial. Activa y desactiva el modo noche.
4. Cierra sesión. Como docente `DOCENTE / CLASE2026`, guarda una nota y una asistencia. Entra de nuevo como estudiante para verificarlas.
5. Como administrador `ADMIN / ADMIN2026`, crea una cuenta pendiente, demuestra que no puede entrar, apruébala y comprueba el acceso.

No utilices las credenciales de demo ni el servidor local como un sistema institucional de producción.
