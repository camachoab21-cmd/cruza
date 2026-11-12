Actúa como desarrollador full stack, diseñador de interfaces y responsable de pruebas. Continúa el proyecto **CRUZA** hasta entregar una aplicación académica funcional, original, segura y preparada para una evaluación exigente.

Queda aproximadamente el **50 % de mis créditos**. Aprovecha ese presupuesto trabajando sobre lo existente, priorizando resultados verificables y guardando avances en GitHub desde el principio. No gastes la mayor parte en planificación, explicaciones repetidas o reconstrucciones innecesarias.

**1. Contexto, archivos y destino**

Repositorio existente: https://github.com/camachoab21-cmd/cruza

Material disponible:

- `CRUZA-FINAL-CON-LOGIN-Y-ROLES.zip`.
- `CRUZA-FINAL-ACTUALIZADO.html`, si está disponible.
- La última versión del proyecto y los archivos existentes en GitHub.
- README, VERIFICACION, capturas, grabación y respaldos del proyecto.

El ZIP se encontró previamente en `C:\Users\camac\Downloads\CRUZA-FINAL-CON-LOGIN-Y-ROLES.zip`. Comprueba su disponibilidad actual.

El paquete contiene un prototipo HTML con roles de estudiante, docente y administrador, módulos académicos y datos guardados en `localStorage`. Sus contraseñas y permisos de demostración no constituyen seguridad real.

Inspecciona las versiones y determina cuál contiene el trabajo más completo. Conserva las funciones y el diseño aprovechables; no elijas una versión solamente por su nombre o fecha. Si falta un archivo imprescindible, búscalo en el proyecto y los adjuntos accesibles; solicítamelo únicamente si no puedes recuperarlo.

Utiliza la sesión de GitHub abierta en mi navegador. **Antes de modificar el repositorio, verifica que la cuenta sea `camachoab21-cmd` y tenga permisos de escritura.** Conserva los archivos anteriores y el historial. No hagas sobrescrituras destructivas ni publicaciones forzadas.

**2. Forma de trabajar y aprovechamiento de créditos**

Realiza un diagnóstico breve y empieza a implementar. Resuelve las decisiones rutinarias con criterio y documenta las suposiciones que afecten al comportamiento. Pregunta únicamente por información imprescindible que no puedas obtener del proyecto.

Como orientación, distribuye el esfuerzo restante así:

- 10 %: inspección, decisiones esenciales y primer respaldo.
- 40 %: funciones, seguridad, datos y cálculos.
- 25 %: diseño y acabado de todas las pantallas.
- 15 %: pruebas y correcciones.
- 10 %: publicación, documentación y continuidad.

Estos porcentajes son una guía, no una medición exacta del consumo. Ajusta el reparto según los problemas reales y prueba durante todo el desarrollo.

Mantén entregas pequeñas que puedan ejecutarse. Guarda y publica avances coherentes al terminar cada bloque importante. No esperes al final para hacer el primer commit.

**3. Arquitectura y división de responsabilidades**

Organiza el proyecto para que pueda entenderse, mantenerse y continuarse:

- Interfaz: componentes, páginas, formularios, navegación y presentación.
- Lógica académica: notas, cortes, promedios, créditos, matrícula y horarios.
- Seguridad: autenticación, autorización, sesiones, bloqueos y recuperación.
- Persistencia: usuarios, asignaturas, grupos, matrículas, evaluaciones, notas y auditoría.
- Pruebas y documentación.

Evita concentrar toda la aplicación en un único archivo gigante. Conserva `index.html` como entrada cuando corresponda a la arquitectura elegida y guarda el HTML original como respaldo.

Reutiliza las tecnologías existentes cuando sean adecuadas. Incorpora servidor y base de datos para que los permisos, las contraseñas y los cambios académicos se gestionen de forma real y puedan compartirse entre sesiones y equipos.

No presentes restricciones del navegador ni `localStorage` como autenticación segura. Una copia estática puede conservarse como demostración claramente identificada. Publicar archivos en GitHub no demuestra por sí solo que el servidor y la base de datos estén funcionando.

Si hace falta un servicio externo, utiliza los recursos ya disponibles y autorizados. No contrates servicios ni generes cargos sin consultarme. Si una dependencia externa impide el despliegue, deja la aplicación ejecutable localmente y documenta exactamente lo pendiente.

