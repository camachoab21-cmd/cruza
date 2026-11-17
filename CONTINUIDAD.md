# Continuidad CRUZA — 17 de noviembre de 2026

## Estado real
NO está lista para afirmar entrega completa. Usuario exige funcionamiento local, ahorro de créditos, nada de control de pantalla; usar Chromium headless para pruebas.
Repositorio: https://github.com/camachoab21-cmd/cruza. Rama local: cruza-funcional.
GitHub: cuenta camachoab21-cmd validada vía Git Credential Manager con admin/push. Invitación Isfrant #343048319 enviada con write el 11 de noviembre, aceptación no verificada.

## Avances preservados
- d6d4cb1: respaldo íntegro CRUZA-FINAL publicado en origin/cruza-funcional.
- 33ba2c6: aporte ZIP de Fidel importado localmente.
- 26f6635: integración local con origin/main (10cf09a), preserva arreglos recientes de Fidel.
- Adoptada su arquitectura Python/FastAPI/SQLite; no continuar el experimento Node (.local/experimento-node).
- ZIP original intacto en Descargas; no importar .venv, .git ni data del ZIP.
- Entorno .venv creado con Python 3.12 del runtime. Dependencias y Chromium instalados.

## Pruebas comprobadas
- Suite original: 19 aprobadas el 16 de noviembre (una advertencia de Starlette por httpx).
- Nueve pruebas añadidas en tests/test_completion.py: fallaron antes de implementar (RED comprobado).
- Cambios posteriores en app/db.py, logic.py, main.py, services.py y extensions.py compilan con py_compile.
- La suite tras esos cambios NO se ejecutó: revisión automática de aprobación falló por límite de uso; indicaba reintentar desde el 17 de noviembre a las 04:00.
- Ejecutar pruebas con permisos normales externos al entorno restringido mediante exec_command require_escalated: el modo restringido bloquea socketpair de asyncio en Windows y las pruebas quedan esperando. No corregir ese bloqueo cambiando el código del proyecto.

## Implementación pendiente de verificar
- Contar fallos de recuperación fuera de la transacción que revierte al fallar.
- Invalidar códigos al desactivar cuenta y rechazar su canje.
- Limitar cuerpo y contraseña; no cachear API; cerrar conexiones SQLite.
- Validar horas reales y cruces internos de un grupo.
- Configuración de pesos de cortes y máximo de créditos, resúmenes por corte y créditos ponderados.
- Nuevos endpoints de perfil, creación de docentes/estudiantes, edición de materia/grupo y evaluaciones por corte (extensions.py).
- No están conectados todavía a formularios nuevos del frontend.

## Siguientes pasos en orden
1. Ejecutar .venv\Scripts\python.exe -m pytest -q --tb=short con require_escalated y revisar fallos; no asumir 28 pruebas verdes.
2. Revisar imports de extensions en main: se insertaron antes de create_course; compila, pero verificar rutas y lecturas de settings dentro de conexiones abiertas.
3. UI: restaurar barra contextual de pistas que fue retirada en cambios remotos; añadir perfil editable, usuarios docente/estudiante, configuración, edición de catálogos y gestión de evaluaciones.
4. Unificar porcentajes reales de servidor con simulador (remoto mezcla 30/30/40 y 33/33/34), eliminar supuestos ocultos de notas 4.0. Mostrar estimaciones explícitas y notas pendientes.
5. Cursor: hoy alterna grosor del trazo, no cursor personalizado real; implementar pincel/lápiz y desactivar efecto. Reconocimiento actual también acepta círculos/cuadrados, corregir y probar triángulo.
6. Ejecutar servidor real con datos TEMPORALES y Chromium headless directo HTTP, sin puentes simulados. Capturas, grabación, móvil/tableta/desktop, oscuro/claro, teclado y zoom.
7. Corregir lanzadores: no hay Python registrado (py --list-paths vacío), pero .venv existe y funciona; hacer ABRIR-CRUZA robusto. No lanzar ventanas durante pruebas; usuario pide no controlar pantalla.
8. Faltan docs/capturas y videos anunciados por README de Fidel: generarlos y actualizar README, VERIFICACION, RECORRIDO, arquitectura y reglas con evidencia propia.
9. Registrar commit, publicar rama y verificar remoto; integrar main solo si funcional. Origin/main actualizado a 10cf09a al último fetch; nunca forzar push.
10. Entregar carpeta/ZIP lista local, acceso sencillo, guion de exposición y enlaces exactos. No incluir BD con datos personales, .env ni secretos Git.

## Herramientas
Python local: .venv/Scripts/python.exe. Git y Node en PATH. Playwright instalado por pip; Chromium descargado en AppData/Local/ms-playwright.
Credencial GitHub se usa en .local/github.mjs (ignorado, no contiene token persistido): consulta Git Credential Manager solo en memoria, valida /user y permisos; no imprimir secretos.

## Prompt para continuar
Continúa CRUZA desde esta carpeta y este documento. Conserva el aporte de Fidel y todos los respaldos. Completa interfaz, verifica las nuevas funciones y prueba HTTP real con Chromium headless. La suite original pasó; la nueva no está verificada. No controles la pantalla, no repitas la instalación, no reescribas en Node, no publiques como terminado algo no probado. Usuario autoriza arreglos y publicación, e invitación de escritura a ISFRANT ya enviada.
