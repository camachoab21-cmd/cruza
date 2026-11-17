# CRUZA-FINAL — Login por perfiles

Versión integrada sobre el `index.html` local de CRUZA-FINAL aportado por el usuario (147.759 bytes), sin sustituir los módulos existentes. Prototipo independiente de demostración, no oficial ni conectado a UTS o Academusoft.

## Abrir

1. Extrae el ZIP en una carpeta.
2. Abre `index.html` con Chrome o Edge. No necesita internet, Node, servidor ni extensiones para presentar las pantallas.
3. En el acceso, pulsa «Credenciales de demostración» si necesitas consultarlas.

## Credenciales ficticias

| Rol | Usuario | Contraseña | Permisos |
| --- | --- | --- | --- |
| Estudiante | `ESTUDIANTE` | `CRUZA2026` | Tablero, Pensum, Inscripción, Horario, Calendario, Mi agenda, Notas, Historial y Perfil. |
| Docente | `DOCENTE` | `CLASE2026` | Solo Notas y Asistencia. |
| Administrador | `ADMIN` | `ADMIN2026` | Crea estudiantes internamente, aprueba y activa o desactiva el acceso. |
| Pendiente de aprobación | `PENDIENTE` | `CRUZA2026` | Bloqueada hasta que el administrador apruebe. |

Al crear una cuenta de estudiante, el administrador proporciona un usuario ficticio y el sistema la deja en estado **pendiente**. Tras aprobarla, esa cuenta usa la contraseña de demostración `CRUZA2026`. No hay registro público ni recuperación de contraseña real.

## Funciones importantes

- Acceso con dos campos nativos, cada uno visualizado mediante 12 casillas independientes y animadas, pegado de texto, teclado, mostrar/ocultar contraseña, validación y transición con partículas.
- Tres roles con rutas restringidas desde la aplicación.
- Docente puede modificar calificaciones por corte y asistencia por fecha y materia; las calificaciones guardadas se reflejan al ingresar como estudiante en **el mismo navegador**.
- Administración puede gestionar cuentas estudiantiles, incluidas cuentas pendientes y desactivadas.
- Estudiante conserva los módulos existentes y recibe Pensum y Mi agenda; los recordatorios son personales y no cambian el estado académico.
- Calendario con franjas discretas de estado de actividades ficticias y opción de crear recordatorio vinculado.
- Inscripción, validación de cruces, confirmación y horario exportable de la versión local original.
- Efectos del tablero y fondos de la versión original preservados. El nuevo acceso tiene sus propias luces, reflejos, casillas y lápiz suave en el fondo libre.
- Respetar preferencia de movimiento reducido.

## Limitaciones honestas

- Todos los usuarios, notas, asistencias, actividades y aprobaciones son **datos de demostración** guardados en `localStorage` del navegador. No se sincronizan entre equipos. No es una plataforma de autenticación segura, ni reemplaza un servidor real.
- Las contraseñas son ficticias y están incorporadas en el código por motivos de demostración. Nunca uses contraseñas reales.
- El docente puede editar notas y asistencia dentro de la simulación; el administrador de esta versión no configura docentes ni cursos institucionales.
- La estructura de Pensum y sus códigos son ficticios y no equivalen al plan oficial de UTS.
- Las pruebas de Chromium inyectaron el HTML mediante `set_content()` porque el navegador automatizado bloquea la navegación a `file://` y localhost en este entorno. Las pruebas de datos persistentes utilizaron una implementación simulada de `localStorage`; por eso se debe verificar manualmente la apertura directa desde Windows.

## Contenido del paquete

- `index.html`: aplicación autónoma final.
- `RESPALDO-index-original.html`: HTML local recibido, sin alteraciones.
- `DEMOSTRACION-LOGIN-PERFILES.mp4`: video de interacciones en Chromium.
- `login-desktop.png`, `login-mobile.png`, `tablero-desktop.png`, `tablero-mobile-estable.png`, `admin-desktop.png`, `docente-desktop.png`: capturas reales.
- `VERIFICACION.md`: verificaciones realizadas y pendientes.

## Publicar en GitHub

Repositorio previsto: https://github.com/camachoab21-cmd/cruza

**No se ha subido desde este entorno** por falta de permisos de escritura en la cuenta conectada a ChatGPT. Para publicarlo, sigue las instrucciones de PowerShell entregadas junto al paquete y sube solo `index.html` más este `README.md`. No es necesario subir el video ni el respaldo al repositorio público.