**4. Roles y permisos efectivos**

Implementa una matriz de permisos y aplica las restricciones en el servidor, incluyendo la propiedad de los datos.

Estudiante:

- Consultar y actualizar los datos de perfil permitidos.
- Consultar pensum, asignaturas, créditos, grupos y horarios.
- Matricular asignaturas cumpliendo las reglas académicas.
- Consultar su horario, notas, cortes, promedios, historial y asistencia.
- Gestionar su agenda personal.
- Restablecer su contraseña y consultar el estado de recuperación.
- Acceder exclusivamente a la información que le corresponde.

Docente:

- Acceder exclusivamente a sus asignaturas, grupos y estudiantes asignados.
- Gestionar evaluaciones, porcentajes, notas por corte y asistencia.
- Consultar resultados y cálculos de sus grupos.
- Corregir notas con registro del cambio y su motivo.
- No modificar roles, desbloquear cuentas ni editar grupos ajenos.

Administrador:

- Gestionar usuarios, roles, estados de cuenta y asignaciones.
- Gestionar asignaturas, grupos, horarios, créditos y configuración académica.
- Aprobar o desactivar cuentas según las reglas existentes.
- Revisar solicitudes de recuperación y habilitar cuentas bloqueadas cuando corresponda.
- Consultar auditoría.
- No consultar contraseñas ni recuperar su texto original.

Cambiar una dirección, un identificador o una petición manualmente no debe permitir saltarse estas restricciones. Ocultar botones es solo una parte de la interfaz.

**5. Bloqueo al cuarto intento y recuperación**

Implementa el siguiente comportamiento con controles del servidor:

- Los intentos fallidos consecutivos sobre una cuenta identificable se cuentan de forma persistente.
- Los tres primeros fallos no bloquean la cuenta.
- El **cuarto fallo bloquea el inicio de sesión**.
- Un acceso correcto antes del cuarto fallo reinicia el contador.
- Recargar la página, cerrar el navegador o usar otro dispositivo no elimina el bloqueo.
- El contador y el bloqueo deben funcionar correctamente ante peticiones simultáneas.
- Una cuenta bloqueada no puede acceder aunque después introduzca la contraseña correcta.

Para un nombre de usuario inexistente, aplica límites de intentos y protección contra abuso sin revelar si existe una cuenta. No atribuyas el fallo a otro estudiante ni bloquees cuentas por semejanza de nombres. Documenta esta distinción: un usuario incorrecto no permite saber automáticamente qué cuenta pretendía usar la persona.

El flujo obligatorio para una cuenta bloqueada es:

**Cuenta bloqueada → solicitud de recuperación → verificación de identidad → contraseña restablecida → pendiente de habilitación administrativa → administrador habilita → acceso permitido.**

Condiciones:

- Restablecer la contraseña no desbloquea automáticamente.
- El administrador no puede completar este desbloqueo antes de que exista un restablecimiento válido posterior al bloqueo.
- El estudiante debe recibir una explicación clara del siguiente paso.
- Los enlaces o códigos de recuperación deben ser temporales y de un solo uso.
- Al cambiar la contraseña, invalida las sesiones y los enlaces de recuperación que corresponda.
- Registra fechas, acciones y responsable de la habilitación sin guardar contraseñas ni códigos secretos en los registros.
- Distingue bloqueo por intentos, cuenta pendiente de aprobación y desactivación administrativa.
- Prevé la recuperación segura del administrador para evitar dejar el sistema sin administración.

No simules un correo enviado si no existe un servicio configurado. Si usas un mecanismo de desarrollo para probar la recuperación, identifícalo y limita su disponibilidad a ese entorno.

**6. Seguridad y mensajes ante errores**

Implementa medidas proporcionales a una aplicación académica:

- Contraseñas almacenadas mediante un mecanismo de hash apropiado.
- Validación de entradas tanto en la interfaz como en el servidor.
- Consultas seguras y protección frente a inyección y contenido malicioso.
- Protección de sesiones, cierre de sesión efectivo y caducidad.
- Protección frente a solicitudes falsificadas cuando corresponda al sistema de sesiones.
- Límites de peticiones en acceso y recuperación.
- Autorización por rol y por registro.
- Secretos fuera del código, del navegador y del repositorio.
- Registro de acciones sensibles sin exponer información innecesaria.
- Prevención de operaciones duplicadas por doble clic o reintentos.

