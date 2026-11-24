# CRUZA 3 — entrega para el compañero (23 de noviembre de 2026)

**Repositorio oficial:** https://github.com/camachoab21-cmd/cruza  
**Rama estable:** `main`  
**Último cambio identificado en `main`:** `2525573f` (autor: Isfrant; cambios visuales y de reglas académicas). **Última base con CI integral aprobada:** `173c639c` (PR #7). El commit nuevo todavía requiere revisión y pruebas.  
**Exposición:** 24 de noviembre de 2026.  
**Colaborador `ISFRANT`:** permiso `write` verificado en GitHub el 23 de noviembre.

> La versión que hay que continuar es la aplicación funcional **FastAPI + SQLite**, no `index.html` de GitHub Pages. No modificar la base real ni sustituir los módulos por capturas o tarjetas simuladas.

## 1. Qué está realmente subido

| Elemento | Ubicación | Estado |
|---|---|---|
| Backend y autenticación | `app/main.py`, `app/db.py`, `app/logic.py`, `app/cli.py` | En `main` |
| Frontend completo y diseños | `app/templates/index.html`, `app/static/` | En `main` |
| Arranque de Windows | `ABRIR-CRUZA.bat`, `INICIAR-CRUZA.bat`, `INSTALAR.bat` | En `main` |
| Actualizador con respaldo Git | `ACTUALIZAR-Y-ABRIR-CRUZA.bat` | En `main` |
| Suite de pruebas | `tests/`, `.github/workflows/tests.yml` | En `main` |
| Generador del paquete ZIP | `scripts/build_expo_package.py` | En `main` |
| Guía de exposición | `docs/EXPOSICION-24NOV-2026.md` | En `main` |
| Evidencia visual | Artefacto del workflow y capturas históricas en `docs/capturas/` | En GitHub/Actions |
| Configuración futura de hosting | `render.yaml`, `docs/DOMINIO-TK-DESPLIEGUE.md` | Preparada, NO desplegada |

**Pruebas de la base anterior (`173c639c`), NO del commit nuevo `2525573f`:** [GitHub Actions — ejecución #78](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201) (21 pasos, 0 fallos). Incluye tests Python, API/roles, SQLite aislado, Playwright, pantallas responsive, lápiz/crayón y verificación del paquete ZIP.

**Descargas desde GitHub Actions:**

- [Paquete completo Windows — CRUZA3-EXPOSICION-24NOV](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201/artifacts/14858527019), ZIP dentro del artefacto. GitHub lo conserva hasta el **7 de diciembre de 2026** (puede requerir iniciar sesión).
- [Auditoría visual — pantallas de estudiante, docente y administrador](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201/artifacts/14859420570), vigente hasta el **21 de febrero de 2027**, según la fecha de expiración informada por GitHub.

**Cambio concurrente que no se debe sobrescribir:** Isfrant publicó el commit [`2525573f`](https://github.com/camachoab21-cmd/cruza/commit/2525573f4b10ba9ba637b7584783532efa78dd62), modificando notas/evaluaciones (60/30/10), cortes (33/33/34), trazos, interfaz, matrícula y exportación de horario. **No dar esas ponderaciones por oficiales sin verificar requisitos y pruebas.** Se detectó además una intermitencia del logout en CI, documentada en [Issue #10](https://github.com/camachoab21-cmd/cruza/issues/10); el backend devuelve HTTP 200 y la sesión se invalida, pero en Chromium el formulario no reaparece algunas veces. La causa aún no está resuelta.

**Importante:** la carpeta local `C:\Users\camac\Documents\CRUZA-PUBLICACION` NO se sincroniza automáticamente. Los cambios que solo estén en ese Windows y no se hayan confirmado/subido a GitHub no pueden verificarse desde este repositorio. Antes de fusionarlos, comparar por archivo y guardar respaldos.

## 2. Clonar y abrir sin usar los datos de otra persona

En PowerShell de Windows, fuera de la carpeta existente del propietario:

```powershell
git clone https://github.com/camachoab21-cmd/cruza.git
cd cruza
.\ABRIR-CRUZA.bat
```

Requiere Python 3.10+ y conexión a internet la primera vez para instalar dependencias. El archivo de arranque inicia `http://127.0.0.1:8765/` cuando FastAPI responde; mantener abierta la consola. Si el puerto está ocupado, cerrar el servidor antiguo con Ctrl+C.

Para la demo local con una base SQLite nueva, los usuarios ficticios documentados son:

| Rol | Usuario | Clave ficticia |
|---|---|---|
| Estudiante | `ESTUDIANTE` | `CRUZA2026` |
| Docente | `DOCENTE` | `CLASE2026` |
| Administrador | `ADMIN` | `ADMIN2026` |

Se crean en una **base nueva** con `CRUZA_DEMO_MODE=1`; no se deben usar en un servidor público. Si ya hay una base, sus claves podrían ser diferentes.

## 3. Qué puede adelantar el compañero

Priorizar cambios pequeños que se puedan probar y revertir antes de la exposición:

- [ ] Probar en Windows la aplicación real, en el puerto 8765, y anotar cualquier error de consola/navegador.
- [ ] Revisar visualmente login, tablero, pensum, inscripción, horario, calendario, agenda, notas, asistencia, historial y perfil; comprobar claro/oscuro.
- [ ] Entrar como docente y administrador y probar sus pantallas usando solo datos ficticios.
- [ ] Verificar A− / A / A+, ayuda inferior, lápiz/crayón, recorrido guiado y tamaño móvil.
- [ ] Si se encuentra un fallo, documentar pasos para reproducirlo, captura y consola; arreglarlo en una rama propia y pasar pruebas.
- [ ] Mantener como tarea separada cualquier futuro despliegue de FastAPI con HTTPS/SQLite persistente. **No afirmar que el dominio .tk ya funciona.**

**No es necesario rediseñar desde cero**: la edición Expo 24.11 tiene una base probada; verificar primero el nuevo commit `2525573f`, y no volver a cambiar pesos de notas sin consenso del equipo.

## 4. Cómo colaborar sin pisar avances

1. Crear una rama desde el `main` actualizado: `git checkout main; git pull --ff-only; git switch -c mejora/nombre-de-la-tarea`.
2. Cambiar archivos concretos y verificar el comportamiento, sin tocar `data/` ni `.venv/`.
3. Ejecutar pruebas locales (con modo demo y DB aislada) o confirmar los checks en el PR.
4. Hacer `git add <archivos>`, `git commit -m "..." ` y `git push -u origin <rama>`.
5. Crear un Pull Request hacia `main`. **No fusionar** si GitHub Actions falla ni si la modificación pone en riesgo la exposición.

Pruebas rápidas:

```powershell
$env:CRUZA_DEMO_MODE="1"
py -3 -m pip install -r requirements.txt pytest httpx playwright
py -3 -m pytest -q
py -3 -m playwright install chromium
py -3 tests/ui_ux_audit.py
```

Para pruebas de persistencia o creación/borrado, usar base de datos temporal. No usar la BD del compañero ni la del equipo de exposición.

## 5. Diferencias que es importante no confundir

- **GitHub Pages:** vista ilustrativa estática (`index.html`), no contiene autenticación real.
- **Versión académica completa:** `app/main.py` + SQLite y vistas `app/templates/index.html`; se sirve desde FastAPI en localhost.
- **Work/Codex:** puede revisar los archivos locales solamente si el usuario habilita expresamente el acceso al equipo; no es necesario para editar lo que ya está publicado en GitHub.
- **Servidor público/.tk:** pendiente. Su contratación/configuración no es requisito para probar la app en localhost ni está confirmado.

## 6. Entrega y pendientes honestos

El repositorio contiene los avances disponibles en GitHub al 23 de noviembre. Se conservaron respaldos de versiones anteriores y un paquete de exposición reproducible. Lo pendiente de comprobar con acceso al equipo del propietario es **comparar cambios que solo existan localmente, instalar/iniciar, verificar rendimiento real y hacer una prueba final con el navegador/proyector**. No asumir que esas pruebas ya ocurrieron.

Documentación técnica adicional: [README](../README.md), [Reglas de negocio](../REGLAS_NEGOCIO.md), [Continuidad](../CONTINUIDAD.md), [Guía de exposición](EXPOSICION-24NOV-2026.md) y [Arquitectura](../ARQUITECTURA.md).
