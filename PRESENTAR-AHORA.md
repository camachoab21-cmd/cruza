# CRUZA 3 — PRESENTAR AHORA

> **Demostración académica no oficial.** Los estudiantes, las materias, las notas y las contraseñas de ejemplo son ficticios. Se recomienda presentar desde un computador con Python 3.10+.

## Opción A — Mostrar la aplicación funcional con servidor y base de datos

1. En Windows, abre **PowerShell**. Si ya está ejecutándose el servidor anterior, detenlo en su consola con **Ctrl+C**.
2. Copia este bloque (no elimina archivos, no modifica ramas y no toca la base de datos):

```powershell
$proyecto = "$env:USERPROFILE\Documents\CRUZA-PUBLICACION"
git -C $proyecto pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw "No fue posible sincronizar. Se conservaron los archivos locales." }
& "$proyecto\ABRIR-CRUZA.bat"
```

3. Abre en **ese mismo computador**: **http://127.0.0.1:8765/**. Mantén abierta la consola del servidor.
4. No te confundas con `C:\Users\camac\Documents\ChatGPT\Dev\cruza`: puede contener una rama anterior y archivos locales pendientes. Para la exposición usa **`CRUZA-PUBLICACION`**, que corresponde a la rama `main` verificada.

Si todavía no existe una carpeta clonada, descarga el ZIP del repositorio desde GitHub y extrae su contenido en una carpeta nueva; ejecuta allí `ABRIR-CRUZA.bat`. La primera instalación requiere Python y conexión a internet para dependencias.

### Cuentas de demostración

| Rol | Usuario | Clave |
|---|---|---|
| Estudiante | `ESTUDIANTE` | `CRUZA2026` |
| Docente | `DOCENTE` | `CLASE2026` |
| Administrador | `ADMIN` | `ADMIN2026` |
| Pendiente (no inicia sesión antes de aprobación) | `PENDIENTE` | `CRUZA2026` |

El inicio `INICIAR-CRUZA.bat` habilita **solamente en local** el modo demo (`CRUZA_DEMO_MODE=1`). Los datos se crean en `data/cruza.sqlite3` cuando la base está vacía. **No uses cuentas de demostración en un servidor expuesto al público**.

**No intentes cuatro claves erróneas con las cuentas principales durante una presentación:** al cuarto fallo se bloquean hasta completar el proceso de recuperación y habilitación. Si ya modificaste estas cuentas en una base existente, los valores del cuadro pueden haber cambiado.

## Guion sugerido de 5 minutos

1. **Inicio (30 s):** crucigrama de acceso, identidad visual y tema día/noche.
2. **Estudiante (90 s):** Tablero → Pensum → Inscripción. Añade una materia con cruce de horario, muestra por qué no se puede confirmar, cambia al grupo compatible y confirma. Muestra el horario y los créditos enteros.
3. **Docente (60 s):** entra como `DOCENTE`, selecciona grupo, guarda una nota y una asistencia.
4. **Estudiante (40 s):** vuelve a entrar y enseña que los datos guardados aparecen en sus notas.
5. **Administrador (60 s):** muestra alta de estudiante pendiente, aprobación, auditoría y control de acceso por rol.
6. **Detalles (20 s):** barra de pistas, cursor pincel/lápiz y comportamiento responsive.

La interfaz usa una **API real con SQLite**, cookies HTTP-only, comprobaciones de permisos y protección CSRF. Las ponderaciones y reglas académicas son datos de ejemplo; no afirmar equivalencia normativa oficial de UTS.

## Opción B — Plan de emergencia sin servidor

En el repositorio, abre el archivo **`index.html`** descargado: es el prototipo visual autónomo anterior. Sirve para enseñar diseño y navegación; **no proporciona autenticación real, base de datos ni verificación del servidor**.

Otra alternativa aún más segura para la exposición es abrir **`VER-RECORRIDO.html`** desde la carpeta descargada. Reproduce el video incluido en **`docs/CRUZA3-VISITA-GUIADA.mp4`** (46,5 s) y permite saltar entre capítulos. La grabación está compuesta por capturas verificadas de recorridos, no es un video continuo de clics.

## Evidencias publicadas en este GitHub

- [Acceso](docs/capturas/login.jpg)
- [Tablero estudiante](docs/capturas/estudiante.jpg)
- [Conflicto de matrícula](docs/capturas/conflicto-matricula.jpg)
- [Administración](docs/capturas/administrador.jpg)
- [Video del recorrido](docs/CRUZA3-VISITA-GUIADA.mp4)
- [Pruebas y límites](VERIFICACION.md)

## Solución rápida de incidentes

- **Pantalla de error antiguo:** detén el servidor con Ctrl+C, ejecuta el `git pull --ff-only` anterior y vuelve a iniciar.
- **Puerto 8765 ocupado:** existe otra instancia de la app; cierra la consola anterior y vuelve a iniciar. No abras dos servidores a la vez.
- **Python no aparece en PATH:** comprueba `py -3 --version`; cierra y abre de nuevo PowerShell después de instalar. Si `.venv` ya existe, la app normalmente puede utilizarlo sin encontrar el comando `python` global.
- **Página abre antes de que arranque el servidor:** espera a ver `Uvicorn running` y actualiza con F5.
- **No recuerdas la clave:** no borres `data/`; se conserva la base SQLite y hay un procedimiento administrativo de recuperación en `README.md`.
- **Modo demo ausente:** revisa que ejecutes `ABRIR-CRUZA.bat` y no un `uvicorn` manual sin `CRUZA_DEMO_MODE=1`.
- **El profesor necesita ver GitHub:** abre <https://github.com/camachoab21-cmd/cruza>. Fidel (`ISFRANT`) tiene permiso de escritura verificado.

**GitHub Pages**, cuando esté disponible, únicamente puede publicar el archivo HTML visual; **no aloja FastAPI/SQLite**. El enlace público de la aplicación completa no está desplegado ni verificado.

## Pruebas realizadas

En un entorno de pruebas separado: **20 pruebas automatizadas aprobadas**; recorrido Chromium/JavaScript contra FastAPI/SQLite mediante puente HTTP (**26 peticiones sin errores JS ni HTTP 5xx**). GitHub Actions también ha completado pruebas correctamente. **Queda pendiente confirmar acceso directo del navegador y funcionamiento visual en Windows** antes de afirmar que esa instalación está verificada.