Los errores deben explicar brevemente qué ocurrió y cómo continuar. Conserva los datos válidos del formulario cuando sea posible y señala el campo afectado.

Incluye estados de carga, guardado, éxito, error, ausencia de datos, sesión vencida y acceso denegado. No muestres trazas internas ni detalles de la base de datos al usuario.

Usa mensajes de autenticación que no permitan descubrir cuentas existentes. Reserva la información detallada para los canales y usuarios autorizados.

**7. Notas, cortes, promedios, PAPA, PAPI y créditos**

Implementa cálculos reales y comprobables para:

- Evaluaciones y promedio de cada corte dentro de una materia.
- Nota definitiva de cada materia.
- Promedio general por corte, cuando las reglas académicas lo definan.
- Promedio del periodo académico.
- PAPA y PAPI.
- Créditos inscritos, cursados, aprobados y pendientes.
- Créditos usados en las ponderaciones y la suma de nota × créditos.

Antes de implementar PAPA y PAPI, verifica sus definiciones en la documentación del proyecto y en fuentes oficiales de la institución aplicable. El prototipo menciona UTS: **no asumas que las reglas de otra universidad son equivalentes**.

Documenta qué asignaturas e intentos entran en cada cálculo y cómo se tratan materias repetidas, reprobadas, canceladas, homologadas y sin nota definitiva. Si falta una regla institucional imprescindible, señálala y solicita el dato concreto mientras avanzas en los demás módulos. No presentes una fórmula inventada como oficial.

Para cualquier promedio ponderado aplicable, muestra la operación y los datos incluidos: suma de nota × peso dividida entre suma de pesos. Distingue los pesos de evaluaciones, cortes y créditos.

Requisitos:

- Los créditos de las asignaturas deben ser **enteros positivos**, nunca decimales.
- No confundas créditos con puntos ponderados: nota × créditos puede producir decimales.
- La interfaz debe explicar qué significa “créditos ponderados cursados” y qué cantidad muestra.
- Valida la escala de notas y los porcentajes.
- Los pesos deben sumar el total requerido antes de cerrar una configuración.
- Una nota pendiente no debe convertirse silenciosamente en cero.
- Distingue promedio provisional de resultado definitivo.
- Evita divisiones entre cero.
- Conserva precisión en los cálculos y aplica el redondeo conforme a la regla documentada.
- Recalcula todos los resultados relacionados al guardar una nota.
- Las simulaciones del estudiante deben identificarse como estimaciones y no modificar calificaciones oficiales.

Incluye ejemplos con resultados esperados para comprobar las fórmulas.

**8. Matrícula y comparación de horarios**

Antes de confirmar una materia, permite ver:

- Nombre, código, créditos enteros, grupo y docente.
- Días, horas de inicio y fin, aula o modalidad.
- Cupos, requisitos y restricciones existentes.
- Todas las sesiones asociadas a ese grupo.

Muestra el horario candidato junto al horario ya inscrito en una vista semanal y una alternativa textual accesible.

Detecta choques entre las materias nuevas y las inscritas, incluyendo varias sesiones por materia. Identifica exactamente las asignaturas, el día y el intervalo en conflicto. No dependas únicamente del color para explicarlo.

Impide confirmar una matrícula con conflicto. Ofrece otros grupos cuando existan. Dos clases consecutivas que solo comparten la hora de fin e inicio no deben contarse como superpuestas, salvo una regla institucional documentada.

Valida también en el servidor al confirmar. Evita duplicados y conflictos ante solicitudes simultáneas. Si existen cupos, compruébalos en esa misma operación.

Después de matricular, actualiza de forma consistente horario, materias, créditos y resumen académico. Permite consultar y exportar el horario con la funcionalidad real disponible.

**9. Diseño creativo en cada página e instancia**

La temática central de toda la aplicación es **el crucigrama**. El profesor evaluará los detalles, la originalidad y el funcionamiento completo. Quiero una identidad memorable en cada pantalla, sin sacrificar claridad ni legibilidad.

