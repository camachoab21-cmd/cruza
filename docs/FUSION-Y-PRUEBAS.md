# CRUZA 3 — Fusión visual y auditoría funcional

**Fecha:** 17 de noviembre de 2026  
**Base:** repositorio `camachoab21-cmd/cruza`, rama `main`, aplicación FastAPI/SQLite.  
**Aporte analizado:** archivo recibido `CRUZA(1).zip`, proyecto de Fidel, con commit local `10cf09a` («arreglos generales»).  
**Objetivo:** conservar la identidad gráfica creativa de CRUZA y los avances de Fidel, sin introducir regresiones funcionales ni ocultar información académica.

## Resultados de comparación de código

El ZIP incluye una clonación previa del repositorio, no un sistema backend independiente. Su último commit modificó `app/static/app.js`, `app/static/app.css`, `app/templates/index.html` e `index.html`. El contenido lógico de `app/static/app.js` y `app/static/app.css` **ya coincidía** con la rama `main` consultada al iniciar esta revisión; las diferencias de hash de los archivos del ZIP procedían de saltos de línea Windows/Unix. Por tanto, no se sobrescribió `main` con una versión más antigua ni se hizo un merge destructivo de ramas.

| Área | Hallazgo de la comparación | Decisión aplicada |
|---|---|---|
| Tablero, casillas, tarjetas, animaciones, calendario y perfiles | Mejoras visuales de Fidel ya integradas en `main` | Conservar |
| Acceso del estudiante a Asistencia | Pantalla implementada, pero enlace retirado del menú | Restaurar el acceso |
| Barra de pistas contextual | Elemento oculto y sin respuesta a foco/ratón | Restaurar, con interruptor y sin superponer información |
| Calculadora académica | Indicaba 33/33/34, discrepante con lógica 30/30/40; rellenaba valores faltantes con 4.0 | Usar 30/30/40; permitir tres hipótesis explícitas y mostrar «—» si faltan datos |
| Contraseña en casillas | Hasta 128 casillas podían expandir verticalmente el formulario | Mantener el valor íntegro y mostrar solo una ventana de 14 casillas |
| Mensajes de operación | Varias notificaciones podían acumularse sobre tablas y estadísticas | Una notificación a la vez, eliminación al cambiar de pantalla |
| Administración móvil | Los botones de aprobar/desactivar quedaban fuera de la vista en una tabla horizontal | Presentar filas en tarjetas accesibles con acciones visibles |
| Modales de alta y edición | Campos sin asociación explícita entre etiqueta y control | Vincular etiquetas a los campos al abrir el modal |
| Cuadrícula visual en modo noche | Líneas demasiado marcadas interferían con el texto | Reducir contraste y conservar la estética de crucigrama |
| Texto y contexto institucional | Algunas frases podían interpretarse como datos oficiales | Marcar claramente el proyecto como demostración y no inventar fórmulas oficiales |

**No se importaron** `.git`, `.venv`, `data/*.sqlite3`, registros o datos de la base del ZIP de Fidel: son elementos de entorno y datos locales que no deben combinarse ni publicarse en GitHub.

## Verificaciones efectivamente ejecutadas

Se realizaron en un entorno aislado con Python, servidor FastAPI y base SQLite temporal. No se modificó la base local del usuario.

