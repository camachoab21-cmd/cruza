# CRUZA 3 · Campus académico interactivo

**Prototipo independiente y no oficial para presentación académica — datos ficticios.**

CRUZA transforma una experiencia de gestión académica en un crucigrama interactivo. El proyecto conserva **dos entregables distintos**:

1. **`index.html`**: versión visual autónoma anterior, para abrir sin instalación, con registros de demostración en el navegador. **No ofrece autenticación real**. Se conserva para la exposición y como respaldo.
2. **`app/`**: **versión con servidor, SQLite y validaciones reales**. Es la recomendada para probar seguridad y compartir cambios académicos entre sesiones del mismo servidor. Por defecto se ejecuta solo en este computador (`127.0.0.1`); habilitar otros dispositivos requiere configurar de forma expresa una red segura y controles adicionales.

## Abrir CRUZA y ver el recorrido (ruta más sencilla)

- **Ver el recorrido sin instalar nada:** abre `VER-RECORRIDO.html` en tu navegador, dentro de la carpeta descomprimida. Reproduce el video o elige los capítulos para saltar a cada pantalla. También está el MP4 `docs/CRUZA3-VISITA-GUIADA.mp4`.
- **Abrir la aplicación con servidor y datos compartidos:** haz doble clic en `ABRIR-CRUZA.bat`. Si es la primera vez, instalará sus dependencias; después iniciará el servidor y abrirá `http://127.0.0.1:8765`.
- **Versión visual sin instalación:** `index.html` conserva la demostración HTML autónoma anterior y funciona sin servidor, pero **sus controles de acceso no son seguridad real**.

La visita guiada fue elaborada con capturas de acciones ejecutadas en Chromium. El frontend original estuvo conectado a **la API HTTP real de FastAPI/SQLite mediante un puente de pruebas**, porque Chromium de este entorno bloqueó la navegación directa a `localhost`. La verificación visual directa en Windows sigue siendo necesaria.

## Instalación en Windows (una sola vez)

Se requiere **Python 3.10 o superior**. Descarga todos los archivos del proyecto o clona el repositorio. La instalación inicial de paquetes suele requerir internet; una vez instalados, la aplicación **no necesita internet** para operar en la red local.

1. Ejecuta `INSTALAR.bat` (crea `.venv` e instala las dependencias).
2. Ejecuta `INICIAR-CRUZA.bat`.
3. Abre `http://127.0.0.1:8765` en el mismo equipo.
4. Mantén abierta la ventana donde corre el servidor.

Desde PowerShell, alternativa equivalente:

```powershell
cd "C:\RUTA\DEL\PROYECTO\CRUZA-RELEASE-SEGURO"
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:CRUZA_DEMO_MODE='1'
$env:CRUZA_DB_PATH="$PWD\data\cruza.sqlite3"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8765
```

La base de datos se crea en `data/cruza.sqlite3` la primera vez y se conserva entre reinicios. No se publica en GitHub. Para reiniciar **solamente los datos ficticios**, detén el servidor y renombra el archivo `data/cruza.sqlite3` a `cruza-respaldo.sqlite3` antes de abrir de nuevo.

## Accesos ficticios (modo demostración)

| Perfil | Usuario | Clave |
|---|---|---|
| Estudiante | `ESTUDIANTE` | `CRUZA2026` |
| Docente | `DOCENTE` | `CLASE2026` |
| Administrador | `ADMIN` | `ADMIN2026` |
| Estudiante sin aprobar | `PENDIENTE` | `CRUZA2026` |

**No uses estas claves ni habilites `CRUZA_DEMO_MODE=1` en un sitio público.** El modo demostración crea los usuarios solo si la base de datos está vacía. Una base de datos ya existente no sobrescribe contraseñas ni trabajos previos.

Por seguridad, **el modo demo está desactivado por defecto**. Para iniciar una instalación sin datos de demostración, crea el administrador usando:

```powershell
$env:CRUZA_DEMO_MODE='0'
.\.venv\Scripts\python.exe -m app.cli init-admin --username ADMIN
```

Para recuperar un administrador bloqueado desde una consola del servidor, con acceso físico/administrativo, utiliza `python -m app.cli recover-admin --username ADMIN`. El proceso exige confirmación local, genera una contraseña aleatoria, invalida sesiones y registra la recuperación.

## Módulos y permisos

- **Estudiante:** tablero-crucigrama, pensum, inscripción con borrador y horarios comparados, horario vigente/CSV, calendario y entregas, agenda personal, notas por cortes y simulador, asistencia en lectura, historial y perfil.
- **Docente:** solo sus grupos y estudiantes asignados, notas por evaluación/corte y asistencia. Cada cambio queda registrado; una corrección de nota ya publicada exige motivo.
- **Administrador:** creación/aprobación/desactivación de estudiantes, solicitudes de recuperación, emisión de códigos temporales tras verificación de identidad, habilitación posterior al cambio de contraseña, materias y grupos, auditoría.

**Ningún estudiante puede registrarse por su cuenta.** Al cuarto fallo de una cuenta activa, se bloquea. El restablecimiento de contraseña no la desbloquea: primero hay recuperación y después autorización administrativa.