Trabaja con casillas, pistas, palabras cruzadas, numeración, tinta, papel, lápices y conexiones entre conceptos. Cada módulo debe tener una composición propia dentro de un sistema visual coherente.

Aplica el diseño a:

- Acceso y recuperación de contraseña.
- Cuenta bloqueada y pendiente de aprobación o habilitación.
- Tableros de los tres roles.
- Pensum, catálogo, detalle de materia, grupos y matrícula.
- Horario, calendario y agenda.
- Notas, cortes, promedios, créditos e historial.
- Asistencia y herramientas del docente.
- Usuarios, configuración y auditoría administrativa.
- Perfil, menús, pestañas, filtros, formularios y modales.
- Confirmaciones, avisos, errores, pantallas vacías y páginas de acceso denegado o no encontrado.

Cada botón debe tener intención visual, una etiqueta clara y estados de interacción completos. Evita controles decorativos que aparenten funcionar.

Usa una tipografía llamativa y legible para títulos y una tipografía cómoda para contenido y datos. Como referencia, utiliza texto principal cercano a 16 px y ajusta la escala según el espacio. No hagas toda la interfaz enorme ni excesivamente comprimida.

Cuida especialmente:

- Ortografía, tildes y consistencia de términos.
- Alineación, jerarquía, espaciado y posición de botones.
- Textos largos, tablas, cifras y etiquetas.
- Contraste, foco de teclado y áreas cómodas para pulsar.
- Adaptación a móvil, tableta y escritorio.
- Ausencia de elementos cortados, superpuestos o fuera de pantalla.
- Zoom, navegación por teclado y movimiento reducido.

La creatividad debe estar en la composición y los detalles, sin hacer que el usuario tenga que adivinar cómo utilizar la aplicación.

**10. Modo día, modo noche y barra de pistas**

Implementa modo claro y oscuro, con selector visible y preferencia persistente. Usa la preferencia del sistema como valor inicial cuando no haya una elección guardada.

El modo oscuro debe resultar cómodo para estudiar de noche. El modo claro debe ser legible durante el día. Revisa todos los componentes, gráficos, formularios, avisos y estados en ambos modos.

Incluye una **barra de pistas contextual**, pequeña y discreta, que explique en una frase breve el elemento seleccionado, enfocado o señalado.

Ejemplos:

- “Inscripción: elige materias y comprueba cruces de horario.”
- “Promedio del corte: resultado según las evaluaciones y sus porcentajes.”
- “Habilitar cuenta: disponible después de completar el restablecimiento.”

Debe funcionar con ratón, teclado y pantalla táctil. No debe cubrir botones, desplazar continuamente el contenido ni ser el único lugar que explique una acción importante.

**11. Cursor creativo y transformación mediante un triángulo**

Implementa un cursor inicial con forma de **pincel de tinta**, coherente con la estética de casillas y escritura del crucigrama.

Al dibujar un triángulo mediante un gesto deliberado en una zona libre, debe transformarse en un **lápiz de crucigrama**. Al repetir el gesto, debe volver al pincel.

Requisitos:

- Reconocer el gesto con tolerancia razonable a la imperfección.
- Realizar una sola transformación por triángulo.
- Añadir una transición breve y una confirmación discreta.
- Mantener preciso el punto de clic.
- No interceptar botones, campos, selección de texto, desplazamiento ni arrastres funcionales.
- No dejar trazos permanentes que tapen la interfaz.
- Evitar transformaciones accidentales durante el uso normal.
- Permitir activar o desactivar el efecto.
- Ofrecer un control accesible alternativo para cambiar de herramienta.
- Respetar movimiento reducido y utilizar un comportamiento apropiado en dispositivos táctiles.
- Evitar retrasos o consumo excesivo de recursos.

La personalización del cursor no debe impedir completar ninguna tarea.

**12. Pruebas y criterios de aceptación**

Mantén una tabla que relacione requisito, implementación, prueba y resultado. Distingue entre código escrito, comportamiento revisado y comportamiento comprobado por ejecución.

Prueba como mínimo:

