# CRUZA 3 — publicación de la aplicación real y dominio .tk

**Estado:** configuración de despliegue preparada, NO desplegada ni verificada en una URL pública. La demostración de GitHub Pages no ejecuta FastAPI ni SQLite.

## 1. Dominio .tk: disponibilidad por confirmar

El dominio de nivel superior **.tk** corresponde a Tokelau: [registro oficial IANA](https://www.iana.org/domains/root/db/tk.html). Las condiciones comerciales difieren entre registradores en noviembre de 2026: [Gandi](https://www.gandi.net/en/domain/tld/tk) y [Netim](https://www.netim.com/en/domain-name/tk-domain) indican suspensión de altas/transferencias, mientras otros registradores señalan reapertura de pago. **No se verificó que cruza.tk esté disponible ni se debe prometer gratuitamente.**

Para demostrar al profesor el requisito, consultar primero la disponibilidad real de un nombre aprobado por el equipo, pedir información registral verificable y guardar constancia del resultado. Si no es posible, entregar provisionalmente la URL HTTPS del proveedor y documentar por qué no se consiguió el .tk.

## 2. Backend y datos persistentes

CRUZA requiere servidor FastAPI y SQLite. GitHub Pages no sirve para estas operaciones. Se añadió `render.yaml` con una propuesta **opcional de pago**:

- Un único proceso Uvicorn (SQLite no está configurado para múltiples instancias).
- Disco persistente montado en `/opt/render/project/src/data`; archivo `cruza.sqlite3` dentro de esa ruta.
- `CRUZA_DEMO_MODE=0` y cookie HTTPS segura con `CRUZA_HTTPS=1`.
- Despliegues automáticos desactivados hasta completar revisión y aprobación.

**No seleccionar un servicio sin disco persistente para pruebas con datos que deban conservarse.** Render advierte que su sistema de archivos estándar se pierde al reiniciar o redesplegar servicios y los discos persistentes requieren plan compatible de pago:
[Render: discos persistentes](https://render.com/docs/disks) · [Render: plan gratuito](https://render.com/docs/free) · [Blueprint](https://render.com/docs/blueprint-spec).

## 3. Puesta en marcha segura

1. Conectar el repositorio `camachoab21-cmd/cruza` desde la cuenta de hosting autorizada.
2. Revisar el costo del plan y la ubicación antes de aceptar la creación de recursos.
3. Comprobar que el almacenamiento persistente esté montado y que `/api/session` responda por HTTPS.
4. **Antes de habilitar cuentas reales**, abrir la consola privada del servidor y ejecutar `python -m app.cli init-admin --username ADMIN`. Introducir allí una contraseña privada robusta; no guardarla en GitHub ni en la documentación.
5. Probar inicio/cierre de sesión, creación de estudiante, matrícula, notas, asistencia, cambios de contraseña, roles y persistencia tras reinicio.
6. Configurar en el registrador los registros DNS que indique el hosting para el nombre concreto; verificar HTTPS con certificado válido y que los cambios de datos no desaparezcan.
7. Preparar un respaldo externo periódico de SQLite mediante su interfaz de copias de seguridad (`sqlite3.Connection.backup`), y ensayar una restauración en una instancia aislada. No depender solo del disco del mismo proveedor.

## 4. Requisitos de aceptación antes de exponer por Internet

- No activar las cuentas ficticias de demostración en producción.
- No subir `data/`, archivos de base de datos, `.env` ni claves a Git.
- HTTPS y cookies seguras funcionando.
- Administrador inicial creado de forma privada.
- Respaldo probado, persistencia y controles por rol comprobados.
- Dominio .tk registrado y verificado, si el registro está efectivamente disponible.
- Evidencia de pruebas en la URL **funcional**, separada de GitHub Pages.

**Pendiente:** contratar/activar hosting y dominio desde una cuenta autorizada; no se ha cobrado, contratado ni publicado el sistema en este cambio.
