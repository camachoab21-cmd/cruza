# Continuidad — CRUZA 3

## Objetivo

Proyecto universitario de crucigrama académico creativo, responsive y plenamente demostrable, con estudiante, docente y administrador, matrícula, horarios, notas y seguridad en servidor.

## Estado actual

- Carpeta `CRUZA-RELEASE-SEGURO`: código FastAPI/SQLite, cliente JS/CSS, versiones anteriores archivadas, pruebas y documentación.
- HTML autónomo anterior en `/index.html` y `/respaldo/CRUZA-HTML-DEMO-2026.html`.
- Instrucciones de ejecución `README.md`, instalación `INSTALAR.bat`, arranque `INICIAR-CRUZA.bat`.
- Test API: 19 pruebas pasadas. Visual aislada: 4 combinaciones perfil/resolución pasadas. Grabación de la nueva interfaz: `docs/CRUZA3-RECORRIDO-VISUAL.mp4` (transporte simulado).
- **Publicación a GitHub pendiente**: el conector de este chat no tenía permisos para escribir en `camachoab21-cmd/cruza`.
- **Invitación de ISFRANT pendiente**: requiere propietario o administrador del repo.
- Último commit remoto consultado antes de este trabajo: `ab240b92b49fd048e025af01c942859b28f2b202` en `main`. Este proyecto **no tiene un commit remoto nuevo verificado**.

## Rutas relevantes

- `/app/main.py`: endpoints, roles, CSRF, login, bloqueo, recuperación, matrícula, notas, agenda.
- `/app/db.py`: tablas, usuarios de demostración, contraseñas PBKDF2, recuperación.
- `/app/logic.py`: créditos, conflictos y ponderaciones.
- `/app/static/app.js`: vista SPA, crucigrama, login, módulos, canvas y gestos.
- `/app/static/app.css`: estilos, marfil, modo oscuro, animaciones, responsive.
- `/app/cli.py`: arranque de administrador y recuperación de emergencia.
- `/tests`: cálculos, rutas y capturas visuales aisladas.

## Decisiones

- Modo demo OFF por defecto para evitar credenciales públicas si se despliega accidentalmente.
- Demo local ON mediante INICIAR-CRUZA.bat y `CRUZA_DEMO_MODE=1`.
- No hay auto registro estudiantil. Admin verifica y aprueba.
- No hay correo de recuperación; admin verifica por fuera y emite token 30 minutos, de un solo uso.
- PAPA/PAPI son etiquetas pedagógicas; verificar terminología exacta UTS y reglamento 2026 antes de afirmar que son oficiales.
- Los pesos de cortes, materias, créditos y límite 18 son ficticios.

## Pendientes prioritarios

1. **Probar el servidor en Windows** con instalación y navegador real. Resolver cualquier problema de dependencias, rutas, fuentes y clics.
2. **Publicar en GitHub** `camachoab21-cmd/cruza` usando `PUBLICAR-GITHUB.ps1` desde el equipo con sesión autenticada, o conectar la cuenta correcta a GitHub; verificar commit remoto.
3. **Invitar a Fidel, usuario `ISFRANT`**, con permiso Write desde Settings/Collaborators; verificar aceptación.
4. Confirmar fórmulas/terminología académicas con la normativa más reciente de UTS.
5. Añadir pruebas end-to-end HTTP reales con Chromium en Windows.
6. Si se requiere uso institucional remoto: desplegar base de datos y servidor con HTTPS, secretos gestionados y auditoría de seguridad independiente.

## Pruebas

```bash
PYTHONPATH=. CRUZA_DEMO_MODE=1 pytest -q
PYTHONPATH=. CRUZA_DEMO_MODE=1 python tests/ui_smoke.py
```

`ui_smoke.py` usa transporte simulado solo por la restricción de Chromium de este entorno. No modifica la base de datos del usuario si se ejecuta con `CRUZA_DB_PATH` hacia una base de pruebas.

## Prompt para continuar

> Continúa CRUZA 3 en la carpeta del repositorio `camachoab21-cmd/cruza`. Lee primero `CONTINUIDAD.md`, `REGLAS_NEGOCIO.md`, `ARQUITECTURA.md`, `VERIFICACION.md` y `README.md`. Conserva la versión autónoma original. Verifica el funcionamiento real en Windows, corrige los problemas visuales o de integración y publica un commit comprobado. Verifica que `ISFRANT` tiene permiso Write sin tocar datos privados de terceros. Mantén la separación de roles y las reglas de bloqueo al cuarto fallo, recuperación y matrícula. No declares despliegue o pruebas completadas sin ejecutarlas.


## Cierre de esta revisión

- Código preparado en `CRUZA3-ENTREGA-VERIFICADA`.
- Se corrigió el login para contraseñas largas y la exigencia de créditos estrictamente enteros.
- Se añadió un test de integración de interfaz/servidor: `tests/e2e_navegador_servidor.py` (**26 solicitudes** verificadas) y una prueba de créditos enteros.
- Se creó el video de 46,5 s `docs/CRUZA3-VISITA-GUIADA.mp4` a partir de acciones verificadas, con acceso de capítulos desde `VER-RECORRIDO.html`.
- Se añadió `ABRIR-CRUZA.bat` para iniciar la app con un doble clic desde Windows (requiere Python).
- Total unit/integración de API: **19/19 aprobadas**; móvil 390×844 revisado mediante adaptador del navegador; navegación HTTP directa en Windows **pendiente**.
- GitHub `camachoab21-cmd/cruza` e invitación a `ISFRANT`: **pendientes** por permisos de la conexión actual. No anunciar que están realizados.
