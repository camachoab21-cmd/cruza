# Prompt para continuar la auditoría de CRUZA

Trabaja sobre la copia local `outputs/CRUZA-EXPO-24NOV`, conserva los datos y lee `AUDITORIA-EXPOSICION.md`. No reemplaces esta copia con la rama principal: deriva del PR #11 y contiene correcciones locales posteriores. Haz una copia antes de editar.

1. Reproduce y diagnostica el desbordamiento horizontal al cambiar de escritorio a 390 px después de pasar el cursor sobre el horario. Comprueba las capas y pseudoelementos; no lo ocultes con un recorte global. Crea una prueba que falle antes y pase después.
2. Haz que los bloques del horario confirmado abran una ficha accesible con nombre, grupo, docente, aula y todas las sesiones usando los datos reales de la API. Permite abrirla con teclado y cerrar con Escape, sin interrumpir la matrícula ni la vista previa. Prueba ambos temas y móvil.
3. Revisa el comportamiento real de cierre de procesos de los tests en Windows y evita que las bases temporales queden bloqueadas. No mates servidores que no pertenezcan a la prueba ni borres datos existentes.
4. Recorre cada pantalla como usuario, incluyendo mensajes de error, vacíos, ortografía, tildes y concordancia. Revisa contraste real, tamaños de texto y recortes en claro y oscuro. Mejora con sobriedad las tarjetas de matrícula móvil, manteniendo legibilidad y accesibilidad; conserva los colores y el lenguaje de crucigrama.
5. Ejecuta las pruebas existentes y las nuevas con una base de datos aislada; registra los resultados completos, errores y limitaciones. Revisa capturas reales de escritorio y móvil y comprueba movimiento reducido. No declares aprobada una prueba que termine con error.
6. Entrega archivos locales actualizados, copia de seguridad, instrucciones de apertura y un informe honesto. Consulta el estado de GitHub y no publiques ni integres cambios sin verificar la rama y los cambios concurrentes.
