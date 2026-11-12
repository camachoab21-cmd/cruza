# Arquitectura · CRUZA 3

## Componentes

```text
Navegador (JS + CSS, sin CDN)
  │ /api por HTTPS o localhost
FastAPI · app/main.py
  ├─ Sesión HTTP-only, token CSRF y autorización según rol
  ├─ Endpoints estudiante, docente y administrador
  ├─ Validaciones de matrícula y cupos en transacciones SQL
  ├─ Corrección de notas y asistencia con auditoría
  ├─ Recuperación de cuentas con código de un solo uso
  └─ app/db.py (SQLite WAL, PBKDF2-HMAC-SHA256, auditoría)
        └─ data/cruza.sqlite3  [NO VERSIONAR]
```

| Archivo | Responsabilidad |
|---|---|
| `app/main.py` | API, sesión, permisos y casos de uso |
| `app/db.py` | Esquema SQLite, creación y datos ficticios opcionales |
| `app/logic.py` | Matemática de notas, ponderaciones, cálculo de conflictos |
| `app/cli.py` | Inicialización y recuperación local del administrador |
| `app/templates/index.html` | Estructura y recursos locales |
| `app/static/app.js` | Interfaces y gestión de estado cliente, sin autorización de negocio |
| `app/static/app.css` | Sistema visual, modo oscuro, responsive y animaciones |
| `tests/` | Pruebas de API, cálculos y captura aislada de Chromium |
| `index.html` | Versión anterior autónoma, separada de la app segura |
| `respaldo/` | HTML originales preservados |
| `docs/` | Capturas y video de las demostraciones |

## Modelo académico

- `users`: estudiante, docente, administrador; estado de cuenta y fallos consecutivos.
- `groups`: grupo, materia, cupos, docente asignado y todas las franjas.
- `enrollments`: matrícula vigente por estudiante, materia y período.
- `drafts`: selección de grupos sin confirmar, independiente de la matrícula vigente.
- `evaluations`, `grades`: evaluaciones individuales, docente que escribió y fecha.
- `attendance`: marca por estudiante/grupo/día.
- `history`: historial por período e intento de materia.
- `agenda`, `activities`, `activity_status`: recordatorios personales y entregas académicas independientes.
- `sessions`: sesión hash, expiración, CSRF.
- `recovery`: solicitud, código hash, vencimiento y uso.
- `audit`: eventos sensibles sin secretos.

## Límites explícitos

- La base SQLite reside en el servidor: dos navegadores en la **misma instancia** comparten notas y matrículas.
- La aplicación viene sin correo, HTTPS público, copias de seguridad automáticas, MFA ni infraestructura HA. No declararla apta para producción sin endurecimiento y auditoría profesional.
- En modo demo hay contraseñas públicas conocidas, **solamente para evaluación local**. En instalaciones reales inicializar admin desde consola.
- Para acceso entre computadores, configurar red local y firewall deliberadamente, sin abrir el servidor a internet de manera improvisada.
- Los datos históricos se han creado para ilustrar, no representar estudiantes reales.
