# CRUZA · Presentación del 24 de noviembre

Haz doble clic en **PRESENTAR.bat**. Esta copia tiene las dependencias instaladas y abre **http://127.0.0.1:8765/**. No abras el index.html para mostrar operaciones académicas: ese archivo es una vista pública estática.

| Rol | Usuario | Clave ficticia |
|---|---|---|
| Estudiante | ESTUDIANTE | CRUZA2026 |
| Docente | DOCENTE | CLASE2026 |
| Administrador | ADMIN | ADMIN2026 |

## Recorrido de cinco minutos

1. Entra como estudiante. Muestra el crucigrama, el control de letra y el pensum.
2. Abre Matrícula. Agrega Álgebra lineal en grupo A: se cruza con Desarrollo web. Cambia Álgebra al grupo B y confirma. El horario debe mostrarla el viernes de 12:00 a 14:00.
3. Abre Notas. Cambia una nota del simulador: los registros originales permanecen intactos.
4. Abre Mi agenda y crea un compromiso con título y fecha. Muestra Calendario e Historial.
5. Cierra sesión. Entra como DOCENTE para mostrar sus grupos y el registro de notas/asistencia. Si corriges una nota publicada, escribe el motivo.
6. Cierra sesión. Entra como ADMIN para mostrar estudiantes, aprobaciones y auditoría.

La API y SQLite funcionan localmente sin internet. El crucigrama público también se comprobó tras desconectar y recargar. Ninguno de estos datos es oficial de UTS.

## Versión utilizada

Repositorio: https://github.com/camachoab21-cmd/cruza

Rama: codex/cruza-expo-24nov · commit ea1a91fec516fc74beca85515842be1c0979ba47.

La mejora de anoche está en el PR #11, todavía abierto. Esta instalación usa esa mejora directamente; no depende de que se integre en main. Tu instalación anterior en Documents/CRUZA-PUBLICACION se conservó.

## Verificación realizada hoy en este PC

- 20 pruebas de API y reglas académicas aprobadas con pytest.
- Navegación por 16 módulos según rol en 1440 y 390 px: 32 vistas, sin desbordamiento horizontal de la página.
- Chromium contra FastAPI/SQLite reales: acceso, cruce de horarios, bloqueo de confirmación, cambio de grupo, matrícula y horario confirmado; agenda guardada; nota docente guardada; alta/aprobación de estudiante y acceso de la cuenta aprobada.
- Simulador sin modificar los datos de notas; menú móvil y Escape; tamaño de letra conservado tras recargar; tres salidas adicionales con sesión invalidada.
- Crucigrama público resuelto sin conexión tras recargar.
- Sin errores JavaScript no capturados ni respuestas HTTP 5xx en el recorrido observado.
- Capturas reales y detalle en docs/auditoria/revision-24nov.json. Se revisaron visualmente capturas de escritorio y móvil.

No se afirma una prueba individual de cada botón ni una auditoría exhaustiva de accesibilidad o rendimiento. El despliegue público completo y la integración del PR siguen pendientes; no hacen falta para esta exposición local. La CI de la rama principal falló, mientras que las dos ejecuciones más recientes de la rama de exposición aprobaron.

Las modificaciones académicas del recorrido de prueba se conservaron aparte; el servidor de exposición se inicia con datos ficticios limpios.