La recuperación es **asistida por Administración**: el usuario solicita recuperar, el administrador verifica identidad **fuera de la app** y entrega personalmente un código temporal de un solo uso (válido 30 minutos), el usuario restablece su clave y un administrador habilita la cuenta. No se afirma que se envíen correos: no hay proveedor de email.

## Cálculos y horarios

- Cada asignatura tiene un **número entero positivo de créditos**.
- Cada corte reúne dos evaluaciones de 50% (datos de ejemplo). Los cortes pesan 30% / 30% / 40% en la demo; son **suposiciones de la demostración**, no un esquema oficial de la UTS.
- No se convierte una nota pendiente en cero: se indica pendiente o provisional.
- `PAPI` se usa en la app para referirse al **promedio ponderado del período**; `PAPA`, al **acumulado**. Estas siglas se presentan como etiquetas de la demo; debe confirmarse su uso oficial con la institución.
- Las definitivas de materias y los créditos determinan las ponderaciones; en el acumulado se cuenta el **último intento** de una materia repetida, conforme al art. 80 del Reglamento Estudiantil UTS (Acuerdo 01-055 de 2021). **Verificar vigencia y eventual reglamento nuevo de 2026** antes de afirmar equivalencia oficial.
- Al agregar una asignatura se actualiza **solo el borrador**. La matrícula vigente cambia al **confirmar**, previa validación en el servidor de conflictos, cupos, duplicados y límite simulado de 18 créditos. Un horario 08–10 seguido de uno 10–12 **no es conflicto**.

Referencia institucional histórica: https://www.uts.edu.co/sitio/wp-content/uploads/normatividad/reglamento_estudiantil.pdf (arts. 79 y 80). Normatividad para vigencia: https://www.uts.edu.co/normatividad/

## Diseño

- Modo marfil luminoso y modo noche, selección recordada localmente.
- Login con casillas animadas de crucigrama y contraseña oculta; sin inputs separados por carácter.
- Crucigrama de navegación con intersecciones, tarjetas con reflejo, polvo en el tablero y tinta sobre fondos libres.
- Cursor creativo (pincel/lápiz): cambiar con el botón de la cabecera o dibujar un triángulo en fondo libre con el ratón; sin interceptar los controles.
- Barra de pistas contextuales, teclado y opción de movimiento reducido.

## Pruebas

```powershell
.\.venv\Scripts\python.exe -m pip install pytest playwright httpx
$env:CRUZA_DEMO_MODE='1'
.\.venv\Scripts\python.exe -m pytest -q
```

Se ejecutaron **19 pruebas automáticas de API y lógica**, un recorrido de integración Chromium/frontend con **26 solicitudes procesadas por el servidor HTTP real** y pruebas adicionales de acceso, matrícula, docente, administración y móvil. También existen **4 recorridos visuales aislados** históricos. La grabación nueva `docs/CRUZA3-RECORRIDO-VISUAL.mp4` muestra la interfaz de CRUZA 3 con transporte simulado; la anterior permanece bajo `docs/DEMOSTRACION-ANTERIOR.mp4`.

En `tests/ui_smoke.py` hay una prueba visual aislada en Chromium (con datos auténticos de la API y transporte simulado **por las restricciones de localhost del entorno de desarrollo**). **No sustituye** probar la web real en Chromium en tu PC; prueba el recorrido completo en `http://127.0.0.1:8765` antes de la exposición.

## Publicación y colaboración

El proyecto está preparado para el repositorio https://github.com/camachoab21-cmd/cruza. `PUBLICAR-GITHUB.ps1` verifica la URL del remoto, protege los archivos existentes, muestra los cambios y hace `push` solo al recibir `PUBLICAR`. El script **no invita colaboradores automáticamente**. Invita a `ISFRANT` desde `Settings → Collaborators → Add people`, elige **Write** para lectura y edición, y espera la aceptación de su invitación.

No guardes contraseñas, `.env` o `data/` en el repositorio. El HTML autónomo y el servidor local cumplen propósitos distintos; publicar en GitHub Pages solo publica el HTML estático, **no** el backend de FastAPI ni SQLite.

Continúa el desarrollo utilizando `CONTINUIDAD.md` y los requisitos de `REGLAS_NEGOCIO.md`.

## Mejoras y evidencias de esta entrega

- El login admite claves de hasta 128 caracteres; las casillas representan una ventana visual de los caracteres escritos sin truncar el valor real.
- La validación rechaza créditos no enteros en lugar de convertir `2.5` silenciosamente en `2`.
- `tests/e2e_navegador_servidor.py` reproduce un flujo con Chromium y servidor HTTP en una base de datos temporal, sin tocar los datos personales. Instala Playwright para ejecutarlo: `pip install playwright` y `playwright install chromium`.
- `VERIFICACION.md` identifica pruebas, resultados y límites.
- Se entregan `VER-RECORRIDO.html` y la visita guiada MP4 con capítulos.

**No se ha publicado esta entrega en GitHub:** la cuenta GitHub conectada a este chat tiene permiso de lectura, no de escritura. Para invitar a `ISFRANT` también es necesaria una sesión del propietario con privilegios de administración del repositorio.
