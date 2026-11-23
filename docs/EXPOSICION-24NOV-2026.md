# CRUZA 3 — Guía rápida de exposición · 24 de noviembre de 2026

## Qué mostrar (recorrido de 7 a 9 minutos)

**Inicio.** Presentar el acceso con piezas de crucigrama: escribir y borrar caracteres sin saltos visuales. Mostrar las dos herramientas (lápiz y crayón), cambiar a modo claro/oscuro y ampliar el texto A− / A / A+.

**Estudiante.** Entrar al tablero y usar **✦ Recorrido** en la cabecera; el botón navega por módulos reales. Mostrar el crucigrama y el pensum; pasar a Inscripción para explicar horarios, grupos y conflictos antes de confirmar. Mostrar Horario, Notas y simulación de promedio, Asistencia, Historial y Perfil. Señalar el panel inferior que explica controles al posicionar el mouse.

**Docente.** Explicar que el acceso es por rol. En el módulo Notas se selecciona un grupo, se registra una calificación de demostración con justificación; en Asistencia se marca presente/ausente en una fecha de prueba. No alterar calificaciones de personas reales.

**Administrador.** Enseñar usuarios, aprobación y desactivación, catálogo de grupos y asignaturas, recuperación de acceso y registro de auditoría. Los cambios de prueba deben hacerse en una base temporal para que la exposición sea repetible.

## Credenciales ficticias iniciales (solo si se usa la base de demostración limpia)

| Rol | Usuario | Contraseña |
|---|---|---|
| Estudiante | `ESTUDIANTE` | `CRUZA2026` |
| Docente | `DOCENTE` | `CLASE2026` |
| Administrador | `ADMIN` | `ADMIN2026` |

Estas credenciales están definidas en `app/db.py` y **solo se crean si la base está vacía y `CRUZA_DEMO_MODE=1`**. Si la base ya contiene registros, pueden existir claves diferentes. No usar estas claves en producción pública.

## Apertura confiable en Windows

1. Mantener una copia de `C:\Users\camac\Documents\CRUZA-PUBLICACION` con el repositorio oficial.
2. Antes de actualizar, terminar cualquier servidor anterior con **Ctrl+C**. Si el puerto 8765 está ocupado, el lanzador avisa; no mata procesos a ciegas.
3. Ejecutar `ACTUALIZAR-Y-ABRIR-CRUZA.bat` desde la carpeta del proyecto (o copiarlo desde GitHub cuando ya esté en `main`). El archivo crea un respaldo de cambios locales mediante Git stash, actualiza con avance rápido y llama al lanzador.
4. Abrir `http://127.0.0.1:8765/`. El servidor espera estar listo antes de abrir el navegador. Mantener la ventana de la terminal abierta.
5. Confirmar **CRUZA · EXPO 24.11** en la cabecera, los botones de tema, lápiz/crayón, A± y ✦ Recorrido.
6. Si ves la edición antigua, detener el servidor, sincronizar cambios, iniciar de nuevo y presionar **Ctrl+Shift+R** en el navegador.

La aplicación completa ejecuta **FastAPI + SQLite local**, no GitHub Pages. El enlace `127.0.0.1` solo sirve en el equipo donde esté iniciado el servidor.

## Si falla Internet

El servidor local funciona sin conexión a Internet si Python, dependencias y el entorno `.venv` ya están instalados. Antes de la exposición, iniciar el sistema una vez con conexión y dejar instaladas las dependencias. Si no hay internet al presentar, ejecutar `ABRIR-CRUZA.bat` directamente, sin intentar `git pull`.

Mantener disponible el [recorrido visual anterior](../VER-RECORRIDO.html) como respaldo **solo visual**. Aclarar que no sustituye la aplicación funcional.

## Evidencias y límites de verificación

- Repositorio: https://github.com/camachoab21-cmd/cruza
- CI: https://github.com/camachoab21-cmd/cruza/actions
- Pruebas: `pytest`, recorridos de navegador, roles y verificación móvil mediante GitHub Actions.
- **Pendiente de validar personalmente en el computador de exposición:** velocidad real, apertura local, permisos del sistema, existencia de los usuarios de prueba y tamaño de letra a resolución del proyector.
- El dominio .tk **no está contratado ni verificado**. La prioridad para mañana es que el sistema local funcione con seguridad y sin depender de Internet.

## Recomendaciones para la defensa

El problema que resuelve CRUZA es la dispersión de los procesos académicos. El crucigrama conecta las actividades con sus módulos; el lápiz/crayón refuerza la identidad gráfica; las pistas ayudan al usuario, y los tres roles controlan permisos sobre operaciones reales respaldadas por SQLite.

No prometas funciones inexistentes ni 60 FPS garantizados: muestra acciones reales que las pruebas hayan validado.