| Prueba | Resultado |
|---|---|
| `python -m pytest -q` | **19 aprobadas** en la copia de revisión (tests históricos de backend del ZIP). El repositorio principal ya incluye una prueba adicional de inicio. |
| `node --check app/static/app.js` | Sintaxis de JavaScript correcta |
| `python tests/e2e_navegador_servidor.py` | **26 solicitudes** mediante frontend real y servidor HTTP real sin JS/HTTP 5xx; usa puente para Chromium |
| `python tests/ui_actions_audit.py` | **96 interacciones de UI, 68 solicitudes HTTP**, incluidas 4 respuestas 401 esperadas al ensayar el bloqueo; **0 errores 5xx y 0 excepciones JS** |
| `python tests/ui_full_audit.py` | **42 capturas** de estudiante (10 módulos × 3 tamaños), docente (2 × 2) y administración (4 × 2); **0 casos de desbordamiento horizontal**, campos sin etiqueta o pantallas sin encabezado detectados |
| Tema día/noche, modales, navegación móvil y Escape | Revisados por recorridos UI y comprobaciones de atributos/visibilidad |
| Simulador de notas | Verificado: 4,5 × 30 % + 3,0 × 30 % + 5,0 × 40 % = **4,25**; vacío no se interpreta como 0 |
| Seguridad visible | Bloqueo al cuarto fallo, solicitud de recuperación, emisión de código, canje, habilitación administrativa y acceso posterior probados con cuenta ficticia |

### Funcionalidad recorrida de forma interactiva

- Login, ventana de credenciales ficticias, recuperación, mostrar/ocultar contraseña, modo oscuro/claro, herramienta pincel/lápiz, pistas y navegación por crucigrama.
- Estudiante: Pensum, búsqueda de materias, filtros, borrador, cambio de grupo con conflicto de horario, descarte y confirmación, horario y enlace de CSV, navegación mensual y día del calendario, agenda de calendario, crear/editar/completar/eliminar recordatorios, calculadora de tres cortes, asistencia, historial y perfil.
- Docente: grupos, notas, motivo de corrección, marcar asistencia presente/ausente.
- Administración: materia y grupo nuevos, estudiante pendiente, aprobar/desactivar/reactivar, auditoría, solicitud y emisión de código de recuperación, habilitación tras restablecimiento.

## Evidencias visuales del estado fusionado

- [Acceso](capturas/fusion-login.jpg)
- [Notas y calculadora, escritorio](capturas/fusion-estudiante-notas.jpg)
- [Notas, modo noche móvil](capturas/fusion-estudiante-movil-oscuro.jpg)
- [Inscripción, móvil](capturas/fusion-matricula-movil.jpg)
- [Administración con acciones visibles en móvil](capturas/fusion-administracion-movil.jpg)
- [Docente](capturas/fusion-docente.jpg)
- [Calendario, noche](capturas/fusion-calendario-oscuro.jpg)

En la entrega local de auditoría se guardan además los archivos `docs/auditoria/reporte.json` y `acciones.json`, con el inventario de pantallas, controles, peticiones y acciones concretas.

## Límites y pendientes de verificación

Los recorridos de Chromium en este entorno cargan el HTML/CSS/JS auténticos, y las llamadas HTTP del navegador se redirigen a un servidor FastAPI real mediante un **puente Python**. Esto es una prueba de integración, pero **no equivale a verificar navegación directa a `localhost` en Windows**, interacción táctil física, todos los navegadores ni carga concurrente de usuarios reales. No se puede prometer cero defectos en cualquier sistema sin esas pruebas.

Los valores de cortes 30/30/40, el límite de 18 créditos, el catálogo, las notas y las cuentas son ficticios de demostración. No deben presentarse como política oficial vigente de las UTS. El alojamiento público en GitHub Pages solo ejecuta `index.html` autónomo; **el backend FastAPI/SQLite sigue requiriendo un servidor**.

## Repetir pruebas

```bash
python -m pip install -r requirements.txt pytest httpx playwright
python -m playwright install chromium
CRUZA_DEMO_MODE=1 python -m pytest -q
python tests/e2e_navegador_servidor.py
python tests/ui_actions_audit.py
python tests/ui_full_audit.py
```

En PowerShell, para pytest: `$env:CRUZA_DEMO_MODE="1"; python -m pytest -q`.

**Recomendación para exposición:** usar `PRESENTAR-AHORA.md` y ejecutar `ABRIR-CRUZA.bat` desde una copia sincronizada del repositorio. No publicar ni compartir la base local ni las credenciales fuera de la demostración.