- Acceso y cierre de sesión de los tres roles.
- Prohibición de rutas y datos de otros usuarios.
- Bloqueo exactamente al cuarto fallo.
- Persistencia del bloqueo entre recargas y sesiones.
- Tratamiento de usuarios inexistentes sin revelar cuentas.
- Recuperación con enlace o código válido, vencido y reutilizado.
- Imposibilidad de desbloquear antes del restablecimiento.
- Restablecimiento sin desbloqueo automático.
- Habilitación administrativa y acceso posterior.
- Cambios de notas visibles desde otra sesión autorizada.
- Cálculos de cortes, materias, promedios, PAPA y PAPI según las reglas documentadas.
- Créditos enteros y manejo de notas pendientes.
- Matrícula válida, choque de horarios, clases consecutivas y cambio de grupo.
- Prevención de duplicados y operaciones simultáneas relevantes.
- Persistencia después de reiniciar la aplicación.
- Modos claro y oscuro, teclado, móvil y movimiento reducido.
- Barra de pistas y transformación del cursor.
- Formularios, modales, errores y navegación completa.

Comprueba el funcionamiento real con servidor y persistencia; no sustituyas toda la verificación por datos simulados.

Revisa visualmente las pantallas en tamaños representativos de móvil, tableta y escritorio, incluyendo textos largos y zoom. Corrige los problemas encontrados y vuelve a probar los recorridos afectados.

El objetivo es una entrega sin defectos conocidos en los recorridos principales. No declares “cero errores” ni “todo funciona” sin evidencia suficiente.

**13. GitHub, documentación y continuidad**

Desde el principio, conserva el estado original y publica avances recuperables. No borres capturas, grabaciones, documentación ni respaldos anteriores; organiza las nuevas versiones claramente.

Entrega y mantén actualizados:

- Código completo y archivos necesarios para ejecutarlo.
- `README.md`: instalación, ejecución, arquitectura general y acceso de demostración cuando corresponda.
- `VERIFICACION.md`: pruebas ejecutadas, resultados y limitaciones pendientes.
- `ARQUITECTURA.md`: módulos y división de responsabilidades.
- `REGLAS_NEGOCIO.md`: roles, estados, recuperación, matrícula y fórmulas.
- `CONTINUIDAD.md`: estado actual y pasos concretos para retomar.
- Configuración de ejemplo sin secretos y preparación de datos de prueba.
- Capturas reales del resultado.
- Grabación real de los recorridos principales.
- Respaldo de la versión anterior.

`CONTINUIDAD.md` debe permitir que otro chat continúe sin leer esta conversación. Incluye:

- Objetivo del proyecto.
- Rama y último commit relevante verificado.
- Funciones terminadas, probadas y pendientes.
- Ubicación de los módulos principales.
- Decisiones y suposiciones.
- Servicios y configuración necesarios, sin credenciales secretas.
- Problemas conocidos y pasos para reproducirlos.
- Próximas tareas ordenadas por prioridad.
- Instrucciones para ejecutar las pruebas.
- Un prompt breve de continuación.

Si puedes consultar el consumo real de créditos, úsalo para reservar margen de cierre. Si no puedes, dilo y trabaja mediante puntos de guardado frecuentes. **No esperes a detectar el agotamiento para respaldar**, porque puede ocurrir de forma abrupta.

Cuando el presupuesto se acerque al límite, termina el bloque coherente en curso, guarda el trabajo, actualiza la continuidad y verifica la publicación remota. Si quedan cambios incompletos, consérvalos identificados en una rama adecuada sin sustituir una versión estable por otra que no funciona.

No prometas continuar automáticamente en un chat sin créditos ni eludir límites de la plataforma. La continuidad debe depender de los archivos y del historial guardados en GitHub.

**14. Entrega final**

Al terminar, comunica de forma breve y comprobable:

- Qué quedó implementado.
- Qué pruebas se ejecutaron y sus resultados.
- Qué sigue pendiente, si existe algo.
- El enlace exacto del repositorio, la rama y el commit publicado.
- El enlace de la aplicación, únicamente si el despliegue está operativo y verificado.
- La ubicación de capturas, grabación, respaldo y documento de continuidad.

Verifica el contenido remoto después de publicar. No confundas un archivo local, un commit local o un intento de subida con una publicación completada.

Comienza inspeccionando el proyecto y verificando el acceso a GitHub. Continúa con la implementación, las pruebas y la entrega, conservando el trabajo existente y evitando pedirme comandos de PowerShell o pasos manuales que puedas realizar tú.