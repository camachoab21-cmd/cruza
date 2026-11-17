# Continuidad del proyecto CRUZA 3

**Última actualización:** 17 de noviembre de 2026.  
**Cuenta propietaria verificada:** `camachoab21-cmd`.  
**Repositorio y rama:** <https://github.com/camachoab21-cmd/cruza>, `main`.  
**Colaborador:** `ISFRANT`, permiso `write` confirmado.  
**Guía de exposición:** [PRESENTAR-AHORA.md](PRESENTAR-AHORA.md).

## Estado funcional verificado

CRUZA 3 es un proyecto universitario independiente de gestión académica con interfaz temática de crucigrama y tres roles (estudiante, docente y administrador). Se conserva una demostración HTML antigua independiente, pero **la aplicación con validaciones reales** requiere FastAPI y SQLite.

- **Frontend:** `app/templates/index.html`, `app/static/app.css`, `app/static/app.js`, `app/static/favicon.svg`. Incluye acceso crucigrama, diseño responsive, modo día/noche, pistas y cursor pincel/lápiz.
- **Backend:** `app/main.py` (login, permisos por rol y registro, sesiones HTTP-only, CSRF, recuperación, horarios, matrícula, notas, agenda, administración).
- **Datos:** `app/db.py` (SQLite, semilla ficticia en modo demo, PBKDF2, transacciones y auditoría).
- **Lógica:** `app/logic.py` (créditos enteros, cruces de horario, ponderaciones, PAPA/PAPI de demostración).
- **Arranque Windows:** `ABRIR-CRUZA.bat`, `INSTALAR.bat`, `INICIAR-CRUZA.bat`. Puerto local `8765`. Al ejecutar `INICIAR-CRUZA.bat` se activa `CRUZA_DEMO_MODE=1` con la base de datos local `data/cruza.sqlite3`.
- **Modo demo:** usuarios `ESTUDIANTE / CRUZA2026`, `DOCENTE / CLASE2026`, `ADMIN / ADMIN2026`, `PENDIENTE / CRUZA2026`. Solo para datos ficticios en uso local. No habilitar demo en producción.
- **Respaldo:** `index.html` autónomo y `respaldo/`, conservados sin sobrescribir las versiones anteriores.

## Comprobaciones ejecutadas

1. **20 pruebas de API y lógica** aprobadas, en un entorno Python aislado, con FastAPI TestClient.
2. **Chromium con la interfaz real** y servidor HTTP FastAPI/SQLite a través de un puente Python: 26 peticiones procesadas; sin errores JavaScript ni HTTP 5xx. Incluye estudiante, matrícula con conflicto, cambio de grupo, agenda, docente, administrador y aprobación de cuenta.
3. Recursos `/`, `/favicon.ico`, `/static/favicon.svg`, `/static/app.js`, `/static/app.css` y `/api/session` respondieron HTTP 200 en TestClient.
4. **GitHub Actions**: workflow `.github/workflows/tests.yml` creado y ejecutado correctamente en GitHub en los commits observados. Consultar el resultado del último commit en `Actions`.
5. **Capturas publicadas:** `docs/capturas/login.jpg`, `estudiante.jpg`, `conflicto-matricula.jpg`, `administrador.jpg`. **Video publicado:** `docs/CRUZA3-VISITA-GUIADA.mp4` (46,5 segundos, versión compacta). `VER-RECORRIDO.html` permite navegar capítulos.

**Límite importante:** el Chromium del entorno de pruebas bloquea abrir `localhost` directamente; la prueba de interfaz envía las llamadas de red al backend real mediante un puente. Se debe confirmar el arranque y navegación HTTP directos en el Windows de la exposición. No afirmar que la aplicación ya está alojada públicamente con FastAPI.

## Estado del repositorio

- La conexión del propietario `camachoab21-cmd` tiene permisos de administración/escritura; no se usa la cuenta de Edwin.
- El código, el README, el workflow CI, el video, las capturas y la guía están en `main`.
- Para ver el commit más reciente, consultar la rama `main` o ejecutar `git log -1 --oneline` dentro de una copia sincronizada.
- La carpeta Windows `Documents\CRUZA-PUBLICACION` estaba actualizada hasta un commit anterior; **no se sincroniza automáticamente con cada nuevo commit**. Antes de exponer, ejecutar `git pull --ff-only origin main` dentro de esa carpeta y luego `ABRIR-CRUZA.bat`.
- La carpeta `Documents\ChatGPT\Dev\cruza` mantenía la rama local `cruza-funcional` y archivos no rastreados. **No forzar merge ni borrar archivos sin revisar y respaldar**.

## Tareas aún pendientes

1. Confirmar inicio y navegación HTTP en el Windows del usuario con el último commit, y solucionar cualquier incidencia observada allí.
2. Para ofrecer uso remoto multiusuario: desplegar servidor con HTTPS y base de datos persistente, desactivar demo, configurar cuentas reales y auditar seguridad. **GitHub Pages solo publica el HTML estático, no FastAPI/SQLite.**
3. Verificar fórmulas y terminología PAPA/PAPI y reglamento actual de UTS; los porcentajes/cupos/créditos máximos de la demo son supuestos y no deben presentarse como normas oficiales.
4. Continuar pruebas visuales de teclado, zoom, accesibilidad y navegadores reales, preservando el diseño actual.

## Comandos de pruebas

```bash
python -m pip install -r requirements.txt pytest httpx
CRUZA_DEMO_MODE=1 python -m pytest -q
python -m pip install playwright
python tests/e2e_navegador_servidor.py
```

En PowerShell, para la prueba local:

```powershell
$env:CRUZA_DEMO_MODE="1"
python -m pytest -q
```

La prueba E2E arranca servidor propio con base SQLite temporal; no usa la base personal. `tests/ui_smoke.py` documenta el recorrido visual con transporte aislado.

## Prompt breve de continuación

> Continúa CRUZA 3 desde la rama main del repositorio camachoab21-cmd/cruza. Verifica lo que ya existe antes de tocarlo. Lee PRESENTAR-AHORA.md, README.md, VERIFICACION.md y REGLAS_NEGOCIO.md. Conserva los respaldos. Prioriza comprobar la aplicación en Windows, evitar defectos visuales, mantener control de roles, bloqueo al cuarto fallo, recuperación administrativa y matrícula sin cruces. Publica cambios comprobados sin forzar la rama ni subir datos, contraseñas, .venv o archivos SQLite. La prueba en Chromium usa puente HTTP; no confundirla con navegación directa en Windows.
