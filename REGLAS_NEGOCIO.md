# Reglas de negocio y criterios comprobables

| ID | Regla | Evidencia / implementación |
|---|---|---|
| RN-01 | Solo Administración crea y aprueba estudiantes; no hay autorregistro | `POST /api/admin/students`, `PUT /api/admin/users/{id}/status`; prueba `test_roles_routes_and_no_self_register` |
| RN-02 | Docente solo cambia notas y asistencia de estudiantes de sus grupos | `app/main.py`, consultas `JOIN groups/enrollments`; `test_teacher_marks_student_student_sees_it` |
| RN-03 | Cuarto fallo de credenciales de cuenta activa bloquea el acceso | Campo `failed` persistido en transacción, estado `locked`; `test_four_failures_lock_and_recovery` |
| RN-04 | El bloqueo no desaparece al cambiar navegador; restablecer no desbloquea | SQLite, `recovery`, estado `reset_pending`; prueba `test_four_failures_lock_and_recovery` |
| RN-05 | Solo se desbloquea tras restablecimiento y aprobación administrativa | Transiciones válidas en `/api/admin/users/{id}/status` |
| RN-06 | Código de recuperación caduca en 30 min y es de un solo uso | Hash SHA-256, `used_at` y vencimiento; prueba token reutilizado |
| RN-07 | Cuadernos/agenda personales de cada estudiante no afectan actividades académicas | `agenda` y `activity_status` independientes |
| RN-08 | El borrador nunca altera el horario confirmado antes de la aprobación | `drafts` vs `enrollments`; `test_enrollment_conflict_and_group_switch` |
| RN-09 | Las franjas se cruzan si `inicioA < finB` y `inicioB < finA` en el mismo día | `app/logic.py` `time_conflicts`; prueba contigüidad |
| RN-10 | No se confirma si hay conflicto, duplicado, más de 18 créditos o falta de cupos | Endpoint `enroll/confirm`, transacción SQL |
| RN-11 | Créditos son números enteros positivos | Restricción SQLite `CHECK(credits>0)`, validación de entrada |
| RN-12 | Las notas pendientes no se convierten en 0 | `grade_summary` devuelve `None` hasta finalizar cortes |
| RN-13 | La definitiva suma cortes 30% + 30% + 40% **simulados** | `app/logic.py`, `tests/test_academics.py` |
| RN-14 | Promedio período = suma definitivas×créditos / suma créditos de las materias con definitiva | `period_average` (etiqueta PAPI en demo) |
| RN-15 | Promedio acumulado usa último intento de cada curso | `cumulative_average` (etiqueta PAPA en demo) |
| RN-16 | Cada corrección de nota publicada exige motivo, usuario y fecha en auditoría | Endpoint `/api/teacher/grade` y tabla `audit` |

## Fuentes y suposiciones

- Las **fórmulas generales** de promedios ponderados se basan en los artículos 79 y 80 del Acuerdo UTS 01-055 de 2021: https://www.uts.edu.co/sitio/wp-content/uploads/normatividad/reglamento_estudiantil.pdf
- El **reglamento de 2026** debe contrastarse antes de usar la denominación o normativa en un ambiente institucional: https://www.uts.edu.co/normatividad/
- **PAPA/PAPI** son etiquetas pedagógicas en CRUZA para acumulado/período respectivamente. No se ha verificado que esas siglas sean las oficiales de UTS.
- Cortes (30/30/40), cantidad de evaluaciones, máximos de créditos, estado aprobado con 3.0, calendario y materias son **ficticios para la demo**.
- Estado pendiente, desactivado, bloqueado y restablecido-pendiente-aprobación son distintos.

## Seguridad operacional

- El límite por cuenta identificable no impide que un atacante cause bloqueo de cuenta; para despliegue público se deben evaluar mitigaciones contra denegación de servicio, MFA, monitoreo y políticas institucionales.
- No se muestra si un usuario inexistente existe durante solicitudes de recuperación; se aplica límite por IP/usuario.
- Los códigos se entregan manualmente después de una verificación de identidad externa. Esta verificación es responsabilidad del operador, no automática.
- El servidor no está certificado para despliegue público; modo demo siempre local.
