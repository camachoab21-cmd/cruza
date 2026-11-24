# CRUZA 3 — continuidad verificada

**Actualizado:** 23 de noviembre de 2026, para la exposición del 24 de noviembre.  
**Repositorio:** https://github.com/camachoab21-cmd/cruza — rama estable `main`.  
**Código de referencia antes de esta actualización documental:** `173c639cfe3372f7629fd50fc4646d576dd2ea15` (PR #7).  
**Colaborador verificado:** `ISFRANT`, permiso `write` de GitHub confirmado el 23 de noviembre.

**INSTRUCCIÓN PARA CONTINUAR:** leer [docs/COLABORACION-Y-ENTREGA-23NOV.md](docs/COLABORACION-Y-ENTREGA-23NOV.md). No volver a comenzar la app desde cero ni confundir GitHub Pages con la aplicación completa. El último código está en `main`.

## Qué existe

La aplicación académica funcional usa **FastAPI, SQLite, HTML/CSS/JS** y roles estudiante, docente y administrador. Conserva autenticación con sesiones HTTP-only, CSRF, roles, aprobación administrativa, recuperación asistida, pensum, matrícula sin cruces, horarios, agenda, notas, asistencia, historial, catálogo y auditoría. El proyecto es académico y sus cuentas de demostración son ficticias.

- `app/main.py`: API y validación de permisos.
- `app/db.py`: tablas SQLite, transacciones, semilla ficticia y seguridad de claves.
- `app/logic.py`: reglas académicas de demostración.
- `app/static/app.js`, `app/static/app.css`: lógica visual y estilos originales.
- `app/static/cruza-ux.js`, `app/static/cruza-ux.css`: interfaz Expo 24.11, modo claro/oscuro, tamaño de letra A−/A/A+, ayuda contextual inferior y recorrido guiado por rol.
- `app/static/cruza-tools.js`, `app/static/cruza-tools.css`: lápiz/crayón y pigmentos.
- `app/templates/index.html`: plantilla FastAPI con versión `20261123-expo.1`.
- `ABRIR-CRUZA.bat`, `INICIAR-CRUZA.bat`: arranque local con espera de respuesta HTTP real; detecta puerto ocupado.
- `ACTUALIZAR-Y-ABRIR-CRUZA.bat`: descarga `main` con respaldo Git de modificaciones **rastreables** antes de iniciar, sin eliminar SQLite.
- `scripts/build_expo_package.py`: genera ZIP portable para Windows sin secretos, bases ni entornos virtuales.
- `render.yaml`: **propuesta** de despliegue con disco persistente. No implica que el servicio o dominio estén activos.

Se conservan `index.html` (demo visual GitHub Pages), `respaldo/`, la guía de exposición y el MP4. La vista HTML pública **no es** la aplicación con servidor.

## Pruebas y artefactos

**Última ejecución validada:** [GitHub Actions #78](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201), resultado `success`. Fueron 21 pasos, sin fallos: pytest/API/roles, navegador FastAPI y SQLite temporal, pantallas multirresolución, lápiz/crayón, ayuda tipográfica y comprobación de integridad ZIP.

- [Paquete completo de exposición](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201/artifacts/14858527019): ZIP de la aplicación y guía, sin SQLite privada. Artefacto retenido hasta el **7-dic-2026**.
- [Capturas y auditoría visual](https://github.com/camachoab21-cmd/cruza/actions/runs/45255955201/artifacts/14859420570): artefacto disponible hasta el **21-feb-2027**.
- [Guía y recorrido para mañana](docs/EXPOSICION-24NOV-2026.md).
- Las pruebas automáticas son evidencia técnica, pero **no prueban** la velocidad ni el arranque en el computador de exposición del propietario.

## Uso local recomendado

En una copia nueva de Windows con Python 3.10+ y Git:

```powershell
git clone https://github.com/camachoab21-cmd/cruza.git
cd cruza
.\ABRIR-CRUZA.bat
```

Se requiere internet la primera vez para instalar dependencias. Cuando FastAPI esté listo, usar `http://127.0.0.1:8765/` y mantener abierta la consola. Para evitar conflictos, cerrar el servidor anterior antes de ejecutar el nuevo.

En modo demostración y solo **con base nueva**, usuarios ficticios:

| Rol | Usuario | Clave |
|---|---|---|
| Estudiante | `ESTUDIANTE` | `CRUZA2026` |
| Docente | `DOCENTE` | `CLASE2026` |
| Administrador | `ADMIN` | `ADMIN2026` |

El modo demo **debe permanecer desactivado para Internet**.

## Lo pendiente / riesgos conocidos

1. **Sincronización del equipo propietario:** su copia anterior estaba en `C:\Users\camac\Documents\CRUZA-PUBLICACION`. No se puede afirmar que sus cambios exclusivos estén en `main` sin inspeccionar esa carpeta; comparar antes de fusionar.
2. **Validación física:** abrir en Windows, comprobar puerto 8765, fuentes, rendimiento del lápiz/crayón, selección de materia y roles a resolución del proyector.
3. **Publicación externa:** requiere alojamiento de FastAPI, HTTPS, base persistente y cuentas seguras. El dominio `.tk` **no está verificado, registrado ni publicado**.
4. **Normativa real UTS:** algunas fórmulas, pesos, límites y etiquetas PAPA/PAPI son supuestos académicos de la demostración; no presentar como norma vigente sin verificación.

## Cómo trabajar en equipo

El compañero puede clonar y desarrollar desde `main` usando una rama propia. Evitar `push` directo a `main`, no subir `data/`, `.env`, ZIPs generados ni `.venv`; crear PR y validar GitHub Actions.

**Prompt para Codex o Work:** «Continúa CRUZA 3 desde `main` del repositorio `camachoab21-cmd/cruza`. Lee `docs/COLABORACION-Y-ENTREGA-23NOV.md` y `CONTINUIDAD.md` antes de cambiar código. Revisa la instalación local y sus diferencias sin eliminar datos, corrige solo incidencias reproducibles, valida los tres roles y la calidad visual, y publica los cambios mediante PR con pruebas exitosas. La exposición es el 24 de noviembre de 2026».
